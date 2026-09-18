// src/lib/support-escalations.ts
// Cola de escalaciones de soporte con aborto humano.
//
// Requisito del negocio: la IA atiende al cliente de punta a punta, PERO
// cualquier solicitud que el bot quiera enviar en nombre del cliente (o que
// comprometa dinero, reposición, reembolso o una promesa) NO sale sin que un
// humano pueda revisarla y ABORTARLA. El humano autoriza/aborta; no redacta.
//
// Diseño:
//  - `pending`  → esperando decisión humana. El bot NO ha enviado nada.
//  - `approved` → el humano aprobó; el bot lo envía (o ya lo envió).
//  - `aborted`  → el humano lo canceló. Nunca sale.
//  - `expired`  → pasó el TTL sin decisión → se aborta por defecto (fail-safe).
//
// Las respuestas de bajo riesgo (estado de pedido, envíos, catálogo) NO pasan
// por la cola: se contestan solas para mantener la operación 100% autónoma.
import { storageGet, storageSet, storageList } from "./storage";
import { notifyOwner } from "./automation/alert";

const COLLECTION = "support_escalations";

/** Ventana para que un humano aborte antes de que se aborte por defecto. */
export const ESCALATION_TTL_MS = Number(
  process.env.SUPPORT_ESCALATION_TTL_MS || 30 * 60 * 1000
);

export type EscalationStatus = "pending" | "approved" | "aborted" | "expired";

export type EscalationChannel = "chat" | "email" | "whatsapp" | "ticket";

export interface Escalation {
  id: string;
  createdAt: string;
  updatedAt: string;
  status: EscalationStatus;
  channel: EscalationChannel;
  /** Quién escribió (email, o "visitante" en el chat web). */
  customerRef: string;
  customerName?: string;
  orderId?: string;
  /** Mensaje original del cliente. */
  customerMessage: string;
  /** Respuesta que el bot propone enviar. */
  proposedReply: string;
  intent: string;
  /** Por qué se escaló (política de riesgo). */
  reason: string;
  /** Nivel de riesgo: `high` exige decisión humana explícita. */
  risk: "low" | "high";
  /** Acción interna que el bot quiere ejecutar (si aplica). */
  proposedAction?: {
    kind: "replacement" | "refund" | "discount" | "cancel" | "other";
    detail: string;
    amountUsd?: number;
  };
  decidedBy?: string;
  decidedAt?: string;
  abortReason?: string;
  /** Respuesta final enviada (si se aprobó y el canal la soporta). */
  sentAt?: string;
}

function id(): string {
  return `esc_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export async function listEscalations(status?: EscalationStatus): Promise<Escalation[]> {
  const all = await storageList<Escalation>(COLLECTION);
  const filtered = status ? all.filter((e) => e.status === status) : all;
  return filtered.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getEscalation(eid: string): Promise<Escalation | null> {
  return storageGet<Escalation>(COLLECTION, eid);
}

export async function createEscalation(
  input: Omit<Escalation, "id" | "createdAt" | "updatedAt" | "status">
): Promise<Escalation> {
  const now = new Date().toISOString();
  const esc: Escalation = {
    ...input,
    id: id(),
    createdAt: now,
    updatedAt: now,
    status: "pending",
  };
  await storageSet(COLLECTION, esc.id, esc);

  await notifyOwner(
    "support_escalation_pending",
    `🧑⚖️ Soporte: el bot quiere responder a ${esc.customerRef}${
      esc.orderId ? ` (pedido ${esc.orderId})` : ""
    } y espera tu visto bueno.\nMotivo: ${esc.reason}\n\nPropuesta:\n"${esc.proposedReply.slice(
      0,
      280
    )}"\n\nRevisa y ABORTA o APRUEBA en /admin → Escalaciones (se aborta solo en ${Math.round(
      ESCALATION_TTL_MS / 60000
    )} min).`,
    esc.risk === "high" ? "critical" : "warn"
  ).catch(() => {});

  return esc;
}

/** Aprueba: el humano autoriza el envío. */
export async function approveEscalation(
  eid: string,
  decidedBy: string,
  opts?: { finalReply?: string }
): Promise<Escalation | null> {
  const esc = await getEscalation(eid);
  if (!esc) return null;
  if (esc.status !== "pending") return esc;
  const now = new Date().toISOString();
  const next: Escalation = {
    ...esc,
    status: "approved",
    proposedReply: opts?.finalReply?.trim() || esc.proposedReply,
    decidedBy,
    decidedAt: now,
    updatedAt: now,
  };
  await storageSet(COLLECTION, eid, next);
  return next;
}

/** Aborta: el humano cancela. Nada se envía al cliente. */
export async function abortEscalation(
  eid: string,
  decidedBy: string,
  reason?: string
): Promise<Escalation | null> {
  const esc = await getEscalation(eid);
  if (!esc) return null;
  if (esc.status !== "pending") return esc;
  const now = new Date().toISOString();
  const next: Escalation = {
    ...esc,
    status: "aborted",
    decidedBy,
    decidedAt: now,
    abortReason: reason?.trim() || "Abortado por un humano",
    updatedAt: now,
  };
  await storageSet(COLLECTION, eid, next);
  await notifyOwner(
    "support_escalation_aborted",
    `🛑 Escalación abortada por ${decidedBy}: no se envió respuesta a ${esc.customerRef}.`,
    "info"
  ).catch(() => {});
  return next;
}

export async function markEscalationSent(eid: string): Promise<void> {
  const esc = await getEscalation(eid);
  if (!esc) return;
  const now = new Date().toISOString();
  await storageSet(COLLECTION, eid, { ...esc, sentAt: now, updatedAt: now });
}

/**
 * Expira escalaciones pendientes que pasaron el TTL.
 * Fail-safe: sin decisión humana, la solicitud NO sale.
 */
export async function expireStaleEscalations(): Promise<number> {
  const pending = await listEscalations("pending");
  const now = Date.now();
  let expired = 0;
  for (const esc of pending) {
    if (now - new Date(esc.createdAt).getTime() < ESCALATION_TTL_MS) continue;
    const iso = new Date().toISOString();
    await storageSet(COLLECTION, esc.id, {
      ...esc,
      status: "expired" as EscalationStatus,
      abortReason: "Sin decisión humana dentro del plazo (no se envió)",
      decidedAt: iso,
      updatedAt: iso,
    });
    expired++;
  }
  return expired;
}

/** ¿Cuántas esperan decisión humana? (para el badge del panel) */
export async function pendingEscalationCount(): Promise<number> {
  try {
    return (await listEscalations("pending")).length;
  } catch {
    return 0;
  }
}
