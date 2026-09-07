#!/usr/bin/env bash
# setup-crons.sh — Crea los 8 jobs de Lumaei en cron-job.org (operación autónoma).
# Reversible: los jobs se pueden borrar desde el dashboard o via API.
# Requiere: CRONJOB_API_KEY (API key de cron-job.org) y CRON_SECRET (header x-cron-secret).
# Uso:
#   export CRONJOB_API_KEY=xxxx CRON_SECRET=yyyy BASE_URL=https://www.lumaei.com
#   bash scripts/setup-crons.sh
set -euo pipefail

: "${CRONJOB_API_KEY:?falta CRONJOB_API_KEY (API key de cron-job.org)}"
: "${CRON_SECRET:?falta CRON_SECRET (header x-cron-secret de las rutas)}"
BASE_URL="${BASE_URL:-https://www.lumaei.com}"
API="https://api.cron-job.org/jobs"
TZ="America/Mexico_City"
AUTH="$(printf '%s:' "$CRONJOB_API_KEY" | base64)"
HOURS_ALL=$(seq -s, 0 23 | tr -d '\n')

# Cada job: [nombre, path, horas, minutos, metodo]
# Todas las rutas /api/cron/* aceptan GET y POST con la misma auth
# (header x-cron-secret, Bearer o ?secret). Por defecto usamos POST,
# salvo hunter/digest/support que también funcionan con GET (Vercel Cron usa GET).
# metodo: 0 = GET (cron-job.org), 1 = POST.
JOBS=(
  "sync-cj|/api/cron/sync-cj|0|30|1"
  "reprice|/api/cron/reprice|1|0|1"
  "retry-fulfill|/api/cron/retry-fulfill|$HOURS_ALL|0,15,30,45|1"
  "trends|/api/cron/trends|0,6,12,18|0|1"
  "hunter|/api/cron/hunter|0,6,12,18|30|1"
  "catalog|/api/cron/catalog|0|0|1"
  "digest|/api/cron/digest|19|0|1"
  "support|/api/cron/support|$HOURS_ALL|0,30|1"
)

echo "== Creando jobs en $BASE_URL ($TZ) =="
for entry in "${JOBS[@]}"; do
  IFS='|' read -r name path hours minutes method <<< "$entry"
  url="$BASE_URL$path"
  body=$(cat <<JSON
{
  "job": {
    "url": "$url",
    "enabled": true,
    "schedule": {"timezone": "$TZ", "hours": [${hours}], "minutes": [${minutes}]},
    "requestMethod": ${method},
    "headers": [{"name": "x-cron-secret", "value": "$CRON_SECRET"}]
  }
}
JSON
)
  echo "-- $name -> $url"
  curl -sS -X POST "$API" \
    -H "Authorization: Basic $AUTH" \
    -H "Content-Type: application/json" \
    -d "$body" | sed 's/"value":"[^"]*"/"value":"***"/'
  echo
done

echo "== Contrato de verificación =="
echo "Por cada job en cron-job.org -> 'Run job' debe devolver HTTP 200 y JSON con {\"ok\":true,...}."
echo "Sin el header x-cron-secret (ni ?secret=) devuelve 401 (auth correcta)."
echo "Monitoreo: $BASE_URL/api/health (status ok/degraded/down por servicio)."
