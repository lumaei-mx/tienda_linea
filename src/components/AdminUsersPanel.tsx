"use client";
// AdminUsersPanel — otorga y revoca acceso al panel administrativo.
// Solo el owner ve este panel (el server lo filtra).
// Fuente: GET/POST/PATCH/DELETE /api/admin/users

import { useEffect, useState } from "react";
import { Shield, UserPlus, Trash2 } from "lucide-react";

interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: "owner" | "admin" | "viewer";
  status: "active" | "disabled";
  createdAt: string;
  lastLoginAt?: string;
  twoFactorEnabled: boolean;
  pendingAccess: boolean;
}

const ROLE_LABEL: Record<AdminUser["role"], string> = {
  owner: "Owner · acceso total",
  admin: "Admin · sin gestión de cuentas",
  viewer: "Viewer · solo lectura",
};

export function AdminUsersPanel() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<AdminUser["role"]>("viewer");
  const [accessCode, setAccessCode] = useState<string | null>(null);
  const [accessFor, setAccessFor] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users");
      const d = await res.json();
      if (res.ok) setUsers(d.users || []);
      else setErr(d.error || "No autorizado");
    } catch {
      setErr("Error cargando cuentas");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function createUser(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setMsg("");
    setAccessCode(null);
    setSaving(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, role }),
      });
      const d = await res.json();
      if (!res.ok) {
        setErr(d.error || "No se pudo crear la cuenta");
        return;
      }
      setMsg(`Acceso otorgado a ${d.user.email}.`);
      if (d.accessCode) {
        setAccessCode(d.accessCode);
        setAccessFor(d.user.email);
      }
      setEmail("");
      setName("");
      setRole("viewer");
      load();
    } catch {
      setErr("Error de red");
    } finally {
      setSaving(false);
    }
  }

  async function patchUser(id: string, patch: Partial<AdminUser>) {
    setErr("");
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...patch }),
      });
      const d = await res.json();
      if (!res.ok) {
        setErr(d.error || "No se pudo actualizar");
        return;
      }
      setUsers((us) => us.map((u) => (u.id === id ? d.user : u)));
    } catch {
      setErr("Error de red");
    }
  }

  async function removeUser(id: string, userEmail: string) {
    if (!confirm(`¿Revocar el acceso de ${userEmail}?`)) return;
    setErr("");
    try {
      const res = await fetch(`/api/admin/users?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      const d = await res.json();
      if (!res.ok) {
        setErr(d.error || "No se pudo revocar");
        return;
      }
      setUsers((us) => us.filter((u) => u.id !== id));
    } catch {
      setErr("Error de red");
    }
  }

  return (
    <div className="rounded-2xl border border-gold/20 bg-ivory p-6">
      <div className="flex flex-wrap items-center gap-2">
        <Shield size={20} className="text-brown" />
        <h2 className="font-serif text-2xl font-semibold text-brown">
          Acceso y roles
        </h2>
        <span className="rounded-full bg-gold/20 px-2 py-0.5 text-xs font-bold text-gold-dark">
          {users.length} cuenta{users.length === 1 ? "" : "s"}
        </span>
      </div>
      <p className="mt-1 text-sm text-brown-soft">
        Otorga acceso al panel por persona. Cada quien entra con su correo y su
        propia contraseña; el rol define qué puede tocar.
      </p>

      {err && <p className="mt-2 text-sm text-red-700">{err}</p>}
      {msg && <p className="mt-2 text-sm text-emerald-700">{msg}</p>}

      {accessCode && accessFor && (
        <div className="mt-3 rounded-xl border border-emerald-300 bg-emerald-50 p-3 text-sm">
          <p className="font-semibold text-emerald-900">
            Código de acceso para {accessFor}
          </p>
          <p className="mt-1 font-mono text-lg font-bold tracking-wider text-emerald-900">
            {accessCode}
          </p>
          <p className="mt-1 text-xs text-emerald-800">
            Compártelo con la persona. Lo canjea en /admin/login (opción «Tengo
            un código de acceso») y ahí define su contraseña. Se muestra una
            sola vez.
          </p>
        </div>
      )}

      {/* Alta */}
      <form onSubmit={createUser} className="mt-4 grid gap-2 sm:grid-cols-4">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nombre"
          required
          className="rounded-xl border border-gold/30 bg-cream px-3 py-2 text-sm text-brown outline-none focus:border-gold-dark"
        />
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="correo@dominio.com"
          type="email"
          required
          className="rounded-xl border border-gold/30 bg-cream px-3 py-2 text-sm text-brown outline-none focus:border-gold-dark"
        />
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as AdminUser["role"])}
          className="rounded-xl border border-gold/30 bg-cream px-3 py-2 text-sm text-brown outline-none focus:border-gold-dark"
        >
          <option value="viewer">Viewer</option>
          <option value="admin">Admin</option>
          <option value="owner">Owner</option>
        </select>
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center justify-center gap-1.5 rounded-full bg-brown px-4 py-2 text-sm font-semibold text-ivory hover:bg-gold-dark disabled:opacity-50"
        >
          <UserPlus size={14} /> {saving ? "Otorgando…" : "Otorgar acceso"}
        </button>
      </form>

      {/* Lista */}
      {loading ? (
        <p className="mt-4 text-sm text-brown-soft">Cargando…</p>
      ) : users.length === 0 ? (
        <p className="mt-4 text-sm text-brown-soft">
          Aún no hay cuentas. Mientras no exista ninguna, el panel se abre con
          la contraseña maestra (ADMIN_PASSWORD) como owner.
        </p>
      ) : (
        <ul className="mt-4 space-y-2">
          {users.map((u) => (
            <li
              key={u.id}
              className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border px-3 py-2 text-sm ${
                u.status === "disabled"
                  ? "border-gold/10 opacity-60"
                  : "border-gold/25 bg-cream"
              }`}
            >
              <div className="min-w-0">
                <p className="font-semibold text-brown">
                  {u.name}{" "}
                  <span className="font-normal text-brown-soft">· {u.email}</span>
                </p>
                <p className="text-[11px] text-brown-soft">
                  {ROLE_LABEL[u.role]}
                  {u.pendingAccess ? " · código sin canjear" : ""}
                  {u.twoFactorEnabled ? " · 2FA activo" : ""}
                  {u.lastLoginAt
                    ? ` · último ingreso ${new Date(u.lastLoginAt).toLocaleDateString()}`
                    : " · sin ingresos"}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={u.role}
                  onChange={(e) =>
                    patchUser(u.id, { role: e.target.value as AdminUser["role"] })
                  }
                  className="rounded-lg border border-gold/30 bg-ivory px-2 py-1 text-xs text-brown"
                >
                  <option value="viewer">Viewer</option>
                  <option value="admin">Admin</option>
                  <option value="owner">Owner</option>
                </select>
                <button
                  type="button"
                  onClick={() =>
                    patchUser(u.id, {
                      status: u.status === "active" ? "disabled" : "active",
                    })
                  }
                  className="rounded-full border border-gold/30 px-3 py-1 text-xs font-semibold text-brown-soft hover:text-brown"
                >
                  {u.status === "active" ? "Deshabilitar" : "Habilitar"}
                </button>
                <button
                  type="button"
                  onClick={() => removeUser(u.id, u.email)}
                  aria-label={`Revocar acceso de ${u.email}`}
                  className="rounded-full border border-red-200 px-2 py-1 text-red-700 hover:bg-red-50"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
