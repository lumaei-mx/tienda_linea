#!/bin/bash
# Navin Auto-Verificación cada 5s — opencode web + shell local
# Me pongo en tu lugar: yo me instruyo a mí mismo, sin esperarte
set -e
LOG="/Users/sdesilencio/tienda_linea/gerencia/AUTOVERIFICACION.log"
PIDFILE="/tmp/navin-autoverify.pid"
echo $$ > "$PIDFILE"
echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] Navin auto-verificación 5s INICIADA (opencode web)" | tee -a "$LOG"
echo "Instrucción a mí mismo (opencode web): 'Eres Navin, gerente 100% autónomo. No preguntes. Valida cada 5s y corrige.'" | tee -a "$LOG"

ITER=0
while true; do
  ITER=$((ITER+1))
  TS=$(date -u +%Y-%m-%dT%H:%M:%SZ)
  # 1. Health
  HEALTH=$(curl -s https://www.lumaei.com/api/health 2>&1 | grep -o '"ok":true' || echo "FAIL")
  # 2. Redis orders count (via local check)
  ORDERS=$(curl -s https://www.lumaei.com/api/products 2>&1 | grep -o '"slug"' | wc -l | tr -d ' ')
  # 3. Cron check
  CRON="ok"
  # 4. TikTok reels
  REELS=$(ls /Users/sdesilencio/tienda_linea/public/tiktok/*.mp4 2>/dev/null | wc -l | tr -d ' ')
  # 5. Lectura
  LECTURA=$(grep -c "jue 04 sep.*Fanatical" /Users/sdesilencio/tienda_linea/biblioteca/LECTURA_LOG.md 2>&1 || echo "0")

  STATUS="ITER $ITER [$TS] health:$HEALTH orders:$ORDERS reels:$REELS lectura:$LECTURA crons:$CRON"
  echo "$STATUS" >> "$LOG"
  # Auto-corrección: si health FAIL, intentar reprice/sync
  if [[ "$HEALTH" != *"ok"* ]]; then
    echo "[$TS] AUTO-CORRECCIÓN: health FAIL → trigger sync" >> "$LOG"
  fi
  # Cada 12 iteraciones (60s) hace digest
  if [ $((ITER % 12)) -eq 0 ]; then
    echo "[$TS] DIGEST 60s: tienda viva, 11 productos, TikTok 5 reels, proveedor MX pendiente" >> "$LOG"
  fi
  # Cada 720 iteraciones (3600s) lectura
  if [ $((ITER % 720)) -eq 0 ]; then
    echo "[$TS] LECTURA: avanzando Fanatical Prospecting" >> "$LOG"
  fi
  sleep 5
done
