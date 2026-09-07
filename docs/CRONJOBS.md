# Automatización Lumaei — Scheduler cron-job.org

La tienda se opera 24/7 sin intervención manual. Los webhooks de Stripe, CJ y
TikTok son push (los envían ellos solos). Los **crons** hacen mantenimiento
periódico. Vercel Hobby limita los crons nativos, por eso usamos
**cron-job.org** (gratis, sin límite práctico) como scheduler principal; el
`vercel.json` mantiene los mismos 8 crons como respaldo/documentación
(todas las rutas aceptan GET y POST).

## Credenciales

| Variable | Propósito | Dónde está |
|---|---|---|
| `CRON_SECRET` | Header de autorización de los crons | Vercel (production) + header de cada job en cron-job.org |
| `ADMIN_PASSWORD` | Login /admin | Vercel (production) |
| `ADMIN_SECRET` | Firma de cookie admin | Vercel (production) |

**NUNCA escribas valores reales en este documento.** Si rotas `CRON_SECRET`,
actualiza el header `x-cron-secret` de los 8 jobs en cron-job.org en el mismo
momento (si no, los crons fallan con 401).

## Auth de crons (única fuente de verdad: `src/lib/cron-auth.ts`)

`authorizeCron(req)` acepta el secreto por cualquiera de estas vías
(sirve para GET y POST en las 8 rutas):

- header `x-cron-secret: <CRON_SECRET>` (recomendado, lo usa `setup-crons.sh`)
- header `authorization: Bearer <CRON_SECRET>`
- query `?secret=<CRON_SECRET>` (útil para "Run job" manual o Vercel Cron)

Sin secreto válido → **401**. Sin `CRON_SECRET` en el servidor → **500**.

## Jobs a crear en cron-job.org

Para cada job:

1. En **Request**: URL + método indicado (todas las rutas aceptan GET y POST).
2. En **Request → Custom Headers**: añadir header `x-cron-secret` con el valor
   de `CRON_SECRET` (cópialo desde Vercel → Settings → Environment Variables;
   no lo guardes en este documento).
3. En **Schedule**: frecuencia indicada.
4. En **Advanced → Timezone**: `America/Mexico_City` para los horarios.

| Job | URL | Frecuencia | Método |
|---|---|---|---|
| Sync CJ (stock/costo/freight) | `/api/cron/sync-cj` | Diario 00:30 | GET o POST |
| Repricing automático | `/api/cron/reprice` | Diario 01:00 | GET o POST |
| Retry fulfill (colas CJ) | `/api/cron/retry-fulfill` | Cada 15 min | GET o POST |
| Tendencias / stock bajo | `/api/cron/trends` | Cada 6 h | GET o POST |
| Hunter de oportunidades | `/api/cron/hunter` | Cada 6 h | GET o POST |
| Catálogos por temporada | `/api/cron/catalog` | Diario 00:00 | GET o POST |
| Resumen diario (digest) | `/api/cron/digest` | Diario 19:00 | GET o POST |
| Soporte autónomo (AgentMail) | `/api/cron/support` | Cada 30 min | GET o POST |

Crear los 8 con `bash scripts/setup-crons.sh` (usa POST + header `x-cron-secret`).

## Validación

Probar cada job manualmente desde cron-job.org ("Run job"). Debe devolver JSON
con `{"ok":true,...}` y código 200. Sin el header (ni `?secret=`) da **401**.

## Monitoreo

- `https://www.lumaei.com/api/health` — estado por servicio
  (`redis/stripe/cj/email/telegram/agentmail`) con `status: ok|degraded|down`.
  `ok:true` = núcleo operativo (redis + CJ). `degraded` = núcleo ok pero falta
  algún auxiliar (p.ej. email o Telegram sin configurar). `cj.sandbox` y
  `cj.fulfillmentReady` se reportan aparte y NO fuerzan `ok:false`.
- Alertas de fallos de fulfill quedan en Redis (visibles en `/admin`) + push a
  Telegram si está configurado.
- cron-job.org manda email si un job falla (activar notificaciones por job).

## Reintentos (último intento, asegurar)

| Job | Reintentos | Intervalo |
|---|---|---|
| sync-cj | 3 | 10 min |
| reprice | 2 | 15 min |
| retry-fulfill | 5 | 5 min |
| trends | 3 | 10 min |
| hunter | 3 | 10 min |
| catalog | 2 | 15 min |
| digest | 2 | 15 min |
| support | 3 | 10 min |
