// src/app/api/admin/escalations/route.ts
// Cola de escalaciones de soporte: el humano APRUEBA o ABORTA lo que el bot
// propone enviar. Abortar es una acción de escritura (rol admin/owner).
import { NextResponse } from "next/server";
import { isAdminRequest, isOwner, getAdminClaims } from "@/lib/admin-auth";
import {
  abortEscalation,
  approveEscalation,
  expireStaleEscalations,
  listEscalations,
  type EscalationStatus,
} from "@/lib/support-escalations";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!(await isAdminRequest(req))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  // Barrido perezoso: expira lo que ya pasó el plazo sin decisión humana.
  await expireStaleEscalations().catch(() => 0);
  const status = new URL(req.url).searchParams.get("status") as EscalationStatus | null;
  const escalations = await listEscalations(status || undefined);
  return NextResponse.json({ escalations });
}

export async function POST(req: Request) {
  if (!(await isOwner(req))) {
    return NextResponse.json(
      { error: "Se requiere rol admin u owner" },
      { status: 403 }
    );
  }
  const body = await req.json().catch(() => null);
  const id = typeof body?.id === "string" ? body.id : "";
  const action = typeof body?.action === "string" ? body.action : "";
  if (!id || (action !== "approve" && action !== "abort")) {
    return NextResponse.json(
      { error: "Se requiere id y action=approve|abort" },
      { status: 400 }
    );
  }
  const claims = await getAdminClaims(req);
  const actor = `admin:${claims?.email || "unknown"}`;

  if (action === "approve") {
    const finalReply =
      typeof body?.finalReply === "string" && body.finalReply.trim()
        ? body.finalReply.trim().slice(0, 2000)
        : undefined;
    const esc = await approveEscalation(id, actor, { finalReply });
    if (!esc) return NextResponse.json({ error: "Escalación no encontrada" }, { status: 404 });
    return NextResponse.json({ ok: true, escalation: esc });
  }

  const reason =
    typeof body?.reason === "string" && body.reason.trim()
      ? body.reason.trim().slice(0, 500)
      : undefined;
  const esc = await abortEscalation(id, actor, reason);
  if (!esc) return NextResponse.json({ error: "Escalación no encontrada" }, { status: 404 });
  return NextResponse.json({ ok: true, escalation: esc });
}
