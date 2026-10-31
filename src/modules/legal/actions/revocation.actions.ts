"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { resend, EMAIL_FROM } from "@/lib/email";

const revokeRequestSchema = z.object({
  email: z.string().email("Ingresá un correo electrónico válido."),
  orderNumber: z.coerce
    .number()
    .int("El número de pedido debe ser un entero.")
    .positive("El número de pedido debe ser mayor a 0."),
  reason: z.string().optional(),
});

export type RevokeRequestValues = z.infer<typeof revokeRequestSchema>;

export interface RevokeActionResult {
  success: boolean;
  message?: string;
  error?: string;
}

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

  const { email, orderNumber, reason } = parsed.data;
  const normalizedEmail = email.trim().toLowerCase();

  try {
    // Buscamos la orden coincidente
    const order = await db.order.findFirst({
      where: {
        orderNumber,
        user: {
          email: normalizedEmail,
        },
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        items: true,
      },
    });

    // Enviar notificación a administración
    const adminEmail = process.env.ADMIN_NOTIFY_EMAIL || "admin@olindumenti.com";
    const dateFormatted = new Intl.DateTimeFormat("es-AR", {
      dateStyle: "full",
      timeStyle: "short",
    }).format(new Date());

    const clientFoundText = order
      ? `Orden #${order.orderNumber} verificada en base de datos. Cliente: ${order.user.firstName} ${order.user.lastName}. Monto: $${Number(order.totalAmount).toLocaleString("es-AR")}.`
      : `Atención: No se encontró orden #${orderNumber} para el email ${normalizedEmail} (o fue ingresada con otra cuenta).`;

    const emailSubject = `Solicitud de Arrepentimiento - Orden #${orderNumber} | OL Indumenti`;
    const emailBody = `
      <div style="font-family: Arial, sans-serif; color: #1c1917; padding: 24px; max-width: 600px; margin: auto; border: 1px solid #e7e5e4;">
        <h2 style="font-size: 18px; text-transform: uppercase; letter-spacing: 0.1em; color: #1c1917; border-bottom: 1px solid #e7e5e4; padding-bottom: 12px;">
          Solicitud de Revocación / Botón de Arrepentimiento
        </h2>
        <p style="font-size: 13px; line-height: 1.6; color: #44403c;">
          Se ha recibido una solicitud de revocación conforme a la <strong>Resolución 424/2020 de la Secretaría de Comercio Interior</strong>.
        </p>
        <table style="width: 100%; font-size: 13px; margin: 20px 0; border-collapse: collapse;">
          <tr style="border-bottom: 1px solid #f5f5f4;">
            <td style="padding: 8px 0; color: #78716c;">Fecha y Hora:</td>
            <td style="padding: 8px 0; font-weight: bold;">${dateFormatted}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f5f5f4;">
            <td style="padding: 8px 0; color: #78716c;">N° de Pedido Solicitado:</td>
            <td style="padding: 8px 0; font-weight: bold;">#${orderNumber}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f5f5f4;">
            <td style="padding: 8px 0; color: #78716c;">Email de Contacto:</td>
            <td style="padding: 8px 0; font-weight: bold;">${normalizedEmail}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f5f5f4;">
            <td style="padding: 8px 0; color: #78716c;">Motivo expresado:</td>
            <td style="padding: 8px 0;">${reason ? reason.trim() : "No especificado"}</td>
          </tr>
        </table>

        <div style="background-color: #fafaf9; border-left: 3px solid #1c1917; padding: 12px; margin: 16px 0; font-size: 12px; color: #57534e;">
          <strong>Estado en Sistema:</strong><br />
          ${clientFoundText}
        </div>

        <p style="font-size: 12px; color: #a8a29e; margin-top: 24px;">
          Por favor, responder a la clienta dentro de las 24 horas hábiles para coordinar el retiro/recepción de la prenda o la devolución del dinero.
        </p>
      </div>
    `;

    if (resend) {
      await resend.emails.send({
        from: EMAIL_FROM,
        to: adminEmail,
        replyTo: normalizedEmail,
        subject: emailSubject,
        html: emailBody,
      });

      // Confirmación también a la clienta
      await resend.emails.send({
        from: EMAIL_FROM,
        to: normalizedEmail,
        subject: `Recibimos tu solicitud de arrepentimiento - Orden #${orderNumber} | OL.`,
        html: `
          <div style="font-family: Arial, sans-serif; color: #1c1917; padding: 24px; max-width: 600px; margin: auto; border: 1px solid #e7e5e4;">
            <h2 style="font-size: 18px; text-transform: uppercase; letter-spacing: 0.1em; color: #1c1917; border-bottom: 1px solid #e7e5e4; padding-bottom: 12px;">
              OL. Indumenti
            </h2>
            <p style="font-size: 14px; color: #1c1917; font-weight: 500;">
              Hola, recibimos tu solicitud de arrepentimiento de compra.
            </p>
            <p style="font-size: 13px; line-height: 1.6; color: #44403c;">
              Tu solicitud para la <strong>Orden #${orderNumber}</strong> ha sido ingresada con éxito bajo la Resolución 424/2020 de Defensa al Consumidor.
            </p>
            <p style="font-size: 13px; line-height: 1.6; color: #44403c;">
              Nuestro equipo de atención al cliente se comunicará con vos a la brevedad al correo <strong>${normalizedEmail}</strong> para coordinar la devolución o reintegro correspondiente.
            </p>
            <p style="font-size: 11px; color: #a8a29e; margin-top: 24px;">
              Atelier OL Indumenti · Buenos Aires, Argentina
            </p>
          </div>
        `,
      });
    } else {
      console.info("[ARREPENTIMIENTO] Email simulado para admin:", emailSubject);
    }

    return {
      success: true,
      message: `Solicitud registrada correctamente para la Orden #${orderNumber}. Te enviamos una constancia a ${normalizedEmail} y nos pondremos en contacto a la brevedad.`,
    };
  } catch (error) {
    console.error("[submitRevocationRequestAction] Error:", error);
    return {
      success: false,
      error: "Ocurrió un error al procesar tu solicitud. Por favor intenta nuevamente o comunicate a soporte.",
    };
  }
}
