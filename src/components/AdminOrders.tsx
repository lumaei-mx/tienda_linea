"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import type { Order } from "@/lib/types";
import { formatMoney } from "@/lib/money";

const PAGE_SIZE = 20;
const STATUS_OPTIONS = [
  { value: "", label: "Todos" },
  { value: "pending_payment", label: "Pendiente pago" },
  { value: "paid", label: "Pagado" },
  { value: "awaiting_owner_approval", label: "Esperando autorización" },
  { value: "fulfillment_queued", label: "En cola cumplimiento" },
  { value: "sent_to_cj", label: "Enviado a CJ" },
  { value: "shipped", label: "Enviado" },
  { value: "delivered", label: "Entregado" },
  { value: "cancelled", label: "Cancelado" },
];

export function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [marketFilter, setMarketFilter] = useState("");
  const [msg, setMsg] = useState("");

  async function load() {
    setLoading(true);
    setMsg("");
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(PAGE_SIZE),
      });
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);
      if (marketFilter) params.set("market", marketFilter);

      const res = await fetch(`/api/admin/orders?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error");
      setOrders(data.orders || []);
      setTotal(data.total || 0);
      setPages(data.pages || 1);
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, statusFilter, marketFilter]);

  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      load();
    }, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selected.size === orders.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(orders.map((o) => o.id)));
    }
  }

  async function bulkAction(action: string) {
    if (!selected.size) return;
    if (!confirm(`¿${action} ${selected.size} pedido(s)?`)) return;
    setBusy(action);
    try {
      const res = await fetch("/api/admin/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          orderIds: Array.from(selected),
          reason: action === "cancel" ? "Cancelado en bulk desde admin" : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error");
      setMsg(`${action === "cancel" ? "Cancelados" : "Emails enviados"}: ${data.cancelled || data.sent || 0}`);
      setSelected(new Set());
      load();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Error");
    } finally {
      setBusy(null);
    }
  }

  async function exportCSV() {
    const res = await fetch("/api/admin/orders?export=csv");
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `orders-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  async function fulfill(id: string) {
    setBusy(id);
    try {
      const res = await fetch(`/api/admin/orders/${id}/approve`, { method: "POST" });
      const data = await res.json();
      if (res.ok && data.order) {
        setOrders((prev) => prev.map((o) => (o.id === id ? data.order : o)));
      } else {
        alert(data.error || "Error");
      }
    } finally {
      setBusy(null);
    }
  }

  async function resendEmail(id: string) {
    setBusy(id);
    try {
      const res = await fetch(`/api/admin/orders/${id}/resend-email`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setMsg(`Email reenviado ✓`);
        setTimeout(() => setMsg(""), 3000);
      } else {
        alert(data.error || "Error");
      }
    } finally {
      setBusy(null);
    }
  }

  const selectedCount = selected.size;

  return (
    <div className="mt-4">
      {/* Toolbar */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <input
          type="text"
          placeholder="Buscar por ID, cliente, email, CJ..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="rounded-xl border border-gold/30 bg-white px-3 py-2 text-sm outline-none ring-gold focus:ring-2"
        />
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="rounded-xl border border-gold/30 bg-white px-3 py-2 text-sm"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
        <select
          value={marketFilter}
          onChange={(e) => {
            setMarketFilter(e.target.value);
            setPage(1);
          }}
          className="rounded-xl border border-gold/30 bg-white px-3 py-2 text-sm"
        >
          <option value="">Todos los mercados</option>
          <option value="MX">MX</option>
          <option value="US">US</option>
        </select>
        <button
          type="button"
          onClick={exportCSV}
          className="rounded-full border border-gold/30 bg-ivory px-3 py-2 text-xs font-semibold text-brown hover:bg-cream"
        >
          ↓ Exportar CSV
        </button>
        <button
          type="button"
          onClick={load}
          className="rounded-full border border-gold/30 bg-ivory px-3 py-2 text-xs font-semibold text-brown hover:bg-cream"
        >
          ↻ Actualizar
        </button>

        {selectedCount > 0 && (
          <>
            <span className="text-xs text-brown-soft">{selectedCount} seleccionado(s)</span>
            <button
              type="button"
              disabled={!!busy}
              onClick={() => bulkAction("resend_email")}
              className="rounded-full border border-gold/30 px-3 py-2 text-xs font-semibold text-brown-soft hover:bg-cream disabled:opacity-50"
            >
              ✉ Reenviar email
            </button>
            <button
              type="button"
              disabled={!!busy}
              onClick={() => bulkAction("cancel")}
              className="rounded-full border border-red-300 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
            >
              ✕ Cancelar
            </button>
          </>
        )}
      </div>

      {msg && <p className="mb-2 text-sm text-gold-dark">{msg}</p>}

      {loading ? (
        <p className="text-sm text-brown-soft">Cargando…</p>
      ) : orders.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-gold/40 bg-ivory p-8 text-center text-sm text-brown-soft">
          Sin pedidos.
        </p>
      ) : (
        <>
          <div className="overflow-x-auto rounded-2xl border border-gold/20 bg-ivory">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-gold/15 bg-cream text-xs uppercase tracking-wider text-brown-soft">
                <tr>
                  <th className="px-3 py-3">
                    <input
                      type="checkbox"
                      checked={selected.size === orders.length && orders.length > 0}
                      onChange={toggleSelectAll}
                      className="h-4 w-4"
                    />
                  </th>
                  <th className="px-4 py-3">Fecha</th>
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-4 py-3">Mercado</th>
                  <th className="px-4 py-3 text-right">Total</th>
                  <th className="px-4 py-3 text-right">Profit</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3">Tracking</th>
                  <th className="px-4 py-3">CJ</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id} className="border-b border-gold/10">
                    <td className="px-3 py-3">
                      <input
                        type="checkbox"
                        checked={selected.has(o.id)}
                        onChange={() => toggleSelect(o.id)}
                        className="h-4 w-4"
                      />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-brown-soft">
                      {new Date(o.createdAt).toLocaleString("es-MX")}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-brown">{o.customer.name}</div>
                      <div className="text-xs text-brown-soft">{o.customer.email}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-cream px-2 py-0.5 text-xs font-medium">
                        {o.market}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right font-medium">
                      {formatMoney(o.total)}
                    </td>
                    <td className={`whitespace-nowrap px-4 py-3 text-right ${o.estimatedProfitUsd < 0 ? "text-red-600" : "text-gold-dark"}`}>
                      ${o.estimatedProfitUsd.toFixed(2)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        o.status === "cancelled" ? "bg-red-50 text-red-700" :
                        o.status === "delivered" ? "bg-green-50 text-green-700" :
                        o.status === "shipped" ? "bg-blue-50 text-blue-700" :
                        "bg-cream text-brown-soft"
                      }`}>
                        {o.status}
                      </span>
                      {o.trackingNumber && (
                        <div className="mt-1 text-[10px] text-brown-soft">
                          {o.trackingCarrier && `${o.trackingCarrier}: `}{o.trackingNumber}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-brown-soft">
                      {o.trackingNumber ? (
                        <a href={o.trackingUrl || "#"} target="_blank" rel="noreferrer" className="underline">
                          {o.trackingNumber.slice(0, 12)}...
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-brown-soft">
                      {o.cjOrderId || "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/admin/pedido/${o.id}`}
                          className="rounded-full border border-gold/30 px-3 py-1 text-xs font-semibold text-brown hover:bg-cream"
                        >
                          Ver
                        </Link>
                        <button
                          type="button"
                          disabled={busy === o.id}
                          onClick={() => resendEmail(o.id)}
                          title="Reenviar email"
                          className="rounded-full border border-gold/30 px-2 py-1 text-xs font-semibold text-brown-soft hover:bg-cream disabled:opacity-50"
                        >
                          ✉
                        </button>
                        {["paid", "fulfillment_queued"].includes(o.status) && (
                          <button
                            type="button"
                            disabled={busy === o.id}
                            onClick={() => fulfill(o.id)}
                            className="rounded-full bg-brown px-3 py-1 text-xs font-semibold text-ivory disabled:opacity-50"
                          >
                            {busy === o.id ? "..." : "Fulfill"}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          {pages > 1 && (
            <div className="mt-3 flex items-center justify-between">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="rounded-full border border-gold/30 bg-ivory px-3 py-1 text-xs font-semibold text-brown hover:bg-cream disabled:opacity-50"
              >
                ← Anterior
              </button>
              <span className="text-xs text-brown-soft">
                Página {page} de {pages} · {total} pedidos
              </span>
              <button
                type="button"
                disabled={page >= pages}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-full border border-gold/30 bg-ivory px-3 py-1 text-xs font-semibold text-brown hover:bg-cream disabled:opacity-50"
              >
                Siguiente →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}