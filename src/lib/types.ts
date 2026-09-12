export type Market = "MX" | "US";
export type Currency = "USD" | "MXN";
export type OrderStatus =
  | "pending_payment"
  | "paid"
  | "awaiting_owner_approval"
  | "fulfillment_queued"
  | "sent_to_cj"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "failed";

export interface Provenance {
  brand?: string;
  manufacturer?: string;
  model?: string;
  countryOfOrigin?: string;
  /** Proveedor de origen del producto: "CJ" | "Zendrop" | "Spocket" | etc. */
  supplier?: string;
  /** ID de certificación FCC (electrónicos/RF con destino US) o "SDoC". */
  certFcc?: string;
  certCe?: boolean;
  nom024?: boolean;
  certUl?: boolean;
  rohs?: boolean;
  manualUrl?: string;
  fichaTecnicaUrl?: string;
  garantiaMeses?: number;
  notes?: string;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  images: string[];
  /** Precio venta USD (única moneda; Stripe convierte la tarjeta al cobrar) */
  priceUsd: number;
  /** Precio venta fijado manualmente (sobrescribe pricing automático) */
  manualPriceUsd?: number;
  /** Costo estimado CJ en USD */
  costUsd: number;
  /** Costo envío estimado a MX en USD */
  shippingMxUsd: number;
  /** Costo envío estimado a US en USD */
  shippingUsUsd: number;
  weightGrams: number;
  cjSku: string;
  cjProductId: string;
  /** Variant ID (vid) requerido para createOrder CJ */
  cjVariantId?: string;
  stock: number;
  tags: string[];
  rating: number;
  reviews: number;
  featured?: boolean;
  active: boolean;
  provenance?: Provenance;
}

/**
 * Producto de cara al cliente. NUNCA contiene datos internos:
 * costUsd, shipping*, cjSku, cjProductId, cjVariantId.
 * Es lo único que se serializa al navegador (RSC payload / APIs públicas).
 */
export interface PublicProduct {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  images: string[];
  priceUsd: number;
  weightGrams: number;
  stock: number;
  rating: number;
  reviews: number;
  tags: string[];
  featured?: boolean;
  provenance?: Provenance;
}

/** Sanitiza un Product interno → PublicProduct (strip de datos sensibles). */
export function toPublicProduct(p: Product): PublicProduct {
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    description: p.description,
    category: p.category,
    images: p.images,
    priceUsd: p.priceUsd,
    weightGrams: p.weightGrams,
    stock: p.stock,
    rating: p.rating,
    reviews: p.reviews,
    tags: p.tags,
    featured: p.featured,
    provenance: p.provenance ?? { supplier: "CJ", garantiaMeses: 90 },
  };
}

/**
 * Normaliza un ref de afiliado (query param `?ref=`).
 * Acepta el handle con `@` (ej: "@yosoyhachi") o sin él, hace trim y trunca a
 * 120 chars. Devuelve undefined para vacíos/no-string (así la Order NO lleva
 * el campo si no hay ref, cumpliendo C4). Pura → usable en server y cliente.
 */
export function normalizeRef(raw: unknown): string | undefined {
  if (typeof raw !== "string") return undefined;
  const s = raw.trim();
  if (!s) return undefined;
  return s.slice(0, 120);
}

export interface CartItem {
  productId: string;
  qty: number;
}

export interface Customer {
  name: string;
  email: string;
  phone: string;
}

export interface Address {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  zip: string;
  country: Market;
}

export interface OrderItem {
  productId: string;
  name: string;
  qty: number;
  unitPrice: number;
  cjSku: string;
  cjVariantId?: string;
  costUsd: number;
}

export interface Order {
  id: string;
  createdAt: string;
  updatedAt: string;
  status: OrderStatus;
  market: Market;
  currency: Currency;
  customer: Customer;
  shippingAddress: Address;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  /** Costos estimados en USD para unit economics */
  cogsUsd: number;
  shippingCostUsd: number;
  paymentFeeUsd: number;
  estimatedProfitUsd: number;
  /** Tipo de cambio USD→MXN usado al crear la orden (snapshot).
   *  El webhook lo usa para normalizar amount_total MXN → USD sin depender
   *  del rate vivo (crítico para OXXO, donde el pago es diferido). */
  rateUsdMxn?: number;
  /** Descuento por promo aplicada (moneda del pedido) */
  discount?: number;
  promoCode?: string;
  /** Ref de afiliado (`?ref=` del programa de influencers, ej: "@yosoyhachi").
   *  Se persiste para pagar la comisión desde el admin. Ausente si la compra
   *  no vino de un link de afiliado. */
  ref?: string;
  cjOrderId?: string;
  /** ID real de la orden de envío en CJ (formato CJ2608...) — usado para pagos */
  cjOrderRealId?: string;
  /** Estado real de la orden en CJ (UNPAID / PAID / SHIPPED...) */
  cjOrderStatus?: string;
  /** Monto total que CJ cobrará por la orden (producto + postage) */
  cjAmountUsd?: number;
  trackingNumber?: string;
  trackingCarrier?: string;
  trackingUrl?: string;
  notes?: string;
  autoFulfilled: boolean;
  /** Stripe */
  stripeSessionId?: string;
  stripePaymentIntentId?: string;
  paymentProvider?: "demo" | "stripe";
  /** referencia de pago local (demo) */
  paymentRef?: string;
  /** Token secreto del pedido: permite ver la confirmación en /pedido/[id] */
  accessToken?: string;
  /** Estado del email de confirmación enviado al cliente */
  emailStatus?: "sent" | "skipped" | "error";
  emailError?: string;
}

export interface StoreSettings {
  brandName: string;
  primaryMarket: Market;
  secondaryMarket: Market;
  freeShippingMxUsd: number;
  freeShippingUsd: number;
  /** Envío gratis por cantidad de artículos (0 = desactivado). Sube el ticket promedio. */
  freeShippingMinQty: number;
  shippingFlatMxUsd: number;
  shippingFlatUsd: number;
  taxRateMx: number;
  taxRateUs: number;
  paymentFeeRate: number;
  cjApiKey?: string;
  cjEmail?: string;
  autoFulfill: boolean;
  /** Multiplicador de costo CJ → precio de venta (USD) */
  markup?: number;
  /** Margen mínimo % para no vender pérdida (reprice detiene si lo baja) */
  minMarginPct?: number;
  /** Comisión del influencer (programa de afiliados TikTok). Se incluye DENTRO
   *  del precio de venta: el precio piso ya reserva este % para pagar al
   *  creador, así no vendemos pérdida al repartir comisión. Default 15. */
  influencerCommissionPct?: number;
  /** Tipo de cambio USD→MXN para cobrar en pesos en México (OXXO/SPEI) */
  usdToMxn?: number;

  // === 2FA TOTP ===
  /** Secret base32 para TOTP (admin lo escanea con Authy/Google Authenticator) */
  twoFactorSecret?: string;
  /** Recovery code (8 chars hex) para emergencias si pierde el teléfono */
  twoFactorRecoveryCode?: string;
  /** Si 2FA está activado para el admin */
  twoFactorEnabled?: boolean;

  // === Roles ===
  /** Rol del usuario admin actual: owner | admin | viewer */
  adminRole?: "owner" | "admin" | "viewer";

  // === KILL-SWITCHES (1-click pause desde admin) ===
  /** Pausa hunter (descubrimiento productos nuevos) */
  pauseHunter?: boolean;
  /** Pausa reprice nocturno (precios se congelan) */
  pauseReprice?: boolean;
  /** Pausa fulfillment automático (pedidos pagados quedan en awaiting_owner_approval) */
  pauseFulfill?: boolean;
  /** Pausa sync CJ (stock/precios no se actualizan) */
  pauseSyncCj?: boolean;
  /** Pausa bot soporte (escala todo a humano) */
  pauseBot?: boolean;
}
