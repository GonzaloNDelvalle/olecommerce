"use server";

import { randomInt } from "node:crypto";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { consumeRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import {
  sendAdminAlertEmail,
  sendRevocationReceivedEmail,
} from "@/lib/email";

const revokeRequestSchema = z.object({
  email: z.string().trim().email("Ingresá un correo electrónico válido."),
  orderNumber: z.coerce
    .number()
    .int("El número de pedido debe ser un entero.")
    .positive("El número de pedido debe ser mayor a 0."),
  reason: z.string().trim().max(1000, "El motivo es demasiado largo.").optional(),
});

export type RevokeRequestValues = z.input<typeof revokeRequestSchema>;

export interface RevokeActionResult {
  success: boolean;
  message?: string;
  code?: string;
  error?: string;
}

// Sin caracteres ambiguos (0/O, 1/I)
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function generateRevocationCode(): string {
  let code = "";
  for (let i = 0; i < 8; i++) code += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)];
  return `ARR-${code}`;
}

/**
 * Botón de arrepentimiento (Res. 424/2020 SCI):
 * - Registra la solicitud en la base con un código de identificación único.
 * - Envía el código a la clienta por email y lo muestra en pantalla.
 * - Avisa al equipo para gestionar la devolución.
 */
export async function submitRevocationRequestAction(
  values: RevokeRequestValues
): Promise<RevokeActionResult> {
  const parsed = revokeRequestSchema.safeParse(values);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Datos inválidos.",
    };
  }

  if (!(await consumeRateLimit(RATE_LIMITS.revocation))) {
    return {
      success: false,
      error:
        "Recibimos varias solicitudes desde tu conexión. Esperá un rato o escribinos por email.",
    };
  }

  const { email, orderNumber, reason } = parsed.data;
  const normalizedEmail = email.toLowerCase();

  // Además del límite por IP, un mismo email no puede llenar la bandeja del
  // equipo ni recibir constancias en cadena
  if (!(await consumeRateLimit(RATE_LIMITS.revocationPerEmail, normalizedEmail))) {
    return {
      success: false,
      error:
        "Ya registramos varias solicitudes con este email hoy. Escribinos por email si necesitás ayuda.",
    };
  }

  try {
    const order = await db.order.findFirst({
      where: {
        orderNumber,
        user: { email: { equals: normalizedEmail, mode: "insensitive" } },
      },
      select: {
        id: true,
        orderNumber: true,
        totalAmount: true,
        status: true,
        user: { select: { firstName: true, lastName: true } },
      },
    });

    // Código único (reintenta ante una colisión improbable)
    let request: { id: string; code: string } | null = null;
    for (let attempt = 0; attempt < 5 && !request; attempt++) {
      try {
        request = await db.revocationRequest.create({
          data: {
            code: generateRevocationCode(),
            orderId: order?.id ?? null,
            orderNumber,
            email: normalizedEmail,
            reason: reason || null,
          },
          select: { id: true, code: true },
        });
      } catch (error) {
        const isUniqueViolation =
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === "P2002";
        if (!isUniqueViolation) throw error;
      }
    }
    if (!request) throw new Error("No se pudo generar el código de solicitud.");

    // La constancia por email se envía solo si el pedido existe y es de ese email:
    // así no se puede usar el formulario para mandar correo a terceros.
    await Promise.all([
      order
        ? sendRevocationReceivedEmail({
            to: normalizedEmail,
            code: request.code,
            orderNumber,
          })
        : Promise.resolve(),
      sendAdminAlertEmail(`Arrepentimiento ${request.code} — Orden #${orderNumber}`, [
        `Código: ${request.code}`,
        `Email: ${normalizedEmail}`,
        order
          ? `Orden verificada: #${order.orderNumber} de ${order.user.firstName} ${order.user.lastName}, ${Number(order.totalAmount).toLocaleString("es-AR")} ARS, estado ${order.status}.`
          : `ATENCIÓN: no se encontró la orden #${orderNumber} para ese email.`,
        `Motivo: ${reason || "No especificado"}`,
        "Responder dentro de las 24 h hábiles. Gestionar desde /admin/arrepentimientos.",
      ]),
    ]);

    return {
      success: true,
      code: request.code,
      // Mismo mensaje exista o no el pedido: no revela qué pedidos pertenecen a qué email
      message: `Registramos tu solicitud con el código ${request.code}. Guardalo como constancia. Si los datos coinciden con un pedido, también te lo enviamos por email, y nos vamos a contactar a la brevedad.`,
    };
  } catch (error) {
    console.error("[submitRevocationRequestAction] Error:", error);
    return {
      success: false,
      error:
        "Ocurrió un error al procesar tu solicitud. Intentá nuevamente o escribinos por email.",
    };
  }
}
