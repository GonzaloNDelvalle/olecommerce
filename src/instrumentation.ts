import * as Sentry from "@sentry/nextjs";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // No validar durante `next build`: Vercel inyecta las variables en runtime
    if (process.env.NEXT_PHASE !== "phase-production-build") {
      const { validateServerEnv } = await import("./env");
      validateServerEnv();
    }
    await import("../sentry.server.config");
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("../sentry.edge.config");
  }
}

// Reporta a Sentry los errores de Server Components, Route Handlers y Server Actions
export const onRequestError = Sentry.captureRequestError;
