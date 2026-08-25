import type { Metadata } from "next";
import Link from "next/link";
import { guidePrice, guidePriceRange } from "@/lib/guide-prices";

export const dynamic = "force-static";

const SLUG = "/blog/ofrenda-moderna-dia-de-muertos-2026";
const TITLE =
  "Ofrenda moderna 2026: luz y tecnología para tu altar de Día de Muertos";
const DESCRIPTION =
  "Guía Lumaei de Día de Muertos 2026: imprime las fotos del altar en casa, ilumina la ofrenda con luz cálida segura y resuelve la cocina de temporada. Precios reales y link directo.";

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
      "portable-mini-thermal-label-printer-home-photo-printer-student-wrong-question-pr",
    name: "Impresora térmica portátil (fotos y etiquetas)",
    img: "https://cf.cjdropshipping.com/853ab40a-f0a9-4ac4-9f53-9a6021788e2b.png",
    price: "$31.75 USD",
    pitch:
      "Las fotos del altar, impresas en casa: retratos en blanco y negro con ese aire de foto antiguo que queda perfecto en el nivel superior de la ofrenda —sin correr a imprimir ni comprar marcos—.",
  },
  {
    slug:
      "galaxy-star-projector-starry-sky-night-light-astronaut-lamp-room-decr-gift-child",
    name: "Proyector de estrellas astronauta",
    img: "https://cf.cjdropshipping.com/aed3289e-be07-4bee-be64-b7a7763a6315.jpg",
    price: "$43.68 USD",
    pitch:
      "Un cielo detrás del altar: nebulosa púrpura y estrellas que dan profundidad al fondo de la ofrenda (y después del 2 de noviembre sigue siendo la luz de noche favorita de la casa).",
  },
  {
    slug:
      "rechargeable-led-wireless-kitchen-usb-automatic-closet-light-bar-magnetic-cabine",
    name: "Barra de luz LED recargable (3 tonos)",
    img: "https://cf.cjdropshipping.com/2def7f27-94d7-4ed1-8a24-bab4502728ea.jpg",
    price: "$35.15 USD",
    pitch:
      "Luz cálida donde la vela no alcanza: magnética y sin cables, ilumina cada nivel del altar sin flama cerca del papel picado, las flores secas o las cortinas.",
  },
  {
    slug:
      "auto-led-usb-magnetic-wireless-night-light-corridors-porch-lights-pir-motion-sen",
    name: "Luz LED con sensor de movimiento",
    img: "https://cf.cjdropshipping.com/20200703/1455264561787.jpg",
    price: "$14.74 USD",
    pitch:
      "La bienvenida: en entrada o pasillo se enciende sola cuando alguien pasa —ideal para las visitas que llegan de noche a dejar su flor— y luego queda como luz práctica todo el año.",
  },
  {
    slug:
      "tenta-kitchen-485ml-manual-food-chopper-meat-grinder-vegetable-slicer-shredder-g",
    name: "Picadora manual de cocina 485ml",
    img: "https://cf.cjdropshipping.com/15217632/1443265897390.jpg",
    price: "$44.54 USD",
    pitch:
      "La cocina de temporada sin lágrimas ni procesadora gigante: mole, adobo y pico de gallo para la reunión salen en minutos —chile, cebolla y jitomate picados en segundos—.",
  },
  {
    slug:
      "kitchen-double-tier-spice-rack-multifunctional-rotating-storage-rack-spice-organ",
    name: "Organizador giratorio de dos niveles para especias",
    img: "https://cf.cjdropshipping.com/f11e0c16-4232-4a98-943c-bfb07031fd99.jpg",
    price: "$33.23 USD",
    pitch:
      "El rincón del mole en orden: canela, clavo, comino y orégano siempre visibles y a un giro de distancia cuando cocinas para toda la familia.",
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

export default function OfrendaModerna() {
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
    ? `Van de ${range.min} a ${range.max}`
    : "Van de $14.74 a $44.54 USD";

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
        La ofrenda de hoy no compite con la tradición: la hace más tuya. Flores,
        pan y sal siguen siendo el corazón del altar; lo que cambia es que ahora
        puedes imprimir las fotos en casa esa misma tarde, iluminar cada nivel
        sin riesgo y resolver la cocina grande sin morir picando cebolla. Estas
        6 piezas arman una ofrenda moderna —y todas siguen siendo útiles el 3
        de noviembre.
      </p>

      <h2 className="mt-10 font-serif text-2xl text-brown">
        La regla: honrar la tradición con piezas que siguen sirviendo
      </h2>
      <p className="mt-3 leading-relaxed text-brown-soft">
        Una ofrenda moderna no es una ofrenda con pantallas: es una ofrenda
        mejor resuelta. Las fotos del altar impresas en blanco y negro desde tu
        mesa, luz cálida que abraza sin flama junto al papel picado, un fondo
        estrellado que le da profundidad a los recuerdos. Y cuando termina la
        celebración, nada se va al cajón de la decoración: cada pieza vuelve a
        su trabajo diario en la cocina, el pasillo o el cuarto.
      </p>

      <h2 className="mt-10 font-serif text-2xl text-brown">
        Las 6 piezas de la ofrenda moderna
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
        Cómo armarla sin pasarte del presupuesto
      </h2>
      <ul className="mt-3 list-disc space-y-2 pl-5 leading-relaxed text-brown-soft">
        <li>
          <strong className="text-brown">Zona por zona.</strong> Altar
          (impresora + barra LED + proyector), recibimiento (luz con sensor),
          cocina (picadora + especias). Con 2–3 piezas ya se siente la
          diferencia.
        </li>
        <li>
          <strong className="text-brown">Agrupa 2 piezas.</strong> El envío es
          gratis desde 2 piezas o desde $49 USD: impresora + barra LED cubren
          altar completo con envío incluido.
        </li>
        <li>
          <strong className="text-brown">Piensa en el 3 de noviembre.</strong>
          Todo lo de esta guía trabaja después de la celebración: fotos y
          etiquetas todo el año, luces de uso diario, cocina ágil entre
          semana.
        </li>
      </ul>

      <div className="mt-10 rounded-2xl bg-cream-dark p-6 text-center">
        <p className="font-serif text-xl text-brown">
          ¿Ya piensas en tu ofrenda de este año?
        </p>
        <p className="mt-2 text-sm text-brown-soft">
          Envío gratis desde 2 piezas o $49 USD · 90 días de garantía · envíos
          a México y Estados Unidos.
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
              ¿Cuánto cuesta armar una ofrenda moderna?
            </summary>
            <p className="mt-2 text-sm leading-relaxed text-brown-soft">
              {priceRangeText}. Con dos piezas (impresora + barra LED, por
              ejemplo) tienes fotos y luz de altar resueltas, con envío gratis
              incluido.
            </p>
          </details>
          <details className="rounded-xl border border-gold/15 bg-ivory p-4">
            <summary className="cursor-pointer font-medium text-brown">
              ¿La tecnología le quita tradición a la ofrenda?
            </summary>
            <p className="mt-2 text-sm leading-relaxed text-brown-soft">
              Al contrario: la sirve. Lo esencial —flores de cempasúchil, pan,
              sal, agua y las fotos de quienes recordamos— no cambia. Solo se
              vuelve más fácil de armar y más seguro de encender.
            </p>
          </details>
          <details className="rounded-xl border border-gold/15 bg-ivory p-4">
            <summary className="cursor-pointer font-medium text-brown">
              ¿Conviene esperar al Buen Fin para comprar?
            </summary>
            <p className="mt-2 text-sm leading-relaxed text-brown-soft">
              El Buen Fin 2026 corre del 13 al 17 de noviembre —después del Día
              de Muertos—, así que esperar significa quedarte sin altar este
              año. En Lumaei los precios son estables todo el año y el código
              LUMAI10 te da 10% desde hoy.
            </p>
          </details>
          <details className="rounded-xl border border-gold/15 bg-ivory p-4">
            <summary className="cursor-pointer font-medium text-brown">
              ¿Llegan a tiempo para el 1 de noviembre?
            </summary>
            <p className="mt-2 text-sm leading-relaxed text-brown-soft">
              Sí. Enviamos a México y Estados Unidos con fulfillment
              automatizado y seguimiento. Entre antes ordenes, mejor margen de
              entrega antes de la celebración.
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

      <section className="mt-12 space-y-4">
        <div className="rounded-2xl border border-gold/15 bg-ivory p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-dark">
            Lee también
          </p>
          <Link
            href="/blog/regalos-bienestar-2026"
            className="mt-2 block font-serif text-xl text-brown transition hover:text-gold-dark"
          >
            Regalos de bienestar y autocuidado 2026 →
          </Link>
          <p className="mt-1 text-sm text-brown-soft">
            Para recuperar cuerpo y energía después de las velaciones: rodillo
            de hielo, colágeno y descanso.
          </p>
        </div>
        <div className="rounded-2xl border border-gold/15 bg-ivory p-6">
          <Link
            href="/blog/halloween-ambiente-2026"
            className="block font-serif text-xl text-brown transition hover:text-gold-dark"
          >
            Halloween 2026: iluminación y ambiente para tu casa →
          </Link>
          <p className="mt-1 text-sm text-brown-soft">
            La fiesta previa: proyector, barras LED y luces con sensor que
            sirven también para tu ofrenda.
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
            Luces, organizadores y cargadores que resuelven problemas reales
            todo el año.
          </p>
        </div>
      </section>
    </article>
  );
}
