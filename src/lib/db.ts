import { neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";
import ws from "ws";

// Configura WebSockets sobre el puerto 443 (WSS/TLS) para entornos Node.js.
// Evita bloqueos/timeouts de red en el puerto TCP 5432 hacia Neon DB.
neonConfig.webSocketConstructor = ws;

/**
 * Factory del cliente de Prisma utilizando el Driver Adapter oficial de Neon
 * (@prisma/adapter-neon) sobre WebSockets (puerto 443) y Singleton Global para HMR.
 */
const prismaClientSingleton = () => {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error(
      "La variable de entorno DATABASE_URL no está definida en el archivo .env"
    );
  }

  const adapter = new PrismaNeon({ connectionString });

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
};

declare const globalThis: {
  prisma: ReturnType<typeof prismaClientSingleton> | undefined;
} & typeof global;

/**
 * Instancia única (Singleton) almacenada en `globalThis.prisma` para evitar que
 * el Hot Module Replacement (HMR) de Next.js multiplique las conexiones activas.
 */
export const db = globalThis.prisma ?? prismaClientSingleton();

export const prisma = db;

if (process.env.NODE_ENV !== "production") {
  globalThis.prisma = db;
}
