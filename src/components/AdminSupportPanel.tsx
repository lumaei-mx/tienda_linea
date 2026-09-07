"use client";
// AdminSupportPanel — lista tickets de soporte y marca resueltos.
// Fuente: GET /api/admin/support (cookie admin). Resolver: POST /api/admin/support {id, resolved}.
// (El route también acepta PATCH por compatibilidad con el trabajo previo.)
//
// MONTAJE (no se tocó src/app/admin/page.tsx por ser complejo):
//   import { AdminSupportPanel } from "@/components/AdminSupportPanel";
//   ...
//   <section className="mt-10">
//     <AdminSupportPanel />
//   </section>

import { useEffect, useState } from "react";

interface Ticket {
  id: string;
  name: string;
  email: string;
  message: string;
  orderId?: string;
  createdAt: string;
  resolved: boolean;
}

export function AdminSupportPanel() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/support");
      const d = await res.json();
      if (res.ok) setTickets(d.tickets || []);
      else setMsg(d.error || "No autorizado");
    } catch {
      setMsg("Error cargando tickets");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function setResolved(id: string, resolved: boolean) {
    try {
      const res = await fetch("/api/admin/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, resolved }),
      });
      if (!res.ok) {
        setMsg("No se pudo actualizar");
        return;
      }
      setTickets((ts) => ts.map((t) => (t.id === id ? { ...t, resolved } : t)));
    } catch {
      setMsg("No se pudo actualizar");
    }
  }

  const pending = tickets.filter((t) => !t.resolved).length;

  return (
    <div className="rounded-2xl border border-gold/20 bg-ivory p-6">
      <div className="flex items-center gap-2">
        <span aria-hidden>🎧</span>
        <h2 className="font-serif text-2xl font-semibold text-brown">Soporte · Tickets</h2>
        {pending > 0 && (
          <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-800">
            {pending} pendientes
          </span>
        )}
        <button
          type="button"
          onClick={load}
          className="ml-auto rounded-full border border-gold/30 px-3 py-1 text-xs font-semibold text-brown-soft hover:text-brown"
        >
          Recargar
        </button>
      </div>
      {msg && <p className="mt-2 text-sm text-gold-dark">{msg}</p>}
      {loading ? (
        <p className="mt-4 text-sm text-brown-soft">Cargando…</p>
      ) : tickets.length === 0 ? (
        <p className="mt-4 text-sm text-brown-soft">Sin tickets.</p>
      ) : (
        <ul className="mt-4 space-y-2">
          {tickets.map((t) => (
            <li
              key={t.id}
              className={`flex items-start justify-between gap-3 rounded-xl border px-3 py-2 text-sm ${
                t.resolved ? "border-gold/10 opacity-60" : "border-gold/25 bg-cream"
              }`}
            >
              <div className="min-w-0">
                <p className="font-semibold text-brown">
                  {t.name} <span className="font-normal text-brown-soft">· {t.email}</span>
                </p>
                {t.orderId && (
                  <p className="font-mono text-[11px] text-brown-soft">pedido: {t.orderId}</p>
                )}
                <p className="mt-1 whitespace-pre-line text-brown">{t.message}</p>
                <p className="text-[11px] text-brown-soft">
                  {new Date(t.createdAt).toLocaleString()} · {t.id}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setResolved(t.id, !t.resolved)}
                className="shrink-0 rounded-full border border-gold/30 px-3 py-1 text-xs font-semibold text-brown-soft hover:text-brown"
              >
                {t.resolved ? "Reabrir" : "Resolver"}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
