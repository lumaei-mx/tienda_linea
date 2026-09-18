import { NextResponse } from "next/server";
import { isOwner } from "@/lib/admin-auth";
import {
  addProductToSeason,
  removeProductFromSeason,
} from "@/lib/catalog-db";

export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ season: string }> }
) {
  if (!(await isOwner(req))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const { season } = await params;
  const body = await req.json().catch(() => null);
  const productId = String(body?.productId || "");
  if (!productId) {
    return NextResponse.json({ error: "productId requerido" }, { status: 400 });
  }
  const catalog = await addProductToSeason(season, productId);
  return NextResponse.json({ catalog });
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ season: string }> }
) {
  if (!(await isOwner(req))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const { season } = await params;
  const { searchParams } = new URL(req.url);
  const productId = searchParams.get("productId") || "";
  if (!productId) {
    return NextResponse.json({ error: "productId requerido" }, { status: 400 });
  }
  const catalog = await removeProductFromSeason(season, productId);
  return NextResponse.json({ catalog });
}
