"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  Save,
  Trash2,
  Search,
  RefreshCw,
  Download,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Tag,
} from "lucide-react";
import { invalidateProductsCache } from "@/lib/use-products";

interface ProductRow {
  id: string;
  name: string;
  slug: string;
  priceUsd: number;
  manualPriceUsd?: number;
  costUsd: number;
  shippingMxUsd: number;
  shippingUsUsd: number;
  stock: number;
  active: boolean;
  category: string;
  cjSku: string;
  rating: number;
  featured?: boolean;
}

interface ApiResult {
  products: ProductRow[];
  total: number;
  page: number;
  limit: number;
  pages: number;
  categories: string[];
}

export function ProductManagerPanel() {
  const [data, setData] = useState<ApiResult>({
    products: [],
    total: 0,
    page: 1,
    limit: 20,
    pages: 1,
    categories: [],
  });
  const [loading, setLoading] = useState(true);
  const [prices, setPrices] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState("");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const q = new URLSearchParams();
  q.set("page", String(data.page));
  q.set("limit", String(data.limit));
  if (search) q.set("search", search);
  if (categoryFilter) q.set("category", categoryFilter);
  if (activeFilter !== "all") q.set("active", activeFilter);

  async function load(cancelled?: boolean) {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/products?${q.toString()}`);
      const d = await res.json();
      if (cancelled) return;
      setData({
        products: d.products || [],
        total: d.total || 0,
        page: d.page || 1,
        limit: d.limit || 20,
        pages: d.pages || 1,
        categories: d.categories || [],
      });
    } catch {
      if (!cancelled) setMsg("Error cargando productos");
    } finally {
      if (!cancelled) setLoading(false);
    }
  }

  useEffect(() => {
    const cancelled = false;
    // Defer to microtask to avoid synchronous cascading renders
    setTimeout(() => {
      void load(cancelled);
    }, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, categoryFilter, activeFilter, data.page, data.limit]);

  async function savePrice(p: ProductRow) {
    const raw = prices[p.id];
    if (raw === undefined || raw === "") return;
    const price = Number(raw);
    if (!Number.isFinite(price) || price <= 0) {
      setMsg("Precio inválido");
      return;
    }
    setBusy(p.id);
    setMsg("");
    try {
      const res = await fetch(`/api/admin/products/${p.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ manualPriceUsd: price }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Error");
      invalidateProductsCache();
      setMsg(`Precio actualizado: $${price.toFixed(2)} USD`);
      setPrices((s) => {
        const copy = { ...s };
        delete copy[p.id];
        return copy;
      });
      await load();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Error");
    } finally {
      setBusy(null);
    }
  }

  async function toggleActive(p: ProductRow) {
    setBusy(p.id);
    try {
      const res = await fetch(`/api/admin/products/${p.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !p.active }),
      });
      if (!res.ok) throw new Error("Error");
      invalidateProductsCache();
      setMsg(`Producto ${p.active ? "desactivado" : "activado"}`);
      await load();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Error");
    } finally {
      setBusy(null);
    }
  }

  async function toggleFeatured(p: ProductRow) {
    setBusy(p.id);
    try {
      const res = await fetch(`/api/admin/products/${p.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ featured: !p.featured }),
      });
      if (!res.ok) throw new Error("Error");
      await load();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Error");
    } finally {
      setBusy(null);
    }
  }

  async function remove(p: ProductRow) {
    if (!window.confirm(`¿Eliminar "${p.name.slice(0, 60)}…" del catálogo?`)) return;
    setBusy(p.id);
    setMsg("");
    try {
      const res = await fetch(`/api/admin/products/${p.id}`, { method: "DELETE" });
      if (!res.ok) {
        const d = await res.json().catch(() => null);
        throw new Error(d?.error || "Error");
      }
      invalidateProductsCache();
      setMsg(`Eliminado: ${p.name.slice(0, 40)}`);
      setSelected((s) => {
        const copy = new Set(s);
        copy.delete(p.id);
        return copy;
      });
      await load();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Error");
    } finally {
      setBusy(null);
    }
  }

  async function bulkAction(action: string) {
    if (selected.size === 0) {
      setMsg("Selecciona al menos un producto");
      return;
    }
    const ids = Array.from(selected);
    if (
      action === "delete" &&
      !window.confirm(`¿Eliminar ${selected.size} productos del catálogo?`)
    )
      return;
    setBusy("bulk");
    setMsg("");
    try {
      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ids }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Error");
      invalidateProductsCache();
      setMsg(`Acción "${action}": ${d.affected || selected.size} productos`);
      setSelected(new Set());
      await load();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Error");
    } finally {
      setBusy(null);
    }
  }

  function exportCsv() {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (categoryFilter) params.set("category", categoryFilter);
    if (activeFilter !== "all") params.set("active", activeFilter);
    params.set("export", "csv");
    window.open(`/api/admin/products?${params.toString()}`, "_blank");
  }

  function goToPage(page: number) {
    setData((d) => ({ ...d, page: Math.max(1, Math.min(d.pages, page)) }));
  }

  return (
    <div className="rounded-2xl border border-gold/20 bg-ivory p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-semibold text-brown">
            Catálogo de productos
          </h2>
          <p className="mt-1 text-sm text-brown-soft">
            Edita precios, activa/desactiva, destaca y elimina productos. Los
            cambios se reflejan en la tienda al instante.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading}
            className="inline-flex items-center gap-1 rounded-full border border-gold/30 px-3 py-1.5 text-xs font-semibold text-brown-soft hover:bg-cream disabled:opacity-50"
          >
            <RefreshCw size={14} /> Refrescar
          </button>
          {selected.size > 0 && (
            <>
              <button
                type="button"
                onClick={() => bulkAction("deactivate")}
                disabled={busy === "bulk"}
                className="inline-flex items-center gap-1 rounded-full border border-amber-300 px-3 py-1.5 text-xs font-semibold text-amber-800 hover:bg-amber-50 disabled:opacity-50"
              >
                <XCircle size={14} /> Desactivar ({selected.size})
              </button>
              <button
                type="button"
                onClick={() => bulkAction("activate")}
                disabled={busy === "bulk"}
                className="inline-flex items-center gap-1 rounded-full border border-emerald-300 px-3 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-50 disabled:opacity-50"
              >
                <CheckCircle2 size={14} /> Activar ({selected.size})
              </button>
              <button
                type="button"
                onClick={() => bulkAction("delete")}
                disabled={busy === "bulk"}
                className="inline-flex items-center gap-1 rounded-full border border-red-300 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
              >
                <Trash2 size={14} /> Eliminar ({selected.size})
              </button>
            </>
          )}
          <button
            type="button"
            onClick={exportCsv}
            className="inline-flex items-center gap-1 rounded-full bg-brown px-3 py-1.5 text-xs font-semibold text-ivory hover:bg-gold-dark"
          >
            <Download size={14} /> CSV
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <div className="relative w-64">
          <Search
            size={16}
            className="absolute left-2 top-1/2 -translate-y-1/2 text-brown-soft"
          />
          <input
            type="text"
            placeholder="Buscar por nombre, slug, SKU…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setData((d) => ({ ...d, page: 1 }));
            }}
            className="w-full rounded-xl border border-gold/30 bg-white pl-8 pr-3 py-1.5 text-sm text-brown placeholder-brown-soft/40 outline-none focus:ring-2 focus:ring-gold"
          />
        </div>
        {data.categories.length > 0 && (
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setData((d) => ({ ...d, page: 1 }));
            }}
            className="rounded-xl border border-gold/30 bg-white px-3 py-1.5 text-sm text-brown outline-none focus:ring-2 focus:ring-gold"
          >
            <option value="">Todas las categorías</option>
            {data.categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        )}
        <select
          value={activeFilter}
          onChange={(e) => {
            setActiveFilter(e.target.value);
            setData((d) => ({ ...d, page: 1 }));
          }}
          className="rounded-xl border border-gold/30 bg-white px-3 py-1.5 text-sm text-brown outline-none focus:ring-2 focus:ring-gold"
        >
          <option value="all">Todos</option>
          <option value="true">Activos</option>
          <option value="false">Inactivos</option>
        </select>
      </div>

      {msg && (
        <p className="mt-3 rounded-xl bg-cream px-3 py-2 text-sm text-brown">
          {msg}
        </p>
      )}

      {/* Tabla */}
      {loading ? (
        <p className="mt-4 text-sm text-brown-soft">Cargando…</p>
      ) : data.products.length === 0 ? (
        <p className="mt-4 rounded-2xl border border-dashed border-gold/40 p-8 text-center text-sm text-brown-soft">
          No hay productos que coincidan con los filtros.
        </p>
      ) : (
        <>
          <ul className="mt-4 divide-y divide-gold/10">
            {data.products.map((p) => {
              const displayPrice = p.manualPriceUsd ?? p.priceUsd;
              const margin =
                displayPrice - p.costUsd - p.shippingMxUsd - displayPrice * 0.036;
              const marginPct = displayPrice > 0 ? (margin / displayPrice) * 100 : 0;
              return (
                <li key={p.id} className="flex items-center gap-4 py-3">
                  {/* Checkbox bulk */}
                  <div className="flex shrink-0 items-center justify-center">
                    <input
                      type="checkbox"
                      checked={selected.has(p.id)}
                      onChange={(e) => {
                        const copy = new Set(selected);
                        if (e.target.checked) copy.add(p.id);
                        else copy.delete(p.id);
                        setSelected(copy);
                      }}
                      className="h-4 w-4 accent-brown"
                    />
                  </div>

                  {/* Imagen */}
                  <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-cream-dark">
                    {p.slug && (
                      <Image
                        src={`https://cdn.shopify.com/s/files/1/${p.slug}/preview.jpg`}
                        alt={p.name}
                        fill
                        className="object-cover"
                        unoptimized
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "/placeholder.png";
                        }}
                        sizes="48px"
                      />
                    )}
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-brown">
                      {p.name}
                    </p>
                    <p className="mt-0.5 text-xs text-brown-soft">
                      <Tag size={10} className="inline mr-1" />
                      {p.category} · Stock {p.stock} · {p.cjSku}
                      {p.featured && (
                        <span className="ml-1 rounded-full bg-gold/10 px-1.5 py-0.25 text-[10px] font-semibold text-gold">
                          destacado
                        </span>
                      )}
                    </p>
                  </div>

                  {/* Precio + margen */}
                  <div className="flex shrink-0 items-center gap-2 text-right">
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min={0}
                        step={0.01}
                        placeholder={displayPrice.toFixed(2)}
                        value={prices[p.id] ?? ""}
                        onChange={(e) =>
                          setPrices((s) => ({ ...s, [p.id]: e.target.value }))
                        }
                        className="w-20 rounded-xl border border-gold/30 bg-ivory px-2 py-1 text-right text-xs text-brown placeholder-brown-soft/40"
                      />
                      <span className="text-[10px] text-brown-soft">USD</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-brown-soft">
                        actual: ${p.priceUsd.toFixed(2)}
                      </span>
                      <span
                        className={`block text-xs font-medium ${
                          marginPct >= 10
                            ? "text-emerald-600"
                            : marginPct >= 0
                              ? "text-amber-600"
                              : "text-red-500"
                        }`}
                      >
                        margen: {marginPct.toFixed(0)}%
                      </span>
                    </div>
                  </div>

                  {/* Toggle features */}
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      onClick={() => toggleFeatured(p)}
                      disabled={busy === p.id}
                      title={p.featured ? "Quitar destacado" : "Destacar"}
                      className={`rounded-full p-1 text-xs ${
                        p.featured
                          ? "bg-gold/20 text-gold-dark"
                          : "text-brown-soft hover:bg-cream"
                      } disabled:opacity-50`}
                    >
                      <Tag size={12} />
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleActive(p)}
                      disabled={busy === p.id}
                      title={p.active ? "Desactivar" : "Activar"}
                      className={`rounded-full p-1 text-xs ${
                        p.active
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-red-100 text-red-600"
                      } disabled:opacity-50`}
                    >
                      {p.active ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                    </button>
                    <button
                      type="button"
                      onClick={() => savePrice(p)}
                      disabled={busy === p.id || !prices[p.id]}
                      title="Guardar precio manual"
                      className="rounded-full bg-brown p-1 text-xs text-ivory opacity-50 hover:opacity-100 disabled:hover:opacity-50"
                    >
                      <Save size={12} />
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(p)}
                      disabled={busy === p.id}
                      title="Eliminar"
                      className="rounded-full border border-red-300 p-1 text-xs text-red-500 hover:bg-red-50 disabled:opacity-50"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>

          {/* Paginación */}
          <div className="mt-4 flex items-center justify-between text-sm text-brown-soft">
            <span>
              {data.total} producto{data.total !== 1 ? "s" : ""} · página{" "}
              {data.page}/{data.pages}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => goToPage(data.page - 1)}
                disabled={data.page <= 1 || loading}
                className="rounded-full border border-gold/30 px-2 py-1 disabled:opacity-50"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                onClick={() => goToPage(data.page + 1)}
                disabled={data.page >= data.pages || loading}
                className="rounded-full border border-gold/30 px-2 py-1 disabled:opacity-50"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
