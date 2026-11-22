const UUID_PATTERN =
  /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;

/**
 * Quita de una URL los identificadores que no deben llegar a servicios de
 * terceros (analítica): los UUID en la ruta (ej. `/checkout/confirmacion/<id>`
 * daba acceso al recibo de la orden) y el parámetro `orderId`.
 */
export function sanitizeAnalyticsUrl(rawUrl: string): string {
  try {
    const url = new URL(rawUrl, "http://localhost");
    url.pathname = url.pathname.replace(UUID_PATTERN, ":id");
    url.searchParams.delete("orderId");
    url.searchParams.delete("token");
    const isAbsolute = /^[a-z][a-z0-9+.-]*:\/\//i.test(rawUrl);
    return isAbsolute ? url.toString() : `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return rawUrl.replace(UUID_PATTERN, ":id");
  }
}
