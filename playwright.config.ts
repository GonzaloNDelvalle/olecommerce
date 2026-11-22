import { existsSync, readFileSync } from "node:fs";
import { defineConfig, devices } from "@playwright/test";
import { parse } from "dotenv";

/**
 * Pruebas de punta a punta sobre el build de producción.
 * Uso: `pnpm build && pnpm test:e2e`.
 *
 * Base de datos:
 * - Con `.env.e2e` apuntando a una base DISTINTA a la del `.env` (rama de pruebas de
 *   Neon), el servidor corre contra esa base con credenciales falsas de Mercado
 *   Pago y Resend, y se habilitan los tests que escriben (`E2E_DB_ISOLATED=1`).
 * - Sin eso, solo corren los tests de lectura contra la base del `.env`.
 */
const PORT = Number(process.env.E2E_PORT ?? 3000);

const readEnvFile = (path: string): Record<string, string> =>
  existsSync(path) ? parse(readFileSync(path)) : {};

const hostOf = (url?: string): string | null => {
  try {
    return url ? new URL(url).hostname : null;
  } catch {
    return null;
  }
};

const e2eEnv = readEnvFile(".env.e2e");
const defaultEnv = readEnvFile(".env");
const e2eHost = hostOf(e2eEnv.DATABASE_URL);
const isolated = Boolean(
  e2eHost && e2eHost !== hostOf(defaultEnv.DATABASE_URL) && e2eHost !== hostOf(process.env.DATABASE_URL)
);

// Los tests (workers) heredan esta variable
process.env.E2E_DB_ISOLATED = isolated ? "1" : "0";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  webServer: {
    // Aislado: compila su propio build contra la rama de pruebas (el build normal trae
    // datos de producción "congelados" en las páginas) y lo sirve desde otra carpeta.
    command: isolated
      ? `pnpm exec next build && pnpm exec next start --port ${PORT}`
      : `pnpm start --port ${PORT}`,
    url: `http://localhost:${PORT}/login`,
    reuseExistingServer: !process.env.CI,
    env: isolated
      ? {
          ...e2eEnv,
          NEXT_PUBLIC_APP_URL: `http://localhost:${PORT}`,
          E2E_DB_ISOLATED: "1",
          E2E_DIST_DIR: ".next-e2e",
        }
      : // Valor solo para pruebas locales si el .env no define CRON_SECRET
        { CRON_SECRET: process.env.CRON_SECRET ?? "e2e-local-cron-secret-only" },
    timeout: isolated ? 420_000 : 120_000,
  },
});
