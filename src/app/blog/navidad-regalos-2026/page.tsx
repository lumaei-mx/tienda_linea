import type { Metadata } from "next";
import Link from "next/link";
import { guidePrice, guidePriceRange } from "@/lib/guide-prices";

export const dynamic = "force-static";

const SLUG = "/blog/navidad-regalos-2026";
const TITLE =
  "Regalos de Navidad 2026: presentes prácticos que se usan todo el año";
const DESCRIPTION =
  "Guía Lumaei de Navidad 2026: regalos para quien ama su gato, para ella, para él y para la casa —piezas que se usan en enero y no terminan en el cajón—. Precios reales y link directo.";

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
      "whale-cat-steam-brush-3-in-1-steamy-cat-brush-rechargeable-steamy-pet-brush-self",
    name: "Cepillo de vapor 3 en 1 para gato (recargable)",
    img: "https://cf.cjdropshipping.com/c67dc541-4084-46e6-b1e9-9ab0c3a1b627.jpg",
    price: "$23.53 USD",
    pitch:
      "Para quien ama a su gato: cepilla, aplica vapor suave y se limpia solo con un clic. Quita el pelo muerto antes de que termine en el sofá —y el michi lo recibe como masaje—.",
  },
  {
    slug:
      "silicone-ice-face-roller-contour-shrink-pores-remove-dark-circles-massage-skin-b",
    name: "Rodillo de hielo facial de silicón",
    img: "https://cf.cjdropshipping.com/quick/product/bab01418-9540-4b61-bfc9-0b4fea3f1393.jpg",
    price: "$19.71 USD",
    pitch:
      "Para ella (o para ti): la cara despierta sin hinchazón después de las cenas y posadas de diciembre. Se llena con agua, se congela y dura toda la temporada de fiestas.",
  },
  {
    slug:
      "magnetic-bendable-car-mobile-phone-holder-wireless-charger-phone-holder-15w-car-",
    name: "Cargador inalámbrico magnético de auto 15W",
    img: "https://cf.cjdropshipping.com/c6dd15cd-332f-412d-b04f-3fb361d54afb_trans.jpeg",
    price: "$43.08 USD",
    pitch:
      "Para él o la persona que vive en la carretera: los viajes decembrinos con GPS puesto y el teléfono cargando, sin cables enredados en la palanca.",
  },
  {
    slug:
      "galaxy-star-projector-starry-sky-night-light-astronaut-lamp-room-decr-gift-child",
    name: "Proyector de estrellas astronauta",
    img: "https://cf.cjdropshipping.com/aed3289e-be07-4bee-be64-b7a7763a6315.jpg",
    price: "$41.78 USD",
    pitch:
      "Para la casa (y los niños): un cielo de invierno en el techo toda la nochebuena. En enero sigue siendo la luz de noche favorita —regalo que no se guarda, se usa.",
  },
  {
    slug:
      "rechargeable-led-wireless-kitchen-usb-automatic-closet-light-bar-magnetic-cabine",
    name: "Barra de luz LED recargable (3 tonos)",
    img: "https://cf.cjdropshipping.com/2def7f27-94d7-4ed1-8a24-bab4502728ea.jpg",
    price: "$26.81 USD",
    pitch:
      "Para quien cocina las cenas: luz cálida donde no hay contacto, magnética y sin cables —clóset, alacena o el mostrador donde se arma la cena de Nochebuena—.",
  },
  {
    slug:
      "auto-led-usb-magnetic-wireless-night-light-corridors-porch-lights-pir-motion-sen",
    name: "Luz LED con sensor de movimiento",
    img: "https://cf.cjdropshipping.com/20200703/1455264561787.jpg",
    price: "$25.61 USD",
    pitch:
      "Para la llegada de las visitas: se enciende sola cuando alguien pasa por entrada o pasillo. Las fiestas terminan y queda como luz práctica de toda la casa.",
  },
  {
    slug:
      "portable-mini-thermal-label-printer-home-photo-printer-student-wrong-question-pr",
    name: "Impresora térmica portátil (fotos y etiquetas)",
    img: "https://cf.cjdropshipping.com/853ab40a-f0a9-4ac4-9f53-9a6021788e2b.png",
    price: "$21.63 USD",
    pitch:
      "Para quien guarda recuerdos: etiquetas de regalo hechas en casa esa tarde, y después fotos del intercambio impresas al momento. Sin tinta, sin correr a la papelería.",
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
  datePublished: "2026-08-25",
  dateModified: "2026-08-25",
};

export default function NavidadRegalos() {
  return <GuideBody />;
}

async function GuideBody() {
  const resolved = await Promise.all(
    picks.map(async (p) => ({ ...p, price: await guidePrice(p.slug, p.price) }))
  );
  const range = await guidePriceRange(picks.map((p) => p.slug));
  const priceRangeText = range
    ? `Van de ${range.min} a ${range.max}`
    : "Van de $19.71 a $43.08 USD";

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
        El mejor regalo de Navidad no es el que más brilla bajo el árbol: es el
        que en marzo sigue trabajando. Estas 7 piezas cubren a toda la lista —
        la persona con gato, ella, él, la casa y quien colecciona recuerdos —
        con precios accesibles y ninguna decoración desechable.
      </p>

      <h2 className="mt-10 font-serif text-2xl text-brown">
        La regla: regalar uso, no decoración
      </h2>
      <p className="mt-3 leading-relaxed text-brown-soft">
        Cada diciembre termina igual: adornos guardados en cajas y gadgets que
        nadie volvió a encender. Esta guía va al revés. Todas las piezas resuelven
        algo de todos los días —el pelo del gato en el sofá, la cara hinchada al
        despertar, el pasillo a oscuras, el teléfono sin batería en la carretera —
        así que el regalo se agradece cada semana del año, no solo la nochebuena.
      </p>

      <h2 className="mt-10 font-serif text-2xl text-brown">
        Los 7 regalos de Navidad 2026
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
        Cómo repartir la lista sin romper el presupuesto
      </h2>
      <ul className="mt-3 list-disc space-y-2 pl-5 leading-relaxed text-brown-soft">
        <li>
          <strong className="text-brown">Un destinatario, una pieza.</strong>{" "}
          Gato-lover: cepillo de vapor. Ella: rodillo de hielo. Él: cargador de
          auto. La casa: proyector o barra LED. Quien documenta todo:
          impresora térmica.
        </li>
        <li>
          <strong className="text-brown">Agrupa 2 piezas.</strong> El envío es
          gratis desde 2 piezas o desde $49 USD: rodillo + parches, o barra LED +
          luz con sensor, ya viajan sin costo extra.
        </li>
        <li>
          <strong className="text-brown">Regala temprano.</strong> Entre antes
          ordenes, más margen hay para que todo llegue antes del 24 —y tú
          disfrutas las fiestas sin correos de última hora.
        </li>
      </ul>

      <div className="mt-10 rounded-2xl bg-cream-dark p-6 text-center">
        <p className="font-serif text-xl text-brown">
          ¿Ya tienes tu lista de Navidad?
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
              ¿Cuánto cuesta un buen regalo de Navidad aquí?
            </summary>
            <p className="mt-2 text-sm leading-relaxed text-brown-soft">
              {priceRangeText}. Un solo detalle bien elegido —con envío gratis
              al juntar 2 piezas o $49 USD— resuelve a alguien de tu lista.
            </p>
          </details>
          <details className="rounded-xl border border-gold/15 bg-ivory p-4">
            <summary className="cursor-pointer font-medium text-brown">
              ¿Llegan a tiempo para el 24 de diciembre?
            </summary>
            <p className="mt-2 text-sm leading-relaxed text-brown-soft">
              Enviamos a México y Estados Unidos con fulfillment automatizado y
              seguimiento. Cuanto antes ordenes, más margen de entrega tienes
              antes de Nochebuena: empieza tu compra en octubre o noviembre.
            </p>
          </details>
          <details className="rounded-xl border border-gold/15 bg-ivory p-4">
            <summary className="cursor-pointer font-medium text-brown">
              ¿Tienen descuentos navideños?
            </summary>
            <p className="mt-2 text-sm leading-relaxed text-brown-soft">
              Nuestros precios son estables todo el año —sin inflar para luego
              «descontar»— y el código LUMAI10 te da 10% desde hoy, sin
              esperar a diciembre.
            </p>
          </details>
          <details className="rounded-xl border border-gold/15 bg-ivory p-4">
            <summary className="cursor-pointer font-medium text-brown">
              ¿Qué le regalo a alguien que ya tiene de todo?
            </summary>
            <p className="mt-2 text-sm leading-relaxed text-brown-soft">
              Algo que use a diario sin pensarlo: la luz con sensor del pasillo,
              la impresora de fotos instantáneas o el cepillo para su gato.
              Los regalos útiles son los que nunca se olvidan.
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
            href="/blog/regalos-para-el-2026"
            className="block font-serif text-xl text-brown transition hover:text-gold-dark"
          >
            Regalos para él 2026: gadgets útiles que sí va a usar →
          </Link>
          <p className="mt-1 text-sm text-brown-soft">
            Cargador de auto, impresora térmica, picadora y más para novio,
            papá o amigo.
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
