/**
 * Backend de Firestore (firebase-admin).
 *
 * firebase-admin no es compatible con Edge Runtime nativo, pero OpenNext
 * ejecuta el middleware con nodejs_compat, por lo que el require dinámico
 * de firebase-admin funciona dentro de las serverless functions.
 */
import { readFileSync } from "fs";

// Lazy import: firebase-admin solo se carga cuando getDb() es llamado
let _firebaseAdmin: {
  getApps: () => unknown[];
  initializeApp: (opts: unknown) => unknown;
  cert: (cred: unknown) => unknown;
  getFirestore: () => unknown;
} | null = null;

async function loadFirebaseAdmin() {
  if (!_firebaseAdmin) {
    const adminApp = await import("firebase-admin/app");
    const adminFirestore = await import("firebase-admin/firestore");
    _firebaseAdmin = {
      getApps: adminApp.getApps,
      initializeApp: adminApp.initializeApp,
      cert: adminApp.cert,
      getFirestore: adminFirestore.getFirestore,
    };
  }
  return _firebaseAdmin;
}

let _db: unknown = null;

function parseJson(v: string): any {
  try {
    return JSON.parse(v);
  } catch {
    return null;
  }
}

function credentials(): { projectId: string; clientEmail: string; privateKey: string } | null {
  const json = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (json) {
    const sa = parseJson(json);
    if (sa?.project_id && sa.client_email && sa.private_key) {
      return {
        projectId: sa.project_id,
        clientEmail: sa.client_email,
        privateKey: sa.private_key.replace(/\\n/g, "\n"),
      };
    }
  }
  const gacPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (gacPath) {
    try {
      const sa = parseJson(readFileSync(gacPath, "utf8"));
      if (sa?.project_id && sa.client_email && sa.private_key) {
        return {
          projectId: sa.project_id,
          clientEmail: sa.client_email,
          privateKey: sa.private_key.replace(/\\n/g, "\n"),
        };
      }
    } catch {
      /* ignora */
    }
  }
  if (
    process.env.FIREBASE_PROJECT_ID &&
    process.env.FIREBASE_CLIENT_EMAIL &&
    process.env.FIREBASE_PRIVATE_KEY
  ) {
    return {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    };
  }
  return null;
}

export function isFirestoreAvailable(): boolean {
  return Boolean(credentials());
}

async function getDb(): Promise<unknown> {
  if (_db) return _db;
  const cred = credentials();
  if (!cred) throw new Error("Firestore no configurado");
  const admin = (await loadFirebaseAdmin())!;
  if (!admin.getApps().length) {
    admin.initializeApp({ credential: admin.cert(cred), projectId: cred.projectId });
  }
  _db = admin.getFirestore();
  return _db;
}

function toJson(value: unknown): unknown {
  if (value === null || value === undefined) return value;
  if (typeof value === "bigint") return Number(value);
  if (Array.isArray(value)) return value.map(toJson);
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "object") {
    const v = value as Record<string, unknown>;
    if ("_seconds" in v && "_nanoseconds" in v) {
      return new Date(Number(v._seconds) * 1000).toISOString();
    }
    const out: Record<string, unknown> = {};
    for (const [k, val] of Object.entries(v)) out[k] = toJson(val);
    return out;
  }
  return value;
}

async function getDocData<T>(collection: string, id: string): Promise<T | null> {
  const db = await getDb();
  const snap = await (db as any).collection(collection).doc(id).get();
  if (!snap.exists) return null;
  return toJson(snap.data()) as T;
}

async function getAllDocs<T>(collection: string): Promise<T[]> {
  const db = await getDb();
  const snap = await (db as any).collection(collection).get();
  return snap.docs.map((d: any) => toJson(d.data()) as T);
}

async function setDocData(collection: string, id: string, data: unknown) {
  const db = await getDb();
  await (db as any).collection(collection).doc(id).set(data as Record<string, unknown>);
}

export async function storageGet<T>(collection: string, id: string): Promise<T | null> {
  if (!isFirestoreAvailable()) throw new Error("no-firestore");
  return await getDocData<T>(collection, id);
}

export async function storageList<T>(collection: string): Promise<T[]> {
  if (!isFirestoreAvailable()) throw new Error("no-firestore");
  return await getAllDocs<T>(collection);
}

export async function storageSet(collection: string, id: string, data: unknown) {
  if (!isFirestoreAvailable()) throw new Error("no-firestore");
  await setDocData(collection, id, data);
}

export async function storageDelete(collection: string, id: string) {
  if (!isFirestoreAvailable()) throw new Error("no-firestore");
  const db = await getDb();
  await (db as any).collection(collection).doc(id).delete();
}
