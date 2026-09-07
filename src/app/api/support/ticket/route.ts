import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export const dynamic = "force-dynamic";

export interface SupportTicket {
  id: string;
  name: string;
  email: string;
  message: string;
  orderId?: string;
  createdAt: string;
  resolved: boolean;
}

const DATA_DIR = path.join(process.cwd(), "data");
const FALLBACK_FILE = path.join(DATA_DIR, "support-tickets.json");

async function readFallbackFile(): Promise<SupportTicket[]> {
  try {
    const raw = await fs.readFile(FALLBACK_FILE, "utf8");
    return JSON.parse(raw) as SupportTicket[];
  } catch {
    return [];
  }
}

async function saveTicket(ticket: SupportTicket): Promise<void> {
  // 1) Intento Redis: lista support:tickets
  if (process.env.REDIS_URL) {
    try {
      const { createClient } = await import("redis");
      const client = createClient({ url: process.env.REDIS_URL });
      client.on("error", () => {});
      await client.connect();
      await client.lPush("support:tickets", JSON.stringify(ticket));
      await client.quit();
      return;
    } catch {
      // cae al fallback de archivo
    }
  }
  // 2) Fallback: archivo local + log (no rompe en dev/sin Redis)
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    const all = await readFallbackFile();
    all.unshift(ticket);
    await fs.writeFile(FALLBACK_FILE, JSON.stringify(all.slice(0, 500), null, 2), "utf8");
  } catch {
    /* noop */
  }
  console.log("[support-ticket]", JSON.stringify(ticket));
}

export async function POST(req: NextRequest) {
  let body: { name?: unknown; email?: unknown; message?: unknown; orderId?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim().slice(0, 120) : "";
  const email = typeof body.email === "string" ? body.email.trim().slice(0, 160) : "";
  const message = typeof body.message === "string" ? body.message.trim().slice(0, 2000) : "";
  const orderId =
    typeof body.orderId === "string" && body.orderId.trim()
      ? body.orderId.trim().slice(0, 80)
      : undefined;

  if (!name || !email || !message) {
    return NextResponse.json(
      { error: "Faltan campos: name, email, message son requeridos." },
      { status: 400 }
    );
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Email inválido." }, { status: 400 });
  }

  const ticket: SupportTicket = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name,
    email,
    message,
    orderId,
    createdAt: new Date().toISOString(),
    resolved: false,
  };

  await saveTicket(ticket);

  // Notifica al dueño si el módulo existe (import dinámico, nunca rompe).
  try {
    const m = await import("@/lib/automation/alert");
    const text = `🎧 Nuevo ticket de soporte de ${name} <${email}>${orderId ? ` (pedido ${orderId})` : ""}:\n${message.slice(0, 300)}`;
    if (typeof (m as { notifyOwner?: unknown }).notifyOwner === "function") {
      await (m as { notifyOwner: (k: string, msg: string, l: "info") => Promise<void> }).notifyOwner(
        "support-ticket",
        text,
        "info"
      );
    } else if (typeof (m as { pushAlert?: unknown }).pushAlert === "function") {
      await (m as { pushAlert: (k: string, msg: string, l: "info") => Promise<void> }).pushAlert(
        "support-ticket",
        text,
        "info"
      );
    }
  } catch {
    /* notificación opcional */
  }

  return NextResponse.json({ ok: true });
}
