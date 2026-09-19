import { NextResponse } from "next/server";
import { authorizeCron } from "@/lib/cron-auth";
import { isAdminRequest } from "@/lib/admin-auth";
import { runReprice } from "@/lib/automation/reprice";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  // Aceptar cron secret O admin autenticado.
  const cronUnauthorized = authorizeCron(req);
  const admin = await isAdminRequest(req);
  if (cronUnauthorized && !admin) {
    return cronUnauthorized;
  }
  try {
    const result = await runReprice();

    // Si cambió algún precio, dispara redeploy (deploy hook) para que las
    // guías del blog re-horneen precios vía guide-prices.ts y nunca diverjan
    // de la tienda. Fire-and-forget con guarda por env var; sin costo.
    if (result.repriced > 0 && process.env.DEPLOY_HOOK_URL) {
      try {
        await fetch(process.env.DEPLOY_HOOK_URL, { method: "POST" });
      } catch {
        // El reprice ya ocurrió; un fallo del hook no debe fallar la respuesta.
      }
    }

    return NextResponse.json({ ok: true, result });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "error";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

// Puede llegar por GET; delega al mismo handler protegido.
export async function GET(req: Request) {
  return POST(req);
}
