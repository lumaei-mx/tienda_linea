import { NextResponse } from "next/server";
import { storageSet, storageGet } from "@/lib/storage";

const COL = "affiliate_waitlist";

function normEmail(e: string): string {
  return e.trim().toLowerCase();
}

function isEmail(v: string): boolean {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v);
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const email = typeof body.email === "string" ? normEmail(body.email) : "";
    if (!email || !isEmail(email)) {
      return NextResponse.json({ ok: false, error: "Email inválido" }, { status: 400 });
    }

    const key = email;
    const existing = await storageGet<{ email: string; createdAt?: string }>(COL, key).catch(
      () => null
    );

    const lead = {
      email,
      handle: typeof body.handle === "string" ? body.handle.trim() : "",
      name: typeof body.name === "string" ? body.name.trim() : "",
      market: typeof body.market === "string" ? body.market : "MX",
      source: typeof body.source === "string" ? body.source : "afiliados_page",
      createdAt: existing?.createdAt ?? new Date().toISOString(),
      status: "pending",
    };

    await storageSet(COL, key, lead);

    return NextResponse.json({
      ok: true,
      message: existing
        ? "Ya estás en la lista de afiliados."
        : "Te inscribiste a la lista de afiliados. Te avisamos pronto.",
    });
  } catch {
    return NextResponse.json({ ok: false, error: "Error interno" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ ok: true });
}
