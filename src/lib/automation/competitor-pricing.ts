import type { Product } from "@/lib/types";
import { readStoreSettings } from "@/lib/settings-db";


export interface CompetitorPrice {
  source: "cj" | "amazon" | "mercadolibre";
  priceUsd: number;
  currency: string;
  url?: string;
}

function num(v: unknown, fallback = 0) {
  const n = typeof v === "string" ? parseFloat(v) : Number(v);
  return Number.isFinite(n) ? n : fallback;
}

/**
 * Busca precios de competencia similares.
 * Estrategia: normalizar el nombre (quitar marcas, stop-words) y buscar
 * por keyword en CJ (API propia) + Amazon + ML (públicas).
 * Devuelve el mejor precio con su fuente/url.
 */
export async function fetchCompetitorPrices(
  product: Product,
  signal?: AbortSignal
): Promise<CompetitorPrice[]> {
  const keyword = buildKeyword(product.name);
  const results: CompetitorPrice[] = [];

  const timeout = (fn: () => Promise<CompetitorPrice | null>) =>
    Promise.race([
      fn(),
      new Promise<null>((r) => setTimeout(r, 6000)),
    ]).catch(() => null);

  const cj = await timeout(() => fetchCjCompetitor(keyword, product.cjSku, signal));
  if (cj) results.push(cj);

  const ml = await timeout(() => fetchMercadoLibreProduct(keyword, signal));
  if (ml) results.push(ml);

  const amz = await timeout(() => fetchAmazonProduct(keyword, signal));
  if (amz) results.push(amz);

  return results.filter(Boolean) as CompetitorPrice[];
}

function buildKeyword(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(
      /\b(un|una|para|con|del|de|la|el|los|las|y|o|en|por|modelo|marca|precio|venta|envio|gratuito|gratis)\b/g,
      ""
    )
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 60);
}

/** ---------- CJ ---------- */
async function fetchCjCompetitor(
  keyword: string,
  sku?: string,
  signal?: AbortSignal
): Promise<CompetitorPrice | null> {
  try {
    const params = new URLSearchParams({
      keyWord: keyword,
      page: "1",
      size: "12",
      startWarehouseInventory: "1",
      orderBy: "1",
      sort: "desc",
    });
    const base = process.env.CJ_API_BASE || "https://developers.cjdropshipping.com/api2.0/v1";
    const token = process.env.CJ_ACCESS_TOKEN;
    if (!token) return null;
    const res = await fetch(`${base}/product/listV2?${params}`, {
      method: "GET",
      headers: {
        "CJ-Access-Token": token,
        Accept: "application/json",
      },
      signal,
    });
    if (!res.ok) return null;
    const raw = (await res.text()).replace(/^\)\]\}',?\s*/, "");
    const data = JSON.parse(raw);
    const list =
      data?.content?.flatMap((c: unknown) =>
        (c as { productList?: unknown[] })?.productList || []
      ) || [];
    // Preferir el mismo SKU, o el más barato con stock
    const withSku = list.find(
      (p: { sku?: string; spu?: string }) => p.sku === sku || p.spu === sku
    );
    const pool = withSku ? [withSku] : list;
    if (!pool.length) return null;
    const cheapest = [...pool].sort(
      (a: { discountPrice?: string; nowPrice?: string; sellPrice?: string },
        b: { discountPrice?: string; nowPrice?: string; sellPrice?: string }) =>
        num(a.discountPrice ?? a.nowPrice ?? a.sellPrice) -
        num(b.discountPrice ?? b.nowPrice ?? b.sellPrice)
    )[0];
    const price = num(cheapest.discountPrice ?? cheapest.nowPrice ?? cheapest.sellPrice);
    if (!price || price <= 0) return null;
    const pid = cheapest?.id || cheapest?.pid;
    const url = pid
      ? `https://www.cjdropshipping.com/product/${pid}.html`
      : undefined;
    return { source: "cj", priceUsd: price, currency: "USD", url };
  } catch {
    return null;
  }
}

/** ---------- MercadoLibre (API pública) ---------- */
async function fetchMercadoLibreProduct(
  keyword: string,
  signal?: AbortSignal
): Promise<CompetitorPrice | null> {
  try {
    const site = "MLM"; // MX
    const search = encodeURIComponent(keyword);
    const r = await fetch(
      `https://api.mercadolibre.com/sites/${site}/search?q=${search}&limit=5&skipObjectsIds=true`,
      { headers: { "User-Agent": "Mozilla/5.0 (compatible; Lumaei)" }, signal }
    );
    if (!r.ok) return null;
    const data = await r.json();
    const results = data?.results || [];
    if (!results.length) return null;
    // Tomar el más barato con stock > 0
    const inStock = results.filter((r2: { sold_quantity?: number; price?: number }) =>
      (r2.sold_quantity ?? 0) > 0
    );
    const pool = inStock.length ? inStock : results;
    const cheapest = [...pool].sort(
      (a: { price?: number }, b: { price?: number }) =>
        (a.price ?? Infinity) - (b.price ?? Infinity)
    )[0];
    const price = num(cheapest.price);
    if (!price || price <= 0) return null;
    // Convertir: usamos el tipo de cambio público en el momento
    const usd = await convertToUsd(price, "MXN");
    if (!usd) return null;
    return {
      source: "mercadolibre",
      priceUsd: usd,
      currency: "USD",
      url: cheapest.permalink,
    };
  } catch {
    return null;
  }
}

/** ---------- Amazon (scrapeo público) ---------- */
async function fetchAmazonProduct(
  keyword: string,
  signal?: AbortSignal
): Promise<CompetitorPrice | null> {
  try {
    const search = encodeURIComponent(keyword.replace(/\s/g, "+"));
    const r = await fetch(
      `https://www.amazon.com/s?k=${search}&s=price-asc-rank`,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
        },
        signal,
      }
    );
    if (!r.ok) return null;
    const html = await r.text();
    // Extracción simple de precios: $X.XX o $XX.XX o $XXX.XX
    const matches = [...html.matchAll(/\$(\d{1,4}[.,]\d{2})/g)].slice(0, 8);
    const prices = matches
      .map((m) => num(m[1].replace(",", ".")))
      .filter((p) => p > 0);
    if (!prices.length) return null;
    const price = Math.min(...prices);
    if (!price) return null;
    const asin = extractAsin(html) || keyword;
    const url = asin
      ? `https://www.amazon.com/dp/${asin}`
      : "https://www.amazon.com";
    return { source: "amazon", priceUsd: price, currency: "USD", url };
  } catch {
    return null;
  }
}

function extractAsin(html: string): string | null {
  const m = html.match(/\/dp\/([A-Z0-9]{10})/);
  return m ? m[1] : null;
}

/** ---------- conversión ---------- */
let fxCache: { at: number; mxn: number } | null = null;
async function convertToUsd(amount: number, from: string): Promise<number | null> {
  if (from === "USD") return amount;
  if (from === "MXN") {
    if (!fxCache || Date.now() - fxCache.at > 30 * 60 * 1000) {
      try {
        const r = await fetch(
          "https://api.exchangerate-api.com/v4/latest/MXN",
          { headers: { "User-Agent": "Mozilla/5.0 (compatible; Lumaei)" } }
        );
        if (r.ok) {
          const data = await r.json();
          const usd = num(data.rates?.USD);
          if (usd > 0) fxCache = { at: Date.now(), mxn: usd };
        }
      } catch {
        // fallback
      }
    }
    const rate = fxCache?.mxn ?? 0.055;
    return Number((amount * rate).toFixed(2));
  }
  return null;
}

/**
 * Calcula el precio de venta considerando la competencia (cobro único envío).
 * Precio base = cost × markup (SIN envío; el envío se cobra en checkout).
 * - Si la competencia vende más barato que nuestro piso: NO importarlo.
 * - Si la competencia vende más caro: fijar precio ligeramente por debajo.
 * - Si no hay competencia: usar markup sobre costo.
 */
export async function computeCompetitivePrice(
  product: Product,
  landedMxUsd: number,
  landedUsUsd: number,
  signal?: AbortSignal
): Promise<{ priceUsd: number; competitor?: CompetitorPrice | null; reason: string }> {
  const s = await readStoreSettings();
  const markup = s.markup ?? 2.6;
  const minMarginPct = s.minMarginPct ?? 12;
  const inflPct = (s.influencerCommissionPct ?? 15) / 100;
  const feeRate = s.paymentFeeRate ?? 0.036;

  const competitors = await fetchCompetitorPrices(product, signal);
  const minComp = competitors.length
    ? competitors.reduce((a, b) => (a.priceUsd < b.priceUsd ? a : b))
    : null;

  // Cobro único: base sobre COSTO producto, no landed. El landed se usa
  // solo como referencia de COGS (el envío lo paga el cliente en checkout).
  const baseCost =
    (product as unknown as { costUsd?: number }).costUsd &&
    Number((product as unknown as { costUsd?: number }).costUsd) > 0
      ? Number((product as unknown as { costUsd?: number }).costUsd)
      : Math.max(landedMxUsd, landedUsUsd) - 9.99;
  const basePrice = Number((baseCost * markup).toFixed(2));

  if (!minComp) {
    // sin competencia → markup sobre costo (el piso reserva influencer + margen)
    return { priceUsd: Math.max(basePrice, priceFloor(baseCost)), competitor: null, reason: "markup_default" };
  }

  // costo con fees aproximado (Stripe ~3.6% + fijos)
  const ourFloor = basePrice; // precio con markup sobre costo
  const compPrice = minComp.priceUsd;

  // 1) si competencia vende más barato que nosotros: posiciónarse bajo con margen mínimo
  if (compPrice < ourFloor) {
    // target = comp - pequeño discount (1-2%)
    const target = Math.min(ourFloor, Number((compPrice * 0.98).toFixed(2)));
    // validar margen mínimo vs costo (piso con influencer + margen)
    const minAcceptable = priceFloor(baseCost);
    if (target >= minAcceptable) {
      return { priceUsd: Math.max(target, minAcceptable), competitor: minComp, reason: "below_competitor" };
    }
    // no rentable: no incluir (devolver NaN para que caller decida)
    return {
      priceUsd: NaN,
      competitor: minComp,
      reason: "not_profitable_comp_beats_cost",
    };
  }

  // 2) competencia más cara: posicionarnos por debajo de ella con small discount, pero dentro de markup
  const target = Number((compPrice * 0.98).toFixed(2));
  if (target >= ourFloor) {
    // nuestro markup ya es más agresivo → usar markup
    return { priceUsd: ourFloor, competitor: minComp, reason: "our_markup_below_comp" };
  }
  return { priceUsd: target, competitor: minComp, reason: "below_competitor" };

  /** Precio mínimo que cubre COSTO producto, fee, comisión influencer
   *  y margen mínimo. El flete se cubre con el envío de checkout,
   *  no con el precio (cobro único). */
  function priceFloor(cost: number): number {
    const reserved = feeRate + inflPct + minMarginPct / 100;
    if (reserved >= 1) return Number((cost * 3).toFixed(2));
    return Number((cost / (1 - reserved)).toFixed(2));
  }
}

export function computePriceSimple(
  landedMxUsd: number,
  landedUsUsd: number,
  opts?: { markup?: number; minMarginPct?: number; feeRate?: number; influencerCommissionPct?: number; costUsd?: number }
): number {
  const s = { markup: 2.6, minMarginPct: 12, feeRate: 0.036, influencerCommissionPct: 15, ...opts };
  // Cobro único: base sobre costo, no landed. Si no se pasa costUsd se
  // estima como landed − 9.99 para no romper callers antiguos.
  const cost = s.costUsd && s.costUsd > 0
    ? s.costUsd
    : Math.max(landedMxUsd, landedUsUsd) - 9.99;
  const price = Number((cost * s.markup).toFixed(2));
  const reserved = s.feeRate + s.influencerCommissionPct / 100 + s.minMarginPct / 100;
  const floor = reserved >= 1 ? cost * 3 : Number((cost / (1 - reserved)).toFixed(2));
  return Math.max(price, floor);
}

export async function shouldIncludeProduct(product: Product): Promise<{ include: boolean; priceUsd: number; reason: string }> {
  const s = await readStoreSettings();
  const costUsd = (product as unknown as { costUsd?: number }).costUsd ?? 5;
  const landedMx = costUsd + (product.shippingMxUsd ?? 9.99);
  const landedUs = costUsd + (product.shippingUsUsd ?? 9.99);
  const { priceUsd, reason } = await computeCompetitivePrice(product, landedMx, landedUs);
  if (Number.isNaN(priceUsd)) {
    return { include: false, priceUsd: 0, reason };
  }
  // margen total con cobro único (precio + envío checkout − landed).
  const shipExpected = Math.max(s.shippingFlatMxUsd ?? 9.99, s.shippingFlatUsd ?? 9.99);
  const landedMax = Math.max(landedMx, landedUs);
  const income = priceUsd + shipExpected;
  const fee = income * (s.paymentFeeRate ?? 0.036);
  const marginPct = ((income - landedMax - fee) / income) * 100;
  if (marginPct < (s.minMarginPct ?? 20)) {
    return { include: false, priceUsd, reason: "below_min_margin" };
  }
  return { include: true, priceUsd, reason };
}
