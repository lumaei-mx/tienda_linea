import type { Metadata } from "next";
import Link from "next/link";
import { guidePrice, guidePriceRange } from "@/lib/guide-prices";

export const dynamic = "force-static";

const SLUG = "/blog/regalos-para-el-2026";
const TITLE =
  "Regalos para él 2026: gadgets útiles que sí va a usar (no terminan en el cajón)";
const DESCRIPTION =
  "Guía honesta de regalos para novio, papá o amigo: cargador inalámbrico de auto, impresora térmica, picadora, organizador de especias, luces con sensor y más. Precios reales y link directo al catálogo Lumaei.";

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
      "magnetic-bendable-car-mobile-phone-holder-wireless-charger-phone-holder-15w-car-",
    name: "Cargador inalámbrico magnético con soporte para auto 15W",
    img: "https://cf.cjdropshipping.com/c6dd15cd-332f-412d-b04f-3fb361d54afb_trans.jpeg",
    price: "$49.74 USD",
    pitch:
      "Sostén flexible + carga rápida 15W en el dashboard: el celular siempre cargado y a la vista sin soltar las manos del volante. El regalo para él que usa cada viaje.",
  },
  {
    slug:
      "portable-mini-thermal-label-printer-home-photo-printer-student-wrong-question-pr",
    name: "Impresora térmica portátil (etiquetas y fotos)",
    img: "https://cf.cjdropshipping.com/853ab40a-f0a9-4ac4-9f53-9a6021788e2b.png",
    price: "$31.75 USD",
    pitch:
      "Bluetooth, sin tinta: etiquetas para organizar, notas de estudio y fotos de bolsillo. Para el que le gusta tener las cosas claras y a la vista.",
  },
  {
    slug:
      "tenta-kitchen-485ml-manual-food-chopper-meat-grinder-vegetable-slicer-shredder-g",
    name: "Picadora manual de cocina 485ml",
    img: "https://cf.cjdropshipping.com/15217632/1443265897390.jpg",
    price: "$44.54 USD",
    pitch:
      "Pica, troza y ralla en segundos sin enchufe. Para el que cocina rápido entre semana: menos tiempo picando, más tiempo comiendo.",
  },
  {
    slug:
      "kitchen-double-tier-spice-rack-multifunctional-rotating-storage-rack-spice-organ",
    name: "Organizador giratorio de dos niveles para especias",
    img: "https://cf.cjdropshipping.com/f11e0c16-4232-4a98-943c-bfb07031fd99.jpg",
    price: "$33.23 USD",
    pitch:
      "Gira 360° y deja toda la especia a la mano. Orden en el gabinete que se nota cada vez que cocina. Pequeño detalle, gran alivio diario.",
  },
  {
    slug:
      "auto-led-usb-magnetic-wireless-night-light-corridors-porch-lights-pir-motion-sen",
    name: "Luz LED magnética con sensor de movimiento",
    img: "https://cf.cjdropshipping.com/20200703/1455264561787.jpg",
    price: "$14.74 USD",
    pitch:
      "Se enciende sola al pasar. Sin cables, carga USB-C: ideal para pasillo, clóset o garaje. La luz que lo salva a las 3 AM sin buscar el interruptor.",
  },
  {
    slug:
      "rechargeable-led-wireless-kitchen-usb-automatic-closet-light-bar-magnetic-cabine",
    name: "Barra de luz LED recargable para clóset y cocina",
    img: "https://cf.cjdropshipping.com/2def7f27-94d7-4ed1-8a24-bab4502728ea.jpg",
    price: "$35.15 USD",
    pitch:
      "Magnética, 3 tonos de luz y se pega donde el foco no llega. Recargable por USB, adiós a los cables. La pieza más barata de la lista y una de las más usadas.",
  },
  {
    slug:
      "galaxy-star-projector-starry-sky-night-light-astronaut-lamp-room-decr-gift-child",
    name: "Proyector de estrellas astronauta",
    img: "https://cf.cjdropshipping.com/aed3289e-be07-4bee-be64-b7a7763a6315.jpg",
    price: "$43.68 USD",
    pitch:
      "Convierte cualquier cuarto en galaxia. Lámpara nocturna y regalo infalible para quien ama el ambiente y las fotos. Funciona igual para él que para ella.",
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

export default async function RegalosParaEl() {
  const resolved = await Promise.all(
    picks.map(async (p) => ({ ...p, price: await guidePrice(p.slug, p.price) }))
  );
  const range = await guidePriceRange(picks.map((p) => p.slug));
  const priceRangeText = range
    ? `Van de ${range.min} a ${range.max} USD`
    : "Van de $14.74 a $49.74 USD";
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
        Al hombre práctico no lo consientes con objetos que se olvidan: lo
        consientes con cosas que usa. Por eso esta lista reúne gadgets con
        propósito diario —cargar, organizar, cocinar, alumbrar— que de verdad
        salen de la caja. Nada de aparatos que terminan en el cajón: cada pieza
        nace de un “qué bien me vendría…” real.
      </p>

      <h2 className="mt-10 font-serif text-2xl text-brown">
        Por qué estos regalos funcionan
      </h2>
      <p className="mt-3 leading-relaxed text-brown-soft">
        Regalamos alivio, no objetos. Un cargador que siempre está listo en el
        auto, una luz que se enciende sola al pasar, un organizador que gira
        para tener la especia a la mano: el cerebro compra la sensación, no la
        feature. Por eso cada pieza de abajo resuelve una molestia o crea un
        momento, y por eso se usan —no se guardan—.
      </p>

      <h2 className="mt-10 font-serif text-2xl text-brown">
        Nuestros 7 gadgets favoritos para él
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
        Cómo armar el regalo sin pasarte
      </h2>
      <ul className="mt-3 list-disc space-y-2 pl-5 leading-relaxed text-brown-soft">
        <li>
          <strong className="text-brown">Agrupa 2 piezas.</strong> El envío es
          gratis desde 2 piezas o desde $49 USD: dos detalles pequeños salen
          mejor que uno solo y ya llevan el sobre de regalo resuelto.
        </li>
        <li>
          <strong className="text-brown">Prioriza lo recargable.</strong> Un
          cable menos es un cajón menos lleno, y un regalo que dura.
        </li>
        <li>
          <strong className="text-brown">Piensa en el ritual.</strong> Los
          mejores regalos para él son los que se repiten: cargar en el auto, la
          luz de noche, el orden en la cocina.
        </li>
      </ul>

      <div className="mt-10 rounded-2xl bg-cream-dark p-6 text-center">
        <p className="font-serif text-xl text-brown">
          ¿Listo para consentirlo?
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
              ¿Son buenos regalos a este precio?
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
            La guía complementaria: belleza, ambiente y comodidad para novia,
            amiga o mamá.
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
      </section>
    </article>
  );
}
