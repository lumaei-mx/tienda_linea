import type { Product } from "./types";

/**
 * Fuente única de precios para guías de blog (build-time).
 *
 * Problema que resuelve: las guías hardcodeaban el precio como texto literal.
 * Cuando CJ ajusta listas, el blog se desalineaba de la tienda y rompía la
 * confianza al hacer clic (ver ciclos 5→6). Ahora el precio se resuelve en
 * tiempo de build desde /api/products — exactamente lo que ve el cliente en la
 * PDP — de modo que blog y tienda nunca difieren.
 *
 * Cadena de fallback (nunca rompe el build, nunca queda vacío):
 *   1. /api/products (Redis, precio vivo de producción)  ← fuente de verdad
 *   2. valor literal pasado por la guía (correcto al escribirlo) ← cacheado
 *
 * NOTA: data/products.json es un caché sembrado que QUEDA DESACTUALIZADO
 * respecto a Redis; por eso NO se usa como fallback (introduciría los precios
 * viejos). El literal de la guía es mejor fallback que el archivo.
 */

const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.NEXT_PUBLIC_BASE_URL ||
  "https://www.lumaei.com"
).replace(/\/$/, "");

type PriceRow = Pick<Product, "slug" | "priceUsd">;

let priceCache: Map<string, number> | null = null;
let priceCacheReady = false;

async function loadLivePrices(): Promise<Map<string, number> | null> {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 9000);
    const res = await fetch(`${SITE_URL}/api/products`, {
      signal: ctrl.signal,
      headers: { "user-agent": "lumaei-guide-prices/1.0 (+build)" },
      // force-static: el fetch corre UNA vez en build; no queremos revalidación.
      cache: "no-store",
    });
    clearTimeout(timer);
    if (!res.ok) return null;
    const body = (await res.json()) as { products?: PriceRow[] } | PriceRow[];
    const list = Array.isArray(body) ? body : body.products;
    if (!Array.isArray(list)) return null;
    const m = new Map<string, number>();
    for (const p of list) {
      if (p?.slug && typeof p.priceUsd === "number") m.set(p.slug, p.priceUsd);
    }
    return m.size ? m : null;
  } catch {
    return null;
  }
}

async function getPriceMap(): Promise<Map<string, number>> {
  if (priceCacheReady) return priceCache ?? new Map();
  priceCache = await loadLivePrices();
  priceCacheReady = true;
  return priceCache ?? new Map();
}

export function formatUsd(n: number): string {
  return `$${n.toFixed(2)} USD`;
}

/**
 * Devuelve el precio vivo del producto para una guía, o `fallback` si no se
 * pudo resolver (API caída). El `fallback` es el valor literal ya correcto.
 */
export async function guidePrice(slug: string, fallback: string): Promise<string> {
  const m = await getPriceMap();
  const price = m.get(slug);
  if (typeof price !== "number") return fallback;
  return formatUsd(price);
}

/**
 * Rango min/max de los precios resueltos para una lista de slugs, usado en
 * las FAQ ("Van de $X a $Y USD"). Si no hay ninguno resuelto, devuelve null
 * para que la guía use su literal de respaldo.
 */
export async function guidePriceRange(
  slugs: string[]
): Promise<{ min: string; max: string } | null> {
  const m = await getPriceMap();
  const found = slugs
    .map((s) => m.get(s))
    .filter((n): n is number => typeof n === "number");
  if (!found.length) return null;
  return {
    min: formatUsd(Math.min(...found)),
    max: formatUsd(Math.max(...found)),
  };
}
