/**
 * Devuelve solo rutas internas seguras para redirecciones post-login
 * (evita open redirects del tipo `?callbackUrl=https://sitio-malicioso.com`).
 */
export function safeInternalPath(
  candidate: string | null | undefined,
  fallback = "/mi-cuenta"
): string {
  if (!candidate) return fallback;
  if (!candidate.startsWith("/") || candidate.startsWith("//")) return fallback;
  if (candidate.includes("\\")) return fallback;
  return candidate;
}
