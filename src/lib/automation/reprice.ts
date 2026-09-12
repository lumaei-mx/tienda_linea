import { readProducts, upsertProduct } from "@/lib/products-db";
import { readStoreSettings } from "@/lib/settings-db";
import type { Market, Product } from "@/lib/types";
import { notifyOwner } from "./alert";

/**
 * Repricing automático del precio de venta USD.
 * Modelo cobro único de envío: el precio NO incluye envío (se cobra aparte
 * en checkout). Por eso:
 *   Base = costUsd × markup (estratégico, sin inflar con flete).
 *   Piso = costUsd / (1 − fee − comisión afiliado − margen mínimo).
 * La rentabilidad total (precio + envío checkout − landed − fees) se evalúa
 * con el envío flat esperado a 1ud. No toca productos con manualPriceUsd
 * ni sin costo/stock. Corre en cron y puede dispararse a mano.
 */
export async function runReprice(): Promise<{
  checked: number;
  repriced: number;
  stopped: number;
  details: Array<{ id: string; note: string }>;
}> {
  const s = await readStoreSettings();
  
  // KILL-SWITCH: si pauseReprice está activo, salir silenciosamente
  if (s.pauseReprice) {
    return { checked: 0, repriced: 0, stopped: 0, details: [] };
  }
  
  const markup = s.markup ?? 2.6;
  const minMargin = s.minMarginPct ?? 12;
  const feeRate = s.paymentFeeRate ?? 0.036;
  const inflPct = (s.influencerCommissionPct ?? 15) / 100;
  const products = await readProducts();
  let repriced = 0;
  let stopped = 0;
  const details: Array<{ id: string; note: string }> = [];

  // Envío que el cliente paga aparte en checkout (1ud). Solo para evaluar
  // margen total, nunca se suma al precio.
  const shipExpected = Math.max(
    s.shippingFlatMxUsd ?? 9.99,
    s.shippingFlatUsd ?? 9.99
  );

  for (const p of products) {
    if (!p.costUsd || p.costUsd <= 0) continue;

    // Piso que cubre COSTO producto + fee + comisión afiliado + margen mínimo.
    // El flete real se cubre con el envío cobrado en checkout, no con el precio.
    const reserved = feeRate + inflPct + minMargin / 100;
    const floor =
      reserved >= 0.95
        ? Number((p.costUsd * 3).toFixed(2))
        : Number((p.costUsd / (1 - reserved)).toFixed(2));
    const formulaTarget = Number(
      Math.max(p.costUsd * markup, floor).toFixed(2)
    );

    // Respetar precio manual fijado en admin.
    const target =
      typeof p.manualPriceUsd === "number" && p.manualPriceUsd > 0
        ? Number(p.manualPriceUsd.toFixed(2))
        : formulaTarget;

    const next: Product = { ...p };

    if (target >= 0.5 && target !== p.priceUsd) {
      next.priceUsd = target;
    }

    // Margen neto TOTAL (precio + envío checkout − landed − fees − comisión).
    // Cobro único: el envío no va en el precio, se evalúa aparte.
    const netMx = netMarginPct(next, "MX", next.priceUsd, feeRate, inflPct, s.shippingFlatMxUsd ?? 9.99);
    const netUs = netMarginPct(next, "US", next.priceUsd, feeRate, inflPct, s.shippingFlatUsd ?? 9.99);
    const worst = Math.min(netMx, netUs);

    if (worst < minMargin) {
      // Si el precio es manual y no alcanza, no desactivar en silencio:
      // subir al piso salvo que sea manual (entonces desactivar).
      if (typeof p.manualPriceUsd === "number" && p.manualPriceUsd > 0) {
        if (next.active) {
          next.active = false;
          stopped++;
          details.push({
            id: p.id,
            note: `INACTIVO manual bajo piso (neto MX ${netMx.toFixed(1)}% / US ${netUs.toFixed(1)}% < ${minMargin}%)`,
          });
        }
        await upsertProduct(next);
        continue;
      }
      // Forzar al piso y re-evaluar.
      next.priceUsd = floor;
      const netMx2 = netMarginPct(next, "MX", next.priceUsd, feeRate, inflPct, s.shippingFlatMxUsd ?? 9.99);
      const netUs2 = netMarginPct(next, "US", next.priceUsd, feeRate, inflPct, s.shippingFlatUsd ?? 9.99);
      if (Math.min(netMx2, netUs2) < minMargin) {
        if (next.active) {
          next.active = false;
          stopped++;
          details.push({
            id: p.id,
            note: `INACTIVO (neto MX ${netMx2.toFixed(1)}% / US ${netUs2.toFixed(1)}% < ${minMargin}%)`,
          });
        }
        await upsertProduct(next);
        continue;
      }
    }

    // Reactivar si estaba inactivo y ahora sí da margen.
    if (!next.active && worst >= minMargin) {
      next.active = true;
      details.push({
        id: p.id,
        note: `REACTIVADO USD $${next.priceUsd} (neto ${worst.toFixed(1)}%)`,
      });
    }

    if (
      next.priceUsd !== p.priceUsd ||
      next.active !== p.active
    ) {
      await upsertProduct(next);
      if (next.priceUsd !== p.priceUsd) {
        repriced++;
        details.push({
          id: p.id,
          note: `USD $${p.priceUsd} → $${next.priceUsd} (neto total MX ${netMarginPct(next, "MX", next.priceUsd, feeRate, inflPct, s.shippingFlatMxUsd ?? 9.99).toFixed(1)}% / US ${netMarginPct(next, "US", next.priceUsd, feeRate, inflPct, s.shippingFlatUsd ?? 9.99).toFixed(1)}%)`,
        });
      }
    }
  }

  if (stopped > 0) {
    await notifyOwner(
      "reprice_stopped",
      `Reprice: ${stopped} productos desactivados por margen neto bajo (< ${minMargin}%).`,
      "warn"
    );
  }

  return { checked: products.length, repriced, stopped, details };
}

/**
 * Margen neto TOTAL % con cobro único de envío.
 * income = precio + envío cobrado en checkout (1ud).
 * profit = income − landed − fee×income − comisión×precio.
 */
function netMarginPct(
  p: Product,
  market: Market,
  price: number,
  feeRate: number,
  inflPct: number,
  shipCheckout: number
) {
  const income = price + (shipCheckout || 0);
  if (income <= 0) return 0;
  const shipReal = market === "MX" ? p.shippingMxUsd : p.shippingUsUsd;
  const landed = p.costUsd + (shipReal || 0);
  const fee = income * feeRate;
  const commission = price * inflPct;
  const profit = income - landed - fee - commission;
  return (profit / income) * 100;
}
