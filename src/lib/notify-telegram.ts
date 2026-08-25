/**
 * Canal de notificación push al dueño vía Telegram.
 * Se usa para alertas críticas del negocio (pedidos que requieren autorización,
 * saldo insuficiente, fallos de fulfill) y para reportes periódicos del GM.
 *
 * Configuración (una sola fuente de verdad en ~/.config/opencode/telegram.json):
 *   bot_token / chat_id  → usados directamente por telegram_send.sh
 *
 * También acepta TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID por entorno (p.ej. Vercel),
 * de modo que la misma función sirve en local y en producción.
 *
 * Sin config → no-op (no rompe el flujo, igual que el email).
 *
 * Nota: se envía en texto plano (sin parse_mode) para evitar que el Markdown
 * estricto de Telegram devuelva 400 y falle el envío en silencio.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const CFG_PATH = path.join(os.homedir(), ".config", "opencode", "telegram.json");

type Cfg = { token?: string; chatId?: string };

function loadConfig(): Cfg {
  const fromEnv = {
    token: process.env.TELEGRAM_BOT_TOKEN,
    chatId: process.env.TELEGRAM_CHAT_ID,
  };
  if (fromEnv.token && fromEnv.chatId) return fromEnv;
  try {
    const raw = fs.readFileSync(CFG_PATH, "utf8");
    const j = JSON.parse(raw);
    return {
      token: j.bot_token || j.TELEGRAM_BOT_TOKEN,
      chatId: j.chat_id || j.TELEGRAM_CHAT_ID,
    };
  } catch {
    return {};
  }
}

export function isTelegramConfigured(): boolean {
  const c = loadConfig();
  return Boolean(c.token && c.chatId);
}

export async function sendTelegramMessage(
  text: string
): Promise<{ ok: boolean; error?: string }> {
  const c = loadConfig();
  if (!c.token || !c.chatId) return { ok: false, error: "not configured" };
  const url = `https://api.telegram.org/bot${c.token}/sendMessage`;
  // Telegram limita los mensajes a 4096 chars; truncamos con aviso.
  const safe = text.length > 4000 ? text.slice(0, 3990) + "\n…(truncado)" : text;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: c.chatId,
        text: safe,
        disable_web_page_preview: true,
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return { ok: false, error: `HTTP ${res.status} ${body}` };
    }
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "error de red",
    };
  }
}
