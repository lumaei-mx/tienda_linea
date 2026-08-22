// src/lib/automation/support.ts
// Soporte autónomo: clasifica correos entrantes, responde dentro de política,
// y escala a el dueño (WhatsApp) lo que no puede resolver solo.
import { existsSync } from "node:fs";
import { execFile } from "node:child_process";
import {
  isAgentMailConfigured,
  listThreads,
  getThreadMessages,
  replyToMessage,
  type AgentMailMessage,
} from "../agentmail";
import { getOrder } from "../orders-db";

const INBOX = process.env.AGENTMAIL_INBOX || "";
const ALERT_SCRIPT =
  "/Users/sdesilencio/_MOD_Negocios/lumaei__/operations/alert_owner.sh";

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

export function escalateToOwner(message: string): void {
  console.error("[SUPPORT-ESCALATION]", message);
  try {
    if (existsSync(ALERT_SCRIPT)) {
      execFile("bash", [ALERT_SCRIPT, message], { timeout: 20000 }, () => {});
    }
  } catch {
    /* no-op */
  }
}

export function draftReply(
  intent: Intent,
  order: { status?: string; id?: string; accessToken?: string } | null,
  foundId: boolean
): { text: string; escalate: boolean } {
  const site = process.env.NEXT_PUBLIC_SITE_URL || "https://www.lumaei.com";
  if (intent === "order_status") {
    if (order && order.id) {
      const track = `${site}/pedido/${order.id}?key=${order.accessToken || ""}`;
      return {
        text:
          `¡Hola! Tu pedido (#${order.id.slice(-6)}) está en estado: ${order.status}.\n\n` +
          `Síguelo en tiempo real aquí:\n${track}\n\n` +
          `Cualquier duda, responde este correo. — Lumaei`,
        escalate: false,
      };
    }
    return {
      text:
        "¡Hola! Con gusto te ayudo con el estado de tu pedido. Por favor envíame tu " +
        "número de pedido (el que recibiste por correo, formato #XXXXXX) o el correo con el " +
        "que compraste y lo reviso de inmediato. — Lumaei",
      escalate: false,
    };
  }
  if (intent === "return_refund") {
    return {
      text:
        "¡Hola! Gracias por escribirnos. Nuestra política es sencilla: si tu producto llega " +
        "dañado o no funciona, lo reponemos sin costo dentro de los 25 días posteriores a la " +
        "entrega (solo necesitamos una foto o video del problema).\n\n" +
        "Responde con tu número de pedido y una imagen del inconveniente, y agendamos la " +
        "reposición de inmediato. — Lumaei",
      escalate: true,
    };
  }
  if (intent === "complaint") {
    return {
      text:
        "Lamentamos mucho tu experiencia. Queremos resolverlo ya: responde con tu número de " +
        "pedido y cuéntanos qué pasó, y un humano de Lumaei se encarga personalmente de " +
        "solucionarlo (reposición o reembolso según corresponda). — Lumaei",
      escalate: true,
    };
  }
  return {
    text:
      "¡Hola! Gracias por contactar a Lumaei. Nuestro equipo responde en menos de 24h. " +
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
      const intent = classifyIntent(`${th.subject || ""} ${body}`);
      const oid = extractOrderId(body);
      let order: any = null;
      if (oid) order = await getOrder(oid).catch(() => null);
      const { text, escalate } = draftReply(intent, order, Boolean(oid));
      const msgId = last.message_id || (last as any).id;
      if (msgId) {
        await replyToMessage(msgId, text);
        replied++;
      }
      if (escalate) {
        escalateToOwner(
          `[SOPORTE] ${th.subject || "(sin asunto)"} de ${from}: ${body.slice(0, 200)}`
        );
        escalated++;
      }
    } catch (e: any) {
      errors.push(`${th.thread_id}: ${e?.message || e}`);
    }
  }
  return { replied, escalated, errors };
}
