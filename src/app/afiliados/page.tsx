"use client";

import { useState } from "react";

export default function AfiliadosPage() {
  const [tab, setTab] = useState<"join" | "stats" | "waitlist">("join");
  const [form, setForm] = useState({ handle: "", name: "", email: "" });
  const [result, setResult] = useState<string>("");
  const [link, setLink] = useState<string>("");
  const [lookup, setLookup] = useState("");
  const [stats, setStats] = useState<Record<string, unknown> | null>(null);
  const [busy, setBusy] = useState(false);

  async function join(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setResult("");
    setLink("");
    try {
      const res = await fetch("/api/affiliates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.ok) {
        setLink(data.referralLink);
        setResult("¡Listo! Tu enlace de afiliado está activo.");
      } else {
        setResult(data.error || "No se pudo crear.");
      }
    } catch {
      setResult("Error de red.");
    } finally {
      setBusy(false);
    }
  }

  async function find(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setStats(null);
    try {
      const res = await fetch(
        `/api/affiliates/${encodeURIComponent(lookup)}`
      );
      const data = await res.json();
      if (data.affiliate) setStats(data.affiliate as Record<string, unknown>);
      else setResult("Afiliado no encontrado.");
    } catch {
      setResult("Error de red.");
    } finally {
      setBusy(false);
    }
  }

  const [wl, setWl] = useState({ email: "", handle: "" });
  const [wlResult, setWlResult] = useState("");
  const [wlBusy, setWlBusy] = useState(false);

  async function joinWaitlist(e: React.FormEvent) {
    e.preventDefault();
    setWlBusy(true);
    setWlResult("");
    try {
      const res = await fetch("/api/affiliates/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(wl),
      });
      const data = await res.json();
      setWlResult(
        data.ok ? data.message || "Inscrito ✓" : data.error || "No se pudo inscribir."
      );
    } catch {
      setWlResult("Error de red.");
    } finally {
      setWlBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-5 py-12 text-[#3a2e22]">
      <h1 className="text-3xl font-bold mb-2">Programa de Afiliados Lumaei</h1>
      <p className="mb-6 text-sm leading-relaxed">
        Gana dinero compartiendo nuestros productos. Sin costo, sin riesgo: solo
        cobras cuando alguien compra por tu enlace.         Comisión del{" "}
        <b>15% de la ganancia neta</b> de cada venta que generes.
      </p>

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setTab("join")}
          className={`px-4 py-2 rounded-full text-sm ${
            tab === "join" ? "bg-[#c9a24b] text-white" : "bg-[#efe6d8]"
          }`}
        >
          Únete
        </button>
        <button
          onClick={() => setTab("stats")}
          className={`px-4 py-2 rounded-full text-sm ${
            tab === "stats" ? "bg-[#c9a24b] text-white" : "bg-[#efe6d8]"
          }`}
        >
          Mis datos
        </button>
        <button
          onClick={() => setTab("waitlist")}
          className={`px-4 py-2 rounded-full text-sm ${
            tab === "waitlist" ? "bg-[#c9a24b] text-white" : "bg-[#efe6d8]"
          }`}
        >
          Lista de espera
        </button>
      </div>

      {tab === "join" ? (
        <form onSubmit={join} className="space-y-3">
          <input
            required
            placeholder="@tuHandle (ej: @yosoyhachi)"
            value={form.handle}
            onChange={(e) => setForm({ ...form, handle: e.target.value })}
            className="w-full border border-[#d8c9b0] rounded-lg px-3 py-2"
          />
          <input
            required
            placeholder="Tu nombre"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full border border-[#d8c9b0] rounded-lg px-3 py-2"
          />
          <input
            required
            type="email"
            placeholder="Tu email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full border border-[#d8c9b0] rounded-lg px-3 py-2"
          />
          <button
            disabled={busy}
            className="bg-[#c9a24b] text-white px-5 py-2 rounded-lg disabled:opacity-50"
          >
            {busy ? "..." : "Crear mi enlace"}
          </button>
          {result && <p className="text-sm mt-2">{result}</p>}
          {link && (
            <p className="text-sm mt-2 break-all bg-[#f6f0e6] p-3 rounded-lg">
              Tu enlace: <b>{link}</b>
            </p>
          )}
        </form>
      ) : tab === "stats" ? (
        <form onSubmit={find} className="space-y-3">
          <input
            required
            placeholder="@tuHandle"
            value={lookup}
            onChange={(e) => setLookup(e.target.value)}
            className="w-full border border-[#d8c9b0] rounded-lg px-3 py-2"
          />
          <button
            disabled={busy}
            className="bg-[#c9a24b] text-white px-5 py-2 rounded-lg disabled:opacity-50"
          >
            {busy ? "..." : "Ver mis datos"}
          </button>
          {stats && (
            <div className="text-sm bg-[#f6f0e6] p-4 rounded-lg space-y-1">
              <p>
                <b>{String(stats.handle)}</b> · {String(stats.status)}
              </p>
              <p>Conversiones: {String(stats.conversions)}</p>
              <p>
                Comisión pendiente: ${Number(stats.commissionPendingUsd).toFixed(2)} USD
              </p>
              <p>
                Comisión pagada: ${Number(stats.commissionPaidUsd).toFixed(2)} USD
              </p>
            </div>
          )}
        </form>
      ) : (
        <form onSubmit={joinWaitlist} className="space-y-3">
          <p className="text-sm text-[#6b5b45]">
            ¿Aún no listo para crear tu enlace? Déjame tu email y te aviso cuando
            abramos la siguiente convocatoria de afiliados.
          </p>
          <input
            required
            type="email"
            placeholder="Tu email"
            value={wl.email}
            onChange={(e) => setWl({ ...wl, email: e.target.value })}
            className="w-full border border-[#d8c9b0] rounded-lg px-3 py-2"
          />
          <input
            placeholder="@tuHandle (opcional)"
            value={wl.handle}
            onChange={(e) => setWl({ ...wl, handle: e.target.value })}
            className="w-full border border-[#d8c9b0] rounded-lg px-3 py-2"
          />
          <button
            disabled={wlBusy}
            className="bg-[#c9a24b] text-white px-5 py-2 rounded-lg disabled:opacity-50"
          >
            {wlBusy ? "..." : "Unirme a la lista"}
          </button>
          {wlResult && <p className="text-sm mt-2">{wlResult}</p>}
        </form>
      )}
    </main>
  );
}
