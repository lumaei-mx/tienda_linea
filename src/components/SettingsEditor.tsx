"use client";

import { useEffect, useState } from "react";
import { Save, AlertTriangle, QrCode, Copy, Shield, ShieldCheck } from "lucide-react";
import type { StoreSettings } from "@/lib/types";

const FIELDS: Array<{
  key: string;
  label: string;
  type?: "number" | "text" | "boolean";
  step?: number;
  help?: string;
  danger?: boolean;
}> = [
  { key: "brandName", label: "Marca", type: "text" },
  { key: "primaryMarket", label: "Mercado primario", type: "text" },
  { key: "secondaryMarket", label: "Mercado secundario", type: "text" },
  { key: "freeShippingMxUsd", label: "Envío gratis MX (USD)", type: "number", step: 0.01 },
  { key: "freeShippingUsd", label: "Envío gratis US (USD)", type: "number", step: 0.01 },
  { key: "freeShippingMinQty", label: "Envío gratis (mín # artículos, 0=off)", type: "number" },
  { key: "shippingFlatMxUsd", label: "Envío plano MX (USD)", type: "number", step: 0.01 },
  { key: "shippingFlatUsd", label: "Envío plano US (USD)", type: "number", step: 0.01 },
  { key: "taxRateMx", label: "IVA MX (0.16)", type: "number", step: 0.01 },
  { key: "taxRateUs", label: "Tax US (0.07)", type: "number", step: 0.01 },
  { key: "paymentFeeRate", label: "Fee pago (0.036)", type: "number", step: 0.001 },
  { key: "markup", label: "Markup (costo → venta)", type: "number", step: 0.1 },
  { key: "minMarginPct", label: "Margen mínimo %", type: "number" },
  { key: "autoFulfill", label: "Auto-fulfill a CJ", type: "boolean" },
  { key: "influencerCommissionPct", label: "Comisión influencer %", type: "number" },
  { key: "usdToMxn", label: "USD→MXN rate", type: "number", step: 0.01 },

  // --- KILL-SWITCHES (zona de peligro) ---
  { key: "pauseHunter", label: "⏸ PAUSAR Hunter (descubrimiento)", type: "boolean", danger: true, help: "Detiene búsqueda de nuevos productos" },
  { key: "pauseReprice", label: "⏸ PAUSAR Reprice (precios congelados)", type: "boolean", danger: true, help: "Congela precios actuales, no corre cron nocturno" },
  { key: "pauseFulfill", label: "⏸ PAUSAR Fulfill (pedidos en awaiting)", type: "boolean", danger: true, help: "Pedidos pagados NO se envían a CJ, quedan en awaiting_owner_approval" },
  { key: "pauseSyncCj", label: "⏸ PAUSAR Sync CJ (stock/precios)", type: "boolean", danger: true, help: "No actualiza stock ni precios desde CJ" },
  { key: "pauseBot", label: "⏸ PAUSAR Bot Soporte (todo a humano)", type: "boolean", danger: true, help: "Escala todas las conversaciones a humano inmediato" },
  { key: "discloseAi", label: "🤖 Declarar soporte IA", type: "boolean", help: "Avisa al cliente (primer mensaje) que es asistente de IA" },
];

export function SettingsEditor() {
  const [s, setS] = useState<StoreSettings | null>(null);
  const [msg, setMsg] = useState("");
  const [saving, setSaving] = useState(false);

  // 2FA state
  const [twoFaStatus, setTwoFaStatus] = useState<{
    enabled: boolean;
    hasSecret: boolean;
    hasRecovery: boolean;
    loading: boolean;
  }>({ enabled: false, hasSecret: false, hasRecovery: false, loading: true });
  const [twoFaSetup, setTwoFaSetup] = useState<{
    otpauthUrl: string;
    recoveryCode: string;
  } | null>(null);
  const [enableCode, setEnableCode] = useState("");
  const [disableCode, setDisableCode] = useState("");

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((d) => setS(d.settings || null))
      .catch(() => setMsg("Error cargando settings"));
    loadTwoFaStatus();
  }, []);

  async function loadTwoFaStatus() {
    setTwoFaStatus((p) => ({ ...p, loading: true }));
    try {
      const res = await fetch("/api/admin/2fa");
      const d = await res.json();
      setTwoFaStatus({
        enabled: !!d.twoFactorEnabled,
        hasSecret: !!d.hasSecret,
        hasRecovery: !!d.hasRecovery,
        loading: false,
      });
    } catch {
      setTwoFaStatus((p) => ({ ...p, loading: false }));
    }
  }

  async function save() {
    if (!s) return;
    setMsg("");
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(s),
      });
      const d = await res.json();
      if (res.ok) {
        setMsg("Guardado ✓");
        setS(d.settings);
      } else {
        setMsg(d.error || "Error");
      }
    } catch {
      setMsg("Error de red");
    } finally {
      setSaving(false);
    }
  }

  async function startTwoFaSetup() {
    setMsg("");
    setTwoFaSetup(null);
    try {
      const res = await fetch("/api/admin/2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "generate", email: "admin@lumaei.com" }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Error");
      setTwoFaSetup({ otpauthUrl: d.otpauthUrl, recoveryCode: d.recoveryCode });
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Error generando 2FA");
    }
  }

  async function confirmEnable() {
    if (!twoFaSetup) return;
    setMsg("");
    try {
      const res = await fetch("/api/admin/2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "enable", code: enableCode }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Error");
      setTwoFaSetup(null);
      setEnableCode("");
      setMsg("2FA habilitado ✓");
      await loadTwoFaStatus();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Error");
    }
  }

  async function confirmDisable() {
    setMsg("");
    try {
      const res = await fetch("/api/admin/2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "disable", code: disableCode }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Error");
      setDisableCode("");
      setMsg("2FA deshabilitado ✓");
      await loadTwoFaStatus();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Error");
    }
  }

  if (!s) return <p className="text-sm text-brown-soft">Cargando…</p>;

  const qrUrl = twoFaSetup
    ? `https://api.qrserver.com/v1/api/QRCode/?size=180x180&data=${encodeURIComponent(
        twoFaSetup.otpauthUrl
      )}`
    : null;

  return (
    <div className="space-y-6">
      {/* === Business settings === */}
      <div className="rounded-2xl border border-gold/20 bg-ivory p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-2xl font-semibold text-brown">
            Configuración del negocio
          </h2>
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="flex items-center gap-2 rounded-full bg-brown px-4 py-2 text-sm font-semibold text-ivory hover:bg-gold-dark disabled:opacity-50"
          >
            <Save size={15} strokeWidth={1.5} /> Guardar
          </button>
        </div>
        {msg && <p className="mt-2 text-sm text-gold-dark">{msg}</p>}
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {FIELDS.map((f) => {
            const val = (s as unknown as Record<string, unknown>)[f.key];
            const isDanger = f.danger === true;
            return (
              <label
                key={f.key}
                className={`block text-sm ${isDanger ? "bg-amber-50 border-amber-200 p-3 rounded-xl" : ""}`}
              >
                <div className="flex items-start gap-2">
                  <span
                    className={`mb-1 block font-medium text-zinc-700 ${isDanger ? "text-amber-800" : ""}`}
                  >
                    {f.label}
                    {isDanger && <AlertTriangle size={14} className="ml-1 shrink-0" />}
                  </span>
                </div>
                {f.help && <p className="text-[11px] text-amber-700 mb-1">{f.help}</p>}
                {f.type === "boolean" ? (
                  <input
                    type="checkbox"
                    checked={Boolean(val)}
                    onChange={(e) =>
                      setS({ ...s, [f.key]: e.target.checked } as StoreSettings)
                    }
                    className="h-4 w-4 accent-brown"
                  />
                ) : (
                  <input
                    type={f.type === "text" ? "text" : "number"}
                    step={f.step}
                    value={String(val ?? "")}
                    onChange={(e) =>
                      setS({
                        ...s,
                        [f.key]:
                          f.type === "text" ? e.target.value : Number(e.target.value),
                      } as StoreSettings)
                    }
                    className="w-full rounded-xl border border-gold/30 bg-white px-3 py-2 outline-none ring-gold focus:ring-2"
                  />
                )}
              </label>
            );
          })}
        </div>
      </div>

      {/* === Two-Factor Authentication === */}
      <div className="rounded-2xl border border-gold/20 bg-ivory p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield size={20} className="text-brown" />
            <h2 className="font-serif text-2xl font-semibold text-brown">
              Autenticación de dos factores (2FA)
            </h2>
            {!twoFaStatus.enabled && !twoFaStatus.loading && !twoFaSetup && (
              <span className="text-xs text-amber-600">
                Inactivo — recomendado para seguridad
              </span>
            )}
          </div>
          {twoFaStatus.enabled && (
            <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
              <ShieldCheck size={12} /> Activo
            </span>
          )}
        </div>

        <p className="mt-1 text-sm text-brown-soft">
          Protege tu cuenta admin con TOTP (Google Authenticator, Authy, etc.).
          Requiere un código de 6 dígitos además de la contraseña.
        </p>

        {twoFaStatus.loading ? (
          <p className="mt-4 text-sm text-brown-soft">Cargando estado 2FA…</p>
        ) : twoFaStatus.enabled ? (
          /* === 2FA activo: formulario para deshabilitar === */
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4">
            <h3 className="text-sm font-semibold text-red-800">
              2FA está activo
            </h3>
            <p className="mt-1 text-xs text-red-700">
              Ingresa tu código actual para deshabilitar. También puedes usar
              tu código de recuperación.
            </p>
            <div className="mt-3 flex items-end gap-2">
              <div className="flex-1">
                <label className="text-xs font-medium text-red-800">
                  Código 2FA
                </label>
                <input
                  type="text"
                  placeholder="000000"
                  value={disableCode}
                  maxLength={6}
                  onChange={(e) =>
                    setDisableCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  className="mt-1 w-full rounded-xl border border-red-300 bg-white px-3 py-2 text-sm text-brown outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              <button
                type="button"
                onClick={confirmDisable}
                disabled={!disableCode || disableCode.length !== 6}
                className="rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >
                Deshabilitar
              </button>
            </div>
          </div>
        ) : (
          /* === 2FA inactivo: botón para iniciar setup === */
          <div className="mt-4">
            <button
              type="button"
              onClick={startTwoFaSetup}
              className="flex items-center gap-2 rounded-full bg-brown px-4 py-2 text-sm font-semibold text-ivory hover:bg-gold-dark"
            >
              <QrCode size={16} /> Configurar 2FA
            </button>
          </div>
        )}

        {/* === Setup wizard === */}
        {twoFaSetup && (
          <div className="mt-6 rounded-xl border-2 border-dashed border-gold/30 bg-cream p-6 text-center">
            <h3 className="mb-4 font-serif text-lg font-semibold text-brown">
              Escanea este código QR
            </h3>
            {qrUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={qrUrl}
                alt="QR para 2FA"
                className="mx-auto h-44 w-44 rounded-lg border border-gold/20 bg-white p-1"
              />
            )}
            <p className="mt-3 text-xs text-brown-soft">
              Abre tu app de autenticador (Google Authenticator, Authy) y
              escanea el código. Luego ingresa el código de 6 dígitos para
              activar.
            </p>

            <div className="mt-4 rounded-xl bg-ivory p-3 text-left">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-brown">
                  Código de recuperación (guárdalo)
                </span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(twoFaSetup.recoveryCode);
                    setMsg(`Código de recuperación copiado: ${twoFaSetup.recoveryCode}`);
                  }}
                  title="Copiar códido de recuperación"
                  className="text-xs text-gold-dark hover:text-gold"
                >
                  <Copy size={14} />
                </button>
              </div>
              <code className="mt-1 block font-mono text-lg font-bold text-brown">
                {twoFaSetup.recoveryCode}
              </code>
              <p className="mt-1 text-[10px] text-brown-soft">
                Úsalo si pierdes tu teléfono. Se consume al usarse.
              </p>
            </div>

            <div className="mt-4 flex items-end gap-2">
              <div className="flex-1">
                <label className="text-xs font-medium text-brown">
                  Código verificador
                </label>
                <input
                  type="text"
                  placeholder="000000"
                  value={enableCode}
                  maxLength={6}
                  onChange={(e) =>
                    setEnableCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  className="mt-1 w-full rounded-xl border border-gold/30 bg-white px-3 py-2 text-center text-lg font-mono text-brown outline-none focus:ring-2 focus:ring-gold"
                />
              </div>
              <button
                type="button"
                onClick={confirmEnable}
                disabled={enableCode.length !== 6}
                className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                Activar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* === Roles: ahora son cuentas reales (ver panel «Acceso y roles») === */}
      <div className="rounded-2xl border border-gold/20 bg-ivory p-6">
        <div className="flex items-center gap-2">
          <Shield size={20} className="text-brown" />
          <h2 className="font-serif text-2xl font-semibold text-brown">
            Acceso y roles
          </h2>
        </div>
        <p className="mt-1 text-sm text-brown-soft">
          El rol ya no es un ajuste global: cada persona tiene su propia cuenta
          y su propio rol.{" "}
          <span className="font-medium text-brown">owner</span> = acceso total,{" "}
          <span className="font-medium text-brown">admin</span> = todo excepto
          gestión de cuentas/2FA,{" "}
          <span className="font-medium text-brown">viewer</span> = solo lectura.
        </p>
        <p className="mt-2 text-sm text-brown-soft">
          Crea, cambia el rol o revoca el acceso desde el panel{" "}
          <span className="font-semibold text-brown">Acceso y roles</span> más
          abajo. Cada cuenta entra con su correo en{" "}
          <span className="font-mono text-xs">/admin/login</span>.
        </p>
      </div>
    </div>
  );
}
