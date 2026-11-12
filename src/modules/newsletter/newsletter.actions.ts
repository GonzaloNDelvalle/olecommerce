"use server";

import { randomBytes } from "node:crypto";
import { after } from "next/server";
import { z } from "zod";
import { NewsletterStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { consumeRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { sendNewsletterWelcomeEmail } from "@/lib/email";
import { getAppUrl } from "@/lib/app-url";

export type NewsletterResult =
  | { success: true; message: string }
  | { success: false; error: string };

const subscribeSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Ingresá un correo electrónico válido.")
    .max(255),
  // Campo trampa: invisible para personas, los bots lo completan
  website: z.string().max(0).optional().or(z.literal("")),
});

const SUCCESS_MESSAGE =
  "¡Listo! Ya formás parte de nuestro archivo privado. Te vamos a escribir con lanzamientos y preventas.";

/**
 * Suscripción al newsletter desde la portada.
 *
 * - Guarda el email con la fecha de consentimiento y un token de baja.
 * - La respuesta es la misma si el email ya estaba suscripto (no revela qué
 *   emails existen en la base).
 * - Quien se había dado de baja y se vuelve a suscribir queda reactivada.
 */
export async function subscribeToNewsletter(
  input: z.input<typeof subscribeSchema>
): Promise<NewsletterResult> {
  const parsed = subscribeSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Revisá el correo electrónico.",
    };
  }

  // Bot detectado: se responde como si hubiera funcionado y no se guarda nada
  if (parsed.data.website) return { success: true, message: SUCCESS_MESSAGE };

  if (!(await consumeRateLimit(RATE_LIMITS.newsletter))) {
    return {
      success: false,
      error: "Recibimos varios intentos seguidos. Probá de nuevo en un rato.",
    };
  }

  const email = parsed.data.email;

  try {
    const existing = await db.newsletterSubscriber.findUnique({
      where: { email },
      select: { status: true },
    });

    if (existing?.status === NewsletterStatus.SUBSCRIBED) {
      return { success: true, message: SUCCESS_MESSAGE };
    }

    const token = randomBytes(24).toString("hex");
    const subscriber = await db.newsletterSubscriber.upsert({
      where: { email },
      update: {
        status: NewsletterStatus.SUBSCRIBED,
        consentAt: new Date(),
        unsubscribedAt: null,
        unsubscribeToken: token,
      },
      create: { email, unsubscribeToken: token, source: "home" },
      select: { unsubscribeToken: true },
    });

    // La bienvenida se envía después de responder: la confirmación en
    // pantalla es instantánea y un fallo del email no afecta la suscripción.
    const unsubscribeUrl = `${getAppUrl()}/newsletter/baja?token=${subscriber.unsubscribeToken}`;
    after(() => sendNewsletterWelcomeEmail({ to: email, unsubscribeUrl }));

    return { success: true, message: SUCCESS_MESSAGE };
  } catch (error) {
    console.error("[subscribeToNewsletter] Error:", error);
    return {
      success: false,
      error: "No pudimos completar la suscripción. Intentá nuevamente.",
    };
  }
}

/** Baja del newsletter desde el link incluido en los emails. */
export async function unsubscribeFromNewsletter(
  token: string
): Promise<NewsletterResult> {
  if (typeof token !== "string" || !/^[a-f0-9]{48}$/.test(token)) {
    return { success: false, error: "El link de baja no es válido." };
  }

  const updated = await db.newsletterSubscriber.updateMany({
    where: { unsubscribeToken: token },
    data: {
      status: NewsletterStatus.UNSUBSCRIBED,
      unsubscribedAt: new Date(),
    },
  });

  if (updated.count === 0) {
    return { success: false, error: "El link de baja no es válido o ya fue usado." };
  }
  return {
    success: true,
    message: "Listo, ya no vas a recibir nuestro newsletter.",
  };
}
