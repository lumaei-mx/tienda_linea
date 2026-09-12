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
          [`Profit est. USD`, `$${profitUsd.toFixed(2)}`],
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

      {/* Dashboard charts: order status + marketplace mix */}
      {orders.length > 0 && (
        <div className="mt-8 grid gap-4 lg:grid-cols-2">
          {/* Order status distribution */}
          <div className="rounded-2xl border border-gold/20 bg-ivory p-4">
            <h3 className="font-serif text-lg font-semibold text-brown">
              Estado de pedidos
            </h3>
            <div className="mt-3 space-y-2">
              {Object.entries(
                orders.reduce(
                  (acc, o) => {
                    acc[o.status] = (acc[o.status] || 0) + 1;
                    return acc;
                  },
                  {} as Record<string, number>
                )
              )
                .sort(([, a], [, b]) => b - a)
                .map(([status, count]) => (
                  <div key={status} className="flex items-center gap-2">
                    <span className="w-24 text-xs font-medium text-brown-soft">
                      {status}
                    </span>
                    <div className="flex-1 h-5 rounded-full bg-cream overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gold-dark"
                        style={{ width: `${(count / orders.length) * 100}%` }}
                      />
                    </div>
                    <span className="w-8 text-right text-xs font-semibold text-brown">
                      {count}
                    </span>
                  </div>
                ))}
            </div>
          </div>

          {/* Marketplace mix */}
          <div className="rounded-2xl border border-gold/20 bg-ivory p-4">
            <h3 className="font-serif text-lg font-semibold text-brown">
              Ventas por mercado
            </h3>
            <div className="mt-3 space-y-2">
              {(["MX", "US"] as const)
                .map((m) => ({
                  market: m,
                  revenue: paidOrders
                    .filter((o) => o.market === m)
                    .reduce((s, o) => s + o.total, 0),
                  profit: paidOrders
                    .filter((o) => o.market === m)
                    .reduce((s, o) => s + o.estimatedProfitUsd, 0),
                }))
                .sort((a, b) => b.revenue - a.revenue)
                .map((row) => {
                  const pct =
                    revenue > 0 ? (row.revenue / revenue) * 100 : 0;
                  return (
                    <div key={row.market} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-brown-soft">
                          {row.market === "MX" ? "🇲🇽 México (MXN)" : "🇺🇸 Estados Unidos (USD)"}
                        </span>
                        <span className="text-xs font-semibold text-brown">
                          {formatMoney(row.revenue)} · profit{" "}
                          {formatMoney(row.profit)}
                        </span>
                      </div>
                      <div className="h-4 w-full rounded-full bg-cream overflow-hidden">
                        <div
                          className="h-full rounded-full bg-brown"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* Kill-switch status bar */}
      {storeSettings.pauseHunter ||
        storeSettings.pauseReprice ||
        storeSettings.pauseFulfill ||
        storeSettings.pauseSyncCj ||
        storeSettings.pauseBot ? (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
          <span className="font-semibold">Kill-switches activos:</span>{" "}
          {[
            storeSettings.pauseHunter && "Hunter",
            storeSettings.pauseReprice && "Reprice",
            storeSettings.pauseFulfill && "Fulfill",
            storeSettings.pauseSyncCj && "Sync CJ",
            storeSettings.pauseBot && "Bot",
          ]
            .filter(Boolean)
            .join(", ") || "ninguno"}
        </div>
      ) : null}

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
        <AdminOrders />
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
