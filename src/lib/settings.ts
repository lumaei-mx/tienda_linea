import type { StoreSettings } from "./types";

export const settings: StoreSettings = {
  brandName: "Lumaei",
  primaryMarket: "MX",
  secondaryMarket: "US",
  freeShippingMxUsd: 49,
  freeShippingUsd: 49,
  /** Envío gratis por cantidad DESACTIVADO (0=off): gratis solo por monto>=49.
   *  2026-09-08: era 2 y con precio=cost*markup generaba pérdida (ej. 2x$3.98=$7.96 vs landed $16.40). */
  freeShippingMinQty: 0,
  shippingFlatMxUsd: 9.99,
  shippingFlatUsd: 9.99,
  taxRateMx: 0.16,
  taxRateUs: 0.07,
  paymentFeeRate: 0.036,
  autoFulfill: false,
  markup: 2.6,
  minMarginPct: 12,
  /** Comisión influencer (TikTok One / afiliados) reservada DENTRO del precio. */
  influencerCommissionPct: 15,
  /** Tipo de cambio USD→MXN usado para cobrar en pesos en México (OXXO/SPEI).
   *  Actualizado 2026-08-17: Banxico 17-ago FIX 17.3288 / pagos 17.3562.
   *  Estaba en 17.5 (hardcodeado) -> sobre-convertía ~2.6% más MXN. */
  usdToMxn: 17.36,

  // === KILL-SWITCHES (1-click pause desde admin) ===
  /** Pausa hunter (descubrimiento productos nuevos) */
  pauseHunter: false,
  /** Pausa reprice nocturno (precios se congelan) */
  pauseReprice: false,
  /** Pausa fulfillment automático (pedidos pagados quedan en awaiting_owner_approval) */
  pauseFulfill: false,
  /** Pausa sync CJ (stock/precios no se actualizan) */
  pauseSyncCj: false,
  /** Pausa bot soporte (escala todo a humano) */
  pauseBot: false,
};
