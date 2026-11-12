import { afterEach, describe, expect, it, vi } from "vitest";
import { getAppUrl, getTrustedOrigins } from "./app-url";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("getAppUrl", () => {
  it("prioriza NEXT_PUBLIC_APP_URL y quita la barra final", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://www.olindumenti.com.ar/");
    expect(getAppUrl()).toBe("https://www.olindumenti.com.ar");
  });

  it("en producción de Vercel usa el dominio del proyecto", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "");
    vi.stubEnv("BETTER_AUTH_URL", "");
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "olindumenti.com.ar");
    expect(getAppUrl()).toBe("https://olindumenti.com.ar");
  });
});

describe("getTrustedOrigins", () => {
  it("acepta el dominio con y sin www, y el de vercel.app", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "");
    vi.stubEnv("BETTER_AUTH_URL", "");
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "olindumenti.com.ar");
    vi.stubEnv("VERCEL_URL", "olecommerce-abc123-gonza-team2.vercel.app");

    const origins = getTrustedOrigins();
    expect(origins).toContain("https://olindumenti.com.ar");
    expect(origins).toContain("https://www.olindumenti.com.ar");
    expect(origins).toContain("https://olecommerce-abc123-gonza-team2.vercel.app");
    expect(origins).not.toContain("https://www.olecommerce-abc123-gonza-team2.vercel.app");
  });
});
