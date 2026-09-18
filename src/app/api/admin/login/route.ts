import { NextResponse } from "next/server";
import {
  verifyAdminAuth,
  redeemAccess,
  adminCookie,
  adminIdentityCookies,
  clearAdminCookie,
  clearAdminIdentityCookies,
  clearTwoFaCookie,
  isAdminConfigured,
} from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/login
 *
 * Dos modos:
 *  - `{ password }` → bootstrap owner (ADMIN_PASSWORD). Requiere 2FA global si está activo.
 *  - `{ email, password }` → cuenta real con su propio rol y 2FA.
 *  - `{ email, accessCode, newPassword }` → canjea el código de acceso
 *    (primer ingreso de una cuenta recién creada) y fija la contraseña.
 */
export async function POST(req: Request) {
  if (!isAdminConfigured()) {
    return NextResponse.json({ error: "Admin no configurado" }, { status: 500 });
  }
  const body = await req.json().catch(() => null);
  const password = String(body?.password || "");
  const code = String(body?.code || "");
  const email = String(body?.email || "");
  const accessCode = String(body?.accessCode || "");
  const newPassword = String(body?.newPassword || "");

  // Canje del código de acceso (primer ingreso).
  if (email && accessCode) {
    const redeemed = await redeemAccess(email, accessCode, newPassword);
    if (!redeemed.ok) {
      return NextResponse.json(
        { error: redeemed.error || "No se pudo canjear el código" },
        { status: 401 }
      );
    }
    const res = NextResponse.json({ ok: true, role: redeemed.claims?.role });
    res.headers.append("Set-Cookie", adminCookie(redeemed.token!));
    for (const c of adminIdentityCookies(redeemed.claims!)) {
      res.headers.append("Set-Cookie", c);
    }
    return res;
  }

  const result = await verifyAdminAuth(password, code || undefined, email || undefined);

  if (!result.ok && !result.need2fa && !result.needAccessCode) {
    return NextResponse.json(
      { error: result.error || "Credenciales inválidas" },
      { status: 401 }
    );
  }

  if (result.needAccessCode) {
    return NextResponse.json(
      { needAccessCode: true, error: result.error },
      { status: 200 }
    );
  }

  if (result.need2fa) {
    return NextResponse.json({ need2fa: true }, { status: 200 });
  }

  const res = NextResponse.json({ ok: true, role: result.claims?.role });
  res.headers.append("Set-Cookie", adminCookie(result.token!));
  for (const c of adminIdentityCookies(result.claims!)) {
    res.headers.append("Set-Cookie", c);
  }
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.headers.append("Set-Cookie", clearAdminCookie());
  for (const c of clearAdminIdentityCookies()) {
    res.headers.append("Set-Cookie", c);
  }
  res.headers.append("Set-Cookie", clearTwoFaCookie());
  return res;
}
