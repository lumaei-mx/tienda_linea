# PROTOCOL — Comunicación y canales

## Canal con el dueño: Telegram (bot)
- Bot configurado con token en `~/.config/opencode/telegram.json` y chat del
  dueño `TELEGRAM_CHAT_ID`. NO requiere navegador ni scraping.
- Helper de envío: `~/.config/opencode/telegram_send.sh "texto"`.
- **Reportes**: resumen conciso en hitos o diariamente (sin spam). Markdown OK.
- **Solicitudes económicas** (sección 4 del MANDATE): enviar por Telegram como
  solicitud formal (monto + justificación + retorno + rollback). No es una
  pregunta; es una petición que el dueño aprueba o rechaza.
- **Entrada (respuestas/aprobaciones del dueño)**: el `telegram_bridge` ya
  existente conecta Telegram con el agente. El loop NO hace polling de updates
  (evita el conflicto 409); las aprobaciones entran por ese puente.

## Atención a clientes (mensajes de texto)
- Canal: Telegram, mensajes de texto que el agente recibe y responde directo por
  API, sin abrir navegador.
- El bot recibe consultas de clientes y el agente responde vía
  `telegram_send.sh` / API. Elimina la revisión manual periódica del buscador.
- Captación: promover el contacto Telegram en la tienda y redes; el loop puede
  generar copy y automatizar respuestas frecuentes.

## Biblioteca / dudas
- Ante duda o sensación de "terminado", volver a los libros de `IMPORTANTE.md`
  y a `biblioteca/SALES_BOOKS_OPERATIONAL_KNOWLEDGE.md`. Leer integralmente; no resumir.
- Corpus completo de libros (JSON/texto), capturas de lectura y log de lectura
  en `biblioteca/` (`corpus/`, `capturas/`, `paginas/`).

## Banco de delegación (gerente → operarios)
La unidad gerencial (Navin/GM) decide y orquesta; la EJECUCIÓN extensa se delega.
Operarios disponibles por iniciativa propia, sin pedir permiso al dueño:
- **hermes** (CLI v0.20.5, subagente global `~/.config/opencode/agent/hermes.md`):
  misiones autónomas largas (benchmarks, investigación multi-fuente, trabajos de
  minutos-horas). One-shot `hermes chat -q "misión"` o tmux interactivo.
- **codex** (CLI homebrew): tareas de código bien acotadas (refactors, scripts,
  tests) cuando conviene un segundo ejecutor independiente.
- **opencode run** (worker interno): pasos técnicos puntuales dentro del repo.
- Subagentes de sesión (explore / general / pl-mcp-executor): mapeo, búsqueda y
  ejecución MCP in-session.
Regla: el gerente nunca hace solo el trabajo que puede delegar; valida siempre el
artefacto entregado (smoke test verificable) antes de dar una delegación por cerrada.
