"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Mode = "password" | "account" | "access";

export default function AdminLoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [accessCode, setAccessCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [err, setErr] = useState("");
  const [need2fa, setNeed2fa] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      const payload =
        mode === "access"
          ? { email, accessCode, newPassword }
          : mode === "account"
            ? { email, password, code: code || undefined }
            : { password, code: code || undefined };

      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        router.push("/admin");
        router.refresh();
      } else if (data.need2fa) {
        setNeed2fa(true);
      } else if (data.needAccessCode) {
        setMode("access");
        setErr("Canjea tu código de acceso para activar la cuenta.");
      } else {
        setErr(data.error || "Credenciales inválidas");
      }
    } catch {
      setErr("Error de red");
    } finally {
      setLoading(false);
    }
  }

  const subtitle = need2fa
    ? "Ingresa el código 2FA"
    : mode === "access"
      ? "Canjea tu código de acceso"
      : mode === "account"
        ? "Entra con tu cuenta"
        : "Ingresa la contraseña maestra";

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <form
        onSubmit={submit}
        className="w-full max-w-sm rounded-2xl border border-gold/25 bg-ivory p-8 shadow-sm"
      >
        <h1 className="font-serif text-2xl font-semibold text-brown">
          Admin · Lumaei
        </h1>
        <p className="mt-1 text-sm text-brown-soft">{subtitle}</p>

        {!need2fa && mode !== "password" && (
          <input
            type="email"
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-4 w-full rounded-xl border border-gold/30 bg-white px-3 py-2.5 outline-none ring-gold focus:ring-2"
            placeholder="correo@dominio.com"
            required
          />
        )}

        {!need2fa && mode === "access" ? (
          <>
            <input
              type="text"
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value.trim())}
              className="mt-3 w-full rounded-xl border border-gold/30 bg-white px-3 py-2.5 font-mono outline-none ring-gold focus:ring-2"
              placeholder="Código de acceso"
              required
            />
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="mt-3 w-full rounded-xl border border-gold/30 bg-white px-3 py-2.5 outline-none ring-gold focus:ring-2"
              placeholder="Nueva contraseña (mín. 10)"
              minLength={10}
              required
            />
          </>
        ) : need2fa ? (
          <input
            type="text"
            inputMode="numeric"
            autoFocus
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            className="mt-5 w-full rounded-xl border border-gold/30 bg-white px-3 py-2.5 text-center text-2xl tracking-widest outline-none ring-gold focus:ring-2"
            placeholder="000000"
            maxLength={6}
          />
        ) : (
          <input
            type="password"
            autoFocus={mode === "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-4 w-full rounded-xl border border-gold/30 bg-white px-3 py-2.5 outline-none ring-gold focus:ring-2"
            placeholder="••••••••"
            required
          />
        )}

        {err && <p className="mt-3 text-sm text-red-700">{err}</p>}

        <button
          type="submit"
          disabled={
            loading ||
            (need2fa && code.length !== 6) ||
            (!need2fa && mode === "access" && (!accessCode || newPassword.length < 10)) ||
            (!need2fa && mode !== "access" && !password)
          }
          className="mt-5 w-full rounded-full bg-brown py-2.5 text-sm font-semibold text-ivory hover:bg-gold-dark disabled:opacity-50"
        >
          {loading
            ? "Verificando..."
            : need2fa
              ? "Verificar código"
              : mode === "access"
                ? "Activar mi cuenta"
                : "Entrar"}
        </button>

        {need2fa && (
          <p className="mt-3 text-xs text-brown-soft">
            Abre tu app de autenticación (Authy, Google Authenticator, etc.)
          </p>
        )}

        {!need2fa && (
          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            {mode !== "password" && (
              <button
                type="button"
                onClick={() => {
                  setMode("password");
                  setErr("");
                }}
                className="font-semibold text-gold-dark hover:underline"
              >
                Usar contraseña maestra
              </button>
            )}
            {mode !== "account" && (
              <button
                type="button"
                onClick={() => {
                  setMode("account");
                  setErr("");
                }}
                className="font-semibold text-gold-dark hover:underline"
              >
                Entrar con mi cuenta
              </button>
            )}
            {mode !== "access" && (
              <button
                type="button"
                onClick={() => {
                  setMode("access");
                  setErr("");
                }}
                className="font-semibold text-gold-dark hover:underline"
              >
                Tengo un código de acceso
              </button>
            )}
          </div>
        )}
      </form>
    </div>
  );
}
