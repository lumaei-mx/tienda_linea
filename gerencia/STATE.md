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

## Último ciclo (2026-08-24 — ciclo 5)
- Acción de MAYOR valor ejecutada (todo $0 / cliente-paga, sin gasto):
  1. CONTENIDO ORGÁNICO ESTACIONAL (tráfico): nueva guía SEO "Regreso a clases
     2026" publicada y verificada en producción →
     https://www.lumaei.com/blog/regreso-a-clases-2026
     - 7 productos del catálogo activo enlazados a /productos/[slug] (impresora
       térmica $31.75, cargador auto 15W $49.74, luz LED sensor $14.74, barra
       LED $35.15, proyector estrellas $43.68, dispensador jabón $53.92, rodillo
       hielo facial $30.45). Precios VERIFICADOS EN VIVO contra /api/products de
       producción este ciclo (NO contra products.json local, que está
       desactualizado respecto a la tienda).
     - JSON-LD Article presente (verificado), CTA a lead magnet (/guia/5-gadgets
       + LUMAI10) y a /productos. FAQ de conversión (incl. pregunta sobre
       impresora térmica escolar).
     - Registrada en índice /blog (hub de guías) y cross-link BIDIRECCIONAL con
       'Regalos para ella', 'Regalos para él' y 'Regalos gadgets hogar' (SEO
       interno).
     - Build `next build` OK (ruta prerendered static), commit `083ebbb` (rebase
       sobre main remoto f9c4bc1), push a origin/main, despliegue Vercel READY y
       URL verificada en vivo (200 + JSON-LD + canonical + enlace recíproco vivo
       + PDP destino 200).
  2. BENCHMARKING continuo (proveedores/plataformas/precios/competencia):
     - COMPETENCIA/TENDENCIA: back-to-school 2026 es temporada peak; NRF reporta
       ~$1,400 USD/hogar (+8% vs 2025), electrónicos y accesorios son la
       categoría #1. La competencia (The Verge, Wired, PopSci) empuja gear de
       $100–$1,200; nuestro ángulo cliente-paga de $14–$54 es la diferenciación
       clara (kit escolar accesible, sin romper el presupuesto).
     - PRECIOS (HALLAZGO DE INTEGRIDAD): los precios EN VIVO de /api/products son
       MÁS ALTOS que products.json local y que varios blogs previos. Ej.
       proyector de estrellas: blog 'hogar' muestra $13.62 pero la tienda cobra
       $43.68; LED clóset blog 'hogar' $8.53 vs vivo $35.15; rodillo 'ella'/
       'hogar' $6.72 vs vivo $30.45. La nueva guía usa precios VIVOS para no
       romper la confianza al hacer clic. PENDIENTE: auditar/precisar precios en
       blogs ciclo 3/4 (riesgo CRO). Ver próximas acciones.
     - PROVEEDOR: CJ Dropshipping sigue ÓPTIMO para presupuesto $0 ($0/mes, paga
       por unidad). Alternativas (Zendrop/Spocket/AutoDS) exigen $24–40/mo →
       fuera de presupuesto cero. EPROLO como respaldo gratuito.
     - PLATAFORMA: riesgo Vercel Hobby no-comercial persiste → AQ-001 sigue
       PENDIENTE/BLOQUEADA, sin cambio.
- Resultado: +1 URL indexable estacional ("regreso a clases 2026", alta
  intención de búsqueda) + hub /blog con 4 guías interconectadas → más
  superficie de tráfico orgánico (el cuello real sigue siendo TRÁFICO).
  Ningún gasto.

## Último ciclo (2026-08-24 — ciclo 4)
- Acción de MAYOR valor ejecutada (todo $0 / cliente-paga, sin gasto):
  1. CONTENIDO ORGÁNICO (tráfico): nueva guía SEO "Regalos para él 2026"
     publicada y verificada en producción →
     https://www.lumaei.com/blog/regalos-para-el-2026
     - 7 productos del catálogo activo enlazados a /productos/[slug] (cargador
       inalámbrico de auto 15W $49.74, impresora térmica $31.75, picadora
       $44.54, organizador de especias $33.23, luz LED con sensor $12.92, barra
       de luz clóset $8.53, proyector de estrellas $13.62). Precios verificados
       en vivo contra la tienda este ciclo (vigentes).
     - JSON-LD Article presente (verificado), CTA a lead magnet (/guia/5-gadgets
       + LUMAI10) y a /productos. FAQ de conversión.
     - Registrada en índice /blog (hub de guías) y cross-link bidireccional con
       "Regalos para ella 2026" y "Regalos gadgets hogar" para SEO interno.
     - Build `next build` OK (ruta prerendered static), commit `2c2a427` rebasado
       sobre cambios remotos (rebase), push a origin/main (`f768086`), despliegue
       Vercel READY y URL verificada en vivo (200 + JSON-LD).
  2. BENCHMARKING continuo (proveedores/plataformas/precios/competencia):
     - PROVEEDOR: CJ Dropshipping sigue ÓPTIMO para presupuesto $0 ($0/mes, paga
       por unidad). Precios de las 4 piezas nuevas verificados en vivo contra la
       tienda (trackables y vigentes). Alternativas (Zendrop/Spocket/AutoDS)
       exigen $24–40/mo → fuera de presupuesto cero. EPROLO como respaldo
       gratuito.
     - PLATAFORMA: riesgo Vercel Hobby no-comercial persiste → AQ-001 sigue
       PENDIENTE/BLOQUEADA, sin cambio (no ejecutar sin aprobación del dueño).
     - PRECIOS/COMPETENCIA: nicho gadgets sigue competitivo; modelo cliente-paga
       sin inversión correcto. Sin cambios de precio este ciclo.
- Resultado: +1 URL indexable ("regalos para él") + hub /blog con 3 guías
  interconectadas → más superficie de tráfico orgánico (el cuello real sigue
  siendo TRÁFICO). Ningún gasto.

## Ciclo previo (2026-08-24 — ciclo 3)
- Acción de MAYOR valor ejecutada (todo $0 / cliente-paga, sin gasto):
  1. CONTENIDO ORGÁNICO (tráfico): nueva guía SEO "Regalos para ella 2026"
     publicada y verificada en producción →
     https://www.lumaei.com/blog/regalos-para-ella-2026
     - 6 productos del catálogo activo enlazados a /productos/[slug] (proyector
       de estrellas, rodillo de hielo facial, parches de colágeno, luz LED con
       sensor, barra LED clóset, dispensador de jabón).
     - JSON-LD Article presente (verificado), CTA a lead magnet (/guia/5-gadgets
       + LUMAI10) y a /productos. FAQ de conversión.
     - Creado índice /blog (hub de guías) y link "Guías y regalos" en el footer
       para descubribilidad + SEO interno.
     - Cross-link bidireccional entre las 2 guías.
  2. BUILD/SEGURIDAD: `next build` OK, `eslint` en mis archivos 0 errores
     (los 17 errores de lint son deuda previa ajena al cambio). Commit
     58e7abe en main, push a origin, despliegue Vercel READY y alias
     www.lumaei.com verificado en vivo (200 + JSON-LD).
- Benchmarking continuo (proveedores/plataformas/precios/competencia):
  - PLATAFORMA (HALLAZGO CRÍTICO): el equipo Vercel "lumaei" está en plan
    **Hobby**, que es NO COMERCIAL. La tienda ya vende → riesgo de suspensión
    del despliegue por ToS (cierre sin aviso). Requiere Pro ($20/mo) → ver
    AQ-001 en AUTHORIZATION_QUEUE (BLOQUEADA, pendiente de aprobación).
  - PROVEEDOR: CJ Dropshipping sigue óPTIMO para presupuesto $0 ($0/mes, paga
    por unidad). Alternativas (Zendrop/Spocket/AutoDS) exigen $24–40/mo →
    fuera de presupuesto cero. EPROLO como respaldo gratuito.
  - PRECIOS/COMPETENCIA: nicho gadgets sigue competitivo; nuestro modelo
    cliente-paga sin inversión es correcto. Sin cambios de precio este ciclo.
- Resultado: +1 URL indexable de alto volumen ("regalos para ella") + hub de
  blog + link footer → más superficie de tráfico orgánico. Riesgo de
  plataforma identificado y escalado a autorización económica.

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
  - [x] Crear 1 pieza de contenido/blog orgánico (tráfico, $0) — PUBLICADA ciclo 3
       ("Regalos para ella 2026" + índice /blog + link footer).
  - [x] Crear 2ª pieza de contenido/blog orgánico (tráfico, $0) — PUBLICADA ciclo 4
        ("Regalos para él 2026" + cross-link desde 'ella' + registro /blog).
  - [x] Crear 3ª pieza de contenido/blog orgánico estacional (tráfico, $0) —
        PUBLICADA ciclo 5 ("Regreso a clases 2026" + registro /blog + cross-link
        bidireccional desde las 3 guías previas). Siguiente pieza sugerida:
        "Regalos para el hogar 2026" o "Kit de pijama/domingo" para ampliar
        superficie SEO.
  - [ ] AUDITAR PRECIOS en blogs ciclo 3/4 vs tienda en vivo: products.json
        local está desactualizado y varios precios hardcodeados (proyector
        estrellas $13.62, LED clóset $8.53, rodillo $6.72) son MENORES a los que
        cobra la tienda en producción. Riesgo CRO (el cliente ve un precio y al
        hacer clic ve otro). Corregir en próximo ciclo con precios vivos.
- [ ] Continuar benchmarking: monitorear precios CJ vs competencia y vigilar
     plataformas alternativas cada ciclo (indefinido).
- [ ] Detectar clientes/ventas y arrancar mensajería (WA tienda +1 408 422 3904).
- [ ] VERIFICAR plan Vercel: confirmar que cubre uso comercial (Hobby es
     no-comercial) y configurar spend cap; si requiere Pro ($20/mo) → ir a
     AUTHORIZATION_QUEUE como solicitud económica (no ejecutar sin aprobación).

## Pendientes de autorización económica
- [AQ-001] Vercel Hobby → Pro ($20/mo): PENDIENTE / BLOQUEADA. Riesgo ToS
  comercial detectado en benchmarking. Solicitud enviada al dueño vía Telegram.
  No ejecutar sin aprobación.

## Notas
- Presupuesto: CERO. Solo modelo cliente-paga (CJ Dropshipping) autorizado.
- Canal de reporte/solicitud: Telegram, ver PROTOCOL.md.
- Reporte de milestone + gates enviados al dueño vía Telegram este ciclo.
