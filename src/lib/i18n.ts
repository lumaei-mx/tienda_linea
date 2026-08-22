// i18n ligero — toda la UI pública de la tienda (el admin queda en español).
// `t("clave", lang)` devuelve la cadena en el idioma seleccionado.
// Único texto que NO se traduce: el logo.

export type Lang = "es" | "en";

const dict = {
  // Navegación
  navCollection: { es: "La Colección", en: "The Collection" },
  navShipping: { es: "Envíos y Entrega", en: "Shipping & Delivery" },

  // Botón atrás
  back: { es: "Volver", en: "Back" },

  // Precios / moneda
  priceUsdSuffix: { es: "dlls", en: "USD" },
  priceNote: {
    es: "Precio final · envío e impuestos al checkout",
    en: "Final price · shipping & taxes at checkout",
  },

  // Barra envío gratis
  freeShipMx: { es: "Envío GRATIS", en: "FREE shipping" },
  freeShipToMx: { es: "a México", en: "to Mexico" },
  freeShipFromMx: { es: "desde", en: "from" },
  freeShipToUs: { es: "a Estados Unidos", en: "to the United States" },

  // Productos
  newLabel: { es: "Nuevo", en: "New" },
  reviewsLabel: { es: "reseñas", en: "reviews" },
  addToCart: { es: "Agregar", en: "Add to cart" },
  addToCartOk: { es: "Agregado", en: "Added" },
  categoryDefault: { es: "General", en: "General" },
  outOfStock: { es: "Agotado", en: "Out of stock" },

  // Copy fallback de producto (PDP)
  fbSubtitle: {    es: "Seleccionado y enviado directamente desde el almacén a tu puerta. Envíos a México y Estados Unidos con rastreo.",
    en: "Hand-picked and shipped directly from the warehouse to your door. Tracked shipping to Mexico and the United States.",
  },
  fbBenefit1: {
    es: "Producto real verificado con stock disponible",
    en: "Real product verified with stock available",
  },
  fbBenefit2: {
    es: "Envío con rastreo a México (14-16 días) y Estados Unidos (4-7 días)",
    en: "Tracked shipping to Mexico (14-16 days) and the United States (4-7 days)",
  },
  fbBenefit3: {
    es: "Pago seguro procesado por Stripe",
    en: "Secure payment processed by Stripe",
  },
  fbBenefit4: {
    es: "Soporte por escrito: si llega dañado, te reponemos el producto",
    en: "Written support: if it arrives damaged, we replace the product",
  },
  fbSpecWeight: { es: "Peso del paquete: ~{g} g", en: "Package weight: ~{g} g" },
  fbFaq1Q: { es: "¿Cuánto tarda el envío?", en: "How long does shipping take?" },
  fbFaq1A: {
    es: "México: 14 a 16 días hábiles. Estados Unidos: 4 a 7 días. Recibirás número de rastreo.",
    en: "Mexico: 14 to 16 business days. United States: 4 to 7 days. You'll receive a tracking number.",
  },
  fbFaq2Q: { es: "¿Y si llega dañado?", en: "What if it arrives damaged?" },
  fbFaq2A: {
    es: "Te reponemos el producto sin costo. Escríbenos con foto o video dentro de los primeros 14 días.",
    en: "We replace the product at no cost. Write to us with a photo or video within the first 14 days.",
  },

  // Carrito
  cartTitle: { es: "Carrito", en: "Cart" },
  cartEmpty: { es: "Tu carrito está vacío", en: "Your cart is empty" },
  goToCollection: { es: "Ir a la colección", en: "Go to collection" },
  summary: { es: "Resumen", en: "Summary" },
  subtotal: { es: "Subtotal", en: "Subtotal" },
  shipping: { es: "Envío", en: "Shipping" },
  free: { es: "Gratis", en: "Free" },
  iva: { es: "IVA (16%)", en: "Tax (16%)" },
  total: { es: "Total", en: "Total" },
  checkout: { es: "Ir a pagar", en: "Checkout" },
  shippingNote: {
    es: "Envío e impuestos se calculan según tu país al pagar.",
    en: "Shipping & taxes are calculated based on your country at checkout.",
  },
  loadingCart: { es: "Cargando carrito…", en: "Loading cart…" },
  cartFreeShipNeed: {
    es: "Agrega {n} más para envío gratis",
    en: "Add {n} more for free shipping",
  },
  cartFreeShipUnlocked: {
    es: "¡Envío gratis desbloqueado!",
    en: "Free shipping unlocked!",
  },
  cartPromoHint: {
    es: "10% de bienvenida: usa LUMAI10 al pagar",
    en: "10% welcome off: use LUMAI10 at checkout",
  },
  cartTrustLine: {
    es: "90 días de garantía · Pago seguro Stripe",
    en: "90-day guarantee · Secure Stripe payment",
  },

  // Checkout
  checkoutTitle: { es: "Checkout", en: "Checkout" },
  payNow: { es: "Pagar", en: "Pay" },
  payProcessing: { es: "Procesando...", en: "Processing..." },
  yourOrder: { es: "Tu pedido", en: "Your order" },
  discount: { es: "Descuento", en: "Discount" },
  promoCode: { es: "Código de promo", en: "Promo code" },
  promoHint: {
    es: "¿Primera compra? Prueba LUMAI10 (10% off)",
    en: "First order? Try LUMAI10 (10% off)",
  },
  apply: { es: "Aplicar", en: "Apply" },
  checkoutTrustG: {
    es: "90 días de garantía · reposición si llega dañado",
    en: "90-day guarantee · replace if damaged",
  },
  checkoutTrustS: {
    es: "Envío gratis desde 2 piezas · con rastreo",
    en: "Free shipping from 2 items · tracked",
  },
  checkoutTrustP: {
    es: "Pago 100% seguro con Stripe",
    en: "100% secure payment via Stripe",
  },
  countryLabel: { es: "País de envío", en: "Shipping country" },
  countryMx: { es: "🇲🇽 México", en: "🇲🇽 Mexico" },
  countryUs: { es: "🇺🇸 Estados Unidos", en: "🇺🇸 United States" },
  formName: { es: "Nombre completo", en: "Full name" },
  formEmail: { es: "Email", en: "Email" },
  formPhone: { es: "Teléfono / WhatsApp", en: "Phone / WhatsApp" },
  formLine1: { es: "Dirección", en: "Address" },
  formLine2: { es: "Depto / referencias", en: "Apt / references" },
  formCity: { es: "Ciudad", en: "City" },
  formState: { es: "Estado", en: "State" },
  formZip: { es: "C.P.", en: "ZIP" },
  formStateUs: { es: "State", en: "State" },
  formZipUs: { es: "ZIP", en: "ZIP" },
  stripeRedirect: {
    es: "Serás redirigido a Stripe para completar el pago seguro. El cargo se procesa en dólares (USD); tu banco convierte a pesos al momento del pago. El pedido se envía solo cuando Stripe confirma el cobro.",
    en: "You'll be redirected to Stripe to complete the secure payment. The charge is processed in USD; your bank converts to your local currency at the moment of payment. The order is shipped only when Stripe confirms the charge.",
  },
  demoMode: {
    es: "Modo demo (sin cargo real): el pedido se marca pagado y se envía automáticamente.",
    en: "Demo mode (no real charge): the order is marked paid and shipped automatically.",
  },
  noItems: { es: "No hay productos para pagar.", en: "No products to pay for." },

  // Conversión estimada a pesos (justo antes de pagar)
  approxInMxn: {
    es: "Aproximadamente",
    en: "Approximately",
  },
  fxRateLabel: {
    es: "Tipo de cambio en vivo",
    en: "Live exchange rate",
  },
  fxRateNote: {
    es: "El pago se procesa en dólares. Esta conversión es estimada para tu referencia.",
    en: "Payment is processed in USD. This conversion is an estimate for your reference.",
  },
  fxRateFallback: {
    es: "La conversión a pesos no está disponible ahora; el pago se procesa en dólares.",
    en: "The conversion to your currency is unavailable now; payment is processed in USD.",
  },

  // Aviso aranceles (varios productos)
  dutyNoticeTitle: { es: "Aviso de importación", en: "Import notice" },
  dutyNotice: {
    es: "Pedidos con varios artículos pueden superar el umbral de franquicia aduanal (US$50) y estar sujetos a aranceles de importación que el destinatario cubre al recibir.",
    en: "Orders with multiple items may exceed the customs duty-free threshold (US$50) and be subject to import duties paid by the recipient upon delivery.",
  },

  // Home — Hero
  heroEyebrow: { es: "Envíos a México y Estados Unidos", en: "Shipping to Mexico & the US" },
  heroTitleA: { es: "Piezas que iluminan", en: "Pieces that brighten" },
  heroTitleB: { es: "tu día a día", en: "your everyday" },
  heroSubtitle: {
    es: "Selección curada de hogar, cocina, lifestyle y mascotas, con envío con seguimiento a México y Estados Unidos.",
    en: "A curated selection of home, kitchen, lifestyle and pet pieces, with tracked shipping to Mexico and the US.",
  },
  heroCta: { es: "Ver colección", en: "View collection" },

  // Home — Tarjetas de valor
  valueShipT: { es: "Envíos a México y Estados Unidos", en: "Shipping to Mexico & the US" },
  valueShipD: { es: "Entregas con seguimiento en todo MX y US.", en: "Tracked delivery across MX and the US." },
  valuePackT: { es: "Embalaje cuidadoso", en: "Careful packaging" },
  valuePackD: { es: "Cada pedido se revisa y empaca a mano antes de salir.", en: "Every order is checked and hand-packed before shipping." },
  valueCurT: { es: "Selección premium", en: "Premium curation" },
  valueCurD: { es: "Solo piezas que elegimos por diseño, materiales y durabilidad.", en: "Only pieces we choose for design, materials and durability." },
  valueSafeT: { es: "Compra protegida", en: "Protected purchase" },
  valueSafeD: { es: "Pago seguro y soporte real en español e inglés.", en: "Secure payment and real support in Spanish and English." },

  // Home — Destacados
  featuredEyebrow: { es: "Destacados", en: "Featured" },
  featuredTitle: { es: "Colección esencial", en: "Essential collection" },
  viewAll: { es: "Ver todo", en: "View all" },

  // Home — Cómo funciona
  howEyebrow: { es: "Experiencia Lumaei", en: "The Lumaei experience" },
  howTitle: { es: "Cómo funciona", en: "How it works" },
  how1T: { es: "Elige tu pieza", en: "Choose your piece" },
  how1D: {
    es: "Explora la colección curada de hogar, cocina, lifestyle y mascotas con precios finales en dólares.",
    en: "Browse our curated collection of home, kitchen, lifestyle and pet pieces with final prices in USD.",
  },
  how2T: { es: "Pago seguro", en: "Secure checkout" },
  how2D: {
    es: "Completa tu compra en un checkout cifrado con tarjeta. Tu banco convierte los dólares a tu moneda al pagar.",
    en: "Complete your order in an encrypted checkout with your card. Your bank converts USD to your currency at payment.",
  },
  how3T: { es: "Preparamos tu pedido", en: "We prepare your order" },
  how3D: {
    es: "Cada pedido se revisa y prepara con cuidado, y recibes tu número de seguimiento.",
    en: "Every order is reviewed and carefully prepared, and you get your tracking number.",
  },
  how4T: { es: "Entrega con seguimiento", en: "Tracked delivery" },
  how4D: {
    es: "Rastrea tu paquete hasta tu puerta. México: 14–16 días hábiles · EE. UU.: 4–7 días.",
    en: "Track your package to your door. Mexico: 14–16 business days · US: 4–7 days.",
  },

  // Catálogo
  catalogEyebrow: { es: "Catálogo", en: "Catalog" },
  catalogTitle: { es: "La Colección", en: "The Collection" },
  catalogSubtitle: {
    es: "Selección curada · precios en dólares (USD)",
    en: "Curated selection · prices in USD",
  },
  catalogSearch: { es: "Buscar en la colección…", en: "Search the collection…" },
  catalogSearching: { es: "Buscando…", en: "Searching…" },
  catalogNoResults: {
    es: "No encontramos piezas con esos filtros.",
    en: "No pieces match those filters.",
  },
  catalogAll: { es: "Todos", en: "All" },
  catalogCountOne: { es: "1 pieza", en: "1 piece" },
  catalogCountMany: { es: "{n} piezas", en: "{n} pieces" },
  catalogSort: { es: "Ordenar", en: "Sort" },
  sortRecommended: { es: "Recomendados", en: "Recommended" },
  sortPriceAsc: { es: "Precio: menor a mayor", en: "Price: low to high" },
  sortPriceDesc: { es: "Precio: mayor a menor", en: "Price: high to low" },
  sortNewest: { es: "Novedades", en: "Newest" },

  // Grupos de categoría (catálogo)
  catPet: { es: "Mascotas", en: "Pet" },
  catKitchen: { es: "Cocina", en: "Kitchen" },
  catHome: { es: "Hogar", en: "Home" },
  catElectronics: { es: "Electrónica", en: "Electronics" },
  catAuto: { es: "Auto", en: "Auto" },
  catLifestyle: { es: "Lifestyle", en: "Lifestyle" },

  // Footer
  footerMarkets: { es: "Mercados", en: "Markets" },
  footerMarkets1: {
    es: "Precios mostrados en pesos (MXN) · el cobro es en USD y tu banco convierte al pagar",
    en: "Prices in USD · your bank converts at checkout",
  },
  footerMarkets2: {
    es: "Envíos a México y Estados Unidos",
    en: "Shipping to Mexico and the United States",
  },
  footerMarkets3: { es: "Paga con tarjeta", en: "Pay by card" },
  footerHelp: { es: "Ayuda", en: "Help" },
  footerHelp1: { es: "Envíos y tiempos de entrega", en: "Shipping & delivery times" },
  footerHelp2: { es: "Garantía y devoluciones", en: "Guarantee & returns" },
  footerHelp3: { es: "Términos y Privacidad", en: "Terms & Privacy" },
  footerHelp4: { es: "Nuestra historia", en: "Our story" },
  footerContact: { es: "Contacto", en: "Contact" },
  footerTracked: {
    es: "Pedidos rastreados · Soporte en español e inglés",
    en: "Tracked orders · Support in Spanish & English",
  },
  footerRights: { es: "TIENDA ONLINE", en: "ONLINE STORE" },
  footerWhatsApp: { es: "WhatsApp:", en: "WhatsApp:" },

  // PDP
  productTrust: {
    es: "90 días de garantía · Envío gratis desde 2 piezas · Pago seguro Stripe",
    en: "90-day guarantee · Free shipping from 2 items · Secure Stripe checkout",
  },
  productOfferStack: {
    es: "Qué incluye tu compra",
    en: "What your purchase includes",
  },
  productOfferG: {
    es: "90 días de garantía: si llega dañado o no funciona, te lo reponemos.",
    en: "90-day guarantee: if it arrives damaged or doesn't work, we replace it.",
  },
  productOfferS: {
    es: "Envío gratis desde 2 piezas (MX y US) · con número de rastreo.",
    en: "Free shipping from 2 items (MX & US) · with tracking number.",
  },
  productOfferD: {
    es: "10% de bienvenida con el código LUMAI10 en tu 1ª compra.",
    en: "10% welcome discount with code LUMAI10 on your first order.",
  },
  productDescription: { es: "Descripción", en: "Description" },
  productSpecs: { es: "Especificaciones", en: "Specifications" },
  productDocs: { es: "Documentación y procedencia", en: "Documentation & provenance" },
  productFaq: { es: "Preguntas frecuentes", en: "FAQ" },
  productCategoryDefault: { es: "Hogar", en: "Home" },

  // Trust badges (PDP)
  trustPayT: { es: "Pago 100% seguro", en: "100% secure payment" },
  trustPayD: { es: "Procesado por Stripe", en: "Processed by Stripe" },
  trustShipT: { es: "Envío con rastreo", en: "Tracked shipping" },
  trustShipD: {
    es: "México 14-16 días · USA 4-7 días",
    en: "Mexico 14-16 days · USA 4-7 days",
  },
  trustReturnT: { es: "90 días de garantía", en: "90-day guarantee" },
  trustReturnD: {
    es: "Si llega dañado o no funciona, te lo reponemos",
    en: "If damaged or defective, we replace it",
  },
  trustSupportT: { es: "Soporte directo", en: "Direct support" },
  trustSupportD: {
    es: "Te respondemos por escrito",
    en: "We reply in writing",
  },

  // Barra superior envío gratis (full)
  freeShipBar: {
    es: "Envío GRATIS desde 2 piezas · o desde {mx} MX / {us} US · Precios en pesos MXN · Código LUMAI10 = 10%",
    en: "FREE shipping from 2 items · or from {mx} MX / {us} US · Prices in USD · Code LUMAI10 = 10% off",
  },

  // Páginas de ayuda — comunes
  helpEyebrow: { es: "Ayuda", en: "Help" },
  legalEyebrow: { es: "Legal", en: "Legal" },
  lumaeiEyebrow: { es: "Lumaei", en: "Lumaei" },
  keepShopping: { es: "Seguir comprando", en: "Continue shopping" },
  viewCatalog: { es: "Ver catálogo", en: "View catalog" },

  // Envíos
  shipTitle: { es: "Envíos y entregas", en: "Shipping & delivery" },
  shipIntro: {
    es: "En Lumaei preparamos cada pedido con cuidado y lo enviamos con seguimiento directamente a tu puerta, en México y en Estados Unidos.",
    en: "At Lumaei we carefully prepare every order and ship it with tracking directly to your door, in Mexico and the United States.",
  },
  shipTimesT: { es: "Tiempos de entrega", en: "Delivery times" },
  shipCountryMx: { es: "México:", en: "Mexico:" },
  shipCountryUs: { es: "Estados Unidos:", en: "United States:" },
  shipTimesMx: {
    es: "México: 14 a 16 días hábiles en promedio. Recibirás un número de rastreo una vez que tu pedido sale del almacén.",
    en: "Mexico: 14 to 16 business days on average. You'll receive a tracking number once your order leaves the warehouse.",
  },
  shipTimesUs: {
    es: "Estados Unidos: 4 a 7 días hábiles.",
    en: "United States: 4 to 7 business days.",
  },
  shipCostT: { es: "Costos de envío", en: "Shipping costs" },
  shipFreeLine: {
    es: "Envío gratis en pedidos desde {mx} a México, y desde {us} a Estados Unidos.",
    en: "Free shipping on orders from {mx} to Mexico, and from {us} to the US.",
  },
  shipFlatLine: {
    es: "Para pedidos menores, el envío tiene un costo plano de $9.99 USD.",
    en: "For smaller orders, shipping has a flat rate of $9.99 USD.",
  },
  shipUsdLine: {
    es: "Todos los precios están en dólares (USD). Tu banco convierte el cargo a pesos al momento del pago.",
    en: "All prices are in US dollars (USD). Your bank converts the charge to your currency at payment time.",
  },
  shipDutyT: { es: "Aranceles de importación", en: "Import duties" },
  shipDuty1: {
    es: "Un solo artículo de Lumaei se declara muy por debajo del umbral de franquicia aduanal (US$50), por lo que no paga aranceles.",
    en: "A single Lumaei item is declared well below the customs duty-free threshold (US$50), so it doesn't pay duties.",
  },
  shipDuty2: {
    es: "Cuando un pedido incluye varios artículos y el valor declarado del paquete supera US$50, el destinatario en México puede estar sujeto a aranceles de importación (tasa ~19%) que se cubren al recibir el paquete. Esto es decisión de la aduana y varía según el país de origen y el valor del paquete.",
    en: "When an order includes several items and the package's declared value exceeds US$50, the recipient in Mexico may be subject to import duties (rate ~19%) paid upon receiving the package. This is decided by customs and varies by country of origin and package value.",
  },
  shipDuty3: {
    es: "Si tu pedido es grande y quieres evitar sorpresas, escríbenos antes de pagar y te cotizamos la mejor opción de envío.",
    en: "If your order is large and you want to avoid surprises, write to us before paying and we'll quote you the best shipping option.",
  },
  shipLateT: {
    es: "¿Qué pasa si tarda más de lo esperado?",
    en: "What if it takes longer than expected?",
  },
  shipLate: {
    es: "Si tu pedido supera los 25 días hábiles sin entregarse, escríbenos a {email} o por {whatsapp} y lo resolvemos: reenvío o reembolso según corresponda.",
    en: "If your order exceeds 25 business days without delivery, write to {email} or via {whatsapp} and we'll resolve it: reshipment or refund as appropriate.",  },

  // Devoluciones
  retTitle: { es: "Devoluciones y garantía", en: "Returns & guarantee" },
  retIntro: {
    es: "Queremos que quedes contento con tu compra. Por eso ofrecemos una garantía de satisfacción.",
    en: "We want you to be happy with your purchase. That's why we offer a satisfaction guarantee.",
  },
  retDamagedT: { es: "Producto dañado o incorrecto", en: "Damaged or incorrect item" },
  retDamaged: {
    es: "Si tu pedido llega dañado, incompleto o con piezas faltantes, te reponemos el producto o te reembolsamos el monto total sin costo adicional. Solo necesitamos una foto o video del problema.",
    en: "If your order arrives damaged, incomplete or missing parts, we'll replace the product or refund the full amount at no extra cost. We just need a photo or video of the issue.",
  },
  retChangeT: { es: "Arrepentimiento de compra", en: "Change of mind" },
  retChange: {
    es: "Puedes solicitar devolución dentro de los primeros 14 días naturales tras recibir tu pedido. El producto debe estar en buen estado. El reembolso se hace una vez que confirmamos la devolución; los gastos de envío de regreso corren por cuenta del cliente, salvo que el producto tenga un defecto.",
    en: "You can request a return within 14 calendar days of receiving your order. The product must be in good condition. The refund is issued once we confirm the return; return shipping costs are covered by the customer unless the product is defective.",
  },
  retHowT: { es: "¿Cómo inicias una devolución?", en: "How do you start a return?" },
  retHow1: {
    es: "Escríbenos a {email}",
    en: "Write to us at {email}",
  },
  retHow2: { es: "O por {whatsapp}", en: "Or via {whatsapp}" },
  retHow3: {
    es: "Incluye tu número de pedido y una foto del producto. Te decimos los siguientes pasos en menos de 24 horas.",
    en: "Include your order number and a photo of the product. We'll tell you the next steps within 24 hours.",
  },
  retLegalT: { es: "Garantía legal de 90 días", en: "90-day legal guarantee" },
  retLegal: {
    es: "Los dispositivos electrónicos y de belleza tienen 90 días de garantía contra defectos de fábrica (Ley Federal de Protección al Consumidor). Si tu producto falla por defecto de fabricación, lo reponemos o te reembolsamos sin costo. La garantía no cubre daño por mal uso, golpes o exposición a líquidos no especificados.",
    en: "Electronics and beauty devices carry a 90-day guarantee against manufacturing defects (Federal Consumer Protection Law). If your product fails due to a manufacturing defect, we replace it or refund you at no cost. The guarantee does not cover damage from misuse, drops or exposure to unspecified liquids.",
  },

  // Contacto
  contTitle: { es: "Contacto", en: "Contact" },
  contIntro: {
    es: "Estamos para ayudarte antes, durante y después de tu compra.",
    en: "We're here to help you before, during and after your purchase.",
  },
  contEmail: { es: "Correo", en: "Email" },
  contWhatsapp: { es: "WhatsApp", en: "WhatsApp" },
  contWhatsappNote: {
    es: "Respondemos en horario México. Para pedidos, incluye tu número de orden.",
    en: "We reply during Mexico business hours. For orders, include your order number.",
  },
  contHours: {
    es: "Horario de atención: lunes a sábado. Tiempo de respuesta típico: menos de 24 horas.",
    en: "Support hours: Monday to Saturday. Typical response time: under 24 hours.",
  },

  // Términos
  termsTitle: {
    es: "Términos, privacidad y cookies",
    en: "Terms, privacy & cookies",
  },
  termsPrivacyT: { es: "Privacidad", en: "Privacy" },
  termsPrivacy: {
    es: "Solo recopilamos los datos necesarios para procesar tu pedido: nombre, correo, dirección de envío y datos de pago. Tus datos de pago se procesan directamente con Stripe (PCI-DSS) y nunca los almacenamos en nuestros servidores. No vendemos tu información a terceros.",
    en: "We only collect the data needed to process your order: name, email, shipping address and payment details. Your payment data is processed directly with Stripe (PCI-DSS) and never stored on our servers. We don't sell your information to third parties.",
  },
  termsCookiesT: { es: "Uso de cookies", en: "Cookie usage" },
  termsCookies: {
    es: "Usamos cookies para recordar tu carrito y tu idioma, y para medir el tráfico de la tienda. Puedes bloquearlas desde tu navegador; la tienda seguirá funcionando, aunque algunas funciones (como recordar el carrito) podrían no persistir.",
    en: "We use cookies to remember your cart and your language, and to measure store traffic. You can block them from your browser; the store will keep working, though some features (like remembering your cart) might not persist.",
  },
  termsBuyT: { es: "Términos de compra", en: "Purchase terms" },
  termsBuy1: {
    es: "Los precios se muestran en pesos mexicanos (MXN); el cobro se hace en dólares (USD) y tu banco lo convierte a pesos al pagar.",
    en: "Prices are shown in US dollars (USD); your bank converts the charge to your currency at payment time.",
  },
  termsBuy2: {
    es: "Los tiempos de entrega son estimados; pueden variar por aduanas o logística local.",
    en: "Delivery times are estimates; they may vary due to customs or local logistics.",
  },
  termsBuy3: {
    es: "Al comprar aceptas estos términos y nuestra política de devoluciones.",
    en: "By purchasing you accept these terms and our returns policy.",
  },
  termsLegalT: { es: "Contacto legal", en: "Legal contact" },
  termsLegal: {
    es: "Cualquier duda: {email} o {whatsapp}.",
    en: "Any questions: {email} or {whatsapp}.",
  },

  // Sobre nosotros
  aboutTitle: { es: "Nuestra historia", en: "Our story" },
  aboutP1: {
    es: "Lumaei es una tienda online curada: seleccionamos productos útiles y con potencial y los enviamos a tu puerta en México y Estados Unidos.",
    en: "Lumaei is a curated online store: we select useful products with real potential and ship them to your door in Mexico and the US.",
  },
  aboutP2: {
    es: "No somos un bazar infinito. Cada producto que ves en la tienda pasó por una revisión de costo, margen y viabilidad de envío. Si está publicado, es porque creemos que vale la pena.",
    en: "We're not an endless bazaar. Every product you see went through a review of cost, margin and shipping viability. If it's published, it's because we believe it's worth it.",
  },
  aboutP3: {
    es: "Enviamos directo desde nuestro almacén a tu puerta para mantener precios justos sin inventario parado. Eso significa tiempos de entrega de 2 a 3 semanas en México — lo decimos claro para que no haya sorpresas.",
    en: "We ship directly from our warehouse to your door to keep prices fair with no idle inventory. That means 2-3 week delivery times in Mexico — we say it clearly so there are no surprises.",
  },
  aboutCommitT: { es: "Nuestro compromiso", en: "Our commitment" },
  aboutC1: { es: "Pago seguro con tarjeta.", en: "Secure card payment." },
  aboutC2: { es: "Envío con rastreo en cada pedido.", en: "Tracked shipping on every order." },
  aboutC3: {
    es: "Garantía: si llega dañado, te lo reponemos.",
    en: "Guarantee: if it arrives damaged, we replace it.",
  },
  aboutC4: {
    es: "Soporte real por correo y WhatsApp.",
    en: "Real support by email and WhatsApp.",
  },

  // Reviews (PDP)
  reviewsTitle: { es: "Opiniones de clientes", en: "Customer reviews" },
  reviewsEmpty: {
    es: "Sé de los primeros en probar este producto. Escríbenos si tienes dudas antes de comprar.",
    en: "Be one of the first to try this product. Write to us if you have questions before buying.",
  },
  reviewsVerified: { es: "reseñas verificadas", en: "verified reviews" },
  reviewsBadge: { es: "Compra verificada", en: "Verified purchase" },

  // Confirmación de pedido
  orderPrivate: { es: "Pedido privado", en: "Private order" },
  orderPrivateMsg: {
    es: "Este enlace requiere la clave del pedido. Usa el enlace que recibiste al completar la compra.",
    en: "This link requires the order key. Use the link you received when completing your purchase.",
  },
  backToStore: { es: "Volver a la tienda", en: "Back to store" },
  orderConfirming: { es: "Confirmando tu pago…", en: "Confirming your payment…" },
  orderPending: { es: "Pago pendiente", en: "Payment pending" },
  orderConfirmed: { es: "¡Pedido confirmado!", en: "Order confirmed!" },
  orderPendingMsg: {
    es: "Aún no recibimos el pago. El pedido se preparará solo cuando el pago se confirme.",
    en: "We haven't received payment yet. Your order will be prepared only once payment is confirmed.",
  },
  orderStatus: { es: "Estado", en: "Status" },
  orderStatusPendingPayment: { es: "Pago pendiente", en: "Payment pending" },
  orderStatusPaid: { es: "Pagado", en: "Paid" },
  orderStatusAwaitingApproval: {
    es: "Esperando autorización de envío",
    en: "Awaiting shipping authorization",
  },
  orderStatusQueued: { es: "En preparación", en: "Being prepared" },
  orderStatusSent: { es: "Enviado al almacén", en: "Sent to warehouse" },
  orderStatusShipped: { es: "Enviado", en: "Shipped" },
  orderStatusDelivered: { es: "Entregado", en: "Delivered" },
  orderStatusCancelled: { es: "Cancelado", en: "Cancelled" },
  orderStatusFailed: { es: "Fallido", en: "Failed" },
  orderTotal: { es: "Total", en: "Total" },
  orderRef: { es: "Pedido", en: "Order" },
  orderTracking: { es: "Tracking", en: "Tracking" },
  orderPendingTracking: { es: "Se asignará pronto", en: "Will be assigned soon" },
  orderUnitEcon: { es: "Unit economics (estimado)", en: "Unit economics (estimate)" },
  orderNetProfit: {
    es: "Ganancia neta ~ {profit} USD · COGS {cogs} · envío {ship} · fee {fee}",
    en: "Net profit ~ {profit} USD · COGS {cogs} · shipping {ship} · fee {fee}",
  },
  payNow2: { es: "Pagar ahora", en: "Pay now" },
  payOpening: { es: "Abriendo pago…", en: "Opening payment…" },
  paymentError: { es: "Error de pago", en: "Payment error" },
  paymentCancelled: {
    es: "El pago no se completó. Tus productos siguen en el carrito — puedes intentarlo de nuevo cuando quieras.",
    en: "Payment was not completed. Your items are still in the cart — you can try again whenever you like.",
  },
  orderPendingLabel: { es: "Pendiente", en: "Pending" },
  notFoundTitle: { es: "Página no encontrada", en: "Page not found" },
  notFoundMsg: {
    es: "La página que buscas no existe o fue movida.",
    en: "The page you're looking for doesn't exist or was moved.",
  },
  notFoundCta: { es: "Volver a la tienda", en: "Back to the store" },

  // Email capture — popup exit-intent (lead magnet)
  leadHeadline: {
    es: "5 gadgets que te ahorran 1h al día (en serio)",
    en: "5 gadgets that save you 1h a day (seriously)",
  },
  leadSub: {
    es: "La lista que ya uso en casa. Te mando también 10% de descuento (LUMAI10) en tu 1ª compra. Gratis, sin spam.",
    en: "The list I already use at home. I'll also send you 10% off (LUMAI10) on your first order. Free, no spam.",
  },
  leadCta: { es: "Enviármelo gratis", en: "Send it to me free" },
  leadEmailPlaceholder: { es: "tu@email.com", en: "you@email.com" },
  leadConfirm: { es: "Revisa tu correo 📩", en: "Check your inbox 📩" },
  leadError: {
    es: "Algo salió mal. Intenta de nuevo.",
    en: "Something went wrong. Try again.",
  },
  leadRateLimit: {
    es: "Ya recibimos tu solicitud. Revisa tu correo.",
    en: "We already received your request. Check your inbox.",
  },
  leadPrivacy: {
    es: "Sin spam. Cancelas cuando quieras.",
    en: "No spam. Unsubscribe anytime.",
  },
} as const;

export type DictKey = keyof typeof dict;

export function t(key: DictKey, lang: Lang): string {
  const entry = dict[key];
  if (!entry) return String(key);
  return entry[lang] ?? entry.es;
}

/** Idioma por defecto según región (simple): es. */
export function detectLang(): Lang {
  if (typeof window === "undefined") {
    return "es";
  }
  // Client: cookie primero, luego navigator.
  try {
    const m = document.cookie.match(/(?:^|;\s*)lumaei-lang=([a-z]{2})/);
    if (m && (m[1] === "es" || m[1] === "en")) return m[1] as Lang;
  } catch {
    // ignore
  }
  const nav = window.navigator as Navigator & { userLanguage?: string };
  const lang = (nav.language || nav.userLanguage || "es").slice(0, 2).toLowerCase();
  return lang === "en" ? "en" : "es";
}

/** Server-side: cookie de idioma → Accept-Language → es (Next 15, cookies() async). */
export async function detectLangServer(): Promise<Lang> {
  try {
    const { cookies, headers } = await import("next/headers");
    const store = await cookies();
    const cookie = store.get("lumaei-lang")?.value;
    if (cookie === "es" || cookie === "en") return cookie;
    // Sin cookie: respeta el idioma del navegador (visitantes de US → EN).
    const h = await headers();
    const accept = (h.get("accept-language") || "").slice(0, 2).toLowerCase();
    if (accept === "en") return "en";
  } catch {
    // entorno sin next/headers (test/CLI)
  }
  return "es";
}
