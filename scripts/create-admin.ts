import "dotenv/config";
import { hashPassword } from "better-auth/crypto";
import { Role } from "@prisma/client";
import { db } from "../src/lib/db";

/**
 * Crea o promueve una cuenta de administración.
 *
 * Uso (las variables pueden ir en .env o en la línea de comandos):
 *   ADMIN_EMAIL=vos@tienda.com ADMIN_PASSWORD='una-clave-larga' pnpm admin:create
 *
 * - Si el email no existe, crea la usuaria con rol ADMIN y email verificado.
 * - Si existe, la promueve a ADMIN y le asigna la contraseña indicada.
 * - Tras usarlo, borrá ADMIN_PASSWORD de tu .env.
 */
export async function upsertAdmin(email: string, password: string) {
  const passwordHash = await hashPassword(password);

  const user = await db.user.upsert({
    where: { email },
    update: { role: Role.ADMIN, isActive: true, emailVerified: true },
    create: {
      email,
      name: "Admin OL.",
      firstName: "Admin",
      lastName: "OL Indumenti",
      role: Role.ADMIN,
      isActive: true,
      emailVerified: true,
    },
    select: { id: true },
  });

  await db.account.upsert({
    where: {
      providerId_accountId: { providerId: "credential", accountId: user.id },
    },
    update: { password: passwordHash },
    create: {
      providerId: "credential",
      accountId: user.id,
      userId: user.id,
      password: passwordHash,
    },
  });

  // Cerrar sesiones previas para que el cambio de contraseña aplique ya
  await db.session.deleteMany({ where: { userId: user.id } });
}

async function main() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error("Definí ADMIN_EMAIL y ADMIN_PASSWORD para crear el admin.");
  }
  if (password.length < 12) {
    throw new Error("La contraseña de admin debe tener al menos 12 caracteres.");
  }

  await upsertAdmin(email, password);
  console.log(`✅ ${email} ahora es ADMIN. Ingresá desde /login y luego /admin.`);
}

if (process.argv[1]?.includes("create-admin")) {
  main()
    .catch((error) => {
      console.error("❌", error instanceof Error ? error.message : error);
      process.exitCode = 1;
    })
    .finally(() => db.$disconnect());
}
