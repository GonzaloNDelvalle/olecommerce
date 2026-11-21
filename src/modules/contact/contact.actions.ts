"use server";

import { z } from "zod";
import { consumeRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { sendContactMessageEmail } from "@/lib/email";

export type ContactResult =
  | { success: true; message: string }
  | { success: false; error: string };

const contactSchema = z.object({
  name: z.string().trim().min(2, "Ingresá tu nombre.").max(100),
  email: z.string().trim().toLowerCase().email("Ingresá un correo electrónico válido.").max(255),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  orderNumber: z.string().trim().max(20).optional().or(z.literal("")),
  message: z.string().trim().min(10, "Contanos un poco más (mínimo 10 caracteres).").max(2000),
  // Campo trampa: invisible para personas, los bots lo completan
  website: z.string().max(0).optional().or(z.literal("")),
});

const SUCCESS_MESSAGE = "¡Gracias! Recibimos tu mensaje y te respondemos por email lo antes posible.";

/** Formulario de contacto: llega por email al equipo (con "responder" a la clienta). */
export async function sendContactMessage(
  input: z.input<typeof contactSchema>
): Promise<ContactResult> {
  const parsed = contactSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Revisá los datos." };
  }

  // Bot detectado: se responde como si hubiera funcionado y no se envía nada
  if (parsed.data.website) return { success: true, message: SUCCESS_MESSAGE };

  if (!(await consumeRateLimit(RATE_LIMITS.contact))) {
    return { success: false, error: "Recibimos varios mensajes seguidos. Probá de nuevo en un rato." };
  }

  const result = await sendContactMessageEmail({
    name: parsed.data.name,
    email: parsed.data.email,
    phone: parsed.data.phone || null,
    orderNumber: parsed.data.orderNumber || null,
    message: parsed.data.message,
  });
  if (!result.success) {
    return {
      success: false,
      error: "No pudimos enviar tu mensaje. Probá de nuevo o escribinos por WhatsApp.",
    };
  }
  return { success: true, message: SUCCESS_MESSAGE };
}
