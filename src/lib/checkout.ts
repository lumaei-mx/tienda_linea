import { randomUUID, randomBytes } from "crypto";
import { getProductByIdAsync } from "./products-db";
import { readStoreSettings } from "./settings-db";
import {
  calcShipping,
  calcTax,
  productPrice,
} from "./money";
import { throwCheckoutError } from "./checkout-errors";
import type {
  Address,
  CartItem,
  Customer,
  Market,
  Order,
  OrderItem,
} from "./types";
import { getOrder, saveOrder, updateOrder } from "./orders-db";
import { notifyOwner } from "./automation/alert";
import { incrementPromoUsage, validatePromo } from "./promo-db";
import { trackOrderPaid } from "./tiktok-events";
import { sendOrderAwaitingApproval, sendOwnerApprovalRequest } from "./email";

export interface CheckoutInput {
  items: CartItem[];
  market: Market;
  customer: Customer;
  shippingAddress: Address;
  promoCode?: string;
  /** Ref de afiliado normalizado (programa de influencers). Opcional. */
  ref?: string;
}

/**
 * Fase 1 — crea el pedido en estado pending_payment.
 * No toca CJ. El fulfill SOLO ocurre tras pago verificado.
 */
export async function createPendingOrder(input: CheckoutInput): Promise<Order> {
  const { market, customer } = input;
  const currency = market === "MX" ? "MXN" : "USD";
  const s = await readStoreSettings();
  const orderItems: OrderItem[] = [];

  for (const line of input.items) {
    const product = await getProductByIdAsync(line.productId);
    if (!product) throwCheckoutError("CHECKOUT:PRODUCT_NOT_FOUND", line.productId);
    if (product.stock < line.qty) {
      throwCheckoutError("CHECKOUT:INSUFFICIENT_STOCK", product.name);
    }
    orderItems.push({
      productId: product.id,
      name: product.name,
      qty: line.qty,
      unitPrice: productPrice(product),
      cjSku: product.cjSku,
      cjVariantId: product.cjVariantId || product.cjSku,
      costUsd: product.costUsd,
    });
  }

  if (orderItems.length === 0) throwCheckoutError("CHECKOUT:EMPTY_CART");

  const subtotal = orderItems.reduce((s, i) => s + i.unitPrice * i.qty, 0);

  // promo aplicada sobre subtotal (antes de envío/impuesto)
  let discount = 0;
  let promoCode: string | undefined;
  if (input.promoCode) {
    const promo = await validatePromo(input.promoCode, market, subtotal);
    if (promo) {
      discount = promo.discount;
      promoCode = promo.promo.code;
    }
  }
  const netSubtotal = Math.max(0, subtotal - discount);

  const totalQty = input.items.reduce((n, i) => n + i.qty, 0);
  const shipping = calcShipping(s, netSubtotal, market, totalQty);
  const tax = calcTax(s, netSubtotal, shipping, market);
  const total = Number((netSubtotal + shipping + tax).toFixed(2));

  let cogsUsd = 0;
  let shippingCostUsd = 0;
  for (const line of input.items) {
    const p = await getProductByIdAsync(line.productId);
    if (!p) continue;
    cogsUsd += p.costUsd * line.qty;
    shippingCostUsd +=
      (market === "MX" ? p.shippingMxUsd : p.shippingUsUsd) * line.qty;
  }

  const totalUsd = total;
  const paymentFeeUsd = Number((totalUsd * s.paymentFeeRate).toFixed(2));
  // Profit real: NO cuenta el IVA/tax como ingreso (el impuesto se retiene para declarar).
  const estimatedProfitUsd = Number(
    (totalUsd - tax - cogsUsd - shippingCostUsd - paymentFeeUsd).toFixed(2)
  );

  // consumo de la promo cuando se confirma el pago (en confirmPaidOrder)
  const now = new Date().toISOString();
  const order: Order = {
    id: randomUUID(),
    createdAt: now,
    updatedAt: now,
    status: "pending_payment",
    market,
    currency,
    customer,
    shippingAddress: { ...input.shippingAddress, country: market },
    items: orderItems,
    subtotal,
    discount: discount > 0 ? discount : undefined,
    promoCode,
    ref: input.ref,
    shipping,
    tax,
    total,
    cogsUsd,
    shippingCostUsd,
    paymentFeeUsd,
    estimatedProfitUsd,
    // snapshot del tipo de cambio: el webhook normaliza MXN→USD con este rate,
    // no con el rate vivo (pago OXXO puede ocurrir días después).
    rateUsdMxn: s.usdToMxn,
    autoFulfilled: false,
    accessToken: randomBytes(16).toString("hex"),
  };

  await saveOrder(order);
  return order;
}

/**
 * Fase 2 — pago verificado (webhook Stripe / pago demo).
 * Aquí sí se dispara el auto-fulfill a CJ.
 *
 * Modo autónomo (env `AUTO_APPROVE_ORDERS`):
 * - `AUTO_APPROVE_ORDERS=false` (por defecto): el pedido pagado queda en
 *   `awaiting_owner_approval` y el dueño lo autoriza desde /admin. No gasta
 *   saldo CJ hasta la aprobación manual.
 * - `AUTO_APPROVE_ORDERS=true`: tras el pago se marca `fulfillment_queued` y
 *   se llama a `fulfillOrder()` de inmediato (100% autónomo). Requiere
 *   `CJ_AUTO_PAY_BALANCE=true` + `CJ_SANDBOX=false` para cumplimiento real;
 *   si el fulfill falla, el pedido queda en `fulfillment_queued` con nota y
 *   se alerta al dueño (`auto_fulfill_failed`) para reintento manual o
 *   automático vía cron retry-fulfill. La lógica de negocio por defecto no
 *   cambia: sin la env var todo sigue igual (aprobación manual).
 */
export async function confirmPaidOrder(
  orderId: string,
  opts?: {
    paymentProvider?: "stripe" | "demo";
    paymentRef?: string;
    amountPaid?: number;
  }
): Promise<Order> {
  const order = await getOrder(orderId);
  if (!order) throw new Error("Pedido no encontrado");

  // idempotencia: ya pagado/fulfilled — no duplicar (webhook Stripe reenvía hasta 3x)
  if (order.status !== "pending_payment") {
    return order;
  }

  const now = new Date().toISOString();

  // Conversión TikTok (server-side, fire-and-forget) — solo una vez por pedido.
  trackOrderPaid({ ...order, status: "paid" as const });

  let updated: Order = {
    ...order,
    status: "paid",
    paymentProvider: opts?.paymentProvider || "demo",
    paymentRef: opts?.paymentRef || order.paymentRef,
    updatedAt: now,
  };
  if (order.promoCode) {
    await incrementPromoUsage(order.promoCode).catch(() => {});
  }
  await saveOrder(updated);

  await notifyOwner(
    "order_paid",
    `Nuevo pedido pagado (${updated.market}): $${updated.total.toFixed(
      2
    )} USD · ${updated.customer.name} <${updated.customer.email}> · ${
      updated.items.length
    } item(s).`,
    "info"
  ).catch(() => {});

  // Afiliado: la comisión se acredita SOLO sobre venta real (profit neto).
  // $0 costo fijo; la comisión sale de la ganancia del pedido.
  if (updated.ref) {
    const { creditAffiliateConversion } = await import("@/lib/affiliates");
    creditAffiliateConversion(updated.ref, updated.estimatedProfitUsd).catch(
      () => {}
    );
  }

  // === GATE de autorización GM ===
  // El cumplimiento libera saldo del proveedor (efectivo). El dueño debe
  // autorizarlo. Tras el pago el pedido queda en `awaiting_owner_approval` y se
  // NOTIFICA al dueño para que apruebe desde el admin. El cliente recibe
  // "pago recibido / en autorización", NO la confirmación de envío (esa se
  // envía al aprobar, en la ruta admin de aprobación).
  type EmailResult = { ok: boolean; skipped?: boolean; error?: string };
  const emailPromise: Promise<EmailResult> = sendOrderAwaitingApproval(updated)
    .catch((err): EmailResult => ({
      ok: false,
      error: err instanceof Error ? err.message : "error enviando email",
    }));
  const ownerEmailPromise: Promise<EmailResult> = sendOwnerApprovalRequest(updated)
    .catch((err): EmailResult => ({
      ok: false,
      error: err instanceof Error ? err.message : "error",
    }));

  updated = {
    ...updated,
    status: "awaiting_owner_approval",
    updatedAt: new Date().toISOString(),
  };
  await saveOrder(updated);

  await notifyOwner(
    "order_awaiting_approval",
    `Pedido ${orderId} (${updated.market}) requiere tu autorización para cumplir. Ganancia est. $${updated.estimatedProfitUsd.toFixed(
      2
    )} USD · COGS $${updated.cogsUsd.toFixed(2)} + envío $${updated.shippingCostUsd.toFixed(
      2
    )}. Ábrelo en /admin/pedido/${orderId}.`,
    "info"
  ).catch(() => {});

  // Cierre: persiste el resultado de AMBOS emails y alerta cuando alguno falla.
  const [emailResult, ownerResult] = await Promise.all([
    emailPromise,
    ownerEmailPromise,
  ]);
  const emailStatus: Order["emailStatus"] = emailResult.skipped
    ? "skipped"
    : emailResult.ok
      ? "sent"
      : "error";
  updated = {
    ...updated,
    emailStatus,
    emailError: emailResult.ok || emailResult.skipped ? undefined : emailResult.error,
    notes: ownerResult.ok
      ? updated.notes
      : `${updated.notes ? updated.notes + " " : ""}Aviso al dueño (email) ${
          ownerResult.skipped
            ? "omitido (sin GMAIL_APP_PASSWORD)"
            : `falló: ${ownerResult.error}`
        }.`,
  };
  await saveOrder(updated);

  if (emailResult.skipped) {
    await notifyOwner(
      "email_not_configured",
      `Pedido ${orderId}: el email de autorización NO se envió (falta GMAIL_APP_PASSWORD).`,
      "warn"
    ).catch(() => {});
  } else if (!emailResult.ok) {
    await notifyOwner(
      "email_failed",
      `Pedido ${orderId}: falló el email de autorización (${emailResult.error}).`,
      "warn"
    ).catch(() => {});
  }
  if (!ownerResult.ok && !ownerResult.skipped) {
    await notifyOwner(
      "owner_email_failed",
      `Pedido ${orderId}: falló el email de autorización al dueño (${ownerResult.error}).`,
      "warn"
    ).catch(() => {});
  }

  // Auto-aprobación opcional vía env (ver docblock superior).
  // Si AUTO_APPROVE_ORDERS=true, se salta la espera de autorización del dueño
  // y se envía a cumplimiento inmediatamente. Por defecto (unset/false) no hace nada.
  if (process.env.AUTO_APPROVE_ORDERS === "true") {
    const settings = await readStoreSettings();
    // KILL-SWITCH: si pauseFulfill está activo, no auto-aprobar
    if (settings.pauseFulfill) {
      await notifyOwner(
        "auto_fulfill_paused",
        `Pedido ${orderId}: AUTO_APPROVE_ORDERS=true pero pauseFulfill=true. Pedido queda en awaiting_owner_approval.`,
        "warn"
      ).catch(() => {});
      return updated;
    }
    try {
      await updateOrder(orderId, {
        status: "fulfillment_queued",
        updatedAt: new Date().toISOString(),
      });
      const { fulfillOrder } = await import("@/lib/cj");
      const fulfilled = await fulfillOrder(updated);
      await saveOrder(fulfilled);

      // Aviso real al cliente: confirmación de pedido en camino
      const { sendOrderConfirmation } = await import("@/lib/email");
      const email = await sendOrderConfirmation(fulfilled);
      await updateOrder(orderId, {
        emailStatus: email.skipped ? "skipped" : email.ok ? "sent" : "error",
        emailError: email.ok || email.skipped ? undefined : email.error,
      });

      await notifyOwner(
        "order_auto_approved",
        `Pedido ${orderId} auto-aprobado y enviado a cumplimiento (flag AUTO_APPROVE_ORDERS). Estado: ${fulfilled.cjOrderStatus || fulfilled.status}.`,
        "info"
      ).catch(() => {});

      return fulfilled;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "error auto-fulfill";
      await updateOrder(orderId, {
        status: "fulfillment_queued",
        notes: `Auto-fulfill falló: ${msg}. Revisión manual o reintentar.`,
        updatedAt: new Date().toISOString(),
      });
      await notifyOwner(
        "auto_fulfill_failed",
        `Pedido ${orderId}: auto-fulfill falló (${msg}).`,
        "critical"
      ).catch(() => {});
    }
  }

  return updated;
}

export async function cancelPendingOrder(orderId: string, reason?: string) {
  const order = await getOrder(orderId);
  if (!order) throw new Error("Pedido no encontrado");
  if (order.status !== "pending_payment") return order;
  return updateOrder(orderId, {
    status: "cancelled",
    notes: reason || "Pago no completado — cancelado automáticamente.",
  });
}
