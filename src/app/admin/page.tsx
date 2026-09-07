import Link from "next/link";
import { readProducts } from "@/lib/products-db";
import { readOrders } from "@/lib/orders-db";
import { formatMoney, marginForProduct } from "@/lib/money";
import { readStoreSettings } from "@/lib/settings-db";
import { listAffiliates } from "@/lib/affiliates";
import AffiliatesCommissions, { type AffRow } from "@/components/AffiliatesCommissions";
import { AdminOrders } from "@/components/AdminOrders";
import { CjImportPanel } from "@/components/CjImportPanel";
import { SettingsEditor } from "@/components/SettingsEditor";
import { PromosPanel } from "@/components/PromosPanel";
import { AlertsPanel } from "@/components/AlertsPanel";
import { OpportunitiesPanel } from "@/components/OpportunitiesPanel";
import { CatalogsPanel } from "@/components/CatalogsPanel";
import { ProductManagerPanel } from "@/components/ProductManagerPanel";
import { AdminSupportPanel } from "@/components/AdminSupportPanel";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const [orders, products, storeSettings, affiliates] = await Promise.all([
    readOrders(),
    readProducts(),
    readStoreSettings(),
    listAffiliates(),
  ]);
  const active = products.filter((p) => p.active);
  // Solo pedidos REALMENTE pagados cuentan para revenue/profit.
  // (Antes sumaba pending_payment y cancelled → profit ficticio.)
  const paidOrders = orders.filter((o) =>
    ["paid", "sent_to_cj", "shipped", "delivered", "fulfillment_queued"].includes(
      o.status
    )
  );
  const revenue = paidOrders.reduce((s, o) => s + o.total, 0);
  const profitUsd = paidOrders.reduce((s, o) => s + o.estimatedProfitUsd, 0);
  const sent = orders.filter((o) =>
    ["sent_to_cj", "shipped", "delivered"].includes(o.status)
  ).length;

  // T1 — Comisiones por afiliado: junta el registro del afiliado con las
  // órdenes reales agrupadas por `ref` (fuente de verdad del volumen vendido).
  const soldByRef = new Map<string, { count: number; sold: number }>();
  for (const o of orders) {
    if (!o.ref) continue;
    const key = o.ref.replace(/^@/, "").toLowerCase();
    const cur = soldByRef.get(key) || { count: 0, sold: 0 };
    cur.count += 1;
    cur.sold += o.subtotal;
    soldByRef.set(key, cur);
  }
  const affRows: AffRow[] = affiliates
    .map((a) => {
      const ob = soldByRef.get(a.code) || { count: 0, sold: 0 };
      return {
        code: a.code,
        handle: a.handle,
        status: a.status,
        conversions: a.conversions,
        pendingUsd: a.commissionPendingUsd,
        paidUsd: a.commissionPaidUsd,
        orderCount: ob.count,
        soldUsd: ob.sold,
      };
    })
    .sort((x, y) => y.pendingUsd - x.pendingUsd);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold-dark">
            Panel
          </p>
          <h1 className="mt-1 font-serif text-3xl font-semibold text-brown">
            Admin · {storeSettings.brandName}
          </h1>
          <p className="mt-1 text-sm text-brown-soft">
            Automatización CJ · MX primario · US secundario · auto-fulfill:{" "}
            {storeSettings.autoFulfill ? "ON" : "OFF"}
          </p>
        </div>
        <Link
          href="/productos"
          className="text-sm font-semibold tracking-wide text-gold-dark hover:underline"
        >
          ← Tienda
        </Link>
        <form action="/api/admin/logout" method="get">
          <button className="text-sm font-semibold tracking-wide text-brown-soft hover:text-brown">
            Salir
          </button>
        </form>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-4">
        {[
          ["Pedidos", String(orders.length)],
          ["Enviados a CJ", String(sent)],
          ["SKUs activos", String(active.length)],
          ["Profit est. USD", `$${profitUsd.toFixed(2)}`],
        ].map(([k, v]) => (
          <div
            key={k}
            className="rounded-2xl border border-gold/20 bg-ivory p-4"
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-brown-soft">
              {k}
            </p>
            <p className="mt-1 font-serif text-2xl font-semibold text-brown">{v}</p>
          </div>
        ))}
      </div>

      {orders.length > 0 && (
        <p className="mt-2 text-xs text-brown-soft">
          Revenue mix: {formatMoney(revenue)}
        </p>
      )}

      <section className="mt-10">
        <AffiliatesCommissions rows={affRows} />
      </section>

      <section className="mt-10">
        <SettingsEditor />
      </section>

      <section className="mt-10">
        <OpportunitiesPanel />
      </section>

      <section className="mt-10">
        <ProductManagerPanel />
      </section>

      <section className="mt-10">
        <CatalogsPanel />
      </section>

      <section className="mt-10">
        <PromosPanel />
      </section>

      <section className="mt-10">
        <AlertsPanel />
      </section>

      <section className="mt-10">
        <AdminSupportPanel />
      </section>

      <section className="mt-10">
        <CjImportPanel />
      </section>

      <section className="mt-10">
        <h2 className="font-serif text-2xl font-semibold text-brown">Pedidos</h2>
        <AdminOrders initialOrders={orders} />
      </section>

      <section className="mt-10">
        <h2 className="font-serif text-2xl font-semibold text-brown">
          Catálogo y márgenes
        </h2>
        <div className="mt-4 overflow-x-auto rounded-2xl border border-gold/20 bg-ivory">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-gold/15 bg-cream text-xs uppercase tracking-wider text-brown-soft">
              <tr>
                <th className="px-4 py-3">Producto</th>
                <th className="px-4 py-3">VID / SKU</th>
                <th className="px-4 py-3">Precio USD</th>
                <th className="px-4 py-3">COGS+ship</th>
                <th className="px-4 py-3">Margen</th>
              </tr>
            </thead>
            <tbody>
              {active.map((p) => {
                const m = marginForProduct(storeSettings, p, "US");
                return (
                  <tr key={p.id} className="border-b border-gold/10">
                    <td className="px-4 py-3 font-medium text-brown">{p.name}</td>
                    <td className="px-4 py-3 text-xs text-brown-soft">
                      {(p.cjVariantId || p.cjSku).slice(0, 16)}
                    </td>
                    <td className="px-4 py-3">{formatMoney(p.priceUsd)}</td>
                    <td className="px-4 py-3">${m.cogs.toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                          m.marginPct >= 50
                            ? "bg-gold/20 text-gold-dark"
                            : "bg-amber-100 text-amber-900"
                        }`}
                      >
                        {m.marginPct}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
