import type { Product } from "@/lib/types";

/**
 * Catálogo inicial optimizado para MX (primario) y US (secundario).
 * Proveedor: CJ Dropshipping. Costos y márgenes son estimados de mercado 2026.
 *
 * Criterios: liviano, margen bruto >55% en MX, ticket $250–$900 MXN,
 * demanda TikTok/Amazon, bajo índice de devolución, fácil de demostrar en video.
 */
export const products: Product[] = [
  {
    id: "p1",
    slug: "organizador-cocina-giratorio",
    name: "Organizador Giratorio 360° para Cocina",
    description:
      "Bandeja giratoria de 2 niveles para especias, frascos y condimentos. Base antideslizante, ideal para despensa o refrigerador. Ahorra espacio y luce premium en reels de organización.",
    category: "Cocina",
    images: [
      "https://images.unsplash.com/photo-1556911220-bff31c812dba?w=800&q=80",
      "https://images.unsplash.com/photo-1588854337221-4cf9fa96059c?w=800&q=80",
    ],
    priceUsd: 20.99,
    costUsd: 4.8,
    shippingMxUsd: 3.2,
    shippingUsUsd: 2.4,
    weightGrams: 420,
    cjSku: "CJ-KIT-ORG360",
    cjProductId: "CJ0001",
    stock: 500,
    tags: ["organización", "viral", "cocina"],
    rating: 0,
    reviews: 0,
    featured: true,
    active: false,
  },
  {
    id: "p2",
    slug: "picadora-manual-rapida",
    name: "Picadora Manual Rápida 5 Cuchillas",
    description:
      "Pica verduras, nueces y hierbas en segundos sin electricidad. Cuchillas de acero inoxidable, vaso 900 ml y tapa hermética. Perfecto para meal prep y cocinas pequeñas.",
    category: "Cocina",
    images: [
      "https://images.unsplash.com/photo-1596797038530-2c107229654b?w=800&q=80",
      "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80",
    ],
    priceUsd: 17.99,
    costUsd: 3.9,
    shippingMxUsd: 2.9,
    shippingUsUsd: 2.1,
    weightGrams: 380,
    cjSku: "CJ-KIT-CHOP5",
    cjProductId: "CJ0002",
    stock: 800,
    tags: ["cocina", "gadget", "meal-prep"],
    rating: 0,
    reviews: 0,
    featured: true,
    active: false,
  },
  {
    id: "p3",
    slug: "luz-led-sensor-closet",
    name: "Barra LED con Sensor de Movimiento",
    description:
      "Luz recargable USB-C con sensor PIR para closet, cocina o pasillo. Magnética, 3 temperaturas de color y hasta 30 días de batería. Instalación sin cables ni taladro.",
    category: "Hogar",
    images: [
      "https://images.unsplash.com/photo-1524484485831-a92ffc0de03f?w=800&q=80",
      "https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=800&q=80",
    ],
    priceUsd: 15.99,
    costUsd: 3.4,
    shippingMxUsd: 2.5,
    shippingUsUsd: 1.9,
    weightGrams: 180,
    cjSku: "CJ-HOM-LED30",
    cjProductId: "CJ0003",
    stock: 1200,
    tags: ["hogar", "led", "sensor"],
    rating: 0,
    reviews: 0,
    featured: true,
    active: false,
  },
  {
    id: "p4",
    slug: "aspiradora-portatil-auto",
    name: "Aspiradora Portátil para Auto 9000Pa",
    description:
      "Mini aspiradora inalámbrica con 3 boquillas, filtro HEPA lavable y carga USB-C. Ideal para auto, sofá y teclado. Alta demanda en México por flotas y rideshare.",
    category: "Auto",
    images: [
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80",
      "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=800&q=80",
    ],
    priceUsd: 30.99,
    costUsd: 7.5,
    shippingMxUsd: 4.1,
    shippingUsUsd: 3.2,
    weightGrams: 650,
    cjSku: "CJ-CAR-VAC9K",
    cjProductId: "CJ0004",
    stock: 400,
    tags: ["auto", "limpieza", "gadget"],
    rating: 0,
    reviews: 0,
    featured: true,
    active: false,
  },
  {
    id: "p5",
    slug: "soporte-celular-magnetico-auto",
    name: "Soporte Magnético Celular para Auto",
    description:
      "Base magnética N52 para ventilación o tablero. Compatible con iPhone y Android (incluye placas metálicas). Rotación 360° y sujeción firme en baches.",
    category: "Auto",
    images: [
      "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&q=80",
      "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800&q=80",
    ],
    priceUsd: 13.99,
    costUsd: 2.8,
    shippingMxUsd: 2.2,
    shippingUsUsd: 1.6,
    weightGrams: 120,
    cjSku: "CJ-CAR-MAG360",
    cjProductId: "CJ0005",
    stock: 1500,
    tags: ["auto", "celular", "accesorio"],
    rating: 0,
    reviews: 0,
    featured: false,
    active: false,
  },
  {
    id: "p6",
    slug: "parches-granos-hidrocoloides",
    name: "Parches Hidrocoloides para Granos (72 pzas)",
    description:
      "Parches ultra delgados día/noche que absorben impurezas y disimulan granos. Tendencia beauty en TikTok y alta recompra. Empaque premium listo para regalo.",
    category: "Belleza",
    images: [
      "https://images.unsplash.com/photo-1596755389378-c31d21fd1273?w=800&q=80",
      "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800&q=80",
    ],
    priceUsd: 9.99,
    costUsd: 1.9,
    shippingMxUsd: 1.8,
    shippingUsUsd: 1.4,
    weightGrams: 60,
    cjSku: "CJ-BEA-PIMP72",
    cjProductId: "CJ0006",
    stock: 2000,
    tags: ["belleza", "skincare", "recompra"],
    rating: 0,
    reviews: 0,
    featured: true,
    active: false,
  },
  {
    id: "p7",
    slug: "cepillo-vapor-mascotas",
    name: "Cepillo Steamer 3-en-1 para Mascotas",
    description:
      "Vapor + peinado + limpieza de pelo suelto. Reduce muda hasta 90% en uso regular. Ideal para perros y gatos de pelo medio/largo. Contenido UGC fácil de crear.",
    category: "Mascotas",
    images: [
      "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800&q=80",
      "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=800&q=80",
    ],
    priceUsd: 25.99,
    costUsd: 6.2,
    shippingMxUsd: 3.5,
    shippingUsUsd: 2.8,
    weightGrams: 480,
    cjSku: "CJ-PET-STM3",
    cjProductId: "CJ0007",
    stock: 350,
    tags: ["mascotas", "viral", "limpieza"],
    rating: 0,
    reviews: 0,
    featured: false,
    active: false,
  },
  {
    id: "p8",
    slug: "dispensador-jabon-espuma",
    name: "Dispensador Automático de Jabón Espuma",
    description:
      "Sensor infrarrojo sin contacto, recargable USB-C, 4 niveles de dosis. Higiénico para baño y cocina. Diseño minimalista blanco/negro.",
    category: "Hogar",
    images: [
      "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800&q=80",
      "https://images.unsplash.com/photo-1620626011761-996317b8d101?w=800&q=80",
    ],
    priceUsd: 21.99,
    costUsd: 5.1,
    shippingMxUsd: 3.0,
    shippingUsUsd: 2.5,
    weightGrams: 350,
    cjSku: "CJ-HOM-SOAP",
    cjProductId: "CJ0008",
    stock: 600,
    tags: ["hogar", "baño", "sensor"],
    rating: 0,
    reviews: 0,
    featured: false,
    active: false,
  },
];

export function getProductBySlug(slug: string) {
  return products.find((p) => p.slug === slug && p.active);
}

export function getProductById(id: string) {
  return products.find((p) => p.id === id && p.active);
}

export function getFeaturedProducts() {
  return products.filter((p) => p.featured && p.active);
}

export function getCategories() {
  return [...new Set(products.filter((p) => p.active).map((p) => p.category))];
}
