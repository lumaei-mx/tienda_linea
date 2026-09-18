"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart-store";
import { t } from "@/lib/i18n";

export default function ContactoPage() {
  const lang = useCart((s) => s.lang);
  return (
    <div className="mx-auto max-w-3xl px-4 py-14">
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold-dark">
        {t("helpEyebrow", lang)}
      </p>
      <h1 className="mt-2 font-serif text-4xl font-semibold text-brown">
        {t("contTitle", lang)}
      </h1>

      <div className="mt-8 space-y-5 leading-relaxed text-brown-soft">
        <p>{t("contIntro", lang)}</p>

        <div className="rounded-2xl border border-gold/20 bg-ivory p-6">
          <p className="text-sm font-semibold text-brown">{t("contEmail", lang)}</p>
          <a href="mailto:lumaeiMX@gmail.com" className="text-gold-dark underline">
            lumaeiMX@gmail.com
          </a>
        </div>

        <div className="rounded-2xl border border-gold/20 bg-ivory p-6">
          <p className="text-sm font-semibold text-brown">
            {lang === "es" ? "Asistente 24/7" : "24/7 assistant"}
          </p>
          <button
            type="button"
            onClick={() => window.dispatchEvent(new Event("lumaei:open-support"))}
            className="text-gold-dark underline"
          >
            {lang === "es" ? "Abrir el chat de soporte" : "Open the support chat"}
          </button>
          <p className="mt-1 text-xs text-brown-soft">
            {lang === "es"
              ? "Respuesta inmediata, a cualquier hora. Si tu caso necesita una decisión de una persona, se atiende el mismo día hábil."
              : "Instant reply, any time. If your case needs a person's decision, it's handled the same business day."}
          </p>
        </div>

        <p className="text-sm">{t("contHours", lang)}</p>

        <div className="rounded-2xl border border-gold/25 bg-brown p-6 text-ivory">
          <p className="font-serif text-xl font-semibold">
            {lang === "es" ? "Chat 24/7 — respuesta inmediata" : "24/7 chat — instant reply"}
          </p>
          <p className="mt-1 text-sm opacity-80">
            {lang === "es"
              ? "Rastrea tu pedido, resuelve dudas de envíos, garantía o pagos sin esperar."
              : "Track your order, solve shipping, warranty or payment questions without waiting."}
          </p>
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent("lumaei:open-support"))}
            className="mt-4 rounded-full bg-gold px-6 py-2.5 text-sm font-semibold text-brown transition hover:bg-gold-light"
          >
            {lang === "es" ? "Abrir chat 24/7 💬" : "Open 24/7 chat 💬"}
          </button>
        </div>

        <div className="space-y-3">
          <p className="text-sm font-semibold text-brown">
            {lang === "es" ? "Preguntas frecuentes" : "Frequently asked questions"}
          </p>
          {[
            {
              q: lang === "es" ? "¿Dónde está mi pedido?" : "Where is my order?",
              a: lang === "es"
                ? "Pega tu número de pedido en el chat y te digo el estado al instante."
                : "Paste your order number in the chat for an instant status.",
              href: "/productos",
              link: lang === "es" ? "Abrir chat" : "Open chat",
              chat: true,
            },
            {
              q: lang === "es" ? "¿Cuánto tarda el envío?" : "How long does shipping take?",
              a: lang === "es"
                ? "México 14-16 días, EE.UU. 4-7 días. Gratis desde 2 piezas o $49."
                : "Mexico 14-16 days, US 4-7 days. Free from 2 pieces or $49.",
              href: "/envios",
              link: "/envios",
              chat: false,
            },
            {
              q: lang === "es" ? "¿Qué pasa si llega dañado?" : "What if it arrives damaged?",
              a: lang === "es"
                ? "Reposición sin costo dentro de 25 días con foto o video."
                : "Free replacement within 25 days with photo or video.",
              href: "/devoluciones",
              link: "/devoluciones",
              chat: false,
            },
            {
              q: lang === "es" ? "¿Cómo pago o si falló mi pago?" : "How do I pay / if my payment failed?",
              a: lang === "es"
                ? "Pagos con Stripe en MXN o USD. Reintenta o escríbenos con tu correo de compra."
                : "Stripe payments in MXN or USD. Retry or email us with your purchase email.",
              href: "/checkout",
              link: "/checkout",
              chat: false,
            },
          ].map((f) => (
            <div key={f.q} className="rounded-2xl border border-gold/20 bg-ivory p-4">
              <p className="text-sm font-semibold text-brown">{f.q}</p>
              <p className="mt-1 text-sm">{f.a}</p>
              {f.chat ? (
                <button
                  type="button"
                  onClick={() => window.dispatchEvent(new CustomEvent("lumaei:open-support"))}
                  className="mt-1 text-sm font-semibold text-gold-dark underline"
                >
                  {f.link} →
                </button>
              ) : (
                <Link href={f.href} className="mt-1 inline-block text-sm font-semibold text-gold-dark underline">
                  {f.link} →
                </Link>
              )}
            </div>
          ))}
        </div>
      </div>

      <Link
        href="/productos"
        className="mt-10 inline-block rounded-full bg-brown px-6 py-3 text-sm font-semibold text-ivory transition hover:bg-gold-dark"
      >
        {t("keepShopping", lang)}
      </Link>
    </div>
  );
}
