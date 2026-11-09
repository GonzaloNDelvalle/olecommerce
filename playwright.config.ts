import { defineConfig, devices } from "@playwright/test";

/**
 * Pruebas de punta a punta sobre el build de producción.
 * Uso: `pnpm build && pnpm test:e2e` (usa la base de datos del .env).
 */
const PORT = Number(process.env.E2E_PORT ?? 3000);

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
    command: `pnpm start --port ${PORT}`,
    url: `http://localhost:${PORT}/login`,
    reuseExistingServer: !process.env.CI,
    // Valor solo para pruebas locales si el .env no define CRON_SECRET
    env: {
      CRON_SECRET: process.env.CRON_SECRET ?? "e2e-local-cron-secret-only",
    },
    timeout: 120_000,
  },
});
