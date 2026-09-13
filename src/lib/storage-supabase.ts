/**
 * Backend de almacenamiento usando Supabase (PostgreSQL).
 *
 * Implementa la misma interfaz que el backend Redis:
 *   storageGet<T>(collection, id) → T | null
 *   storageSet(collection, id, data)
 *   storageList<T>(collection) → T[]
 *   storageDelete(collection, id)
 *
 * Usa una tabla genérica `kv_store` con columnas:
 *   collection  TEXT
 *   id          TEXT
 *   data        JSONB  (el payload serializado)
 *   updated_at  TIMESTAMPTZ
 *
 * PRIMARY KEY (collection, id)
 *
 * Esto replica el patrón de Redis hashes: cada "collection" actúa como un
 * namespace y cada "id" como una key dentro de él.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { StoreSettings } from "./types";

type AnyObj = Record<string, unknown>;

let _client: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (_client) return _client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

  if (!url || !key) {
    throw new Error(
      "Supabase no configurado: define SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY"
    );
  }

  _client = createClient(url, key, {
    auth: { persistSession: false },
    db: { schema: "public" },
  });
  return _client;
}

export function isSupabaseAvailable(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;
  return Boolean(url && key);
}

/**
 * Asegura que la tabla kv_store exista (idempotente).
 * Se llama una sola vez al inicio; Supabase crea la tabla via SQL
 * pero esto es un safety net para entornos donde no se haya hecho el setup.
 */
export async function ensureKvTable(): Promise<void> {
  const client = getClient();
  try {
    await client.rpc("ensure_kv_store_table");
  } catch {
    /* la tabla puede no existir todavía — se crea manualmente vía SQL */
  }
}

export async function storageGetSupabase<T>(
  collection: string,
  id: string
): Promise<T | null> {
  const client = getClient();
  const { data, error } = await client
    .from("kv_store")
    .select("data")
    .eq("collection", collection)
    .eq("id", id)
    .single();

  if (error && error.code !== "PGRST116") {
    // PGRST116 = row not found — no es un error real
    console.error("[supabase-get]", error.message);
    return null;
  }
  if (!data) return null;
  return data.data as T;
}

export async function storageSetSupabase(
  collection: string,
  id: string,
  value: unknown
): Promise<void> {
  const client = getClient();
  const { error } = await client.from("kv_store").upsert({
    collection,
    id,
    data: value,
    updated_at: new Date().toISOString(),
  });

  if (error) {
    console.error("[supabase-set]", error.message);
    throw error;
  }
}

export async function storageListSupabase<T>(
  collection: string
): Promise<T[]> {
  const client = getClient();
  const { data, error } = await client
    .from("kv_store")
    .select("data")
    .eq("collection", collection)
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("[supabase-list]", error.message);
    return [];
  }
  if (!data) return [];
  return data.map((row) => row.data as T);
}

export async function storageDeleteSupabase(
  collection: string,
  id: string
): Promise<void> {
  const client = getClient();
  const { error } = await client
    .from("kv_store")
    .delete()
    .eq("collection", collection)
    .eq("id", id);

  if (error) {
    console.error("[supabase-delete]", error.message);
  }
}

/**
 * SQL para crear la tabla kv_store (ejecutar una vez en Supabase SQL editor):
 *
 * CREATE TABLE kv_store (
 *   collection   TEXT NOT NULL,
 *   id           TEXT NOT NULL,
 *   data         JSONB,
 *   updated_at   TIMESTAMPTZ DEFAULT now(),
 *   PRIMARY KEY (collection, id)
 * );
 *
 * CREATE INDEX idx_kv_collection ON kv_store(collection);
 *
 * -- Para migrar datos desde Redis (export dump → import):
 * -- INSERT INTO kv_store(collection, id, data) VALUES (...);
 */
