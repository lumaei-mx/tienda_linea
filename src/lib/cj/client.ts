import { promises as fs } from "fs";
import path from "path";
import type { CjApiResponse, CjTokenData } from "./types";
import {
  isRedisAvailable,
  storageGet,
  storageSet,
} from "@/lib/storage";

const TOKEN_COLLECTION = "meta";
const TOKEN_DOC = "cj_token";

const BASE =
  process.env.CJ_API_BASE || "https://developers.cjdropshipping.com/api2.0/v1";
const TOKEN_FILE = path.join(process.cwd(), "data", "cj-token.json");

let memoryToken: CjTokenData | null = null;
let lastCallAt = 0;

function isSuccess(res: CjApiResponse) {
  return (
    res.result === true ||
    res.success === true ||
    res.code === 200 ||
    res.code === 0
  );
}

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

/** CJ QPS ~1 — simple throttle */
async function throttle() {
  const wait = 1100 - (Date.now() - lastCallAt);
  if (wait > 0) await sleep(wait);
  lastCallAt = Date.now();
}

async function readStoredToken(): Promise<CjTokenData | null> {
  if (memoryToken) return memoryToken;
  if (isRedisAvailable()) {
    try {
      const stored = await storageGet<CjTokenData>(TOKEN_COLLECTION, TOKEN_DOC);
      if (stored) {
        memoryToken = stored;
        return stored;
      }
    } catch {
      /* sigue a filesystem */
    }
  }
  try {
    const raw = await fs.readFile(TOKEN_FILE, "utf8");
    memoryToken = JSON.parse(raw) as CjTokenData;
    return memoryToken;
  } catch {
    return null;
  }
}

async function storeToken(data: CjTokenData) {
  memoryToken = data;
  if (isRedisAvailable()) {
    try {
      await storageSet(TOKEN_COLLECTION, TOKEN_DOC, data);
    } catch {
      /* ignora */
    }
  }
  // Skip filesystem in production (Cloudflare Workers / serverless)
  if (process.env.NODE_ENV !== "production") {
    await fs.mkdir(path.dirname(TOKEN_FILE), { recursive: true });
    await fs.writeFile(TOKEN_FILE, JSON.stringify(data, null, 2), "utf8");
  }
}

export function isCjConfigured() {
  return Boolean(
    process.env.CJ_API_KEY ||
      process.env.CJ_ACCESS_TOKEN ||
      process.env.CJ_REFRESH_TOKEN
  );
}

export async function getAccessToken(): Promise<string> {
  const apiKey = process.env.CJ_API_KEY;

  // API Key (tipo "API Key", con bizName/API Store asociada) tiene prioridad.
  // Usa caché solo si el token fue obtenido con API Key, para no reutilizar un
  // token MCP viejo que no tiene bizName (falla createOrderV2 con 5016).
  if (apiKey) {
    const cached = await readStoredToken();
    if (
      cached?.accessToken &&
      (cached as { source?: string }).source === "apikey"
    ) {
      if (cached.accessTokenExpiryDate) {
        const exp = new Date(cached.accessTokenExpiryDate).getTime();
        if (Date.now() < exp - 24 * 60 * 60 * 1000) return cached.accessToken;
      } else {
        return cached.accessToken;
      }
    }
    await throttle();
    const res = await fetch(`${BASE}/authentication/getAccessToken`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ apiKey }),
    });
    const json = (await res.json()) as CjApiResponse<CjTokenData>;
    if (!isSuccess(json) || !json.data?.accessToken) {
      throw new Error(`CJ auth falló: ${json.message || res.status}`);
    }
    await storeToken({ ...json.data, source: "apikey" } as CjTokenData);
    return json.data.accessToken;
  }

  // Token directo (útil si ya tienes JWT)
  if (process.env.CJ_ACCESS_TOKEN) {
    return process.env.CJ_ACCESS_TOKEN;
  }

  const stored = await readStoredToken();
  if (stored?.accessToken) {
    if (stored.accessTokenExpiryDate) {
      const exp = new Date(stored.accessTokenExpiryDate).getTime();
      // refrescar 1 día antes
      if (Date.now() < exp - 24 * 60 * 60 * 1000) {
        return stored.accessToken;
      }
      if (stored.refreshToken) {
        return refreshAccessToken(stored.refreshToken);
      }
    } else {
      return stored.accessToken;
    }
  }

  if (process.env.CJ_REFRESH_TOKEN) {
    return refreshAccessToken(process.env.CJ_REFRESH_TOKEN);
  }

  throw new Error("Configura CJ_API_KEY o CJ_ACCESS_TOKEN en .env.local");
}

async function refreshAccessToken(refreshToken: string): Promise<string> {
  await throttle();
  const res = await fetch(`${BASE}/authentication/refreshAccessToken`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });
  const json = (await res.json()) as CjApiResponse<CjTokenData>;
  if (!isSuccess(json) || !json.data?.accessToken) {
    // fallback a api key
    if (process.env.CJ_API_KEY) {
      memoryToken = null;
      try {
        await fs.unlink(TOKEN_FILE);
      } catch {
        /* ignore */
      }
      return getAccessToken();
    }
    throw new Error(`CJ refresh falló: ${json.message || res.status}`);
  }
  await storeToken({
    ...json.data,
    refreshToken: json.data.refreshToken || refreshToken,
  });
  return json.data.accessToken;
}

export async function cjRequest<T>(
  endpoint: string,
  options: {
    method?: "GET" | "POST";
    params?: Record<string, string | number | boolean | undefined>;
    body?: Record<string, unknown>;
    skipAuth?: boolean;
  } = {}
): Promise<T> {
  const { method = "GET", params, body, skipAuth = false } = options;
  await throttle();

  const url = new URL(`${BASE}${endpoint}`);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== "") url.searchParams.set(k, String(v));
    }
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (!skipAuth) {
    headers["CJ-Access-Token"] = await getAccessToken();
  }

  const res = await fetch(url.toString(), {
    method,
    headers,
    body: body && method !== "GET" ? JSON.stringify(body) : undefined,
  });

  const json = (await res.json()) as CjApiResponse<T>;
  if (!isSuccess(json)) {
    throw new Error(
      `CJ ${endpoint}: ${json.message || "error"} (code ${json.code})`
    );
  }
  return json.data;
}

export async function testCjConnection() {
  if (!isCjConfigured()) {
    return { ok: false as const, mode: "unconfigured" as const };
  }
  try {
    await getAccessToken();
    return {
      ok: true as const,
      mode: "live" as const,
    };
  } catch (err) {
    return {
      ok: false as const,
      mode: "error" as const,
      error: err instanceof Error ? err.message : "error",
    };
  }
}

/**
 * ¿El error es "balance insuficiente" en CJ? (code 1604000 / Balance is
 * insufficient). Estos errores NO se resuelven reintentando: la cuenta CJ
 * necesita fondos. Reintentarlos a ciegas solo genera ruido y gasto de API.
 */
export function isCjBalanceError(msg: string): boolean {
  return /1604000|balance\s+is\s+insufficient|insufficient\s+balance/i.test(
    msg || ""
  );
}

/**
 * ¿El error es "la orden ya existe en CJ"? (code 1603003 / Order exist).
 * Ocurre cuando un intento previo creó la orden CJ pero el proceso murió
 * antes de guardar cjOrderId (p. ej. payBalance falló). Reintentar no sirve:
 * hay que recuperar la orden existente en el panel CJ.
 */
export function isCjOrderExistsError(msg: string): boolean {
  return /1603003|order\s+exist|do\s+not\s+duplicate/i.test(msg || "");
}
