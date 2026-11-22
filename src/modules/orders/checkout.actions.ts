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
import { createMercadoPagoPreference } from "@/modules/orders/mercadopago-preference";
import { sendOrderConfirmedEmail } from "@/lib/email";
import {
  mergeStockLines,
  releaseReservedStock,
  reserveVariantStock,
} from "@/modules/orders/inventory";
import { revalidateStockForVariants } from "@/lib/cache-tags";
import { consumeRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import {
  applyDiscount,
  computeOrderTotals,
  isShippingAvailableFor,
} from "@/modules/orders/pricing";
import {
  QUOTE_UNAVAILABLE_MESSAGES,
  packageWeight,
  quoteShipping,
} from "@/modules/orders/shipping-rates";
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

/**
 * Error de negocio con un mensaje pensado para mostrarse a la compradora.
 * Cualquier otro error (Prisma, red, bug) se registra en el servidor y se
 * responde con un mensaje genérico, para no filtrar detalles internos.
 */
class CheckoutError extends Error {}

/**
 * Cancela una orden PENDING recién creada cuya preferencia de Mercado Pago no se pudo
 * generar y devuelve su stock reservado. Si esto también falla, el cron de vencimiento
 * la libera más tarde, así que el error solo se registra.
 */
async function cancelOrderWithoutPaymentLink(orderId: string, variantIds: string[]) {
  try {
    await db.$transaction(async (tx) => {
      const claimed = await tx.order.updateMany({
        where: { id: orderId, status: OrderStatus.PENDING },
        data: { status: OrderStatus.CANCELLED },
      });
      if (claimed.count === 0) return;

      const items = await tx.orderItem.findMany({
        where: { orderId },
        select: { variantId: true, quantity: true },
      });
      await releaseReservedStock(tx, items);
      await tx.payment.updateMany({
        where: { orderId },
        data: { status: PaymentStatus.CANCELLED },
      });
    });
    await revalidateStockForVariants(variantIds);
  } catch (error) {
    console.error("[processCheckoutOrder] No se pudo cancelar la orden sin link de pago:", error);
  }
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
              weightInGrams: true,
            },
          },
          size: { select: { name: true } },
          color: { select: { name: true } },
        },
      });

      const variantMap = new Map(dbVariants.map((v) => [v.id, v]));

      let calculatedSubtotal = 0;
      const packageItems: { weightGrams: number; quantity: number }[] = [];
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
          throw new CheckoutError(
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
          throw new CheckoutError(
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
        packageItems.push({ weightGrams: variant.product.weightInGrams, quantity: requestedItem.quantity });

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

      // Costo de envío calculado acá (CP + peso real de las prendas), nunca el del navegador
      const quote = quoteShipping(shippingMethod, {
        postalCode: customer.postalCode,
        weightGrams: shippingMethod.rateTable ? packageWeight(packageItems, shippingMethod.rateTable) : 0,
        subtotal: calculatedSubtotal,
      });
      if (!quote.available) {
        throw new CheckoutError(QUOTE_UNAVAILABLE_MESSAGES[quote.reason]);
      }

      const isBankTransfer = customer.paymentMethod === "BANK_TRANSFER";
      const { discountAmount, shippingCost, totalAmount } = computeOrderTotals({
        subtotal: calculatedSubtotal,
        shippingCost: quote.cost,
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

    // 6. Resolver URL de redirección según el medio de pago seleccionado.
    //    Email transaccional "Orden Confirmada" (incluye CBU si es por transferencia):
    //    se envía fuera de la transacción y nunca interrumpe el checkout si falla.
    if (customer.paymentMethod === "BANK_TRANSFER") {
      await sendOrderConfirmedEmail(txResult.orderId);
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
      // Sin link de pago la orden no se puede cobrar: se cancela y se libera el stock
      // ya mismo (si no, cada reintento reservaría más prendas hasta que venza el cron)
      await cancelOrderWithoutPaymentLink(
        txResult.orderId,
        items.map((item) => item.variantId)
      );
      return {
        success: false,
        error: mpPreference.error,
      };
    }

    // El email de confirmación sale recién cuando el pago quedó listo para hacerse
    await sendOrderConfirmedEmail(txResult.orderId);

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
    if (error instanceof CheckoutError) {
      return { success: false, error: error.message };
    }
    console.error("[processCheckoutOrder] Error inesperado:", error);
    return {
      success: false,
      error:
        "Ocurrió un error inesperado al procesar la orden. Intentá nuevamente en unos minutos.",
    };
  }
}
