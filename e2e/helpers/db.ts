import { existsSync, readFileSync } from "node:fs";
import { parse } from "dotenv";

/**
 * Acceso directo a la base de la rama de pruebas (`.env.e2e`) para preparar datos
 * y comprobar el estado (stock, órdenes). Solo se usa en tests que escriben, que
 * Playwright habilita únicamente si la base es distinta a la del `.env`.
 */
export const isolated = process.env.E2E_DB_ISOLATED === "1";

type Db = (typeof import("../../src/lib/db"))["db"];
let cached: Promise<Db> | null = null;

export function getDb(): Promise<Db> {
  if (!isolated) throw new Error("getDb() solo se puede usar con una base aislada (.env.e2e)");
  cached ??= (async () => {
    const env = existsSync(".env.e2e") ? parse(readFileSync(".env.e2e")) : {};
    process.env.DATABASE_URL = env.DATABASE_URL;
    return (await import("../../src/lib/db")).db;
  })();
  return cached;
}

export function e2eEnv(): Record<string, string> {
  return existsSync(".env.e2e") ? parse(readFileSync(".env.e2e")) : {};
}

/** Los límites de uso son por IP: todos los tests comparten la 127.0.0.1. */
export async function resetRateLimits() {
  const db = await getDb();
  await db.$executeRaw`DELETE FROM "rate_limits"`;
}

/**
 * Deja el inventario de la rama de pruebas en un estado conocido: stock 20, sin
 * reservas y sin órdenes pendientes de corridas anteriores.
 */
export async function resetInventory() {
  const db = await getDb();
  await db.$executeRaw`UPDATE "orders" SET "status" = 'CANCELLED' WHERE "status" = 'PENDING'`;
  await db.$executeRaw`UPDATE "product_variants" SET "stock" = 20, "reserved_stock" = 0`;
}

/** Variante (talle/color) con su producto, la primera activa con stock. */
export async function pickVariant(slug?: string) {
  const db = await getDb();
  const variant = await db.productVariant.findFirst({
    where: {
      isActive: true,
      stock: { gte: 5 },
      product: { status: "ACTIVE", ...(slug ? { slug } : {}) },
    },
    include: { product: true, size: true, color: true },
    orderBy: { sku: "asc" },
  });
  if (!variant) throw new Error("No hay variantes con stock en la base de pruebas (corré `pnpm db:seed`).");
  return variant;
}
