import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { readStoreSettings, updateStoreSettings } from "@/lib/settings-db";
import { recordAudit, getActorFromRequest } from "@/lib/audit-log";

export const dynamic = "force-dynamic";

const NUMERIC_KEYS = [
  "freeShippingMxUsd",
  "freeShippingUsd",
  "freeShippingMinQty",
  "shippingFlatMxUsd",
  "shippingFlatUsd",
  "taxRateMx",
  "taxRateUs",
  "paymentFeeRate",
  "markup",
  "minMarginPct",
  "influencerCommissionPct",
  "usdToMxn",
] as const;

// Umbrales que NUNCA deben ser <= 0 (pe. freeShipping=0 → envío gratis universal).
const POSITIVE_KEYS = new Set<string>([
  "freeShippingMxUsd",
  "freeShippingUsd",
  "shippingFlatMxUsd",
  "shippingFlatUsd",
  "markup",
  "minMarginPct",
]);

// Rangos sanos para tasas (0-1) y multiplicadores.
const RANGES: Record<string, [number, number]> = {
  taxRateMx: [0, 0.5],
  taxRateUs: [0, 0.5],
  paymentFeeRate: [0, 0.2],
  markup: [1, 10],
  minMarginPct: [0, 90],
  influencerCommissionPct: [0, 100],
  usdToMxn: [10, 30],
};

const BOOL_KEYS = [
  "autoFulfill",
  "pauseHunter",
  "pauseReprice",
  "pauseFulfill",
  "pauseSyncCj",
  "pauseBot",
] as const;

const STRING_KEYS = ["brandName", "primaryMarket", "secondaryMarket"] as const;

export async function GET(req: Request) {
  if (!(await isAdminRequest(req))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const s = await readStoreSettings();
  return NextResponse.json({ settings: s });
}

export async function PATCH(req: Request) {
  if (!(await isAdminRequest(req))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 });
  }

  const actor = getActorFromRequest(req);
  const current = await readStoreSettings();
  const before: Record<string, unknown> = {};
  const patch: Record<string, unknown> = {};

  for (const k of NUMERIC_KEYS) {
    if (k in body) {
      const v = Number(body[k]);
      if (!Number.isFinite(v)) {
        return NextResponse.json(
          { error: `${k} debe ser numérico` },
          { status: 400 }
        );
      }
      if (POSITIVE_KEYS.has(k) && v <= 0) {
        return NextResponse.json(
          { error: `${k} debe ser mayor a 0` },
          { status: 400 }
        );
      }
      const range = RANGES[k];
      if (range && (v < range[0] || v > range[1])) {
        return NextResponse.json(
          { error: `${k} fuera de rango (${range[0]}-${range[1]})` },
          { status: 400 }
        );
      }
      before[k] = (current as unknown as Record<string, unknown>)[k];
      patch[k] = v;
    }
  }
  for (const k of BOOL_KEYS) {
    if (k in body) {
      before[k] = (current as unknown as Record<string, unknown>)[k];
      patch[k] = Boolean(body[k]);
    }
  }
  for (const k of STRING_KEYS) {
    if (k in body && typeof body[k] === "string") {
      if (k === "primaryMarket" || k === "secondaryMarket") {
        const v = body[k] as string;
        if (v !== "MX" && v !== "US") {
          return NextResponse.json(
            { error: `${k} debe ser MX o US` },
            { status: 400 }
          );
        }
      }
      before[k] = (current as unknown as Record<string, unknown>)[k];
      patch[k] = body[k] as string;
    }
  }

  // Detectar kill-switch toggles para audit crítico
  const killSwitches = ["pauseHunter", "pauseReprice", "pauseFulfill", "pauseSyncCj", "pauseBot"];
  for (const ks of killSwitches) {
    if (ks in body) {
      const beforeVal = Boolean((current as unknown as Record<string, unknown>)[ks]);
      const afterVal = Boolean(body[ks]);
      if (beforeVal !== afterVal) {
        await recordAudit({
          actor,
          action: "kill_switch.toggle",
          target: `kill_switch:${ks}`,
          before: { enabled: beforeVal },
          after: { enabled: afterVal },
          meta: { ip: req.headers.get("x-forwarded-for") || "unknown" },
          severity: "critical",
        });
      }
    }
  }

  const next = await updateStoreSettings(patch);

  // Audit log general si hubo cambios
  if (Object.keys(patch).length > 0) {
    await recordAudit({
      actor,
      action: "settings.update",
      target: "settings",
      before,
      after: patch,
      meta: { ip: req.headers.get("x-forwarded-for") || "unknown" },
      severity: "warn",
    });
  }

  return NextResponse.json({ settings: next });
}
