import { NextResponse } from "next/server";
import { isOwner } from "@/lib/admin-auth";
import { getAffiliate, markCommissionPaid } from "@/lib/affiliates";

export const dynamic = "force-dynamic";

/**
 * Marca la comisión pendiente de un afiliado como pagada.
 * El pago real es por transferencia manual (fuera de Stripe); este endpoint
 * solo mueve el saldo pendiente → pagado en el registro para conciliar.
 * Requiere sesión admin válida.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  if (!(await isOwner(req))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const { code } = await params;
  const aff = await getAffiliate(code);
  if (!aff) {
    return NextResponse.json({ error: "Afiliado no encontrado" }, { status: 404 });
  }
  if (aff.commissionPendingUsd <= 0) {
    return NextResponse.json({ ok: true, affiliate: aff, note: "Sin comisión pendiente." });
  }
  await markCommissionPaid(code);
  const updated = await getAffiliate(code);
  return NextResponse.json({ ok: true, affiliate: updated });
}
