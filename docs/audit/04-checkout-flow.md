# Fase 4: Recorrido de compra E2E (2026-11-21)

**Método:** Playwright sobre el build de producción local (`next start`), en Desktop Chrome y Pixel 7, más una recorrida manual y una revisión visual del checkout móvil.
**Seguridad de los datos:** el `.env` local apunta a una base de Neon que probablemente es la de producción. **Ningún test crea una orden ni llama a Mercado Pago.** Un test lo verifica: intercepta toda Server Action durante la validación del formulario y exige que no salga ninguna.

## Resultado
**42 de 42 tests pasan** (21 por proyecto): 11 de humo ya existentes y 10 nuevos del recorrido de compra, más cabeceras de seguridad.

| Cobertura nueva (`e2e/checkout.spec.ts`) | Escritorio | Móvil |
|---|---|---|
| Agregar desde la ficha abre el carrito con subtotal y "Finalizar compra" | OK | OK |
| El carrito se conserva al recargar | OK | OK |
| Sumar una unidad / quitar el producto | OK | OK |
| El checkout muestra contacto, entrega y medios de pago | OK | OK |
| Validación de campos obligatorios sin enviar el pedido | OK | OK |
| Email y código postal inválidos rechazados | OK | OK |
| Elegir transferencia muestra el 15 % y cambia el botón | OK | OK |
| Sin scroll horizontal en carrito y checkout | OK | OK |
| Orden inexistente: aviso 404, sin datos personales, `noindex` y `no-referrer` | OK | OK |
| Cabeceras de seguridad (`X-Frame-Options`, CSP, `nosniff`, `Referrer-Policy`) | OK | OK |

## Hallazgos y correcciones

| ID | Severidad | Hallazgo | Estado |
|---|---|---|---|
| F4-01 | Baja | El test de categorías estaba roto desde el rediseño de navegación (buscaba `nav[aria-label="Categorías"]`, que ya no existe). | Corregido: ahora usa el menú "Principal". |
| F4-02 | Baja | `upgrade-insecure-requests` estaba en la CSP Report-Only, donde el navegador lo ignora y avisa en consola. | Corregido: se quitó de esa política. |
| F4-03 | Baja | Las páginas de confirmación (`/checkout/confirmacion/[id]`, `/checkout/transferencia/[id]`) no tenían `noindex` propio ni política de referrer; la URL lleva el ID de la orden. | Corregido: `noindex` y `referrer: no-referrer`. |
| F4-04 | Baja | Una orden inexistente responde **HTTP 200** con el aviso 404 en pantalla (la página se envía en streaming antes de consultar la orden). | Abierto, mitigado con `noindex`. Cambiarlo exige rediseñar el streaming de esa página. |
| F4-05 | **Contenido** | El catálogo público incluye un producto **"Vestido de Prueba"** (`/productos/vestido-de-prueba`). | **Abierto: archivarlo antes del lanzamiento** desde el admin. |
| F4-06 | Baja (UX) | Áreas táctiles pequeñas en móvil: "Seguir comprando" y "Volver al Catálogo" miden 16 px de alto; los enlaces del pie, 28 px (la recomendación es 44 px). | Abierto. |
| F4-07 | Info | En local, `/_vercel/insights` y `/_vercel/speed-insights` dan 404. Es normal fuera de Vercel. | Sin acción. |

## Revisión visual del checkout móvil
Estructura clara en tres pasos (datos, entrega, pago), resumen con total y un único botón de pago al final, sin desbordes. Observaciones:
- Se muestra "Envío a domicilio $ 9.500" ya elegido antes de que la clienta ingrese el código postal, y ese valor después se recotiza. Conviene indicar "desde" o "se calcula con tu código postal" hasta que haya CP.
- Todo el formulario es largo (≈ 9 campos antes de la entrega). Un autocompletado por código postal reduciría fricción.

## No cubierto (requiere una base de pruebas separada)
- Confirmación real del pedido con transferencia y con Mercado Pago, stock reservado, emails y webhook de punta a punta. El pago real ya lo probaste vos con la cuenta de la clienta.
- Cotización por código postal en pantalla: llama a una Server Action que escribe un contador en la base.
- Cuentas de clienta (registro, verificación de email, `mi-cuenta`) y panel de administración con sesión.

**Recomendación:** crear una **rama de base en Neon** solo para pruebas (es gratis y se descarta) y apuntar el E2E ahí. Con eso se pueden automatizar la creación de órdenes, la reserva de stock y el cron de vencimiento sin riesgo.
