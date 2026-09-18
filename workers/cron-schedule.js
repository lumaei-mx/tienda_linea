// Planificación de los crons nativos de Lumaei.
//
// Sin imports a propósito: así se puede probar con Node directamente, sin el
// runtime de Cloudflare.

/**
 * Trabajo diario (una vez al día) por hora UTC.
 *
 * MX es UTC-6 todo el año (sin DST), así que estas horas caen de noche o de
 * madrugada en México, que es cuando el catálogo se puede tocar sin que nadie
 * esté comprando: el repricing cambia precios en vivo.
 */
export const DAILY_JOBS = new Map([
  // 01:00 UTC = 19:00 MX → resumen del día
  [1, ["/api/cron/digest"]],
  // 06:00 UTC = 00:00 MX → catálogos por temporada
  [6, ["/api/cron/catalog"]],
  // 07:00 UTC = 01:00 MX → stock/costos y luego repricing (en ese orden)
  [7, ["/api/cron/sync-cj", "/api/cron/reprice"]],
]);

/** Rutas /api/cron/* que corresponden a un trigger y una hora dados. */
export function jobsForCron(cron, now) {
  if (cron === "*/15 * * * *") {
    // Reintento de fulfillment: lo más sensible al tiempo (hay stock reservado).
    return ["/api/cron/retry-fulfill"];
  }
  if (cron === "30 * * * *") {
    // Soporte autónomo: responde correos de clientes cada 30 minutos.
    return ["/api/cron/support"];
  }
  if (cron === "0 * * * *") {
    // `strategic` decide por sí mismo si MX/US están en ventana pico, así que
    // llamarlo cada hora no gasta cuota de CJ fuera de horario.
    return ["/api/cron/strategic", ...(DAILY_JOBS.get(now.getUTCHours()) ?? [])];
  }
  return [];
}
