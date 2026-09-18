import { NextResponse } from "next/server";
import { isAdminRequest, isOwner } from "@/lib/admin-auth";
import { readOrders } from "@/lib/orders-db";
import { recordAudit } from "@/lib/audit-log";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!(await isAdminRequest(req))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const url = new URL(req.url);
  const page = Math.max(1, Number(url.searchParams.get("page") || "1"));
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit") || "20")));
  const search = (url.searchParams.get("search") || "").trim().toLowerCase();
  const status = (url.searchParams.get("status") || "").trim();
  const market = (url.searchParams.get("market") || "").trim();
  const from = url.searchParams.get("from") || "";
  const to = url.searchParams.get("to") || "";
  const export_csv = url.searchParams.get("export") === "csv";

  let orders = await readOrders();

  // Filtros
  if (search) {
    orders = orders.filter(
      (o) =>
        o.id.toLowerCase().includes(search) ||
        o.customer.name.toLowerCase().includes(search) ||
        o.customer.email.toLowerCase().includes(search) ||
        o.cjOrderId?.toLowerCase().includes(search)
    );
  }
  if (status) {
    orders = orders.filter((o) => o.status === status);
  }
  if (market) {
    orders = orders.filter((o) => o.market === market);
  }
  if (from) {
    const fromDate = new Date(from);
    orders = orders.filter((o) => new Date(o.createdAt) >= fromDate);
  }
  if (to) {
    const toDate = new Date(to);
    orders = orders.filter((o) => new Date(o.createdAt) <= toDate);
  }

  // Ordenar por fecha descendente
  orders.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));

  const total = orders.length;

  if (export_csv) {
    const header = "ID,Fecha,Cliente,Email,Mercado,Total,Profit,Estado,CJ Order\n";
    const rows = orders.map((o) =>
      [
        o.id,
        o.createdAt,
        `"${o.customer.name}"`,
        o.customer.email,
        o.market,
        o.total.toFixed(2),
        o.estimatedProfitUsd.toFixed(2),
        o.status,
        o.cjOrderId || "",
      ].join(",")
    );
    const csv = header + rows.join("\n");
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename=orders-${new Date().toISOString().slice(0,10)}.csv`,
      },
    });
  }

  const start = (page - 1) * limit;
  const paginated = orders.slice(start, start + limit);

  return NextResponse.json({
    orders: paginated,
    total,
    page,
    limit,
    pages: Math.max(1, Math.ceil(total / limit)),
  });
}

export async function POST(req: Request) {
  if (!(await isOwner(req))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 });
  }

  const actor = (await import("@/lib/audit-log")).getActorFromRequest(req);

  // Bulk actions
  if (body.action === "cancel" && Array.isArray(body.orderIds)) {
    const { updateOrder } = await import("@/lib/orders-db");
    let cancelled = 0;
    for (const id of body.orderIds) {
      const o = await updateOrder(id, {
        status: "cancelled",
        notes: body.reason || "Cancelado en bulk desde admin",
      });
      if (o) {
        cancelled++;
        await recordAudit({
          actor,
          action: "order.bulk_cancel",
          target: `order:${id}`,
          after: { status: "cancelled", reason: body.reason },
          severity: "warn",
        });
      }
    }
    return NextResponse.json({ cancelled });
  }

  if (body.action === "resend_email" && Array.isArray(body.orderIds)) {
    let sent = 0;
    for (const id of body.orderIds) {
      try {
        const { sendOrderConfirmation } = await import("@/lib/email");
        const order = await (await import("@/lib/orders-db")).getOrder(id);
        if (!order) continue;
        const email = await sendOrderConfirmation(order);
        sent++;
        await recordAudit({
          actor,
          action: "order.bulk_email",
          target: `order:${id}`,
          after: { emailStatus: email.skipped ? "skipped" : email.ok ? "sent" : "error" },
          severity: "info",
        });
      } catch {
        // continue
      }
    }
    return NextResponse.json({ sent });
  }

  return NextResponse.json({ error: "Acción no válida" }, { status: 400 });
}