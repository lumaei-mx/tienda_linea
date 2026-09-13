import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";

export async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;

  // Protege las páginas /admin (fail-closed: sin token válido → /admin/login).
  // Las APIs de admin tienen su propio chequeo (isAdminRequest) y las APIs
  // públicas quedan abiertas.
  if (path === "/admin" || path.startsWith("/admin/")) {
    if (path !== "/admin/login") {
      return (await requireAdmin(req)) ?? NextResponse.next();
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
