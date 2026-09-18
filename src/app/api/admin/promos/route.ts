import { NextResponse } from "next/server";
import { isAdminRequest, isOwner } from "@/lib/admin-auth";
import { deletePromo, listPromos, upsertPromo } from "@/lib/promo-db";
import type { Market } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!(await isAdminRequest(req))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  return NextResponse.json({ promos: await listPromos() });
}

export async function POST(req: Request) {
  if (!(await isOwner(req))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const body = await req.json().catch(() => null);
  if (!body || typeof body.code !== "string" || !body.code.trim()) {
    return NextResponse.json({ error: "code requerido" }, { status: 400 });
  }
  if (!["percent", "fixed"].includes(body.type)) {
    return NextResponse.json({ error: "type debe ser percent|fixed" }, { status: 400 });
  }
  const value = Number(body.value);
  if (!Number.isFinite(value) || value <= 0) {
    return NextResponse.json({ error: "value inválido" }, { status: 400 });
  }
  if (body.type === "percent" && value > 100) {
    return NextResponse.json({ error: "percent no puede exceder 100" }, { status: 400 });
  }

  const markets: Market[] = Array.isArray(body.markets)
    ? body.markets.filter((m: string) => m === "MX" || m === "US")
    : ["MX", "US"];

  const now = new Date().toISOString();
  const promo = await upsertPromo({
    code: body.code,
    type: body.type,
    value,
    minSubtotal: body.minSubtotal !== undefined ? Number(body.minSubtotal) : undefined,
    markets,
    active: body.active !== false,
    startsAt: body.startsAt || undefined,
    endsAt: body.endsAt || undefined,
    usageLimit:
      body.usageLimit !== undefined && body.usageLimit !== null
        ? Number(body.usageLimit)
        : undefined,
    usedCount: 0,
    createdAt: now,
    updatedAt: now,
  });

  return NextResponse.json({ promo }, { status: 201 });
}

export async function DELETE(req: Request) {
  if (!(await isOwner(req))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  if (!code) return NextResponse.json({ error: "code requerido" }, { status: 400 });
  await deletePromo(code);
  return NextResponse.json({ ok: true });
}
