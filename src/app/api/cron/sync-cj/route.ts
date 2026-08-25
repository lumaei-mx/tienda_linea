import { NextResponse } from "next/server";
import { authorizeCron } from "@/lib/cron-auth";
import { runCjSync } from "@/lib/automation/sync-cj";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const unauthorized = authorizeCron(req);
  if (unauthorized) return unauthorized;
  try {
    const result = await runCjSync();
    return NextResponse.json({ ok: true, result });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "error";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

// Vercel Cron dispara con GET; delega al mismo handler protegido.
export async function GET(req: Request) {
  return POST(req);
}
