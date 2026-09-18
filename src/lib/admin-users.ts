// src/lib/admin-users.ts
// Cuentas de administración reales con roles y otorgamiento de acceso.
//
// Antes solo existía una contraseña global (ADMIN_PASSWORD) y un campo
// `adminRole` que decía "el rol del usuario actual" — pero no había usuarios,
// ni invitaciones, ni forma de otorgar acceso, y `hasRole()` nunca se usaba.
// Aquí viven las cuentas por persona y su rol.
//
// Bootstrap: si no existe ningún usuario, ADMIN_PASSWORD actúa como owner
// (así el dueño nunca se queda fuera del panel).
import { storageGet, storageSet, storageList, storageDelete } from "./storage";
import { recordAudit } from "./audit-log";

const COLLECTION = "admin_users";

export type AdminRole = "owner" | "admin" | "viewer";

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
  /** Salt + hash PBKDF2-SHA256 del password (nunca el password en claro). */
  passwordHash: string;
  passwordSalt: string;
  status: "active" | "disabled";
  createdAt: string;
  createdBy: string;
  lastLoginAt?: string;
  /** Código de un solo uso para que la persona establezca su contraseña. */
  accessCodeHash?: string;
  accessCodeExpiresAt?: string;
  twoFactorSecret?: string;
  twoFactorEnabled?: boolean;
  twoFactorRecoveryCode?: string;
}

/** Vista segura: nunca expone hashes ni códigos de acceso. */
export interface PublicAdminUser {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
  status: "active" | "disabled";
  createdAt: string;
  createdBy: string;
  lastLoginAt?: string;
  twoFactorEnabled: boolean;
  /** true si tiene un código de acceso pendiente de canjear. */
  pendingAccess: boolean;
}

export function toPublicAdminUser(u: AdminUser): PublicAdminUser {
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role,
    status: u.status,
    createdAt: u.createdAt,
    createdBy: u.createdBy,
    lastLoginAt: u.lastLoginAt,
    twoFactorEnabled: Boolean(u.twoFactorEnabled),
    pendingAccess: Boolean(u.accessCodeHash),
  };
}

// ==== Hashing (PBKDF2-SHA256, WebCrypto: funciona en Workers) ====

const PBKDF2_ITERATIONS = 100_000;

function toHex(buf: ArrayBuffer): string {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function randomToken(bytes = 16): string {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  return [...arr].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function hashPassword(
  password: string,
  salt?: string
): Promise<{ hash: string; salt: string }> {
  const useSalt = salt || randomToken(16);
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: new TextEncoder().encode(useSalt),
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    key,
    256
  );
  return { hash: toHex(bits), salt: useSalt };
}

export async function verifyPassword(
  password: string,
  hash: string,
  salt: string
): Promise<boolean> {
  if (!password || !hash || !salt) return false;
  const { hash: candidate } = await hashPassword(password, salt);
  if (candidate.length !== hash.length) return false;
  let diff = 0;
  for (let i = 0; i < candidate.length; i++) {
    diff |= candidate.charCodeAt(i) ^ hash.charCodeAt(i);
  }
  return diff === 0;
}

// ==== CRUD ====

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isAdminEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export async function listAdminUsers(): Promise<AdminUser[]> {
  const users = await storageList<AdminUser>(COLLECTION);
  return users.sort((a, b) => a.email.localeCompare(b.email));
}

export async function findAdminUserByEmail(
  email: string
): Promise<AdminUser | null> {
  const target = normalizeEmail(email);
  if (!target) return null;
  const users = await storageList<AdminUser>(COLLECTION);
  return users.find((u) => normalizeEmail(u.email) === target) || null;
}

export async function getAdminUser(id: string): Promise<AdminUser | null> {
  return storageGet<AdminUser>(COLLECTION, id);
}

/** Cuenta de usuarios: si es 0, el login cae al bootstrap ADMIN_PASSWORD. */
export async function adminUserCount(): Promise<number> {
  try {
    return (await listAdminUsers()).length;
  } catch {
    return 0;
  }
}

export interface CreateAdminUserInput {
  email: string;
  name: string;
  role: AdminRole;
  /** Si se omite, se genera un código de acceso de un solo uso. */
  password?: string;
  createdBy: string;
}

/**
 * Crea (o reactualiza) una cuenta de administración y otorga acceso.
 * Devuelve el código de acceso si no se dio password — el dueño se lo pasa a
 * la persona, que lo canjea en /admin/login para fijar su contraseña.
 */
export async function createAdminUser(input: CreateAdminUserInput): Promise<{
  user: AdminUser;
  accessCode?: string;
}> {
  const email = normalizeEmail(input.email);
  if (!isAdminEmail(email)) throw new Error("Email inválido");
  if (!input.name.trim()) throw new Error("Falta el nombre");

  const existing = await findAdminUserByEmail(email);
  const now = new Date().toISOString();

  let accessCode: string | undefined;
  let passwordHash: string;
  let passwordSalt: string;
  let accessCodeHash: string | undefined;
  let accessCodeExpiresAt: string | undefined;

  if (input.password) {
    const h = await hashPassword(input.password);
    passwordHash = h.hash;
    passwordSalt = h.salt;
  } else {
    accessCode = randomToken(12);
    // El hash del código debe usar el MISMO salt que se persiste: si se genera
    // un salt propio y no se guarda, el canje nunca puede verificar el código.
    const h = await hashPassword(randomToken(24));
    passwordHash = h.hash;
    passwordSalt = h.salt;
    accessCodeHash = (await hashPassword(accessCode, h.salt)).hash;
    accessCodeExpiresAt = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString();
  }

  const user: AdminUser = {
    id: existing?.id || `usr_${Date.now().toString(36)}_${randomToken(4)}`,
    email,
    name: input.name.trim(),
    role: input.role,
    passwordHash,
    passwordSalt,
    status: "active",
    createdAt: existing?.createdAt || now,
    createdBy: existing?.createdBy || input.createdBy,
    lastLoginAt: existing?.lastLoginAt,
    accessCodeHash,
    accessCodeExpiresAt,
    twoFactorSecret: existing?.twoFactorSecret,
    twoFactorEnabled: existing?.twoFactorEnabled,
    twoFactorRecoveryCode: existing?.twoFactorRecoveryCode,
  };

  await storageSet(COLLECTION, user.id, user);
  await recordAudit({
    actor: input.createdBy,
    action: existing ? "user.access_granted" : "user.create",
    target: `user:${user.id}`,
    after: { email: user.email, role: user.role, status: user.status },
    severity: "critical",
  });

  return { user, accessCode };
}

export async function updateAdminUser(
  id: string,
  patch: Partial<Pick<AdminUser, "name" | "role" | "status">>,
  actor: string
): Promise<AdminUser | null> {
  const existing = await getAdminUser(id);
  if (!existing) return null;

  // Nunca dejar el sistema sin un owner activo.
  if (
    existing.role === "owner" &&
    (patch.role && patch.role !== "owner" ? true : false ||
      patch.status === "disabled")
  ) {
    const owners = (await listAdminUsers()).filter(
      (u) => u.role === "owner" && u.status === "active" && u.id !== id
    );
    if (owners.length === 0) {
      throw new Error("Debe existir al menos un owner activo");
    }
  }

  const next: AdminUser = { ...existing, ...patch };
  await storageSet(COLLECTION, id, next);
  await recordAudit({
    actor,
    action: "user.update",
    target: `user:${id}`,
    before: { role: existing.role, status: existing.status, name: existing.name },
    after: { role: next.role, status: next.status, name: next.name },
    severity: "critical",
  });
  return next;
}

/** Revoca el acceso (borra la cuenta). No permite borrar al último owner. */
export async function deleteAdminUser(id: string, actor: string): Promise<boolean> {
  const existing = await getAdminUser(id);
  if (!existing) return false;
  if (existing.role === "owner") {
    const owners = (await listAdminUsers()).filter(
      (u) => u.role === "owner" && u.status === "active" && u.id !== id
    );
    if (owners.length === 0) throw new Error("Debe existir al menos un owner activo");
  }
  await storageDelete(COLLECTION, id);
  await recordAudit({
    actor,
    action: "user.delete",
    target: `user:${id}`,
    before: { email: existing.email, role: existing.role },
    severity: "critical",
  });
  return true;
}

/**
 * Canjea el código de acceso de un solo uso y fija la contraseña definitiva.
 * Es el paso con el que la persona "entra" al panel por primera vez.
 */
export async function redeemAccessCode(
  email: string,
  code: string,
  newPassword: string
): Promise<{ ok: boolean; error?: string }> {
  const user = await findAdminUserByEmail(email);
  if (!user) return { ok: false, error: "Cuenta no encontrada" };
  if (user.status !== "active") return { ok: false, error: "Cuenta deshabilitada" };
  if (!user.accessCodeHash) return { ok: false, error: "No hay código de acceso pendiente" };
  if (user.accessCodeExpiresAt && user.accessCodeExpiresAt < new Date().toISOString()) {
    return { ok: false, error: "El código de acceso expiró" };
  }
  if (newPassword.length < 10) {
    return { ok: false, error: "La contraseña debe tener al menos 10 caracteres" };
  }
  const codeOk = await verifyPassword(code, user.accessCodeHash, user.passwordSalt);
  if (!codeOk) return { ok: false, error: "Código de acceso inválido" };

  const h = await hashPassword(newPassword);
  await storageSet(COLLECTION, user.id, {
    ...user,
    passwordHash: h.hash,
    passwordSalt: h.salt,
    accessCodeHash: undefined,
    accessCodeExpiresAt: undefined,
  });
  await recordAudit({
    actor: `admin:${user.email}`,
    action: "user.password_set",
    target: `user:${user.id}`,
    severity: "critical",
  });
  return { ok: true };
}

/** Marca el último login (no bloquea la request si falla). */
export async function touchLastLogin(user: AdminUser): Promise<void> {
  try {
    await storageSet(COLLECTION, user.id, {
      ...user,
      lastLoginAt: new Date().toISOString(),
    });
  } catch {
    /* no crítico */
  }
}
