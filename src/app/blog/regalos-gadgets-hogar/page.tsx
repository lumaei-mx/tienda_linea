import type { Metadata } from "next";
import Link from "next/link";
import { guidePrice } from "@/lib/guide-prices";

export const dynamic = "force-static";

const SLUG = "/blog/regalos-gadgets-hogar";
const TITLE =
  "Regalos y gadgets prácticos para el hogar en 2026 (lo que realmente funciona)";
const DESCRIPTION =
  "Guía honesta de gadgets útiles para el hogar que resuelven problemas reales: luces LED con sensor, organizadores, cargadores y más. Con precios y links al catálogo Lumaei.";

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
      "auto-led-usb-magnetic-wireless-night-light-corridors-porch-lights-pir-motion-sen",
    name: "Luz LED magnética con sensor de movimiento",
    img: "https://cf.cjdropshipping.com/20200703/1455264561787.jpg",
    price: "$14.74 USD",
    pitch:
      "Se enciende sola cuando pasas. Sin cables, carga USB-C, ideal para pasillos, clósets y escaleras.",
  },
  {
    slug:
      "kitchen-double-tier-spice-rack-multifunctional-rotating-storage-rack-spice-organ",
    name: "Organizador giratorio de especias de 2 niveles",
    img: "https://cf.cjdropshipping.com/f11e0c16-4232-4a98-943c-bfb07031fd99.jpg",
    price: "$33.23 USD",
    pitch:
      "Termina el caos en la cocina en 10 segundos. Gira 360° y aprovecha el espacio vertical.",
  },
  {
    slug:
      "rechargeable-led-wireless-kitchen-usb-automatic-closet-light-bar-magnetic-cabine",
    name: "Barra de luz LED recargable para clóset y cocina",
    img: "https://cf.cjdropshipping.com/2def7f27-94d7-4ed1-8a24-bab4502728ea.jpg",
    price: "$35.15 USD",
    pitch:
      "Magnética, 3 tonos de luz y se pega donde el foco no llega. Recargable por USB.",
  },
  {
    slug:
      "magnetic-bendable-car-mobile-phone-holder-wireless-charger-phone-holder-15w-car-",
    name: "Soporte magnético con carga inalámbrica 15W para auto",
    img: "https://cf.cjdropshipping.com/c6dd15cd-332f-412d-b04f-3fb361d54afb_trans.jpeg",
    price: "$49.74 USD",
    pitch:
      "Tu celular carga solo al acercarlo. Manos libres y estable mientras manejas.",
  },
  {
    slug:
      "galaxy-star-projector-starry-sky-night-light-astronaut-lamp-room-decr-gift-child",
    name: "Proyector de estrellas astronauta",
    img: "https://cf.cjdropshipping.com/aed3289e-be07-4bee-be64-b7a7763a6315.jpg",
    price: "$43.68 USD",
    pitch:
      "Convierte cualquier cuarto en galaxia. Lámpara nocturna y regalo infalible.",
  },
  {
    slug:
      "silicone-ice-face-roller-contour-shrink-pores-remove-dark-circles-massage-skin-b",
    name: "Rodillo de hielo facial de silicona",
    img: "https://cf.cjdropshipping.com/quick/product/bab01418-9540-4b61-bfc9-0b4fea3f1393.jpg",
    price: "$30.45 USD",
    pitch:
      "Masaje frío en 2 minutos para despertar la cara. Reutilizable y libre de químicos.",
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
  datePublished: "2026-08-23",
  dateModified: "2026-08-24",
};

export default async function GuiaGadgetsHogar() {
  const resolved = await Promise.all(
    picks.map(async (p) => ({ ...p, price: await guidePrice(p.slug, p.price) }))
  );
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
        El mejor gadget no es el más caro: es el que usas todos los días. En
        Lumaei elegimos piezas que resuelven una molestia real —y las probamos
        en la vida normal, no en un catálogo perfecto—. Esta guía reúne los
        objetos pequeños que más diferencia hacen en un hogar, y por qué
        funcionan.
      </p>

      <h2 className="mt-10 font-serif text-2xl text-brown">
        Por qué los “gadgets útiles” se venden solos
      </h2>
      <p className="mt-3 leading-relaxed text-brown-soft">
        Vendemos soluciones, no aparatos. Una luz que se enciende sola cuando
        entras al pasillo oscuro elimina fricción; un organizador que gira
        elimina la búsqueda eterna de la sal. El cerebro compra alivio, no
        features. Por eso cada pieza de esta lista nace de un “odio cuando…”
        real.
      </p>

      <h2 className="mt-10 font-serif text-2xl text-brown">
        Nuestros 6 gadgets prácticos favoritos
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
        Cómo elegir el tuyo (sin gastar de más)
      </h2>
      <ul className="mt-3 list-disc space-y-2 pl-5 leading-relaxed text-brown-soft">
        <li>
          <strong className="text-brown">Empieza por la molestia.</strong>{" "}
          Anota la pequeña frustración diaria; casi siempre tiene un gadget de
          menos de $20 USD.
        </li>
        <li>
          <strong className="text-brown">Prioriza lo recargable.</strong> Un
          cable menos es un cajón menos lleno.
        </li>
        <li>
          <strong className="text-brown">Fíjate en el envío.</strong> En Lumaei
          el envío es gratis desde 2 piezas o desde $49 USD. Agrupar dos regalos
          sale mejor que comprar sueltos.
        </li>
      </ul>

      <div className="mt-10 rounded-2xl bg-cream-dark p-6 text-center">
        <p className="font-serif text-xl text-brown">
          ¿Listo para regalar (o consentirte)?
        </p>
        <p className="mt-2 text-sm text-brown-soft">
          Envío gratis desde 2 piezas o $49 USD · 90 días de garantía · paga el
          cliente, nosotros solo curamos.
        </p>
        <Link
          href="/productos"
          className="mt-4 inline-block rounded-full bg-gold px-6 py-2.5 text-sm font-semibold text-brown transition hover:bg-gold-dark"
        >
          Ver todo el catálogo →
        </Link>
      </div>

      <section className="mt-12">
        <h2 className="font-serif text-2xl text-brown">Preguntas frecuentes</h2>
        <div className="mt-4 space-y-4">
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
              ¿Los precios incluyen todo?
            </summary>
            <p className="mt-2 text-sm leading-relaxed text-brown-soft">
              El precio mostrado es de la pieza; el envío se calcula al carrito
              y es gratis cumpliendo los mínimos. No hay suscripciones.
            </p>
          </details>
          <details className="rounded-xl border border-gold/15 bg-ivory p-4">
            <summary className="cursor-pointer font-medium text-brown">
              ¿Tienen garantía?
            </summary>
            <p className="mt-2 text-sm leading-relaxed text-brown-soft">
              Sí, 90 días en las piezas seleccionadas. Escríbenos y te
              ayudamos.
            </p>
          </details>
        </div>
      </section>

      <section className="mt-12 rounded-2xl border border-gold/15 bg-ivory p-6">
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
          Belleza, ambiente y comodidad: la guía de regalos para novia, amiga o
          mamá, con precios reales y link directo al catálogo.
        </p>
        <Link
          href="/blog/halloween-ambiente-2026"
          className="mt-4 block font-serif text-xl text-brown transition hover:text-gold-dark"
        >
          Halloween 2026: iluminación y ambiente para tu casa →
        </Link>
        <p className="mt-1 text-sm text-brown-soft">
          Proyector de galaxia, barras LED y luces con sensor para la fiesta —y
          para todo el año—.
        </p>
        <Link
          href="/blog/regreso-a-clases-2026"
          className="mt-4 block font-serif text-xl text-brown transition hover:text-gold-dark"
        >
          Regreso a clases 2026: gadgets para estudiantes que sí usa →
        </Link>
        <p className="mt-1 text-sm text-brown-soft">
          Impresora térmica, cargador de auto, luces LED y más para el semestre,
          sin romper el presupuesto.
        </p>
        <Link
          href="/blog/regalos-bienestar-2026"
          className="mt-4 block font-serif text-xl text-brown transition hover:text-gold-dark"
        >
          Regalos de bienestar y autocuidado 2026: detalles para cuidarse en casa →
        </Link>
        <p className="mt-1 text-sm text-brown-soft">
          Rodillo de hielo, parches de colágeno, dispensador de jabón sin
          contacto y más para cuidarse en casa.
        </p>
      </section>
    </article>
  );
}
