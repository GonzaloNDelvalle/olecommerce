import { NextRequest, NextResponse } from "next/server";
import {
  Payment,
  WebhookSignatureValidator,
  InvalidWebhookSignatureError,
} from "mercadopago";
import { db } from "@/lib/db";
import { getMercadoPagoConfig } from "@/lib/mercadopago";
import { OrderStatus, PaymentStatus, Prisma } from "@prisma/client";

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

    await db.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: {
          items: true,
          payment: true,
        },
      });

      if (!order) {
        throw new Error(
          `La orden con ID "${orderId}" no existe en la base de datos.`
        );
      }

      // Idempotencia: si ya fue procesada como PAID o CANCELLED, no repetir movimientos de stock
      if (
        order.status === OrderStatus.PAID ||
        order.status === OrderStatus.CANCELLED
      ) {
        console.log(
          `[MP Webhook] Orden #${order.orderNumber} ya se encontraba en estado ${order.status}. Ignorando duplicado.`
        );
        return;
      }

      const rawPayload = JSON.parse(
        JSON.stringify(mpPayment)
      ) as Prisma.InputJsonValue;

      // Actualizar o crear el registro en la tabla Payment
      await tx.payment.upsert({
        where: { orderId: order.id },
        update: {
          paymentId: String(mpPayment.id),
          merchantOrderId: mpPayment.order?.id
            ? String(mpPayment.order.id)
            : null,
          status: mappedPaymentStatus,
          paymentMethod: mpPayment.payment_method_id ?? null,
          paymentType: mpPayment.payment_type_id ?? null,
          installments: mpPayment.installments ?? 1,
          transactionAmount:
            mpPayment.transaction_amount ?? Number(order.totalAmount),
          statusDetail: mpPayment.status_detail ?? null,
          paidAt:
            mappedPaymentStatus === PaymentStatus.APPROVED
              ? new Date()
              : undefined,
          rawWebhookData: rawPayload,
        },
        create: {
          orderId: order.id,
          paymentId: String(mpPayment.id),
          merchantOrderId: mpPayment.order?.id
            ? String(mpPayment.order.id)
            : null,
          status: mappedPaymentStatus,
          paymentMethod: mpPayment.payment_method_id ?? null,
          paymentType: mpPayment.payment_type_id ?? null,
          installments: mpPayment.installments ?? 1,
          transactionAmount:
            mpPayment.transaction_amount ?? Number(order.totalAmount),
          statusDetail: mpPayment.status_detail ?? null,
          paidAt:
            mappedPaymentStatus === PaymentStatus.APPROVED
              ? new Date()
              : undefined,
          rawWebhookData: rawPayload,
        },
      });

      // CASO A: PAGO APROBADO -> Pasar Order a PAID y descontar stock físico y reservedStock
      if (mappedPaymentStatus === PaymentStatus.APPROVED) {
        await tx.order.update({
          where: { id: order.id },
          data: { status: OrderStatus.PAID },
        });

        for (const item of order.items) {
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: {
              stock: { decrement: item.quantity },
              reservedStock: { decrement: item.quantity },
            },
          });
        }

        console.log(
          `✅ [MP Webhook] Orden #${order.orderNumber} actualizada a PAID y stock descontado.`
        );
      }

      // CASO B: PAGO RECHAZADO O CANCELADO -> Pasar Order a CANCELLED y liberar reservedStock
      if (
        mappedPaymentStatus === PaymentStatus.REJECTED ||
        mappedPaymentStatus === PaymentStatus.CANCELLED
      ) {
        await tx.order.update({
          where: { id: order.id },
          data: { status: OrderStatus.CANCELLED },
        });

        for (const item of order.items) {
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: {
              reservedStock: { decrement: item.quantity },
            },
          });
        }

        console.log(
          `⚠️ [MP Webhook] Orden #${order.orderNumber} cancelada por pago ${mappedPaymentStatus}. Stock reservado liberado.`
        );
      }
    });

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
      {
        error: "Error interno al procesar la notificación de MercadoPago",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
