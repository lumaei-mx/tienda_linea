import { NextRequest, NextResponse } from "next/server";
import {
  answerBotMessage,
  extractOrderId,
  extractOrderRef,
  normalizeLang,
} from "@/lib/support-kb";
import { getOrder, readOrders } from "@/lib/orders-db";
import { readStoreSettings } from "@/lib/settings-db";
import { createEscalation } from "@/lib/support-escalations";

export const dynamic = "force-dynamic";

// Rate-limit simple en memoria: 20 req/min por IP.
const hits = new Map<string, number[]>();
const WINDOW_MS = 60_000;
const LIMIT = 20;

function clientIp(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  const real = req.headers.get("x-real-ip");
  if (real) return real.trim();
  return "unknown";
}

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const arr = (hits.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  arr.push(now);
  hits.set(ip, arr);
  return arr.length > LIMIT;
}

/** Busca un pedido por UUID o por la referencia corta (#ABC123). */
async function resolveOrder(orderId: string | null, ref: string | null) {
  if (orderId) {
    const direct = await getOrder(orderId).catch(() => null);
    if (direct) return direct;
  }
  if (ref) {
    const orders = await readOrders().catch(() => []);
    const target = ref.toLowerCase();
    return (
      orders.find((o) =>
        o.id.replace(/[^a-zA-Z0-9]/g, "").toLowerCase().endsWith(target)
      ) || null
    );
  }
  return null;
}

/** Divulgación de IA: el cliente debe saber con quién habla (solo turno 1). */
function withDisclosure(
  reply: string,
  lang: "es" | "en",
  turn: number,
  enabled: boolean
): string {
  if (!enabled || turn !== 0) return reply;
  return (
    reply +
    (lang === "en"
      ? "\n\n(You're chatting with Lumaei's AI assistant. A person reviews any case that needs a decision.)"
      : "\n\n(Estás hablando con el asistente de IA de Lumaei. Una persona revisa cualquier caso que necesite una decisión.)")
  );
}

export async function POST(req: NextRequest) {
  const ip = clientIp(req);
  if (rateLimited(ip)) {
    return NextResponse.json(
      { error: "Demasiadas solicitudes. Intenta en un minuto." },
      { status: 429 }
    );
  }

  let body: {
    message?: unknown;
    lang?: unknown;
    orderId?: unknown;
    turn?: unknown;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const message = typeof body.message === "string" ? body.message.slice(0, 2000) : "";
  const lang = normalizeLang(body.lang);
  const turn = typeof body.turn === "number" ? body.turn : 0;
  const explicitOrderId =
    typeof body.orderId === "string" && body.orderId.trim()
      ? body.orderId.trim().slice(0, 80)
      : null;
  const foundInMsg = extractOrderId(message);
  const orderId = explicitOrderId || foundInMsg;
  const orderRef = extractOrderRef(message);

  if (!message.trim() && !orderId) {
    const a = answerBotMessage("", lang);
    return NextResponse.json({
      reply: a.reply,
      intent: a.intent,
      escalated: a.escalated,
    });
  }

  // Si hay pedido: devuelve estado + link de seguimiento (respuesta directa,
  // sin riesgo → no pasa por autorización humana).
  if (orderId || orderRef) {
    try {
      const order = await resolveOrder(orderId, orderRef);
      if (order) {
        const site = process.env.NEXT_PUBLIC_SITE_URL || "https://www.lumaei.com";
        const track = `${site}/pedido/${order.id}?key=${order.accessToken || ""}`;
        const reply =
          lang === "en"
            ? `Found it — order #${order.id.slice(-6)} is currently: ${order.status}.\n\nYou can follow it live here:\n${track}\n\nAnything else I can help with?`
            : `Ya lo encontré — tu pedido #${order.id.slice(-6)} está en estado: ${order.status}.\n\nPuedes seguirlo en tiempo real aquí:\n${track}\n\n¿Te ayudo en algo más?`;
        return NextResponse.json({ reply, intent: "order_status", escalated: false });
      }
      const notFound =
        lang === "en"
          ? `I couldn't find that order. Double-check the ID or reference from your confirmation email — or send me the email you used and I'll locate it.`
          : `No encontré ese pedido. Revisa el ID o la referencia de tu correo de confirmación — o mándame el correo con el que compraste y lo ubico.`;
      return NextResponse.json({ reply: notFound, intent: "order_status", escalated: false });
    } catch {
      // Si falla la DB, cae al KB general.
    }
  }

  // Settings se leen una vez: gobiernan el kill-switch y la divulgación de IA.
  const settings = await readStoreSettings().catch(() => null);
  const discloseAi = settings?.discloseAi !== false;

  // KILL-SWITCH `pauseBot`: el bot no responde solo; todo va a revisión humana.
  if (settings?.pauseBot) {
    await createEscalation({
      channel: "chat",
      customerRef: ip === "unknown" ? "visitante" : `visitante (${ip})`,
      orderId: orderId || undefined,
      customerMessage: message,
      proposedReply: answerBotMessage(message, lang, { turn }).reply,
      intent: "paused",
      reason: "Bot de soporte pausado (pauseBot activo)",
      risk: "high",
    }).catch(() => {});
    const hold =
      lang === "en"
        ? "Thanks for your message — I've logged it and a person is reviewing it right now. You'll hear back within 24 hours."
        : "Gracias por tu mensaje — ya quedó registrado y una persona lo está revisando ahora mismo. Te respondemos en menos de 24 horas.";
    return NextResponse.json({ reply: hold, intent: "paused", escalated: true });
  }

  const a = answerBotMessage(message, lang, { turn });
  a.reply = withDisclosure(a.reply, lang, turn, discloseAi);

  // Respuestas que comprometen dinero/promesas: NO se envían solas. Se encolan
  // para que un humano las apruebe o las ABORTE antes de salir al cliente.
  if (a.requiresApproval) {
    await createEscalation({
      channel: "chat",
      customerRef: ip === "unknown" ? "visitante" : `visitante (${ip})`,
      orderId: orderId || undefined,
      customerMessage: message,
      proposedReply: a.reply,
      intent: a.intent,
      reason: a.reason || "Respuesta con compromiso (requiere autorización)",
      risk: "high",
      proposedAction: a.proposedAction,
    }).catch(() => {});

    const ack = withDisclosure(
      lang === "en"
        ? "Got it — I've opened your case and it's being reviewed right now so we can confirm the details. You'll hear back within 24 hours."
        : "Entendido — abrí tu caso y está en revisión ahora mismo para confirmar los detalles. Te respondemos en menos de 24 horas.",
      lang,
      turn,
      discloseAi
    );
    return NextResponse.json({
      reply: ack,
      intent: a.intent,
      intents: a.intents,
      escalated: true,
      requiresApproval: true,
    });
  }

  return NextResponse.json({
    reply: a.reply,
    intent: a.intent,
    intents: a.intents,
    escalated: a.escalated,
  });
}
