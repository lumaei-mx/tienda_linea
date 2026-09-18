// src/app/api/admin/users/route.ts
// Otorgamiento y gestión de acceso al panel administrativo.
// Solo el rol `owner` puede crear/editar/borrar cuentas.
import { NextResponse } from "next/server";
import {
  isAdminRequest,
  isSuperOwner,
  getAdminClaims,
} from "@/lib/admin-auth";
import {
  createAdminUser,
  deleteAdminUser,
  listAdminUsers,
  toPublicAdminUser,
  updateAdminUser,
  type AdminRole,
} from "@/lib/admin-users";

export const dynamic = "force-dynamic";

const ROLES: AdminRole[] = ["owner", "admin", "viewer"];

function actorFrom(claims: { email: string } | null): string {
  return `admin:${claims?.email || "unknown"}`;
}

/** GET — lista cuentas (lectura: owner/admin/viewer). */
export async function GET(req: Request) {
  if (!(await isAdminRequest(req))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const users = await listAdminUsers();
  return NextResponse.json({ users: users.map(toPublicAdminUser) });
}

/** POST — crea una cuenta y otorga acceso (solo owner). */
export async function POST(req: Request) {
  if (!(await isSuperOwner(req))) {
    return NextResponse.json(
      { error: "Solo el owner puede otorgar acceso" },
      { status: 403 }
    );
  }
  const body = await req.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email : "";
  const name = typeof body?.name === "string" ? body.name : "";
  const role = (typeof body?.role === "string" ? body.role : "viewer") as AdminRole;
  const password = typeof body?.password === "string" ? body.password : undefined;

  if (!ROLES.includes(role)) {
    return NextResponse.json({ error: "Rol inválido" }, { status: 400 });
  }
  if (password && password.length < 10) {
    return NextResponse.json(
      { error: "La contraseña debe tener al menos 10 caracteres" },
      { status: 400 }
    );
  }

  const claims = await getAdminClaims(req);
  try {
    const { user, accessCode } = await createAdminUser({
      email,
      name,
      role,
      password,
      createdBy: actorFrom(claims),
    });
    return NextResponse.json({
      ok: true,
      user: toPublicAdminUser(user),
      // Se muestra UNA sola vez para que el owner lo entregue a la persona.
      accessCode,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error creando la cuenta";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

/** PATCH — cambia rol / estado / nombre (solo owner). */
export async function PATCH(req: Request) {
  if (!(await isSuperOwner(req))) {
    return NextResponse.json(
      { error: "Solo el owner puede modificar el acceso" },
      { status: 403 }
    );
  }
  const body = await req.json().catch(() => null);
  const id = typeof body?.id === "string" ? body.id : "";
  if (!id) return NextResponse.json({ error: "Falta id" }, { status: 400 });

  const patch: { role?: AdminRole; status?: "active" | "disabled"; name?: string } = {};
  if (typeof body?.role === "string") {
    if (!ROLES.includes(body.role as AdminRole)) {
      return NextResponse.json({ error: "Rol inválido" }, { status: 400 });
    }
    patch.role = body.role as AdminRole;
  }
  if (body?.status === "active" || body?.status === "disabled") {
    patch.status = body.status;
  }
  if (typeof body?.name === "string" && body.name.trim()) {
    patch.name = body.name.trim();
  }
  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "Nada que actualizar" }, { status: 400 });
  }

  const claims = await getAdminClaims(req);
  try {
    const user = await updateAdminUser(id, patch, actorFrom(claims));
    if (!user) return NextResponse.json({ error: "Cuenta no encontrada" }, { status: 404 });
    return NextResponse.json({ ok: true, user: toPublicAdminUser(user) });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error actualizando";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

/** DELETE — revoca el acceso (solo owner). */
export async function DELETE(req: Request) {
  if (!(await isSuperOwner(req))) {
    return NextResponse.json(
      { error: "Solo el owner puede revocar el acceso" },
      { status: 403 }
    );
  }
  const id = new URL(req.url).searchParams.get("id") || "";
  if (!id) return NextResponse.json({ error: "Falta id" }, { status: 400 });
  const claims = await getAdminClaims(req);
  try {
    const ok = await deleteAdminUser(id, actorFrom(claims));
    if (!ok) return NextResponse.json({ error: "Cuenta no encontrada" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error borrando";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
