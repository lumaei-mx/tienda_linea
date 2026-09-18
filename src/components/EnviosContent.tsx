"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart-store";
import { t } from "@/lib/i18n";
import { formatPrice } from "@/lib/money";

export function EnviosContent({
  freeMx,
  freeUs,
}: {
  freeMx: number;
  freeUs: number;
}) {
  const lang = useCart((s) => s.lang);

  return (
    <div className="mx-auto max-w-3xl px-4 py-14">
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold-dark">
        {t("helpEyebrow", lang)}
      </p>
      <h1 className="mt-2 font-serif text-4xl font-semibold text-brown">
        {t("shipTitle", lang)}
      </h1>

      <div className="mt-8 space-y-5 leading-relaxed text-brown-soft">
        <p>{t("shipIntro", lang)}</p>

        <h2 className="font-serif text-2xl font-semibold text-brown">
          {t("shipTimesT", lang)}
        </h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>{t("shipCountryMx", lang)}</strong>{" "}
            {t("shipTimesMx", lang)}
          </li>
          <li>
            <strong>{t("shipCountryUs", lang)}</strong>{" "}
            {t("shipTimesUs", lang)}
          </li>
        </ul>

        <h2 className="font-serif text-2xl font-semibold text-brown">
          {t("shipCostT", lang)}
        </h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            {t("shipFreeLine", lang)
              .replace("{mx}", formatPrice(freeMx, lang))
              .replace("{us}", formatPrice(freeUs, lang))}
          </li>
          <li>{t("shipFlatLine", lang)}</li>
          <li>{t("shipUsdLine", lang)}</li>
        </ul>

        <h2 className="font-serif text-2xl font-semibold text-brown">
          {t("shipDutyT", lang)}
        </h2>
        <p>{t("shipDuty1", lang)}</p>
        <p>{t("shipDuty2", lang)}</p>
        <p>{t("shipDuty3", lang)}</p>

        <h2 className="font-serif text-2xl font-semibold text-brown">
          {t("shipLateT", lang)}
        </h2>
        <p>
          {t("shipLate", lang)
            .replace("{email}", "@@EMAIL@@")
            .replace("{whatsapp}", "@@WHATSAPP@@")
            .split(/@@(?:EMAIL|WHATSAPP)@@/)
            .reduce<(string | React.ReactNode)[]>((acc, part, i, arr) => {
              acc.push(part);
              if (i < arr.length - 1) {
                acc.push(
                  i === 0 ? (
                    <a
                      key="email"
                      href="mailto:lumaeiMX@gmail.com"
                      className="text-gold-dark underline"
                    >
                      lumaeiMX@gmail.com
                    </a>
                  ) : (
                    <a
                      key="whatsapp"
                      href="/contacto"
                      className="text-gold-dark underline"
                    >
                      {lang === "es" ? "chat de soporte" : "support chat"}
                    </a>
                  )
                );
              }
              return acc;
            }, [])}
        </p>
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
