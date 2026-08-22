// src/app/api/cron/support/route.ts
// Cron de soporte autónomo: procesa el inbox de AgentMail, responde dentro de
// política y escala a el dueño lo que no puede resolverse solo.
import { NextRequest, NextResponse } from "next/server";
import { processInbound } from "@/lib/automation/support";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const secret =
    req.nextUrl.searchParams.get("secret") || req.headers.get("x-cron-secret");
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const since = req.nextUrl.searchParams.get("since") || undefined;
  const result = await processInbound(since);
  return NextResponse.json(result);
}
