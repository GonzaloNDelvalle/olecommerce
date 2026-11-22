# Fase 3: Pagos y webhooks de Mercado Pago (2026-11-21)

**Alcance:** `api/webhooks/mercadopago`, `mercadopago-preference.ts`, `payment.actions.ts`, `inventory.ts`, `order-expiration.ts`, acreditación manual y cancelación en el admin, y la cuenta real de Mercado Pago (aplicación `olecommerce`, vía MCP, solo lectura).
**No ejecutado:** pagos de prueba, creación de usuarios de prueba ni cambios de configuración en la cuenta.

## Estado de la cuenta (MCP)
- 1 aplicación (`olecommerce`).
- Historial de webhooks: 1 notificación de `payment`, entregada con HTTP 200 (100 % de éxito). Tardó **3,4 s** de promedio; Mercado Pago recomienda responder 200 de inmediato.
- Checklist oficial de calidad, contra el payload de la preferencia:

| Campo recomendado | Antes | Ahora |
|---|---|---|
| `items.id`, `title`, `quantity`, `unit_price` | Sí | Sí |
| `items.description` | No | Sí |
| `items.category_id` | No | Sí (`fashion`) |
| `payer.email`, `name`, `surname` | Sí | Sí |
| `external_reference` | Sí | Sí |
| `notification_url`, `back_urls` | Sí | Sí |
| `statement_descriptor` | `OLECOMMERCE` | `OL INDUMENTI` (lo que la clienta ve en su resumen de tarjeta) |
| SDK oficial del backend | Sí | Sí |

## Lo que está bien
- El webhook **no confía en el contenido de la notificación**: consulta el pago a la API de Mercado Pago y usa ese estado.
- Valida **monto y moneda** antes de acreditar; un pago por menos del total queda en revisión y avisa al admin.
- Transiciones **idempotentes y atómicas**: `updateMany` condicionado al estado anterior, así que dos notificaciones simultáneas no acreditan dos veces ni descuentan stock dos veces.
- Casos cubiertos: pago duplicado, reintegro, contracargo, pago aprobado tras vencer la orden (reactiva si hay stock, y si no alerta para reintegrar).
- Stock: reserva con un solo `UPDATE` condicionado, sin sobreventa.
- Reintento de pago sin rehacer la orden, y vencimiento por cron con reserva liberada.

## Hallazgos y correcciones

| ID | Severidad | Hallazgo | Estado |
|---|---|---|---|
| F3-01 | Media | **Webhook lento (3,4 s):** esperaba el envío de emails antes de responder. Con carga o fallos de Resend podía superar el tiempo de espera de Mercado Pago y provocar reintentos. | Corregido: emails y alertas se envían con `after()` después del 200. |
| F3-02 | Baja | El webhook consultaba la API de MP con cualquier `data.id`. | Corregido: se exige un ID numérico (1 a 20 dígitos). |
| F3-03 | Baja | Faltaban `items.description` y `category_id` (checklist de calidad: mejoran aprobación y antifraude). | Corregido. |
| F3-04 | Baja | `statement_descriptor` mostraba "OLECOMMERCE" en el resumen de tarjeta (riesgo de desconocimiento del cargo). | Corregido: "OL INDUMENTI". |
| F3-05 | Baja | Nada avisaba si producción quedaba con `MP_USE_SANDBOX=true` o con una credencial `TEST-`. | Corregido: advertencia al arrancar en producción (`env.ts`). |
| F3-06 | Media | **Sin conciliación activa:** si el webhook nunca llega (URL mal configurada, caída), una orden pagada se cancela a las 24 h y libera el stock. Se reactiva solo si el webhook llega después. | **Abierto**, ver recomendación. |
| F3-07 | Baja | La firma `x-signature` es opcional: si falla o falta, se procesa igual (la verdad la define la API de MP). | Abierto, decisión consciente. No permite acreditar pagos falsos. |
| F3-08 | Baja | `rawWebhookData` guarda el pago completo de MP (email, identificación, primeros 6 y últimos 4 dígitos de tarjeta). | Abierto: guardar solo los campos necesarios. |
| F3-09 | Info | Reintegros y contracargos solo alertan por email; no repone stock ni cambia el estado de la orden. | Abierto, por diseño. |

## Recomendaciones
1. **F3-06, conciliación:** antes de cancelar una orden de Mercado Pago, que el cron busque pagos por `external_reference` en la API de MP y acredite los aprobados con la misma lógica del webhook (conviene extraerla a una función compartida). Es el cambio más valioso que queda en pagos.
2. **Verificar el webhook real:** en el panel de tu aplicación de Mercado Pago confirmá que la URL de producción sea `https://<tu-dominio>/api/webhooks/mercadopago` y que `MP_WEBHOOK_SECRET` sea la clave **de producción** (la de prueba no valida). Si la firma fallara en producción, hoy solo se vería como un `warn` en los logs.
3. **Prueba de punta a punta con credenciales de prueba:** creá una compra de prueba y ejecutá `quality_evaluation` con su `payment_id`; Mercado Pago evalúa la integración con datos reales. No lo ejecuté porque requiere una compra de prueba hecha por vos.
4. **F3-08:** reducir `rawWebhookData` a estado, método, monto, cuotas y fechas.

## Límites de esta fase
No se hizo ningún pago de prueba, no se crearon usuarios de prueba, y no se modificó la configuración de webhooks de la cuenta (`save_webhook`). El comportamiento de la firma en producción no se pudo confirmar: el historial solo muestra el código HTTP, no el detalle.
