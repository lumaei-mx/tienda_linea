import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  // El redirect apex -> www vive en la zona de Cloudflare, NO aquí.
  // Declararlo con `has: [{ type: "host" }]` producía un bucle infinito en
  // producción: OpenNext emitía el destino con el placeholder literal
  // (`https://www.lumaei.com/:path*`) y además la condición de host también
  // casaba con `www`, así que TODA la tienda respondía 308 hacia sí misma.
  // El apex ni siquiera está enrutado a este worker (responde 404), de modo
  // que el redirect era código muerto con capacidad de tumbar el sitio.
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "**.aliyuncs.com" },
      { protocol: "https", hostname: "**.cjdropshipping.com" },
      { protocol: "https", hostname: "cf.cjdropshipping.com" },
      { protocol: "https", hostname: "oss.cjdropshipping.com" },
    ],
  },
};

export default nextConfig;

import('@opennextjs/cloudflare').then(m => m.initOpenNextCloudflareForDev());
