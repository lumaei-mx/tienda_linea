import { NextResponse, type NextRequest } from "next/server";
import { readStoreSettings } from "./settings-db";
import { verifyTotpCode } from "./totp";
import {
  adminUserCount,
  findAdminUserByEmail,
  getAdminUser,
  redeemAccessCode,
  toPublicAdminUser,
  touchLastLogin,
  verifyPassword,
  type AdminRole,
  type AdminUser,
} from "./admin-users";
import { recordAudit } from "./audit-log";

const COOKIE = "lumaei_admin";
const EMAIL_COOKIE = "lumaei_admin_email";
const ROLE_COOKIE = "lumaei_admin_role";
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

export interface AdminClaims {
  /** id de la cuenta; "bootstrap" cuando se entra con ADMIN_PASSWORD. */
  uid: string;
  email: string;
  role: AdminRole;
  t: number;
}

export async function makeAdminToken(claims: {
  uid: string;
  email: string;
  role: AdminRole;
}): Promise<string> {
  const payload = btoa(
    JSON.stringify({
      v: 2,
      uid: claims.uid,
      email: claims.email,
      role: claims.role,
      t: Date.now(),
    })
  );
  return `${payload}.${await sign(payload)}`;
}

/** Verifica firma y vigencia; devuelve las claims o null. */
export async function readAdminClaims(
  token: string | undefined
): Promise<AdminClaims | null> {
  if (!token) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  const expected = await sign(payload);
  if (!safeEqual(sig, expected)) return null;
  try {
    const parsed = JSON.parse(atob(payload)) as Partial<AdminClaims>;
    if (typeof parsed.t === "number" && Date.now() - parsed.t > TOKEN_MAX_AGE_MS) {
      return null;
    }
    return {
      uid: typeof parsed.uid === "string" ? parsed.uid : "bootstrap",
      email: typeof parsed.email === "string" ? parsed.email : "owner@lumaei.com",
      role: (parsed.role as AdminRole) || "owner",
      t: typeof parsed.t === "number" ? parsed.t : 0,
    };
  } catch {
    return null;
  }
}

/** Compat: boolean de firma válida. */
export async function verifyAdminToken(token: string | undefined): Promise<boolean> {
  return (await readAdminClaims(token)) !== null;
}

export async function checkPassword(password: string): Promise<boolean> {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  return safeEqual(password, expected);
}

function cookieStr(name: string, value: string, maxAgeSec: number, httpOnly = true) {
  return `${name}=${encodeURIComponent(value)}; Path=/; ${
    httpOnly ? "HttpOnly; " : ""
  }Secure; SameSite=Lax; Max-Age=${maxAgeSec}`;
}

export function adminCookie(token: string) {
  return cookieStr(COOKIE, token, TOKEN_MAX_AGE_MS / 1000);
}

export function clearAdminCookie() {
  return cookieStr(COOKIE, "", 0);
}

export function adminIdentityCookies(claims: AdminClaims) {
  return [
    cookieStr(EMAIL_COOKIE, claims.email, TOKEN_MAX_AGE_MS / 1000, false),
    cookieStr(ROLE_COOKIE, claims.role, TOKEN_MAX_AGE_MS / 1000, false),
  ];
}

export function clearAdminIdentityCookies() {
  return [
    cookieStr(EMAIL_COOKIE, "", 0, false),
    cookieStr(ROLE_COOKIE, "", 0, false),
  ];
}

export function twoFaCookie(token: string) {
  return cookieStr(TWO_FA_COOKIE, token, TWO_FA_TTL_MS / 1000);
}

export function clearTwoFaCookie() {
  return cookieStr(TWO_FA_COOKIE, "", 0);
}

function readCookie(req: Request, name: string): string | undefined {
  const header = req.headers.get("cookie") || "";
  const raw = header
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${name}=`))
    ?.slice(name.length + 1);
  if (!raw) return undefined;
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

export async function requireAdmin(req: NextRequest): Promise<NextResponse | null> {
  const token = req.cookies.get(COOKIE)?.value;
  if (!(await verifyAdminToken(token))) {
    const url = new URL("/admin/login", req.url);
    return NextResponse.redirect(url);
  }
  return null;
}

export async function isAdminRequest(req: Request): Promise<boolean> {
  if (!isAdminConfigured()) return false;
  return verifyAdminToken(readCookie(req, COOKIE));
}

export async function getAdminClaims(req: Request): Promise<AdminClaims | null> {
  if (!isAdminConfigured()) return null;
  return readAdminClaims(readCookie(req, COOKIE));
}

/**
 * Verifica si el request tiene 2FA aprobado (cookie temporal post-password).
 * El bootstrap (ADMIN_PASSWORD) se considera aprobado: es el dueño.
 */
export async function hasTwoFaApproved(req: Request): Promise<boolean> {
  const claims = await getAdminClaims(req);
  if (claims?.uid === "bootstrap") return true;
  const token = readCookie(req, TWO_FA_COOKIE);
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
 * Resuelve el rol EFECTIVO del request.
 * - Bootstrap (ADMIN_PASSWORD): owner.
 * - Cuenta real: se relee de storage, así revocar/deshabilitar surte efecto
 *   inmediato sin esperar a que expire la cookie de 7 días.
 */
export async function effectiveRole(req: Request): Promise<AdminRole | null> {
  const claims = await getAdminClaims(req);
  if (!claims) return null;
  if (claims.uid === "bootstrap") return "owner";

  const user = await getAdminUser(claims.uid);
  if (!user) return null;
  if (user.status !== "active") return null;
  return user.role;
}

/**
 * Guard de rol para Route Handlers.
 * `owner` = todo · `admin` = todo excepto cuentas/2FA · `viewer` = solo lectura.
 */
export function hasRole(allowedRoles: AdminRole[]) {
  return async (req: Request): Promise<boolean> => {
    if (!(await isAdminRequest(req))) return false;
    const role = await effectiveRole(req);
    if (!role) return false;
    return allowedRoles.includes(role);
  };
}

/** Escritura general (productos, promos, settings, aprobar pedidos). */
export const isOwner = hasRole(["owner", "admin"]);
/** Lectura. */
export const isViewer = hasRole(["owner", "admin", "viewer"]);
/** Gestión de cuentas admin y 2FA: solo owner. */
export const isSuperOwner = hasRole(["owner"]);

export type { AdminRole, AdminUser };
export { toPublicAdminUser };

export interface LoginResult {
  ok: boolean;
  need2fa?: boolean;
  needAccessCode?: boolean;
  token?: string;
  claims?: AdminClaims;
  user?: AdminUser;
  error?: string;
}

/**
 * Login del panel.
 *
 * Dos caminos:
 *  1. Cuenta real (email + password): rol propio, 2FA propio.
 *  2. Bootstrap: solo la contraseña global ADMIN_PASSWORD → owner. Se usa
 *     mientras no exista ninguna cuenta, para que el dueño nunca se quede
 *     fuera y pueda otorgar el primer acceso.
 */
export async function verifyAdminAuth(
  password: string,
  code?: string,
  email?: string
): Promise<LoginResult> {
  const wantsAccount = Boolean(email && email.trim());

  // --- camino 1: cuenta real ---
  if (wantsAccount) {
    const user = await findAdminUserByEmail(email!);
    if (!user) return { ok: false, error: "Credenciales inválidas" };
    if (user.status !== "active") return { ok: false, error: "Cuenta deshabilitada" };
    if (user.accessCodeHash) {
      return {
        ok: false,
        needAccessCode: true,
        error: "Esta cuenta necesita canjear su código de acceso",
      };
    }
    if (!(await verifyPassword(password, user.passwordHash, user.passwordSalt))) {
      return { ok: false, error: "Credenciales inválidas" };
    }
    if (user.twoFactorEnabled) {
      if (!code) return { ok: false, need2fa: true };
      if (!user.twoFactorSecret) {
        return { ok: false, error: "2FA mal configurado (sin secret)" };
      }
      const codeOk = await verifyTotpCode(user.twoFactorSecret, code);
      const isRecovery =
        user.twoFactorRecoveryCode &&
        code.toUpperCase() === user.twoFactorRecoveryCode.toUpperCase();
      if (!codeOk && !isRecovery) return { ok: false, error: "Código 2FA inválido" };
    }
    const claims: AdminClaims = {
      uid: user.id,
      email: user.email,
      role: user.role,
      t: Date.now(),
    };
    await touchLastLogin(user);
    await recordAudit({
      actor: `admin:${user.email}`,
      action: "user.login",
      target: `user:${user.id}`,
      severity: "info",
    });
    return { ok: true, claims, token: await makeAdminToken(claims), user };
  }

  // --- camino 2: bootstrap con ADMIN_PASSWORD ---
  const passwordOk = await checkPassword(password);
  if (!passwordOk) return { ok: false, error: "Credenciales inválidas" };

  const settings = await readStoreSettings();
  if (settings.twoFactorEnabled && !code) return { ok: false, need2fa: true };
  if (settings.twoFactorEnabled && code) {
    if (!settings.twoFactorSecret) {
      return { ok: false, error: "2FA mal configurado (sin secret)" };
    }
    const codeOk = await verifyTotpCode(settings.twoFactorSecret, code);
    const isRecovery =
      code.toUpperCase() === settings.twoFactorRecoveryCode?.toUpperCase();
    if (!codeOk && !isRecovery) return { ok: false, error: "Código 2FA inválido" };
    if (!codeOk && isRecovery) {
      await import("./settings-db").then((m) =>
        m.updateStoreSettings({ twoFactorRecoveryCode: undefined })
      );
    }
  }

  const claims: AdminClaims = {
    uid: "bootstrap",
    email: "owner@lumaei.com",
    role: "owner",
    t: Date.now(),
  };
  return { ok: true, claims, token: await makeAdminToken(claims) };
}

/** Primer ingreso: canjear el código de acceso y fijar contraseña. */
export async function redeemAccess(
  email: string,
  code: string,
  newPassword: string
): Promise<LoginResult> {
  const result = await redeemAccessCode(email, code, newPassword);
  if (!result.ok) return { ok: false, error: result.error };
  const user = await findAdminUserByEmail(email);
  if (!user) return { ok: false, error: "Cuenta no encontrada" };
  const claims: AdminClaims = {
    uid: user.id,
    email: user.email,
    role: user.role,
    t: Date.now(),
  };
  await recordAudit({
    actor: `admin:${user.email}`,
    action: "user.login",
    target: `user:${user.id}`,
    after: { via: "access_code" },
    severity: "warn",
  });
  return { ok: true, claims, token: await makeAdminToken(claims), user };
}

/** ¿El panel está en modo bootstrap (sin cuentas reales)? */
export async function isBootstrapMode(): Promise<boolean> {
  return (await adminUserCount()) === 0;
}
