import { getStripe, toStripeAmount } from "./stripe";
import { readStoreSettings } from "./settings-db";
import type { Order } from "./types";

/**
 * Construye los line_items de una sesión Stripe para un pedido.
 * SIEMPRE incluye descuento (línea negativa) e IVA/tax — la sesión debe
 * cobrar exactamente el total del pedido, o el guardrail del webhook
 * (amount_mismatch) bloquea el fulfillment.
 * Labels localizados por mercado (MX→ES, US→EN).
 * Moneda: MXN para México (con OXXO/SPEI), USD para US.
 */
export async function buildOrderLineItems(order: Order) {
  const s = await readStoreSettings();
  const currency = order.market === "MX" ? "mxn" : "usd";
  // Para MXN: redondeo a centavos (Stripe usa amount en centavos)
  // Para USD: toStripeAmount ya maneja centavos
  const conv = (usd: number) => {
    if (currency === "mxn") {
      const rate = s.usdToMxn ?? 17.36;
      return Math.round(usd * rate * 100); // MXN centavos
    }
    return toStripeAmount(usd);
  };
  const es = order.market === "MX";

  return [
    ...order.items.map((i) => ({
      price_data: {
        currency,
        product_data: { name: i.name },
        unit_amount: conv(i.unitPrice),
      },
      quantity: i.qty,
    })),
    ...(order.discount && order.discount > 0
      ? [
          {
            price_data: {
              currency,
              product_data: { name: es ? "Descuento promo" : "Promo discount" },
              unit_amount: -conv(order.discount),
            },
            quantity: 1,
          },
        ]
      : []),
    ...(order.tax && order.tax > 0
      ? [
          {
            price_data: {
              currency,
              product_data: {
                name: es
                  ? `IVA (${(s.taxRateMx * 100).toFixed(0)}%)`
                  : `Tax (${(s.taxRateUs * 100).toFixed(0)}%)`,
              },
              unit_amount: conv(order.tax),
            },
            quantity: 1,
          },
        ]
      : []),
  ];
}

/** Opción de envío de la sesión, localizada por mercado. */
export async function buildShippingOption(order: Order) {
  const currency = order.market === "MX" ? "mxn" : "usd";
  const s = await readStoreSettings();
  const conv = (usd: number) => {
    if (currency === "mxn") {
      const rate = s.usdToMxn ?? 17.36;
      return Math.round(usd * rate * 100);
    }
    return toStripeAmount(usd);
  };
  return {
    shipping_rate_data: {
      type: "fixed_amount" as const,
      fixed_amount: {
        amount: conv(order.shipping),
        currency,
      },
      display_name: order.market === "MX" ? "Envío" : "Shipping",
    },
  };
}

/**
 * Crea una sesión Stripe de pago para un pedido y guarda el session id.
 * Usada por /api/checkout y /api/orders/[id]/pay (misma construcción →
 * mismo total → el guardrail del webhook nunca salta).
 */
export async function createOrderCheckoutSession(
  order: Order,
  origin: string
): Promise<{ url: string | null; id: string }> {
  const stripe = getStripe();
  const isMX = order.market === "MX";

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: isMX ? ["card", "oxxo", "spei"] : ["card"],
    line_items: await buildOrderLineItems(order),
    metadata: { orderId: order.id },
    customer_email: order.customer.email,
    shipping_address_collection: {
      allowed_countries: isMX ? ["MX"] : ["US"],
    },
    shipping_options: [await buildShippingOption(order)],
    tax_id_collection: { enabled: false },
    success_url: `${origin}/pedido/${order.id}?stripe=success&key=${order.accessToken}`,
    cancel_url: `${origin}/checkout?cancelado=1`,
  });

  await import("./orders-db").then((m) =>
    m.updateOrder(order.id, { stripeSessionId: session.id })
  );

  return { url: session.url, id: session.id };
}
