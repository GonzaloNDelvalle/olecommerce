import { NextRequest, NextResponse } from "next/server";
import {
  Payment,
  WebhookSignatureValidator,
  InvalidWebhookSignatureError,
} from "mercadopago";
import { db } from "@/lib/db";
import { getMercadoPagoConfig } from "@/lib/mercadopago";
import { sendAdminAlertEmail, sendPaymentApprovedEmail } from "@/lib/email";
import {
  OrderStatus,
  PaymentProvider,
  PaymentStatus,
  Prisma,
} from "@prisma/client";
import {
  commitReservedStock,
  takeAvailableStock,
} from "@/modules/orders/inventory";

const FULFILLED_STATUSES: OrderStatus[] = [
  OrderStatus.PAID,
  OrderStatus.PROCESSING,
  OrderStatus.SHIPPED,
  OrderStatus.DELIVERED,
];

type OrderWithRelations = Prisma.OrderGetPayload<{
  include: { items: true; payment: true };
}>;

type WebhookOutcome =
  | { kind: "noop" }
  | { kind: "unknown-order" }
  | { kind: "paid"; order: OrderWithRelations }
  | { kind: "reversal"; order: OrderWithRelations }
  | { kind: "duplicate-payment"; order: OrderWithRelations }
  | {
      kind: "amount-mismatch";
      order: OrderWithRelations;
      paidAmount: number;
      expectedAmount: number;
    };

class OutOfStockForLatePaymentError extends Error {
  constructor(
    readonly orderNumber: number,
    readonly sku: string
  ) {
    super(`Sin stock para reactivar la orden #${orderNumber} (${sku})`);
  }
}

/**
 * Mapea el status string de MercadoPago al enum PaymentStatus de Prisma.
 */
function mapMercadoPagoStatus(mpStatus?: string): PaymentStatus {
  switch (mpStatus) {
    case "approved":
      return PaymentStatus.APPROVED;
    case "authorized":
      return PaymentStatus.AUTHORIZED;
    case "in_process":
    case "in_mediation":
      return PaymentStatus.IN_PROCESS;
    case "rejected":
      return PaymentStatus.REJECTED;
    case "cancelled":
      return PaymentStatus.CANCELLED;
    case "refunded":
      return PaymentStatus.REFUNDED;
    case "charged_back":
      return PaymentStatus.CHARGED_BACK;
    default:
      return PaymentStatus.PENDING;
  }
}

export async function POST(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const body = await request.json().catch(() => ({}));

  // MercadoPago puede enviar el tipo y el ID por query params (Webhooks o IPN) o en el body JSON
  const eventType =
    searchParams.get("type") ??
    searchParams.get("topic") ??
    body?.type ??
    body?.topic ??
    body?.action;

  const dataId =
    searchParams.get("data.id") ??
    searchParams.get("id") ??
    body?.data?.id?.toString() ??
    body?.id?.toString();

  console.log("[MP Webhook] Notificación recibida:", {
    eventType,
    dataId,
    url: request.nextUrl.toString(),
  });

  // 1. EARLY RETURN PARA EL PING DE PRUEBA DEL PANEL DE MERCADOPAGO (ID '123456')
  if (String(dataId) === "123456") {
    console.log(
      "[MP Webhook] Ping de prueba detectado (ID: 123456). Retornando 200 OK."
    );
    return NextResponse.json(
      { message: "Test webhook exitoso" },
      { status: 200 }
    );
  }

  // Ignorar notificaciones que no tengan ID o que sean de otro tópico (ej: merchant_order)
  if (!dataId || (eventType && !String(eventType).includes("payment"))) {
    return NextResponse.json({ received: true }, { status: 200 });
  }

  // 2. VALIDACIÓN DE FIRMA (cuando MercadoPago envía cabecera x-signature)
  const webhookSecret = process.env.MP_WEBHOOK_SECRET?.trim();
  const xSignature = request.headers.get("x-signature");
  const xRequestId = request.headers.get("x-request-id");

  if (webhookSecret && xSignature) {
    try {
      WebhookSignatureValidator.validate({
        xSignature,
        xRequestId,
        dataId: String(dataId),
        secret: webhookSecret,
      });
    } catch (err) {
      if (err instanceof InvalidWebhookSignatureError) {
        console.warn(
          `[MP Webhook] Advertencia de firma (${err.reason}) para dataId=${dataId}. Se verificará el pago directamente contra la API de MercadoPago.`
        );
      }
    }
  }

  // 3. BLOQUE TRY-CATCH PARA CONSULTA EN API DE MP Y ACTUALIZACIÓN EN PRISMA
  try {
    const mpConfig = getMercadoPagoConfig();
    const paymentClient = new Payment(mpConfig);

    // Consultar el estado real del pago en los servidores de MercadoPago
    const mpPayment = await paymentClient.get({ id: String(dataId) });

    const orderId = mpPayment.external_reference;
    console.log("[MP Webhook] Pago verificado en API de MP:", {
      paymentId: mpPayment.id,
      status: mpPayment.status,
      statusDetail: mpPayment.status_detail,
      externalReference: orderId,
    });

    if (!orderId) {
      console.warn(
        `[MP Webhook] El pago ${dataId} no posee external_reference asociado a una Order.`
      );
      return NextResponse.json({ received: true }, { status: 200 });
    }

    const mappedPaymentStatus = mapMercadoPagoStatus(mpPayment.status);
    const mpPaymentId = String(mpPayment.id);

    const paymentData = {
      provider: PaymentProvider.MERCADOPAGO,
      paymentId: mpPaymentId,
      merchantOrderId: mpPayment.order?.id ? String(mpPayment.order.id) : null,
      status: mappedPaymentStatus,
      paymentMethod: mpPayment.payment_method_id ?? null,
      paymentType: mpPayment.payment_type_id ?? null,
      installments: mpPayment.installments ?? 1,
      statusDetail: mpPayment.status_detail ?? null,
      rawWebhookData: JSON.parse(
        JSON.stringify(mpPayment)
      ) as Prisma.InputJsonValue,
    };

    let outcome: WebhookOutcome;
    try {
      outcome = await db.$transaction(async (tx) => {
        const order = await tx.order.findUnique({
          where: { id: orderId },
          include: { items: true, payment: true },
        });

        if (!order) {
          return { kind: "unknown-order" } as const;
        }

        const upsertPayment = (
          extra: { paidAt?: Date; statusDetail?: string } = {}
        ) =>
          tx.payment.upsert({
            where: { orderId: order.id },
            update: { ...paymentData, ...extra },
            create: {
              orderId: order.id,
              transactionAmount:
                mpPayment.transaction_amount ?? Number(order.totalAmount),
              ...paymentData,
              ...extra,
            },
          });

        // A) La orden ya está pagada / en logística
        if (FULFILLED_STATUSES.includes(order.status)) {
          if (order.payment?.paymentId === mpPaymentId) {
            // Mismo pago: registrar cambios posteriores (reintegro, contracargo, mediación)
            await upsertPayment();
            if (
              mappedPaymentStatus === PaymentStatus.REFUNDED ||
              mappedPaymentStatus === PaymentStatus.CHARGED_BACK
            ) {
              return { kind: "reversal", order } as const;
            }
            return { kind: "noop" } as const;
          }
          if (mappedPaymentStatus === PaymentStatus.APPROVED) {
            // Un segundo pago aprobado para una orden ya pagada: hay que reintegrarlo
            return { kind: "duplicate-payment", order } as const;
          }
          return { kind: "noop" } as const;
        }

        // B) Orden PENDING o CANCELLED con un pago no aprobado
        if (mappedPaymentStatus !== PaymentStatus.APPROVED) {
          // Un rechazo NO cancela la orden: en Checkout Pro la clienta puede
          // reintentar con otro medio sobre la misma preferencia. Si nunca paga,
          // el cron /api/cron/expire-orders la vence y libera la reserva.
          if (order.status === OrderStatus.PENDING) {
            await upsertPayment();
          }
          return { kind: "noop" } as const;
        }

        // C) Pago aprobado: validar monto y moneda antes de acreditar
        const paidAmount = Number(mpPayment.transaction_amount ?? 0);
        const expectedAmount = Number(order.totalAmount);
        const currencyOk =
          !mpPayment.currency_id || mpPayment.currency_id === "ARS";
        if (!currencyOk || paidAmount + 0.01 < expectedAmount) {
          await upsertPayment({ statusDetail: "amount_mismatch_review" });
          return {
            kind: "amount-mismatch",
            order,
            paidAmount,
            expectedAmount,
          } as const;
        }

        const previousStatus = order.status;
        const claimed = await tx.order.updateMany({
          where: { id: order.id, status: previousStatus },
          data: { status: OrderStatus.PAID },
        });
        if (claimed.count === 0) {
          // Otra notificación concurrente ya la procesó
          return { kind: "noop" } as const;
        }

        if (previousStatus === OrderStatus.PENDING) {
          await commitReservedStock(tx, order.items);
        } else {
          // La orden había vencido y liberado su reserva: volver a tomar stock
          for (const item of order.items) {
            const taken = await takeAvailableStock(
              tx,
              item.variantId,
              item.quantity
            );
            if (!taken) {
              throw new OutOfStockForLatePaymentError(
                order.orderNumber,
                item.variantSku
              );
            }
          }
        }

        await upsertPayment({ paidAt: new Date() });
        return { kind: "paid", order } as const;
      });
    } catch (error) {
      if (!(error instanceof OutOfStockForLatePaymentError)) throw error;

      // Se cobró una orden vencida pero ya no hay stock: registrar el pago para
      // conciliación (la orden queda CANCELLED) y alertar para reintegrar.
      await db.payment.update({
        where: { orderId },
        data: { ...paymentData, statusDetail: "approved_without_stock" },
      });
      await sendAdminAlertEmail(
        `Pago aprobado sin stock — Orden #${error.orderNumber}`,
        [
          `Mercado Pago aprobó el pago ${mpPaymentId} de una orden que ya estaba vencida o cancelada.`,
          `No hay stock suficiente de ${error.sku} para reactivarla.`,
          "Acción: contactar a la clienta y reintegrar el pago desde Mercado Pago, o reponer stock y acreditar manualmente desde el panel.",
        ]
      );
      return NextResponse.json({ received: true }, { status: 200 });
    }

    switch (outcome.kind) {
      case "paid": {
        // Email "Pago Acreditado": solo la notificación que efectivamente pasó la orden a PAID.
        const emailResult = await sendPaymentApprovedEmail(orderId);
        console.log(
          `✅ [MP Webhook] Orden #${outcome.order.orderNumber} acreditada (PAID). Email:`,
          emailResult.success ? "enviado" : `falló (${emailResult.error})`
        );
        break;
      }
      case "amount-mismatch":
        await sendAdminAlertEmail(
          `Monto de pago no coincide — Orden #${outcome.order.orderNumber}`,
          [
            `Pago MP ${mpPaymentId}: cobrado ${outcome.paidAmount} ${mpPayment.currency_id ?? ""}, esperado ${outcome.expectedAmount} ARS.`,
            "La orden NO se marcó como pagada. Revisar en Mercado Pago antes de despachar.",
          ]
        );
        break;
      case "reversal":
        await sendAdminAlertEmail(
          `${mappedPaymentStatus === PaymentStatus.REFUNDED ? "Reintegro" : "Contracargo"} — Orden #${outcome.order.orderNumber}`,
          [
            `El pago MP ${mpPaymentId} pasó a ${mpPayment.status} (${mpPayment.status_detail ?? "sin detalle"}).`,
            `Estado actual de la orden: ${outcome.order.status}. Si todavía no se despachó, frená el envío.`,
          ]
        );
        break;
      case "duplicate-payment":
        await sendAdminAlertEmail(
          `Pago duplicado — Orden #${outcome.order.orderNumber}`,
          [
            `Llegó un segundo pago aprobado (MP ${mpPaymentId}) para una orden ya pagada con el pago ${outcome.order.payment?.paymentId ?? "desconocido"}.`,
            "Acción: reintegrar el pago duplicado desde Mercado Pago.",
          ]
        );
        break;
      case "unknown-order":
        console.warn(
          `[MP Webhook] El pago ${mpPaymentId} referencia una orden inexistente (${orderId}). Se ignora.`
        );
        break;
      case "noop":
        break;
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error("❌ [MP Webhook] Error procesando pago o actualizando DB:", {
      dataId,
      eventType,
      errorMessage: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack : undefined,
      rawError: error,
    });

    return NextResponse.json(
      { error: "Error interno al procesar la notificación" },
      { status: 500 }
    );
  }
}
