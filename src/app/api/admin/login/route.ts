import { NextResponse } from "next/server";
import {
  verifyAdminAuth,
  twoFaCookie,
  clearTwoFaCookie,
  isAdminConfigured,
} from "@/lib/admin-auth";

export async function POST(req: Request) {
  if (!isAdminConfigured()) {
    return NextResponse.json({ error: "Admin no configurado" }, { status: 500 });
  }
  const body = await req.json().catch(() => null);
  const password = String(body?.password || "");
  const code = String(body?.code || "");

  const result = await verifyAdminAuth(password, code || undefined);

  if (!result.ok && !result.need2fa) {
    return NextResponse.json({ error: result.error || "Credenciales inválidas" }, { status: 401 });
  }

  if (result.need2fa) {
    return NextResponse.json({ need2fa: true }, { status: 200 });
  }

  const res = NextResponse.json({ ok: true });
  if (result.cookie) res.headers.set("Set-Cookie", result.cookie);
  if (result.twoFaCookie) res.headers.set("Set-Cookie", result.twoFaCookie);
  return res;
}

export async function DELETE(req: Request) {
  const res = NextResponse.json({ ok: true });
  res.headers.set("Set-Cookie", `lumaei_admin=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`);
  res.headers.set("Set-Cookie", clearTwoFaCookie());
  return res;
}