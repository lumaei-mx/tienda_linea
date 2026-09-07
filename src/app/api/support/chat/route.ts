import { NextRequest, NextResponse } from "next/server";
import {
  answerBotMessage,
  extractOrderId,
  normalizeLang,
} from "@/lib/support-kb";
import { getOrder } from "@/lib/orders-db";

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

export async function POST(req: NextRequest) {
  const ip = clientIp(req);
  if (rateLimited(ip)) {
    return NextResponse.json(
      { error: "Demasiadas solicitudes. Intenta en un minuto." },
      { status: 429 }
    );
  }

  let body: { message?: unknown; lang?: unknown; orderId?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const message = typeof body.message === "string" ? body.message.slice(0, 2000) : "";
  const lang = normalizeLang(body.lang);
  const explicitOrderId =
    typeof body.orderId === "string" && body.orderId.trim()
      ? body.orderId.trim().slice(0, 80)
      : null;
  const foundInMsg = extractOrderId(message);
  const orderId = explicitOrderId || foundInMsg;

  if (!message.trim() && !orderId) {
    const a = answerBotMessage("", lang);
    return NextResponse.json({ reply: a.reply, intent: a.intent, escalated: a.escalated });
  }

  // Si hay orderId: busca el pedido y devuelve estado + link tracking.
  if (orderId) {
    try {
      const order = await getOrder(orderId);
      if (order) {
        const site =
          process.env.NEXT_PUBLIC_SITE_URL || "https://www.lumaei.com";
        const track = `${site}/pedido/${order.id}?key=${order.accessToken || ""}`;
        const reply =
          lang === "en"
            ? `Your order (#${order.id.slice(-6)}) is: ${order.status}.\n\nTrack it live here:\n${track}\n\nAnything else I can help with?`
            : `Tu pedido (#${order.id.slice(-6)}) está en estado: ${order.status}.\n\nSíguelo en tiempo real aquí:\n${track}\n\n¿Te ayudo en algo más?`;
        return NextResponse.json({ reply, intent: "order_status", escalated: false });
      }
      const notFound =
        lang === "en"
          ? `I couldn't find order "${orderId}". Double-check the full ID from your confirmation email, or share the purchase email and a human will help within 24h (lumaeiMX@gmail.com · WhatsApp +1 408 422 3904).`
          : `No encontré el pedido "${orderId}". Revisa el ID completo de tu correo de confirmación, o comparte el correo de compra y un humano te ayuda en menos de 24h (lumaeiMX@gmail.com · WhatsApp +1 408 422 3904).`;
      return NextResponse.json({ reply: notFound, intent: "order_status", escalated: false });
    } catch {
      // Si falla la DB, cae al KB general.
    }
  }

  const a = answerBotMessage(message, lang);
  return NextResponse.json({ reply: a.reply, intent: a.intent, escalated: a.escalated });
}
