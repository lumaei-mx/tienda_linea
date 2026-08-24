"use client";

import Image from "next/image";
import { settings } from "@/lib/settings";
import { useCart } from "@/lib/cart-store";
import { t } from "@/lib/i18n";
import { STORE_IDENTITY } from "@/lib/identity";

export function Footer() {
  const lang = useCart((s) => s.lang);
  return (
    <footer className="mt-auto border-t border-gold/20 bg-brown text-ivory">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:grid-cols-4">
        <div>
          <Image
            src="/logo-lumaei-sm.png"
            alt="Lumaei"
            width={200}
            height={145}
            className="h-28 w-auto rounded-lg bg-ivory object-contain p-2"
          />
          <p className="mt-4 max-w-[15rem] text-xs leading-relaxed text-ivory/70">
            {lang === "es"
              ? `Operado por ${STORE_IDENTITY.responsibleName}, ${STORE_IDENTITY.entityTypeEs} · RFC ${STORE_IDENTITY.rfc} · ${STORE_IDENTITY.onlineNoteEs} · ${STORE_IDENTITY.domicilePublic}`
              : `Operated by ${STORE_IDENTITY.responsibleName}, ${STORE_IDENTITY.entityTypeEn} · RFC ${STORE_IDENTITY.rfc} · ${STORE_IDENTITY.onlineNoteEn} · ${STORE_IDENTITY.domicilePublic}`}
          </p>
        </div>
        <div>
          <p className="font-serif text-lg text-gold-light">
            {t("footerMarkets", lang)}
          </p>
          <ul className="mt-3 space-y-2 text-sm text-ivory/75">
            <li>{t("footerMarkets1", lang)}</li>
            <li>{t("footerMarkets2", lang)}</li>
            <li>{t("footerMarkets3", lang)}</li>
          </ul>
        </div>
        <div>
          <p className="font-serif text-lg text-gold-light">
            {t("footerHelp", lang)}
          </p>
          <ul className="mt-3 space-y-2 text-sm text-ivory/75">
            <li><a href="/envios" className="transition hover:text-gold-light">{t("footerHelp1", lang)}</a></li>
            <li><a href="/devoluciones" className="transition hover:text-gold-light">{t("footerHelp2", lang)}</a></li>
            <li><a href="/privacidad" className="transition hover:text-gold-light">{t("footerHelp3", lang)}</a></li>
            <li><a href="/sobre-nosotros" className="transition hover:text-gold-light">{t("footerHelp4", lang)}</a></li>
            <li><a href="/blog" className="transition hover:text-gold-light">Guías y regalos</a></li>
          </ul>
        </div>
        <div>
          <p className="font-serif text-lg text-gold-light">
            {t("footerContact", lang)}
          </p>
          <ul className="mt-3 space-y-2 text-sm text-ivory/75">
            <li><a href="mailto:lumaeiMX@gmail.com" className="transition hover:text-gold-light">lumaeiMX@gmail.com</a></li>
            <li><a href="https://wa.me/14084223904" target="_blank" rel="noopener" className="transition hover:text-gold-light">{t("footerWhatsApp", lang)} +1 408 422 3904</a></li>
            <li>{t("footerTracked", lang)}</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 py-4 text-center text-xs tracking-[0.2em] text-gold/80">
        © {new Date().getFullYear()} {settings.brandName.toUpperCase()} ·{" "}
        {t("footerRights", lang)}
      </div>
    </footer>
  );
}
