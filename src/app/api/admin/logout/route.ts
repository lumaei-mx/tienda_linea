import { NextResponse } from "next/server";
import {
  clearAdminCookie,
  clearAdminIdentityCookies,
  clearTwoFaCookie,
} from "@/lib/admin-auth";

function withClearedCookies(res: NextResponse): NextResponse {
  res.headers.append("Set-Cookie", clearAdminCookie());
  for (const c of clearAdminIdentityCookies()) {
    res.headers.append("Set-Cookie", c);
  }
  res.headers.append("Set-Cookie", clearTwoFaCookie());
  return res;
}

export async function POST() {
  return withClearedCookies(NextResponse.json({ ok: true }));
}

export async function GET(req: Request) {
  const host = req.headers.get("host") || "localhost:3000";
  const proto = req.headers.get("x-forwarded-proto") || "http";
  return withClearedCookies(
    NextResponse.redirect(new URL("/admin/login", `${proto}://${host}`), 303)
  );
}
