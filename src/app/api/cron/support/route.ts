// src/app/api/cron/support/route.ts
// Cron de soporte autónomo: procesa el inbox de AgentMail, responde dentro de
// política y escala al dueño lo que no puede resolverse solo.
import { NextResponse } from "next/server";
import { authorizeCron } from "@/lib/cron-auth";
import { processInbound } from "@/lib/automation/support";

export const dynamic = "force-dynamic";

async function handleSupport(req: Request) {
  const denied = authorizeCron(req);
  if (denied) return denied;
  try {
    let since: string | undefined;
    try {
      since = new URL(req.url).searchParams.get("since") || undefined;
    } catch {
      since = undefined;
    }
    const result = await processInbound(since);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "error";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

export async function GET(req: Request) {
  return handleSupport(req);
}

// Puede llegar por GET o POST; ambos usan la misma auth.
export async function POST(req: Request) {
  return handleSupport(req);
}
