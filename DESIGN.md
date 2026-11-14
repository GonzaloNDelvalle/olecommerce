# DESIGN.md — OL. Indumenti

Reglas de diseño de la tienda. Toda pantalla nueva o modificada las sigue; si una regla cambia, se cambia acá primero.

Prioridades, en orden: **legibilidad → jerarquía → estados interactivos → movimiento**. Animamos solo cuando ayuda a entender una acción (feedback, continuidad espacial, cambio de estado) o en momentos de marca poco frecuentes (hero, sección destacada). La compra nunca espera a una animación.

---

## 1. Paleta

Los tonos de siempre (chocolate, negro, blanco, crema) nombrados como tokens, más tonos afines. Ningún hex suelto en componentes: siempre el token.

| Token | Hex | Uso |
|---|---|---|
| `ink` | `#15110E` | Negro cálido. Texto principal, botón primario, íconos. |
| `espresso` | `#2C2119` | Chocolate oscuro. Secciones oscuras, footer, hover del primario. |
| `chocolate` | `#5C4033` | Acento de marca. Eyebrows, links, anillo de foco, selección activa. |
| `caramel` | `#8E5A35` | Acento secundario. Badge de colección, detalles, subrayados. |
| `sand` | `#D2B48C` | Acento sobre fondos oscuros (texto y bordes sobre espresso/ink). |
| `cream` | `#EFE6D8` | Bloques y cards crema, fondo de imágenes mientras cargan. |
| `paper` | `#FAF7F2` | Fondo general de la tienda. |
| `white` | `#FFFFFF` | Superficies elevadas: drawer, inputs, popovers. |
| `stone-*` | Tailwind | Bordes (`stone-200/300`) y texto secundario (`stone-600`). |
| `olive` | `#5F6342` | Éxito, stock disponible. |
| `brick` | `#9E3B2E` | Error, descuento, sin stock. |

Contraste verificado (WCAG):

| Texto / fondo | Ratio | Uso permitido |
|---|---|---|
| ink / paper | 17.6 | todo |
| chocolate / paper · cream | 8.8 · 7.6 | todo |
| caramel / paper · cream | 5.4 · 4.6 | todo |
| sand / espresso | 8.0 | todo |
| cream / espresso | 12.7 | todo |
| olive / paper | 5.9 | todo |
| brick / paper | 6.3 | todo |
| stone-600 / cream | 6.2 | texto secundario |
| stone-500 / paper | 4.5 | solo ≥ 14px; en cream usar stone-600 |

## 2. Tipografía

- **Display**: Cormorant Garamond (h1, h2, títulos editoriales, precio grande en la ficha). Pesos 400–600, itálica para énfasis.
- **UI**: Plus Jakarta Sans (todo lo demás).
- **Escala**: 12 · 14 · 16 · 18 · 22 · 28 · 40 · 56 · 80 px. **Mínimo absoluto 12px** (labels en mayúscula con `tracking` 0.12–0.18em). Cuerpo 16px.
- Headings: `letter-spacing: -0.02em`, `line-height: 1.05`. Cuerpo: `line-height: 1.5`, `max-width: 65ch`.
- Precios, cantidades y contadores: `font-variant-numeric: tabular-nums`. Formato con `Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" })`.
- Inputs: 16px mínimo (evita el zoom de iOS).

## 3. Forma y espacio

- Esquinas: rectas en imágenes y bloques editoriales (identidad actual); `rounded-full` solo en pills (talles, chips, contador del carrito) y en botones flotantes de vidrio.
- Espaciado en múltiplos de 4px. Gutter lateral 16px mobile, 24px tablet, 40px desktop. Ancho máximo de contenido 1440px.
- Áreas táctiles ≥ 44×44px.

## 4. Movimiento

| Token | Valor | Uso |
|---|---|---|
| `--ease-out` | `cubic-bezier(0.23, 1, 0.32, 1)` | Entradas y salidas |
| `--ease-in-out` | `cubic-bezier(0.77, 0, 0.175, 1)` | Movimiento en pantalla |
| `--ease-drawer` | `cubic-bezier(0.32, 0.72, 0, 1)` | Sheets y drawers |
| spring | `{ type: "spring", duration: 0.5, bounce: 0.2 }` | Drag, gestos, contador del carrito |

| Elemento | Duración |
|---|---|
| Press (`scale(0.97)`) | 140ms |
| Hover de color | 150ms `ease` |
| Dropdowns, mega-menú | 200ms entrada / 150ms salida |
| Drawers, sheets | 400ms entrada / 280ms salida |
| Hero y sección destacada | 500–600ms, stagger 100–150ms |
| Grillas y listas | 300ms, stagger 30–80ms no uniforme, una sola entrada por contenedor |

Reglas:
- Solo `transform` y `opacity`. Nunca `transition: all`. Nunca `ease-in`. Nunca desde `scale(0)` (mínimo 0.95 + opacidad).
- Salida siempre más rápida que la entrada.
- Hover solo bajo `@media (hover: hover) and (pointer: fine)`.
- Nada animado en acciones de teclado ni en lo que se usa decenas de veces (cambiar talle, filtros, paginación): cambio instantáneo de estado.
- Checkout, auth y formularios: cero movimiento decorativo; solo feedback (press, validación, carga).
- Tilt y movimiento atado al puntero: solo en contenido decorativo (hero, sección destacada), nunca en la grilla del catálogo ni en la ficha.
- Drag: sigue al dedo 1:1, suelta con spring, se puede agarrar a mitad de animación; cierre por distancia (~40%) o velocidad (> 0.11 px/ms).
- `prefers-reduced-motion`: se conservan opacidad y color, se quita todo desplazamiento, escala, parallax, tilt y la escena WebGL (queda la imagen fija).

## 5. Material vidrio

Superficies que flotan sobre imagen o sobre contenido que scrollea. Nunca para contenido ni para formularios.

| Variante | Fondo | Blur | Borde | Texto |
|---|---|---|---|---|
| `glass-light` | paper 72% | 16px + `saturate(1.4)` | 1px blanco 40% (arriba) | ink, peso 500+ |
| `glass-dark` | espresso 72% | 16px + `saturate(1.4)` | 1px sand 20% | paper / sand |

Contraste medido sobre negro, blanco y chocolate: ink sobre `glass-light` ≥ 8.9; paper sobre `glass-dark` ≥ 5.8.

- **Sí**: header (transparente sobre el hero → `glass-light` al scrollear), CTA sticky de la ficha en mobile, controles flotantes de galería y visor 3D, botón "agregar rápido" sobre la foto de la card (aparece al hover), chips de filtros activos, barra inferior del menú mobile.
- **No**: formularios de checkout/auth, drawer del carrito (fondo `white` sólido), textos largos, vidrio sobre vidrio.
- El blur no se anima; al aparecer se anima la opacidad del tinte (y escala 0.97→1 en flotantes).
- Fallback a fondo sólido (paper / espresso) con `@supports not (backdrop-filter: blur(1px))` y con `prefers-reduced-transparency: reduce`.
- En vez de un borde inferior duro bajo el header, una máscara de degradado suave donde el contenido pasa por debajo.

## 6. Estados interactivos

Todo elemento clickeable tiene: hover (si hay puntero fino), `:active` (`scale(0.97)` en botones), `:focus-visible` (anillo 2px chocolate con offset 2px; sand sobre fondos oscuros) y `disabled` (opacidad 40%, sin hover). Los talles sin stock se ven tachados y siguen siendo legibles. Los estados de carga reemplazan el contenido del botón sin cambiar su tamaño.

## 7. 3D

- **WebGL** (React Three Fiber) solo en el hero de la home y en la sección destacada. Se carga después de que pinta la imagen del hero (que es el LCP), se pausa fuera de pantalla y no se carga con reduced motion, `saveData` o equipos de baja gama.
- **CSS/motion 3D** en el resto: profundidad en la galería de la ficha (arrastrable 1:1 en mobile), planos con perspectiva en la sección destacada.

## 8. Aparición al scrollear

El contenido entra a medida que aparece en pantalla, para que la página se sienta viva sin frenar la lectura.

- **Una vez por elemento** (`once: true`), disparado cuando entra ~15% en pantalla (`margin: "0px 0px -15% 0px"`). Al volver a subir no se repite.
- **Bloques**: opacidad 0→1 + `translateY(24px)`→0, 500ms `--ease-out`.
- **Títulos editoriales** (h1/h2 serif): cada línea sube desde una máscara (`clip-path`/overflow hidden + `translateY(100%)`), 600ms, 80ms entre líneas.
- **Imágenes grandes**: revelado con `clip-path: inset(0 0 100% 0)` → `inset(0)` 700ms `--ease-in-out`, la imagen escala 1.08→1 al mismo tiempo.
- **Grillas de productos**: stagger 40–70ms no uniforme por fila, una sola entrada por grilla.
- **Campaña (video a pantalla completa)**: parallax suave del medio (±6% de desplazamiento, atado al scroll, solo `transform`).
- **Nunca** en: header, filtros, carrito, checkout, formularios, precios, contenido above-the-fold del catálogo y la ficha (se ve de entrada, sin esperar).
- Contenido visible sin JS: el estado inicial oculto se aplica solo cuando el script ya montó (no se esconde nada en el HTML del servidor, así no se rompe el SEO ni el LCP).
- Reduced motion: solo fundido de opacidad 200ms, sin desplazamiento, sin parallax.

## 9. Layout por página (aprobado)

Mockups: [OL. Rediseño — Mockups](https://claude.ai/artifact/DgYAaUfxjYfaPvvqPwpY8Y). Layout de la dirección B (inmersiva) con la paleta clara de A.

- **Header**: píldora flotante de vidrio con nav a la izquierda, logo "OL." al centro, buscar/cuenta/carrito a la derecha. Sobre el hero arranca transparente.
- **Home**: hero crema con el abrigo 3D flotando (WebGL) y titular serif gigante → **campaña a pantalla completa** (video o imagen editable desde el admin, titular, botón pausar, accesos a categorías como chips de vidrio) → sección 3D "La materia del invierno" (carrusel de cards en profundidad, arrastrable) → Novedades (grilla 4 col, "agregar rápido" en vidrio al hover) → el look de la temporada (imagen + lista de prendas + "Comprar el look") → newsletter chocolate → footer espresso.
- **Categoría `/categoria/[slug]`**: migas, H1 serif grande + texto corto, subcategorías en pills, barra de filtros sticky (Filtros, Talle, Color, Precio, Ordenar), chips de filtros activos, grilla 4 col (2 en mobile), "Ver más" con progreso, bloque de texto SEO al final.
- **Ficha**: galería con miniaturas + imagen principal y controles flotantes de vidrio (anterior/siguiente, girar, ampliar); panel sticky con colección, nombre, precio + cuotas, colores, talles (sin stock tachado, aviso de pocas unidades), CTA que cambia a "Agregado ✓", beneficios, acordeones. Mobile: galería a pantalla completa con swipe y barra de compra fija de vidrio. Abajo "Completá el look".
- **Carrito**: drawer derecho de 480px, fondo blanco sólido, barra de envío gratis, cantidades, "Combina con", subtotal y "Finalizar compra".
- **Checkout**: sin nav, 3 pasos (datos, entrega, pago), resumen crema sticky, errores inline con cómo corregirlos.
- **Mi cuenta**: menú lateral en pills, pedidos como cards con línea de estado.
- **Mobile**: barra de navegación inferior de vidrio (Inicio, Tienda, Cuenta, Carrito).
