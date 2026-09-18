import { isSupabaseAvailable, storageGetSupabase, storageSetSupabase, storageListSupabase, storageDeleteSupabase } from "./storage-supabase";
import { readFileSync, writeFileSync, existsSync, readdirSync, mkdirSync } from "fs";
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

/**
 * Presupuesto de tiempo por operación de backend. Sin esto, un backend lento
 * (p.ej. `KEYS` sobre un Redis grande) bloquea la request completa: el panel
 * /admin llegó a colgarse >150s sin devolver un solo byte.
 */
const BACKEND_TIMEOUT_MS = Number(process.env.STORAGE_TIMEOUT_MS || 8000);

/**
 * Timeout de conexión a Redis. `withTimeout` no cubre el `connect()`, así que
 * sin este límite un Redis inalcanzable (URL inválida, host caído, TLS
 * incorrecto) deja la request colgada para siempre en vez de degradar al
 * siguiente backend.
 */
const REDIS_CONNECT_TIMEOUT_MS = Number(
  process.env.REDIS_CONNECT_TIMEOUT_MS || 3000
);

export class StorageTimeoutError extends Error {
  constructor(op: string, ms: number) {
    super(`${op} excedió ${ms}ms`);
    this.name = "StorageTimeoutError";
  }
}

function withTimeout<T>(promise: Promise<T>, op: string, ms = BACKEND_TIMEOUT_MS): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new StorageTimeoutError(op, ms)), ms);
    promise.then(
      (v) => {
        clearTimeout(timer);
        resolve(v);
      },
      (e) => {
        clearTimeout(timer);
        reject(e);
      }
    );
  });
}

export function isRedisAvailable(): boolean {
  return Boolean(REDIS_URL);
}

/**
 * ¿Hay algún backend persistente disponible?
 *
 * Los módulos de datos usaban `isRedisAvailable()` como puerta, lo que los
 * dejaba en modo degradado silencioso (settings estáticos, listas vacías) si
 * el único backend configurado era Supabase. La capa `storage*` ya elige el
 * backend, así que la puerta correcta es "hay alguno", no "hay Redis".
 */
export function isPersistentStorageAvailable(): boolean {
  return isSupabaseAvailable() || isRedisAvailable() || isFirestoreAvailable();
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
  // En serverless no hay filesystem escribible, pero en dev sí.
  try {
    const file = fsKey(collection, id);
    mkdirSync(join(DATA_DIR, collection), { recursive: true });
    writeFileSync(file, JSON.stringify(data, null, 2), "utf-8");
    fsFileCache.set(file, JSON.stringify(data));
  } catch {
    /* serverless — solo cache en memoria */
  }
}

function fsList<T>(collection: string): T[] {
  const out: T[] = [];
  const seen = new Set<string>();

  // 1. Archivos por-id (lo que escribe storageSet en dev).
  // Antes se ignoraban: se escribía data/<collection>/<id>.json pero el listado
  // solo miraba data/<collection>.json, así que en dev todo listado salía vacío.
  const dir = join(DATA_DIR, collection);
  if (existsSync(dir)) {
    try {
      for (const name of readdirSync(dir)) {
        if (!name.endsWith(".json")) continue;
        const id = name.slice(0, -5);
        const item = fsRead<T>(collection, id);
        if (item) {
          out.push(item);
          seen.add(id);
        }
      }
    } catch {
      /* directorio ilegible */
    }
  }

  // 2. Objetos aún solo en memoria (serverless sin filesystem).
  for (const [key, value] of fsCache) {
    const prefix = `${collection}:`;
    if (!key.startsWith(prefix)) continue;
    const id = key.slice(prefix.length);
    if (seen.has(id)) continue;
    out.push(value as T);
  }

  // 3. Fallback: data/<collection>.json (seed / datos versionados).
  const fallbackFile = join(DATA_DIR, `${collection}.json`);
  if (existsSync(fallbackFile)) {
    try {
      const raw = readFileSync(fallbackFile, "utf-8");
      const arr = JSON.parse(raw) as T[];
      if (Array.isArray(arr)) out.push(...arr);
    } catch {
      /* json inválido */
    }
  }

  return out;
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
    const client = createClient({
      url: REDIS_URL,
      socket: {
        connectTimeout: REDIS_CONNECT_TIMEOUT_MS,
        // Sin esto el cliente reintenta en bucle y cada request se queda
        // esperando indefinidamente: preferimos fallar rápido y caer al
        // siguiente backend (Supabase/Firestore/filesystem).
        reconnectStrategy: false,
      },
    });
    client.on("error", () => {
      /* errores en background no tumban el proceso */
    });
    try {
      // El `connectTimeout` del socket cubre TCP/TLS, pero no todos los modos
      // de fallo (DNS colgado, proxy que acepta y no responde), así que la
      // conexión se acota también aquí. Sin esto, `_redisPromise` quedaba
      // pendiente para siempre y cada request posterior pagaba el timeout.
      await withTimeout(client.connect(), "redis.connect", REDIS_CONNECT_TIMEOUT_MS);
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

/**
 * Lista las keys de una colección con `SCAN` acotado.
 * `KEYS` es O(N) sobre TODA la base y es lo que colgaba /admin; `SCAN` es
 * incremental y aquí se limita por iteraciones y por tiempo para que una
 * colección grande jamás bloquee una request.
 */
async function redisScanKeys(
  client: RedisClientType,
  pattern: string,
  maxIterations = 50,
  count = 200
): Promise<string[]> {
  const found: string[] = [];
  let cursor = "0";
  for (let i = 0; i < maxIterations; i++) {
    const res = await client.scan(cursor, { MATCH: pattern, COUNT: count });
    for (const k of res.keys ?? []) found.push(k);
    cursor = String(res.cursor ?? "0");
    if (cursor === "0") break;
  }
  return found;
}

// ==== API pública unificada ====

export async function storageGet<T>(collection: string, id: string): Promise<T | null> {
  // 1. Supabase (preferido)
  if (isSupabaseAvailable()) {
    try {
      return await withTimeout(
        storageGetSupabase<T>(collection, id),
        "supabase.get"
      );
    } catch {
      // Fallar gracefully al siguiente backend
    }
  }
  // 2. Redis
  if (isRedisAvailable()) {
    try {
      const raw = await withTimeout(
        getRedis().then((c) => c.get(collectionKey(collection, id))),
        "redis.get"
      );
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      /* Redis down — fall through */
    }
  }
  // 3. Firestore
  if (isFirestoreAvailable()) {
    try {
      const { storageGet: fsGet } = await import("./firestore");
      return await withTimeout(fsGet<T>(collection, id), "firestore.get");
    } catch {
      /* Firestore down — fall through */
    }
  }
  // 4. Filesystem (dev)
  return fsRead<T>(collection, id);
}

export async function storageList<T>(collection: string): Promise<T[]> {
  // 1. Supabase (preferido). Si responde, es autoritativo: no se cae a Redis
  // (el fallthrough convertía una colección vacía en un `KEYS` costoso).
  if (isSupabaseAvailable()) {
    try {
      return await withTimeout(
        storageListSupabase<T>(collection),
        "supabase.list"
      );
    } catch {
      /* Supabase down — fall through */
    }
  }
  // 2. Redis
  if (isRedisAvailable()) {
    try {
      const client = await withTimeout(getRedis(), "redis.connect");
      const keys = await withTimeout(
        redisScanKeys(client, `${collection}:*`),
        "redis.scan"
      );
      if (!keys.length) return [];
      const out: T[] = [];
      for (const k of keys) {
        const raw = await withTimeout(client.get(k), "redis.get");
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
      return await withTimeout(fsList<T>(collection), "firestore.list");
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
      await withTimeout(storageSetSupabase(collection, id, data), "supabase.set");
      success = true;
    } catch {
      /* Supabase down — fall through */
    }
  }
  // 2. Redis
  if (isRedisAvailable()) {
    try {
      await withTimeout(
        getRedis().then((c) =>
          c.set(collectionKey(collection, id), JSON.stringify(data))
        ),
        "redis.set"
      );
      success = true;
    } catch {
      /* Redis down — fall through */
    }
  }
  // 3. Firestore
  if (isFirestoreAvailable()) {
    try {
      const { storageSet: fsSet } = await import("./firestore");
      await withTimeout(fsSet(collection, id, data), "firestore.set");
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
      await withTimeout(storageDeleteSupabase(collection, id), "supabase.del");
    } catch {
      /* fall through */
    }
  }
  // 2. Redis
  if (isRedisAvailable()) {
    try {
      await withTimeout(
        getRedis().then((c) => c.del(collectionKey(collection, id))),
        "redis.del"
      );
    } catch {
      /* fall through */
    }
  }
  // 3. Firestore
  if (isFirestoreAvailable()) {
    try {
      const { storageDelete: fsDel } = await import("./firestore");
      await withTimeout(fsDel(collection, id), "firestore.del");
    } catch {
      /* fall through */
    }
  }
  // 4. Filesystem
  fsDelete(collection, id);
}
