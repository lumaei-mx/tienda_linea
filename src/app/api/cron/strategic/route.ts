import { NextResponse } from "next/server";
import { authorizeCron } from "@/lib/cron-auth";
import { runHunter } from "@/lib/automation/hunter";
import { runTrends } from "@/lib/automation/trends";
import { marketsInPeak, peakLabel } from "@/lib/automation/schedule";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * Cron de ventana estratégica.
 *
 * Cloudflare evalúa los triggers en UTC y no distingue ventanas pico, así que
 * este cron se dispara con frecuencia y decide: si MX o US están en su franja
 * de mayor actividad social/online, corre el hunter de productos (para
 * importar y posicionar lo que está subiendo justo cuando la audiencia mira) y
 * refresca tendencias. Fuera de ventana no hace trabajo pesado, así que no
 * gasta cuota de CJ ni tiempo de cómputo.
 *
 * `?force=1` permite ejecutarlo a mano sin esperar la ventana.
 */
async function handle(req: Request) {
  const denied = authorizeCron(req);
  if (denied) return denied;

  let force = false;
  try {
    force = new URL(req.url).searchParams.get("force") === "1";
  } catch {
    force = false;
  }

  const markets = marketsInPeak();
  const window = peakLabel();

  if (markets.length === 0 && !force) {
    return NextResponse.json({
      ok: true,
      skipped: true,
      reason: "Fuera de ventana pico MX/US",
      window,
      markets: [],
    });
  }

  try {
    const [hunter, trends] = await Promise.all([
      runHunter({ onlyNew: true }).catch((e) => ({
        error: e instanceof Error ? e.message : "error",
      })),
      runTrends().catch((e) => ({
        error: e instanceof Error ? e.message : "error",
      })),
    ]);
    return NextResponse.json({
      ok: true,
      window,
      markets,
      forced: force,
      hunter,
      trends,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "error";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

export async function GET(req: Request) {
  return handle(req);
}

export async function POST(req: Request) {
  return handle(req);
}
