# Navin Shell Autónomo — Sistema Local MacOS (Hermes vs Opencode)

Origen: replica y supera experimento Grok share/bGVnYWN5 (prompt: "crear sistema que conecte local a terminal shell MacOS, configure Hermes u opencode autónomo para gestionar tienda 100%, verifique cuál es más apto, active humanizer y trabaje solo con Playwright MCP")

## Evaluación en vivo (Playwright MCP) — 04 Sep 2026

**Grok hizo:** 17m03s, editó `faro-store.ts +4/-4`, activó `humanizer skill lock` + `Playwright MCP` + `Get a11y snapshot refs` (visto en snapshot refs f32e112-f32e322). Vista previa expirada.

**Navin hace (local real, no sandbox):**

| Criterio | Hermes v0.20.5 | Opencode 1.18.20 | Veredicto |
|---|---|---|---|
| Shell local MacOS | `hermes` bin + MCP shell (`~/.local/bin/hermes`) — acceso directo a zsh, file, cron | `opencode run` + plugins `~/.config/opencode/plugins` — MCP + router zen | Ambos conectan, Hermes más nativo para misiones largas |
| Gestión tienda 100% | Misiones autónomas horas (Telegram, heartbeat, hunter) | Plan JSON + Spine hub-and-spoke, VRAM-safe, memoria navin-memory | **Opencode gana para tienda** (ya gestiona lumaei.com: Stripe, CJ, cron, pixel) |
| Humanizer 34 patrones | Manual (skill `creative/humanizer` v2.5.1) | Integrado nativo en Spine como último step `agent=humanizer` si `customer_facing` | **Opencode gana** — lock automático |
| Playwright MCP only | Requiere wrapper | Nativo: `playwright_browser_*` tools + `Spine` ya lockeado a solo Playwright para UI | **Opencode gana** |
| Persistencia | Memoria Hermes (proyecto) | `navin-memory` SQLite + `large-codebase.json` + git checkpoints | Empate, pero Navin usa navin-memory unificado |

**Elección:** **Opencode (big-pickle, zen tier) como hub principal**, Hermes como respaldo para misiones largas Telegram/cron. Sistema lockeado a **humanizer + Playwright MCP only** como pediste.

## Arquitectura implementada (local, no necesita login Grok)

```
[MacOS Shell zsh] ←→ Navin Shell Autónomo ←→ Opencode Hub (Spine)
                                      ├─ navin-memory (SQLite)
                                      ├─ humanizer (34 patrones, customer_facing_only)
                                      └─ Playwright MCP ONLY (todos los pasos UI por browser)
                                         ├─ lumaei.com (verificado: footer [ref=e216] ahora "Lumaei")
                                         ├─ ads.tiktok.com/i18n/login → TikTok One / Symphony
                                         └─ futuros: Stripe, CJ, proveedores
                      ↕ (fallback)
                    Hermes Agent (misiones >30min, Telegram)
```

## Comandos (100% autónomos, sin preguntar)

```bash
# Evaluación ya hecha (ver /tmp/navin-shell-eval.sh)
opencode run --agent navin --prompt "gestiona tienda"  # usa solo Playwright MCP

# Activar modo autónomo total
./gerencia/navin-shell-autonomo.sh --enable --humanizer --mcp=playwright

# En Playwright MCP (como acabamos de hacer en lumaei.com + TikTok):
# - playwright_browser_navigate / snapshot / find / run_code_unsafe
```

## Estado actual
- ✅ Shell local conectado (zsh darwin, /Users/sdesilencio/tienda_linea)
- ✅ Anonimización producción: deploy 97cc9e1 Ready (Vercel) — footer verificado Playwright
- ✅ TikTok One acceso intentado (captcha shape [ref=f15e123] — requiere 1 verificación humana, luego autónomo)
- 🔜 Próximo: crear 3 videos comerciales Symphony con assets public/tiktok/* usando solo Playwright MCP
