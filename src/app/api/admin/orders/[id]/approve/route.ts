import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { getOrder, saveOrder, updateOrder } from "@/lib/orders-db";
import { fulfillOrder } from "@/lib/cj";
import { sendOrderConfirmation } from "@/lib/email";
import { notifyOwner } from "@/lib/automation/alert";
import { readStoreSettings } from "@/lib/settings-db";

export const dynamic = "force-dynamic";

/**
 * Aprueba el cumplimiento de un pedido en `awaiting_owner_approval`.
 * Esta es la ÚNICA vía que libera saldo del proveedor (gasto de efectivo):
 * requiere sesión admin válida. Tras aprobar, se crea la orden en CJ y se
 * notifica al cliente que su pedido va en camino.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminRequest(req))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const { id } = await params;
  const order = await getOrder(id);
  if (!order) {
    return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
  }
  if (order.status !== "awaiting_owner_approval") {
    return NextResponse.json(
      {
        error: `El pedido no está en espera de autorización (estado actual: ${order.status}).`,
      },
      { status: 409 }
    );
  }

  // KILL-SWITCH: si pauseFulfill está activo, rechazar la aprobación
  const settings = await readStoreSettings();
  if (settings.pauseFulfill) {
    return NextResponse.json(
      { error: "Fulfill pausado globalmente (pauseFulfill=true). No se puede aprobar." },
      { status: 409 }
    );
  }

  // Estado intermedio persistente ANTES de tocar CJ: si el proceso muere a
  // mitad del fulfill (timeout), se puede reintentar manualmente.
  await updateOrder(id, {
    status: "fulfillment_queued",
    updatedAt: new Date().toISOString(),
  });

  try {
    const fulfilled = await fulfillOrder(order);
    await saveOrder(fulfilled);

    // Avisar al cliente que su pedido va en camino (confirmación real).
    const email = await sendOrderConfirmation(fulfilled);
    await updateOrder(id, {
      emailStatus: email.skipped ? "skipped" : email.ok ? "sent" : "error",
      emailError: email.ok || email.skipped ? undefined : email.error,
    });

    await notifyOwner(
      "order_approved",
      `Pedido ${id} (${fulfilled.market}) autorizado y enviado a cumplimiento. Estado CJ: ${fulfilled.cjOrderStatus || fulfilled.status}.`,
      "info"
    ).catch(() => {});

    return NextResponse.json({
      ok: true,
      status: fulfilled.status,
      cjOrderId: fulfilled.cjOrderId || null,
      emailStatus: email.ok ? "sent" : email.skipped ? "skipped" : "error",
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "error cumpliendo";
    await updateOrder(id, {
      status: "awaiting_owner_approval",
      notes: `Falló la aprobación: ${msg}. Reintentar.`,
      updatedAt: new Date().toISOString(),
    });
    await notifyOwner(
      "approve_failed",
      `Pedido ${id}: falló al cumplir tras aprobar (${msg}).`,
      "critical"
    ).catch(() => {});
    return NextResponse.json(
      { error: `Falló el cumplimiento: ${msg}` },
      { status: 500 }
    );
  }
}
