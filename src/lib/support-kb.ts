// src/lib/support-kb.ts
// Base de conocimiento del bot de soporte Lumaei 24/7 (ES/EN).
// Sin dependencias externas: regex + respuestas con links. Puro → server y cliente.

export type SupportLang = "es" | "en";

export type SupportIntent =
  | "order_status"
  | "shipping"
  | "returns"
  | "warranty"
  | "payment"
  | "product"
  | "human"
  | "greeting"
  | "fallback";

export interface BotAnswer {
  reply: string;
  intent: SupportIntent;
  escalated: boolean;
}

export const SUPPORT_CONTACT = {
  email: "lumaeiMX@gmail.com",
  whatsappDisplay: "+1 408 422 3904",
  whatsappUrl: "https://wa.me/14084223904",
} as const;

export const UUID_RE =
  /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

export function normalizeLang(raw: unknown): SupportLang {
  if (typeof raw === "string" && raw.toLowerCase().startsWith("en")) return "en";
  return "es";
}

export function extractOrderId(text: string): string | null {
  if (!text) return null;
  const m = text.match(UUID_RE);
  return m ? m[0] : null;
}

const REPLIES: Record<SupportIntent, { es: string; en: string }> = {
  greeting: {
    es: "¡Hola! Soy el asistente Lumaei 🤖 ¿En qué te ayudo? Puedo ayudarte con: rastrear pedido, envíos, garantía, devoluciones o pagos. Si prefieres un humano, escríbeme tu correo y te contactamos.",
    en: "Hi! I'm the Lumaei assistant 🤖 How can I help? I can help with: tracking orders, shipping, warranty, returns or payments. If you'd rather talk to a human, send me your email and we'll reach out.",
  },
  order_status: {
    es: "Con gusto te ayudo con tu pedido 📦 Pega aquí tu número de pedido (el UUID que recibiste por correo) y te digo el estado al instante. También puedes verlo en /pedido/[id]?key= con tu clave de acceso. ¿Me lo compartes?",
    en: "Happy to help with your order 📦 Paste your order number here (the UUID from your confirmation email) and I'll check the status instantly. You can also view it at /pedido/[id]?key= with your access key. Could you share it?",
  },
  shipping: {
    es: "Envíos Lumaei 🚚: México 14-16 días, EE.UU. 4-7 días. Envío GRATIS desde 2 piezas o en pedidos desde $49. Detalle y coberturas en /envios. Rastrea tu pedido con el link que recibiste por correo (/pedido/[id]?key=).",
    en: "Lumaei shipping 🚚: Mexico 14-16 days, US 4-7 days. FREE shipping from 2 pieces or on orders over $49. Details at /envios. Track your order with the link from your email (/pedido/[id]?key=).",
  },
  returns: {
    es: "Devoluciones 🔄: si tu pieza llega dañada o no funciona, la reponemos sin costo dentro de los 25 días posteriores a la entrega — solo necesitamos foto o video del problema. Escríbenos a lumaeiMX@gmail.com o por WhatsApp +1 408 422 3904 con tu número de pedido. Política completa en /devoluciones.",
    en: "Returns 🔄: if your piece arrives damaged or doesn't work, we replace it free within 25 days after delivery — we just need a photo or video of the issue. Email lumaeiMX@gmail.com or WhatsApp +1 408 422 3904 with your order number. Full policy at /devoluciones.",
  },
  warranty: {
    es: "Garantía Lumaei ✅: reposición sin costo dentro de los 25 días posteriores a la entrega si el producto llega dañado o no funciona. Solo envíanos foto o video a lumaeiMX@gmail.com o WhatsApp +1 408 422 3904 con tu número de pedido y agendamos la reposición. Más info en /devoluciones.",
    en: "Lumaei warranty ✅: free replacement within 25 days after delivery if the product arrives damaged or doesn't work. Just send a photo or video to lumaeiMX@gmail.com or WhatsApp +1 408 422 3904 with your order number and we'll schedule the replacement. More info at /devoluciones.",
  },
  payment: {
    es: "Pagos 💳: cobramos con Stripe en MXN o USD según tu país (México en pesos, EE.UU. en dólares). Aceptamos tarjeta, OXXO/SPEI donde aplique. Si tu pago falló, revisa /checkout o escríbenos a lumaeiMX@gmail.com con tu correo de compra.",
    en: "Payments 💳: we charge via Stripe in MXN or USD depending on your country (Mexico in pesos, US in dollars). We accept cards, OXXO/SPEI where available. If your payment failed, check /checkout or email lumaeiMX@gmail.com with your purchase email.",
  },
  product: {
    es: "Catálogo 🛍️: piezas seleccionadas con stock en tiempo real en /productos. Precios en USD (Stripe convierte al cobrar). ¿Buscas algo en especial? Cuéntame y te recomiendo. Afiliados: ganan 15% de comisión — info en /afiliados.",
    en: "Catalog 🛍️: hand-picked pieces with live stock at /productos. Prices in USD (Stripe converts at checkout). Looking for something specific? Tell me and I'll recommend. Affiliates earn 15% commission — see /afiliados.",
  },
  human: {
    es: "Claro, te conecto con un humano 🙋 Escríbenos a lumaeiMX@gmail.com o WhatsApp +1 408 422 3904 (atención 24/7, respondemos en menos de 24h). O deja tu mensaje en este chat con tu correo y número de pedido y te contactamos.",
    en: "Of course, connecting you to a human 🙋 Email lumaeiMX@gmail.com or WhatsApp +1 408 422 3904 (24/7, we reply within 24h). Or leave your message in this chat with your email and order number and we'll reach out.",
  },
  fallback: {
    es: "Gracias por tu mensaje 🙏 Un humano lo revisará en menos de 24h. Mientras tanto: envíos MX 14-16 días / US 4-7 días (/envios), garantía de reposición 25 días (/devoluciones), rastreo en /pedido/[id]?key=. Contacto directo: lumaeiMX@gmail.com · WhatsApp +1 408 422 3904.",
    en: "Thanks for your message 🙏 A human will review it within 24h. Meanwhile: shipping MX 14-16 days / US 4-7 days (/envios), 25-day replacement warranty (/devoluciones), tracking at /pedido/[id]?key=. Direct contact: lumaeiMX@gmail.com · WhatsApp +1 408 422 3904.",
  },
};

export function answerBotMessage(msg: string, lang: SupportLang): BotAnswer {
  const t = (msg || "").toLowerCase();
  const L: SupportLang = lang === "en" ? "en" : "es";

  const pick = (intent: SupportIntent, escalated = false): BotAnswer => ({
    reply: REPLIES[intent][L],
    intent,
    escalated,
  });

  if (!t.trim()) return pick("greeting");

  // Humano primero (tiene prioridad sobre el resto)
  if (
    /(human|humano|asesor|agente|agent|persona real|alguien real|representative|operador|whatsapp|tel[eé]fono|llamar|call me|hablar con (un |una |alguien|persona)|quiero hablar)/i.test(
      t
    )
  ) {
    return pick("human", true);
  }

  // Estado de pedido (incluye UUID pegado)
  if (
    UUID_RE.test(msg) ||
    /(pedido|orden|order|rastrea|tracking|track|seguimiento|d[oó]nde (est[aá]|viene|va)|where.*(order|package)|order status|estado del pedido|n[uú]mero de (pedido|orden)|mi paquete|no ha llegado|no me ha llegado)/i.test(
      t
    )
  ) {
    return pick("order_status");
  }

  if (
    /(env[ií]o|shipping|delivery|entrega|cuanto tarda|cuánto tarda|how long|tiempos? de env|tardan?|tarifa|gratis|free shipping|desde \$49|2 piezas|cuando llega|cuándo llega|when will.*arrive)/i.test(
      t
    )
  ) {
    return pick("shipping");
  }

  if (
    /(garant|warranty|dañ|roto|broken|defect|no funciona|doesn.?t work|reposici|replacement|foto o video|25 d[ií]as)/i.test(
      t
    )
  ) {
    return pick("warranty");
  }

  if (
    /(devol|return|refund|reembolso|cambio|quiero cancelar|cancel.*(pedido|orden)|cancel my order)/i.test(
      t
    )
  ) {
    return pick("returns");
  }

  if (
    /(pago|payment|stripe|checkout|tarjeta|card|oxxo|spei|moneda|currency|\bmxn\b|\busd\b|d[oó]lar|pesos?|factura|invoice|no pude pagar|pago rechazado|payment failed)/i.test(
      t
    )
  ) {
    return pick("payment");
  }

  if (
    /(producto|product|talla|size|color|material|stock|disponible|available|afiliad|affiliate|comisi|precio|price|cat[aá]logo|recomienda|que me recomiendas)/i.test(
      t
    )
  ) {
    return pick("product");
  }

  if (
    /^(\s*(hola|hi|hello|hey|buenas|buenos d[ií]as|buenas tardes|buenas noches|good morning|good afternoon|good evening|gracias|thanks|thank you|adi[oó]s|bye)\b[\s!.?]*)+$/i.test(
      t
    )
  ) {
    return pick("greeting");
  }

  return pick("fallback", true);
}
