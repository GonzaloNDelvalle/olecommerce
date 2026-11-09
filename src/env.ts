import { z } from "zod";

/**
 * Validación de variables de entorno del servidor al arrancar
 * (se invoca desde `instrumentation.ts`).
 *
 * En producción, una variable obligatoria faltante corta el arranque con un
 * mensaje claro, en lugar de fallar más tarde con una clienta pagando.
 * En desarrollo solo muestra advertencias.
 */
const required = (name: string) =>
  z.string({ message: `${name} es obligatoria` }).trim().min(1, `${name} es obligatoria`);

const serverEnvSchema = z
  .object({
    DATABASE_URL: required("DATABASE_URL"),
    AUTH_SECRET: z.string().trim().min(32, "AUTH_SECRET debe tener al menos 32 caracteres").optional(),
    BETTER_AUTH_SECRET: z.string().trim().min(32).optional(),
    // En Vercel es opcional: se usa el dominio de producción del proyecto
    NEXT_PUBLIC_APP_URL: process.env.VERCEL
      ? z.string().trim().url("NEXT_PUBLIC_APP_URL debe ser una URL completa (https://...)").optional()
      : z.string().trim().url("NEXT_PUBLIC_APP_URL debe ser una URL completa (https://...)"),
    MP_ACCESS_TOKEN: required("MP_ACCESS_TOKEN"),
    CRON_SECRET: z.string().trim().min(16, "CRON_SECRET debe tener al menos 16 caracteres"),
    RESEND_API_KEY: required("RESEND_API_KEY"),
    EMAIL_FROM: required("EMAIL_FROM"),
    CLOUDINARY_CLOUD_NAME: required("CLOUDINARY_CLOUD_NAME"),
    CLOUDINARY_API_KEY: required("CLOUDINARY_API_KEY"),
    CLOUDINARY_API_SECRET: required("CLOUDINARY_API_SECRET"),
  })
  .refine((env) => Boolean(env.AUTH_SECRET || env.BETTER_AUTH_SECRET), {
    message: "Definí AUTH_SECRET (o BETTER_AUTH_SECRET)",
    path: ["AUTH_SECRET"],
  });

/** Recomendadas: la app funciona sin ellas, pero se pierde algo importante. */
const RECOMMENDED = [
  ["MP_WEBHOOK_SECRET", "no se valida la firma de los webhooks de Mercado Pago"],
  ["ADMIN_NOTIFY_EMAIL", "las alertas de pagos y arrepentimientos solo quedan en los logs"],
  ["NEXT_PUBLIC_SENTRY_DSN", "los errores de producción no se reportan a Sentry"],
] as const;

export function validateServerEnv(): void {
  const isProduction = process.env.NODE_ENV === "production";
  const result = serverEnvSchema.safeParse(process.env);

  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `  - ${issue.path.join(".") || "env"}: ${issue.message}`)
      .join("\n");
    const message = `Variables de entorno inválidas o faltantes:\n${issues}`;
    if (isProduction) throw new Error(message);
    console.warn(`⚠️  ${message}`);
  }

  if (isProduction) {
    for (const [name, consequence] of RECOMMENDED) {
      if (!process.env[name]?.trim()) {
        console.warn(`⚠️  ${name} no está definida: ${consequence}.`);
      }
    }
  }
}
