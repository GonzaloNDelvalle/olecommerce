/**
 * URL pública de la tienda, sin barra final.
 *
 * Orden: BETTER_AUTH_URL → NEXT_PUBLIC_APP_URL → URL del deploy de Vercel
 * (previews) → localhost.
 */
export function getAppUrl(): string {
  const raw =
    process.env.BETTER_AUTH_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "") ||
    "http://localhost:3000";
  return raw.replace(/\/$/, "");
}
