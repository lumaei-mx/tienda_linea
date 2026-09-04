// Identidad del responsable del comercio (persona física).
// Se publica de forma coherente en sitio, políticas y Aviso de Privacidad.
// RFC personal: aún sin régimen de actividades empresariales dado de alta;
// la regularización ante el SAT (régimen 612/626) es acción humana pendiente.
export const STORE_IDENTITY = {
  responsibleName: "Lumaei",
  rfc: "SAES910620RC4",
  entityTypeEs: "Persona física",
  entityTypeEn: "Sole proprietor (individual)",
  // Domicilio público: solo entidad/ciudad (sin calle), conforme a LFPDPPP.
  domicilePublic: "Tijuana, B.C., México",
  onlineNoteEs: "Tienda 100% en línea",
  onlineNoteEn: "100% online store",
} as const;
