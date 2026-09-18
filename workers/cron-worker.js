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
        const failed = results.filter((r) => r.status >= 400 || r.status === 0);
        const line = `cron=${event.cron} ${JSON.stringify(results)}`;
        if (failed.length) console.error("cron con fallos", line);
        else console.log("cron ok", line);
      })()
    );
  },
};
