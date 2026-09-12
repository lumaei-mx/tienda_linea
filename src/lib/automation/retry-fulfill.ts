import { getOrder, readOrders, saveOrder } from "@/lib/orders-db";
import {
  fulfillOrder,
  isCjBalanceError,
  isCjOrderExistsError,
} from "@/lib/cj";
import { readStoreSettings } from "@/lib/settings-db";
import { enqueueRetry, listRetries, removeRetry } from "./queue";
import { notifyOwner } from "./alert";
import type { Order } from "@/lib/types";

const MAX_ATTEMPTS = 3;
const STALE_PAID_MS = 5 * 60 * 1000;

/**
 * Reintenta automáticamente pedidos cuyo fulfill a CJ falló.
 * Lo invoca el cron retry-fulfill (cada 15 min) o el admin manualmente.
 *
 * Además de la cola explícita, barre pedidos huérfanos:
 * - `fulfillment_queued` sin estar en la cola (el proceso murió antes de encolar)
 * - `paid` con autoFulfilled=false y >5 min (el webhook murió tras guardar paid)
 */
export async function runRetryFulfill(): Promise<{
  attempted: number;
  fulfilled: number;
  failed: number;
}> {
  const s = await readStoreSettings();
  
  // KILL-SWITCH: si pauseFulfill está activo, NO procesar retries ni huérfanos
  if (s.pauseFulfill) {
    return { attempted: 0, fulfilled: 0, failed: 0 };
  }

  const retries = await listRetries();
  let fulfilled = 0;
  let failed = 0;

  for (const item of retries) {
    const order = await getOrder(item.orderId);
    if (!order) {
      await removeRetry(item.orderId);
      continue;
    }
    // solo reintentar si sigue en cola
    if (order.status !== "fulfillment_queued") {
      await removeRetry(item.orderId);
      continue;
    }

    const attempt = item.attempts + 1;
    try {
      const done = await fulfillOrder(order);
      await saveOrder(done);
      await removeRetry(item.orderId);
      fulfilled++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "error";
      if (isCjBalanceError(msg)) {
        // Balance CJ insuficiente: reintentar no sirve. Quitar de la cola;
        // el pedido queda fulfillment_queued y la alerta crítica de fondos
        // ya se emitió al confirmar el pago (checkout.ts).
        await removeRetry(item.orderId);
        await saveOrder({
          ...order,
          notes: `Auto-fulfill falló: ${msg}. Balance CJ insuficiente — fondear la cuenta CJ y reintentar manualmente.`,
          updatedAt: new Date().toISOString(),
        });
        failed++;
        continue;
      }
      if (isCjOrderExistsError(msg)) {
        // La orden YA existe en CJ (intento previo la creó). No duplicar:
        // recuperar la orden existente en el panel CJ y poner su ID aquí.
        await removeRetry(item.orderId);
        await saveOrder({
          ...order,
          notes: `Auto-fulfill: la orden CJ ya existe (un intento previo la creó). Verificar en el panel CJ y registrar su ID manualmente. ${msg}`,
          updatedAt: new Date().toISOString(),
        });
        await notifyOwner(
          "cj_order_exists",
          `Pedido ${item.orderId}: la orden CJ ya existe. Recuperar en panel CJ, no reintentar.`,
          "warn"
        );
        failed++;
        continue;
      }
      if (attempt >= MAX_ATTEMPTS) {
        await removeRetry(item.orderId);
        await notifyOwner(
          "fulfill_failed_critical",
          `Pedido ${item.orderId} falló ${attempt} intentos (${msg}). Revisión manual.`,
          "critical"
        );
        failed++;
      } else {
        await enqueueRetry(item.orderId, msg, attempt);
      }
    }
  }

  // Barrido de huérfanos (solo si el auto-fulfill está activo)
  const settings = await readStoreSettings();
  if (settings.autoFulfill) {
    const queued = new Set(retries.map((r) => r.orderId));
    const now = Date.now();
    let orphans: Order[] = [];
    try {
      orphans = await readOrders();
    } catch {
      orphans = [];
    }
    for (const order of orphans) {
      const isStalePaid =
        order.status === "paid" &&
        !order.autoFulfilled &&
        now - new Date(order.updatedAt).getTime() > STALE_PAID_MS;
      const isOrphanQueued =
        order.status === "fulfillment_queued" && !queued.has(order.id);
      if (!isStalePaid && !isOrphanQueued) continue;
      try {
        const done = await fulfillOrder(order);
        await saveOrder(done);
        fulfilled++;
      } catch (err) {
        const msg = err instanceof Error ? err.message : "error";
        if (isCjBalanceError(msg)) {
          await saveOrder({
            ...order,
            notes: `Auto-fulfill falló: ${msg}. Balance CJ insuficiente — fondear la cuenta CJ y reintentar manualmente.`,
            updatedAt: new Date().toISOString(),
          });
        } else if (isCjOrderExistsError(msg)) {
          await saveOrder({
            ...order,
            notes: `Auto-fulfill: la orden CJ ya existe. Verificar en el panel CJ. ${msg}`,
            updatedAt: new Date().toISOString(),
          });
        } else {
          await enqueueRetry(order.id, msg);
        }
        failed++;
      }
    }
  }

  return { attempted: retries.length, fulfilled, failed };
}

export async function retryOrderNow(orderId: string): Promise<boolean> {
  const order = await getOrder(orderId);
  if (!order || order.status !== "fulfillment_queued") return false;
  try {
    const done = await fulfillOrder(order);
    await saveOrder(done);
    await removeRetry(orderId);
    return true;
  } catch {
    return false;
  }
}
