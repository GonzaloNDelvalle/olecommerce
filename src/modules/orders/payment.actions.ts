"use server";

import { Preference } from "mercadopago";
import { db } from "@/lib/db";
import { getMercadoPagoConfig } from "@/lib/mercadopago";
import { OrderStatus } from "@prisma/client";

export type CreatePreferenceResult =
  | {
      success: true;
      preferenceId: string;
      initPoint: string;
    }
  | {
      success: false;
      error: string;
    };

/**
 * Recibe el orderId generado en el checkout, consulta la orden y sus ítems en Prisma
 * y crea una Preference en MercadoPago (Checkout Pro).
 * Retorna el init_point oficial para redirigir a la compradora.
 */
export async function createMercadoPagoPreference(
  orderId: string
): Promise<CreatePreferenceResult> {
  try {
    const order = await db.order.findUnique({
      where: { id: orderId },
      include: {
        user: true,
        items: true,
        payment: true,
      },
    });

    if (!order) {
      return {
        success: false,
        error: "La orden solicitada no existe.",
      };
    }

    if (order.status !== OrderStatus.PENDING) {
      return {
        success: false,
        error: `La orden #${order.orderNumber} ya fue procesada (${order.status}).`,
      };
    }

    const rawAppUrl =
      process.env.NEXT_PUBLIC_APP_URL?.trim() || "http://localhost:3000";
    const appUrl = rawAppUrl.replace(/\/$/, "");

    // Si MP_WEBHOOK_URL está configurada (y no es el placeholder de ejemplo), la priorizamos;
    // de lo contrario, usamos NEXT_PUBLIC_APP_URL (donde podés colocar directamente tu URL de ngrok).
    const rawWebhookUrl = process.env.MP_WEBHOOK_URL?.trim();
    const hasCustomWebhookUrl =
      Boolean(rawWebhookUrl) &&
      !rawWebhookUrl!.includes("tu-tunel-o-dominio.com");

    const webhookBaseUrl = (
      hasCustomWebhookUrl ? rawWebhookUrl! : appUrl
    ).replace(/\/$/, "");

    const notificationUrl = `${webhookBaseUrl}/api/webhooks/mercadopago`;

    if (webhookBaseUrl.includes("localhost")) {
      console.warn(
        `⚠️ [createMercadoPagoPreference] ATENCIÓN: notification_url apunta a "${notificationUrl}". MercadoPago no puede notificar a localhost; asegurate de poner tu URL https://... de ngrok en NEXT_PUBLIC_APP_URL o MP_WEBHOOK_URL dentro de .env.`
      );
    } else {
      console.log(
        `🔔 [createMercadoPagoPreference] notification_url configurada hacia: ${notificationUrl}`
      );
    }

    // Definición explícita del objeto back_urls con las 3 rutas requeridas
    const backUrls = {
      success: `${appUrl}/checkout/confirmacion/${order.id}?status=approved`,
      failure: `${appUrl}/checkout?status=rejected&orderId=${order.id}`,
      pending: `${appUrl}/checkout/confirmacion/${order.id}?status=pending`,
    };

    const isHttpsAppUrl = appUrl.startsWith("https://");

    const mpConfig = getMercadoPagoConfig();
    const preferenceClient = new Preference(mpConfig);

    const docType = order.customerDocument.length > 8 ? "CUIT" : "DNI";

    const preferenceResponse = await preferenceClient.create({
      body: {
        external_reference: order.id,
        statement_descriptor: "OLECOMMERCE",
        items: order.items.map((item) => ({
          id: item.variantSku,
          title: `${item.productName} (${item.colorName} - Talle ${item.sizeName})`,
          quantity: item.quantity,
          unit_price: Number(item.unitPrice),
          currency_id: "ARS",
        })),
        payer: {
          name: order.user.firstName,
          surname: order.user.lastName,
          email: order.user.email,
          identification: {
            type: docType,
            number: order.customerDocument,
          },
        },
        back_urls: backUrls,
        ...(isHttpsAppUrl ? { auto_return: "approved" } : {}),
        notification_url: notificationUrl,
      },
    });

    if (!preferenceResponse.id || !preferenceResponse.init_point) {
      throw new Error(
        "MercadoPago no devolvió una URL de pago válida (init_point)."
      );
    }

    // Guardar el preferenceId en nuestra tabla Payment asociada a la orden
    await db.payment.update({
      where: { orderId: order.id },
      data: {
        preferenceId: preferenceResponse.id,
      },
    });

    const redirectUrl =
      process.env.MP_USE_SANDBOX === "true" &&
      preferenceResponse.sandbox_init_point
        ? preferenceResponse.sandbox_init_point
        : preferenceResponse.init_point;

    return {
      success: true,
      preferenceId: preferenceResponse.id,
      initPoint: redirectUrl,
    };
  } catch (error) {
    console.error("[createMercadoPagoPreference] Error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "No se pudo generar el link de pago con MercadoPago.",
    };
  }
}
