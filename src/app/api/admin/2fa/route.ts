import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { readStoreSettings, updateStoreSettings } from "@/lib/settings-db";
import { generateTotpSecret } from "@/lib/totp";
import { recordAudit } from "@/lib/audit-log";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!(await isAdminRequest(req))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const s = await readStoreSettings();
  return NextResponse.json({
    twoFactorEnabled: !!s.twoFactorEnabled,
    hasSecret: !!s.twoFactorSecret,
    hasRecovery: !!s.twoFactorRecoveryCode,
  });
}

export async function POST(req: Request) {
  if (!(await isAdminRequest(req))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const body = await req.json().catch(() => null);
  const actor = (await import("@/lib/audit-log")).getActorFromRequest(req);

  // Generar nuevo secret (setup)
  if (body.action === "generate") {
    const email = body.email || "admin@lumaei.com";
    const { secret, otpauthUrl, recoveryCode } = generateTotpSecret(email);
    await updateStoreSettings({
      twoFactorSecret: secret,
      twoFactorRecoveryCode: recoveryCode,
      twoFactorEnabled: false, // Habilitar solo tras confirmar con código
    });
    await recordAudit({
      actor,
      action: "twofa.generate",
      target: "twofa",
      after: { enabled: false },
      severity: "critical",
    });
    return NextResponse.json({ otpauthUrl, recoveryCode });
  }

  // Verificar código y habilitar 2FA
  if (body.action === "enable" && body.code) {
    const s = await readStoreSettings();
    if (!s.twoFactorSecret) {
      return NextResponse.json({ error: "Genera el secret primero" }, { status: 400 });
    }
    const { verifyTotpCode } = await import("@/lib/totp");
    const ok = await verifyTotpCode(s.twoFactorSecret, body.code);
    if (!ok) {
      return NextResponse.json({ error: "Código inválido" }, { status: 400 });
    }
    const next = await updateStoreSettings({ twoFactorEnabled: true });
    await recordAudit({
      actor,
      action: "twofa.enable",
      target: "twofa",
      after: { enabled: true },
      severity: "critical",
    });
    return NextResponse.json({ ok: true, enabled: next.twoFactorEnabled });
  }

  // Deshabilitar 2FA
  if (body.action === "disable" && body.code) {
    const s = await readStoreSettings();
    if (!s.twoFactorSecret) {
      return NextResponse.json({ error: "2FA no activo" }, { status: 400 });
    }
    const { verifyTotpCode } = await import("@/lib/totp");
    const ok = await verifyTotpCode(s.twoFactorSecret, body.code);
    if (!ok) {
      // Intentar con recovery code
      if (s.twoFactorRecoveryCode && body.code.toUpperCase() === s.twoFactorRecoveryCode.toUpperCase()) {
        // OK, consume recovery code
      } else {
        return NextResponse.json({ error: "Código inválido" }, { status: 400 });
      }
    }
    const next = await updateStoreSettings({
      twoFactorEnabled: false,
      twoFactorRecoveryCode: undefined,
    });
    await recordAudit({
      actor,
      action: "twofa.disable",
      target: "twofa",
      after: { enabled: false },
      severity: "critical",
    });
    return NextResponse.json({ ok: true, enabled: next.twoFactorEnabled });
  }

  return NextResponse.json({ error: "Acción no válida" }, { status: 400 });
}