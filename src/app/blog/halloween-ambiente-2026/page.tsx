import type { Metadata } from "next";
import Link from "next/link";
import { guidePrice, guidePriceRange } from "@/lib/guide-prices";

export const dynamic = "force-static";

const SLUG = "/blog/halloween-ambiente-2026";
const TITLE =
  "Halloween 2026: iluminación y ambiente para tu casa sin gastar de más";
const DESCRIPTION =
  "Guía Lumaei de Halloween 2026: proyector de galaxia, barras LED, luces con sensor de movimiento y el kit de recuperación para el día siguiente. Precios reales y link directo al catálogo.";

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
      "galaxy-star-projector-starry-sky-night-light-astronaut-lamp-room-decr-gift-child",
    name: "Proyector de estrellas astronauta",
    img: "https://cf.cjdropshipping.com/aed3289e-be07-4bee-be64-b7a7763a6315.jpg",
    price: "$43.68 USD",
    pitch:
      "El atajo más barato para transformar un cuarto: nebulosa de colores que hace de fondo perfecto para la fiesta (y después sirve como luz de noche todo el año).",
  },
  {
    slug:
      "rechargeable-led-wireless-kitchen-usb-automatic-closet-light-bar-magnetic-cabine",
    name: "Barra de luz LED recargable (3 tonos)",
    img: "https://cf.cjdropshipping.com/2def7f27-94d7-4ed1-8a24-bab4502728ea.jpg",
    price: "$35.15 USD",
    pitch:
      "Iluminación de acento donde quieras: magnética, recargable y con tono cálido para mesa de dulces o barra. Sin cables cruzando el pasillo de la fiesta.",
  },
  {
    slug:
      "auto-led-usb-magnetic-wireless-night-light-corridors-porch-lights-pir-motion-sen",
    name: "Luz LED con sensor de movimiento",
    img: "https://cf.cjdropshipping.com/20200703/1455264561787.jpg",
    price: "$14.74 USD",
    pitch:
      "Se enciende sola cuando alguien pasa: la entrada o el pasillo se vuelven parte del susto. Después de Halloween queda como luz práctica de noche.",
  },
  {
    slug:
      "non-contact-automatic-soap-dispenser-liquid-foam-machine-infrared-sensor-electri",
    name: "Dispensador de jabón sin contacto",
    img: "https://cf.cjdropshipping.com/947936eb-a29d-4faf-a63f-257225cb7454.jpg",
    price: "$53.92 USD",
    pitch:
      "El detalle que nadie espera en una fiesta: jabón espuma sin tocar nada para baño y estación de dulces. Higiénico cuando hay mucha mano en poco espacio.",
  },
  {
    slug:
      "silicone-ice-face-roller-contour-shrink-pores-remove-dark-circles-massage-skin-b",
    name: "Rodillo de hielo facial",
    img: "https://cf.cjdropshipping.com/bab01418-9540-4b61-bfc9-0b4fea3f1393.jpg",
    price: "$30.45 USD",
    pitch:
      "Para el 1 de noviembre: masaje frío de 2 minutos que desinflama después del maquillaje pesado y la noche larga.",
  },
  {
    slug:
      "beauty-gold-crystal-collagen-patches-for-eye-anti-aging-acne-eye-mask-korean-cos",
    name: "Parches de colágeno dorados para ojos",
    img: "https://cf.cjdropshipping.com/15253056/1842091534140.png",
    price: "$26.23 USD",
    pitch:
      "30 minutos y el contorno de los ojos se recupera del glitter, el delineado y las fotos a las 3 a.m. El cierre perfecto del kit.",
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

export default function HalloweenAmbiente() {
  return (
    <GuideBody />
  );
}

async function GuideBody() {
  const resolved = await Promise.all(
    picks.map(async (p) => ({ ...p, price: await guidePrice(p.slug, p.price) }))
  );
  const range = await guidePriceRange(picks.map((p) => p.slug));
  const priceRangeText = range
    ? `Van de ${range.min} a ${range.max} USD`
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
        Halloween no necesita un almacén de decoración: necesita luz bien puesta.
        Esta guía reúne 6 piezas que convierten sala, pasillo y mesa de dulces en
        ambiente de fiesta —y que siguen siendo útiles el 1 de noviembre—. Nada
        de plásticos de un solo uso: cada pieza trabaja antes, durante y después
        de la noche.
      </p>

      <h2 className="mt-10 font-serif text-2xl text-brown">
        La regla: ambiente con lo que ya sirve después
      </h2>
      <p className="mt-3 leading-relaxed text-brown-soft">
        La decoración desechable se paga una vez y se tira. La iluminación
        ambiental es distinta: un proyector que hace de galaxia el sábado de
        fiesta es la misma lámpara que acompaña el descanso el resto del año; una
        luz con sensor que asusta en el pasillo sigue encendiéndose sola cada
        noche. Compras una vez, usas dos veces —esa es toda la lógica—.
      </p>

      <h2 className="mt-10 font-serif text-2xl text-brown">
        Los 6 imprescindibles para la noche (y el día siguiente)
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
        Cómo armar el ambiente sin pasarte del presupuesto
      </h2>
      <ul className="mt-3 list-disc space-y-2 pl-5 leading-relaxed text-brown-soft">
        <li>
          <strong className="text-brown">Zona por zona.</strong> Entrada (sensor),
          centro (proyector), mesa de dulces (barra LED). Con 2–3 piezas ya hay
          atmósfera; no necesitas cubrir cada pared.
        </li>
        <li>
          <strong className="text-brown">Agrupa 2 piezas.</strong> El envío es
          gratis desde 2 piezas o desde $49 USD: la pareja proyector + sensor
          cubre fiesta completa con envío incluido.
        </li>
        <li>
          <strong className="text-brown">Piensa en el 1 de noviembre.</strong> Lo
          que compras debe sobrevivir a la fiesta: luces útiles, jabón sin
          contacto y el kit frío para la cara al día siguiente.
        </li>
      </ul>

      <div className="mt-10 rounded-2xl bg-cream-dark p-6 text-center">
        <p className="font-serif text-xl text-brown">
          ¿Listo para la noche más divertida del año?
        </p>
        <p className="mt-2 text-sm text-brown-soft">
          Envío gratis desde 2 piezas o $49 USD · 90 días de garantía · envíos a
          México y Estados Unidos.
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
              ¿Cuánto cuesta armar el ambiente de Halloween con estas piezas?
            </summary>
            <p className="mt-2 text-sm leading-relaxed text-brown-soft">
              {priceRangeText}. Con dos piezas (por ejemplo, proyector + luz con
              sensor) ya tienes entrada y centro de fiesta cubiertos, con envío
              gratis incluido.
            </p>
          </details>
          <details className="rounded-xl border border-gold/15 bg-ivory p-4">
            <summary className="cursor-pointer font-medium text-brown">
              ¿Sirven solo para Halloween?
            </summary>
            <p className="mt-2 text-sm leading-relaxed text-brown-soft">
              No, y ese es el punto: son luces y gadgets de uso diario. La
              decoración desechable se tira el 1 de noviembre; estas piezas
              siguen trabajando en tu casa todo el año.
            </p>
          </details>
          <details className="rounded-xl border border-gold/15 bg-ivory p-4">
            <summary className="cursor-pointer font-medium text-brown">
              ¿Llegan a tiempo para Halloween?
            </summary>
            <p className="mt-2 text-sm leading-relaxed text-brown-soft">
              Sí. Enviamos a México y Estados Unidos con fulfillment automatizado
              y seguimiento. Entre antes ordenes, mejor margen de entrega antes
              del 31 de octubre.
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
            href="/blog/regalos-gadgets-hogar"
            className="mt-2 block font-serif text-xl text-brown transition hover:text-gold-dark"
          >
            Regalos y gadgets prácticos para el hogar en 2026 →
          </Link>
          <p className="mt-1 text-sm text-brown-soft">
            Luces, organizadores y cargadores que resuelven problemas reales en
            casa (el complemento natural de esta guía).
          </p>
        </div>
        <div className="rounded-2xl border border-gold/15 bg-ivory p-6">
          <Link
            href="/blog/regalos-bienestar-2026"
            className="block font-serif text-xl text-brown transition hover:text-gold-dark"
          >
            Regalos de bienestar y autocuidado 2026 →
          </Link>
          <p className="mt-1 text-sm text-brown-soft">
            Para recuperar cara y energía después de la fiesta: rodillo de
            hielo, colágeno y ambiente de descanso.
          </p>
        </div>
        <div className="rounded-2xl border border-gold/15 bg-ivory p-6">
          <Link
            href="/blog/regalos-para-ella-2026"
            className="block font-serif text-xl text-brown transition hover:text-gold-dark"
          >
            Regalos para ella 2026: detalles bonitos que sí va a usar →
          </Link>
          <p className="mt-1 text-sm text-brown-soft">
            Belleza, ambiente y comodidad para novia, amiga o mamá.
          </p>
        </div>
      </section>
    </article>
  );
}
