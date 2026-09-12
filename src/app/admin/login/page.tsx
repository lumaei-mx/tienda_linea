"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [err, setErr] = useState("");
  const [need2fa, setNeed2fa] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, code: code || undefined }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        router.push("/admin");
        router.refresh();
      } else if (data.need2fa) {
        setNeed2fa(true);
      } else {
        setErr(data.error || "Credenciales inválidas");
      }
    } catch {
      setErr("Error de red");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <form
        onSubmit={submit}
        className="w-full max-w-sm rounded-2xl border border-gold/25 bg-ivory p-8 shadow-sm"
      >
        <h1 className="font-serif text-2xl font-semibold text-brown">
          Admin · Lumaei
        </h1>
        <p className="mt-1 text-sm text-brown-soft">
          {need2fa ? "Ingresa el código 2FA" : "Ingresa la contraseña"}
        </p>

        {!need2fa ? (
          <input
            type="password"
            autoFocus
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-5 w-full rounded-xl border border-gold/30 bg-white px-3 py-2.5 outline-none ring-gold focus:ring-2"
            placeholder="••••••••"
          />
        ) : (
          <input
            type="text"
            inputMode="numeric"
            autoFocus
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            className="mt-5 w-full rounded-xl border border-gold/30 bg-white px-3 py-2.5 outline-none ring-gold focus:ring-2 text-center text-2xl tracking-widest"
            placeholder="000000"
            maxLength={6}
          />
        )}

        {err && <p className="mt-3 text-sm text-red-700">{err}</p>}

        <button
          type="submit"
          disabled={loading || !password || (need2fa && code.length !== 6)}
          className="mt-5 w-full rounded-full bg-brown py-2.5 text-sm font-semibold text-ivory hover:bg-gold-dark disabled:opacity-50"
        >
          {loading ? "Verificando..." : need2fa ? "Verificar código" : "Entrar"}
        </button>

        {need2fa && (
          <p className="mt-3 text-xs text-brown-soft">
            Abre tu app de autenticación (Authy, Google Authenticator, etc.)
          </p>
        )}
      </form>
    </div>
  );
}