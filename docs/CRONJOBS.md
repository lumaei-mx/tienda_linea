# Automatización Lumaei — Crons nativos de Cloudflare

La tienda se opera 24/7 sin intervención manual. Los webhooks de Stripe, CJ y
TikTok son push (los envían ellos solos). Los **crons** hacen mantenimiento
periódico y ahora corren **dentro del propio worker** de Cloudflare:

`workers/cron-worker.js` envuelve el worker de OpenNext y añade un handler
`scheduled`, que despacha a los endpoints `/api/cron/*` ya existentes. No hay
scheduler de terceros ni un secreto que se pueda desincronizar: el
`CRON_SECRET` se lee del binding del propio worker.

> Historial: antes se usaba **cron-job.org** (y antes Vercel Cron). Ese diseño
> se abandonó porque requería reconfigurar a mano el header `x-cron-secret` de
> cada job al rotar el secreto. Cuando el secreto quedó desfasado, los 8 jobs
> pasaron a devolver 500 en silencio y **toda la automatización se detuvo** sin
> que nadie se enterara.

## Credenciales

| Variable | Propósito | Dónde está |
|---|---|---|
| `CRON_SECRET` | Header de autorización de los crons | Binding del worker (`wrangler secret put CRON_SECRET`) |
| `ADMIN_PASSWORD` | Login de respaldo /admin (bootstrap owner) | Binding del worker |
| `ADMIN_SECRET` | Firma de cookie admin | Binding del worker |

**NUNCA escribas valores reales en este documento.**

## Reparto de triggers (UTC)

Los tres triggers declarados en `wrangler.jsonc` (el plan Free permite 5) se
reparten el trabajo según la hora. MX es UTC-6 todo el año (sin DST).

| Trigger | Job(s) | Por qué |
|---|---|---|
| `*/15 * * * *` | `retry-fulfill` | Lo más sensible al tiempo: hay stock reservado esperando. |
| `30 * * * *` | `support` | Respuesta autónoma a correos de clientes. |
| `0 * * * *` | `strategic` + diarios | `strategic` decide solo si MX/US están en ventana pico (hunter/trends). |

Jobs diarios, según la hora UTC en que corre el trigger horario:

| Hora UTC | Hora MX | Job |
|---|---|---|
| 01:00 | 19:00 | `digest` (resumen del día) |
| 06:00 | 00:00 | `catalog` (catálogos por temporada) |
| 07:00 | 01:00 | `sync-cj` y luego `reprice` (en ese orden) |

Se agrupan a propósito para no gastar triggers: el plan Free solo permite 5 y
un trigger puede despachar varios jobs.

## Auth de crons (única fuente de verdad: `src/lib/cron-auth.ts`)

`authorizeCron(req)` acepta el secreto por cualquiera de estas vías
(sirve para GET y POST en todas las rutas):

- header `x-cron-secret: <CRON_SECRET>` (lo usa el handler `scheduled`)
- header `authorization: Bearer <CRON_SECRET>`
- query `?secret=<CRON_SECRET>` (útil para "Run job" manual)

Sin secreto válido → **401**. Sin `CRON_SECRET` en el servidor → **500**.

## Validación

Disparar un trigger en local:

```bash
npx wrangler dev --test-scheduled
curl "http://localhost:8787/__scheduled?cron=*/15+*+*+*+*"
```

En producción, forzar un job a mano sin esperar la ventana:

```bash
curl -H "x-cron-secret: $CRON_SECRET" "https://www.lumaei.com/api/cron/strategic?force=1"
```

Debe devolver JSON con `{"ok":true,...}` y código 200. Sin el header (ni
`?secret=`) da **401**.

## Monitoreo

- `https://www.lumaei.com/api/health` — estado por servicio
  (`redis/stripe/cj/email/telegram/agentmail`) con `status: ok|degraded|down`.
  `ok:true` = núcleo operativo (redis + CJ). `degraded` = núcleo ok pero falta
  algún auxiliar (p.ej. email o Telegram sin configurar). `cj.sandbox` y
  `cj.fulfillmentReady` se reportan aparte y NO fuerzan `ok:false`.
- Alertas de fallos de fulfill quedan en Redis (visibles en `/admin`) + push a
  Telegram si está configurado. OJO: `agentmail` en health solo dice que las
  variables existen, no que el proveedor responda. Un 403 de AgentMail se ve en
  el body del cron, no en health.
- El handler `scheduled` registra `cron ok` / `cron con fallos` (con el
  resultado de cada job) en los logs del worker: **Cloudflare → Workers →
  tienda-linea → Logs**. Un trigger que no corresponda a ningún job se registra
  como `trigger sin job asociado` para detectar configs desalineadas.
- **Aviso al dueño por Telegram**: si un job falla, `scheduled` manda un push
  con el detalle. Se considera fallo no solo el status HTTP ≥400, también un
  200 con `ok:false` o con `errors:[...]` en el cuerpo, que es como reportan los
  endpoints los errores internos (p.ej. proveedor caído). Sin esto, esos fallos
  quedan invisibles: en una tienda desatendida el fallo silencioso es el más
  caro.

## Reintentos (los hace el propio endpoint)

`retry-fulfill` corre cada 15 min y es quien reintenta los fulfillments que
fallaron, así que el reintento vive en el endpoint (no en el scheduler). El
resto de jobs son idempotentes: si uno falla, el siguiente ciclo lo reintenta.
