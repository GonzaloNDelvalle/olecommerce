"use server";

import { randomBytes } from "node:crypto";
import { after } from "next/server";
import { z } from "zod";
import { NewsletterStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { consumeRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import {
  sendNewsletterConfirmEmail,
  sendNewsletterWelcomeEmail,
} from "@/lib/email";
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

// Se responde lo mismo exista o no el email: no revela quién está suscripto.
const SUCCESS_MESSAGE =
  "¡Casi listo! Te enviamos un email para confirmar tu suscripción. Si no lo ves, revisá la carpeta de spam.";

// No se reenvía la confirmación a un mismo email más de una vez en este lapso
const CONFIRM_RESEND_MINUTES = 10;

/**
 * Suscripción al newsletter desde la portada.
 *
 * Doble opt-in: el email queda PENDING y recibe un link de confirmación; la
 * suscripción (y la fecha de consentimiento) se registra recién al confirmar.
 * Así nadie puede suscribir el email de un tercero.
 * - La respuesta es la misma si el email ya estaba suscripto (no revela qué
 *   emails existen en la base).
 * - Quien se había dado de baja y se vuelve a suscribir debe confirmar de nuevo.
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
      select: { status: true, updatedAt: true },
    });

    if (existing?.status === NewsletterStatus.SUBSCRIBED) {
      return { success: true, message: SUCCESS_MESSAGE };
    }

    // Ya hay una confirmación reciente en camino: no se reenvía otro email
    if (
      existing?.status === NewsletterStatus.PENDING &&
      Date.now() - existing.updatedAt.getTime() < CONFIRM_RESEND_MINUTES * 60 * 1000
    ) {
      return { success: true, message: SUCCESS_MESSAGE };
    }

    const confirmToken = randomBytes(24).toString("hex");
    await db.newsletterSubscriber.upsert({
      where: { email },
      update: {
        status: NewsletterStatus.PENDING,
        confirmToken,
        unsubscribedAt: null,
      },
      create: {
        email,
        status: NewsletterStatus.PENDING,
        confirmToken,
        unsubscribeToken: randomBytes(24).toString("hex"),
        source: "home",
      },
    });

    // El email se envía después de responder: la respuesta en pantalla es
    // instantánea y un fallo del envío no rompe el formulario.
    const confirmUrl = `${getAppUrl()}/newsletter/confirmar?token=${confirmToken}`;
    after(() => sendNewsletterConfirmEmail({ to: email, confirmUrl }));

    return { success: true, message: SUCCESS_MESSAGE };
  } catch (error) {
    console.error("[subscribeToNewsletter] Error:", error);
    return {
      success: false,
      error: "No pudimos completar la suscripción. Intentá nuevamente.",
    };
  }
}

/**
 * Confirma la suscripción desde el link del email de confirmación. Es el
 * momento en que se registra el consentimiento y se envía la bienvenida.
 */
export async function confirmNewsletterSubscription(
  token: string
): Promise<NewsletterResult> {
  if (typeof token !== "string" || !/^[a-f0-9]{48}$/.test(token)) {
    return { success: false, error: "El link de confirmación no es válido." };
  }

  const subscriber = await db.newsletterSubscriber.findUnique({
    where: { confirmToken: token },
    select: { id: true, email: true, unsubscribeToken: true },
  });
  if (!subscriber) {
    return {
      success: false,
      error: "El link de confirmación no es válido o ya fue usado.",
    };
  }

  await db.newsletterSubscriber.update({
    where: { id: subscriber.id },
    data: {
      status: NewsletterStatus.SUBSCRIBED,
      consentAt: new Date(),
      unsubscribedAt: null,
      confirmToken: null,
    },
  });

  const unsubscribeUrl = `${getAppUrl()}/newsletter/baja?token=${subscriber.unsubscribeToken}`;
  after(() =>
    sendNewsletterWelcomeEmail({ to: subscriber.email, unsubscribeUrl })
  );

  return {
    success: true,
    message: "¡Listo! Ya formás parte de nuestro archivo privado.",
  };
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
