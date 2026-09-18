import { settings as staticSettings } from "./settings";
import { storageGet, storageSet } from "./storage";
import type { StoreSettings } from "./types";

const COLLECTION = "meta";
const DOC = "settings_store";

/**
 * Settings de negocio persistidos (editables desde admin, sin tocar código).
 * Cae al objeto estático si no hay override almacenado.
 *
 * Sin puerta por backend: `storageGet` ya resuelve Supabase → Redis →
 * Firestore → filesystem. Gatear aquí por Redis hacía que en Cloudflare
 * (backend Supabase) los cambios del admin se escribieran pero nunca se
 * leyeran, así que los interruptores de seguridad no surtían efecto.
 */
export async function readStoreSettings(): Promise<StoreSettings> {
  try {
    const stored = await storageGet<Partial<StoreSettings>>(COLLECTION, DOC);
    return { ...staticSettings, ...(stored || {}) };
  } catch {
    return staticSettings;
  }
}

export async function updateStoreSettings(
  patch: Partial<StoreSettings>
): Promise<StoreSettings> {
  const current = await readStoreSettings();
  const next = { ...current, ...patch };
  await storageSet(COLLECTION, DOC, next);
  return next;
}

export async function resetStoreSettings(): Promise<StoreSettings> {
  await storageSet(COLLECTION, DOC, staticSettings);
  return staticSettings;
}
