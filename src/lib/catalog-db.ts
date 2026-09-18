import { storageGet, storageList, storageSet, storageDelete, isPersistentStorageAvailable } from "./storage";

const COLLECTION = "catalogs";

export interface SeasonDef {
  key: string;
  name: string;
  /** fecha inicio M-DD (anual) */
  start: string;
  /** fecha fin M-DD (anual, inclusiva) */
  end: string;
  keywords?: string[];
  /** categorías sugeridas para esta temporada */
  categories?: string[];
  emoji?: string;
}

/** Temporadas fijas con calendario anual automático */
export const SEASONS: SeasonDef[] = [
  {
    key: "primavera",
    name: "Primavera",
    start: "03-21",
    end: "06-20",
    keywords: ["gardening", "spring", "outdoor", "picnic"],
    categories: ["Hogar", "Jardín"],
    emoji: "🌸",
  },
  {
    key: "verano",
    name: "Verano",
    start: "06-21",
    end: "09-20",
    keywords: ["summer", "beach", "water", "fan", "pool"],
    categories: ["Auto", "Hogar"],
    emoji: "☀️",
  },
  {
    key: "regreso_clases",
    name: "Regreso a clases",
    start: "08-01",
    end: "09-15",
    keywords: ["school", "backpack", "stationery", "laptop"],
    categories: ["Oficina", "Electrónica"],
    emoji: "🎒",
  },
  {
    key: "halloween",
    name: "Halloween",
    start: "10-01",
    end: "11-02",
    keywords: ["halloween", "spooky", "costume"],
    categories: ["Hogar", "Fiesta"],
    emoji: "🎃",
  },
  {
    key: "navidad",
    name: "Navidad",
    start: "11-15",
    end: "12-31",
    keywords: ["christmas", "gift", "holiday", "decor"],
    categories: ["Hogar", "Regalo"],
    emoji: "🎄",
  },
  {
    key: "san_valentin",
    name: "San Valentín",
    start: "01-15",
    end: "02-14",
    keywords: ["valentine", "gift", "love", "jewelry"],
    categories: ["Belleza", "Regalo"],
    emoji: "💝",
  },
];

export interface Catalog {
  season: string;
  productIds: string[];
  createdAt: string;
  updatedAt: string;
}

function parseMmdd(v: string, year: number): number {
  const [m, d] = v.split("-").map(Number);
  return new Date(year, m - 1, d).getTime();
}

/** Devuelve la temporada activa hoy (o null entre temporadas) */
export function currentSeason(now = new Date()): SeasonDef | null {
  const y = now.getFullYear();
  const t = now.getTime();
  for (const s of SEASONS) {
    let start = parseMmdd(s.start, y);
    let end = parseMmdd(s.end, y);
    // rangos que cruzan año (san_valentin ene → feb)
    if (end < start) {
      if (t >= start) {
        end = parseMmdd(s.end, y + 1);
      } else {
        start = parseMmdd(s.start, y - 1);
      }
    }
    if (t >= start && t <= end) return s;
  }
  return null;
}

/** Próxima temporada a partir de hoy (para pre-armar catálogo) */
export function nextSeason(now = new Date()): SeasonDef {
  const y = now.getFullYear();
  let best: { s: SeasonDef; at: number } | null = null;
  for (const s of SEASONS) {
    let start = parseMmdd(s.start, y);
    if (start < now.getTime()) start = parseMmdd(s.start, y + 1);
    if (!best || start < best.at) best = { s, at: start };
  }
  return best!.s;
}

// ==== persistencia ====

export async function getCatalog(season: string): Promise<Catalog | null> {
  try {
    return await storageGet<Catalog>(COLLECTION, season);
  } catch {
    return null;
  }
}

export async function listCatalogs(): Promise<Catalog[]> {
  if (!isPersistentStorageAvailable()) return [];
  return storageList<Catalog>(COLLECTION);
}

export async function upsertCatalog(catalog: Catalog): Promise<Catalog> {
  const now = new Date().toISOString();
  const next = { ...catalog, updatedAt: now };
  await storageSet(COLLECTION, catalog.season, next);
  return next;
}

export async function addProductToSeason(season: string, productId: string) {
  const cur = (await getCatalog(season)) || {
    season,
    productIds: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  if (!cur.productIds.includes(productId)) {
    cur.productIds.push(productId);
  }
  return upsertCatalog(cur);
}

export async function removeProductFromSeason(season: string, productId: string) {
  const cur = await getCatalog(season);
  if (!cur) return null;
  cur.productIds = cur.productIds.filter((id) => id !== productId);
  return upsertCatalog(cur);
}

export async function deleteCatalog(season: string) {
  try {
    await storageDelete(COLLECTION, season);
  } catch {
    /* ignora */
  }
}
