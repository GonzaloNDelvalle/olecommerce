/**
 * Datos base para la rama de pruebas E2E (Neon "e2e-testing", creada solo con el
 * esquema): configuración de la tienda, contenido de la portada y métodos de envío.
 * Las migraciones normalmente insertan estas filas, pero una rama "schema only" no
 * las trae. Los datos bancarios son FALSOS.
 *
 * Uso: `pnpm db:seed:e2e` (y después `pnpm db:seed` con el mismo entorno, para los productos).
 * Lee `.env.e2e` y SE NIEGA a correr si apunta a la misma base que `.env`.
 */
import { existsSync, readFileSync } from "node:fs";
import { parse } from "dotenv";

function hostOf(url?: string): string | null {
  try {
    return url ? new URL(url).hostname.replace("-pooler", "") : null;
  } catch {
    return null;
  }
}

async function main() {
  if (!existsSync(".env.e2e")) throw new Error("Falta .env.e2e");
  const e2e = parse(readFileSync(".env.e2e"));
  const main = existsSync(".env") ? parse(readFileSync(".env")) : {};

  if (!e2e.DATABASE_URL || hostOf(e2e.DATABASE_URL) === hostOf(main.DATABASE_URL)) {
    throw new Error("`.env.e2e` apunta a la misma base que `.env`: se cancela para no tocar producción.");
  }
  // El entorno de pruebas tiene prioridad sobre cualquier otro
  Object.assign(process.env, e2e);

  const { db } = await import("../src/lib/db");

  await db.storeSettings.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      supportEmail: "pagos@e2e.test",
      whatsappNumber: "+54 9 11 0000-0000",
      showroomAddress: "Showroom de prueba 123",
      bankName: "Banco de Prueba",
      bankAccountHolder: "TITULAR DE PRUEBA",
      bankCuit: "20-00000000-0",
      bankCbu: "0000000000000000000000",
      bankAlias: "E2E.PRUEBA",
    },
  });

  await db.siteContent.upsert({ where: { id: 1 }, update: {}, create: { id: 1 } });

  if ((await db.shippingMethod.count()) === 0) {
    await db.shippingMethod.createMany({
      data: [
        {
          name: "Envío a domicilio",
          description: "Correo a todo el país",
          type: "HOME_DELIVERY",
          price: 9500,
          freeShippingThreshold: 250000,
          estimatedDelivery: "3 a 7 días hábiles",
          sortOrder: 1,
        },
        {
          name: "Retiro en showroom",
          description: "Coordinamos el día y horario por WhatsApp",
          type: "PICKUP",
          price: 0,
          estimatedDelivery: "Listo en 24 a 48 h",
          sortOrder: 2,
        },
      ],
    });
  }

  console.log("✅ Seed E2E listo (configuración, portada y envíos).");
  await db.$disconnect();
}

main().catch((error) => {
  console.error("❌", error instanceof Error ? error.message : error);
  process.exit(1);
});
