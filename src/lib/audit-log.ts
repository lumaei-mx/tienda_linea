import { storageGet, storageList, storageSet, isPersistentStorageAvailable } from "./storage";
import type { StoreSettings } from "./types";

const COLLECTION = "audit";
const MAX_ENTRIES = 5000;

export interface AuditEntry {
  id: string;
  timestamp: string; // ISO
  actor: string; // "admin:<email>" | "system:cron" | "system:webhook" | "bot:<id>"
  action: string; // "settings.update" | "product.price_change" | "order.approve" | "order.refund" | "promo.create" | "user.create" | "kill_switch.toggle"
  target: string; // "settings" | "product:<id>" | "order:<id>" | "promo:<code>" | "user:<id>" | "kill_switch:<name>"
  before?: unknown;
  after?: unknown;
  meta?: Record<string, unknown>; // ip, userAgent, requestId, correlationId
  severity: "info" | "warn" | "critical";
}

/** Genera ID único corto para auditoría */
function auditId(): string {
  return `aud_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/** Obtiene identidad del actor desde request (para Route Handlers) */
export function getActorFromRequest(req: Request): string {
  const cookie = req.headers.get("cookie") || "";
  const adminEmail = cookie
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith("lumaei_admin_email="))
    ?.slice("lumaei_admin_email=".length);
  if (adminEmail) return `admin:${decodeURIComponent(adminEmail)}`;

  const ua = req.headers.get("user-agent") || "";
  if (ua.includes("vercel-cron") || ua.includes("cron-job")) return "system:cron";
  if (ua.includes("stripe")) return "system:webhook";
  return "system:unknown";
}

/** Registra una entrada de auditoría (fire-and-forget, nunca falla la request principal) */
export async function recordAudit(entry: Omit<AuditEntry, "id" | "timestamp">): Promise<void> {
  const fullEntry: AuditEntry = {
    ...entry,
    id: auditId(),
    timestamp: new Date().toISOString(),
  };

  if (!isPersistentStorageAvailable()) {
    // Fallback: solo console en dev
    console.log("[AUDIT]", JSON.stringify(fullEntry));
    return;
  }

  try {
    // Guardar entrada individual
    await storageSet(COLLECTION, fullEntry.id, fullEntry);

    // Mantener índice ordenado por timestamp (lista de IDs)
    const indexKey = "audit:index";
    const existing = (await storageGet<string[]>(COLLECTION, indexKey)) || [];
    existing.unshift(fullEntry.id);
    if (existing.length > MAX_ENTRIES) existing.length = MAX_ENTRIES;
    await storageSet(COLLECTION, indexKey, existing);
  } catch (e) {
    // Silencioso: auditoría no debe romper operaciones
    console.warn("[AUDIT] failed to persist:", e);
  }
}

/** Helper para acciones comunes */
export const Audit = {
  settingsUpdate: (actor: string, before: Partial<StoreSettings>, after: Partial<StoreSettings>, meta?: Record<string, unknown>) =>
    recordAudit({
      actor,
      action: "settings.update",
      target: "settings",
      before,
      after,
      meta,
      severity: "warn",
    }),

  productPriceChange: (actor: string, productId: string, beforePrice: number, afterPrice: number, reason: string, meta?: Record<string, unknown>) =>
    recordAudit({
      actor,
      action: "product.price_change",
      target: `product:${productId}`,
      before: { priceUsd: beforePrice },
      after: { priceUsd: afterPrice, reason },
      meta,
      severity: "info",
    }),

  productStatusChange: (actor: string, productId: string, beforeActive: boolean, afterActive: boolean, meta?: Record<string, unknown>) =>
    recordAudit({
      actor,
      action: "product.status_change",
      target: `product:${productId}`,
      before: { active: beforeActive },
      after: { active: afterActive },
      meta,
      severity: "warn",
    }),

  orderApprove: (actor: string, orderId: string, meta?: Record<string, unknown>) =>
    recordAudit({
      actor,
      action: "order.approve",
      target: `order:${orderId}`,
      after: { status: "fulfillment_queued" },
      meta,
      severity: "info",
    }),

  orderRefund: (actor: string, orderId: string, amount: number, reason: string, meta?: Record<string, unknown>) =>
    recordAudit({
      actor,
      action: "order.refund",
      target: `order:${orderId}`,
      after: { amount, reason },
      meta,
      severity: "critical",
    }),

  promoCreate: (actor: string, code: string, config: unknown, meta?: Record<string, unknown>) =>
    recordAudit({
      actor,
      action: "promo.create",
      target: `promo:${code}`,
      after: config,
      meta,
      severity: "info",
    }),

  promoDelete: (actor: string, code: string, meta?: Record<string, unknown>) =>
    recordAudit({
      actor,
      action: "promo.delete",
      target: `promo:${code}`,
      meta,
      severity: "warn",
    }),

  killSwitchToggle: (actor: string, switchName: string, before: boolean, after: boolean, meta?: Record<string, unknown>) =>
    recordAudit({
      actor,
      action: "kill_switch.toggle",
      target: `kill_switch:${switchName}`,
      before: { enabled: before },
      after: { enabled: after },
      meta,
      severity: "critical",
    }),

  userAction: (actor: string, userId: string, action: string, before?: unknown, after?: unknown, meta?: Record<string, unknown>) =>
    recordAudit({
      actor,
      action: `user.${action}`,
      target: `user:${userId}`,
      before,
      after,
      meta,
      severity: "info",
    }),
};

/** Lee auditoría con paginación y filtros */
export async function readAuditLog(opts?: {
  limit?: number;
  offset?: number;
  actor?: string;
  action?: string;
  target?: string;
  severity?: "info" | "warn" | "critical";
  from?: string; // ISO date
  to?: string;
}): Promise<{ entries: AuditEntry[]; total: number }> {
  if (!isPersistentStorageAvailable()) return { entries: [], total: 0 };

  try {
    const index = (await storageGet<string[]>(COLLECTION, "audit:index")) || [];
    let ids = index;

    // Filtros simples (en producción usar Redis search o BD dedicada)
    const entries: AuditEntry[] = [];
    for (const id of ids) {
      if (entries.length >= (opts?.limit ?? 100)) break;
      const entry = await storageGet<AuditEntry>(COLLECTION, id);
      if (!entry) continue;

      if (opts?.actor && entry.actor !== opts.actor) continue;
      if (opts?.action && entry.action !== opts.action) continue;
      if (opts?.target && entry.target !== opts.target) continue;
      if (opts?.severity && entry.severity !== opts.severity) continue;
      if (opts?.from && entry.timestamp < opts.from) continue;
      if (opts?.to && entry.timestamp > opts.to) continue;

      entries.push(entry);
    }

    return { entries, total: index.length };
  } catch {
    return { entries: [], total: 0 };
  }
}

/** Limpia auditoría antigua (ejecutar en cron mensual) */
export async function pruneAuditLog(olderThanDays = 90): Promise<number> {
  if (!isPersistentStorageAvailable()) return 0;
  const cutoff = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000).toISOString();
  let deleted = 0;

  try {
    const index = (await storageGet<string[]>(COLLECTION, "audit:index")) || [];
    const keep: string[] = [];

    for (const id of index) {
      const entry = await storageGet<AuditEntry>(COLLECTION, id);
      if (!entry || entry.timestamp < cutoff) {
        // Eliminar entrada
        await storageSet(COLLECTION, id, null); // storageDelete no expuesto, usamos set null
        deleted++;
      } else {
        keep.push(id);
      }
    }

    await storageSet(COLLECTION, "audit:index", keep);
    return deleted;
  } catch {
    return 0;
  }
}