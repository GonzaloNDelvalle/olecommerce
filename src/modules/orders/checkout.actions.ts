"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import {
  OrderStatus,
  PaymentProvider,
  PaymentStatus,
  ProductStatus,
} from "@prisma/client";
import {
  BANK_TRANSFER_DISCOUNT_PERCENTAGE,
  createOrderPayloadSchema,
  type CheckoutPaymentMethod,
  type CreateOrderPayload,
} from "@/modules/orders/schemas/checkout.schema";
import { createMercadoPagoPreference } from "@/modules/orders/payment.actions";
import { sendOrderConfirmedEmail } from "@/lib/email";

export type ProcessCheckoutOrderResult =
  | {
      success: true;
      orderId: string;
      orderNumber: number;
      subtotal: number;
      discountAmount: number;
      totalAmount: number;
      paymentMethod: CheckoutPaymentMethod;
      redirectUrl: string;
    }
  | {
      success: false;
      error: string;
    };

export interface TransferOrderSummaryDTO {
  id: string;
  orderNumber: number;
  status: OrderStatus;
  subtotal: number;
  discountAmount: number;
  shippingCost: number;
  totalAmount: number;
  customerName: string;
  customerEmail: string;
  customerDocument: string;
  createdAt: string;
  itemsCount: number;
}

/**
 * Procesador Transaccional de Órdenes (`checkout.actions.ts`):
 * 1. Verifica stock disponible real (`stock - reservedStock`) de cada variante en PostgreSQL.
 * 2. Incrementa `reservedStock` atómicamente para reservar las prendas.
 * 3. Calcula el precio unitario (aplicando `discountPercentage` de producto si existe) y el descuento adicional
 *    por Transferencia Bancaria (`BANK_TRANSFER`, 15% OFF).
 * 4. Crea la `Order` en estado `PENDING` junto con sus `OrderItem`s y su `Payment`.
 * 5. Devuelve la `redirectUrl` correspondiente:
 *    - Si eligió Mercado Pago: genera la Preference y devuelve el `init_point` de Checkout Pro.
 *    - Si eligió Transferencia Bancaria: devuelve `/checkout/transferencia/${order.id}`.
 */
export async function processCheckoutOrder(
  payload: CreateOrderPayload
): Promise<ProcessCheckoutOrderResult> {
  const parsed = createOrderPayloadSchema.safeParse(payload);

  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    return {
      success: false,
      error: firstIssue?.message ?? "Los datos del formulario son inválidos.",
    };
  }

  const { customer, items } = parsed.data;
  const session = await auth();

  try {
    const txResult = await db.$transaction(async (tx) => {
      const variantIds = items.map((i) => i.variantId);

      // 1. Consultar variantes actuales desde PostgreSQL (nunca confiar en precios del cliente)
      const dbVariants = await tx.productVariant.findMany({
        where: {
          id: { in: variantIds },
        },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              basePrice: true,
              discountPercentage: true,
              status: true,
            },
          },
          size: { select: { name: true } },
          color: { select: { name: true } },
        },
      });

      const variantMap = new Map(dbVariants.map((v) => [v.id, v]));

      let calculatedSubtotal = 0;
      const orderItemsToCreate: {
        variantId: string;
        productName: string;
        variantSku: string;
        sizeName: string;
        colorName: string;
        quantity: number;
        unitPrice: number;
        subtotal: number;
      }[] = [];

      // 2. Validar stock remanente e incrementar reservedStock variante por variante
      for (const requestedItem of items) {
        const variant = variantMap.get(requestedItem.variantId);

        if (
          !variant ||
          !variant.isActive ||
          variant.product.status !== ProductStatus.ACTIVE
        ) {
          throw new Error(
            "Uno de los productos seleccionados ya no se encuentra disponible en el catálogo."
          );
        }

        const availableStock = variant.stock - variant.reservedStock;

        if (availableStock < requestedItem.quantity) {
          throw new Error(
            `Stock insuficiente para "${variant.product.name}" (Talle ${variant.size.name} - ${variant.color.name}). Disponible: ${Math.max(0, availableStock)} u.`
          );
        }

        // Retener stock incrementando reservedStock atómicamente
        await tx.productVariant.update({
          where: { id: variant.id },
          data: {
            reservedStock: {
              increment: requestedItem.quantity,
            },
          },
        });

        const rawUnitPrice = Number(
          variant.priceOverride ?? variant.product.basePrice
        );
        const productDiscount = variant.product.discountPercentage ?? 0;
        const effectiveUnitPrice =
          productDiscount > 0
            ? Math.round(rawUnitPrice * (1 - productDiscount / 100))
            : rawUnitPrice;

        const itemSubtotal = effectiveUnitPrice * requestedItem.quantity;
        calculatedSubtotal += itemSubtotal;

        orderItemsToCreate.push({
          variantId: variant.id,
          productName: variant.product.name,
          variantSku: variant.sku,
          sizeName: variant.size.name,
          colorName: variant.color.name,
          quantity: requestedItem.quantity,
          unitPrice: effectiveUnitPrice,
          subtotal: itemSubtotal,
        });
      }

      // 3. Vincular la orden al ID de la usuaria autenticada en Auth.js (o upsert por email si compra como invitada)
      const user = session?.user?.id
        ? await tx.user.update({
            where: { id: session.user.id },
            data: {
              firstName: customer.firstName,
              lastName: customer.lastName,
              documentNumber: customer.documentNumber,
              phone: customer.phone,
            },
          })
        : await tx.user.upsert({
            where: { email: customer.email.toLowerCase() },
            update: {
              firstName: customer.firstName,
              lastName: customer.lastName,
              documentNumber: customer.documentNumber,
              phone: customer.phone,
            },
            create: {
              email: customer.email.toLowerCase(),
              firstName: customer.firstName,
              lastName: customer.lastName,
              documentNumber: customer.documentNumber,
              phone: customer.phone,
            },
          });

      const isBankTransfer = customer.paymentMethod === "BANK_TRANSFER";
      const shippingCost = 0;
      const discountAmount = isBankTransfer
        ? Math.round(
            calculatedSubtotal * (BANK_TRANSFER_DISCOUNT_PERCENTAGE / 100)
          )
        : 0;
      const totalAmount = Math.max(
        0,
        calculatedSubtotal - discountAmount + shippingCost
      );

      // 4. Snapshot estático e inmutable de dirección de envío
      const shippingAddressSnapshot = {
        recipient: `${customer.firstName} ${customer.lastName}`,
        documentNumber: customer.documentNumber,
        phone: customer.phone,
        street: customer.street,
        number: customer.number,
        apartment: customer.apartment || null,
        postalCode: customer.postalCode.toUpperCase(),
        city: customer.city,
        state: customer.state,
        country: "AR",
      };

      // 5. Crear la Order en estado PENDING con sus OrderItems y su registro Payment
      const order = await tx.order.create({
        data: {
          userId: user.id,
          status: OrderStatus.PENDING,
          subtotal: calculatedSubtotal,
          discountAmount,
          shippingCost,
          totalAmount,
          customerDocument: customer.documentNumber,
          shippingAddress: shippingAddressSnapshot,
          notes: customer.notes || null,
          items: {
            create: orderItemsToCreate,
          },
          payment: {
            create: {
              provider: isBankTransfer
                ? PaymentProvider.BANK_TRANSFER
                : PaymentProvider.MERCADOPAGO,
              status: PaymentStatus.PENDING,
              paymentMethod: isBankTransfer ? "bank_transfer" : null,
              paymentType: isBankTransfer ? "bank_transfer" : null,
              transactionAmount: totalAmount,
            },
          },
        },
        select: {
          id: true,
          orderNumber: true,
          subtotal: true,
          discountAmount: true,
          totalAmount: true,
        },
      });

      return {
        orderId: order.id,
        orderNumber: order.orderNumber,
        subtotal: Number(order.subtotal),
        discountAmount: Number(order.discountAmount),
        totalAmount: Number(order.totalAmount),
      };
    });

    // 6. Email transaccional "Orden Confirmada" (incluye CBU si es por transferencia).
    //    Se ejecuta fuera de la transacción y nunca interrumpe el checkout si falla.
    await sendOrderConfirmedEmail(txResult.orderId);

    // 7. Resolver URL de redirección según el medio de pago seleccionado
    if (customer.paymentMethod === "BANK_TRANSFER") {
      return {
        success: true,
        orderId: txResult.orderId,
        orderNumber: txResult.orderNumber,
        subtotal: txResult.subtotal,
        discountAmount: txResult.discountAmount,
        totalAmount: txResult.totalAmount,
        paymentMethod: "BANK_TRANSFER",
        redirectUrl: `/checkout/confirmacion/${txResult.orderId}`,
      };
    }

    // Flujo Mercado Pago: generar Preference y devolver init_point
    const mpPreference = await createMercadoPagoPreference(txResult.orderId);

    if (!mpPreference.success) {
      return {
        success: false,
        error: mpPreference.error,
      };
    }

    return {
      success: true,
      orderId: txResult.orderId,
      orderNumber: txResult.orderNumber,
      subtotal: txResult.subtotal,
      discountAmount: txResult.discountAmount,
      totalAmount: txResult.totalAmount,
      paymentMethod: "MERCADOPAGO",
      redirectUrl: mpPreference.initPoint,
    };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Ocurrió un error inesperado al procesar la orden.";
    return {
      success: false,
      error: message,
    };
  }
}

export interface OrderItemSummaryDTO {
  id: string;
  productName: string;
  variantSku: string;
  sizeName: string;
  colorName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  imageUrl?: string | null;
}

export interface ConfirmationOrderDTO {
  id: string;
  orderNumber: number;
  status: OrderStatus;
  subtotal: number;
  discountAmount: number;
  shippingCost: number;
  totalAmount: number;
  customerName: string;
  customerEmail: string;
  customerDocument: string;
  createdAt: string;
  paymentProvider: PaymentProvider;
  paymentStatus: PaymentStatus;
  items: OrderItemSummaryDTO[];
}

/**
 * Obtiene los datos detallados de una orden para la vista de Confirmación de Pedido / Recibo Digital.
 */
export async function getConfirmationOrderDetails(
  orderId: string
): Promise<ConfirmationOrderDTO | null> {
  const order = await db.order.findUnique({
    where: { id: orderId },
    include: {
      user: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      payment: {
        select: {
          provider: true,
          status: true,
        },
      },
      items: {
        include: {
          variant: {
            select: {
              imageUrl: true,
              product: {
                select: {
                  images: {
                    orderBy: { position: "asc" },
                    take: 1,
                    select: { url: true },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!order) return null;

  return {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    subtotal: Number(order.subtotal),
    discountAmount: Number(order.discountAmount),
    shippingCost: Number(order.shippingCost),
    totalAmount: Number(order.totalAmount),
    customerName: `${order.user.firstName} ${order.user.lastName}`,
    customerEmail: order.user.email,
    customerDocument: order.customerDocument,
    createdAt: order.createdAt.toISOString(),
    paymentProvider: order.payment?.provider ?? PaymentProvider.BANK_TRANSFER,
    paymentStatus: order.payment?.status ?? PaymentStatus.PENDING,
    items: order.items.map((item) => ({
      id: item.id,
      productName: item.productName,
      variantSku: item.variantSku,
      sizeName: item.sizeName,
      colorName: item.colorName,
      quantity: item.quantity,
      unitPrice: Number(item.unitPrice),
      subtotal: Number(item.subtotal),
      imageUrl: item.variant?.imageUrl || item.variant?.product?.images[0]?.url || null,
    })),
  };
}

/**
 * Obtiene los datos resumidos de una orden para la pantalla `/checkout/transferencia/[id]`.
 */
export async function getTransferOrderDetails(
  orderId: string
): Promise<TransferOrderSummaryDTO | null> {
  const order = await db.order.findUnique({
    where: { id: orderId },
    include: {
      user: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      items: {
        select: { quantity: true },
      },
    },
  });

  if (!order) return null;

  const itemsCount = order.items.reduce((acc, item) => acc + item.quantity, 0);

  return {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    subtotal: Number(order.subtotal),
    discountAmount: Number(order.discountAmount),
    shippingCost: Number(order.shippingCost),
    totalAmount: Number(order.totalAmount),
    customerName: `${order.user.firstName} ${order.user.lastName}`,
    customerEmail: order.user.email,
    customerDocument: order.customerDocument,
    createdAt: order.createdAt.toISOString(),
    itemsCount,
  };
}
