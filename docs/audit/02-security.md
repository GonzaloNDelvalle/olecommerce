# Fase 2: Seguridad del código, OWASP Top 10:2025 (2026-11-19)

**Alcance:** todo `src/` (server actions, rutas API, auth, proxy, lib) y `prisma/schema.prisma`.
**Método:** revisión estática de código, sin ejecutar la app ni probar contra un entorno desplegado.
**No evaluable:** configuración real de Vercel/Neon/Cloudinary, valores de las variables de entorno, comportamiento en producción de las cabeceras `x-forwarded-for`, y la integración real con Mercado Pago (Fase 3).

## Resumen
No hay hallazgos críticos ni altos. La base es sólida: precios, stock y costo de envío se recalculan en el servidor; la reserva de stock es atómica; **las 31 acciones del backoffice y el export CSV llaman a `requireAdmin()`**, que además revalida el rol en la base; el SQL crudo usa plantillas parametrizadas; el webhook consulta el pago real a la API de Mercado Pago y valida monto y moneda; el cron usa `timingSafeEqual`; el redirect post-login está acotado a rutas internas; el export CSV neutraliza fórmulas.

| Severidad | Cantidad | Estado |
|---|---|---|
| Media | 3 | 3 corregidas |
| Baja | 5 | 3 corregidas, 2 abiertas (webhook en la Fase 3; `x-forwarded-for` a verificar) |

## Hallazgos

### OWASP-A01-001: Datos personales de una orden accesibles solo con el UUID, y endpoints públicos innecesarios (CWE-639) — Media, confianza Media. CORREGIDO
- **Dónde:** `checkout.actions.ts` (`getConfirmationOrderDetails`, `getTransferOrderDetails`) y `payment.actions.ts` (`createMercadoPagoPreference`) estaban en archivos `"use server"`, así que Next los expone como endpoints POST invocables por cualquiera.
- **Impacto:** quien tuviera el UUID de una orden recibía nombre, email completo y DNI/CUIT. El UUID no es adivinable, pero llega a terceros: la URL `/checkout/confirmacion/<uuid>` la reciben Google Analytics, Meta Pixel y Vercel Analytics, y queda en el historial y en el `Referer`.
- **Arreglo aplicado:** las lecturas pasaron a `order-details.ts` (ya no son endpoints), validan el formato del UUID, **ya no devuelven el DNI/CUIT** y enmascaran el email (`g•••••@gmail.com`). `createMercadoPagoPreference` pasó a `mercadopago-preference.ts`; solo `retryMercadoPagoPayment` queda público.
- **Seguimiento aplicado:** GA4 y Vercel Analytics/Speed Insights ahora reciben la URL sin el UUID (`analytics-privacy.ts`, `GaPageViews.tsx`, `VercelMetrics.tsx`). **Límite conocido:** Meta Pixel envía la URL real de la página y no permite reemplazarla; como el recibo ya no expone DNI y el email va enmascarado, el riesgo residual es bajo.

### OWASP-A10-001: Mensajes de error internos devueltos al navegador (CWE-209) — Media, confianza Alta. CORREGIDO
- **Dónde:** `checkout.actions.ts` devolvía `error.message` de cualquier excepción; `mercadopago-preference.ts` devolvía el mensaje del SDK de Mercado Pago.
- **Impacto:** un error de Prisma o del SDK podía mostrar nombres de tablas, consultas o detalles de la API.
- **Arreglo aplicado:** una clase `CheckoutError` marca los mensajes de negocio (stock, producto no disponible, envío sin cotización); cualquier otro error se registra en el servidor y la clienta ve un mensaje genérico.

### OWASP-A02-001: Sin cabeceras de seguridad (CWE-1021) — Media, confianza Alta. CORREGIDO (Fase 1)
Se agregó `frame-ancestors`, HSTS, `nosniff`, `Referrer-Policy`, `Permissions-Policy` y una CSP completa en modo Report-Only (`next.config.ts`).

### OWASP-A08-001: La firma del webhook de Mercado Pago es opcional (CWE-345) — Baja, confianza Alta. ABIERTO, se trata en la Fase 3
- **Dónde:** `api/webhooks/mercadopago/route.ts:101-116`. Si falta la cabecera, falta `MP_WEBHOOK_SECRET` o la firma no coincide, solo se registra un `warn` y se sigue.
- **Mitigación existente:** el estado del pago se consulta a la API de Mercado Pago con el ID recibido, y se valida monto y moneda. Un atacante no puede acreditar un pago falso.
- **Impacto real:** cualquiera puede disparar consultas a la API de MP y lecturas/escrituras en la base con IDs arbitrarios (abuso de recursos).

### OWASP-A06-001: El botón de arrepentimiento envía un email a cualquier dirección (CWE-799) — Baja, confianza Alta. CORREGIDO
`revocation.actions.ts`: no exige que el email corresponda a la orden y envía la constancia a la dirección indicada, más una alerta al admin. Límite actual: 5 por hora y por IP. Permite usar la tienda para enviar correo no solicitado a terceros, y llenar la bandeja del admin con solicitudes de órdenes inexistentes.
**Arreglo aplicado:** la constancia por email se envía solo si el pedido existe y es de ese email, el mensaje en pantalla es idéntico en ambos casos y hay un límite de 3 solicitudes por día por email.

### OWASP-A06-002: Alta de newsletter sin doble confirmación (CWE-799) — Baja, confianza Alta. CORREGIDO
`newsletter.actions.ts` suscribe cualquier email con un solo envío. Un tercero puede inscribir a otra persona. **Arreglo aplicado:** doble opt-in. El email queda `PENDING` hasta que la persona confirma desde `/newsletter/confirmar`; recién ahí se registra el consentimiento y se envía la bienvenida. La migración `20261120120000_newsletter_double_opt_in` ya está aplicada en producción (verificado el 2026-11-21 comparando la base con el esquema actual).

### OWASP-A07-001: Límite de intentos basado en `x-forwarded-for` (CWE-348) — Baja, confianza Media. [MANUAL VERIFICATION REQUIRED]
`lib/rate-limit.ts` toma la primera IP de `x-forwarded-for`. En Vercel la plataforma lo sobrescribe y es seguro; en otro hosting o detrás de otro proxy sería falsificable. Además falla abierto si la base no responde (decisión de negocio declarada). El límite de login de Better Auth usa su propio mecanismo en base de datos.

### OWASP-A06-003: Acciones públicas sin límite de uso (CWE-770) — Baja, confianza Media. CORREGIDO
`quoteShippingForCart` (hasta 50 variantes por llamada, consulta a la base) y `retryMercadoPagoPayment` (llama a la API de MP) no tienen límite por IP. **Arreglo aplicado:** 60 cotizaciones y 10 reintentos de pago cada 10 minutos por IP (`lib/rate-limit.ts`).

## Cobertura por categoría

| Categoría | Estado | Notas |
|---|---|---|
| A01 Control de acceso | Evaluada | Admin correcto. Órdenes de la cuenta filtradas por `session.user.id`. Hallazgo 001 corregido. |
| A02 Configuración | Evaluada parcialmente | Cabeceras corregidas. Falta ver la configuración real de Vercel y el estado de la CSP en producción. |
| A03 Cadena de suministro | Evaluada | 2 avisos restantes, solo desarrollo (Fase 1). Lockfile presente. |
| A04 Criptografía | Evaluada | scrypt (Better Auth) y bcrypt heredado, `randomInt`/`randomBytes` para códigos y tokens, `timingSafeEqual` en el cron. Sin hallazgos. |
| A05 Inyección | Evaluada | `$queryRaw`/`$executeRaw` solo como plantillas parametrizadas. Sin `eval`. El único `dangerouslySetInnerHTML` escapa `<`. |
| A06 Diseño inseguro | Evaluada | Hallazgos 001 a 003. Precio, descuento y envío recalculados en el servidor. |
| A07 Autenticación | Evaluada | Verificación de email obligatoria, sesiones en base y revocables, reset de 1 hora, respuesta genérica ante emails existentes, cuentas desactivadas bloqueadas. |
| A08 Integridad | Evaluada | Hallazgo 001 (webhook). Zod valida todos los payloads, sin mass assignment (`role` con `input: false`). |
| A09 Logging | Evaluada parcialmente | Alertas por email al admin ante pagos anómalos. `console.log` del webhook incluye la URL completa de la notificación. Sentry configurado. |
| A10 Excepciones | Evaluada | Hallazgo 001 corregido. |

## Limitaciones
Revisión estática. No se probaron flujos en ejecución, no se vio la configuración desplegada ni los valores de `.env`. Las pruebas dinámicas (IDOR, manipulación de precios, reintentos) quedan para la Fase 4.
