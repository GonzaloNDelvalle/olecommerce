/**
 * URL pública de la tienda, sin barra final.
 *
 * Orden: BETTER_AUTH_URL → NEXT_PUBLIC_APP_URL → dominio de producción de
 * Vercel (en producción) → URL del deploy (previews) → localhost.
 */
export function getAppUrl(): string {
  const raw =
    process.env.BETTER_AUTH_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    (process.env.VERCEL_ENV === "production" &&
    process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "") ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "") ||
    "http://localhost:3000";
  return raw.replace(/\/$/, "");
}

/**
 * Orígenes desde los que se aceptan pedidos de login/registro.
 * Incluye la URL principal, su variante con y sin "www" y el dominio
 * *.vercel.app del deploy actual, para que el login siga funcionando
 * mientras se migra el dominio.
 */
export function getTrustedOrigins(): string[] {
  const origins = new Set<string>();
  const add = (url: string | undefined) => {
    if (!url) return;
    try {
      const { protocol, host } = new URL(url);
      origins.add(`${protocol}//${host}`);
      const alt = host.startsWith("www.") ? host.slice(4) : `www.${host}`;
      if (!host.includes("localhost") && !host.endsWith(".vercel.app")) {
        origins.add(`${protocol}//${alt}`);
      }
    } catch {
      // URL inválida: se ignora
    }
  };

  add(getAppUrl());
  add(process.env.NEXT_PUBLIC_APP_URL?.trim());
  for (const name of [
    "VERCEL_PROJECT_PRODUCTION_URL",
    "VERCEL_URL",
    "VERCEL_BRANCH_URL",
  ]) {
    const host = process.env[name]?.trim();
    if (host) add(`https://${host}`);
  }
  return [...origins];
}
