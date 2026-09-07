import { NextResponse } from "next/server";
import { authorizeCron } from "@/lib/cron-auth";
import { runDigest } from "@/lib/automation/digest";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(req: Request) {
  const denied = authorizeCron(req);
  if (denied) return denied;
  try {
    const result = await runDigest();
    return NextResponse.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "error";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

// cron-job.org puede usar GET o POST; ambos usan la misma auth.
export async function POST(req: Request) {
  return GET(req);
}
