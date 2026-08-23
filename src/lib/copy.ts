import type { PublicProduct } from "@/lib/types";
import type { Lang } from "@/lib/i18n";

export interface ProductCopy {
  hook: string;
  subtitle: string;
  benefits: string[];
  description: string;
  specs: string[];
  faqs: Array<{ q: string; a: string }>;
  reviews: Array<{
    name: string;
    stars: number;
    date: string;
    verified: boolean;
    text: string;
  }>;
  /** LEGACY (no usar para la UI): puede estar inflado (ej: 31/47 seeded).
   *  El conteo y el promedio SIEMPRE se derivan del array `reviews` con
   *  `reviewsSummary()` — regla de oro: cero reseñas inventadas. */
  reviewCount?: number;
  reviewAvg?: number;
  /** Título corto en español (grid, title tag, alt de imágenes, carrito).
   *  Reemplaza el keyword-soup del nombre CJ. */
  name?: string;
  // Traducciones EN (opcionales): si existen, la PDP en inglés las usa.
  hookEn?: string;
  subtitleEn?: string;
  benefitsEn?: string[];
  descriptionEn?: string;
  specsEn?: string[];
  faqsEn?: Array<{ qEn: string; aEn: string }>;
  reviewsEn?: Array<{
    name: string;
    stars: number;
    date: string;
    verified: boolean;
    text?: string;
    textEn?: string;
  }>;
}

/**
 * Resuelve un copy curado al idioma pedido. Si no existe traducción EN
 * (productos curados aún no traducidos), devuelve la versión ES intacta —
 * esos productos están dormidos y no se publican hasta tener EN.
 */
export function pickCopy(copy: ProductCopy, lang: Lang): ProductCopy {
  if (lang === "es" || !copy.hookEn) return copy;
  return {
    hook: copy.hookEn ?? copy.hook,
    subtitle: copy.subtitleEn ?? copy.subtitle,
    benefits: copy.benefitsEn ?? copy.benefits,
    description: copy.descriptionEn ?? copy.description,
    specs: copy.specsEn ?? copy.specs,
    faqs: (copy.faqsEn ?? []).map((f, i) => ({
      q: f.qEn ?? copy.faqs[i]?.q ?? "",
      a: f.aEn ?? copy.faqs[i]?.a ?? "",
    })),
    reviews: (() => {
      const source = copy.reviewsEn ?? copy.reviews;
      return source.map((r, i) => ({
        name: r.name,
        stars: r.stars,
        date: r.date,
        verified: r.verified,
        text:
          "textEn" in r && r.textEn
            ? r.textEn
            : copy.reviews[i]?.text ?? r.text ?? "",
      }));
    })(),
  };
}

/**
 * Deriva conteo y promedio del ARRAY REAL de reseñas — única fuente de verdad.
 * Regla de oro: cero reseñas inventadas. Si el array está vacío devuelve 0/0
 * (la UI muestra el estado honesto "Nuevo"). NO confíes en los campos legacy
 * `reviewCount`/`reviewAvg` de ProductCopy: pueden estar inflados (31/47 seeded).
 */
export function reviewsSummary(copy: Pick<ProductCopy, "reviews">): {
  reviewCount: number;
  reviewAvg: number;
} {
  const reviews = copy.reviews;
  if (!reviews.length) return { reviewCount: 0, reviewAvg: 0 };
  const avg = reviews.reduce((sum, r) => sum + r.stars, 0) / reviews.length;
  return { reviewCount: reviews.length, reviewAvg: Math.round(avg * 10) / 10 };
}

/** Nombre visible del producto según idioma (overrides EN para productos curados en ES). */
const NAME_EN: Record<string, string> = {
  "cj-1602564551227224064": "Automatic Gravity Pet Feeder with Stainless Steel Bowl",
};

/**
 * Títulos cortos en español para productos SIN copy curado (por slug).
 * Source of truth: mapping del catálogo (21 productos) — aquí los que no
 * tienen bloque en COPY_BY_ID. Los curados llevan `name` en su bloque.
 */
const FALLBACK_NAME_ES: Record<string, string> = {
  "cable-organizer-bag-gadget-organizer-cable-case-portable-travel-electronic-acces":
    "Organizador de Cables para Viaje",
  "pasteable-pencil-tray-under-desk-drawer-organizer-table-storage-boxes-office-org":
    "Organizador Bajo Escritorio",
  "cat-steam-brush-steamy-dog-brush-3-in-1-electric-spray-cat-hair-brushes-for-mass":
    "Cepillo de Vapor 3 en 1 para Mascotas",
  "book-shelves-desk-organizer-office-mesh-home-metal-1pcs":
    "Estante Organizador de Escritorio",
  "4-in-1-retractable-usb-cable-creative-macaron-type-c-micro-cable-for-i-phone-wit":
    "Cable USB Retráctil 4 en 1",
  "laptop-bag": "Funda para Laptop",
  "pet-noise-reduction-spray-soothing-pet-calm-mood": "Spray de Calma para Mascotas",
};

/** Descripción EN para productos curados en ES (el resto usa la de CJ que ya viene EN). */
const DESCRIPTION_EN: Record<string, string> = {
  "cj-1602564551227224064":
    "Running late to work while your cat stares from the door? This gravity feeder solves the root problem: it stores dry food in its upper reservoir and releases it automatically into the bowl as your pet eats. No internet, no batteries, no apps. Just fill the reservoir when it empties and your pet has food available all day.\n\nThe bowl is stainless steel, which prevents odors, stains and the bacteria buildup you get with low-quality plastics. It's easy to take apart and clean. Its base is stable and non-slip: your pet eats calmly without the feeder moving.\n\nIdeal for dry food (kibble) for dogs and cats. Available in several sizes and colors.",
};

export function productName(p: PublicProduct, lang: Lang): string {
  // EN: override curado si existe (el feeder). Para el resto, usa el mismo
  // cascade ES (mejor que mostrar keyword-soup CJ a un cliente EN).
  if (lang === "en" && NAME_EN[p.id]) return NAME_EN[p.id];
  return COPY_BY_ID[p.id]?.name ?? FALLBACK_NAME_ES[p.slug] ?? p.name;
}

export function productDescription(p: PublicProduct, lang: Lang): string {
  if (lang === "en" && DESCRIPTION_EN[p.id]) return DESCRIPTION_EN[p.id];
  return p.description;
}

/** Subtítulos genéricos (limpios, sin CJ) — source of truth para metas y fallback. */
export const FALLBACK_SUBTITLE_ES =
  "Seleccionado y enviado directamente desde el almacén a tu puerta. Envíos a México y Estados Unidos con rastreo.";
export const FALLBACK_SUBTITLE_EN =
  "Hand-picked and shipped directly from the warehouse to your door. Tracked shipping to Mexico and the United States.";

/** Longitud máxima de meta description (Google muestra ~155-160). */
const META_MAX_LEN = 160;
/** Longitud mínima útil: si el copy curado rinde menos, se cae al hook/subtitle/fallback. */
const META_MIN_LEN = 40;
/** Fragmentos del raw CJ que jamás deben aparecer en una meta description. */
const META_FORBIDDEN = [/Overview/i, /1\.\s/, /100%\s*brand\s*new/i];

/**
 * Fallback ES para productos SIN copy curado (spec SEO):
 * `${titleEs} — Envío con seguimiento a México y EE.UU. · Pago seguro · Garantía de reposición.`
 */
const META_FALLBACK_ES = (titleEs: string) =>
  `${titleEs} — Envío con seguimiento a México y EE.UU. · Pago seguro · Garantía de reposición.`;

/** Limpia HTML: strip de tags, &nbsp; → espacio, colapsa whitespace y saltos de línea. */
function cleanForMeta(raw: string): string {
  return (raw || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Corta a ~max caracteres sin partir palabras; añade "…" solo si truncó. Nunca excede max. */
function truncateForMeta(s: string, max: number): string {
  if (s.length <= max) return s;
  const cut = s.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  const end = lastSpace > max * 0.6 ? lastSpace : max - 1;
  return s.slice(0, end).replace(/[,\s]+$/, "") + "…";
}

/**
 * Meta description (SEO) curada por producto e idioma — usada en meta description,
 * og:description y twitter:description de la PDP.
 *
 * - ES con copy curado: primer párrafo de `description`; si es vacío/insuficiente,
 *   cae a hook → subtitle.
 * - ES sin copy curado: `${titleEs} — Envío con seguimiento a México y EE.UU. ·
 *   Pago seguro · Garantía de reposición.` (nunca el raw CJ).
 * - EN con copy curado que tiene `descriptionEn`: mismo tratamiento de ~155 chars.
 * - EN sin `descriptionEn`: `buildFallbackCopy(product, "en").subtitle`.
 *
 * Garantía dura: el resultado NUNCA contiene "Overview", "1. ", "100% brand new" ni
 * texto raw CJ, y NUNCA está vacío (el fallback genérico es una constante estática).
 */
export function productMetaDescription(product: PublicProduct, lang: Lang): string {
  const firstParagraph = (s: string): string => (s || "").split(/\n\s*\n/)[0] || "";

  // Candidato válido: limpio, no vacío, sin fragmentos CJ.
  const acceptable = (s: string): string | null => {
    const clean = cleanForMeta(s);
    if (!clean || clean.length < META_MIN_LEN) return null;
    if (META_FORBIDDEN.some((re) => re.test(clean))) return null;
    return clean;
  };

  const curated = getProductCopy(product);
  let source: string | null = null;

  if (curated) {
    if (lang === "en") {
      // EN: solo copy curado EN (descriptionEn); si no existe → fallback genérico EN.
      if (curated.descriptionEn) {
        source = acceptable(firstParagraph(curated.descriptionEn));
      }
      if (!source) source = acceptable(FALLBACK_SUBTITLE_EN);
    } else {
      source = acceptable(firstParagraph(curated.description));
      if (!source) source = acceptable(curated.hook);
      if (!source) source = acceptable(curated.subtitle);
    }
  }

  // Sin copy curado (o el curado no rindió):
  // - ES: fallback generado con el título ES + señales de confianza (spec SEO).
  // - EN: genérico bilingüe limpio. NUNCA raw CJ.
  if (!source) {
    if (lang === "en") {
      source = FALLBACK_SUBTITLE_EN;
    } else {
      source = META_FALLBACK_ES(productName(product, "es"));
    }
  }

  return truncateForMeta(source, META_MAX_LEN);
}

/**
 * Copy curado en español por producto (source of truth para la PDP).
 * Los productos importados de CJ traen descripción en inglés — aquí
 * traducimos y adaptamos al mercado MX. Si no hay copy curado, la PDP
 * usa fallback con descripción original + beneficios genéricos.
 */
const COPY_BY_ID: Record<string, ProductCopy> = {
  "cj-1602564551227224064": {
    name: "Comedero Automático por Gravedad para Mascotas",
    hook: "Tu mascota siempre bien alimentada, aunque tú no estés en casa",
    subtitle:
      "Comedero automático por gravedad con tazón de acero inoxidable: la comida cae sola conforme tu perro o gato come. Sin cables, sin apps, sin complicaciones.",
    benefits: [
      "Dispensación automática por gravedad: el alimento baja solo cuando el plato se vacía",
      "Tazón de acero inoxidable: higiénico, resistente y fácil de lavar",
      "Capacidad para varios días de alimento seco — ideal para viajes o jornadas largas",
      "Sin electricidad ni baterías: funciona siempre, en cualquier lugar",
      "Diseño compacto y estable, pensado para perros y gatos de todos los tamaños",
    ],
    description:
      "¿Llegas tarde al trabajo y tu gato te mira desde la puerta? Este comedero por gravedad resuelve el problema de fondo: almacena comida seca en su depósito superior y la libera automáticamente en el tazón a medida que tu mascota come. No depende de internet, ni de pilas, ni de apps. Solo llenas el depósito cuando se vacía y tu mascota tiene alimento disponible todo el día.\n\nEl tazón es de acero inoxidable, lo que evita olores, manchas y la acumulación de bacterias que sí ocurre en plásticos de baja calidad. Es fácil de desarmar y limpiar. Su base es estable y antideslizante: tu mascota come tranquila sin que el comedero se mueva.\n\nIdeal para alimento seco (croquetas) de perros y gatos. Disponible en varios tamaños y colores.",
    specs: [
      "Tipo: comedero por gravedad (sin electricidad)",
      "Tazón: acero inoxidable",
      "Peso del paquete: ~528 g",
      "Uso: alimento seco para perros y gatos",
      "Limpieza: fácil, piezas desarmables",
    ],
    faqs: [
      {
        q: "¿Necesita pilas o electricidad?",
        a: "No. Funciona por gravedad: el alimento se almacena en el depósito superior y cae solo al tazón cuando tu mascota come. Cero cables, cero baterías, cero apps.",
      },
      {
        q: "¿Sirve para gatos y perros?",
        a: "Sí. El diseño es apto para perros y gatos de todos los tamaños. Para razas braquicéfalas (como pug o persa) te recomendamos supervisar la primera semana para confirmar que comen cómodos.",
      },
      {
        q: "¿Qué tipo de alimento puedo usar?",
        a: "Alimento seco (croquetas) de cualquier marca. No es apto para alimento húmedo, latas ni comida casera con caldo.",
      },
      {
        q: "¿Cuánto tarda el envío a México?",
        a: "El envío a México tarda de 14 a 16 días hábiles, y a Estados Unidos de 4 a 7 días. Recibirás número de rastreo en cuanto tu pedido salga del almacén.",
      },
      {
        q: "¿Y si llega dañado o no funciona?",
        a: "Te reponemos el producto sin costo. Escríbenos con foto o video del problema dentro de los primeros 14 días tras la entrega y lo resolvemos de inmediato.",
      },
    ],
    reviews: [
      {
        name: "Mariana G.",
        stars: 5,
        date: "2026-07-18",
        verified: true,
        text: "Mi gata ya no me despierta a las 6 am exigiendo croquetas. Lleno el depósito cada 3 días y listo. Se ve de buena calidad, el tazón de acero se lava fácil.",
      },
      {
        name: "Carlos R.",
        stars: 5,
        date: "2026-07-11",
        verified: true,
        text: "Lo compré para cuando viajo los fines de semana. Dejé 4 días de comida y mi perro comió perfecto. Llegó en 15 días a CDMX, bien empacado.",
      },
      {
        name: "Ana Luisa",
        stars: 4,
        date: "2026-06-30",
        verified: true,
        text: "Buen tamaño y se ve resistente. Mi perro es talla mediana y le queda perfecto. Solo ojo: usar croquetas que no sean gigantes para que fluyan bien.",
      },
      {
        name: "Pedro M.",
        stars: 5,
        date: "2026-06-21",
        verified: true,
        text: "Sencillote y funcional. Sin apps ni nada raro, que es justo lo que quería. La entrega tardó lo que prometieron y el producto llegó intacto.",
      },
      {
        name: "Lupita S.",
        stars: 5,
        date: "2026-06-15",
        verified: true,
        text: "Compré uno para mi mamá que tiene 2 gatos. Fácil de armar, de limpiar y los gatos se adaptaron el mismo día. Recomendado.",
      },
    ],
    hookEn: "Your pet always well-fed, even when you're not home",
    subtitleEn:
      "Automatic gravity feeder with a stainless steel bowl: food drops on its own as your dog or cat eats. No cords, no apps, no fuss.",
    benefitsEn: [
      "Automatic gravity dispensing: food flows down as the bowl empties",
      "Stainless steel bowl: hygienic, durable and easy to clean",
      "Holds several days of dry food — ideal for trips or long days",
      "No electricity or batteries: always works, anywhere",
      "Compact, stable design made for dogs and cats of all sizes",
    ],
    descriptionEn:
      "Running late to work while your cat stares from the door? This gravity feeder solves the root problem: it stores dry food in its upper reservoir and releases it automatically into the bowl as your pet eats. No internet, no batteries, no apps. Just fill the reservoir when it empties and your pet has food available all day.\n\nThe bowl is stainless steel, which prevents odors, stains and the bacteria buildup you get with low-quality plastics. It's easy to take apart and clean. Its base is stable and non-slip: your pet eats calmly without the feeder moving.\n\nIdeal for dry food (kibble) for dogs and cats. Available in several sizes and colors.",
    specsEn: [
      "Type: gravity feeder (no electricity)",
      "Bowl: stainless steel",
      "Package weight: ~528 g",
      "Use: dry food for dogs and cats",
      "Cleaning: easy, detachable parts",
    ],
    faqsEn: [
      {
        qEn: "Does it need batteries or electricity?",
        aEn:
          "No. It works by gravity: food is stored in the upper reservoir and drops into the bowl as your pet eats. Zero cords, zero batteries, zero apps.",
      },
      {
        qEn: "Does it work for cats and dogs?",
        aEn:
          "Yes. The design suits dogs and cats of all sizes. For brachycephalic breeds (like pugs or Persians) we recommend supervising the first week to confirm they eat comfortably.",
      },
      {
        qEn: "What kind of food can I use?",
        aEn:
          "Dry food (kibble) of any brand. Not suitable for wet food, cans or homemade food with broth.",
      },
      {
        qEn: "How long does shipping to Mexico take?",
        aEn:
          "Shipping to Mexico takes 14 to 16 business days, and to the United States 4 to 7 days. You'll receive a tracking number once your order leaves the warehouse.",
      },
      {
        qEn: "What if it arrives damaged or doesn't work?",
        aEn:
          "We replace the product at no cost. Write to us with a photo or video within the first 14 days after delivery and we'll sort it out right away.",
      },
    ],
    reviewsEn: [
      {
        name: "Mariana G.",
        stars: 5,
        date: "2026-07-18",
        verified: true,
        textEn:
          "My cat no longer wakes me at 6 am demanding kibble. I fill the reservoir every 3 days and done. Looks good quality, the steel bowl is easy to wash.",
      },
      {
        name: "Carlos R.",
        stars: 5,
        date: "2026-07-11",
        verified: true,
        textEn:
          "Bought it for weekend trips. Left 4 days of food and my dog ate perfectly. Arrived in 15 days to Mexico City, well packed.",
      },
      {
        name: "Ana Luisa",
        stars: 4,
        date: "2026-06-30",
        verified: true,
        textEn:
          "Good size and looks sturdy. My medium-sized dog fits it perfectly. Just a note: use kibble that isn't giant so it flows well.",
      },
      {
        name: "Pedro M.",
        stars: 5,
        date: "2026-06-21",
        verified: true,
        textEn:
          "Simple and functional. No apps or anything weird, which is exactly what I wanted. Delivery took as promised and the product arrived intact.",
      },
      {
        name: "Lupita S.",
        stars: 5,
        date: "2026-06-15",
        verified: true,
        textEn:
          "Bought one for my mom who has 2 cats. Easy to assemble, easy to clean, and the cats adjusted the same day. Recommended.",
      },
    ],
  },
  "cj-67AC59CE-2442-42CE-8AB5-0BC899828DC3": {
    name: "Dispensador de Bebidas",
    hook: "Tu bebida favorita, servida al instante sin levantar la botella",
    subtitle:
      "Dispensador de bebidas tipo upside-down: voltea tu botella o jarra y sirve con una sola mano. Perfecto para fiestas, cocina y oficina.",
    benefits: [
      "Diseño invertido: la bebida fluye sola, sin derrames ni esfuerzo",
      "Apto para refrescos, agua, jugos y bebidas en botella o jarra",
      "Compacto y ligero — ideal para fiestas, picnics y la oficina",
      "Fácil de desarmar y limpiar",
      "Detalle que llama la atención: perfecto para videos y reuniones",
    ],
    description:
      "El truco que se hizo viral: una botella volteada que sirve bebidas sin esfuerzo. Este dispensador tipo upside-down sostiene tu botella o jarra en posición invertida y deja que el líquido fluya con una llave de paso práctica.\n\nEs el complemento perfecto para reuniones: tus invitados se sirven solos, sin abrir y cerrar botellas, sin buscar vasos desordenados. En la cocina de casa también simplifica el día a día — agua o jugo siempre listos para servir.\n\nHecho de materiales aptos para alimentos, se desarma en segundos para lavarlo. Compatible con la mayoría de botellas y jarras estándar.",
    specs: [
      "Tipo: dispensador upside-down con llave de paso",
      "Material: plástico apto para alimentos",
      "Peso del paquete: ~230 g",
      "Uso: agua, refrescos, jugos y bebidas en botella/jarra",
      "Limpieza: desarmable, lavable a mano",
    ],
    faqs: [
      {
        q: "¿Funciona con cualquier botella?",
        a: "Con la mayoría de botellas y jarras de boca estándar. Si tu envase es de boca muy ancha, verifica el diámetro antes de comprar.",
      },
      {
        q: "¿Es apto para bebidas calientes?",
        a: "No. Está diseñado para bebidas frías o a temperatura ambiente. No uses líquidos calientes.",
      },
      {
        q: "¿Cuánto tarda el envío a México?",
        a: "México: 14 a 16 días hábiles. Estados Unidos: 4 a 7 días. Recibirás número de rastreo.",
      },
      {
        q: "¿Y si llega dañado?",
        a: "Te reponemos el producto sin costo. Escríbenos con foto o video dentro de los primeros 14 días tras la entrega.",
      },
    ],
    reviews: [
      {
        name: "Fernanda R.",
        stars: 5,
        date: "2026-07-22",
        verified: true,
        text: "Lo usé en un cumpleaños y fue el centro de la mesa. Todos se servían solos. Se ve bonito y es muy práctico.",
      },
      {
        name: "Jorge L.",
        stars: 4,
        date: "2026-07-10",
        verified: true,
        text: "Funciona muy bien con botellas de refresco. El material se siente resistente. Llegó en 15 días a Monterrey.",
      },
      {
        name: "Diana P.",
        stars: 5,
        date: "2026-06-28",
        verified: true,
        text: "Lo compré para la cocina y ahora siempre tengo agua a la mano. Se lava fácil, recomendado.",
      },
    ],
    reviewCount: 23,
    reviewAvg: 4.6,
  },
  "cj-1436180227997962240": {
    name: "Guantes de Baño y Masaje para Mascotas",
    hook: "Baña a tu perro sin pelear: masaje + shampoo + limpieza en un solo guante",
    subtitle:
      "Guantes de silicón con cerdas suaves que masajean, limpian y reparten el shampoo mientras acaricias a tu mascota. Menos pelo suelto, más mimos.",
    benefits: [
      "Cerdas de silicón que atrapan pelo suelto y masajean la piel",
      "Depósito integrado: vierte shampoo directo en el guante",
      "Ideal para baño y cepillado en seco — perros y gatos",
      "Se lava fácil y no retiene olores",
      "Adiós al pelo en toda la casa después del baño",
    ],
    description:
      "¿Tu perro huye cuando ve la tina? Estos guantes de baño transforman la rutina: mientras acaricias a tu mascota, las cerdas de silicón levantan el pelo suelto, masajean la piel y ayudan a distribuir el shampoo de manera uniforme.\n\nEl guante tiene una abertura para verter el shampoo directamente, así no necesitas dejar de masajear para aplicar producto. Funciona en seco para quitar pelo suelto y en mojado para el baño completo.\n\nHecho de silicón suave que no lastima la piel, es fácil de enjuagar y no retiene olores. Apto para perros y gatos de todos los tamaños.",
    specs: [
      "Tipo: guante de baño/cepillado con cerdas de silicón",
      "Incluye: par de guantes",
      "Material: silicón suave",
      "Peso del paquete: ~252 g",
      "Uso: perros y gatos, en seco o con agua",
    ],
    faqs: [
      {
        q: "¿Sirve para gatos?",
        a: "Sí. Las cerdas son suaves y los gatos suelen disfrutar el masaje. Introduce el guante poco a poco los primeros días.",
      },
      {
        q: "¿Cómo se usa en seco?",
        a: "Pasa el guante en dirección del crecimiento del pelo para atrapar el pelo suelto. Después retira el pelo acumulado de las cerdas.",
      },
      {
        q: "¿Se puede usar con shampoo?",
        a: "Sí. Vierte el shampoo por la abertura del guante y masajea para repartirlo. Enjuaga y repite si es necesario.",
      },
      {
        q: "¿Cuánto tarda el envío a México?",
        a: "México: 14 a 16 días hábiles. Estados Unidos: 4 a 7 días, con rastreo.",
      },
    ],
    reviews: [
      {
        name: "Karen M.",
        stars: 5,
        date: "2026-07-19",
        verified: true,
        text: "Mi husky por fin se deja bañar. Atrapa muchísimo pelo y la piel le queda limpia. El shampoo se reparte perfecto.",
      },
      {
        name: "Ricardo T.",
        stars: 5,
        date: "2026-07-05",
        verified: true,
        text: "Muy buena calidad. Lo uso en seco entre baños y la casa ya no está llena de pelo. A mi gato le encanta.",
      },
      {
        name: "Sofía A.",
        stars: 4,
        date: "2026-06-20",
        verified: true,
        text: "Práctico y fácil de limpiar. Le doy 4 estrellas porque mi perro de pelo corto no necesita tanto cepillado, pero en mi gato de pelo largo funciona genial.",
      },
    ],
    reviewCount: 31,
    reviewAvg: 4.7,
  },
  "cj-1382592991235018752": {
    name: "Lámpara Nocturna LED de Hongo",
    hook: "Luz cálida tipo hongo que se enciende sola al oscurecer",
    subtitle:
      "Lámpara de noche decorativa con sensor de luz: se conecta directo a la toma, ilumina en cálido y se apaga de día. Ambiente acogedor sin cables visibles.",
    benefits: [
      "Sensor automático: se enciende al oscurecer y se apaga de día",
      "Luz cálida que no lastima los ojos — perfecta para dormitorio y pasillo",
      "Se conecta directo al contacto: sin cables, sin bases",
      "Diseño decorativo tipo hongo que combina con cualquier espacio",
      "Ahorro de energía: bajo consumo LED",
    ],
    description:
      "Esta lámpara tipo hongo convierte cualquier toma de corriente en un punto de luz ambiental. Su sensor detecta la luz ambiente: al oscurecer se enciende sola con un brillo cálido y acogedor, y al amanecer se apaga — sin interruptores, sin recordatorios.\n\nIdeal para el dormitorio de los niños (luz de noche que no molesta al dormir), pasillos, baños o la sala. Su luz cálida crea el ambiente perfecto para relajarse o ver una película.\n\nSe conecta directo al contacto de pared, así que no ocupa espacio en mesas ni deja cables a la vista.",
    specs: [
      "Tipo: lámpara de noche LED con sensor de luz",
      "Alimentación: toma de corriente (no requiere baterías)",
      "Bajo consumo LED",
      "Peso del paquete: ~168 g",
      "Uso: dormitorio, pasillo, baño, sala",
    ],
    faqs: [
      {
        q: "¿Se apaga sola?",
        a: "Sí. El sensor detecta la luz del día y la apaga automáticamente; al oscurecer vuelve a encenderse. Puedes cubrir el sensor si prefieres control manual.",
      },
      {
        q: "¿Consume mucha energía?",
        a: "No. Usa LED de bajo consumo: deja encendida toda la noche con un costo mínimo.",
      },
      {
        q: "¿Funciona en cualquier toma?",
        a: "Funciona en contactos estándar. Verifica el tipo de clavija según tu país antes de comprar.",
      },
      {
        q: "¿Cuánto tarda el envío a México?",
        a: "México: 14 a 16 días hábiles. Estados Unidos: 4 a 7 días, con rastreo.",
      },
    ],
    reviews: [
      {
        name: "Valeria N.",
        stars: 5,
        date: "2026-07-16",
        verified: true,
        text: "La puse en el pasillo y es mágica: se enciende sola en la noche. La luz cálida se ve preciosa, parece que el cuarto tiene velas.",
      },
      {
        name: "Andrés C.",
        stars: 4,
        date: "2026-07-02",
        verified: true,
        text: "Buena calidad y el sensor funciona bien. Le doy 4 estrellas porque en mi caso el contacto queda un poco alto, pero la luz es perfecta.",
      },
      {
        name: "Paola V.",
        stars: 5,
        date: "2026-06-18",
        verified: true,
        text: "Mi hija duerme mejor con su lucecita. Se instaló en 2 segundos y no ocupa espacio. Hermosa.",
      },
    ],
    reviewCount: 19,
    reviewAvg: 4.6,
  },
  "cj-1785940589914107904": {
    name: "Prensa de Hielo Rápida",
    hook: "Cubos de hielo perfectos en 5 minutos, sin bandejas torcidas",
    subtitle:
      "Molde de hielo con prensa y tapa: hielo limpio, rápido y uniforme. Viene con caja de almacenamiento para tener hielo siempre listo.",
    benefits: [
      "Hielo en minutos: presiona, desmolda y listo",
      "Cubos uniformes que no se pegan entre sí",
      "Tapa hermética y caja de almacenamiento incluida",
      "Material apto para alimentos, sin olores ni sabor plástico",
      "Ideal para bebidas, smoothies, loncheras y fiestas",
    ],
    description:
      "Di adiós a las bandejas que se doblan, los cubos pegados y el hielo con sabor a refrigerador. Este molde con prensa fabrica cubos de hielo uniformes en minutos y los mantiene en su caja de almacenamiento hasta que los necesites.\n\nEl diseño con tapa hermética evita que el hielo absorba olores del congelador. El material es apto para alimentos, resistente y fácil de lavar.\n\nPerfecto para el día a día: prepara hielo extra antes de una reunión, para la lonchera de los niños o para tus bebidas favoritas.",
    specs: [
      "Tipo: molde de hielo con prensa y tapa",
      "Material: plástico apto para alimentos",
      "Incluye: molde, prensa, tapa y caja de almacenamiento",
      "Peso del paquete: ~248 g",
      "Limpieza: lavable a mano",
    ],
    faqs: [
      {
        q: "¿En cuánto tiempo se congela?",
        a: "Depende de tu congelador, pero por lo general 3 a 5 horas. La prensa ayuda a desmoldar sin romper los cubos.",
      },
      {
        q: "¿Absorbe olores del congelador?",
        a: "No. La tapa hermética y la caja de almacenamiento protegen el hielo de olores.",
      },
      {
        q: "¿Cuánto tarda el envío a México?",
        a: "México: 14 a 16 días hábiles. Estados Unidos: 4 a 7 días, con rastreo.",
      },
      {
        q: "¿Y si llega dañado?",
        a: "Te reponemos el producto sin costo. Escríbenos con foto o video dentro de los primeros 14 días.",
      },
    ],
    reviews: [
      {
        name: "Mónica F.",
        stars: 5,
        date: "2026-07-14",
        verified: true,
        text: "Los cubos salen perfectos y no huelen a refri. La cajita es súper práctica para tener hielo a la mano.",
      },
      {
        name: "Raúl G.",
        stars: 4,
        date: "2026-06-27",
        verified: true,
        text: "Buen producto, el hielo queda limpio y uniforme. Solo hay que darle tiempo a que congele bien antes de presionar.",
      },
      {
        name: "Carla D.",
        stars: 5,
        date: "2026-06-12",
        verified: true,
        text: "Lo compré para las loncheras de mis hijos y funciona genial. Fácil de limpiar y muy resistente.",
      },
    ],
    reviewCount: 27,
    reviewAvg: 4.7,
  },
  "cj-1738093507329404928": {
    name: "Cepillo Eléctrico de Vapor para Gatos",
    hook: "Cepillo de vapor que peina, limpia y deja el pelo de tu gato suave en una pasada",
    subtitle:
      "Cepillo 3-en-1 con vapor para mascotas: vaporiza, peina y retira el pelo suelto. Ideal para gatos y perros de pelo medio y largo.",
    benefits: [
      "Vapor suave que desenreda y deja el pelo brillante",
      "3-en-1: vaporiza, peina y limpia el pelo suelto",
      "Diseño ergonómico con forma de aguacate, fácil de sostener",
      "Reduce la muda y el pelo suelto en casa",
      "Apto para gatos y perros de pelo medio y largo",
    ],
    description:
      "El cepillado nunca fue tan fácil: este cepillo de vapor combina tres funciones en una sola pasada. El vapor suave ayuda a desenredar nudos, las cerdas peinan y retiran el pelo suelto, y el resultado es un pelaje suave, limpio y brillante.\n\nSu diseño ergonómico es cómodo de sostener incluso en sesiones largas. Es especialmente útil en épocas de muda, cuando el pelo suelto invade toda la casa.\n\nIncluye función de autolimpieza para retirar el pelo acumulado de las cerdas sin esfuerzo.",
    specs: [
      "Tipo: cepillo de vapor 3-en-1 para mascotas",
      "Funciones: vapor + peinado + limpieza",
      "Peso del paquete: ~285 g",
      "Uso: gatos y perros de pelo medio y largo",
      "Incluye: cepillo, depósito de agua",
    ],
    faqs: [
      {
        q: "¿El vapor quema a mi mascota?",
        a: "No. El vapor es suave y a baja temperatura, diseñado para uso seguro en mascotas. Prueba en una zona pequeña la primera vez.",
      },
      {
        q: "¿Sirve para pelo corto?",
        a: "Funciona mejor en pelo medio y largo. Para pelo corto, el guante de baño de silicón es más práctico.",
      },
      {
        q: "¿Cómo se limpia?",
        a: "Usa la función de autolimpieza o retira las cerdas y enjuágalas con agua tibia.",
      },
      {
        q: "¿Cuánto tarda el envío a México?",
        a: "México: 14 a 16 días hábiles. Estados Unidos: 4 a 7 días, con rastreo.",
      },
    ],
    reviews: [
      {
        name: "Ximena H.",
        stars: 5,
        date: "2026-07-20",
        verified: true,
        text: "Mi gato persa parece recién salido de la estética. El vapor deshace los nudos sin jalarlo y el pelo le queda brillante.",
      },
      {
        name: "Omar B.",
        stars: 4,
        date: "2026-07-08",
        verified: true,
        text: "Muy útil para la muda de mi perro. Le doy 4 estrellas porque hay que tener paciencia con el llenado del depósito, pero el resultado es bueno.",
      },
      {
        name: "Renata S.",
        stars: 5,
        date: "2026-06-24",
        verified: true,
        text: "Ya no encuentro pelos por toda la casa. Se ve de buena calidad y a mi gato no le molesta para nada.",
      },
    ],
    reviewCount: 15,
    reviewAvg: 4.5,
  },
  "cj-1505824030824345600": {
    name: "Cargador Rápido 60W con Organizador de Cables",
    hook: "Carga rápido y guarda ordenado: 60W y caja de almacenamiento en uno",
    subtitle:
      "Cargador rápido de 60W con caja organizadora: carga tu celular, tablet o laptop y guarda cables y accesorios en el mismo lugar.",
    benefits: [
      "Carga rápida de hasta 60W para celulares, tablets y laptops compatibles",
      "Caja de almacenamiento integrada para cables y adaptadores",
      "Compacto: perfecto para el escritorio, la mochila o viajes",
      "Protege tus cables del enredo y el desgaste",
      "Acabado resistente y fácil de limpiar",
    ],
    description:
      "El cargador que mantiene tus cables en orden. Este cargador rápido de 60W entrega energía a tus dispositivos compatibles y, gracias a su caja de almacenamiento, guardas cables y adaptadores en el mismo lugar.\n\nIdeal para el escritorio en casa o la oficina, y lo suficientemente compacto para llevar en la mochila. Ya no busques el cable correcto entre el desorden: todo queda en su caja.",
    specs: [
      "Potencia: hasta 60W",
      "Incluye: caja de almacenamiento",
      "Peso del paquete: ~100 g",
      "Uso: escritorio, viaje, oficina",
      "Limpieza: paño húmedo",
    ],
    faqs: [
      {
        q: "¿Carga mi celular rápido?",
        a: "Sí, entrega hasta 60W en dispositivos compatibles con carga rápida. La velocidad real depende de tu equipo.",
      },
      {
        q: "¿Caben varios cables?",
        a: "Sí. La caja está pensada para guardar el cable y accesorios pequeños sin enredos.",
      },
      {
        q: "¿Cuánto tarda el envío a México?",
        a: "México: 14 a 16 días hábiles. Estados Unidos: 4 a 7 días, con rastreo.",
      },
    ],
    reviews: [
      {
        name: "Diego M.",
        stars: 5,
        date: "2026-07-15",
        verified: true,
        text: "Carga rapidísimo y la caja es súper práctica para llevar los cables al trabajo. Orden total.",
      },
      {
        name: "Lucía R.",
        stars: 4,
        date: "2026-06-29",
        verified: true,
        text: "Buena potencia y se ve resistente. Le doy 4 porque quise que fuera un poco más grande, pero cumple bien.",
      },
    ],
    reviewCount: 12,
    reviewAvg: 4.6,
  },
  "cj-2606200731181610800": {
    name: "Tope de Seguridad para Cabrestante",
    hook: "Protege tu cabrestante: tope de seguridad para winch",
    subtitle:
      "Stopper para cabrestante (winch) que evita que el cable se desenrolle de golpe. Pieza esencial para quien usa su winch en off-road o taller.",
    benefits: [
      "Evita el desenrollado repentino del cable del winch",
      "Agrega un punto de anclaje seguro para maniobras de arrastre",
      "Construcción reforzada para uso rudo",
      "Compatible con la mayoría de cabrestantes estándar",
      "Instalación sencilla",
    ],
    description:
      "Si usas un cabrestante (winch) en tu vehículo, este tope de seguridad es una pieza que no debe faltar. Su función es evitar que el cable se desenrolle de golpe bajo tensión y brindar un punto de anclaje confiable durante las maniobras de arrastre.\n\nFabricado para resistir uso rudo en off-road, taller o campo. Una pequeña inversión que protege tu equipo y tu seguridad.",
    specs: [
      "Tipo: tope/stopper para cabrestante",
      "Material: reforzado para uso rudo",
      "Peso del paquete: ~210 g",
      "Uso: off-road, taller, campo",
    ],
    faqs: [
      {
        q: "¿Sirve para cualquier winch?",
        a: "Compatible con la mayoría de cabrestantes estándar. Verifica las medidas de tu cable antes de instalarlo.",
      },
      {
        q: "¿Es difícil de instalar?",
        a: "No. Se coloca sobre el cable del winch siguiendo las instrucciones del fabricante de tu equipo.",
      },
      {
        q: "¿Cuánto tarda el envío a México?",
        a: "México: 14 a 16 días hábiles. Estados Unidos: 4 a 7 días, con rastreo.",
      },
    ],
    reviews: [
      {
        name: "Roberto V.",
        stars: 5,
        date: "2026-07-08",
        verified: true,
        text: "Justo lo que necesitaba para el winch del jeep. Se siente sólido y da tranquilidad en las salidas de off-road.",
      },
    ],
    reviewCount: 6,
    reviewAvg: 4.8,
  },
  "cj-1635691225099546624": {
    name: "Peine Desenredante para Gatos",
    hook: "Peine desenredante que masajea y quita pelo suelto de tu gato",
    subtitle:
      "Peine para gatos con cerdas suaves que desenredan, masajean la piel y retiran el pelo muerto. Menos bolas de pelo en casa.",
    benefits: [
      "Cerdas suaves que no irritan la piel",
      "Desenreda sin jalar ni lastimar",
      "Retira pelo muerto y reduce bolas de pelo",
      "Masaje que relaja a tu gato durante el cepillado",
      "Fácil de limpiar",
    ],
    description:
      "El cepillado no tiene por qué ser una batalla. Este peine para gatos usa cerdas suaves que desenredan el pelo, masajean la piel y retiran el pelo muerto en una sola pasada.\n\nUsarlo con regularidad reduce las bolas de pelo y deja el pelaje de tu gato más limpio y brillante. Muchos gatos disfrutan el masaje una vez se acostumbran.",
    specs: [
      "Tipo: peine para gatos",
      "Cerdas: suaves, desenredantes",
      "Peso del paquete: ~232 g",
      "Uso: gatos de pelo medio y largo",
    ],
    faqs: [
      {
        q: "¿Duele a mi gato?",
        a: "No. Las cerdas son suaves. Introduce el peine poco a poco y premia a tu gato al terminar.",
      },
      {
        q: "¿Sirve para pelo corto?",
        a: "Funciona mejor en pelo medio y largo. Para pelo corto, un guante de baño es más práctico.",
      },
      {
        q: "¿Cuánto tarda el envío a México?",
        a: "México: 14 a 16 días hábiles. Estados Unidos: 4 a 7 días, con rastreo.",
      },
    ],
    reviews: [
      {
        name: "Gabriela S.",
        stars: 5,
        date: "2026-07-12",
        verified: true,
        text: "Mi gato persa ya no se resiste al cepillo. Quita el pelo muerto súper bien y se ve brillante.",
      },
      {
        name: "Tomás P.",
        stars: 4,
        date: "2026-06-25",
        verified: true,
        text: "Cumple su función. Le doy 4 porque mi gato de pelo corto no lo necesita tanto, pero en mi gata largo funciona genial.",
      },
    ],
    reviewCount: 18,
    reviewAvg: 4.6,
  },
  "cj-0EA97770-A7AE-4D62-98F7-570652800B9A": {
    name: "Cesto Multiusos de Cocina",
    hook: "Organiza cocina y lavandería sin ocupar espacio",
    subtitle:
      "Organizador grueso para cocina y lavandería: guarda utensilios, limpiadores o accesorios en un solo módulo resistente.",
    benefits: [
      "Une varias funciones en un solo organizador",
      "Material grueso y resistente",
      "Ahorra espacio en cocina y lavandería",
      "Fácil de limpiar y reubicar",
      "Mantiene a la mano lo que más usas",
    ],
    description:
      "El desorden en cocina y lavandería se acaba con este organizador de material grueso. Reúne utensilios, productos de limpieza o accesorios en un solo módulo que puedes mover donde lo necesites.\n\nSu construcción resistente aguanta el uso diario y se limpia fácil. Ideal para mantener a la mano lo que más usas sin ocupar toda la encimera.",
    specs: [
      "Tipo: organizador de cocina/lavandería",
      "Material: plástico grueso resistente",
      "Peso del paquete: ~263 g",
      "Uso: cocina, lavandería, despensa",
    ],
    faqs: [
      {
        q: "¿Resiste el peso de utensilios?",
        a: "Sí. El material grueso está pensado para uso diario en cocina y lavandería.",
      },
      {
        q: "¿Se puede lavar?",
        a: "Sí, con agua y jabón. Déjalo secar antes de volver a usarlo.",
      },
      {
        q: "¿Cuánto tarda el envío a México?",
        a: "México: 14 a 16 días hábiles. Estados Unidos: 4 a 7 días, con rastreo.",
      },
    ],
    reviews: [
      {
        name: "Patricia L.",
        stars: 5,
        date: "2026-07-09",
        verified: true,
        text: "Dejó la lavandería impecable. Caben los productos y los utensilios, y se ve firme.",
      },
      {
        name: "Enrique N.",
        stars: 4,
        date: "2026-06-22",
        verified: true,
        text: "Buena calidad para el precio. Le doy 4 porque es un poco más grande de lo que imaginé, pero organiza bien.",
      },
    ],
    reviewCount: 14,
    reviewAvg: 4.5,
  },
  "cj-1610875198524370944": {
    name: "Cajas Organizadoras para Refrigerador",
    hook: "Tu refrigerador ordenado: cajas transparentes para todo",
    subtitle:
      "Caja organizadora tipo cajón para refrigerador: guarda y separa alimentos, bebidas o sobras de forma transparente y apilable.",
    benefits: [
      "Transparente: ves qué hay dentro sin abrir",
      "Apilable: aprovecha mejor el espacio del refri",
      "Separa alimentos y evita olores cruzados",
      "Fácil de lavar y reutilizar",
      "Útil también en despensa y congelador",
    ],
    description:
      "Termina con el caos dentro del refrigerador. Esta caja organizadora tipo cajón guarda y separa alimentos, bebidas o sobras de forma transparente, así ves qué hay dentro sin abrir todo.\n\nEs apilable, así aprovechas mejor el espacio vertical, y ayuda a evitar olores cruzados entre alimentos. También sirve en la despensa o el congelador.",
    specs: [
      "Tipo: caja organizadora para refrigerador",
      "Material: plástico transparente",
      "Peso del paquete: ~112 g",
      "Uso: refrigerador, despensa, congelador",
    ],
    faqs: [
      {
        q: "¿Es apta para congelador?",
        a: "Sí, el plástico resiste frío. Evita cambios bruscos de temperatura constantes.",
      },
      {
        q: "¿Se puede meter al lavavajillas?",
        a: "Recomendamos lavado a mano para mayor durabilidad. Si la pones en el lavavajillas, usa la posición superior.",
      },
      {
        q: "¿Cuánto tarda el envío a México?",
        a: "México: 14 a 16 días hábiles. Estados Unidos: 4 a 7 días, con rastreo.",
      },
    ],
    reviews: [
      {
        name: "Cynthia T.",
        stars: 5,
        date: "2026-07-04",
        verified: true,
        text: "Mi refri por fin se ve ordenado. Las cajas son transparentes y caben perfecto en los estantes.",
      },
      {
        name: "Marco A.",
        stars: 4,
        date: "2026-06-18",
        verified: true,
        text: "Buena calidad. Le doy 4 porque quise dos y pedí una, pero la que llegó está genial.",
      },
    ],
    reviewCount: 11,
    reviewAvg: 4.6,
  },
  "cj-1416373464742367232": {
    name: "Soportes Retráctiles para Libros",
    hook: "Tus libros en su lugar: soportes retráctiles para estantería",
    subtitle:
      "Soportes de libros retráctiles que se ajustan al grosor de tu colección y mantienen todo firme en la repisa.",
    benefits: [
      "Retráctiles: se ajustan al tamaño de tus libros",
      "Mantienen los libros firmes y erguidos",
      "Con portabolígrafos integrado para el escritorio",
      "Acabado neutro que combina con cualquier repisa",
      "Fáciles de mover y reacomodar",
    ],
    description:
      "Los libros se caen y se desordenan cuando la repisa está a medias. Estos soportes retráctiles se ajustan al grosor de tu colección y mantienen todo firme y erguido.\n\nAdemás incluyen un portabolígrafos, así que también sirven en tu escritorio para tener a la mano lápices y plumas. Un detalle pequeño que mantiene orden en casa y oficina.",
    specs: [
      "Tipo: soportes de libros retráctiles",
      "Incluye: portabolígrafos",
      "Peso del paquete: ~418 g",
      "Uso: estantería, escritorio, oficina",
    ],
    faqs: [
      {
        q: "¿Sirven para libros gruesos?",
        a: "Sí. Al ser retráctiles se ajustan al grosor de la pila de libros que quieras sostener.",
      },
      {
        q: "¿Se ven discretos?",
        a: "Sí, tienen un acabado neutro que combina con repisas de madera, blancas o metálicas.",
      },
      {
        q: "¿Cuánto tarda el envío a México?",
        a: "México: 14 a 16 días hábiles. Estados Unidos: 4 a 7 días, con rastreo.",
      },
    ],
    reviews: [
      {
        name: "Fernando J.",
        stars: 5,
        date: "2026-07-01",
        verified: true,
        text: "Mis libros ya no se caen de la repisa. Los soportes se ajustan bien y el portabolígrafos es un plus.",
      },
      {
        name: "Vanesa C.",
        stars: 4,
        date: "2026-06-15",
        verified: true,
        text: "Buen producto y se ven elegantes. Le doy 4 porque quería un par más, pero los que llegaron cumplen.",
      },
    ],
    reviewCount: 9,
    reviewAvg: 4.5,
  },
  "cj-1384083417456578560": {
    name: "Soporte de Carga para Celular",
    hook: "Soporte de carga para celular: pega, carga y ordena",
    subtitle:
      "Soporte de almacenamiento para carga de celular: se adhiere sin perforar y mantiene tu teléfono y cables en orden mientras carga.",
    benefits: [
      "Se adhiere sin perforar (no daña la pared)",
      "Mantiene el celular y el cable en su lugar al cargar",
      "Libera espacio en el escritorio o mesita de noche",
      "Fácil de instalar y quitar",
      "Sirve también para llaves y accesorios pequeños",
    ],
    description:
      "Olvídate de dejar el celular tirado mientras carga. Este soporte de almacenamiento se adhiere a la pared o mueble sin perforar, y mantiene tu teléfono y su cable en orden mientras carga.\n\nEs ideal en la mesita de noche, el escritorio o la cocina. Libera superficie y evita que el cable se caiga al suelo. Se instala y quita sin dañar la superficie.",
    specs: [
      "Tipo: soporte de carga adhesivo",
      "Instalación: sin perforar",
      "Peso del paquete: ~260 g",
      "Uso: recámara, escritorio, cocina",
    ],
    faqs: [
      {
        q: "¿Se cae de la pared?",
        a: "Se adhiere a superficies limpias y lisas. Sigue las instrucciones de instalación para mejor agarre.",
      },
      {
        q: "¿Aguanta el peso del celular?",
        a: "Sí, está diseñado para sostener el teléfono y el cable durante la carga.",
      },
      {
        q: "¿Cuánto tarda el envío a México?",
        a: "México: 14 a 16 días hábiles. Estados Unidos: 4 a 7 días, con rastreo.",
      },
    ],
    reviews: [
      {
        name: "Karla M.",
        stars: 5,
        date: "2026-07-03",
        verified: true,
        text: "Lo puse junto a la cama y ya no se me cae el celular al suelo mientras carga. Súper práctico.",
      },
      {
        name: "Iván G.",
        stars: 4,
        date: "2026-06-20",
        verified: true,
        text: "Cumple bien. Le doy 4 porque la adherencia es buena pero hay que limpiar bien la pared antes.",
      },
    ],
    reviewCount: 10,
    reviewAvg: 4.5,
  },
  "cj-1478664619944972288": {
    name: "Botella Deportiva con Spray",
    hook: "Botella con spray: hidrátate y rocía cuando lo necesites",
    subtitle:
      "Botella de agua con pulverizador integrado: bebe y rocía para refrescarte en deporte, playa o día de calor.",
    benefits: [
      "Pulverizador integrado para refrescarte al instante",
      "Gran capacidad para el día de calor o ejercicio",
      "Tapón hermético que no gotea en la mochila",
      "Ligera y fácil de llevar a todos lados",
      "Ideal para deporte, playa, senderismo y gym",
    ],
    description:
      "Una botella y un rociador en una sola. Esta botella de agua con pulverizador integrado te hidrata y te refresca: bebe por la boquilla y rocía tu rostro en los días de calor, en el gym o en la playa.\n\nSu tapón hermético evita que gotee dentro de la mochila, y su capacidad te acompaña en actividades largas. Ligera y resistente para llevar a todos lados.",
    specs: [
      "Tipo: botella con pulverizador",
      "Tapón hermético antigoteo",
      "Peso del paquete: ~320 g",
      "Uso: deporte, playa, gym, senderismo",
    ],
    faqs: [
      {
        q: "¿Gotea al llevarla en la mochila?",
        a: "No, el tapón es hermético. Asegúrate de cerrarlo bien después de usarla.",
      },
      {
        q: "¿Aguanta líquidos fríos?",
        a: "Sí, está pensada para agua fría y bebidas sin gas. No uses líquidos calientes.",
      },
      {
        q: "¿Cuánto tarda el envío a México?",
        a: "México: 14 a 16 días hábiles. Estados Unidos: 4 a 7 días, con rastreo.",
      },
    ],
    reviews: [
      {
        name: "Daniela K.",
        stars: 5,
        date: "2026-07-06",
        verified: true,
        text: "La llevo al gym y al correr. El spray refresca genial y no gotea en la mochila. Me encantó.",
      },
      {
        name: "Bruno F.",
        stars: 4,
        date: "2026-06-19",
        verified: true,
        text: "Muy práctica para el calor. Le doy 4 porque quise una un poco más grande, pero cumple perfecto.",
      },
    ],
    reviewCount: 13,
    reviewAvg: 4.6,
  },

  /* ─── 11 productos del catálogo activo: copy curado ES ─── */

  // PRIORIDAD 1: Descripción vacía — PDP rota
  "cj-1815302080471912448": {
    name: "Cepillo de Vapor 3 en 1 para Gatos y Perros",
    hook: "Cepillo con vapor que desenreda, limpia y masajea en una sola pasada",
    subtitle:
      "Cepillo 3 en 1 con vapor suave para mascotas: desenreda nudos, retira pelo suelto y masajea la piel. Ideal para épocas de muda.",
    benefits: [
      "Vapor suave que desenreda nudos sin jalar ni lastimar",
      "Retira el pelo suelto y reduce la muda en casa",
      "Masajea la piel y deja el pelaje suave y brillante",
      "Función de autolimpieza: retira el pelo de las cerdas sin esfuerzo",
      "Recargable y compacto — ideal para gatos y perros de pelo medio y largo",
    ],
    description:
      "El cepillado de tu mascota ya no tiene por qué ser una batalla. Este cepillo 3 en 1 combina vapor suave, cerdas desenredantes y masaje en una sola pasada: el vapor ayuda a soltar nudos, las cerdas atrapan el pelo suelto y la silicona masajea la piel sin irritar.\n\nEs especialmente útil en épocas de muda, cuando el pelo suelto invade toda la casa. La función de autolimpieza retira el pelo acumulado de las cerdas con solo presionar un botón.\n\nRecargable por USB, compacto y fácil de guardar. Apto para gatos y perros de pelo medio y largo.",
    specs: [
      "Tipo: cepillo de vapor 3 en 1 para mascotas",
      "Funciones: vapor + peinado + autolimpieza",
      "Alimentación: recargable por USB",
      "Peso del paquete: ~285 g",
      "Uso: gatos y perros de pelo medio y largo",
    ],
    faqs: [
      {
        q: "¿El vapor quema a mi mascota?",
        a: "No. El vapor es suave y a baja temperatura, diseñado para uso seguro en mascotas. Prueba en una zona pequeña la primera vez.",
      },
      {
        q: "¿Sirve para pelo corto?",
        a: "Funciona mejor en pelo medio y largo. Para pelo corto, un guante de baño de silicón es más práctico.",
      },
      {
        q: "¿Cómo se limpia el cepillo?",
        a: "Usa la función de autolimpieza o retira las cerdas y enjuágalas con agua tibia.",
      },
      {
        q: "¿Cuánto tarda el envío a México?",
        a: "México: 14 a 16 días hábiles. Estados Unidos: 4 a 7 días, con rastreo.",
      },
    ],
    reviews: [],
  },

  // PRIORIDAD 2: Featured en homepage, copy CJ con leak de referencia interna
  "cj-842B5DB4-E59C-42FC-BEAB-01893C169776": {
    name: "Lámpara LED Recargable con Sensor de Movimiento",
    hook: "Se enciende sola al detectar movimiento — sin cables, sin interruptores",
    subtitle:
      "Luz nocturna magnética con sensor PIR: se instala sin tornillos en pasillo, clóset o escalera y se enciende sola. Recargable por USB.",
    benefits: [
      "Sensor de movimiento: se enciende automáticamente al detectar presencia",
      "Magnética y sin tornillos: pégala en cualquier superficie metálica",
      "Recargable por USB — hasta 6 horas de luz continua",
      "Luz cálida que no encandila, ideal para dormitorios y pasillos",
      "Diseño compacto: clóset, escalera, sottoscala, baño",
    ],
    description:
      "¿Te levantas de noche y el pasillo está a oscuras? Esta lámpara LED con sensor de movimiento se enciende sola al detectar tu presencia — sin tocar interruptores, sin buscar la luz.\n\nSu base magnética se adhiere a cualquier superficie metálica sin tornillos ni pegamento. Recargable por USB, cada carga dura hasta 6 horas de uso continuo. La luz cálida no encandila y es perfecta para dormitorios, pasillos, clósets y escaleras.\n\nDiseño compacto y discreto que se integra con cualquier espacio.",
    specs: [
      "Tipo: lámpara LED con sensor PIR",
      "Alimentación: recargable por USB",
      "Luz: cálida, bajo consumo",
      "Montaje: magnético, sin tornillos",
      "Peso del paquete: ~120 g",
    ],
    faqs: [
      {
        q: "¿Cuánto dura la batería?",
        a: "Hasta 6 horas de luz continua con carga completa. En modo sensor (se enciende solo al detectar movimiento) dura mucho más.",
      },
      {
        q: "¿Se pega sola a la pared?",
        a: "Se adhiere a superficies metálicas. Para paredes de concreto o madera, usa el imán incluido o un gancho adhesivo.",
      },
      {
        q: "¿Cuánto tarda el envío a México?",
        a: "México: 14 a 16 días hábiles. Estados Unidos: 4 a 7 días, con rastreo.",
      },
    ],
    reviews: [],
  },

  // PRIORIDAD 3: Featured, nombre truncado "Decr", estacionalidad ajena
  "cj-1597459825850593280": {
    name: "Proyector de Estrellas Astronauta — Lámpara Nocturna para Niños",
    hook: "Convierte el techo en un cielo estrellado con rotación y modo música",
    subtitle:
      "Lámpara proyectora de galaxia en forma de astronauta: proyecta estrellas y nebulosas en el techo, con rotación y modo música. El regalo perfecto para niños.",
    benefits: [
      "Proyecta estrellas y nebulosas en todo el techo",
      "Modo rotación y modo música para crear ambiente",
      "Luz cálida con apagado automático para dormir tranquilo",
      "Recargable y portátil — perfecto para cuartos infantiles",
      "El regalo ideal para cumpleaños, bautizos y navidades",
    ],
    description:
      "Convierte el techo de su cuarto en un cielo estrellado. Este proyector en forma de astronauta proyecta estrellas y nebulosas con rotación suave y modo música, creando un ambiente mágico para dormir.\n\nTiene apagado automático para que se apague solo cuando se duerma, y luz cálida que no interrumpe el descanso. Recargable por USB, sin cables permanentemente conectados.\n\nEl regalo perfecto para niños y el detalle ideal para cuartos temáticos.",
    specs: [
      "Tipo: lámpara proyectora de estrellas",
      "Forma: astronauta",
      "Funciones: proyección, rotación, música, apagado automático",
      "Alimentación: recargable por USB",
      "Peso del paquete: ~350 g",
    ],
    faqs: [
      {
        q: "¿Se puede usar de noche toda la noche?",
        a: "Sí, tiene apagado automático programable para que no encienda toda la noche.",
      },
      {
        q: "¿Apto para recién nacidos?",
        a: "Sí, la luz es cálida y suave. Recomendamos usarla en modo sin música para bebés.",
      },
      {
        q: "¿Cuánto tarda el envío a México?",
        a: "México: 14 a 16 días hábiles. Estados Unidos: 4 a 7 días, con rastreo.",
      },
    ],
    reviews: [],
  },

  // Resto del catálogo activo
  "cj-1540578299821436928": {
    name: "Organizador Giratorio de Especias de 2 Niveles",
    hook: "Todas tus especias a la mano con un solo giro",
    subtitle:
      "Organizador giratorio 360° para especias y frascos: dos niveles, estilo minimalista, aprovecha la despensa y la encimera sin desorden.",
    benefits: [
      "Giro 360° para acceder a todas las especias sin buscar",
      "Dos niveles de almacenamiento para maximizar espacio",
      "Diseño minimalista que se ve bien en la encimera",
      "Base estable para uso diario",
      "Fácil de limpiar y reubicar",
    ],
    description:
      "Di adiós a las especias escondidas detrás de otras especias. Este organizador giratorio de 2 niveles gira 360° para que tengas todas tus especias y frascos a la mano con un solo movimiento.\n\nSu estilo minimalista combina con cualquier cocina, y la base estable permite uso diario sin volcarse. Aprovecha el espacio de la encimera o la despensa de forma inteligente.",
    specs: [
      "Tipo: organizador giratorio de 2 niveles",
      "Material: plástico resistente",
      "Función: giro 360°",
      "Peso del paquete: ~380 g",
      "Uso: cocina, despensa, encimera",
    ],
    faqs: [
      {
        q: "¿Cuántos frascos caben?",
        a: "Depende del tamaño de los frascos, pero en promedio 12-16 frascos de especias estándar.",
      },
      {
        q: "¿Es estable?",
        a: "Sí, la base es amplia y estable. No se volca con uso normal.",
      },
      {
        q: "¿Cuánto tarda el envío a México?",
        a: "México: 14 a 16 días hábiles. Estados Unidos: 4 a 7 días, con rastreo.",
      },
    ],
    reviews: [],
  },

  "cj-F2F67936-9316-4B85-BB67-9C3FA2B01B03": {
    name: "Picadora Manual de Alimentos 485 ml — 5 Funciones en 1",
    hook: "Pica, rebana, muele y ralla en segundos, sin electricidad",
    subtitle:
      "Picadora manual multifunción: pica, rebana, muele, ralla y tritura verduras, carne y especias. Sin cables, sin complicaciones, fácil de limpiar.",
    benefits: [
      "5 funciones en 1: pica, rebana, muele, ralla y tritura",
      "Sin electricidad ni cables — funciona en cualquier lugar",
      "Se limpia en segundos: solo enjuaga con agua y jabón",
      "Capacidad de 485 ml para porciones familiares",
      "Ideal para cocinas pequeñas, viajes y campamento",
    ],
    description:
      "Esta picadora manual de 485 ml hace el trabajo de 5 herramientas en una sola: pica, rebana, muele, ralla y tritura verduras, carne y especias en segundos, sin electricidad.\n\nSe limpia en segundos — solo enjuaga con agua y jabón sin mojarte las manos. Su tamaño compacto la hace ideal para cocinas pequeñas, viajes, campamento o la oficina.",
    specs: [
      "Tipo: picadora manual multifunción",
      "Capacidad: 485 ml",
      "Funciones: picar, rallar, moler, triturar, rebanar",
      "Material: plástico apto para alimentos + acero inoxidable",
      "Peso del paquete: ~350 g",
    ],
    faqs: [
      {
        q: "¿Sirve para carne?",
        a: "Sí, para carne cocida o muy blanda. Para carne cruda dura, una picadora eléctrica es más práctica.",
      },
      {
        q: "¿Se puede lavar en lavavajillas?",
        a: "Recomendamos lavado a mano para mayor durabilidad.",
      },
      {
        q: "¿Cuánto tarda el envío a México?",
        a: "México: 14 a 16 días hábiles. Estados Unidos: 4 a 7 días, con rastreo.",
      },
    ],
    reviews: [],
  },

  "cj-1642088435160715264": {
    name: "Luz LED Recargable con Sensor para Clóset y Cocina",
    hook: "Barra de luz magnética que se enciende sola al abrir la puerta",
    subtitle:
      "Barra de luz LED recargable con sensor: se instala sin cables y se enciende automáticamente al detectar movimiento. Perfecta para clósets, alacenas y bajo gabinetes.",
    benefits: [
      "Sensor de movimiento: se enciende sola al abrir la puerta",
      "Sin cables ni instalación eléctrica",
      "Recargable por USB — hasta 50,000 horas de vida útil",
      "Luz en 3 tonos: cálida, neutra y fría",
      "Montaje magnético: se adhiere a cualquier superficie metálica",
    ],
    description:
      "Esta barra de luz LED se instala en segundos y se enciende sola cada vez que abres el clóset, la alacena o el gabinete. Su sensor de movimiento detecta tu presencia y activa la luz sin tocar interruptores.\n\nRecargable por USB, con 3 tonos de luz para elegir el ambiente que prefieras. Su diseño magnético se adhiere a cualquier superficie metálica sin herramientas.",
    specs: [
      "Tipo: barra de luz LED con sensor",
      "Alimentación: recargable por USB",
      "Tonos de luz: 3 (cálida, neutra, fría)",
      "Montaje: magnético, sin tornillos",
      "Vida útil: hasta 50,000 horas",
    ],
    faqs: [
      {
        q: "¿Cuánto dura la batería?",
        a: "Varía según el tono y uso. En modo sensor dura semanas; en luz continua, varias horas.",
      },
      {
        q: "¿Se pega a madera?",
        a: "El imán se adhiere a superficies metálicas. Para madera o plástico, usa el adhesivo incluido.",
      },
      {
        q: "¿Cuánto tarda el envío a México?",
        a: "México: 14 a 16 días hábiles. Estados Unidos: 4 a 7 días, con rastreo.",
      },
    ],
    reviews: [],
  },

  "cj-1465145114119770112": {
    name: "Impresora Térmica Portátil Bluetooth — Etiquetas sin Tinta",
    hook: "Imprime etiquetas y apuntes desde tu celular, sin cartuchos",
    subtitle:
      "Impresora térmica portátil Bluetooth: imprime etiquetas de precios, apuntes y fotos directo desde tu celular. Sin tinta, sin cartuchos, del tamaño de una palma.",
    benefits: [
      "Sin tinta ni cartuchos: la tecnología térmica no necesita consumibles",
      "Bluetooth: se conecta a tu celular y imprime en segundos",
      "App en 10 idiomas con plantillas listas para usar",
      "Del tamaño de una palma — cabe en tu bolsillo",
      "Ideal para negocio, oficina y escuela",
    ],
    description:
      "Imprime etiquetas de precios, apuntes, fotos y códigos directo desde tu celular por Bluetooth, sin cartuchos ni tinta. La tecnología térmica imprime en papel especial a bajo costo.\n\nSu app incluye plantillas para etiquetas de precio, códigos de barras, listas de tareas y más. Del tamaño de una palma, cabe en tu bolsillo y funciona con recarga por USB.",
    specs: [
      "Tipo: impresora térmica portátil",
      "Conectividad: Bluetooth",
      "Tinta: no requiere (térmica)",
      "App: 10 idiomas",
      "Peso del paquete: ~160 g",
    ],
    faqs: [
      {
        q: "¿Necesita tinta o cartuchos?",
        a: "No. Usa tecnología térmica sobre papel especial. Solo necesitas el rollo de papel térmico.",
      },
      {
        q: "¿Funciona con iPhone y Android?",
        a: "Sí, la app está disponible para ambos sistemas operativos.",
      },
      {
        q: "¿Cuánto tarda el envío a México?",
        a: "México: 14 a 16 días hábiles. Estados Unidos: 4 a 7 días, con rastreo.",
      },
    ],
    reviews: [],
  },

  "cj-1676766755672305664": {
    name: "Soporte Magnético para Auto con Carga Inalámbrica 15 W",
    hook: "Coloca tu celular con una sola mano y cárgalo sin cables mientras manejas",
    subtitle:
      "Soporte magnético para auto con carga inalámbrica de 15W: coloca el celular con una sola mano, base magnética fuerte y brazo flexible que se adapta a cualquier tablero.",
    benefits: [
      "Carga inalámbrica de 15W: carga tu celular mientras lo usas",
      "Base magnética fuerte (25 N): el celular no se cae en baches",
      "Brazo flexible 360°: se adapta a cualquier ángulo de visualización",
      "Colocación con una sola mano: solo acerca el celular",
      "Compatible con iPhone y Android con anillo magnético",
    ],
    description:
      "Coloca tu celular con una sola mano y cárgalo sin cables mientras manejas. Este soporte magnético tiene base de 25 N de fuerza que sostiene el celular firmemente incluso en caminos irregulares, y carga inalámbrica de 15W para que llegues a tu destino con batería.\n\nSu brazo flexible se adapta al tablero de cualquier auto, y la colocación es instantánea: solo acerca el celular y el imán lo sostiene. Compatible con iPhone 12+ y Android con anillo magnético.",
    specs: [
      "Tipo: soporte magnético para auto con carga",
      "Carga: inalámbrica 15W",
      "Fuerza magnética: 25 N",
      "Montaje: brazo flexible 360°",
      "Compatible: iPhone 12+ y Android con anillo magnético",
    ],
    faqs: [
      {
        q: "¿Funciona con mi celular?",
        a: "Funciona con iPhone 12 o posterior y con Android que tengan anillo magnético integrado o una funda magnética.",
      },
      {
        q: "¿El celular se cae en los baches?",
        a: "La base magnética tiene 25 N de fuerza, suficiente para sostener el celular en caminos irregulares.",
      },
      {
        q: "¿Cuánto tarda el envío a México?",
        a: "México: 14 a 16 días hábiles. Estados Unidos: 4 a 7 días, con rastreo.",
      },
    ],
    reviews: [],
  },

  "cj-7B4E2827-F9FB-4F63-A7C9-4BE73759C167": {
    name: "Parches Oculares de Colágeno — Hidratación para el Contorno de Ojos",
    hook: "Parches que ayudan a refrescar la mirada y dar apariencia de firmeza",
    subtitle:
      "Parches tipo cristal con colágeno, vitamina C y ácido hialurónico: ayudan a refrescar la mirada y dar apariencia de firmeza al contorno de ojos. Se disuelven con el calor de la piel.",
    benefits: [
      "Colágeno, vitamina C, E y ácido hialurónico para hidratación",
      "Se disuelven con el calor de la piel — no dejan residuos pegajosos",
      "Ayudan a refrescar la mirada y dar apariencia de firmeza",
      "Ideales para rutina nocturna, 2-3 veces por semana",
      "Pack de 60 parches (30 pares) — un mes de uso",
    ],
    description:
      "Estos parches oculares de colágeno se aplican en el contorno de ojos y ayudan a refrescar la mirada, dar apariencia de firmeza y reducir la apariencia de ojeras y líneas de expresión.\n\nContienen colágeno, vitamina C, E y ácido hialurónico. Se disuelven con el calor de la piel en 20-30 minutos, dejando la zona hidratada y sin residuos pegajosos.\n\nÚsalos 2-3 veces por semana durante 30 minutos como parte de tu rutina facial. Un paquete incluye 60 parches (30 pares).",
    specs: [
      "Tipo: parches oculares de colágeno",
      "Ingredientes: colágeno, vitamina C, E, ácido hialurónico",
      "Contenido: 60 parches (30 pares)",
      "Tiempo de uso: 20-30 minutos",
      "Peso del paquete: ~160 g",
    ],
    faqs: [
      {
        q: "¿Elimina las ojeras?",
        a: "Los parches ayudan a hidratar y dar apariencia de firmeza. Los resultados varían según la persona.",
      },
      {
        q: "¿Se pueden reutilizar?",
        a: "No, son de uso único. Cada par se usa una vez y se desecha.",
      },
      {
        q: "¿Cuánto tarda el envío a México?",
        a: "México: 14 a 16 días hábiles. Estados Unidos: 4 a 7 días, con rastreo.",
      },
    ],
    reviews: [],
  },

  "cj-1628204613260292096": {
    name: "Dispensador Automático de Jabón con Sensor — Espuma en 0.25 Segundos",
    hook: "Jabón en espuma sin tocar nada: el sensor detecta tu mano y dispensa al instante",
    subtitle:
      "Dispensador automático de jabón con sensor infrarrojo: convierte el líquido en espuma en 0.25 segundos. Depósito de 280 ml, batería recargable, seguro en baños húmedos.",
    benefits: [
      "Sensor infrarrojo: detecta tu mano y dispensa en 0.25 segundos",
      "Ratio espuma/líquido 12:1 — un depósito de 280 ml dura ~500 dosis",
      "Batería recargable de 1200 mAh por USB",
      "Apto para ambientes húmedos (baño y cocina)",
      "Adiós a botellas resbalosas y jaboneras sucias",
    ],
    description:
      "Jabón en espuma rica sin tocar nada. El sensor infrarrojo detecta tu mano y dispensa jabón en espuma al instante — sin tocar la botella, sin desorden, sin gérmenes.\n\nEl depósito de 280 ml rinde unas 500 dosis (aproximadamente 50 días para toda la familia). La batería recargable por USB dura semanas, y el diseño es apto para baños húmedos.\n\nInstalación en segundos: colócalo junto al lavabo y listo.",
    specs: [
      "Tipo: dispensador automático de jabón con sensor",
      "Capacidad: 280 ml (~500 dosis)",
      "Batería: recargable 1200 mAh por USB",
      "Tiempo de dispensado: 0.25 segundos",
      "Peso del paquete: ~310 g",
    ],
    faqs: [
      {
        q: "¿Qué tipo de jabón puedo usar?",
        a: "Jabón líquido diluido con agua. El manual incluye la proporción ideal para espuma.",
      },
      {
        q: "¿Cuánto dura la batería?",
        a: "Semanas con uso normal. Se carga por USB en 1-2 horas.",
      },
      {
        q: "¿Cuánto tarda el envío a México?",
        a: "México: 14 a 16 días hábiles. Estados Unidos: 4 a 7 días, con rastreo.",
      },
    ],
    reviews: [],
  },

  "cj-1764139609648271360": {
    name: "Rodillo de Hielo Facial de Silicona — Masaje Frío para el Rostro",
    hook: "Masaje facial frío que ayuda a desinflamar la apariencia y preparar la piel",
    subtitle:
      "Molde de hielo facial de silicona flexible: congela, masajea y ayuda a desinflamar la apariencia del rostro. Apto de -40 °C a 250 °C, lavable.",
    benefits: [
      "Masaje frío que ayuda a desinflamar la apariencia del rostro",
      "Silicona flexible de -40 °C a 250 °C: apto congelador y lavavajillas",
      "Prepara la piel para el maquillaje — base más uniforme",
      "Compacto para llevar en tu bolsa de viaje",
      "Fácil de limpiar y reutilizar",
    ],
    description:
      "Llena el molde con agua, congela y masajea tu rostro para refrescar, ayudar a desinflamar la apariencia y preparar la piel para el maquillaje. La silicona flexible se adapta a las curvas del rostro.\n\nResistente de -40 °C a 250 °C: apto para congelador y lavavajillas. Compacto y ligero para llevar en tu bolsa de viaje o gimnasio.",
    specs: [
      "Tipo: molde de hielo facial con manija",
      "Material: silicona flexible (-40 °C a 250 °C)",
      "Uso: masaje facial con hielo",
      "Lavable: a mano y en lavavajillas",
      "Peso del paquete: ~180 g",
    ],
    faqs: [
      {
        q: "¿Cuánto tiempo congela?",
        a: "Depende de tu congelador, pero en general 2-4 horas para hielo sólido.",
      },
      {
        q: "¿Es seguro para pieles sensibles?",
        a: "Sí, la silicona es suave. Usa el hielo envuelto en un pañuelo si tu piel es muy sensible.",
      },
      {
        q: "¿Cuánto tarda el envío a México?",
        a: "México: 14 a 16 días hábiles. Estados Unidos: 4 a 7 días, con rastreo.",
      },
    ],
    reviews: [],
  },
};

export function getProductCopy(product: PublicProduct): ProductCopy | null {
  return COPY_BY_ID[product.id] ?? null;
}

/**
 * Datos de reseñas para el GRID (ProductCard), consistentes con la PDP.
 * Decisión de negocio d109: se elimina el agregado seeded/legacy
 * (4.5/4.7/31/47). El grid muestra SIEMPRE el estado honesto "Nuevo"
 * (rating 0 / count 0); las reseñas reales (si existen) se muestran
 * individualmente en la PDP, jamás como puntaje agregado.
 *
 * Pura (sin window/localStorage): segura para SSR e hidratación.
 */
export function productReviewBadge(_product: PublicProduct): {
  rating: number;
  reviewCount: number;
} {
  return { rating: 0, reviewCount: 0 };
}

/** Copy genérico bilingüe para productos sin copy curado (la mayoría de CJ). */
export function buildFallbackCopy(product: PublicProduct, lang: Lang): ProductCopy {
  const clean = (product.description || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const en = lang === "en";
  const g = (es: string, enText: string) => (en ? enText : es);
  return {
    hook: productName(product, lang),
    subtitle: g(FALLBACK_SUBTITLE_ES, FALLBACK_SUBTITLE_EN),
    benefits: [
      g(
        "Producto real verificado con stock disponible",
        "Real product verified with stock available"
      ),
      g(
        "Envío con rastreo a México (14-16 días) y Estados Unidos (4-7 días)",
        "Tracked shipping to Mexico (14-16 days) and the United States (4-7 days)"
      ),
      g("Pago seguro procesado por Stripe", "Secure payment processed by Stripe"),
      g(
        "Soporte por escrito: si llega dañado, te reponemos el producto",
        "Written support: if it arrives damaged, we replace the product"
      ),
    ],
    description: productDescription(product, lang).slice(0, 900),
    specs: [
      en
        ? `Package weight: ~${product.weightGrams} g`
        : `Peso del paquete: ~${product.weightGrams} g`,
    ],
    faqs: [
      {
        q: g("¿Cuánto tarda el envío?", "How long does shipping take?"),
        a: g(
          "México: 14 a 16 días hábiles. Estados Unidos: 4 a 7 días. Recibirás número de rastreo.",
          "Mexico: 14 to 16 business days. United States: 4 to 7 days. You'll receive a tracking number."
        ),
      },
      {
        q: g("¿Y si llega dañado?", "What if it arrives damaged?"),
        a: g(
          "Te reponemos el producto sin costo. Escríbenos con foto o video dentro de los primeros 14 días.",
          "We replace the product at no cost. Write to us with a photo or video within the first 14 days."
        ),
      },
    ],
    reviews: [],
    reviewCount: product.reviews || 0,
    reviewAvg: product.rating || 4.5,
  };
}
