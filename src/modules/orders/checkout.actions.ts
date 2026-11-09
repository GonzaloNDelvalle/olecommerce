"use server";

import { getSession } from "@/auth";
import { db } from "@/lib/db";
import {
  OrderStatus,
  PaymentProvider,
  PaymentStatus,
  ProductStatus,
} from "@prisma/client";
import {
  createOrderPayloadSchema,
  type CheckoutPaymentMethod,
  type CreateOrderPayload,
} from "@/modules/orders/schemas/checkout.schema";
import { createMercadoPagoPreference } from "@/modules/orders/payment.actions";
import { sendOrderConfirmedEmail } from "@/lib/email";
import { mergeStockLines, reserveVariantStock } from "@/modules/orders/inventory";
import { revalidateStockForVariants } from "@/lib/cache-tags";
import { consumeRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import {
  applyDiscount,
  computeOrderTotals,
  computeShippingCost,
  isShippingAvailableFor,
} from "@/modules/orders/pricing";
import {
  getActiveShippingMethods,
  getStoreSettings,
  isBankTransferAvailable,
} from "@/modules/settings/store-settings";

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

  if (!(await consumeRateLimit(RATE_LIMITS.checkout))) {
    return {
      success: false,
      error:
        "Hiciste demasiados intentos de compra seguidos. Esperá unos minutos y volvé a intentar.",
    };
  }

  const { customer } = parsed.data;
  // Si el carrito trae la misma variante en dos líneas, se procesa como una sola
  const items = mergeStockLines(parsed.data.items);
  const session = await getSession();

  // Método de entrega y medio de pago se validan contra la configuración actual
  // de la tienda (nunca se confía en costos enviados por el navegador).
  const [settings, shippingMethods] = await Promise.all([
    getStoreSettings(),
    getActiveShippingMethods(),
  ]);
  const shippingMethod = shippingMethods.find(
    (method) => method.id === customer.shippingMethodId
  );
  if (
    !shippingMethod ||
    shippingMethod.type !== customer.deliveryType ||
    !isShippingAvailableFor(shippingMethod, customer.state)
  ) {
    return {
      success: false,
      error:
        "El método de entrega elegido no está disponible para tu provincia. Elegí otro.",
    };
  }
  if (
    customer.paymentMethod === "BANK_TRANSFER" &&
    !isBankTransferAvailable(settings)
  ) {
    return {
      success: false,
      error: "El pago por transferencia no está disponible en este momento.",
    };
  }

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

        // Reserva atómica: un único UPDATE condicionado a que haya unidades
        // disponibles. Evita sobreventa cuando dos clientas compran la última unidad
        // al mismo tiempo (leer y después incrementar no es seguro).
        const reserved = await reserveVariantStock(
          tx,
          variant.id,
          requestedItem.quantity
        );

        if (!reserved) {
          const availableStock = Math.max(
            0,
            variant.stock - variant.reservedStock
          );
          throw new Error(
            `Stock insuficiente para "${variant.product.name}" (Talle ${variant.size.name} - ${variant.color.name}). Disponible: ${availableStock} u.`
          );
        }

        const rawUnitPrice = Number(
          variant.priceOverride ?? variant.product.basePrice
        );
        const effectiveUnitPrice = applyDiscount(
          rawUnitPrice,
          variant.product.discountPercentage ?? 0
        );

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

      // 3. Vincular la orden a una usuaria:
      //    - Sesión iniciada: se actualiza su propio perfil con los datos del formulario.
      //    - Invitada con email de una cuenta registrada: se vincula la orden pero NO se
      //      modifica el perfil (una persona anónima no puede pisar nombre/DNI/teléfono
      //      de una cuenta ajena). Los datos de esta compra quedan en el snapshot de la orden.
      //    - Invitada sin cuenta registrada: se crea/actualiza el registro de invitada.
      const customerProfile = {
        firstName: customer.firstName,
        lastName: customer.lastName,
        documentNumber: customer.documentNumber,
        phone: customer.phone,
      };
      const guestEmail = customer.email.toLowerCase();

      let userId: string;
      if (session?.user?.id) {
        const sessionUser = await tx.user.update({
          where: { id: session.user.id },
          data: customerProfile,
          select: { id: true },
        });
        userId = sessionUser.id;
      } else {
        const existing = await tx.user.findUnique({
          where: { email: guestEmail },
          select: {
            id: true,
            accounts: {
              where: { providerId: "credential" },
              select: { id: true },
            },
          },
        });

        if (existing && existing.accounts.length > 0) {
          userId = existing.id;
        } else {
          const guest = await tx.user.upsert({
            where: { email: guestEmail },
            update: customerProfile,
            create: { email: guestEmail, ...customerProfile },
            select: { id: true },
          });
          userId = guest.id;
        }
      }

      const isBankTransfer = customer.paymentMethod === "BANK_TRANSFER";
      const { discountAmount, shippingCost, totalAmount } = computeOrderTotals({
        subtotal: calculatedSubtotal,
        shippingCost: computeShippingCost(shippingMethod, calculatedSubtotal),
        isBankTransfer,
        bankTransferDiscountPercentage: settings.bankTransferDiscountPercentage,
      });

      // 4. Snapshot estático e inmutable de dirección de envío
      const isPickup = shippingMethod.type === "PICKUP";
      const shippingAddressSnapshot = {
        recipient: `${customer.firstName} ${customer.lastName}`,
        documentNumber: customer.documentNumber,
        phone: customer.phone,
        street: isPickup ? null : customer.street?.trim() || null,
        number: isPickup ? null : customer.number?.trim() || null,
        apartment: isPickup ? null : customer.apartment?.trim() || null,
        postalCode: isPickup ? null : customer.postalCode?.trim().toUpperCase() || null,
        city: isPickup ? null : customer.city?.trim() || null,
        state: customer.state,
        country: "AR",
        ...(isPickup ? { pickupAddress: settings.showroomAddress } : {}),
      };

      // 5. Crear la Order en estado PENDING con sus OrderItems y su registro Payment
      const order = await tx.order.create({
        data: {
          userId,
          status: OrderStatus.PENDING,
          subtotal: calculatedSubtotal,
          discountAmount,
          shippingCost,
          totalAmount,
          customerDocument: customer.documentNumber,
          shippingAddress: shippingAddressSnapshot,
          shippingMethodId: shippingMethod.id,
          shippingMethodName: shippingMethod.name,
          deliveryType: shippingMethod.type,
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

    // La ficha de los productos muestra stock disponible: refrescarla
    await revalidateStockForVariants(items.map((item) => item.variantId));

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
