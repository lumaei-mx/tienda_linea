import type { Metadata } from "next";
import { Cormorant_Garamond, DM_Sans, Geist_Mono } from "next/font/google";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { FreeShippingBar } from "@/components/FreeShippingBar";
import { LangHydrate } from "@/components/LangHydrate";
import { TikTokPixel } from "@/components/TikTokPixel";
import { EmailCapturePopup } from "@/components/EmailCapturePopup";
import { Script } from "next/script";
import { settings } from "@/lib/settings";
import { STORE_IDENTITY } from "@/lib/identity";
import { readStoreSettings } from "@/lib/settings-db";
import { detectLangServer } from "@/lib/i18n";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const lang = await detectLangServer();
  const es = lang === "es";
  return {
    metadataBase: new URL("https://www.lumaei.com"),
    title: es ? `${settings.brandName} | Tienda Online` : `${settings.brandName} | Online Store`,
    description: es
      ? "Lumaei — tienda online de piezas seleccionadas. Envíos a México y Estados Unidos. Experiencia premium, fulfillment automatizado."
      : "Lumaei — online shop of hand-picked pieces. Shipping to Mexico and the United States. Premium experience, automated fulfillment.",
    openGraph: {
      title: es ? "Lumaei | Tienda Online" : "Lumaei | Online Store",
      description: es
        ? "Piezas seleccionadas con envíos a México y Estados Unidos."
        : "Hand-picked pieces shipped to Mexico and the United States.",
      url: "https://www.lumaei.com",
      siteName: "Lumaei",
      images: [{ url: "/og-image.png", width: 1200, height: 630 }],
      type: "website",
      locale: es ? "es_MX" : "en_US",
    },
    twitter: {
      card: "summary_large_image",
      title: es ? "Lumaei | Tienda Online" : "Lumaei | Online Store",
      description: es
        ? "Piezas seleccionadas con envíos a México y Estados Unidos."
        : "Hand-picked pieces shipped to Mexico and the United States.",
      images: ["/og-image.png"],
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const lang = await detectLangServer();
  const s = await readStoreSettings();
  const orgLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Lumaei",
    url: "https://www.lumaei.com",
    logo: "https://www.lumaei.com/logo-lumaei-sm.png",
    description:
      lang === "es"
        ? "Tienda online de piezas seleccionadas. Envíos a México y Estados Unidos."
        : "Online shop of hand-picked pieces. Shipping to Mexico and the United States.",
    founder: { "@type": "Person", name: STORE_IDENTITY.responsibleName },
    address: {
      "@type": "PostalAddress",
      addressLocality: "Tijuana",
      addressRegion: "BC",
      addressCountry: "MX",
    },
    areaServed: ["MX", "US"],
    sameAs: ["https://www.tiktok.com/@lumaei.mx"],
  };
  return (
    <html
      lang={lang === "es" ? "es-MX" : "en-US"}
      className={`${cormorant.variable} ${dmSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <meta
          name="tiktok-developers-site-verification"
          content="9XsM8ZCc87GJXulDhdTcNL8JKUMFF6FN"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgLd) }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-cream text-brown">
        <TikTokPixel />
        {process.env.NEXT_PUBLIC_GA4_ID ? (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA4_ID}`}
              strategy="afterInteractive"
            />
            <Script id="ga4" strategy="afterInteractive">{`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${process.env.NEXT_PUBLIC_GA4_ID}');`}</Script>
          </>
        ) : null}
        {process.env.NEXT_PUBLIC_FB_PIXEL_ID ? (
          <Script id="fb-pixel" strategy="afterInteractive">{`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${process.env.NEXT_PUBLIC_FB_PIXEL_ID}');fbq('track','PageView');`}</Script>
        ) : null}
        <FreeShippingBar
          freeMx={s.freeShippingMxUsd}
          freeUs={s.freeShippingUsd}
        />
        <LangHydrate />
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <EmailCapturePopup />
      </body>
    </html>
  );
}
