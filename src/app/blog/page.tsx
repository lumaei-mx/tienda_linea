import type { Metadata } from "next";
import Link from "next/link";

export const dynamic = "force-static";

const POSTS = [
  {
    slug: "/blog/regalos-para-ella-2026",
    title:
      "Regalos para ella 2026: detalles bonitos que sí va a usar (y no terminan en el cajón)",
    description:
      "Proyector de estrellas, rodillo de hielo facial, parches de colágeno, luces con sensor y más. Precios reales y link directo al catálogo Lumaei.",
  },
  {
    slug: "/blog/regalos-gadgets-hogar",
    title:
      "Regalos y gadgets prácticos para el hogar en 2026 (lo que realmente funciona)",
    description:
      "Guía honesta de gadgets útiles para el hogar que resuelven problemas reales: luces LED con sensor, organizadores, cargadores y más.",
  },
  {
    slug: "/blog/regalos-para-el-2026",
    title:
      "Regalos para él 2026: gadgets útiles que sí va a usar (no terminan en el cajón)",
    description:
      "Cargador inalámbrico de auto, impresora térmica, picadora, organizador de especias, luces con sensor y más. Precios reales y link directo al catálogo Lumaei.",
  },
];

export const metadata: Metadata = {
  metadataBase: new URL("https://www.lumaei.com"),
  title: "Guías y regalos · Lumaei",
  description:
    "Guías de compra honestas de Lumaei: regalos, gadgets y detalles que resuelven problemas reales, con precios y link directo al catálogo.",
  alternates: { canonical: "https://www.lumaei.com/blog" },
  openGraph: {
    title: "Guías y regalos · Lumaei",
    description:
      "Guías de compra honestas de Lumaei: regalos, gadgets y detalles que resuelven problemas reales.",
    url: "https://www.lumaei.com/blog",
    siteName: "Lumaei",
    type: "website",
    locale: "es_MX",
  },
};

export default function BlogIndex() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-dark">
        Guías Lumaei
      </p>
      <h1 className="mt-3 font-serif text-4xl leading-tight text-brown sm:text-5xl">
        Guías y regalos que resuelven problemas reales
      </h1>
      <p className="mt-4 text-lg leading-relaxed text-brown-soft">
        No vendemos aparatos: curamos piezas pequeñas que usas todos los días.
        Cada guía reúne las que más diferencia hacen, con precio y link directo.
      </p>

      <div className="mt-10 space-y-6">
        {POSTS.map((post) => (
          <Link
            key={post.slug}
            href={post.slug}
            className="block rounded-2xl border border-gold/20 bg-ivory p-6 transition hover:border-gold-dark"
          >
            <h2 className="font-serif text-2xl text-brown">{post.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-brown-soft">
              {post.description}
            </p>
            <span className="mt-3 inline-block text-sm font-semibold text-gold-dark">
              Leer guía →
            </span>
          </Link>
        ))}
      </div>

      <div className="mt-10 rounded-2xl bg-cream-dark p-6 text-center">
        <p className="font-serif text-xl text-brown">¿Quieres ver todo?</p>
        <Link
          href="/productos"
          className="mt-4 inline-block rounded-full bg-gold px-6 py-2.5 text-sm font-semibold text-brown transition hover:bg-gold-dark"
        >
          Ver el catálogo completo →
        </Link>
      </div>
    </main>
  );
}
