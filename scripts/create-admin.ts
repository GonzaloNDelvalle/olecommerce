import "dotenv/config";
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";
import { db } from "../src/lib/db";

/**
 * Crea o promueve una cuenta de administración.
 *
 * Uso (las variables pueden ir en .env o en la línea de comandos):
 *   ADMIN_EMAIL=vos@tienda.com ADMIN_PASSWORD='una-clave-larga' pnpm admin:create
 *
 * - Si el email no existe, crea la usuaria con rol ADMIN.
 * - Si existe, la promueve a ADMIN y le asigna la contraseña indicada.
 * - Tras usarlo, borrá ADMIN_PASSWORD de tu .env.
 */
async function main() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error("Definí ADMIN_EMAIL y ADMIN_PASSWORD para crear el admin.");
  }
  if (password.length < 12) {
    throw new Error("La contraseña de admin debe tener al menos 12 caracteres.");
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await db.user.upsert({
    where: { email },
    update: {
      passwordHash,
      pendingPasswordHash: null,
      role: Role.ADMIN,
      isActive: true,
      emailVerified: new Date(),
    },
    create: {
      email,
      name: "Admin",
      firstName: "Admin",
      lastName: "OL Indumenti",
      passwordHash,
      role: Role.ADMIN,
      isActive: true,
      emailVerified: new Date(),
    },
  });

  console.log(`✅ ${email} ahora es ADMIN. Ingresá desde /login y luego /admin.`);
}

main()
  .catch((error) => {
    console.error("❌", error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
