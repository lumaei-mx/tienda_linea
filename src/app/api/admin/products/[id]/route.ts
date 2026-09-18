import { NextResponse } from "next/server";
import { isAdminRequest, isOwner } from "@/lib/admin-auth";
import {
  getProductByIdAsync,
  upsertProduct,
  deleteProduct,
} from "@/lib/products-db";

export const dynamic = "force-dynamic";

/** PATCH: actualiza campos de un producto (precio, activo, etc.) */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isOwner(req))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const { id } = await params;
  const product = await getProductByIdAsync(id);
  if (!product) {
    return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  const next = { ...product };

  if (typeof body?.name === "string" && body.name.trim().length >= 3) {
    next.name = body.name.trim().slice(0, 120);
  }
  if (typeof body?.priceUsd === "number") {
    if (body.priceUsd <= 0) {
      return NextResponse.json({ error: "Precio inválido" }, { status: 400 });
    }
    next.priceUsd = Number(body.priceUsd.toFixed(2));
  }
  if ("manualPriceUsd" in body) {
    if (body.manualPriceUsd === null) {
      delete next.manualPriceUsd;
    } else if (typeof body.manualPriceUsd === "number" && body.manualPriceUsd > 0) {
      next.manualPriceUsd = Number(body.manualPriceUsd.toFixed(2));
    } else {
      return NextResponse.json({ error: "manualPriceUsd inválido" }, { status: 400 });
    }
  }
  if (typeof body?.active === "boolean") {
    next.active = body.active;
  }

  const saved = await upsertProduct(next);
  return NextResponse.json({ product: saved });
}

/** DELETE: elimina un producto del catálogo */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminRequest(_req))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const { id } = await params;
  const ok = await deleteProduct(id);
  if (!ok) {
    return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
  }
  return NextResponse.json({ deleted: true });
}
