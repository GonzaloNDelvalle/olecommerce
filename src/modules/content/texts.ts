/**
 * Textos editables de la tienda (títulos, volantas y descripciones). Cada uno
 * tiene un valor por defecto; lo que se cambia en /admin/textos se guarda en la
 * tabla `site_texts` y lo reemplaza. Un texto guardado vacío oculta ese bloque.
 *
 * Los textos del banner, la campaña y el newsletter ("Manifiesto") se editan en
 * /admin/contenido, junto con sus fotos y videos.
 *
 * Comodines: {coleccion}, {temporada}, {descuento}.
 */

export interface TextDefinition {
  group: string;
  label: string;
  default: string;
  /** Texto largo: se edita en un cuadro y respeta los saltos de línea. */
  multiline?: boolean;
  max: number;
}

const short = (group: string, label: string, value: string, max = 80): TextDefinition => ({
  group,
  label,
  default: value,
  max,
});

const long = (group: string, label: string, value: string, max = 600): TextDefinition => ({
  group,
  label,
  default: value,
  multiline: true,
  max,
});

const MENU = "Menú";
const HOME = "Portada";
const FOOTER = "Pie de página";
const SHOP = "Shop";
const PRODUCT = "Ficha de producto";
const CONTACT = "Contacto";
const FAQ = "Preguntas frecuentes";
const POLICY = "Cambios y devoluciones";

export const TEXT_DEFINITIONS = {
  "nav.newIn": short(MENU, "Enlace de novedades", "New In", 30),
  "nav.products": short(MENU, "Enlace de productos", "Productos", 30),

  "home.hero.button": short(HOME, "Botón del banner", "Ver todo", 30),
  "home.featured.eyebrow": short(HOME, "Selección: título chico", "Selección {temporada}"),
  "home.featured.title": short(HOME, "Selección: título", "{coleccion}"),
  "home.featured.description": long(
    HOME,
    "Selección: descripción",
    "Las piezas que elegimos de la temporada. Arrastrá para recorrerlas.",
    240
  ),
  "home.collections.eyebrow": short(HOME, "Colecciones: título chico", "Explorá por colección"),
  "home.collections.title": short(HOME, "Colecciones: título", "Colecciones"),
  "home.outfits.eyebrow": short(HOME, "Outfits: título chico", "Shop the look"),
  "home.outfits.title": short(HOME, "Outfits: título", "Outfits para armar"),
  "home.newsletter.legal": long(
    HOME,
    "Newsletter: aclaración bajo el formulario",
    "Al suscribirte aceptás recibir novedades por email. Podés darte de baja cuando quieras desde el link de cada envío.",
    240
  ),

  "footer.about": long(
    FOOTER,
    "Texto bajo el logo",
    "Indumentaria atemporal: sastrería, tejidos y básicos en tonos tierra, diseñados en Buenos Aires.",
    240
  ),
  "footer.helpTitle": short(FOOTER, "Título de la columna de ayuda", "Ayuda", 30),
  "footer.socialTitle": short(FOOTER, "Título de las redes", "Seguinos", 30),
  "footer.paymentsTitle": short(FOOTER, "Título de los medios de pago", "Medios de pago", 40),
  "footer.addressTitle": short(FOOTER, "Título de la ubicación", "Visitanos", 30),
  "footer.address": short(FOOTER, "Dirección del local", "Leandro N. Alem 657, Local 2", 160),
  "footer.secure": short(FOOTER, "Línea inferior: seguridad", "Compra segura · Datos protegidos", 80),

  "shop.eyebrow": short(SHOP, "Título chico", "{coleccion} · {temporada}"),
  "shop.title": short(SHOP, "Título", "Shop", 40),
  "shop.description": long(
    SHOP,
    "Descripción",
    "Prendas pensadas para durar: géneros nobles, cortes amplios y una paleta tierra que combina entre sí.",
    300
  ),

  "product.related.title": short(PRODUCT, "Título de relacionados", "Completá el look"),
  "product.perk1.title": short(PRODUCT, "Recuadro 1: título", "Envíos", 30),
  "product.perk1.text": short(PRODUCT, "Recuadro 1: texto", "a todo el país", 60),
  "product.perk2.title": short(PRODUCT, "Recuadro 2: título", "Cambios", 30),
  "product.perk2.text": short(PRODUCT, "Recuadro 2: texto", "30 días sin cargo", 60),
  "product.perk3.title": short(PRODUCT, "Recuadro 3: título", "Devolución", 30),
  "product.perk3.text": short(PRODUCT, "Recuadro 3: texto", "10 días para arrepentirte", 60),
  "product.shipping.title": short(PRODUCT, "Envíos y cambios: título", "Envíos y cambios", 60),
  "product.shipping.text": long(
    PRODUCT,
    "Envíos y cambios: texto",
    "Despachamos a todo el país en 24 a 48 h hábiles desde que se acredita el pago.\n\nTenés 30 días desde que recibís el pedido para cambiar talle o prenda, sin cargo en el primer cambio."
  ),
  "product.composition.default": long(
    PRODUCT,
    "Composición (si el producto no la tiene cargada)",
    "Géneros seleccionados, confeccionados en talleres de Buenos Aires.",
    240
  ),
  "product.care.default": long(
    PRODUCT,
    "Cuidado (si el producto no lo tiene cargado)",
    "Lavar a mano con agua fría o limpieza en seco. No usar secadora. Planchar del revés a baja temperatura.",
    240
  ),

  "contact.eyebrow": short(CONTACT, "Título chico", "Atención"),
  "contact.title": short(CONTACT, "Título", "Contacto"),
  "contact.intro": long(
    CONTACT,
    "Descripción",
    "¿Una duda sobre un talle, tu pedido o un cambio? Escribinos y te respondemos por email.",
    300
  ),
  "contact.response.title": short(CONTACT, "Tiempo de respuesta: título", "Tiempo de respuesta"),
  "contact.response.text": short(CONTACT, "Tiempo de respuesta: texto", "Dentro de las 24 horas hábiles.", 120),

  "faq.eyebrow": short(FAQ, "Título chico", "Ayuda"),
  "faq.title": short(FAQ, "Título", "Preguntas frecuentes"),
  "faq.intro": long(FAQ, "Descripción", "Lo que más nos consultan. Si no encontrás tu respuesta, escribinos.", 300),
  "faq.1.q": short(FAQ, "Pregunta 1", "¿Cómo compro?", 120),
  "faq.1.a": long(
    FAQ,
    "Respuesta 1",
    "Elegí tus prendas, seleccioná talle y color, sumalas al carrito y finalizá la compra. Para comprar necesitás crear una cuenta, así podés seguir tu pedido desde «Mis pedidos»."
  ),
  "faq.2.q": short(FAQ, "Pregunta 2", "¿Qué medios de pago aceptan?", 120),
  "faq.2.a": long(
    FAQ,
    "Respuesta 2 ({descuento} = % por transferencia)",
    "Mercado Pago (tarjetas de crédito y débito, dinero en cuenta y otros medios disponibles) y transferencia bancaria, con {descuento}% de descuento. Con transferencia, reservamos tu pedido por un tiempo limitado hasta que se acredite el pago."
  ),
  "faq.3.q": short(FAQ, "Pregunta 3", "¿Hacen envíos a todo el país?", 120),
  "faq.3.a": long(
    FAQ,
    "Respuesta 3",
    "Sí, enviamos a todo el país. El costo y el plazo se calculan en el checkout según tu código postal y el peso del pedido. También podés elegir retiro en el showroom si está disponible."
  ),
  "faq.4.q": short(FAQ, "Pregunta 4", "¿Cómo sigo mi pedido?", 120),
  "faq.4.a": long(
    FAQ,
    "Respuesta 4",
    "Cuando despachamos tu pedido te enviamos un email con el transportista y el código de seguimiento. También podés ver el estado en «Mis pedidos»."
  ),
  "faq.5.q": short(FAQ, "Pregunta 5", "¿Cómo elijo mi talle?", 120),
  "faq.5.a": long(
    FAQ,
    "Respuesta 5",
    "Cada producto tiene su guía de talles en la ficha. Si seguís con dudas, escribinos con tu altura y talle habitual y te recomendamos."
  ),
  "faq.6.q": short(FAQ, "Pregunta 6", "¿Puedo cambiar o devolver una prenda?", 120),
  "faq.6.a": long(
    FAQ,
    "Respuesta 6",
    "Sí. Tenés derecho a arrepentirte de tu compra dentro de los 10 días corridos de recibida, y aceptamos cambios por talle o color según las condiciones de nuestra política."
  ),
  "faq.7.q": short(FAQ, "Pregunta 7", "¿Cómo cuido mis prendas?", 120),
  "faq.7.a": long(
    FAQ,
    "Respuesta 7",
    "En cada ficha de producto encontrás la composición y la guía de cuidado. Seguirla ayuda a que los tejidos y la sastrería duren mucho más."
  ),

  "policy.eyebrow": short(POLICY, "Título chico", "Ayuda"),
  "policy.title": short(POLICY, "Título", "Cambios y devoluciones"),
  "policy.intro": long(
    POLICY,
    "Descripción",
    "Queremos que estés conforme con tu compra. Estas son las condiciones y los pasos para cambiar o devolver una prenda.",
    300
  ),
  "policy.exchange.title": short(POLICY, "Cambios: título", "Cambios"),
  "policy.exchange.text": long(
    POLICY,
    "Cambios: texto",
    "Podés cambiar una prenda por otro talle o color dentro de los 30 días corridos de recibida, sujeto a disponibilidad de stock."
  ),
  "policy.exchange.list": long(
    POLICY,
    "Cambios: condiciones (una por línea)",
    "La prenda debe estar sin uso, sin lavar y con sus etiquetas originales.\nLos productos en liquidación o con descuento especial pueden tener condiciones distintas, que se informan en la ficha.\nSi el cambio se debe a un error nuestro (producto equivocado o con falla), el envío corre por nuestra cuenta."
  ),
  "policy.steps.title": short(POLICY, "Pasos: título", "Cómo pedir un cambio"),
  "policy.steps.list": long(
    POLICY,
    "Pasos (uno por línea)",
    "Escribinos desde Contacto con tu número de pedido y qué prenda querés cambiar.\nTe confirmamos disponibilidad y te indicamos cómo enviarnos la prenda.\nCuando la recibimos y la revisamos, despachamos tu nuevo talle o color."
  ),
  "policy.revocation.title": short(POLICY, "Arrepentimiento: título", "Botón de arrepentimiento"),
  "policy.revocation.text": long(
    POLICY,
    "Arrepentimiento: texto (obligatorio por ley)",
    "Según la Ley de Defensa del Consumidor (art. 34 de la Ley 24.240 y Res. 424/2020), podés revocar tu compra dentro de los 10 días corridos desde que recibiste el producto, y coordinamos el retiro sin costo de logística a tu cargo."
  ),
  "policy.refunds.title": short(POLICY, "Reintegros: título", "Reintegros"),
  "policy.refunds.text": long(
    POLICY,
    "Reintegros: texto",
    "Los reintegros se hacen por el mismo medio de pago con el que compraste, una vez que recibimos y revisamos la prenda. El plazo en que se acredita depende de tu banco o tarjeta."
  ),
} satisfies Record<string, TextDefinition>;

export type TextKey = keyof typeof TEXT_DEFINITIONS;
export type SiteTexts = Record<TextKey, string>;

export const TEXT_KEYS = Object.keys(TEXT_DEFINITIONS) as TextKey[];

/** Valores por defecto reemplazados por los guardados (ignora claves viejas). */
export function mergeTexts(overrides: { key: string; value: string }[]): SiteTexts {
  const saved = new Map(overrides.map((row) => [row.key, row.value]));
  return Object.fromEntries(
    TEXT_KEYS.map((key) => [key, saved.get(key) ?? TEXT_DEFINITIONS[key].default])
  ) as SiteTexts;
}

/** Reemplaza comodines y limpia separadores sueltos ("Neutral State · "). */
export function fillText(template: string, values: Record<string, string | number>): string {
  return template
    .replace(/\{(\w+)\}/g, (match, name: string) => (name in values ? String(values[name]) : match))
    .replace(/^[\s·—-]+|[\s·—-]+$/g, "")
    .trim();
}

/** Líneas no vacías de un texto largo (listas y párrafos). */
export function textLines(value: string): string[] {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}
