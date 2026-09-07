import { NextResponse } from "next/server";
import { authorizeCron } from "@/lib/cron-auth";
import { runTrends } from "@/lib/automation/trends";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const unauthorized = authorizeCron(req);
  if (unauthorized) return unauthorized;
  try {
    const result = await runTrends();
    return NextResponse.json({ ok: true, result });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "error";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

// Vercel Cron dispara con GET; cron-job.org puede usar GET o POST.
export async function GET(req: Request) {
  return POST(req);
}
