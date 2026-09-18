import { promises as fs } from "fs";
import path from "path";
import type { Order } from "./types";
import {
  isPersistentStorageAvailable,
  storageGet,
  storageList,
  storageSet,
} from "./storage";

const DATA_DIR = path.join(process.cwd(), "data");
const ORDERS_FILE = path.join(DATA_DIR, "orders.json");
const COLLECTION = "orders";

async function ensureLocal() {
  // Skip filesystem in production (Cloudflare Workers / serverless)
  if (process.env.NODE_ENV === "production") return;
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(ORDERS_FILE);
  } catch {
    await fs.writeFile(ORDERS_FILE, "[]", "utf8");
  }
}

export async function readOrders(): Promise<Order[]> {
  if (isPersistentStorageAvailable()) {
    const docs = await storageList<Order>(COLLECTION);
    return docs.sort((a, b) =>
      (b.createdAt || "").localeCompare(a.createdAt || "")
    );
  }
  // Fallback: return empty in production (no filesystem)
  if (process.env.NODE_ENV === "production") {
    return [];
  }
  try {
    await ensureLocal();
    const raw = await fs.readFile(ORDERS_FILE, "utf8");
    return JSON.parse(raw) as Order[];
  } catch {
    return [];
  }
}

export async function writeOrders(orders: Order[]) {
  if (isPersistentStorageAvailable()) {
    for (const o of orders) await storageSet(COLLECTION, o.id, o);
    return;
  }
  await ensureLocal();
  await fs.writeFile(ORDERS_FILE, JSON.stringify(orders, null, 2), "utf8");
}

export async function getOrder(id: string): Promise<Order | null> {
  if (isPersistentStorageAvailable()) {
    return storageGet<Order>(COLLECTION, id);
  }
  const orders = await readOrders();
  return orders.find((o) => o.id === id) || null;
}

export async function saveOrder(order: Order) {
  if (isPersistentStorageAvailable()) {
    await storageSet(COLLECTION, order.id, order);
    return order;
  }
  const orders = await readOrders();
  const idx = orders.findIndex((o) => o.id === order.id);
  if (idx >= 0) orders[idx] = order;
  else orders.unshift(order);
  await writeOrders(orders);
  return order;
}

export async function updateOrder(
  id: string,
  patch: Partial<Order>
): Promise<Order | null> {
  const existing = await getOrder(id);
  if (!existing) return null;
  const updated: Order = {
    ...existing,
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  await saveOrder(updated);
  return updated;
}
