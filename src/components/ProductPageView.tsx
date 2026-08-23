"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";
import type { PublicProduct } from "@/lib/types";
import { useCart } from "@/lib/cart-store";
import { t } from "@/lib/i18n";
import { getProductCopy, buildFallbackCopy, pickCopy, productName } from "@/lib/copy";
import { groupCategory, groupLabel } from "@/lib/categories";
import { AddToCartButton } from "@/components/AddToCartButton";
import { ProductPrice } from "@/components/ProductPrice";
import { ProductGallery } from "@/components/ProductGallery";
import { TrustBadges } from "@/components/TrustBadges";
import { TrustSeal } from "@/components/TrustSeal";
import { ProductReviews } from "@/components/ProductReviews";
import { BackButton } from "@/components/BackButton";
import { SectionTitle } from "@/components/SectionTitle";
import { ChevronDown, Check, ShieldCheck, Truck, Tag } from "lucide-react";

export function ProductPageView({
  product,
  affiliateRef,
}: {
  product: PublicProduct;
  /** Ref de afiliado (normalizado) capturado del query param ?ref= de la PDP. */
  affiliateRef?: string;
}) {
  const lang = useCart((s) => s.lang);
  const setRef = useCart((s) => s.setRef);
  // C1: el ref queda capturado en el estado del carrito al ABRIR la PDP con
  // ?ref=. No espera al click de "agregar" — así persiste aunque el cliente
  // agregue desde otra página después de visitar el link del influencer.
  useEffect(() => {
    if (affiliateRef) setRef(affiliateRef);
  }, [affiliateRef, setRef]);
  const curated = getProductCopy(product);
  const base =
    curated && (lang === "es" || curated.hookEn)
      ? curated
      : buildFallbackCopy(product, lang);
  const copy = pickCopy(base, lang);
  const group = groupLabel(groupCategory(product.category), lang);

  // Provenance → sección "Documentación y procedencia" (white-label documentado).
  const prov = product.provenance;
  const provRows: Array<[string, ReactNode]> = [];
  if (prov) {
    const esL = lang === "es";
    const push = (labelEs: string, labelEn: string, value?: ReactNode) => {
      if (value === undefined || value === "" || value === false) return;
      provRows.push([esL ? labelEs : labelEn, value]);
    };
    push("Marca", "Brand", prov.brand);
    push("Fabricante", "Manufacturer", prov.manufacturer);
    push("Modelo", "Model", prov.model);
    push("País de origen", "Country of origin", prov.countryOfOrigin);
    push("Proveedor", "Supplier", prov.supplier);
    push("Certificación FCC", "FCC certification", prov.certFcc);
    push("Certificación CE", "CE certification", prov.certCe ? (esL ? "Sí" : "Yes") : undefined);
    push("Etiquetado NOM-024", "NOM-024 labeling", prov.nom024 ? (esL ? "Sí" : "Yes") : undefined);
    push("Certificación UL", "UL certification", prov.certUl ? (esL ? "Sí" : "Yes") : undefined);
    push("RoHS", "RoHS", prov.rohs ? (esL ? "Sí" : "Yes") : undefined);
    push("Garantía", "Warranty", prov.garantiaMeses ? `${prov.garantiaMeses} ${esL ? "días" : "days"}` : undefined);
    if (prov.manualUrl)
      provRows.push([esL ? "Manual" : "Manual", <a key="m" href={prov.manualUrl} target="_blank" rel="noopener noreferrer" className="text-gold-dark underline">{esL ? "Ver manual" : "View manual"}</a>]);
    if (prov.fichaTecnicaUrl)
      provRows.push([esL ? "Ficha técnica" : "Datasheet", <a key="f" href={prov.fichaTecnicaUrl} target="_blank" rel="noopener noreferrer" className="text-gold-dark underline">{esL ? "Ver ficha" : "View datasheet"}</a>]);
    if (prov.notes) provRows.push([esL ? "Notas" : "Notes", prov.notes]);
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-6">
        <BackButton />
      </div>

      <div className="grid gap-10 md:grid-cols-2">
        <ProductGallery images={product.images} alt={productName(product, lang)} />

        <div className="flex flex-col">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold-dark">
            {group}
          </p>
          <h1 className="mt-3 font-serif text-4xl font-semibold leading-tight text-brown">
            {copy.hook}
          </h1>
          <p className="mt-3 leading-relaxed text-brown-soft">{copy.subtitle}</p>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <ProductPrice product={product} />
            <TrustSeal />
          </div>

          <ul className="mt-6 space-y-2.5">
            {copy.benefits.map((b, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-brown-soft">
                <Check size={17} strokeWidth={2} className="mt-0.5 shrink-0 text-gold-dark" />
                <span>{b}</span>
              </li>
            ))}
          </ul>

          {/* Oferta apilada (Hormozi): garantía + envío gratis 2+ + descuento bienvenida */}
          <div className="mt-6 rounded-2xl border border-gold/30 bg-cream/60 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold-dark">
              {t("productOfferStack", lang)}
            </p>
            <ul className="mt-3 space-y-2.5 text-sm text-brown-soft">
              <li className="flex items-start gap-2.5">
                <ShieldCheck size={16} strokeWidth={1.8} className="mt-0.5 shrink-0 text-gold-dark" />
                <span>{t("productOfferG", lang)}</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Truck size={16} strokeWidth={1.8} className="mt-0.5 shrink-0 text-gold-dark" />
                <span>{t("productOfferS", lang)}</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Tag size={16} strokeWidth={1.8} className="mt-0.5 shrink-0 text-gold-dark" />
                <span>
                  {t("productOfferD", lang)}{" "}
                  <span className="rounded-md bg-brown px-1.5 py-0.5 font-mono text-[11px] font-bold tracking-wider text-ivory">
                    LUMAI10
                  </span>
                </span>
              </li>
            </ul>
          </div>

          <div className="mt-7">
            <AddToCartButton
              productId={product.id}
              affiliateRef={affiliateRef}
              product={{
                id: product.id,
                name: product.name,
                category: product.category,
                priceUsd: product.priceUsd,
              }}
            />
            <div className="mt-2 text-center text-xs text-brown-soft sm:text-left">
              <SectionTitle k="productTrust" as="p" />
            </div>
          </div>

          <TrustBadges />
        </div>
      </div>

      {/* Descripción */}
      <section className="mt-14 grid gap-10 md:grid-cols-2">
        <div>
          <SectionTitle k="productDescription" className="font-serif text-2xl font-semibold text-brown" />
          <div className="mt-4 whitespace-pre-line leading-relaxed text-brown-soft">
            {copy.description}
          </div>
        </div>
        <div>
          <SectionTitle k="productSpecs" className="font-serif text-2xl font-semibold text-brown" />
          <ul className="mt-4 space-y-2 text-sm text-brown-soft">
            {copy.specs.map((s, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <ChevronDown size={15} className="mt-0.5 shrink-0 -rotate-90 text-gold-dark" />
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* FAQ */}
      <section className="mt-14">
        <SectionTitle k="productFaq" className="font-serif text-2xl font-semibold text-brown" />
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {copy.faqs.map((f, i) => (
            <details
              key={i}
              className="group rounded-2xl border border-gold/20 bg-ivory px-5 py-4"
            >
              <summary className="flex cursor-pointer items-center justify-between gap-3 text-sm font-semibold text-brown">
                {f.q}
                <ChevronDown
                  size={16}
                  className="shrink-0 text-gold-dark transition group-open:rotate-180"
                />
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-brown-soft">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Documentación y procedencia */}
      {provRows.length > 0 && (
        <section className="mt-14">
          <SectionTitle k="productDocs" className="font-serif text-2xl font-semibold text-brown" />
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {provRows.map(([label, value], i) => (
              <div
                key={i}
                className="flex items-start justify-between gap-4 rounded-2xl border border-gold/20 bg-ivory px-5 py-3 text-sm"
              >
                <span className="text-brown-soft">{label}</span>
                <span className="text-right font-medium text-brown">{value}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Reviews */}
      <ProductReviews product={product} />
    </div>
  );
}
