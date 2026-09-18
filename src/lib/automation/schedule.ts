// src/lib/automation/schedule.ts
// Ventanas estratégicas de operación para México y Estados Unidos.
//
// Por qué existe: los crons corrían a horas fijas (p.ej. 07:00 MX), cuando ni
// la audiencia está activa ni conviene competir por atención. Aquí se declaran
// las horas pico de actividad social/online por mercado, y el hunter/trends
// priorizan esas ventanas.
//
// Las horas están en tiempo local de cada mercado (MX = America/Mexico_City,
// US = America/New_York para la costa este, que concentra la mayor parte del
// tráfico de e-commerce hispano).

export type Market = "MX" | "US";

export interface PeakWindow {
  market: Market;
  /** Hora local (0-23) en que arranca la ventana. */
  startHour: number;
  endHour: number;
  /** Por qué es una buena ventana. */
  note: string;
}

/**
 * Ventanas pico por mercado (hora local).
 *
 * MX: 12–14 (comida) y 19–22 (noche, scroll social fuerte) + 7–9 (mañana,
 * commute). TikTok/Instagram MX concentran su pico 20:00–22:00.
 *
 * US: 12–13 (almuerzo), 19–22 (prime time EST) y 7–9 (mañana). El prime time
 * de la costa este cubre también el centro (18–21 CT).
 */
export const PEAK_WINDOWS: PeakWindow[] = [
  { market: "MX", startHour: 7, endHour: 9, note: "Mañana MX (commute + primer scroll)" },
  { market: "MX", startHour: 12, endHour: 14, note: "Comida MX" },
  { market: "MX", startHour: 19, endHour: 22, note: "Prime time MX (pico social)" },
  { market: "US", startHour: 7, endHour: 9, note: "Mañana US (EST)" },
  { market: "US", startHour: 12, endHour: 13, note: "Almuerzo US (EST)" },
  { market: "US", startHour: 19, endHour: 22, note: "Prime time US (EST)" },
];

/** Zona horaria IANA por mercado. */
const MARKET_TZ: Record<Market, string> = {
  // México centro: sin DST desde 2022.
  MX: "America/Mexico_City",
  // Costa este US: sí observa DST (EST/EDT).
  US: "America/New_York",
};

/**
 * Hora local de un mercado a partir de una fecha UTC.
 * Usa la zona IANA para respetar DST: con un offset fijo, la ventana US se
 * corría una hora durante el horario de verano.
 */
export function localHour(date: Date, market: Market): number {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: MARKET_TZ[market],
    hour: "numeric",
    hour12: false,
  });
  const h = Number(fmt.format(date));
  return Number.isFinite(h) ? h % 24 : 0;
}

/** ¿La fecha cae dentro de una ventana pico de ese mercado? */
export function isPeak(date: Date, market: Market): boolean {
  const h = localHour(date, market);
  return PEAK_WINDOWS.some(
    (w) => w.market === market && h >= w.startHour && h < w.endHour
  );
}

/** Mercados que están en ventana pico ahora mismo. */
export function marketsInPeak(date = new Date()): Market[] {
  return (["MX", "US"] as Market[]).filter((m) => isPeak(date, m));
}

/** Etiqueta legible para logs y respuestas de cron. */
export function peakLabel(date = new Date()): string {
  const markets = marketsInPeak(date);
  if (markets.length === 0) return "fuera de ventana pico";
  const notes = PEAK_WINDOWS.filter(
    (w) => markets.includes(w.market) && localHour(date, w.market) >= w.startHour && localHour(date, w.market) < w.endHour
  ).map((w) => w.note);
  return notes.join(" · ");
}

/** Ventana pico que está activa para un mercado (o null). */
export function activeWindow(date: Date, market: Market): PeakWindow | null {
  const h = localHour(date, market);
  return (
    PEAK_WINDOWS.find(
      (w) => w.market === market && h >= w.startHour && h < w.endHour
    ) || null
  );
}

/**
 * Horas UTC aproximadas en que cada mercado entra en ventana pico — para
 * configurar los triggers de cron de Cloudflare (`[triggers] crons`).
 *
 * Cloudflare evalúa en UTC, así que aquí se traduce usando la zona IANA
 * (respeta DST). Nota: el offset se toma de una fecha de referencia, así que
 * las horas cambian una vez al año en los mercados con horario de verano.
 */
export function peakHoursUtc(reference = new Date()): Array<{
  market: Market;
  utcHours: number[];
  note: string;
}> {
  const hourInTz = (date: Date, tz: string) =>
    Number(
      new Intl.DateTimeFormat("en-US", {
        timeZone: tz,
        hour: "numeric",
        hour12: false,
      }).format(date)
    ) % 24;

  return (["MX", "US"] as Market[]).map((market) => {
    const tz = MARKET_TZ[market];
    const utcHour = reference.getUTCHours();
    const localNow = hourInTz(reference, tz);
    // Desfase actual (puede ser -5 o -6 en US según DST).
    const offset = localNow - utcHour;
    const hours = new Set<number>();
    for (const w of PEAK_WINDOWS.filter((x) => x.market === market)) {
      for (let h = w.startHour; h < w.endHour; h++) {
        hours.add(((h - offset) % 24 + 24) % 24);
      }
    }
    return {
      market,
      utcHours: [...hours].sort((a, b) => a - b),
      note: `${market}: ventanas pico locales ${PEAK_WINDOWS.filter(
        (x) => x.market === market
      )
        .map((x) => `${x.startHour}-${x.endHour}`)
        .join(", ")}`,
    };
  });
}
