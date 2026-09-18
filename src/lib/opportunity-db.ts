import {
  storageGet,
  storageList,
  storageSet,
  storageDelete,
  isPersistentStorageAvailable,
} from "./storage";

const COLLECTION = "opportunities";

export type OpportunityStatus = "new" | "approved" | "rejected" | "imported";

export interface Opportunity {
  /** PID de CJ */
  pid: string;
  name: string;
  image?: string;
  category?: string;
  /** costo producto CJ (USD) */
  costUsd: number;
  /** envío real CJ a MX/US (USD) */
  shippingMxUsd: number;
  shippingUsUsd: number;
  /** costo total aterrizado por mercado */
  landedMx: number;
  landedUs: number;
  /** precio de venta sugerido USD */
  suggestedPriceUsd: number;
  /** precio fijado manualmente por el admin (sobrescribe suggestedPriceUsd al importar) */
  manualPriceUsd?: number;
  /** precio de competidor más barato conocido (USD) */
  competitorPriceUsd?: number | null;
  /** fuente del precio de competidor */
  competitorSource?: "cj" | "amazon" | "mercadolibre" | null;
  /** ganancia neta estimada USD/ud (mercado de referencia) */
  profitUsd: number;
  /** margen % estimado */
  marginPct: number;
  /** puntaje de tendencia 0-100 (0 si no evaluado) */
  trendScore: number;
  stock: number;
  /** score compuesto para ranking */
  score: number;
  status: OpportunityStatus;
  season?: string;
  sku?: string;
  createdAt: string;
  updatedAt: string;
}

export async function listOpportunities(status?: OpportunityStatus) {
  if (!isPersistentStorageAvailable()) return [];
  const all = await storageList<Opportunity>(COLLECTION);
  return status ? all.filter((o) => o.status === status) : all;
}

export async function getOpportunity(pid: string) {
  try {
    return await storageGet<Opportunity>(COLLECTION, pid);
  } catch {
    return null;
  }
}

export async function upsertOpportunity(opp: Opportunity) {
  const now = new Date().toISOString();
  await storageSet(COLLECTION, opp.pid, { ...opp, updatedAt: now });
  return opp;
}

export async function setOpportunityStatus(
  pid: string,
  status: OpportunityStatus,
  extra?: Partial<Opportunity>
) {
  const cur = await getOpportunity(pid);
  if (!cur) return null;
  const next = { ...cur, ...extra, status, updatedAt: new Date().toISOString() };
  await storageSet(COLLECTION, pid, next);
  return next;
}

export async function deleteOpportunity(pid: string) {
  try {
    await storageDelete(COLLECTION, pid);
  } catch {
    /* ignora */
  }
}

export async function updateOpportunity(
  pid: string,
  patch: Partial<Opportunity>
): Promise<Opportunity | null> {
  const cur = await getOpportunity(pid);
  if (!cur) return null;
  const next = { ...cur, ...patch, updatedAt: new Date().toISOString() };
  await storageSet(COLLECTION, pid, next);
  return next;
}
