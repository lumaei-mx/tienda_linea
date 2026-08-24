import type { MetadataRoute } from "next";
import { readProducts } from "@/lib/products-db";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://www.lumaei.com";

// Refleja el catálogo vivo (Redis si está disponible, si no seed local).
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await readProducts();
  const active = products.filter((p) => p.active);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE}/`, changeFrequency: "daily", priority: 1 },
    { url: `${SITE}/productos`, changeFrequency: "daily", priority: 0.9 },
    {
      url: `${SITE}/afiliados`,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    { url: `${SITE}/blog`, changeFrequency: "weekly", priority: 0.6 },
    {
      url: `${SITE}/blog/regalos-para-ella-2026`,
      changeFrequency: "weekly",
      priority: 0.6,
    },
    {
      url: `${SITE}/guia/5-gadgets`,
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];

  const productRoutes: MetadataRoute.Sitemap = active.map((p) => ({
    url: `${SITE}/productos/${p.slug}`,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [...staticRoutes, ...productRoutes];
}
