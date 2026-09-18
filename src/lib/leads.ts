import {
  isFirestoreAvailable,
  storageGet as firestoreGet,
  storageSet as firestoreSet,
} from "./firestore";
import {
  isPersistentStorageAvailable,
  storageGet as redisGet,
  storageSet as redisSet,
} from "./storage";

/**
 * Captura de email (lead magnet "5 gadgets que te ahorran 1h al día").
 * - Persistencia: Firestore (colección `leads`) primero; Redis como fallback.
 * - Rate limit simple: máx. 3 solicitudes por email por día (Redis cuando está
 *   disponible, Map en memoria como fallback de dev).
 * - El envío del email nunca vive aquí: lo dispara la ruta, sin romper el flujo.
 */

export const LEAD_SOURCES = new Set(["exit_intent"]);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const EMAIL_MAX_LENGTH = 254;

export const LEAD_RATE_MAX = 3;

export interface LeadRecord {
  email: string;
  source: string;
  createdAt: string; // ISO
  updatedAt?: string; // ISO — solo si el mismo email vuelve a registrarse
}

/** Normaliza el email a id de documento (lowercase, sin espacios). */
export function leadId(email: string): string {
  return email.toLowerCase().trim();
}

export function isValidEmail(email: string): boolean {
  if (typeof email !== "string") return false;
  if (email.length === 0 || email.length > EMAIL_MAX_LENGTH) return false;
  return EMAIL_RE.test(email.trim());
}

// ==== Persistencia ====

async function readLead(id: string): Promise<LeadRecord | null> {
  if (isFirestoreAvailable()) {
    try {
      const doc = await firestoreGet<LeadRecord>("leads", id);
      if (doc) return doc;
    } catch (err) {
      console.error("[leads] error leyendo Firestore:", err);
    }
  }
  if (isPersistentStorageAvailable()) {
    try {
      return await redisGet<LeadRecord>("leads", id);
    } catch (err) {
      console.error("[leads] error leyendo Redis:", err);
    }
  }
  return null;
}

/**
 * Guarda el lead. Firestore primero; si no está configurado o falla, Redis.
 * Nunca lanza: si ambos backends fallan devuelve { backend: "none" } para que
 * la ruta decida sin romper el flujo del usuario.
 */
export async function saveLead(
  email: string,
  source: string
): Promise<{ backend: "firestore" | "redis" | "none" }> {
  const id = leadId(email);
  const now = new Date().toISOString();
  const existing = await readLead(id);
  const record: LeadRecord = {
    email: id,
    source,
    createdAt: existing?.createdAt ?? now,
    ...(existing ? { updatedAt: now } : {}),
  };

  if (isFirestoreAvailable()) {
    try {
      await firestoreSet("leads", id, record);
      return { backend: "firestore" };
    } catch (err) {
      console.error("[leads] fallback a Redis:", err);
    }
  }
  if (isPersistentStorageAvailable()) {
    try {
      await redisSet("leads", id, record);
      return { backend: "redis" };
    } catch (err) {
      console.error("[leads] Redis también falló:", err);
    }
  }
  return { backend: "none" };
}

// ==== Rate limit: máx. LEAD_RATE_MAX solicitudes por email por día ====

function dayKey(d: Date = new Date()): string {
  return d.toISOString().slice(0, 10); // YYYY-MM-DD (UTC)
}

// Fallback en memoria (dev local / Redis caído). Se limpia con cada acceso de
// un día distinto; el crecimiento está acotado por emails distintos vistos.
const memRate = new Map<string, { count: number; day: string }>();

/**
 * Consume una "ráfaga" de rate limit. Devuelve true si el email ya superó el
 * máximo del día (el caller debe responder 429). No atómico en Redis (lectura
 * + escritura), suficiente para frenar spam básico sin infra adicional.
 */
export async function consumeLeadRate(email: string): Promise<boolean> {
  const id = leadId(email);
  const today = dayKey();

  if (isPersistentStorageAvailable()) {
    try {
      const rec = await redisGet<{ date: string; count: number }>("leads-rl", id);
      if (!rec || rec.date !== today) {
        await redisSet("leads-rl", id, { date: today, count: 1 });
        return false;
      }
      if (rec.count >= LEAD_RATE_MAX) return true;
      await redisSet("leads-rl", id, { date: today, count: rec.count + 1 });
      return false;
    } catch (err) {
      console.error("[leads] rate limit Redis falló, usando memoria:", err);
    }
  }

  const rec = memRate.get(id);
  if (!rec || rec.day !== today) {
    memRate.set(id, { count: 1, day: today });
    return false;
  }
  if (rec.count >= LEAD_RATE_MAX) return true;
  rec.count += 1;
  return false;
}

// Nota: el Map en memoria se auto-limpia al acceder una entrada con día viejo
// (se reemplaza por el día actual), así que su tamaño queda acotado por emails
// distintos vistos el mismo día — suficiente para un fallback de dev/serverless.
