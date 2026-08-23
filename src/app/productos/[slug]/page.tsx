import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProductBySlugAsync } from "@/lib/products-db";
import { normalizeRef, toPublicProduct } from "@/lib/types";
import { ProductPageView } from "@/components/ProductPageView";
import { ProductViewTracker } from "@/components/ProductViewTracker";
import { detectLangServer } from "@/lib/i18n";
import {
  productMetaDescription,
  productName,
  getProductCopy,
  reviewsSummary,
} from "@/lib/copy";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlugAsync(slug);
  if (!product) return {};
  const lang = await detectLangServer();
  const name = productName(product, lang);
  const metaDescription = productMetaDescription(product, lang);
  const image = product.images?.[0] || "/og-image.png";
  return {
    title: `${name} · $${product.priceUsd.toFixed(2)} USD | Lumaei`,
    description: metaDescription,
    openGraph: {
      title: `${name} | Lumaei`,
      description: metaDescription,
      url: `https://www.lumaei.com/productos/${slug}`,
      siteName: "Lumaei",
      images: [{ url: image }],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${name} | Lumaei`,
      description: metaDescription,
      images: [image],
    },
  };
}

export default async function ProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ ref?: string; affiliateRef?: string }>;
}) {
  const { slug } = await params;
  // Ref de afiliado: acepta `?ref=@handle` (pitch DM) y `?affiliateRef=@handle`
  // (link en bio de TikTok). force-dynamic garantiza searchParams reales.
  const { ref, affiliateRef } = await searchParams;
  const rawRef = affiliateRef ?? ref;
  const product = await getProductBySlugAsync(slug);
  if (!product) notFound();

  // JSON-LD Product: mejora descubrimiento orgánico (SEO) sin costo.
  // Solo datos públicos: precio de venta, nunca costo/SKU internos.
  // Usa nombre/descripción limpios (curated ES/EN) y agrega sku +
  // aggregateRating solo cuando hay reseñas REALES (regla: cero inventadas).
  const lang = await detectLangServer();
  const ldName = productName(product, lang);
  const ldDescription = productMetaDescription(product, lang);
  const curated = getProductCopy(product);
  const rating = curated
    ? reviewsSummary(curated)
    : { reviewCount: 0, reviewAvg: 0 };
  const productLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: ldName,
    image: product.images,
    description: ldDescription,
    sku: product.cjSku,
    brand: { "@type": "Brand", name: "Lumaei" },
    offers: {
      "@type": "Offer",
      url: `https://www.lumaei.com/productos/${slug}`,
      priceCurrency: "USD",
      price: product.priceUsd,
      availability: product.active
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
    },
    ...(rating.reviewCount > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: rating.reviewAvg,
            reviewCount: rating.reviewCount,
          },
        }
      : {}),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productLd) }}
      />
      <ProductViewTracker
        id={product.id}
        name={product.name}
        category={product.category}
        priceUsd={product.priceUsd}
      />
      {/* Sanitizado: NUNCA enviar costos/SKUs internos al cliente */}
      <ProductPageView
        product={toPublicProduct(product)}
        affiliateRef={normalizeRef(rawRef)}
      />
    </>
  );
}
