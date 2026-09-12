import { searchCjProducts, getCjProductDetail, pickVariant } from "@/lib/cj/products";
import { calculateFreight, pickCheapest } from "@/lib/cj/orders";
import { readStoreSettings } from "@/lib/settings-db";
import {
  listOpportunities,
  upsertOpportunity,
} from "@/lib/opportunity-db";
import { notifyOwner } from "./alert";

/**
 * Cazador de oportunidades en CJ Dropshipping.
 *
 * Recorre keywords objetivo en el catálogo real de CJ buscando productos
 * baratos con buen margen. Para cada candidato:
 *   landedUs  = costUsd  + freight real CJ → US
 *   landedMx  = costUsd  + freight real CJ → MX
 *   priceUsd  = costUsd × markup  (precio de venta sugerido, SIN envío)
 *   El envío se cobra UNA sola vez en checkout (flat 9.99 / gratis según
 *   promo). El precio NO embebe envío para permitir pricing estratégico.
 *   profit total 1ud = (priceUsd + shipCheckout) − landed − fee×(price+ship)
 *   marginPct = profit total / (priceUsd + shipCheckout)
 *
 * Guarda oportunidades rankeadas (score) en Redis para aprobación en admin.
 * Corre en cron (diario). Respeta QPS de CJ (~1 req/s).
 */

const DEFAULT_KEYWORDS = [
  "home organizer",
  "kitchen gadget",
  "car accessory",
  "phone stand",
  "pet grooming",
  "beauty tool",
  "storage box",
  "desk organizer",
  "travel gadget",
  "led light",
  "portable fan",
  "water bottle",
];

export async function runHunter(opts?: {
  maxPrice?: number;
  keywords?: string[];
  minProfit?: number;
  minMarginPct?: number;
  maxCandidates?: number;
  onlyNew?: boolean;
}): Promise<{
  scanned: number;
  opportunities: number;
  new: number;
  top: Array<{ pid: string; name: string; priceUsd: number; profitUsd: number; marginPct: number }>;
}> {
  const s = await readStoreSettings();
  
  // KILL-SWITCH: si pauseHunter está activo, salir silenciosamente
  if (s.pauseHunter) {
    return { scanned: 0, opportunities: 0, new: 0, top: [] };
  }
  
  const feeRate = s.paymentFeeRate ?? 0.036;
  // Envío que el cliente paga UNA vez en checkout (1ud, sin promo).
  // Se usa solo para evaluar rentabilidad total, no se suma al precio.
  const shipExpected = Math.max(
    s.shippingFlatMxUsd ?? 9.99,
    s.shippingFlatUsd ?? 9.99
  );
  const maxPrice = opts?.maxPrice ?? 5;
  const minProfit = opts?.minProfit ?? 3;
  // 30% total (precio+envío) equivale al guardrail sano >25% en docs.
  // Antes era 45% porque el precio embebía envío ×2.6; con cobro único
  // el margen total baja pero el precio al cliente es mucho más competitivo.
  const minMarginPct = opts?.minMarginPct ?? 30;
  const maxCandidates = opts?.maxCandidates ?? 30;
  const keywords = opts?.keywords ?? DEFAULT_KEYWORDS;

  const seen = new Map<string, { id: string; name: string; image?: string; priceUsd: number; stock: number; category?: string; sku?: string }>();

  // 1) recolectar candidatos baratos
  for (const kw of keywords) {
    try {
      const { items } = await searchCjProducts({
        keyword: kw,
        size: 10,
        maxPrice,
      });
      for (const it of items) {
        if (!seen.has(it.id) && it.priceUsd > 0 && it.stock > 0) {
          seen.set(it.id, it);
        }
      }
    } catch {
      // sigue con la siguiente keyword
    }
  }

  let scanned = 0;

  const candidates = [...seen.values()]
    .sort((a, b) => a.priceUsd - b.priceUsd)
    .slice(0, maxCandidates);

  const existing = await listOpportunities();
  const existingStatus = new Map(
    existing.map((o) => [o.pid, o.status] as const)
  );

  const markupDefault = 2.6;
  // ---- fase 1: filtro rápido con markup base (sin búsquedas externas) ----
  const viable: Array<{
    c: typeof candidates[number];
    detail: Awaited<ReturnType<typeof getCjProductDetail>>;
    costUsd: number;
    landedMx: number;
    landedUs: number;
    priceBase: number;
    profit: number;
    margin: number;
    variantSku?: string;
  }> = [];

  for (const c of candidates) {
    scanned++;
    if (opts?.onlyNew && existingStatus.get(c.id) === "approved") continue;
    if (existingStatus.get(c.id) === "imported") continue;
    try {
      const detail = await getCjProductDetail(c.id);
      // variante REAL del producto: filtra accesorios/repuestos/samples
      // (antes tomaba variants[0] = el más barato del array, a veces $0.27)
      const variant = pickVariant(detail.variants, detail) ?? (detail.variants || [])[0];
      const costUsd = Number(
        variant?.variantSellPrice ?? variant?.variantPrice ?? c.priceUsd
      );
      const [mx, us] = await Promise.all([
        calculateFreight({
          endCountryCode: "MX",
          products: [{ vid: variant?.vid || c.id, quantity: 1 }],
        }).catch(() => [] as Awaited<ReturnType<typeof calculateFreight>>),
        calculateFreight({
          endCountryCode: "US",
          products: [{ vid: variant?.vid || c.id, quantity: 1 }],
        }).catch(() => [] as Awaited<ReturnType<typeof calculateFreight>>),
      ]);
      const shippingMxUsd = pickCheapest(mx)?.logisticPrice ?? 5;
      const shippingUsUsd = pickCheapest(us)?.logisticPrice ?? 5;
      const landedMx = costUsd + shippingMxUsd;
      const landedUs = costUsd + shippingUsUsd;
      // Precio estratégico: solo costo × markup, SIN envío embebido.
      const priceBase = Number((costUsd * markupDefault).toFixed(2));
      // Rentabilidad total 1ud con cobro único de envío en checkout.
      const landedWorst = Math.max(landedMx, landedUs);
      const incomeTotal = priceBase + shipExpected;
      const profit = Number(
        (incomeTotal - landedWorst - incomeTotal * feeRate).toFixed(2)
      );
      const margin = incomeTotal > 0 ? (profit / incomeTotal) * 100 : 0;
      // filtro base: al menos ganancia mínima con markup estándar
      if (profit >= minProfit && margin >= minMarginPct) {
        viable.push({
          c,
          detail,
          costUsd: Number(costUsd.toFixed(2)),
          landedMx: Number(landedMx.toFixed(2)),
          landedUs: Number((landedUs).toFixed(2)),
          priceBase,
          profit,
          margin,
          variantSku: variant?.variantSku || c.sku,
        });
      }
    } catch {
      // ignore
    }
  }

  let opportunities = 0;
  let isNew = 0;
  const top: Array<{ pid: string; name: string; priceUsd: number; profitUsd: number; marginPct: number }> = [];

  for (const v of viable.sort((a, b) => b.profit - a.profit)) {
    const isNewOpp = !existingStatus.has(v.c.id);
    const score = Number(
      (v.profit * 2 + v.margin / 5 + Math.min(v.c.stock, 500) / 100).toFixed(2)
    );

    await upsertOpportunity({
      pid: v.c.id,
      name: v.detail.productNameEn || v.c.name,
      image: v.detail.productImage || v.c.image,
      category: v.detail.categoryName || v.c.category,
      costUsd: v.costUsd,
      shippingMxUsd: Number((v.landedMx - v.costUsd).toFixed(2)),
      shippingUsUsd: Number((v.landedUs - v.costUsd).toFixed(2)),
      landedMx: v.landedMx,
      landedUs: v.landedUs,
      suggestedPriceUsd: v.priceBase,
      profitUsd: v.profit,
      marginPct: Number(v.margin.toFixed(1)),
      trendScore: 0,
      stock: v.c.stock,
      score,
      status: "new",
      sku: v.variantSku || v.c.sku,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    if (isNewOpp) isNew++;
    opportunities++;
    top.push({
      pid: v.c.id,
      name: v.c.name,
      priceUsd: v.priceBase,
      profitUsd: v.profit,
      marginPct: Number(v.margin.toFixed(1)),
    });
  }

  top.sort((a, b) => b.profitUsd - a.profitUsd);

  if (top.length > 0) {
    await notifyOwner(
      "hunter_opportunities",
      `Hunter CJ: ${top.length} oportunidades nuevas (${isNew} nunca vistas). Top: ${top
        .slice(0, 5)
        .map((t) => `${t.name.slice(0, 24)} → $${t.profitUsd} profit @ ${t.priceUsd}`)
        .join(" · ")}`,
      "info"
    );
  }

  return { scanned, opportunities, new: isNew, top: top.slice(0, 10) };
}
