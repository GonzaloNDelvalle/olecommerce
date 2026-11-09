import { auth } from "@/auth";
import { db } from "@/lib/db";

export class UnauthorizedError extends Error {
  constructor(message = "No tenés permisos para realizar esta acción.") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

/**
 * Verifica que la request provenga de una usuaria autenticada con rol ADMIN.
 *
 * Debe llamarse al principio de CADA Server Action / función del backoffice:
 * las Server Actions son endpoints POST públicos y el `proxy.ts` no es una
 * barrera de seguridad suficiente por sí solo.
 *
 * Además del rol firmado en el JWT, re-valida contra la base de datos para que
 * una cuenta degradada o desactivada pierda el acceso de inmediato.
 */
export async function requireAdmin(): Promise<{ id: string; email: string }> {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId || session.user.role !== "ADMIN") {
    throw new UnauthorizedError();
  }

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, role: true, isActive: true },
  });

  if (!user || !user.isActive || user.role !== "ADMIN") {
    throw new UnauthorizedError();
  }

  return { id: user.id, email: user.email };
}
