import type { Metadata } from "next";
import Link from "next/link";
import { guidePrice, guidePriceRange } from "@/lib/guide-prices";

export const dynamic = "force-static";

const SLUG = "/blog/regalos-bienestar-2026";
const TITLE =
  "Regalos de bienestar y autocuidado 2026: detalles para cuidarse en casa (que sí usa)";
const DESCRIPTION =
  "Guía de autocuidado Lumaei: rodillo de hielo facial, parches de colágeno, dispensador de jabón sin contacto, proyector de estrellas, luces con sensor y más. Precios reales y link directo al catálogo.";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.lumaei.com"),
  title: `${TITLE} | Lumaei`,
  description: DESCRIPTION,
  alternates: { canonical: `https://www.lumaei.com${SLUG}` },
  openGraph: {
    title: `${TITLE} | Lumaei`,
    description: DESCRIPTION,
    url: `https://www.lumaei.com${SLUG}`,
    siteName: "Lumaei",
    type: "article",
    locale: "es_MX",
  },
  twitter: {
    card: "summary_large_image",
    title: `${TITLE} | Lumaei`,
    description: DESCRIPTION,
  },
};

type Pick = {
  slug: string;
  name: string;
  img: string;
  price: string;
  pitch: string;
};

const picks: Pick[] = [
  {
    slug:
      "silicone-ice-face-roller-contour-shrink-pores-remove-dark-circles-massage-skin-b",
    name: "Rodillo de hielo facial de silicona",
    img: "https://cf.cjdropshipping.com/quick/product/bab01418-9540-4b61-bfc9-0b4fea3f1393.jpg",
    price: "$30.45 USD",
    pitch:
      "Masaje frío en 2 minutos para despertar la cara. Reutilizable, libre de químicos: el ritual de spa en casa que se repite todas las mañanas.",
  },
  {
    slug:
      "beauty-gold-crystal-collagen-patches-for-eye-anti-aging-acne-eye-mask-korean-cos",
    name: "Parches de colágeno dorados para contorno de ojo",
    img: "https://cf.cjdropshipping.com/15253056/1842091534140.png",
    price: "$26.23 USD",
    pitch:
      "Parches coreanos de colágeno. 2-3 veces por semana, 30 min, y listo el momento de cuidarse. Pequeño lujo que no ocupa lugar.",
  },
  {
    slug:
      "non-contact-automatic-soap-dispenser-liquid-foam-machine-infrared-sensor-electri",
    name: "Dispensador de jabón sin contacto",
    img: "https://cf.cjdropshipping.com/947936eb-a29d-4faf-a63f-257225cb7454.jpg",
    price: "$53.92 USD",
    pitch:
      "Jabón espuma sin tocar nada: recargable, higiénico para baño y cocina. Cuida el espacio y la piel sin fricción.",
  },
  {
    slug:
      "galaxy-star-projector-starry-sky-night-light-astronaut-lamp-room-decr-gift-child",
    name: "Proyector de estrellas astronauta",
    img: "https://cf.cjdropshipping.com/aed3289e-be07-4bee-be64-b7a7763a6315.jpg",
    price: "$43.68 USD",
    pitch:
      "Convierte cualquier cuarto en galaxia. Ambiente que invita a bajar la velocidad y descansar de verdad, no solo a dormir.",
  },
  {
    slug:
      "auto-led-usb-magnetic-wireless-night-light-corridors-porch-lights-pir-motion-sen",
    name: "Luz LED magnética con sensor de movimiento",
    img: "https://cf.cjdropshipping.com/20200703/1455264561787.jpg",
    price: "$14.74 USD",
    pitch:
      "Se enciende sola al pasar. Sin cables, carga USB-C: ideal para pasillo, clóset o lectura nocturna sin buscar el interruptor.",
  },
  {
    slug:
      "rechargeable-led-wireless-kitchen-usb-automatic-closet-light-bar-magnetic-cabine",
    name: "Barra de luz LED recargable para clóset y cocina",
    img: "https://cf.cjdropshipping.com/2def7f27-94d7-4ed1-8a24-bab4502728ea.jpg",
    price: "$35.15 USD",
    pitch:
      "Magnética, 3 tonos de luz y se pega donde el foco no llega. Recargable por USB: bienestar sin cables colgando.",
  },
];

const articleLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: TITLE,
  description: DESCRIPTION,
  inLanguage: "es-MX",
  publisher: {
    "@type": "Organization",
    name: "Lumaei",
    url: "https://www.lumaei.com",
  },
  mainEntityOfPage: {
    "@type": "WebPage",
    "@id": `https://www.lumaei.com${SLUG}`,
  },
  datePublished: "2026-08-24",
  dateModified: "2026-08-24",
};

export default async function RegalosBienestar() {
  const resolved = await Promise.all(
    picks.map(async (p) => ({ ...p, price: await guidePrice(p.slug, p.price) }))
  );
  const range = await guidePriceRange(picks.map((p) => p.slug));
  const priceRangeText = range
    ? `Van de ${range.min} a ${range.max}`
    : "Van de $14.74 a $53.92 USD";
  return (
    <article className="mx-auto max-w-3xl px-4 py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }}
      />

      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-dark">
        Guía Lumaei
      </p>
      <h1 className="mt-3 font-serif text-4xl leading-tight text-brown sm:text-5xl">
        {TITLE}
      </h1>
      <p className="mt-4 text-lg leading-relaxed text-brown-soft">
        Cuidarse no es gastar en cremas caras: es tener a la mano lo que usas cada
        día. Esta guía de bienestar 2026 reúne detalles pequeños de autocuidado —
        frío facial, colágeno, luz, ambiente— que de verdad entran en la rutina.
        Nada de aparatos que terminan en el cajón: cada pieza nace de un “me
        haría bien…” real.
      </p>

      <h2 className="mt-10 font-serif text-2xl text-brown">
        Por qué el autocuidado se sostiene con piezas pequeñas
      </h2>
      <p className="mt-3 leading-relaxed text-brown-soft">
        El bienestar es un ritual, no un producto. Un rodillo que despierta la
        cara en dos minutos, una luz que se enciende sola al pasar, un proyector
        que convierte la habitación en galaxia: el cerebro premia la sensación de
        “me cuidé”, no la hoja de especificaciones. Por eso cada pieza de abajo
        resuelve una molestia repetida y por eso se usan —no se guardan—.
      </p>

      <h2 className="mt-10 font-serif text-2xl text-brown">
        Nuestros 6 favoritos para cuidarse en casa
      </h2>

      <div className="mt-6 space-y-6">
        {resolved.map((p) => (
          <div
            key={p.slug}
            className="flex flex-col gap-4 rounded-2xl border border-gold/20 bg-ivory p-4 sm:flex-row sm:items-center"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={p.img}
              alt={p.name}
              loading="lazy"
              className="h-28 w-28 flex-shrink-0 rounded-xl object-cover"
            />
            <div className="flex-1">
              <h3 className="font-serif text-xl text-brown">{p.name}</h3>
              <p className="mt-1 text-sm leading-relaxed text-brown-soft">
                {p.pitch}
              </p>
              <div className="mt-2 flex items-center gap-3">
                <span className="text-sm font-semibold text-gold-dark">
                  {p.price}
                </span>
                <Link
                  href={`/productos/${p.slug}`}
                  className="rounded-full bg-brown px-4 py-1.5 text-xs font-semibold text-ivory transition hover:bg-gold-dark"
                >
                  Ver producto →
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      <h2 className="mt-10 font-serif text-2xl text-brown">
        Cómo armar el ritual sin pasarte
      </h2>
      <ul className="mt-3 list-disc space-y-2 pl-5 leading-relaxed text-brown-soft">
        <li>
          <strong className="text-brown">Agrupa 2 piezas.</strong> El envío es
          gratis desde 2 piezas o desde $49 USD: un par de detalles pequeños sale
          mejor que uno solo y ya lleva el detalle de bienestar resuelto.
        </li>
        <li>
          <strong className="text-brown">Prioriza lo recargable.</strong> Un
          cable menos es un cajón menos lleno, y un ritual que dura.
        </li>
        <li>
          <strong className="text-brown">Piensa en el momento.</strong> Los
          mejores regalos de bienestar son los que se repiten: el cuidado facial,
          la luz de noche, el ambiente del cuarto.
        </li>
      </ul>

      <div className="mt-10 rounded-2xl bg-cream-dark p-6 text-center">
        <p className="font-serif text-xl text-brown">
          ¿Listo para cuidarte (o consentirla)?
        </p>
        <p className="mt-2 text-sm text-brown-soft">
          Envío gratis desde 2 piezas o $49 USD · 90 días de garantía · paga el
          cliente, nosotros solo curamos.
        </p>
        <Link
          href="/guia/5-gadgets"
          className="mt-4 inline-block rounded-full bg-gold px-6 py-2.5 text-sm font-semibold text-brown transition hover:bg-gold-dark"
        >
          Descarga la guía gratis + 10% LUMAI10 →
        </Link>
      </div>

      <section className="mt-12">
        <h2 className="font-serif text-2xl text-brown">Preguntas frecuentes</h2>
        <div className="mt-4 space-y-4">
          <details className="rounded-xl border border-gold/15 bg-ivory p-4">
            <summary className="cursor-pointer font-medium text-brown">
              ¿Son buenos regalos de bienestar a este precio?
            </summary>
            <p className="mt-2 text-sm leading-relaxed text-brown-soft">
              Sí. {priceRangeText} porque son piezas con propósito diario, no
              aparatos caros. Agrupados, lucen como un detalle pensado y no como
              una compra de impulso.
            </p>
          </details>
          <details className="rounded-xl border border-gold/15 bg-ivory p-4">
            <summary className="cursor-pointer font-medium text-brown">
              ¿Hacen envíos a México y Estados Unidos?
            </summary>
            <p className="mt-2 text-sm leading-relaxed text-brown-soft">
              Sí. Lumaei envía a ambos países con fulfillment automatizado; el
              envío es gratis desde 2 piezas o desde $49 USD.
            </p>
          </details>
          <details className="rounded-xl border border-gold/15 bg-ivory p-4">
            <summary className="cursor-pointer font-medium text-brown">
              ¿Tienen garantía?
            </summary>
            <p className="mt-2 text-sm leading-relaxed text-brown-soft">
              Sí, 90 días en las piezas seleccionadas. Escríbenos y te ayudamos.
            </p>
          </details>
        </div>
      </section>

      <section className="mt-12 space-y-4">
        <div className="rounded-2xl border border-gold/15 bg-ivory p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-dark">
            Lee también
          </p>
          <Link
            href="/blog/regalos-para-ella-2026"
            className="mt-2 block font-serif text-xl text-brown transition hover:text-gold-dark"
          >
            Regalos para ella 2026: detalles bonitos que sí va a usar →
          </Link>
          <p className="mt-1 text-sm text-brown-soft">
            Belleza, ambiente y comodidad para novia, amiga o mamá.
          </p>
        </div>
        <div className="rounded-2xl border border-gold/15 bg-ivory p-6">
          <Link
            href="/blog/regalos-gadgets-hogar"
            className="block font-serif text-xl text-brown transition hover:text-gold-dark"
          >
            Regalos y gadgets prácticos para el hogar en 2026 →
          </Link>
          <p className="mt-1 text-sm text-brown-soft">
            Organización, luces y cargadores que resuelven problemas reales en
            casa.
          </p>
        </div>
        <div className="rounded-2xl border border-gold/15 bg-ivory p-6">
          <Link
            href="/blog/regreso-a-clases-2026"
            className="mt-2 block font-serif text-xl text-brown transition hover:text-gold-dark"
          >
            Regreso a clases 2026: gadgets para estudiantes que sí usa →
          </Link>
          <p className="mt-1 text-sm text-brown-soft">
            Impresora térmica, cargador de auto, luces LED y más para el
            semestre, sin romper el presupuesto.
          </p>
        </div>
        <div className="rounded-2xl border border-gold/15 bg-ivory p-6">
          <Link
            href="/blog/ofrenda-moderna-dia-de-muertos-2026"
            className="block font-serif text-xl text-brown transition hover:text-gold-dark"
          >
            Ofrenda moderna 2026: luz y tecnología para tu altar →
          </Link>
          <p className="mt-1 text-sm text-brown-soft">
            Para la temporada que viene: fotos del altar impresas en casa y
            luz segura para cada nivel de la ofrenda.
          </p>
        </div>
      </section>
    </article>
  );
}
