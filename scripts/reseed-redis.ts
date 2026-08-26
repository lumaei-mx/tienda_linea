/**
 * Re-seed Redis with correct product data from data/products.json.
 * Run: node --experimental-strip-types scripts/reseed-redis.ts
 */
import { createClient } from "redis";
import { readFileSync } from "fs";
import path from "path";

const REDIS_URL = process.env.REDIS_URL;
if (!REDIS_URL) {
  console.error("REDIS_URL not set");
  process.exit(1);
}

const products = JSON.parse(
  readFileSync(path.join(import.meta.dirname, "../data/products.json"), "utf8")
) as Array<{ id: string; [k: string]: unknown }>;

const client = createClient({ url: REDIS_URL });
await client.connect();

let updated = 0;
for (const p of products) {
  const key = `products:${p.id}`;
  const existing = await client.get(key);
  if (!existing) {
    console.log(`SKIP ${p.id} — not in Redis`);
    continue;
  }
  const current = JSON.parse(existing);
  // Merge: overwrite costUsd, shippingMxUsd, shippingUsUsd from local file
  const next = {
    ...current,
    costUsd: p.costUsd,
    shippingMxUsd: p.shippingMxUsd,
    shippingUsUsd: p.shippingUsUsd,
    priceUsd: p.priceUsd,
    slug: p.slug,
    name: p.name,
    active: p.active,
  };
  await client.set(key, JSON.stringify(next));
  updated++;
  console.log(
    `OK ${p.id.slice(0, 30)} cost=$${p.costUsd} shipMX=$${p.shippingMxUsd} shipUS=$${p.shippingUsUsd} price=$${p.priceUsd}`
  );
}

await client.quit();
console.log(`\nDone. Updated ${updated}/${products.length} products.`);
