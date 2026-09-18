import { NextResponse, type NextRequest } from "next/server";

const COOKIE = "lumaei_admin";

/**
 * Proxy (antes middleware) — Next 16 lo lee de `src/proxy.ts`.
 *
 * Protege las páginas /admin de forma FAIL-CLOSED: sin cookie válida se
 * redirige a /admin/login. La verificación de firma se hace aquí mismo
 * (WebCrypto HMAC), sin depender de imports de servidor que no están
 * disponibles en el runtime del proxy.
 *
 * Este archivo existía como `proxy.ts.bak` (rename accidental en el commit
 * 0ea2106), así que la protección llevaba tiempo DESACTIVADA y /admin era
 * alcanzable sin sesión.
 */
const TOKEN_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

async function sign(value: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function tokenIsValid(token: string | undefined): Promise<boolean> {
  const secret = process.env.ADMIN_SECRET;
  if (!secret || !token) return false;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return false;
  if (!safeEqual(sig, await sign(payload, secret))) return false;
  try {
    const parsed = JSON.parse(atob(payload)) as { t?: number };
    if (typeof parsed.t === "number" && Date.now() - parsed.t > TOKEN_MAX_AGE_MS) {
      return false;
    }
  } catch {
    return false;
  }
  return true;
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname === "/admin/login" || pathname.startsWith("/admin/login/")) {
    return NextResponse.next();
  }

  const token = req.cookies.get(COOKIE)?.value;
  if (await tokenIsValid(token)) return NextResponse.next();

  const url = req.nextUrl.clone();
  url.pathname = "/admin/login";
  url.search = "";
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
