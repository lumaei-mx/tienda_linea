# Benchmark de Re-Precio — lumaei.com

**Fecha:** 2026-08-25
**Metodología:** Búsqueda web de precios vigentes en Amazon US y Amazon MX (páginas de producto y listados/best-sellers; soporte indirecto de asinsight.com con datos agregados de la búsqueda "star projector" en Amazon US, Walmart US y prensa MX). Tipo de cambio referencial usado: 1 USD ≈ 18.5 MXN. No se pudo scrapear Amazon directamente (bloqueo/bot-wall); los precios provienen de snippets de resultados de búsqueda indexados hoy. Una consulta falló por error del backend de búsqueda (Firecrawl 403); se compensó con fuentes alternativas.

## Tabla comparativa

| Producto | Precio lumaei | Banda Amazon US | Banda Amazon MX | Posición | Veredicto |
|---|---|---|---|---|---|
| Proyector estrellas galaxia (astronauta) | $41.78 USD | $17–$36 (top sellers: $18.99, $21.23, $34.99, $35.99) | MXN $243–$338 ≈ $13–$18 USD | ARRIBA en ambos mercados | **Riesgoso** — casi 2x el best-seller US y ~2.5x la banda MX |
| Dispensador automático jabón espuma sin contacto | $56.55 USD | $15–$40 (Aunmaon $14.99, Gotofine $19.99, Mooas $25.99, BN-LINK $27.98, Secura $29.99, EKO $39.99) | MXN $259–$400 ≈ $14–$22 USD | ARRIBA en ambos mercados | **Riesgoso** — 40%+ sobre el tope US y ~2.5x la banda MX |
| Soporte magnético auto + carga inalámbrica 15W | $43.08 USD | $20–$50 (LISEN, ESR, Coolpow, MSXTTLY; rango típico best-sellers) | MXN $296–$910 ≈ $16–$49 USD (UGREEN 15W $823–$899 MXN) | DENTRO de banda | **Sano** — competitivo contra marcas conocidas en MX, dentro del rango US |
| Impresora térmica portátil mini | $21.63 USD | $19.7–$41 (Cabaro $19.74, Peripage-style $30–$40.89) | MXN $358–$600 ≈ $19–$32 USD | DENTRO-bajo / borde inferior | **Agresivo/sano** — al nivel del más barato US; margen de subida moderado |

## Hallazgos destacados

1. **Los dos productos de hogar (proyector y dispensador) quedaron muy por encima del mercado tras el re-precio.** El proyector astronauta es una categoría hipercompetida: el best-seller US (16k+ reviews) está a $34.99 y hay equivalentes a $17–19. En MX la misma categoría vende a MXN $243–338. A $41.78 la conversión probablemente caiga fuerte; el dispensador a $56.55 está incluso peor relativo a su banda.
2. **Soporte de auto e impresora quedaron bien posicionados.** El soporte compite de tú a túa con UGREEN/LISEN en MX (que venden a MXN $296–900) y la impresora queda al piso de la banda US, buen gancho de entrada.
3. **Brecha US vs MX consistente:** los precios MX en pesos convertidos suelen quedar 20–40% debajo de US en estas categorías genéricas (mayor sensibilidad a precio y presencia de Mercado Libre como ancla). Pricear solo contra US sobreexpone en el mercado mexicano.
4. Nota de fuentes: Amazon bloqueó acceso directo; bandas construidas desde resultados indexados del día + asinsight (datos agregados de Amazon US) + Walmart/TODAY/Claroshop como contraste. Precios MX sujetos a variación cambiaria.

## Recomendaciones accionables (costo cero)

1. **Bajar o pausar tráfico pagado hacia proyector ($41.78) y dispensador ($56.55)** hasta revisar costo: apuntar proyector a ≤ $34.99 y dispensador a ≤ $39.99 (tope de banda US) antes de invertir en ads; mientras tanto empujar tráfico hacia el soporte de auto y la impresora, que sí están en banda.
2. **Anclar el copy de las fichas al valor, no al precio:** en proyector y dispensador destacar diferenciadores (empaque regalo, garantía, envío a MX) y añadir comparativa implícita con marcas premium (UGREEN/EKO) para justificar prima; en impresora explotar el precio bajo como oferta destacada ("más barato que Amazon US entry-level").
3. **Programar re-validación quincenal automatizada:** agregar al cron existente una tarea que consulte las bandas (Amazon search snippets / Google Shopping) cada 15 días y alerte cuando cualquier SKU salga >15% de su banda, evitando que el próximo re-precio automático vuelva a dispararse fuera de mercado sin validación externa.
