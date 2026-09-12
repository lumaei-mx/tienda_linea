import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import {
  readProducts,
  getProductByIdAsync,
  upsertProduct,
  deleteProduct,
} from "@/lib/products-db";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!(await isAdminRequest(req))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const url = new URL(req.url);
  const page = Math.max(1, Number(url.searchParams.get("page") || "1"));
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit") || "20")));
  const search = (url.searchParams.get("search") || "").trim().toLowerCase();
  const category = (url.searchParams.get("category") || "").trim();
  const active = url.searchParams.get("active");
  const export_csv = url.searchParams.get("export") === "csv";

  let products = await readProducts();

  // Filtros
  if (search) {
    products = products.filter(
      (p) =>
        p.name.toLowerCase().includes(search) ||
        p.slug.toLowerCase().includes(search) ||
        p.cjSku.toLowerCase().includes(search)
    );
  }
  if (category) {
    products = products.filter((p) => p.category === category);
  }
  if (active !== null && active !== "") {
    const isActive = active === "true";
    products = products.filter((p) => p.active === isActive);
  }

  // Ordenar por nombre
  products.sort((a, b) => a.name.localeCompare(b.name));

  const total = products.length;

  if (export_csv) {
    const header =
      "ID,Nombre,Slug,Precio USD,Costo USD,Ship MX,Ship US,Stock,Activo,Categoría,SKU,CJ Product ID,Rating\n";
    const rows = products.map((p) =>
      [
        p.id,
        `"${p.name.replace(/"/g, '""')}"`,
        p.slug,
        (p.manualPriceUsd ?? p.priceUsd).toFixed(2),
        p.costUsd.toFixed(2),
        p.shippingMxUsd.toFixed(2),
        p.shippingUsUsd.toFixed(2),
        p.stock,
        p.active,
        `"${p.category.replace(/"/g, '""')}"`,
        p.cjSku,
        p.cjProductId || "",
        p.rating.toFixed(1),
      ].join(",")
    );
    const csv = header + rows.join("\n");
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename=products-${new Date().toISOString().slice(0, 10)}.csv`,
      },
    });
  }

  const start = (page - 1) * limit;
  const paginated = products.slice(start, start + limit);
  const categories = Array.from(new Set(products.map((p) => p.category)));

  return NextResponse.json({
    products: paginated,
    total,
    page,
    limit,
    pages: Math.max(1, Math.ceil(total / limit)),
    categories,
  });
}

export async function POST(req: Request) {
  if (!(await isAdminRequest(req))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 });
  }

  const actor = (await import("@/lib/audit-log")).getActorFromRequest(req);

  // Bulk actions
  if (body.action === "activate" && Array.isArray(body.ids)) {
    let count = 0;
    for (const id of body.ids) {
      const product = await getProductByIdAsync(id);
      if (product && !product.active) {
        await upsertProduct({ ...product, active: true });
        count++;
      }
    }
    await _recordBulkAudit(actor, "product.bulk_activate", body.ids.length, count);
    return NextResponse.json({ affected: count });
  }

  if (body.action === "deactivate" && Array.isArray(body.ids)) {
    let count = 0;
    for (const id of body.ids) {
      const product = await getProductByIdAsync(id);
      if (product && product.active) {
        await upsertProduct({ ...product, active: false });
        count++;
      }
    }
    await _recordBulkAudit(actor, "product.bulk_deactivate", body.ids.length, count);
    return NextResponse.json({ affected: count });
  }

  if (body.action === "delete" && Array.isArray(body.ids)) {
    let count = 0;
    for (const id of body.ids) {
      if (await deleteProduct(id)) count++;
    }
    await _recordBulkAudit(actor, "product.bulk_delete", body.ids.length, count, "warn");
    return NextResponse.json({ affected: count });
  }

  return NextResponse.json({ error: "Acción no válida" }, { status: 400 });
}

async function _recordBulkAudit(
  actor: string | undefined,
  action: string,
  attempted: number,
  affected: number,
  severity: "info" | "warn" | "critical" = "info"
) {
  const { recordAudit } = await import("@/lib/audit-log");
  await recordAudit({
    actor: actor ?? "system:unknown",
    action,
    target: "products:bulk",
    after: { attempted, affected },
    severity,
  });
}
