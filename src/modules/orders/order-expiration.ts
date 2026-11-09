import { db } from "@/lib/db";
import {
  OrderStatus,
  PaymentProvider,
  PaymentStatus,
} from "@prisma/client";
import { releaseReservedStock } from "@/modules/orders/inventory";

/**
 * Política de vencimiento de órdenes impagas (libera el stock reservado).
 *
 * - Mercado Pago: el link de pago vence a las MP_CHECKOUT_TTL_HOURS. Si a esa
 *   altura no hay un pago en curso, la orden se cancela. Si hay un pago en
 *   efectivo pendiente (Rapipago / Pago Fácil), se espera hasta
 *   MP_CASH_TTL_HOURS, que coincide con el vencimiento del cupón.
 * - Transferencia: se cancela a las BANK_TRANSFER_TTL_HOURS.
 *
 * Si un pago llega después del vencimiento, el webhook (o la acreditación
 * manual desde el panel) reactiva la orden siempre que haya stock disponible.
 */
function hoursFromEnv(name: string, fallback: number): number {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

export const MP_CHECKOUT_TTL_HOURS = hoursFromEnv("MP_CHECKOUT_TTL_HOURS", 24);
export const MP_CASH_TTL_HOURS = hoursFromEnv("MP_CASH_TTL_HOURS", 72);
export const BANK_TRANSFER_TTL_HOURS = hoursFromEnv(
  "BANK_TRANSFER_TTL_HOURS",
  72
);

const HOUR_MS = 60 * 60 * 1000;

export function hoursFromNow(hours: number): Date {
  return new Date(Date.now() + hours * HOUR_MS);
}

function hoursAgo(hours: number): Date {
  return new Date(Date.now() - hours * HOUR_MS);
}

export interface ExpireOrdersResult {
  cancelled: number[];
  failed: { orderNumber: number; error: string }[];
}

/**
 * Cancela las órdenes PENDING vencidas y libera su stock reservado.
 * Idempotente: cada orden se "reclama" con un UPDATE condicionado a PENDING.
 */
export async function expireStalePendingOrders(): Promise<ExpireOrdersResult> {
  const candidates = await db.order.findMany({
    where: {
      status: OrderStatus.PENDING,
      OR: [
        // Transferencias sin acreditar
        {
          createdAt: { lt: hoursAgo(BANK_TRANSFER_TTL_HOURS) },
          payment: { provider: PaymentProvider.BANK_TRANSFER },
        },
        // Mercado Pago: link vencido sin pago en curso
        {
          createdAt: { lt: hoursAgo(MP_CHECKOUT_TTL_HOURS) },
          payment: {
            provider: PaymentProvider.MERCADOPAGO,
            OR: [
              { paymentId: null },
              {
                status: {
                  in: [PaymentStatus.REJECTED, PaymentStatus.CANCELLED],
                },
              },
            ],
          },
        },
        // Mercado Pago: cupón de efectivo vencido
        {
          createdAt: { lt: hoursAgo(MP_CASH_TTL_HOURS) },
          payment: { provider: PaymentProvider.MERCADOPAGO },
        },
        // Órdenes sin registro de pago (no debería ocurrir)
        {
          createdAt: { lt: hoursAgo(BANK_TRANSFER_TTL_HOURS) },
          payment: null,
        },
      ],
    },
    select: { id: true, orderNumber: true },
    orderBy: { createdAt: "asc" },
    take: 200,
  });

  const result: ExpireOrdersResult = { cancelled: [], failed: [] };

  for (const candidate of candidates) {
    try {
      const cancelled = await db.$transaction(async (tx) => {
        const claimed = await tx.order.updateMany({
          where: { id: candidate.id, status: OrderStatus.PENDING },
          data: { status: OrderStatus.CANCELLED },
        });
        if (claimed.count === 0) return false;

        const items = await tx.orderItem.findMany({
          where: { orderId: candidate.id },
          select: { variantId: true, quantity: true },
        });
        await releaseReservedStock(tx, items);

        await tx.payment.updateMany({
          where: {
            orderId: candidate.id,
            status: { not: PaymentStatus.APPROVED },
          },
          data: {
            status: PaymentStatus.CANCELLED,
            statusDetail: "expired_unpaid",
          },
        });
        return true;
      });

      if (cancelled) result.cancelled.push(candidate.orderNumber);
    } catch (error) {
      result.failed.push({
        orderNumber: candidate.orderNumber,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return result;
}
