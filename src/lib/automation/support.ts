// src/lib/automation/support.ts
// Soporte autónomo: clasifica correos entrantes, responde dentro de política,
// y escala al dueño (Telegram + /admin) lo que no puede resolver solo.
import {
  isAgentMailConfigured,
  listThreads,
  getThreadMessages,
  replyToMessage,
  type AgentMailMessage,
} from "../agentmail";
import { getOrder } from "../orders-db";
import { notifyOwner } from "./alert";
import { readStoreSettings } from "../settings-db";
import { createEscalation, expireStaleEscalations } from "../support-escalations";
import { answerBotMessage, detectTextLang, type SupportLang } from "../support-kb";

const INBOX = process.env.AGENTMAIL_INBOX || "";

export type Intent = "order_status" | "return_refund" | "complaint" | "other";

export function classifyIntent(text: string): Intent {
  const t = text.toLowerCase();
  if (/(devol|reembols|refund|return|cambio|garant|roto|defect|no lleg|extravi|perdid|perd)/.test(t))
    return "return_refund";
  if (/(rastreo|tracking|d[oó]nde|env[ií]o|pedido|order|status|estado|ubic)/.test(t))
    return "order_status";
  if (/(queja|problema|pesimo|p[eé]simo|horrible|estafa|fraude|mal serv)/.test(t))
    return "complaint";
  return "other";
}

function extractOrderId(text: string): string | null {
  const m = text.match(
    /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i
  );
  return m ? m[0] : null;
}


/**
 * Escala un caso al dueño vía Telegram (+ registro en /admin).
 * Async-safe: nunca lanza. Sin credenciales (Telegram/Redis no
 * configurados) hace fallback a console.error y resuelve ok.
 */
export async function escalateToOwner(message: string): Promise<void> {
  console.error("[SUPPORT-ESCALATION]", message);
  try {
    await notifyOwner("support_escalation", message, "warn");
  } catch (err) {
    console.error(
      "[SUPPORT-ESCALATION-FAILED]",
      err instanceof Error ? err.message : err
    );
  }
}

export function draftReply(
  intent: Intent,
  order: { status?: string; id?: string; accessToken?: string } | null,
  foundId: boolean,
  lang: SupportLang = "es"
): { text: string; escalate: boolean } {
  const site = process.env.NEXT_PUBLIC_SITE_URL || "https://www.lumaei.com";
  const en = lang === "en";
  if (intent === "order_status") {
    if (order && order.id) {
      const track = `${site}/pedido/${order.id}?key=${order.accessToken || ""}`;
      return {
        text: en
          ? `Hi! Your order (#${order.id.slice(-6)}) is currently: ${order.status}.\n\n` +
            `Track it live here:\n${track}\n\n` +
            `Any questions, just reply to this email. — Lumaei`
          : `¡Hola! Tu pedido (#${order.id.slice(-6)}) está en estado: ${order.status}.\n\n` +
            `Síguelo en tiempo real aquí:\n${track}\n\n` +
            `Cualquier duda, responde este correo. — Lumaei`,
        escalate: false,
      };
    }
    return {
      text: en
        ? "Hi! Happy to help with your order status. Please send me your order number " +
          "(from your confirmation email, format #XXXXXX) or the email you used to buy, " +
          "and I'll look it up right away. — Lumaei"
        : "¡Hola! Con gusto te ayudo con el estado de tu pedido. Por favor envíame tu " +
          "número de pedido (el que recibiste por correo, formato #XXXXXX) o el correo con el " +
          "que compraste y lo reviso de inmediato. — Lumaei",
      escalate: false,
    };
  }
  if (intent === "return_refund") {
    return {
      text: en
        ? "Hi! Thanks for reaching out. Our policy is simple: if your product arrives " +
          "damaged or doesn't work, we replace it at no cost within 25 days of delivery " +
          "(we just need a photo or video of the issue).\n\n" +
          "Reply with your order number and an image of the problem and we'll schedule the " +
          "replacement right away. — Lumaei"
        : "¡Hola! Gracias por escribirnos. Nuestra política es sencilla: si tu producto llega " +
          "dañado o no funciona, lo reponemos sin costo dentro de los 25 días posteriores a la " +
          "entrega (solo necesitamos una foto o video del problema).\n\n" +
          "Responde con tu número de pedido y una imagen del inconveniente, y agendamos la " +
          "reposición de inmediato. — Lumaei",
      escalate: true,
    };
  }
  if (intent === "complaint") {
    return {
      text: en
        ? "We're sorry about your experience. We want to fix it now: reply with your order " +
          "number and tell us what happened, and a Lumaei human will personally take care of " +
          "it (replacement or refund as applicable). — Lumaei"
        : "Lamentamos mucho tu experiencia. Queremos resolverlo ya: responde con tu número de " +
          "pedido y cuéntanos qué pasó, y un humano de Lumaei se encarga personalmente de " +
          "solucionarlo (reposición o reembolso según corresponda). — Lumaei",
      escalate: true,
    };
  }
  return {
    text: en
      ? "Hi! Thanks for contacting Lumaei. Our team replies within 24h. " +
        "Meanwhile: shipping to MX (14-16 days) and US (4-7 days), 25-day replacement " +
        "warranty, and you can see your order status at the link in your email. — Lumaei"
      : "¡Hola! Gracias por contactar a Lumaei. Nuestro equipo responde en menos de 24h. " +
        "Mientras tanto: envíos a MX (14-16 días) y US (4-7 días), garantía de reposición 25 días, " +
        "y puedes ver el estado de tu pedido en el link que recibiste por correo. — Lumaei",
    escalate: false,
  };
}

export async function processInbound(sinceISO?: string): Promise<{
  replied: number;
  escalated: number;
  errors: string[];
}> {
  if (!isAgentMailConfigured()) {
    return { replied: 0, escalated: 0, errors: ["AgentMail no configurado"] };
  }

  // Barrido: lo que pasó el plazo sin decisión humana se aborta (fail-safe).
  await expireStaleEscalations().catch(() => 0);

  const settings = await readStoreSettings().catch(() => null);
  const botPaused = Boolean(settings?.pauseBot);

  const threads = await listThreads({ after: sinceISO, limit: 25 });
  let replied = 0;
  let escalated = 0;
  const errors: string[] = [];
  for (const th of threads) {
    try {
      const msgs = await getThreadMessages(th.thread_id);
      if (!msgs.length) continue;
      const last = msgs[msgs.length - 1] as AgentMailMessage;
      const from = last.from_ || (last as any).from || "";
      if (!from || from.includes(INBOX)) continue; // el último mensaje ya es nuestro
      const body = last.text || (last as any).body || "";
      const subject = th.subject || "";
      const intent = classifyIntent(`${subject} ${body}`);
      const oid = extractOrderId(body);
      let order: any = null;
      if (oid) order = await getOrder(oid).catch(() => null);

      // El correo no trae `lang` (a diferencia del widget), así que se detecta
      // del propio texto: sin esto, un cliente de EE.UU. recibía español.
      const lang = detectTextLang(`${subject} ${body}`);
      const bot = answerBotMessage(`${subject} ${body}`, lang);
      const needsApproval = botPaused || bot.requiresApproval;

      // Caso con compromiso de dinero/promesas (o bot pausado): NO se responde
      // solo. Se encola para que un humano APRUEBE o ABORTE antes del envío.
      if (needsApproval) {
        const { text } = draftReply(intent, order, Boolean(oid), lang);
        await createEscalation({
          channel: "email",
          customerRef: from,
          orderId: oid || undefined,
          customerMessage: body.slice(0, 2000),
          proposedReply: bot.requiresApproval ? bot.reply : text,
          intent: botPaused ? "paused" : bot.intent,
          reason: botPaused
            ? "Bot de soporte pausado (pauseBot activo)"
            : bot.reason || "Respuesta con compromiso (requiere autorización)",
          risk: "high",
          proposedAction: bot.proposedAction,
        });
        escalated++;
        continue;
      }

      // Bajo riesgo: el bot responde solo (operación autónoma).
      const msgId = last.message_id || (last as any).id;
      if (msgId) {
        await replyToMessage(msgId, bot.reply);
        replied++;
      }
    } catch (e: any) {
      errors.push(`${th.thread_id}: ${e?.message || e}`);
    }
  }
  return { replied, escalated, errors };
}
