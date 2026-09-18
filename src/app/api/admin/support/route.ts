import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { isAdminRequest, isOwner } from "@/lib/admin-auth";
import type { SupportTicket } from "@/app/api/support/ticket/route";

export const dynamic = "force-dynamic";

const DATA_DIR = path.join(process.cwd(), "data");
const FALLBACK_FILE = path.join(DATA_DIR, "support-tickets.json");

async function readRedisTickets(): Promise<SupportTicket[] | null> {
  if (!process.env.REDIS_URL) return null;
  try {
    const { createClient } = await import("redis");
    const client = createClient({ url: process.env.REDIS_URL });
    client.on("error", () => {});
    await client.connect();
    const raw = await client.lRange("support:tickets", 0, -1);
    await client.quit();
    const out: SupportTicket[] = [];
    for (const s of raw) {
      try {
        out.push(JSON.parse(s) as SupportTicket);
      } catch {
        /* línea corrupta: se ignora */
      }
    }
    return out;
  } catch {
    return null;
  }
}

async function readFileTickets(): Promise<SupportTicket[]> {
  try {
    const raw = await fs.readFile(FALLBACK_FILE, "utf8");
    return JSON.parse(raw) as SupportTicket[];
  } catch {
    return [];
  }
}

export async function GET(req: NextRequest) {
  if (!(await isAdminRequest(req))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const redis = await readRedisTickets();
  const tickets = redis ?? (await readFileTickets());
  return NextResponse.json({ tickets });
}

export async function PATCH(req: NextRequest) {
  if (!(await isOwner(req))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  let body: { id?: unknown; resolved?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }
  const id = typeof body.id === "string" ? body.id : "";
  if (!id) return NextResponse.json({ error: "Falta id" }, { status: 400 });
  const resolved = body.resolved === false ? false : true;

  const redis = await readRedisTickets();
  if (redis !== null && process.env.REDIS_URL) {
    const updated = redis.map((t) => (t.id === id ? { ...t, resolved } : t));
    try {
      const { createClient } = await import("redis");
      const client = createClient({ url: process.env.REDIS_URL });
      client.on("error", () => {});
      await client.connect();
      await client.del("support:tickets");
      if (updated.length) {
        await client.rPush("support:tickets", updated.map((t) => JSON.stringify(t)));
      }
      await client.quit();
    } catch {
      return NextResponse.json({ error: "No se pudo actualizar" }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  }

  const file = await readFileTickets();
  const updated = file.map((t) => (t.id === id ? { ...t, resolved } : t));
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(FALLBACK_FILE, JSON.stringify(updated, null, 2), "utf8");
  } catch {
    return NextResponse.json({ error: "No se pudo actualizar" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

// Alias POST (spec bot 24/7) — misma lógica que PATCH, sin duplicar.
export const POST = PATCH;
