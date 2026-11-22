"use server";

import { db } from "@/lib/db";
import { OrderStatus } from "@prisma/client";
import { consumeRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import {
  createMercadoPagoPreference,
  type CreatePreferenceResult,
} from "@/modules/orders/mercadopago-preference";

/**
 * Reintento de pago de una orden de Mercado Pago que sigue pendiente (ej. la
 * tarjeta fue rechazada y la clienta volvió a la tienda). Genera un link
 * nuevo sin rehacer la orden: el stock ya está reservado.
 */
export async function retryMercadoPagoPayment(
  orderId: string
): Promise<CreatePreferenceResult> {
  if (typeof orderId !== "string" || !/^[0-9a-f-]{36}$/i.test(orderId)) {
    return { success: false, error: "La orden no es válida." };
  }
  if (!(await consumeRateLimit(RATE_LIMITS.paymentRetry))) {
    return {
      success: false,
      error: "Hiciste varios intentos seguidos. Esperá unos minutos y volvé a intentar.",
    };
  }

  const order = await db.order.findUnique({
    where: { id: orderId },
    select: { status: true, payment: { select: { provider: true } } },
  });

  if (!order || order.payment?.provider !== "MERCADOPAGO") {
    return { success: false, error: "No encontramos la orden para reintentar el pago." };
  }
  if (order.status !== OrderStatus.PENDING) {
    return {
      success: false,
      error:
        order.status === OrderStatus.CANCELLED
          ? "La orden venció y se liberaron las prendas. Volvé a armar tu carrito."
          : "Esta orden ya fue pagada.",
    };
  }

  return createMercadoPagoPreference(orderId);
}
