import { NextResponse } from "next/server";
import { isCjConfigured, testCjConnection } from "@/lib/cj";
import { isStripeConfigured } from "@/lib/stripe";
import { isRedisAvailable } from "@/lib/storage";
import { isEmailConfigured } from "@/lib/email";
import { isTelegramConfigured } from "@/lib/notify-telegram";
import { isAgentMailConfigured } from "@/lib/agentmail";

export const dynamic = "force-dynamic";

export async function GET() {
  const cj = isCjConfigured()
    ? await testCjConnection().catch((e) => ({
        ok: false,
        mode: "error",
        error: e instanceof Error ? e.message : "error",
      }))
    : { ok: false, mode: "unconfigured" };

  // Flags de runtime que determinan si las órdenes se PAGAN y se CUMPLEN.
  // Expuestas en health para verificación (no son secretos).
  // Nota: sandbox=true NO degrada el health por sí solo; solo se reporta
  // en `cj.sandbox` / `fulfillmentReady` para que el operador decida.
  const cjSandbox = process.env.CJ_SANDBOX === "true";
  const cjAutoPay = process.env.CJ_AUTO_PAY_BALANCE === "true";

  const redis = isRedisAvailable();
  const stripe = isStripeConfigured();
  const email = isEmailConfigured();
  const telegram = isTelegramConfigured();
  const agentmail = isAgentMailConfigured();
  const cjOk = (cj as { ok?: boolean }).ok === true;

  // Núcleo para operar de forma autónoma: persistencia + proveedor.
  const coreOk = redis && cjOk;
  // Auxiliares que degradan (avisos, cobros, soporte) pero no tumban la tienda.
  const auxOk = stripe && email && telegram && agentmail;

  const status: "ok" | "degraded" | "down" = coreOk && auxOk
    ? "ok"
    : coreOk
      ? "degraded"
      : "down";

  return NextResponse.json({
    ok: coreOk,
    status,
    services: {
      redis,
      stripe,
      email,
      telegram,
      agentmail,
      cj: {
        ...(cj as object),
        sandbox: cjSandbox,
        autoPay: cjAutoPay,
        // ok de negocio: CJ configurado, NO sandbox, y auto-pay activo
        fulfillmentReady: cjOk && !cjSandbox && cjAutoPay,
      },
    },
    time: new Date().toISOString(),
  });
}
