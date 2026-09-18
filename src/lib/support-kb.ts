// src/lib/support-kb.ts
// Base de conocimiento del bot de soporte Lumaei 24/7 (ES/EN).
//
// v2: el bot v1 tenía 9 intenciones de una sola línea y sonaba robótico.
// Ahora cubre preguntas compuestas (varias dudas en un mensaje), intenciones
// más finas (facturación, aduanas, garantía, cancelación, cambio de
// dirección, mayoristas, privacidad, horarios) y responde con un registro
// humano y variado.
//
// El tono se humaniza con: variación de apertura, reconocimiento de la
// emoción y sin repetir la misma fórmula dos veces.
// Puro (sin dependencias) → usable en server y cliente.

export type SupportLang = "es" | "en";

export type SupportIntent =
  | "order_status"
  | "shipping"
  | "returns"
  | "warranty"
  | "payment"
  | "billing"
  | "customs"
  | "product"
  | "recommendation"
  | "availability"
  | "cancel"
  | "address_change"
  | "wholesale"
  | "privacy"
  | "hours"
  | "human"
  | "greeting"
  | "thanks"
  | "fallback";

export interface BotAnswer {
  reply: string;
  intent: SupportIntent;
  /** true = no se puede resolver solo; requiere decisión humana. */
  escalated: boolean;
  /**
   * true = la respuesta compromete dinero/promesas y debe pasar por la cola
   * de escalaciones (un humano puede abortarla antes de que se envíe).
   */
  requiresApproval?: boolean;
  /** Motivo de la escalación, para el panel de gerencia. */
  reason?: string;
  /** Todas las intenciones detectadas (preguntas compuestas). */
  intents?: SupportIntent[];
  /** Acción interna propuesta (reposición, reembolso...). */
  proposedAction?: {
    kind: "replacement" | "refund" | "discount" | "cancel" | "other";
    detail: string;
    amountUsd?: number;
  };
}

export const SUPPORT_CONTACT = {
  email: "lumaeiMX@gmail.com",
  /**
   * El teléfono personal del dueño NO se publica:
   * todo el contacto lo cubre la IA por este chat y por correo.
   */
  whatsappDisplay: "",
  whatsappUrl: "",
} as const;

export const UUID_RE =
  /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

export function normalizeLang(raw: unknown): SupportLang {
  if (typeof raw === "string" && raw.toLowerCase().startsWith("en")) return "en";
  return "es";
}

/**
 * Marcadores que distinguen inglés de español sin librerías.
 *
 * Por qué existe: el widget del sitio manda `lang`, pero el correo no tiene ese
 * dato. El bot de correo asumía español siempre, así que a un cliente de
 * Estados Unidos le respondía en español (y el correo es justo el canal de los
 * clientes US). Se detecta con palabras función, que son las que más se
 * repiten y menos se parecen entre idiomas.
 */
const EN_MARKERS =
  /\b(the|where|when|what|how|why|is|are|was|my|your|i|you|do|does|did|can|could|would|please|thanks|thank|hello|hi|order|refund|return|shipping|delivery|address|change|cancel|track|package|item|not|received|still|need|want|help|problem|wrong|damaged)\b/i;
const ES_MARKERS =
  /\b(el|la|los|las|dónde|donde|cuándo|cuando|qué|que|como|cómo|por|mi|mis|tu|tus|yo|usted|hacer|puedo|podría|por favor|gracias|hola|pedido|reembolso|devolución|devolucion|envío|envio|entrega|dirección|direccion|cambiar|cancelar|rastrear|paquete|artículo|articulo|no|recibí|recibi|todavía|todavia|necesito|quiero|ayuda|problema|equivocado|dañado|danado)\b/i;
/** Caracteres que solo existen en español. */
const ES_ONLY = /[¿¡ñáéíóú]/i;

/** Idioma probable de un texto libre (correo o chat sin `lang` explícito). */
export function detectTextLang(text: string): SupportLang {
  const t = (text || "").slice(0, 1500);
  if (!t.trim()) return "es";
  // Una sola letra acentuada o "¿" ya descarta el inglés.
  if (ES_ONLY.test(t)) return "es";
  const en = (t.match(EN_MARKERS) || []).length;
  const es = (t.match(ES_MARKERS) || []).length;
  if (en === es) return "es"; // empate → mercado principal
  return en > es ? "en" : "es";
}

export function extractOrderId(text: string): string | null {
  if (!text) return null;
  const m = text.match(UUID_RE);
  return m ? m[0] : null;
}

/** Referencia corta (#ABC123) que el cliente ve en sus correos. */
export function extractOrderRef(text: string): string | null {
  if (!text) return null;
  if (UUID_RE.test(text)) return null;
  const m = text.match(/(?:pedido|order|#)\s*#?([a-z0-9]{6,})/i);
  return m ? m[1] : null;
}

// ==== Detección de intenciones ====

interface Rule {
  intent: SupportIntent;
  re: RegExp;
  /** Alto riesgo → requiere visto bueno humano antes de enviar. */
  approval?: boolean;
  reason?: string;
}

/**
 * El orden importa: las reglas de dinero/riesgo van antes que las genéricas,
 * para que "quiero devolver y que me reembolsen" no caiga en `product`.
 */
const RULES: Rule[] = [
  {
    intent: "human",
    re: /(human|humano|asesor|agente|agent|persona real|alguien real|representative|operador|supervisor|gerente|manager|hablar con (un |una |alguien|persona)|quiero hablar|speak to (a )?(human|someone)|real person)/i,
  },
  {
    intent: "cancel",
    re: /(cancel|anular|anula mi|ya no quiero|me arrepient|desist|no lo quiero|arrepentimiento)/i,
    approval: true,
    reason: "Cancelación de pedido solicitada por el cliente",
  },
  {
    intent: "returns",
    re: /(devol|return|refund|reembols|money back|cambio de (producto|talla)|quiero cambiar)/i,
    approval: true,
    reason: "Devolución / reembolso solicitado por el cliente",
  },
  {
    intent: "warranty",
    re: /(garant|warranty|dañ|roto|broken|defect|no funciona|doesn.?t work|fall[oó]|dej[oó] de funcionar|reposici|replacement|foto o video|defectuoso|malfunction)/i,
    approval: true,
    reason: "Garantía / reposición solicitada por el cliente",
  },
  {
    intent: "billing",
    re: /(factur|invoice|cfdi|rfc|comprobante|recibo|tax id|receipt|billing)/i,
  },
  {
    intent: "customs",
    re: /(aduan|customs|arancel|duty|duties|import (fee|tax)|impuesto de importaci|retenci[oó]n|paquete detenido|held at customs|aduana)/i,
  },
  {
    intent: "payment",
    re: /(pago|payment|stripe|checkout|tarjeta|card|oxxo|spei|moneda|currency|\bmxn\b|\busd\b|d[oó]lar|pesos?|no pude pagar|pago rechazado|payment failed|no me cobr|double charg|cargo duplicado|cobro duplicado)/i,
  },
  {
    intent: "address_change",
    re: /(cambiar (la )?(direcci|domicilio)|direcci[oó]n equivocada|wrong address|change.*address|corregir.*(direcci|env[ií]o)|mala direcci)/i,
    approval: true,
    reason: "Cambio de dirección de envío solicitado",
  },
  {
    intent: "availability",
    re: /(agotado|out of stock|when.*(back|restock)|cu[áa]ndo.*(llega|tendr[áa]n|repon|stock)|hay stock|disponible|available again|restock)/i,
  },
  {
    intent: "recommendation",
    re: /(recomiend|recommend|qu[ée] me conviene|which (one|should)|mejor para|best for|sirve para (regalo|gift)|idea de regalo|gift idea|qu[ée] me sugier)/i,
  },
  {
    intent: "wholesale",
    re: /(mayoreo|wholesale|al por mayor|bulk|revend|reseller|distribuidor|distributor|cantidad grande|large quantity)/i,
  },
  {
    intent: "privacy",
    re: /(privacidad|privacy|mis datos|my data|borrar mis datos|delete my data|gdpr|cookies)/i,
  },
  {
    intent: "hours",
    re: /(horario|hours|a qu[ée] hora|what time.*(open|available)|disponibilidad de atenci|cu[áa]ndo (atienden|responden)|when.*respond)/i,
  },
  {
    intent: "order_status",
    re: /(pedido|orden|order|rastrea|tracking|track|seguimiento|d[oó]nde (est[áa]|viene|va)|where.*(order|package)|order status|estado del pedido|n[uú]mero de (pedido|orden)|mi paquete|no ha llegado|no me ha llegado|sin movimiento|no se mueve|stuck)/i,
  },
  {
    intent: "shipping",
    re: /(env[ií]o|shipping|delivery|entrega|cuanto tarda|cu[áa]nto tarda|how long|tiempos? de env|tardan?|tarifa|gratis|free shipping|desde \$49|2 piezas|cuando llega|cu[áa]ndo llega|when will.*arrive)/i,
  },
  {
    intent: "product",
    // Sin términos genéricos ("producto", "precio", "stock"): aparecen en casi
    // cualquier mensaje y metían una respuesta extra que no venía al caso.
    re: /(talla|size|\bcolor\b|material|afiliad|affiliate|comisi|c[áa]logo|catalog|especificacion|spec|medidas|dimension)/i,
  },
];

/** Divide un mensaje en cláusulas para detectar preguntas compuestas. */
function clauses(text: string): string[] {
  return text
    .split(/[.?!;]|\by\b|\band\b|\btambi[eé]n\b|\balso\b|\badem[áa]s\b|,/i)
    .map((c) => c.trim())
    .filter((c) => c.length > 2);
}

/** Detecta TODAS las intenciones presentes (soporta preguntas compuestas). */
export function detectIntents(msg: string): SupportIntent[] {
  const found: SupportIntent[] = [];
  const parts = clauses(msg);
  const push = (i: SupportIntent) => {
    if (!found.includes(i)) found.push(i);
  };
  for (const part of parts) {
    for (const rule of RULES) {
      if (rule.re.test(part)) push(rule.intent);
    }
  }
  // Si las cláusulas no encontraron nada, probar el mensaje completo.
  if (found.length === 0) {
    for (const rule of RULES) {
      if (rule.re.test(msg)) push(rule.intent);
    }
  }

  // Devolución y garantía comparten el mismo trámite (reposición/reembolso):
  // si aparecen juntas, la respuesta duplicada solo confunde. Queda devolución,
  // que es la que cubre el caso de dinero.
  if (found.includes("returns") && found.includes("warranty")) {
    return found.filter((i) => i !== "warranty");
  }
  return found;
}

function ruleFor(intent: SupportIntent): Rule | undefined {
  return RULES.find((r) => r.intent === intent);
}

// ==== Copy: base de cada intención ====

const REPLIES: Record<SupportIntent, { es: string; en: string }> = {
  greeting: {
    es: "¡Hola! Qué bueno que escribiste. Soy el asistente de Lumaei y puedo ayudarte al momento con lo que necesites: rastrear tu pedido, envíos, garantía, devoluciones, pagos o dudas de un producto. Cuéntame qué pasó y lo vemos.",
    en: "Hi! Glad you reached out. I'm the Lumaei assistant and I can help you right away with whatever you need: tracking your order, shipping, warranty, returns, payments or product questions. Tell me what's going on and we'll sort it out.",
  },
  order_status: {
    es: "Claro, vamos a ubicarlo. Pégame el número de pedido que te llegó por correo (formato #ABC123 o el ID largo) y te digo exactamente en qué estado va. También puedes verlo tú mismo en /pedido/[id]?key= con la clave de tu correo.",
    en: "Sure, let's track it down. Paste the order number from your confirmation email (#ABC123 format or the long ID) and I'll tell you exactly where it stands. You can also check it yourself at /pedido/[id]?key= with the key from your email.",
  },
  shipping: {
    es: "Sobre tiempos: México tarda 14 a 16 días y Estados Unidos 4 a 7 días. El envío sale gratis desde 2 piezas o en pedidos de $49 o más, y todos van con número de rastreo. Tienes el detalle completo en /envios.",
    en: "On timing: Mexico takes 14 to 16 days and the US 4 to 7 days. Shipping is free from 2 items or on orders of $49+, and every order ships with a tracking number. Full details at /envios.",
  },
  returns: {
    es: "Vamos a resolverlo. Si tu pieza llegó dañada o no funciona, la reponemos sin costo dentro de los 25 días posteriores a la entrega — solo necesitamos una foto o un video corto del problema. Mándame tu número de pedido y la imagen, y dejo el caso listo para reposición.",
    en: "Let's fix it. If your item arrived damaged or isn't working, we replace it free within 25 days after delivery — we just need a photo or a short video of the issue. Send me your order number and the image and I'll get the replacement ready.",
  },
  warranty: {
    es: "Te cubrimos. La garantía es reposición sin costo dentro de los 25 días posteriores a la entrega si el producto llegó dañado o dejó de funcionar. Compárteme tu número de pedido y una foto o video, y agendo la reposición contigo.",
    en: "You're covered. The warranty is a free replacement within 25 days after delivery if the product arrived damaged or stopped working. Share your order number plus a photo or video and I'll schedule the replacement.",
  },
  payment: {
    es: "Sobre pagos: cobramos con Stripe y el cargo se hace en dólares; tu banco lo convierte a tu moneda. Aceptamos tarjeta y, donde aplica, OXXO/SPEI. Si el cobro falló, revisa /checkout o mándame el correo con el que compraste y lo reviso.",
    en: "On payments: we charge through Stripe in US dollars, and your bank converts to your currency. We accept cards and, where available, OXXO/SPEI. If the charge failed, check /checkout or send me the email you used and I'll look into it.",
  },
  billing: {
    es: "Puedo ayudarte con tu comprobante. Mándame el correo con el que compraste y los datos de facturación (RFC o Tax ID, razón social y régimen fiscal) y te lo preparo. Si solo necesitas un recibo simple, también te lo puedo enviar.",
    en: "I can help with your invoice. Send me the email you used plus your billing details (Tax ID, legal name and tax regime) and I'll prepare it. If you just need a simple receipt, I can send that too.",
  },
  customs: {
    es: "Buen punto y te lo explico claro: en pedidos de varios artículos el valor puede superar la franquicia aduanal de US$50, y en ese caso la aduana puede cobrar aranceles que cubre el destinatario al recibir. No es un cobro nuestro. Si tu paquete está retenido, mándame el número de pedido y lo reviso contigo.",
    en: "Good question, and here's the straight answer: with multiple items the value can exceed the US$50 customs duty-free threshold, and in that case customs may charge duties that the recipient covers on delivery. That isn't a charge from us. If your package is held, send me the order number and I'll look into it with you.",
  },
  product: {
    es: "Con gusto. En /productos está el catálogo con stock en tiempo real y precios en dólares. Si me dices qué buscas (para quién, para qué, cuánto quieres gastar) te señalo las mejores opciones. Ah, y si te interesa el programa de afiliados, la comisión es del 15% — está en /afiliados.",
    en: "Happy to help. At /productos you'll find the catalog with live stock and prices in US dollars. If you tell me what you're after (who it's for, what for, your budget) I'll point you to the best options. Also, if the affiliate program interests you, the commission is 15% — details at /afiliados.",
  },
  recommendation: {
    es: "Me encanta esa pregunta. Dime tres cosas y te armo la recomendación: para quién es, qué le gusta o qué problema quiere resolver, y cuánto quieres invertir. Con eso te propongo dos o tres piezas del catálogo que de verdad encajen.",
    en: "I love that question. Tell me three things and I'll put a recommendation together: who it's for, what they like or what problem they want solved, and your budget. With that I'll suggest two or three pieces from the catalog that genuinely fit.",
  },
  availability: {
    es: "Déjame revisarlo bien. El stock que ves en /productos es en tiempo real, así que si aparece disponible es porque lo está. Si el que quieres está agotado, dime cuál es y te aviso en cuanto vuelva, o te propongo una pieza equivalente.",
    en: "Let me check that properly. The stock shown at /productos is live, so if it appears available it is. If the one you want is sold out, tell me which and I'll let you know the moment it's back, or suggest an equivalent piece.",
  },
  cancel: {
    es: "Entiendo, y quiero respetar tu decisión. Si el pedido todavía no salió del almacén normalmente se puede detener. Mándame tu número de pedido y lo reviso ahora mismo; si ya fue enviado, te explico las opciones que tienes.",
    en: "I understand, and I want to respect your decision. If the order hasn't left the warehouse yet it can usually be stopped. Send me your order number and I'll check right now; if it already shipped, I'll walk you through your options.",
  },
  address_change: {
    es: "Se puede corregir, pero hay prisa: una vez que el pedido entra al almacén la dirección ya no se puede modificar. Mándame el número de pedido y la dirección correcta completa, y la actualizo si todavía alcanzamos.",
    en: "It can be corrected, but there's urgency: once the order enters the warehouse the address can no longer be changed. Send me your order number and the full corrected address, and I'll update it if we still have time.",
  },
  wholesale: {
    es: "¡Qué bueno que preguntas! Sí trabajamos pedidos grandes. Dime qué producto, cuántas piezas y a qué ciudad, y te preparo una propuesta con precio por volumen y tiempos. Lo reviso y te contesto con números concretos.",
    en: "Glad you asked! Yes, we handle larger orders. Tell me which product, how many units and to which city, and I'll put together a proposal with volume pricing and timelines. I'll review it and come back with concrete numbers.",
  },
  privacy: {
    es: "Con gusto te explico. Solo guardamos lo necesario para procesar tu pedido: nombre, correo, dirección y datos de pago. El pago se procesa directo con Stripe y no almacenamos tu tarjeta. Puedes pedir que borremos tus datos escribiéndome aquí mismo. El detalle está en /privacidad.",
    en: "Happy to explain. We only keep what's needed to process your order: name, email, address and payment details. Payment is processed directly by Stripe and we never store your card. You can ask us to delete your data right here. Full details at /privacidad.",
  },
  hours: {
    es: "Este chat responde al instante, todos los días. Las solicitudes que necesitan una decisión de una persona se atienden el mismo día hábil, y normalmente en menos de 24 horas. Si me dejas tu caso aquí, queda registrado y le doy seguimiento.",
    en: "This chat replies instantly, every day. Anything that needs a person's decision is handled the same business day, usually within 24 hours. If you leave your case here it's logged and I'll follow up on it.",
  },
  human: {
    es: "Claro que sí. Puedo pasarte con una persona: escríbeme a lumaeiMX@gmail.com o deja aquí tu correo y tu número de pedido, y un humano lo toma directo. Mientras tanto, si me dices qué necesitas, quizá lo resolvemos ahora mismo.",
    en: "Of course. I can get you to a person: email lumaeiMX@gmail.com or leave your email and order number here and a human will pick it up directly. In the meantime, if you tell me what you need we might solve it right now.",
  },
  thanks: {
    es: "¡Con gusto! Si más adelante surge algo, aquí estoy. Que disfrutes tu compra.",
    en: "Any time! If anything else comes up, I'm right here. Enjoy your purchase.",
  },
  fallback: {
    es: "Gracias por escribirme, ya quedó registrado tu mensaje. Para no dejarte esperando: envíos MX 14-16 días y US 4-7 días (/envios), garantía de reposición 25 días (/devoluciones), y puedes ver tu pedido en /pedido/[id]?key=. Si me das un poco más de detalle, lo resuelvo aquí mismo.",
    en: "Thanks for writing in, your message is logged. So you're not left waiting: shipping is MX 14-16 days and US 4-7 days (/envios), 25-day replacement warranty (/devoluciones), and you can view your order at /pedido/[id]?key=. If you give me a bit more detail I'll resolve it right here.",
  },
};

// ==== Humanizer ====

/** Aperturas variadas para que el bot no repita la misma fórmula. */
const OPENERS: Record<SupportLang, string[]> = {
  es: ["", "", "Con gusto. ", "Claro que sí. ", "Deja te ayudo. ", "Gracias por escribir. "],
  en: ["", "", "Happy to help. ", "Sure thing. ", "Let me help you. ", "Thanks for reaching out. "],
};

/** Reconocimiento empático cuando el cliente está molesto o preocupado. */
const EMPATHY: Record<SupportLang, Array<{ re: RegExp; text: string }>> = {
  es: [
    {
      re: /(molest|enojad|furios|harto|indignad|p[eé]simo|horrible|estafa|fraude|nunca|jam[áa]s|terrible|no sirve)/i,
      text: "Lamento mucho que estés pasando por esto, y quiero arreglarlo. ",
    },
    {
      re: /(urgente|urgencia|prisa|necesito.*(ya|hoy)|asap|urgent)/i,
      text: "Entiendo la urgencia, vamos a movernos rápido. ",
    },
    {
      re: /(preocupad|no s[eé] qu[ée] hacer|ayuda|help me|worried|confundid)/i,
      text: "Tranquilo(a), te acompaño en esto. ",
    },
  ],
  en: [
    {
      re: /(angry|furious|fed up|terrible|awful|scam|fraud|never|worst|doesn.?t work)/i,
      text: "I'm really sorry you're dealing with this, and I want to make it right. ",
    },
    {
      re: /(urgent|asap|need.*(now|today)|rush)/i,
      text: "I understand the urgency, let's move fast. ",
    },
    {
      re: /(worried|confused|don.?t know what|help me|unsure)/i,
      text: "Take a breath, I've got you. ",
    },
  ],
};

function hashPick<T>(arr: T[], seed: string): T {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return arr[Math.abs(h) % arr.length];
}

function empathyFor(msg: string, lang: SupportLang): string {
  for (const e of EMPATHY[lang]) {
    if (e.re.test(msg)) return e.text;
  }
  return "";
}

/** Une varias respuestas en un solo mensaje natural. */
function combine(parts: string[], lang: SupportLang): string {
  if (parts.length === 1) return parts[0];
  const bridge =
    lang === "en" ? "\n\nAnd on your other question: " : "\n\nY sobre tu otra duda: ";
  const [first, ...rest] = parts;
  return first + bridge + rest.join("\n\n");
}

const THANKS_RE =
  /^\s*(gracias|muchas gracias|mil gracias|thanks|thank you|ty|perfecto|excelente|genial|great|awesome|ok|okay)\s*[!.?]*\s*$/i;

/**
 * Responde un mensaje del cliente.
 * - Detecta intenciones compuestas y contesta todas.
 * - Humaniza (apertura variada + empatía).
 * - Marca `requiresApproval` cuando la respuesta compromete dinero o promete
 *   una acción interna: esas pasan por la cola de escalaciones y un humano
 *   puede abortarlas antes de que se envíen.
 */
export function answerBotMessage(
  msg: string,
  lang: SupportLang,
  opts?: { turn?: number }
): BotAnswer {
  const L: SupportLang = lang === "en" ? "en" : "es";
  const t = (msg || "").trim();

  if (!t) {
    return { reply: REPLIES.greeting[L], intent: "greeting", escalated: false };
  }

  if (THANKS_RE.test(t)) {
    return { reply: REPLIES.thanks[L], intent: "thanks", escalated: false };
  }

  const intents = detectIntents(t);
  const primary: SupportIntent = intents[0] ?? "fallback";

  // Sin intención reconocida → escalar para revisión humana.
  if (intents.length === 0) {
    const opener = opts?.turn && opts.turn > 1 ? "" : hashPick(OPENERS[L], t);
    return {
      reply: opener + empathyFor(t, L) + REPLIES.fallback[L],
      intent: "fallback",
      escalated: true,
      reason: "Mensaje no clasificado",
    };
  }

  const opener = opts?.turn && opts.turn > 1 ? "" : hashPick(OPENERS[L], t);
  const empathy = empathyFor(t, L);

  // Respuesta para cada intención detectada (máx. 3 para no hacer un muro).
  const bodies = intents.slice(0, 3).map((i) => REPLIES[i][L]);
  let reply = opener + empathy + combine(bodies, L);

  // Las intenciones sensibles requieren autorización humana antes de enviar.
  const risky = intents.map((i) => ruleFor(i)).find((r) => r?.approval);

  const requiresApproval = Boolean(risky);
  const escalated = requiresApproval || primary === "human";

  let proposedAction: BotAnswer["proposedAction"];
  if (risky) {
    const kind: NonNullable<BotAnswer["proposedAction"]>["kind"] =
      risky.intent === "returns"
        ? "refund"
        : risky.intent === "warranty"
          ? "replacement"
          : risky.intent === "cancel"
            ? "cancel"
            : "other";
    proposedAction = { kind, detail: risky.reason || "Acción solicitada por el cliente" };
  }

  // Cierre natural cuando hay que pedir un dato o cuando el cliente debe esperar.
  if (requiresApproval) {
    reply +=
      L === "es"
        ? "\n\nYa dejé tu caso registrado y le doy seguimiento."
        : "\n\nI've logged your case and I'm following up on it.";
  }

  return {
    reply,
    intent: primary,
    escalated,
    requiresApproval,
    reason: risky?.reason,
    intents,
    proposedAction,
  };
}
