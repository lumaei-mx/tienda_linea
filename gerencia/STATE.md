# STATE — GERENCIA tienda_linea

Registro de continuidad del ciclo infinito. Se actualiza al final de cada
ciclo (ver `MANDATE.md` sección 8). El loop lee esto para no empezar ciego.

> NOTA DE CONCILIACIÓN (2026-08-23): el STATE previo decía "pendiente de primer
> ciclo", pero el auto-piloto ya ejecutó Avances 1–6 (bitácora en chat Telegram
> del dueño). Este STATE se actualiza a la realidad operativa para no repetir trabajo.

## Estado real del comercio (al cierre de este ciclo)
- Tienda VIVA en https://www.lumaei.com (Next.js + Stripe + Vercel + Redis/CJ).
- Catálogo: 11 productos CJ activos (modelo cliente-paga, $0 inversión).
- Embudo verificado COMPRABLE en este ciclo (Playwright, sin errores de consola):
  home → PDP → carrito → checkout (Stripe listo, conversión USD↔MXN en vivo).
- Ventas: 1 venta real reportada (Avance 4: $14.76 USD, US). Pedidos locales
  solo muestran 1 test de afiliado en pending_payment (prod usa otra DB).
- Afiliados: atribución 15% ganancia neta en producción (?ref / ?affiliateRef).
- Lead magnet: /guia/5-gadgets + código LUMAI10 (10% MX/US, sin mínimo).
- 5 reels listos en public/tiktok/ para publicar (BLOQUEADOS, ver gates).

## Último ciclo (2026-08-23 — ciclo 2)
- Acción ejecutada (todas $0 / cliente-paga, sin gasto):
  1. DEPLOY SEO: el commit `409a1bc` (JSON-LD Product en fichas) se rebasó sobre
     el avance del auto-pilot (`841c9b5`, fix etiqueta garantía 90 días), build
     lint+typecheck OK, y se promovió a producción (`0503bb6`).
     Verificado en vivo: `application/ld+json` presente en PDP de producción →
     mejor descubrimiento orgánico (el cuello real sigue siendo TRÁFICO).
  2. BENCHMARKING continuo (proveedores/plataformas/competencia):
     - CJ Dropshipping sigue óPTIMO para presupuesto $0 ($0/mes, paga por
       unidad). Alternativas (Zendrop/Spocket/AutoDS) exigen suscripción
       $24–40/mes → FUERA de presupuesto cero. Se mantiene CJ. EPROLO como
       respaldo gratuito si CJ falla en QC/plazos.
     - Competencia gadgets: nicho altamente competitivo, márgenes a presión;
       nuestro modelo (cliente-paga, sin inversión) es correcto. Mercado MX
       e-commerce creciendo; dropshipping legal con RFC/IVA/factura.
     - Plataforma: Next.js+Vercel (ya nuestro) evita fees de Shopify; riesgo
       nota: Vercel tuvo brecha de secrets abr-2026 → recomendar verificar que
       el plan cubre uso comercial y poner spend cap (ver pendientes).
  3. VERIFICACIÓN envío gratis: regla = `freeShippingMinQty:2` OR
     `subtotal ≥ $49`. El home ya dice "desde 2 piezas · o desde $49" →
     consistente. El caso "gratis con 1 ítem" del ciclo 1 era el umbral $49
     disparándose, NO un bug. Cerrado sin cambios de código.
- Resultado: SEO en producción (orgánico reforzado); proveedor confirmado;
  regla de envío validada; ningún gasto.

## Gates del dueño (NO económicos, pero BLOQUEAN progreso real)
- [ ] PUBLICAR REELS: pasar @lumaei.mx a Business + 2FA en teléfono del dueño
      para subir los 5 reels listos en public/tiktok/. (Solicitado en Avances 4–6.)
- [ ] CORREOS: faltan GMAIL_USER y GMAIL_APP_PASSWORD en Vercel → los correos
      transaccionales (confirmación de pedido y lead magnet) salen "skipped".
      (Config sin costo; solicitan en Avance 5.)

## Próximas acciones sugeridas (el ciclo elige la de mayor valor)
- [x] Inventariar estado actual del comercio.
- [x] Auditar conversión (homepage/PDP/carrito/checkout).
- [x] Definir primer vector de captación sin presupuesto (TikTok orgánico).
- [x] JSON-LD SEO en fichas → DESPLEGADO en producción (ciclo 2).
- [x] Verificar regla de envío gratis → consistente, sin bug (ciclo 2).
- [ ] Crear 1 pieza de contenido/blog orgánico (tráfico, $0) apalancando
     SALES_BOOKS_OPERATIONAL_KNOWLEDGE.md (ganchos CRO, $100M Leads/Offers).
- [ ] Continuar benchmarking: monitorear precios CJ vs competencia y vigilar
     plataformas alternativas cada ciclo (indefinido).
- [ ] Detectar clientes/ventas y arrancar mensajería (WA tienda +1 408 422 3904).
- [ ] VERIFICAR plan Vercel: confirmar que cubre uso comercial (Hobby es
     no-comercial) y configurar spend cap; si requiere Pro ($20/mo) → ir a
     AUTHORIZATION_QUEUE como solicitud económica (no ejecutar sin aprobación).

## Pendientes de autorización económica
- (ninguno — todo este ciclo es $0 / modelo cliente-paga CJ Dropshipping)

## Notas
- Presupuesto: CERO. Solo modelo cliente-paga (CJ Dropshipping) autorizado.
- Canal de reporte/solicitud: Telegram, ver PROTOCOL.md.
- Reporte de milestone + gates enviados al dueño vía Telegram este ciclo.
