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


---

# Adenda: rama de pruebas y tests con escritura (2026-11-21)

Se creó la rama **`e2e-testing`** del proyecto Neon (creada desde `production` **solo con el esquema, sin datos de clientas**). Con ella los tests ya pueden crear órdenes, reservar stock y ejecutar el cron sin riesgo.

## Cómo funciona
- `.env.e2e` (ignorado por git) contiene las cadenas de conexión de la rama y **credenciales falsas** de Mercado Pago y Resend: las pruebas nunca cobran y nunca envían un email real (Resend rechaza la clave falsa y queda en el log).
- `playwright.config.ts` compara el host de `.env.e2e` con el de `.env`. **Solo si son distintos** compila un build propio (`.next-e2e`, contra la rama) y habilita los tests que escriben. Si no, esos tests se saltean.
- `pnpm db:seed:e2e` carga configuración, envíos y portada (con datos bancarios falsos) y `pnpm db:seed` los productos y un admin de pruebas. Ambos se niegan a correr contra la base de `.env`.
- La rama tiene el historial de migraciones registrado (`prisma migrate status`: al día).

## Resultado: 50 de 50 tests pasan (dos corridas consecutivas), 8 saltados a propósito (los de escritura corren solo en escritorio)

| Test nuevo (`e2e/orders.spec.ts`) | Qué verifica |
|---|---|
| Orden por transferencia | Totales calculados en el servidor (subtotal, 15 % de descuento, envío), stock reservado, recibo sin DNI ni email completo |
| Cron de vencimiento | 401 sin secreto o con uno incorrecto; con secreto vence la orden vieja y libera el stock |
| Acreditación manual en el admin | Sin sesión redirige a login; con el admin la orden pasa a pagada y se descuenta el stock (stock −1, reserva liberada) |
| Falla de Mercado Pago | Mensaje genérico, orden cancelada, stock liberado, reintentar no acumula reservas |
| Webhook | Ignora IDs inválidos y otros temas, responde al ping, y con un pago no verificable devuelve 500 sin filtrar detalles |
| Última unidad | Dos compras simultáneas: exactamente una prospera, y nunca se reserva más de lo que hay |
| Newsletter | Queda pendiente hasta confirmar; reintentar no genera otro link; un token falso o reutilizado no sirve |
| Arrepentimiento | Se registra aunque el pedido no exista, la respuesta es la misma, y el 4.º intento del día con el mismo email se rechaza |

## Hallazgos de esta tanda

| ID | Severidad | Hallazgo | Estado |
|---|---|---|---|
| F4-08 | **Media** | **Si Mercado Pago no podía generar el link de pago, la orden quedaba PENDING con el stock reservado**; cada reintento de la clienta creaba otra orden y reservaba más prendas hasta que el cron las vencía a las 24 h. Además se enviaba el email "Orden confirmada" de una compra que no se completó. | **Corregido** en `checkout.actions.ts`: la orden se cancela y libera el stock al instante, y el email de confirmación sale solo cuando el link de pago se generó. |
| F4-09 | Info | La base de producción **ya tiene aplicadas todas las migraciones** (incluida la del newsletter): comparando la rama con el esquema actual no hay diferencias. La advertencia de la Fase 2 sobre aplicarla antes de desplegar ya no corresponde. | Sin acción. |
| F4-10 | Info | La base de la rama protege la integridad del stock con una restricción (`reservado ≤ stock`), que el propio test activó al restaurar valores inconsistentes. | Sin acción. |

## Qué sigue sin cubrir
- El flujo real de aprobación de un pago (webhook con un pago aprobado) necesita la API de Mercado Pago; está cubierto por el pago real que hiciste y por revisión de código.
- Registro, verificación de email y `mi-cuenta` de clientas.
