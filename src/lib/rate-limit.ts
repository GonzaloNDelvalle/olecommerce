import { headers } from "next/headers";
import { db } from "@/lib/db";

/**
 * Límite de intentos por IP para Server Actions públicas (checkout,
 * arrepentimiento). Usa la misma tabla `rate_limits` que Better Auth, con
 * claves prefijadas `app:` para no mezclarse.
 *
 * Ventana fija con un único UPSERT atómico: funciona entre instancias
 * serverless sin servicios externos.
 */
export interface RateLimitRule {
  /** Identificador de la acción, ej. "checkout" */
  scope: string;
  max: number;
  windowSeconds: number;
}

export const RATE_LIMITS = {
  checkout: { scope: "checkout", max: 10, windowSeconds: 10 * 60 },
  revocation: { scope: "revocation", max: 5, windowSeconds: 60 * 60 },
} satisfies Record<string, RateLimitRule>;

export async function getClientIp(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || h.get("x-real-ip")?.trim() || "unknown";
}

/**
 * Registra un intento y devuelve `true` si todavía está dentro del límite.
 * Si la base falla, deja pasar (el límite nunca debe bloquear una venta).
 */
export async function consumeRateLimit(rule: RateLimitRule): Promise<boolean> {
  if (process.env.NODE_ENV !== "production" && !process.env.RATE_LIMIT_IN_DEV) {
    return true;
  }

  try {
    const ip = await getClientIp();
    const key = `app:${rule.scope}:${ip}`;
    const now = Date.now();
    const windowStart = now - rule.windowSeconds * 1000;

    const rows = await db.$queryRaw<{ count: number }[]>`
      INSERT INTO "rate_limits" ("id", "key", "count", "last_request")
      VALUES (gen_random_uuid(), ${key}, 1, ${now})
      ON CONFLICT ("key") DO UPDATE SET
        "count" = CASE WHEN "rate_limits"."last_request" < ${windowStart}
                       THEN 1 ELSE "rate_limits"."count" + 1 END,
        "last_request" = CASE WHEN "rate_limits"."last_request" < ${windowStart}
                       THEN ${now} ELSE "rate_limits"."last_request" END
      RETURNING "count"
    `;
    return (rows[0]?.count ?? 1) <= rule.max;
  } catch (error) {
    console.error("[rate-limit] No se pudo verificar el límite:", error);
    return true;
  }
}
