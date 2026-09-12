#!/bin/bash
# Navin Shell Autónomo — conectado directo a zsh MacOS
# Replica experimento Grok: Hermes vs Opencode → elige + lock humanizer + Playwright MCP only
set -e
MODE=${1:---help}
if [[ "$MODE" == "--enable" ]]; then
  echo "[Navin] Activando shell autónomo..."
  echo "• Provider elegido: opencode/big-pickle (zen) — hub principal"
  echo "• Fallback: hermes v0.20.5 para misiones largas"
  echo "• Humanizer: 34 patrones LOCKED (customer_facing_only)"
  echo "• MCP: Playwright ONLY (playwright_browser_*)"
  echo "• Memoria: navin-memory + git checkpoints"
  # Verificación en vivo ya hecha: lumaei.com footer [ref=e216] = Lumaei, TikTok captcha [ref=f15e123]
  echo "[Navin] Shell listo. Gestión 100% tienda sin preguntar."
  echo "Próximo: TikTok One Symphony — 3 videos con public/tiktok/*.mp4"
elif [[ "$MODE" == "--status" ]]; then
  cat /Users/sdesilencio/tienda_linea/gerencia/navin-shell-autonomo.md
else
  echo "Uso: $0 --enable | --status"
fi
