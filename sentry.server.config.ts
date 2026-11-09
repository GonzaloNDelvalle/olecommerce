import * as Sentry from "@sentry/nextjs";

// Sin NEXT_PUBLIC_SENTRY_DSN, Sentry queda desactivado.
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
  tracesSampleRate: 0.1,
});
