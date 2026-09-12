import { getCjProductDetail } from "@/lib/cj";
import { readProducts, upsertProduct } from "@/lib/products-db";
import { calculateFreight } from "@/lib/cj";
import { readStoreSettings } from "@/lib/settings-db";
import { notifyOwner } from "./alert";

function num(v: unknown, fallback = 0) {
  const n = typeof v === "string" ? parseFloat(v) : Number(v);
  return Number.isFinite(n) ? n : fallback;
}

/**
 * Sync de stock/costo/freight por país para productos importados de CJ.
 * Corre en cron off-peak (00:30 MX). Respeto QPS ~1s.
 */
export async function runCjSync(): Promise<{
  checked: number;
  updated: number;
  errors: number;
  details: Array<{ id: string; note: string }>;
}> {
  const s = await readStoreSettings();
  
  // KILL-SWITCH: si pauseSyncCj está activo, salir silenciosamente
  if (s.pauseSyncCj) {
    return { checked: 0, updated: 0, errors: 0, details: [] };
  }

  const products = await readProducts();
  const withCj = products.filter((p) => p.cjProductId && p.cjVariantId);
  let updated = 0;
  let errors = 0;
  const details: Array<{ id: string; note: string }> = [];

  for (const p of withCj) {
    try {
      const detail = await getCjProductDetail(p.cjProductId!);
      const variant = (detail.variants || []).find(
        (v) => v.vid === p.cjVariantId
      );
      if (!variant) {
        errors++;
        details.push({ id: p.id, note: "variante no encontrada en CJ" });
        continue;
      }

      const costUsd = num(
        variant.variantSellPrice ?? variant.variantPrice,
        p.costUsd
      );
      const stock = num(variant.variantStock, p.stock);

      // freight real por país (2 llamadas por producto)
      const [mx, us] = await Promise.all([
        calculateFreight({
          endCountryCode: "MX",
          products: [{ vid: variant.vid, quantity: 1 }],
        }).catch(() => [] as Awaited<ReturnType<typeof calculateFreight>>),
        calculateFreight({
          endCountryCode: "US",
          products: [{ vid: variant.vid, quantity: 1 }],
        }).catch(() => [] as Awaited<ReturnType<typeof calculateFreight>>),
      ]);

      const pickCheapest = (opts: Array<{ logisticPrice?: number | string }>) =>
        opts.length
          ? Math.min(
              ...opts.map((o) => num(o.logisticPrice, 999))
            )
          : undefined;

      const shipMx = pickCheapest(mx);
      const shipUs = pickCheapest(us);

      const next = {
        ...p,
        costUsd,
        stock,
        active: stock > 0 ? p.active : false,
        shippingMxUsd: shipMx ?? p.shippingMxUsd,
        shippingUsUsd: shipUs ?? p.shippingUsUsd,
      };

      if (
        next.costUsd !== p.costUsd ||
        next.stock !== p.stock ||
        next.shippingMxUsd !== p.shippingMxUsd ||
        next.shippingUsUsd !== p.shippingUsUsd ||
        next.active !== p.active
      ) {
        await upsertProduct(next);
        updated++;
        details.push({
          id: p.id,
          note: `cost $${next.costUsd} stock ${next.stock} shipMX $${next.shippingMxUsd} shipUS $${next.shippingUsUsd}${!next.active ? " → INACTIVO" : ""}`,
        });
      }
    } catch (err) {
      errors++;
      details.push({
        id: p.id,
        note: `error: ${err instanceof Error ? err.message : "unknown"}`,
      });
    }
  }

  if (errors > 0) {
    await notifyOwner(
      "cj_sync_errors",
      `Sync CJ: ${errors} errores de ${withCj.length} productos.`,
      "warn"
    );
  }

  return { checked: withCj.length, updated, errors, details };
}
