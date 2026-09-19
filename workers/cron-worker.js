// Worker de entrada de Lumaei: envuelve el worker generado por OpenNext para
// añadir un handler `scheduled`.
//
// Por qué: OpenNext no genera un `scheduled`, así que los triggers nativos se
// declaraban sin ejecutar nada y la automatización dependía de un scheduler
// externo (cron-job.org) que hay que reconfigurar a mano cada vez que se rota
// CRON_SECRET. Resultado real: los jobs se quedaron con un secreto viejo y TODA
// la automatización (sync de stock, repricing, fulfillment, soporte, hunter) se
// detuvo en silencio y sin aviso.
//
// Con este handler los crons corren dentro del propio worker: sin terceros, sin
// coste extra y sin posibilidad de drift de credenciales.
import baseWorker from "../.open-next/worker.js";
import { jobsForCron } from "./cron-schedule.js";

// Los Durable Objects que wrangler necesita ver exportados. `export *` también
// reexportaría un `default` si el worker base lo tuviera, y aquí el default se
// define abajo, así que solo se reexportan los named.
export { DOQueueHandler, DOShardedTagCache, BucketCachePurge } from "../.open-next/worker.js";

async function runJob(env, ctx, path) {
  // Se reutilizan los endpoints /api/cron/* en vez de duplicar lógica: un solo
  // lugar donde vive el negocio y donde se valida la autorización.
  const req = new Request(`https://www.lumaei.com${path}`, {
    method: "POST",
    headers: { "x-cron-secret": env.CRON_SECRET ?? "" },
  });
  const res = await baseWorker.fetch(req, env, ctx);
  const body = await res.text();
  return { path, status: res.status, body: body.slice(0, 400) };
}

/**
 * ¿El job falló aunque haya respondido 200?
 *
 * Los endpoints devuelven `ok:true` con `errors:[...]` cuando el ciclo corrió
 * pero algo interno no se pudo completar (p.ej. AgentMail caído). Quedarse solo
 * con el status HTTP dejaría esos fallos invisibles, que es justo lo que pasó
 * con el soporte por correo: 403 del proveedor durante días sin que nadie lo
 * viera. Un job que reporta errores se trata como fallo.
 */
function jobFailed(result) {
  if (result.status === 0 || result.status >= 400) return true;
  try {
    const parsed = JSON.parse(result.body);
    if (parsed?.ok === false) return true;
    if (Array.isArray(parsed?.errors) && parsed.errors.length > 0) return true;
    const inner = parsed?.result;
    if (inner && Array.isArray(inner.errors) && inner.errors.length > 0) return true;
    if (inner?.ok === false) return true;
  } catch {
    // Body no-JSON: el status ya decidió.
  }
  return false;
}

/**
 * Aviso al dueño por Telegram cuando un cron falla.
 *
 * Por qué: el fallo más peligroso de una tienda desatendida es el SILENCIOSO.
 * Los jobs internos registran en `pushAlert`, pero esa alerta se guarda en
 * Redis y solo se ve entrando a /admin. Aquí se manda un push real al móvil,
 * con un fetch directo a Telegram para no arrastrar el stack de la app al
 * worker (menos superficie y arranque más barato).
 */
async function alertOwner(env, text) {
  const token = env.TELEGRAM_BOT_TOKEN;
  const chatId = env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;
  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: `🟡 Lumaei · cron\n${text}` }),
    });
  } catch {
    // Si Telegram también falla, no hay más que hacer: el log del worker queda.
  }
}

export default {
  fetch: baseWorker.fetch.bind(baseWorker),

  async scheduled(event, env, ctx) {
    const jobs = jobsForCron(event.cron, new Date(event.scheduledTime));

    // `waitUntil` mantiene vivo el worker hasta que terminan los jobs, que
    // encadenan varias llamadas a CJ/Stripe y tardan más que el handler.
    ctx.waitUntil(
      (async () => {
        const results = [];
        for (const path of jobs) {
          // Un job que falle no debe impedir los siguientes.
          try {
            results.push(await runJob(env, ctx, path));
          } catch (err) {
            results.push({
              path,
              status: 0,
              body: err instanceof Error ? err.message : "error",
            });
          }
        }
        const failed = results.filter(jobFailed);
        const line = `cron=${event.cron} ${JSON.stringify(results)}`;
        if (failed.length) {
          console.error("cron con fallos", line);
          const detail = failed
            .map((f) => `${f.path} → ${f.status} ${f.body.slice(0, 160)}`)
            .join("\n");
          await alertOwner(env, `Falló ${failed.length} job(s):\n${detail}`);
        } else {
          console.log("cron ok", line);
        }
      })()
    );
  },
};
