# AUTHORIZATION_QUEUE — GERENCIA tienda_linea

Cola de acciones económicas bloqueadas a la espera de aprobación del dueño.
Toda acción fuera de "presupuesto cero / cliente-paga" (sección 4 del MANDATE)
debe registrarse aquí Y enviarse como solicitud vía Telegram antes de ejecutar.

Formato de cada entrada:
```
### [ID] fecha
- Acción:
- Monto:
- Justificación:
- Retorno esperado:
- Plan de rollback:
- Estado: PENDIENTE | APROBADA | RECHAZADA
- Respuesta del dueño:
```

### [AQ-001] 2026-08-24
- Acción: Migrar equipo Vercel "lumaei" de plan Hobby a Pro ($20/mes).
- Monto: $20 USD/mes (~$360 MXN/mes, facturable a la tarjeta del dueño).
- Justificación: El plan Hobby de Vercel es NO COMERCIAL (prohibido para
  tiendas con ventas). lumaei ya registra ventas reales; permanecer en Hobby
  es riesgo de suspensión del despliegue por ToS, sin aviso, lo que cerraría
  la tienda. Pro autoriza uso comercial, mejora performance de conversión y
  permite configurar spend cap para control de costo.
- Retorno esperado: Continuidad operativa (evita caída por ToS), mayor
  velocidad/Conversión, y spend cap configurable para no pasarnos de presupuesto.
- Plan de rollback: Reversible — el código no cambia; si se rechaza se queda
  en Hobby con aviso; si se aprueba y hay problema se puede volver a Hobby.
- Estado: PENDIENTE (BLOQUEADA hasta aprobación del dueño)
- Respuesta del dueño:
