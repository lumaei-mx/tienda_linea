import { NextResponse } from "next/server";

/**
 * Autorización unificada de crons.
 * Válida para GET y POST. Acepta el secreto vía:
 *   - header `x-cron-secret: <CRON_SECRET>`
 *   - header `authorization: Bearer <CRON_SECRET>`
 *   - query `?secret=<CRON_SECRET>` (útil para "Run job" manual y Vercel Cron)
 */
export function authorizeCron(req: Request): NextResponse | null {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET no configurado" }, { status: 500 });
  }
  const header =
    req.headers.get("x-cron-secret") ||
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (header === secret) return null;
  try {
    const url = new URL(req.url);
    const qs = url.searchParams.get("secret") || url.searchParams.get("cron_secret");
    if (qs === secret) return null;
  } catch {
    /* URL no parseable: se valida solo por header */
  }
  return NextResponse.json({ error: "No autorizado" }, { status: 401 });
}
