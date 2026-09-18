import { NextResponse } from "next/server";
import { isOwner } from "@/lib/admin-auth";
import { resendOrderConfirmationById } from "@/lib/email";

export const dynamic = "force-dynamic";

/** Reenvío manual de la confirmación de pedido (admin). */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isOwner(req))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const { id } = await params;
  const result = await resendOrderConfirmationById(id);
  if (result.found === false) {
    return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
  }
  if (result.skipped) {
    return NextResponse.json(
      { error: "Email no configurado (falta GMAIL_APP_PASSWORD)." },
      { status: 400 }
    );
  }
  if (!result.ok) {
    return NextResponse.json(
      { error: `Error enviando email: ${result.error}` },
      { status: 500 }
    );
  }
  return NextResponse.json({ ok: true });
}
