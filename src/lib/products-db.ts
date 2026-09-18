import { promises as fs } from "fs";
import path from "path";
import type { Product } from "./types";
// Import seed data as fallback for Edge Runtime (static import)
import { products as seedProductsData } from "@/data/products";
import {
  isPersistentStorageAvailable,
  storageList,
  storageSet,
  storageDelete,
} from "./storage";

const DATA_DIR = path.join(process.cwd(), "data");
const PRODUCTS_FILE = path.join(DATA_DIR, "products.json");
const COLLECTION = "products";
const seedProducts: Product[] = seedProductsData;

async function ensureLocal() {
  // Skip filesystem in production (Cloudflare Workers / serverless)
  if (process.env.NODE_ENV === "production") return;
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(PRODUCTS_FILE);
  } catch {
    await fs.writeFile(
      PRODUCTS_FILE,
      JSON.stringify(seedProducts, null, 2),
      "utf8"
    );
  }
}

export async function readProducts(): Promise<Product[]> {
  if (isPersistentStorageAvailable()) {
    const docs = await storageList<Product>(COLLECTION);
    if (docs.length) return docs;
    // sembrar catálogo inicial
    const seeds = [...seedProducts];
    for (const p of seeds) await storageSet(COLLECTION, p.id, p);
    return seeds;
  }
  // Fallback: use imported seed data (works in Edge Runtime / Cloudflare Workers)
  if (process.env.NODE_ENV === "production") {
    return seedProducts;
  }
  try {
    await ensureLocal();
    const raw = await fs.readFile(PRODUCTS_FILE, "utf8");
    return JSON.parse(raw) as Product[];
  } catch {
    // Fall back to imported seed data
    return seedProducts;
  }
}

export async function writeProducts(products: Product[]) {
  if (isPersistentStorageAvailable()) {
    for (const p of products) await storageSet(COLLECTION, p.id, p);
    return;
  }
  await ensureLocal();
  await fs.writeFile(PRODUCTS_FILE, JSON.stringify(products, null, 2), "utf8");
}

export async function getProductBySlugAsync(slug: string) {
  const all = await readProducts();
  return all.find((p) => p.slug === slug && p.active);
}

export async function getProductByIdAsync(id: string) {
  const all = await readProducts();
  return all.find((p) => p.id === id && p.active);
}

export async function upsertProduct(product: Product) {
  const all = await readProducts();
  const idx = all.findIndex(
    (p) => p.id === product.id || p.cjProductId === product.cjProductId
  );

  // unique slug
  let slug = product.slug;
  let n = 2;
  while (all.some((p, i) => p.slug === slug && i !== idx)) {
    slug = `${product.slug}-${n++}`;
  }
  product.slug = slug;

  if (idx >= 0) all[idx] = { ...all[idx], ...product };
  else all.unshift(product);

  await writeProducts(all);
  return product;
}

export async function setProductActive(id: string, active: boolean) {
  const all = await readProducts();
  const idx = all.findIndex((p) => p.id === id);
  if (idx < 0) return null;
  all[idx].active = active;
  await writeProducts(all);
  return all[idx];
}

export async function deleteProduct(id: string): Promise<boolean> {
  if (isPersistentStorageAvailable()) {
    const all = await readProducts();
    if (!all.some((p) => p.id === id)) return false;
    await storageDelete(COLLECTION, id);
    return true;
  }
  const all = await readProducts();
  const next = all.filter((p) => p.id !== id);
  if (next.length === all.length) return false;
  await writeProducts(next);
  return true;
}
