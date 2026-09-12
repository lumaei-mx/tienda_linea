import { NextResponse, type NextRequest } from "next/server";
import { readStoreSettings } from "./settings-db";
import { verifyTotpCode } from "./totp";

const COOKIE = "lumaei_admin";
const TWO_FA_COOKIE = "lumaei_admin_2fa";
const TOKEN_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const TWO_FA_TTL_MS = 5 * 60 * 1000; // 5 min para ingresar 2FA

function secret() {
  const s = process.env.ADMIN_SECRET;
  if (!s) throw new Error("ADMIN_SECRET no configurado");
  return s;
}

export function isAdminConfigured() {
  return Boolean(process.env.ADMIN_PASSWORD && process.env.ADMIN_SECRET);
}

async function sign(value: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function makeAdminToken() {
  const payload = btoa(JSON.stringify({ v: 1, t: Date.now() }));
  return `${payload}.${await sign(payload)}`;
}

export async function verifyAdminToken(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return false;
  const expected = await sign(payload);
  if (!safeEqual(sig, expected)) return false;
  try {
    const parsed = JSON.parse(atob(payload)) as { t?: number };
    if (typeof parsed.t === "number" && Date.now() - parsed.t > TOKEN_MAX_AGE_MS) {
      return false;
    }
  } catch {
    return false;
  }
  return true;
}

export async function checkPassword(password: string): Promise<boolean> {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  return safeEqual(password, expected);
}

export function adminCookie(token: string) {
  return `${COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${TOKEN_MAX_AGE_MS / 1000}`;
}

export function clearAdminCookie() {
  return `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}

export function twoFaCookie(token: string) {
  return `${TWO_FA_COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${TWO_FA_TTL_MS / 1000}`;
}

export function clearTwoFaCookie() {
  return `${TWO_FA_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}

export async function requireAdmin(
  req: NextRequest
): Promise<NextResponse | null> {
  const token = req.cookies.get(COOKIE)?.value;
  if (!(await verifyAdminToken(token))) {
    const url = new URL("/admin/login", req.url);
    return NextResponse.redirect(url);
  }
  return null;
}

export async function isAdminRequest(req: Request): Promise<boolean> {
  if (!isAdminConfigured()) return false;
  const header = req.headers.get("cookie") || "";
  const token = header
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${COOKIE}=`))
    ?.slice(COOKIE.length + 1);
  return verifyAdminToken(token);
}

/**
 * Verifica si el request tiene 2FA aprobado (cookie temporal post-password).
 */
export async function hasTwoFaApproved(req: Request): Promise<boolean> {
  const header = req.headers.get("cookie") || "";
  const token = header
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${TWO_FA_COOKIE}=`))
    ?.slice(TWO_FA_COOKIE.length + 1);
  if (!token) return false;
  try {
    const payload = JSON.parse(atob(token));
    if (payload.ts && Date.now() - payload.ts > TWO_FA_TTL_MS) return false;
    return payload.ok === true;
  } catch {
    return false;
  }
}

/**
 * Flujo de autenticación admin con 2FA opcional:
 * 1. POST /api/admin/login {password} → si 2FA activo: devuelve {need2fa:true}
 * 2. POST /api/admin/login/2fa {code} → si válido: devuelve {token, cookie}
 */
export async function verifyAdminAuth(password: string, code?: string): Promise<{
  ok: boolean;
  need2fa?: boolean;
  token?: string;
  cookie?: string;
  twoFaCookie?: string;
  error?: string;
}> {
  const settings = await readStoreSettings();
  const passwordOk = await checkPassword(password);
  if (!passwordOk) {
    return { ok: false, error: "Contraseña incorrecta" };
  }

  // Si 2FA está activo y no se envió code, pedir 2FA
  if (settings.twoFactorEnabled && !code) {
    return { ok: false, need2fa: true };
  }

  // Si 2FA activo, verificar code
  if (settings.twoFactorEnabled && code) {
    if (!settings.twoFactorSecret) {
      return { ok: false, error: "2FA mal configurado (sin secret)" };
    }
    const codeOk = await verifyTotpCode(settings.twoFactorSecret, code);
    if (!codeOk) {
      // Permitir recovery code (8 chars hex)
      const isRecovery = code.toUpperCase() === settings.twoFactorRecoveryCode?.toUpperCase();
      if (!isRecovery) {
        return { ok: false, error: "Código 2FA inválido" };
      }
      // Invalidate recovery code after use
      await import("./settings-db").then((m) =>
        m.updateStoreSettings({ twoFactorRecoveryCode: undefined })
      );
    }
  }

  // Generar token + cookie 2FA
  const token = await makeAdminToken();
  const twoFaToken = btoa(JSON.stringify({ ok: true, ts: Date.now() }));
  return {
    ok: true,
    token,
    cookie: adminCookie(token),
    twoFaCookie: twoFaCookie(twoFaToken),
  };
}

/**
 * Verifica si el usuario actual tiene rol suficiente para una acción.
 * owner = todo
 * admin = todo excepto gestión de admins/2FA
 * viewer = solo lectura
 */
export function hasRole(allowedRoles: Array<"owner" | "admin" | "viewer">) {
  return async (req: Request): Promise<boolean> => {
    if (!(await isAdminRequest(req))) return false;
    if (!(await hasTwoFaApproved(req))) return false;
    const settings = await readStoreSettings();
    const role = settings.adminRole || "owner";
    return allowedRoles.includes(role);
  };
}

export function isOwner(req: Request): Promise<boolean> {
  return hasRole(["owner", "admin"])(req);
}

export function isViewer(req: Request): Promise<boolean> {
  return hasRole(["owner", "admin", "viewer"])(req);
}