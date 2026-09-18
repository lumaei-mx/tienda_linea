import { storageGet, storageList, storageSet, storageDelete, isPersistentStorageAvailable } from "./storage";
import type { Market } from "./types";

const COLLECTION = "promos";

export type PromoType = "percent" | "fixed";

export interface Promo {
  code: string;
  type: PromoType;
  value: number; // % (percent) o monto fijo en moneda del mercado (fixed)
  minSubtotal?: number; // mínimo en moneda del mercado
  markets: Market[];
  active: boolean;
  startsAt?: string;
  endsAt?: string;
  usageLimit?: number;
  usedCount: number;
  createdAt: string;
  updatedAt: string;
}

function norm(code: string) {
  return code.trim().toUpperCase().replace(/\s+/g, "");
}

export async function getPromo(code: string): Promise<Promo | null> {
  try {
    return await storageGet<Promo>(COLLECTION, norm(code));
  } catch {
    return null;
  }
}

export async function listPromos(): Promise<Promo[]> {
  if (!isPersistentStorageAvailable()) return [];
  return storageList<Promo>(COLLECTION);
}

export async function upsertPromo(promo: Promo): Promise<Promo> {
  const now = new Date().toISOString();
  const code = norm(promo.code);
  // Preserva contadores de uso y fecha original si la promo ya existe:
  // re-guardar una promo no debe resetear su usageLimit.
  const existing = await storageGet<Promo>(COLLECTION, code).catch(() => null);
  const next: Promo = {
    ...promo,
    code,
    usedCount: existing?.usedCount ?? promo.usedCount ?? 0,
    createdAt: existing?.createdAt ?? promo.createdAt ?? now,
    updatedAt: now,
  };
  await storageSet(COLLECTION, next.code, next);
  return next;
}

export async function deletePromo(code: string) {
  try {
    await storageDelete(COLLECTION, norm(code));
  } catch {
    /* ignora */
  }
}

export async function incrementPromoUsage(code: string) {
  const promo = await getPromo(code);
  if (!promo) return;
  await upsertPromo({ ...promo, usedCount: promo.usedCount + 1 });
}

/**
 * Valida un código y calcula el descuento para un subtotal+market.
 * Devuelve el monto de descuento y el código normalizado, o null si inválido.
 */
export async function validatePromo(
  code: string,
  market: Market,
  subtotal: number
): Promise<{ promo: Promo; discount: number } | null> {
  const promo = await getPromo(code);
  if (!promo || !promo.active) return null;
  if (!promo.markets.includes(market)) return null;

  const now = Date.now();
  if (promo.startsAt && now < new Date(promo.startsAt).getTime()) return null;
  if (promo.endsAt && now > new Date(promo.endsAt).getTime()) return null;
  if (promo.usageLimit !== undefined && promo.usedCount >= promo.usageLimit) return null;
  if (promo.minSubtotal !== undefined && subtotal < promo.minSubtotal) return null;

  const discount =
    promo.type === "percent"
      ? Number(((subtotal * promo.value) / 100).toFixed(2))
      : Math.min(promo.value, subtotal);

  return { promo, discount: Number(discount.toFixed(2)) };
}
