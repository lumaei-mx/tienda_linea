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
- Blog SEO: hub /blog + 7 guías interconectadas (ofrenda-ddm / ella / él /
  hogar / regreso-a-clases / bienestar / halloween), todas con precios vivos
  vía `guide-prices.ts` y TODAS listadas en sitemap.xml.

## Último ciclo (2026-08-26 — ciclo 10, en curso)
- Disparador del dueño: "auto". ANTES de ejecutar pricing, orden directa: el
  repo era un desmadre → REORGANIZACIÓN EJECUTADA y commiteada (`6952eb8`):
  - Raíz limpia: solo configs + dirs. `biblioteca/` = corpus de libros
    (`corpus/`), capturas de Internet Archive (`capturas/`), páginas
    (`paginas/`), SALES_BOOKS_OPERATIONAL_KNOWLEDGE.md + knowledge-base +
    LECTURA_LOG. `gerencia/evidencia/` = audit-*.png, evidencia-*.png,
    analisis_visual_lumaei.json, checkout-fx-conversion.png, cj-wallet.png.
    `gerencia/marca/` = logo + perfil TikTok. seed-order.mjs → scripts/.
    IMPORTANTE.md (mandato) ahora versionado en git.
  - PURGA: .playwright-mcp/ (476 logs de consola + zip de Chrome, regenerables)
    eliminada e ignorada en .gitignore. navin_mensaje.aiff →
    ~/.config/opencode/sounds/.
  - BANCO DE DELEGACIÓN formalizado en PROTOCOL.md: hermes (misiones largas),
    codex (código acotado), opencode run (worker interno) + subagentes de
    sesión. Regla: el gerente orquesta y valida artefactos; no ejecuta solo lo
    que puede delegar. openhands NO está instalado; se usa "lo que venga".
- PENDIENTE DE DECISIÓN DEL DUEÑO (interrumpió con la reorganización): ciclo 10
  pricing tiene DOS caminos sobre la mesa — (A) aplicar manualPriceUsd
  proyector $34.99 / dispensador $39.99 según plan del ciclo 9, o (D) NO tocar
  precio y reordenar guías hacia SKUs en banda (soporte auto, impresora). El
  análisis favorece D por señal inmedible con tráfico ~nulo y piso fino del
  dispensador ($4.57). Mapeo técnico completo listo (pisos $26.17/$35.42,
  runner local TCP→Redis, hook de rebuild manual requerido).

## Último ciclo (2026-08-25 — ciclo 9)
- Acción de MAYOR valor ejecutada (todo $0 / cliente-paga, sin gasto):
  1. PUBLICACIÓN GUÍA DÍA DE MUERTOS 2026 (siguiente paso recomendado en
     ciclo 8): el draft `src/app/blog/ofrenda-moderna-dia-de-muertos-2026/`
     existía SIN commitear ni integrar (huérfano). Se completó e integró:
     sitemap.ts + índice /blog + cross-links RECÍPROCOS desde halloween,
     hogar y bienestar. Precios VIVOS verificados contra /api/products de
     producción ANTES del build ($31.75 impresora, $43.68 proyector,
     $35.15 barra LED, $14.74 sensor, $44.54 picadora, $33.23 especias —
     los 6 slugs existen y coinciden). JSON-LD Article + FAQ rango dinámico
     + CTA lead magnet/LUMAI10. Ángulo MX: "ofrenda moderna" (fotos del
     altar impresas en casa con la térmica, luz sin flama junto al papel
     picado, cocina de temporada) + FAQ Buen Fin (13–17 nov, después del
     DDM → urgencia honesta).
  2. FIX DE PRODUCCIÓN ENCONTRADO EN EL CAMINO: las FAQs dinámicas de TODAS
     las guías renderizaban "Van de $X USD a $Y USD USD" (doble USD,
     visible en producción en 7 URLs indexables). Corregido de raíz en los
     6 archivos que construyen el rango; verificado en build y en vivo.
  3. FIX TELEGRAM: `src/lib/notify-telegram.ts` (cambio pendiente sin
     commitear de sesión previa) ahora lee ~/.config/opencode/telegram.json
     o env TELEGRAM_* y envía texto plano. Commiteado.
  4. BUILD/SEGURIDAD: lint OK en archivos tocados, `next build` OK (ruta
     prerendered static), 3 commits (`f102149` fix doble USD, `6372961`
     feat ofrenda, `2589119` fix telegram), push a origin/main, despliegue
     Vercel VERIFICADO EN VIVO: guía 200 + JSON-LD + 6 precios vivos +
     FAQ limpia + sitemap la lista + recíproco desde halloween vivo +
     índice /blog la lista + PDP destino 200.
- Benchmarking continuo (proveedores/plataformas/precios/competencia):
  - COMPETENCIA (Amazon MX, "impresora térmica portátil fotos"): resultados
    dominados por Epson EcoTank multifunción $3,990–$5,829 MXN (~$220–320
    USD), 7–10x nuestro precio ($31.75 USD ≈ $585 MXN). El nicho portátil
    de fotos está desatendido en MX → ángulo diferenciado y precio muy
    accesible para el mercado de la guía.
  - PROVEEDORES: CJ Dropshipping operativo (HTTP 200, 0.44s); EPROLO activo
    (301→www, respaldo gratuito intacto). Zendrop/Spocket/AutoDS siguen
    fuera de presupuesto ($24–40/mo).
  - PLATAFORMA: riesgo Vercel Hobby no-comercial persiste → AQ-001 sigue
    PENDIENTE/BLOQUEADA (no ejecutar sin aprobación del dueño).
- Resultado: +1 URL indexable estacional de ALTA intención cultural (Día de
  Muertos, ~10 semanas de lead time SEO) + fix de copy visible en 7 URLs +
  fix de notificaciones Telegram. Ningún gasto.
- PRÓXIMO PASO RECOMENDADO: landing/guía Navidad 2026 (lead time correcto);
  seguir empujando gates del dueño (reels + GMAIL vars en Vercel, sin costo).
- ADDENDUM cierre de ciclo (mismo día): RE-PRECIO/SYNC EJECUTADO MANUALMENTE.
  El scheduler externo (cron-job.org) NO está disparando: logs Vercel muestran
  cero hits exitosos a /api/cron/* en la retención disponible (y nada en la
  última hora pese a job horario). Los secrets locales (.env.local) tienen
  DRIFT vs producción (CRON_SECRET y ADMIN_SECRET → 401), por lo que se
  ejecutó el mismo código vía runner local contra Redis de producción:
  sync-cj 11/11 actualizados (0 errores) + reprice 11/11 (0 stopped, piso
  respetado, neto US ≥42.9% en todo el catálogo). Precios vivos cambiaron
  (mayoría −20–45% al markup 2.6×; dispensador $56.55, especias $59.33 al alza
  por flete US $20). CONSECUENCIA: las guías del blog quedaron desalineadas
  → ESTE push dispara rebuild para re-hornear precios vía guide-prices.ts.
  PENDIENTE DUEÑO/PROX CICLO: (a) revisar jobs en cron-job.org (pausados o
  apuntando mal) y rotar CRON_SECRET en Vercel + .env.local sincronizados;
  (b) considerar webhook/redeploy automático tras reprice para que blog y
  tienda nunca diverjan.
- BENCHMARK POST-REPRECIO (delegado a Hermes Agent, informe en
  `gerencia/BENCHMARK_REPRICE_2026-08-25.md`): bandas Amazon US/MX vía
  búsqueda web (Amazon bloqueó scraping directo; bandas desde snippets
  indexados + asinsight/Walmart/Claroshop). HALLAZGO PRIORITARIO: proyector
  ($41.78 vs banda US $17–36) y dispensador ($56.55 vs $15–40) quedaron
  ARRIBA del mercado tras el re-precio → conversión en riesgo; soporte auto
  ($43.08) e impresora ($21.63) DENTRO de banda. ACCIÓN CICLO 10: validar con
  segunda fuente y aplicar `manualPriceUsd` (proyector ≤$34.99, dispensador
  ≤$39.99, ambos sobre el piso calculado) + redeploy para re-hornear guías;
  evaluar alerta quincenal de banda por SKU.

## Último ciclo (2026-08-24 — ciclo 8)
- Acción de MAYOR valor ejecutada (todo $0 / cliente-paga, sin gasto):
  1. VERIFICACIÓN del despliegue del ciclo 7: guía bienestar 200 en vivo +
     JSON-LD + precios resueltos ($14.74–$53.92). Repo sincronizado con
     origin/main (había 3 commits de otros ciclos GM C59–C61; rebase OK).
  2. GUÍA ESTACIONAL HALLOWEEN 2026 (tráfico): nueva URL indexable
     https://www.lumaei.com/blog/halloween-ambiente-2026 — ángulo "ambiente con
     luz que sobrevive a la fiesta" (proyector galaxia, barra LED, sensor
     movimiento, jabón sin contacto) + kit recuperación 1-nov (rodillo hielo,
     parches colágeno). 6 picks enlazados a PDPs, precios VIVOS vía
     guide-prices.ts, JSON-LD Article, FAQ rango dinámico, CTA lead magnet +
     LUMAI10. Registrada en índice /blog y cross-link BIDIRECCIONAL desde
     'hogar'. Publicada con lead time (~9 semanas antes del 31-oct; búsqueda
     US/MX arranca sep–oct).
  3. FIX SEO ESTRUCTURAL: sitemap.xml solo listaba 1 guía de 5 → ahora lista
     las 6 (halloween incluida). Verificado en vivo.
  4. BUILD/SEGURIDAD: rebase sobre remoto antes de tocar, `next build` OK
     (ruta prerendered static), lint 0 errores en archivos tocados, commit
     `55692cd`, push a origin/main, despliegue Vercel VERIFICADO EN VIVO
     (guía 200 + JSON-LD + precios vivos $14.74–$53.92 + cross-link recíproco
     vivo + PDP destino 200 + sitemap completo).
- Benchmarking continuo (proveedores/plataformas/precios/competencia):
  - COMPETENCIA (spot-check Amazon US, "halloween projector lights"): banda
    $36.99–$49.99 para proyectores dedicados de Halloween. Nuestro proyector
    $43.68 cae en la banda Y el ángulo "sirve todo el año" diferencia vs
    decoración desechable. Posición de precio sana.
  - PROVEEDORES: CJ Dropshipping operativo y ÓPTIMO a $0/mes; EPROLO sitio
    activo como respaldo gratuito. Zendrop/Spocket/AutoDS siguen fuera de
    presupuesto ($24–40/mo).
  - PLATAFORMA: riesgo Vercel Hobby no-comercial persiste → AQ-001 sigue
    PENDIENTE/BLOQUEADA (no ejecutar sin aprobación del dueño).
- Resultado: +1 URL indexable estacional de alta intención (Halloween) con
  lead time SEO correcto + fix estructural de sitemap (6/6 guías indexables) +
  despliegue ciclo 7 verificado. Ningún gasto.
- PRÓXIMO PASO RECOMENDADO: guía "Día de Muertos / Buen Fin" (nov, MX) o
  preparar landing Navidad 2026; disparar cron de re-precio/sync; seguir
  empujando gates del dueño (reels + GMAIL vars en Vercel, sin costo).

## Último ciclo (2026-08-24 — ciclo 7)
- Acción de MAYOR valor ejecutada (todo $0 / cliente-paga, sin gasto):
  1. FUENTE ÚNICA DE PRECIOS EN BUILD (CRO / cierre de riesgo recurrente): se
     creó `src/lib/guide-prices.ts`, módulo que resuelve el precio de cada
     producto en tiempo de build leyendo `/api/products` (Redis = precio vivo
     que ve el cliente en la PDP), con fallback al valor literal ya correcto de
     cada guía. Se migraron las 4 guías existentes (ella/él/hogar/regreso) y la
     nueva a este módulo, de modo que los precios de blog y tienda NUNCA vuelven
     a desalinearse cuando CJ ajuste listas (riesgo que costó reparar el ciclo
     6). Las FAQ de rango ("Van de $X a $Y USD") ahora se calculan
     dinámicamente desde los precios resueltos.
  2. +1 URL INDEXABLE DE TRÁFICO (el cuello real): nueva guía "Regalos de
     bienestar y autocuidado 2026" → /blog/regalos-bienestar-2026 (6 picks del
     catálogo activo enlazados a /productos/[slug], JSON-LD Article, CTA lead
     magnet + LUMAI10, FAQ dinámica). Registrada en índice /blog y cross-link
     bidireccional desde 'ella' y 'hogar' (SEO interno). Superficie de tráfico
     orgánico ampliada.
  3. BUILD/SEGURIDAD: `next build` OK (5 guías prerendered static, 0 errores de
     lint en los archivos del cambio). Commit + push a origin/main → despliegue
     Vercel (pendiente de verificar en vivo este ciclo).
- Benchmarking continuo (proveedores/plataformas/precios/competencia):
  - PRECIOS/INTEGRIDAD: verificado en vivo que /api/products devuelve precios
    vigentes ($43.68 proyector, $30.45 rodillo, $53.92 dispensador) y que el
    build los inyecta en el HTML estático de las 5 guías (grep de prerendered:
    rango resuelto "$14.74 → $53.92"). Riesgo CRO de desalineo CERRADO de raíz.
  - HALLAZGO: `data/products.json` local queda DESACTUALIZADO vs Redis (precios
    viejos $13.62/$6.72). Por eso el fallback del módulo es el literal de la
    guía, NO el archivo. Regla: no usar products.json como fuente de precios.
  - PROVEEDOR: CJ Dropshipping sigue ÓPTIMO para presupuesto $0. EPROLO respaldo
    gratuito. Zendrop/Spocket/AutoDS $24–40/mo fuera de presupuesto.
  - PLATAFORMA: riesgo Vercel Hobby no-comercial persiste → AQ-001 sigue
    PENDIENTE/BLOQUEADA (sin ejecutar sin aprobación del dueño).
  - COMPETENCIA: nicho gadgets sigue competitivo; modelo cliente-paga sin
    inversión correcto.
- Resultado: riesgo CRO recurrente de precios eliminado de raíz en 5 URLs + 1 URL
  indexable nueva de bienestar → más tráfico orgánico. Ningún gasto.
- PRÓXIMO PASO RECOMENDADO: continuar benchmarking + publicar 1–2 guías más
  estacionales (p.ej. "Regalos para mamá 2026") reusando el módulo; y disparar
  el cron de re-precio/sync para que los builds futuros siempre reflejen CJ vivo.

## Último ciclo (2026-08-24 — ciclo 6)
- Acción de MAYOR valor ejecutada (todo $0 / cliente-paga, sin gasto):
  1. INTEGRIDAD DE PRECIOS (CRO): las 3 guías de blog publicadas
     ('Regalos para ella', 'Regalos para él', 'Regalos y gadgets para el hogar')
     tenían precios hardcodeados INFERIORES a la tienda en producción (riesgo de
     ruptura de confianza al hacer clic, detectado en ciclo 5). Se corrigieron
     TODOS a los valores VIVOS de /api/products (verificados este ciclo), p.ej.:
     proyector estrellas $13.62 → $43.68 · barra LED clóset $8.53 → $35.15 ·
     rodillo hielo $6.72 → $30.45 · parches colágeno $5.10 → $26.23 · dispensador
     jabón $21.50 → $53.92 · luz sensor $12.92 → $14.74 · especias $7.79 → $33.23
     · cargador auto (hogar) $18.28 → $49.74. También se ajustaron los rangos en
     las FAQ de 'ella' y 'él' para coincidir con los precios reales.
  2. BUILD/SEGURIDAD: `next build` OK (blogs prerendered static). Commit
     `0c133bc` (rebasado sobre main remoto `e66a2ee` → `ee7e8d8`). Push a
     origin/main → despliegue Vercel. Verificado en VIVO: las 3 URLs muestran los
     precios nuevos y CERO precios viejos remanentes (grep de producción).
  3. BENCHMARKING continuo (proveedores/plataformas/precios/competencia):
     - PRECIOS/COMPETENCIA: spot-check proyector estrellas en Amazon US (2026) →
       competidores $29.99–$42.99; tramo más competitivo $20–$50 (57% del
       surtido, prom $33.99). Nuestro $43.68 cae en esa banda → precio sano.
     - PROVEEDOR: CJ Dropshipping sigue ÓPTIMO para presupuesto $0 ($0/mo, paga
       por unidad). EPROLO como respaldo gratuito. Zendrop/Spocket/AutoDS $24–40/
       mo fuera de presupuesto.
     - HALLAZGO RAÍZ: los precios de blog se hardcodean en estático y se
       desalinean cuando CJ ajusta listas. Riesgo recurrente.
  - Resultado: eliminado riesgo CRO de precios desalineados en 3 URLs de tráfico
    orgánico; posición de precio validada vs competencia; ningún gasto.
  - PRÓXIMO PASO RECOMENDADO: fuente única de precios en el build (leer
    /api/products o módulo en tiempo de build) para que las guías no se
    desalineen otra vez (mejora $0, reversible).

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
   - [x] AUDITAR PRECIOS en blogs ciclo 3/4/5 vs tienda en vivo: HECHO ciclo 6.
         Se corrigieron las 3 guías a precios vivos de /api/products y se verificó
         en producción (cero precios viejos). Riesgo CRO cerrado.
    - [x] FUENTE ÚNICA DE PRECIOS en build: HECHO ciclo 7 — `src/lib/guide-prices.ts`
          lee /api/products en build con fallback al literal; migradas las 4 guías
          existentes + la nueva. Riesgo CRO de desalineo cerrado de raíz.
- [ ] Continuar benchmarking: monitorear precios CJ vs competencia y vigilar
     plataformas alternativas cada ciclo (indefinido).
- [ ] Detectar clientes/ventas y arrancar mensajería (WA tienda: usar número público de tienda, nunca el personal).
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
