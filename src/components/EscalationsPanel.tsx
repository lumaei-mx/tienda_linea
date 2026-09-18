"use client";
// EscalationsPanel — donde el humano APRUEBA o ABORTA lo que el bot propone
// enviar al cliente. Nada con compromiso de dinero sale sin esta decisión.
// Fuente: GET /api/admin/escalations · POST {id, action: approve|abort}

import { useEffect, useState } from "react";
import { Check, X, Clock } from "lucide-react";

interface Escalation {
  id: string;
  createdAt: string;
  status: "pending" | "approved" | "aborted" | "expired";
  channel: string;
  customerRef: string;
  orderId?: string;
  customerMessage: string;
  proposedReply: string;
  intent: string;
  reason: string;
  risk: "low" | "high";
  proposedAction?: { kind: string; detail: string; amountUsd?: number };
  decidedBy?: string;
  abortReason?: string;
}

const STATUS_STYLE: Record<Escalation["status"], string> = {
  pending: "bg-amber-100 text-amber-900",
  approved: "bg-emerald-100 text-emerald-800",
  aborted: "bg-red-100 text-red-800",
  expired: "bg-stone-200 text-stone-700",
};

const ACTION_LABEL: Record<string, string> = {
  replacement: "Reposición",
  refund: "Reembolso",
  discount: "Descuento",
  cancel: "Cancelación",
  other: "Otra acción",
};

export function EscalationsPanel() {
  const [items, setItems] = useState<Escalation[]>([]);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [showDecided, setShowDecided] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/escalations");
      const d = await res.json();
      if (res.ok) setItems(d.escalations || []);
      else setMsg(d.error || "No autorizado");
    } catch {
      setMsg("Error cargando escalaciones");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function decide(
    id: string,
    action: "approve" | "abort",
    extra?: { finalReply?: string; reason?: string }
  ) {
    setBusy(id);
    setMsg("");
    try {
      const res = await fetch("/api/admin/escalations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action, ...extra }),
      });
      const d = await res.json();
      if (!res.ok) {
        setMsg(d.error || "No se pudo aplicar la decisión");
        return;
      }
      setItems((xs) => xs.map((x) => (x.id === id ? d.escalation : x)));
      setEditing(null);
      setMsg(
        action === "abort"
          ? "Abortada: no se envió nada al cliente."
          : "Aprobada: el bot ya puede responder."
      );
    } catch {
      setMsg("Error de red");
    } finally {
      setBusy(null);
    }
  }

  const pending = items.filter((x) => x.status === "pending");
  const decided = items.filter((x) => x.status !== "pending");
  const visible = showDecided ? decided : pending;

  return (
    <div className="rounded-2xl border border-gold/20 bg-ivory p-6">
      <div className="flex flex-wrap items-center gap-2">
        <Clock size={20} className="text-brown" />
        <h2 className="font-serif text-2xl font-semibold text-brown">
          Escalaciones · decisión humana
        </h2>
        {pending.length > 0 && (
          <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-800">
            {pending.length} esperando
          </span>
        )}
        <button
          type="button"
          onClick={() => setShowDecided((v) => !v)}
          className="ml-auto rounded-full border border-gold/30 px-3 py-1 text-xs font-semibold text-brown-soft hover:text-brown"
        >
          {showDecided ? "Ver pendientes" : "Ver historial"}
        </button>
        <button
          type="button"
          onClick={load}
          className="rounded-full border border-gold/30 px-3 py-1 text-xs font-semibold text-brown-soft hover:text-brown"
        >
          Recargar
        </button>
      </div>

      <p className="mt-1 text-sm text-brown-soft">
        Cuando el bot detecta una solicitud con compromiso (devolución,
        reposición, reembolso, cancelación o cambio de dirección), la deja aquí
        en lugar de responderla. Tú apruebas o la abortas. Si nadie decide a
        tiempo, se aborta sola: nunca sale una promesa sin visto bueno.
      </p>

      {msg && <p className="mt-2 text-sm text-gold-dark">{msg}</p>}

      {loading ? (
        <p className="mt-4 text-sm text-brown-soft">Cargando…</p>
      ) : visible.length === 0 ? (
        <p className="mt-4 text-sm text-brown-soft">
          {showDecided
            ? "Sin historial todavía."
            : "Nada pendiente. El bot está resolviendo solo lo que no compromete dinero."}
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {visible.map((x) => (
            <li
              key={x.id}
              className="rounded-xl border border-gold/25 bg-cream px-3 py-3 text-sm"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] font-bold uppercase ${STATUS_STYLE[x.status]}`}
                >
                  {x.status}
                </span>
                {x.risk === "high" && (
                  <span className="rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-bold text-red-800">
                    alto riesgo
                  </span>
                )}
                <span className="text-xs font-semibold text-brown">
                  {x.customerRef}
                </span>
                {x.orderId && (
                  <span className="font-mono text-[11px] text-brown-soft">
                    pedido: {x.orderId.slice(-8)}
                  </span>
                )}
                <span className="text-[11px] text-brown-soft">
                  {new Date(x.createdAt).toLocaleString()}
                </span>
              </div>

              <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-brown-soft">
                Motivo
              </p>
              <p className="text-brown">{x.reason}</p>

              {x.proposedAction && (
                <p className="mt-1 text-xs text-brown-soft">
                  Acción propuesta:{" "}
                  <span className="font-semibold text-brown">
                    {ACTION_LABEL[x.proposedAction.kind] || x.proposedAction.kind}
                  </span>{" "}
                  — {x.proposedAction.detail}
                </p>
              )}

              <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-brown-soft">
                Cliente escribió
              </p>
              <p className="whitespace-pre-line text-brown">{x.customerMessage}</p>

              <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-brown-soft">
                El bot propone responder
              </p>
              {editing === x.id ? (
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  rows={5}
                  className="mt-1 w-full rounded-xl border border-gold/30 bg-ivory px-3 py-2 text-sm text-brown outline-none focus:border-gold-dark"
                />
              ) : (
                <p className="whitespace-pre-line rounded-lg bg-ivory px-3 py-2 text-brown">
                  {x.proposedReply}
                </p>
              )}

              {x.status === "pending" && (
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={busy === x.id}
                    onClick={() =>
                      decide(x.id, "approve", editing === x.id ? { finalReply: draft } : undefined)
                    }
                    className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
                  >
                    <Check size={13} /> Aprobar y enviar
                  </button>
                  <button
                    type="button"
                    disabled={busy === x.id}
                    onClick={() => decide(x.id, "abort")}
                    className="inline-flex items-center gap-1.5 rounded-full bg-red-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-50"
                  >
                    <X size={13} /> Abortar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (editing === x.id) {
                        setEditing(null);
                      } else {
                        setEditing(x.id);
                        setDraft(x.proposedReply);
                      }
                    }}
                    className="rounded-full border border-gold/30 px-4 py-1.5 text-xs font-semibold text-brown-soft hover:text-brown"
                  >
                    {editing === x.id ? "Cancelar edición" : "Editar respuesta"}
                  </button>
                </div>
              )}

              {x.decidedBy && x.status !== "pending" && (
                <p className="mt-2 text-[11px] text-brown-soft">
                  Decidido por {x.decidedBy}
                  {x.abortReason ? ` · ${x.abortReason}` : ""}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
