import { isSupabaseAvailable, storageGetSupabase, storageSetSupabase, storageListSupabase, storageDeleteSupabase } from "./storage-supabase";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";
import { createClient, type RedisClientType } from "redis";

/**
 * Capa de almacenamiento para producción (Vercel serverless):
 * 1. Supabase (`SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`) — preferido, gratuito, persistente
 * 2. Redis (`REDIS_URL`) — fallback, persistente
 * 3. Firestore (`FIREBASE_SERVICE_ACCOUNT` / `GOOGLE_APPLICATION_CREDENTIALS`) — fallback legacy
 * 4. Filesystem (dev local)
 */

const REDIS_URL = process.env.REDIS_URL;
const DATA_DIR = join(process.cwd(), "data");

export { isSupabaseAvailable };

export function isRedisAvailable(): boolean {
  return Boolean(REDIS_URL);
}

export function isFirestoreAvailable(): boolean {
  return Boolean(
    process.env.FIREBASE_SERVICE_ACCOUNT ||
      process.env.GOOGLE_APPLICATION_CREDENTIALS ||
      (process.env.FIREBASE_PROJECT_ID &&
        process.env.FIREBASE_CLIENT_EMAIL &&
        process.env.FIREBASE_PRIVATE_KEY)
  );
}

// ==== Filesystem fallback (dev local) ====

const fsCache = new Map<string, unknown>();
const fsFileCache = new Map<string, string>();

function fsKey(collection: string, id: string) {
  return join(DATA_DIR, collection, `${id}.json`);
}

function fsRead<T>(collection: string, id: string): T | null {
  const key = `${collection}:${id}`;
  if (fsCache.has(key)) {
    return fsCache.get(key) as T;
  }
  const file = fsKey(collection, id);
  if (!existsSync(file)) return null;
  try {
    const raw = readFileSync(file, "utf-8");
    fsFileCache.set(file, raw);
    const parsed = JSON.parse(raw) as T;
    fsCache.set(key, parsed);
    return parsed;
  } catch {
    return null;
  }
}

function fsWrite(collection: string, id: string, data: unknown) {
  const key = `${collection}:${id}`;
  fsCache.set(key, data);
  // En Vercel serverless no podemos escribir filesystem, pero en dev sí
  try {
    const file = fsKey(collection, id);
    writeFileSync(file, JSON.stringify(data, null, 2), "utf-8");
    fsFileCache.set(file, JSON.stringify(data));
  } catch {
    /* serverless — solo cache en memoria */
  }
}

function fsList<T>(collection: string): T[] {
  // Fallback: leer data/products.json or data/orders.json etc.
  const fallbackFile = join(DATA_DIR, `${collection}.json`);
  if (existsSync(fallbackFile)) {
    try {
      const raw = readFileSync(fallbackFile, "utf-8");
      return JSON.parse(raw) as T[];
    } catch {
      return [];
    }
  }
  return [];
}

function fsDelete(collection: string, id: string) {
  const key = `${collection}:${id}`;
  fsCache.delete(key);
}

// ==== Redis (cliente TCP con singleton global) ====

let _redis: RedisClientType | null = null;
let _redisPromise: Promise<RedisClientType> | null = null;

function getRedis(): Promise<RedisClientType> {
  if (_redis) return Promise.resolve(_redis);
  if (_redisPromise) return _redisPromise;

  _redisPromise = (async () => {
    const client = createClient({ url: REDIS_URL });
    client.on("error", () => {
      /* errores en background no tumban el proceso */
    });
    try {
      await client.connect();
    } catch (err) {
      _redisPromise = null;
      try {
        await client.quit();
      } catch {
        /* ya desconectado */
      }
      throw err;
    }
    _redis = client as RedisClientType;
    return _redis;
  })();

  return _redisPromise;
}

function collectionKey(collection: string, id: string) {
  return `${collection}:${id}`;
}

// ==== API pública unificada ====

export async function storageGet<T>(collection: string, id: string): Promise<T | null> {
  // 1. Supabase (preferido)
  if (isSupabaseAvailable()) {
    try {
      return storageGetSupabase<T>(collection, id);
    } catch (err) {
      // Fallar gracefully al siguiente backend
    }
  }
  // 2. Redis
  if (isRedisAvailable()) {
    try {
      const raw = await (await getRedis()).get(collectionKey(collection, id));
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      /* Redis down — fall through */
    }
  }
  // 3. Firestore
  if (isFirestoreAvailable()) {
    try {
      const { storageGet: fsGet } = await import("./firestore");
      return fsGet<T>(collection, id);
    } catch {
      /* Firestore down — fall through */
    }
  }
  // 4. Filesystem (dev)
  return fsRead<T>(collection, id);
}

export async function storageList<T>(collection: string): Promise<T[]> {
  // 1. Supabase (preferido)
  if (isSupabaseAvailable()) {
    try {
      const result = await storageListSupabase<T>(collection);
      if (result.length > 0) return result;
      // Si está vacío, probar filesystem como fallback de seed
    } catch {
      /* Supabase down — fall through */
    }
  }
  // 2. Redis
  if (isRedisAvailable()) {
    try {
      const client = await getRedis();
      const keys = await client.keys(`${collection}:*`);
      if (!keys.length) return [];
      const out: T[] = [];
      for (const k of keys) {
        const raw = await client.get(k);
        if (raw) out.push(JSON.parse(raw) as T);
      }
      return out;
    } catch {
      /* Redis down — fall through */
    }
  }
  // 3. Firestore
  if (isFirestoreAvailable()) {
    try {
      const { storageList: fsList } = await import("./firestore");
      return fsList<T>(collection);
    } catch {
      /* Firestore down — fall through */
    }
  }
  // 4. Filesystem (dev)
  return fsList<T>(collection);
}

export async function storageSet(collection: string, id: string, data: unknown) {
  let success = false;
  // 1. Supabase (preferido)
  if (isSupabaseAvailable()) {
    try {
      await storageSetSupabase(collection, id, data);
      success = true;
    } catch {
      /* Supabase down — fall through */
    }
  }
  // 2. Redis
  if (isRedisAvailable()) {
    try {
      await (await getRedis()).set(collectionKey(collection, id), JSON.stringify(data));
      success = true;
    } catch {
      /* Redis down — fall through */
    }
  }
  // 3. Firestore
  if (isFirestoreAvailable()) {
    try {
      const { storageSet: fsSet } = await import("./firestore");
      await fsSet(collection, id, data);
      success = true;
    } catch {
      /* Firestore down — fall through */
    }
  }
  // 4. Filesystem (dev)
  if (!success) {
    fsWrite(collection, id, data);
  } else {
    // También escribir en filesystem para dev consistency
    fsWrite(collection, id, data);
  }
  return;
}

export async function storageDelete(collection: string, id: string) {
  // 1. Supabase
  if (isSupabaseAvailable()) {
    try {
      await storageDeleteSupabase(collection, id);
    } catch {
      /* fall through */
    }
  }
  // 2. Redis
  if (isRedisAvailable()) {
    try {
      await (await getRedis()).del(collectionKey(collection, id));
    } catch {
      /* fall through */
    }
  }
  // 3. Firestore
  if (isFirestoreAvailable()) {
    try {
      const { storageDelete: fsDel } = await import("./firestore");
      await fsDel(collection, id);
    } catch {
      /* fall through */
    }
  }
  // 4. Filesystem
  fsDelete(collection, id);
}
