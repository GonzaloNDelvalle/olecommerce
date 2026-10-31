"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import {
  sendOrderShippedEmail,
  sendPaymentApprovedEmail,
} from "@/lib/email";
import {
  OrderStatus,
  PaymentProvider,
  PaymentStatus,
  ProductStatus,
} from "@prisma/client";

export interface ShippingAddressSnapshotDTO {
  recipient?: string;
  documentNumber?: string;
  phone?: string;
  street?: string;
  number?: string;
  apartment?: string | null;
  postalCode?: string;
  city?: string;
  state?: string;
  country?: string;
}

export interface AdminOrderItemDTO {
  id: string;
  variantId: string;
  productName: string;
  variantSku: string;
  sizeName: string;
  colorName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface AdminOrderDTO {
  id: string;
  orderNumber: number;
  status: OrderStatus;
  subtotal: number;
  discountAmount: number;
  shippingCost: number;
  totalAmount: number;
  customerDocument: string;
  shippingAddress: ShippingAddressSnapshotDTO;
  carrier: string | null;
  trackingCode: string | null;
  shippedAt: string | null;
  notes: string | null;
  createdAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
  };
  items: AdminOrderItemDTO[];
  payment: {
    id: string;
    provider: PaymentProvider;
    status: PaymentStatus;
    preferenceId: string | null;
    paymentId: string | null;
    paymentMethod: string | null;
    paymentType: string | null;
    installments: number;
    paidAt: string | null;
  } | null;
}

export interface AdminDashboardSummaryDTO {
  totalRevenueArs: number;
  paidOrdersCount: number;
  pendingOrdersCount: number;
  activeProductsCount: number;
  recentOrders: AdminOrderDTO[];
}

export type AdminOrderMutationResult =
  | {
      success: true;
      message: string;
    }
  | {
      success: false;
      error: string;
    };

function mapOrderToDTO(order: {
  id: string;
  orderNumber: number;
  status: OrderStatus;
  subtotal: unknown;
  discountAmount: unknown;
  shippingCost: unknown;
  totalAmount: unknown;
  customerDocument: string;
  shippingAddress: unknown;
  shippingCarrier?: string | null;
  trackingNumber?: string | null;
  carrier?: string | null;
  trackingCode?: string | null;
  shippedAt?: Date | null;
  notes: string | null;
  createdAt: Date;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
  };
  items: {
    id: string;
    variantId: string;
    productName: string;
    variantSku: string;
    sizeName: string;
    colorName: string;
    quantity: number;
    unitPrice: unknown;
    subtotal: unknown;
  }[];
  payment: {
    id: string;
    provider: PaymentProvider;
    status: PaymentStatus;
    preferenceId: string | null;
    paymentId: string | null;
    paymentMethod: string | null;
    paymentType: string | null;
    installments: number;
    paidAt: Date | null;
  } | null;
}): AdminOrderDTO {
  const addressObj =
    typeof order.shippingAddress === "object" && order.shippingAddress !== null
      ? (order.shippingAddress as ShippingAddressSnapshotDTO)
      : {};

  return {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    subtotal: Number(order.subtotal),
    discountAmount: Number(order.discountAmount),
    shippingCost: Number(order.shippingCost),
    totalAmount: Number(order.totalAmount),
    customerDocument: order.customerDocument,
    shippingAddress: addressObj,
    carrier: order.carrier ?? order.shippingCarrier ?? null,
    trackingCode: order.trackingCode ?? order.trackingNumber ?? null,
    shippedAt: order.shippedAt ? order.shippedAt.toISOString() : null,
    notes: order.notes,
    createdAt: order.createdAt.toISOString(),
    user: order.user,
    items: order.items.map((item) => ({
      id: item.id,
      variantId: item.variantId,
      productName: item.productName,
      variantSku: item.variantSku,
      sizeName: item.sizeName,
      colorName: item.colorName,
      quantity: item.quantity,
      unitPrice: Number(item.unitPrice),
      subtotal: Number(item.subtotal),
    })),
    payment: order.payment
      ? {
          id: order.payment.id,
          provider: order.payment.provider,
          status: order.payment.status,
          preferenceId: order.payment.preferenceId,
          paymentId: order.payment.paymentId,
          paymentMethod: order.payment.paymentMethod,
          paymentType: order.payment.paymentType,
          installments: order.payment.installments,
          paidAt: order.payment.paidAt
            ? order.payment.paidAt.toISOString()
            : null,
        }
      : null,
  };
}

/**
 * Obtiene el listado completo de órdenes para `/admin/ordenes`,
 * opcionalmente filtrado por estado (PENDING, PAID, CANCELLED, etc.).
 */
export async function getAdminOrders(
  statusFilter?: OrderStatus
): Promise<AdminOrderDTO[]> {
  const orders = await db.order.findMany({
    where: statusFilter ? { status: statusFilter } : undefined,
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
        },
      },
      items: true,
      payment: {
        select: {
          id: true,
          provider: true,
          status: true,
          preferenceId: true,
          paymentId: true,
          paymentMethod: true,
          paymentType: true,
          installments: true,
          paidAt: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return orders.map(mapOrderToDTO);
}

/**
 * Obtiene el detalle completo de una orden por su UUID para `/admin/ordenes/[id]`.
 */
export async function getAdminOrderById(
  orderId: string
): Promise<AdminOrderDTO | null> {
  const order = await db.order.findUnique({
    where: { id: orderId },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
        },
      },
      items: true,
      payment: {
        select: {
          id: true,
          provider: true,
          status: true,
          preferenceId: true,
          paymentId: true,
          paymentMethod: true,
          paymentType: true,
          installments: true,
          paidAt: true,
        },
      },
    },
  });

  if (!order) return null;
  return mapOrderToDTO(order);
}

/**
 * Acredita manualmente el pago de una orden en estado PENDING -> PAID
 * (Flujo de validación por Transferencia Bancaria / Efectivo por parte del Administrador).
 * Descuenta de forma atómica tanto el stock físico (`stock`) como la reserva (`reservedStock`).
 */
export async function approveManualOrderPayment(
  orderId: string
): Promise<AdminOrderMutationResult> {
  try {
    const transitionedToPaid = await db.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: {
          items: true,
          payment: true,
        },
      });

      if (!order) {
        throw new Error("La orden solicitada no existe.");
      }

      if (order.status === OrderStatus.PAID) {
        return false;
      }

      if (order.status !== OrderStatus.PENDING) {
        throw new Error(
          `No es posible acreditar manualmente una orden en estado ${order.status}.`
        );
      }

      // 1. Cambiar el estado de la orden de PENDING a PAID (transición atómica:
      //    ante dos solicitudes simultáneas, solo una logra el cambio)
      const claimed = await tx.order.updateMany({
        where: { id: orderId, status: OrderStatus.PENDING },
        data: {
          status: OrderStatus.PAID,
        },
      });

      if (claimed.count === 0) {
        return false;
      }

      // 2. Conciliar inventario físico y reservado de cada variante comprada
      for (const item of order.items) {
        const variant = await tx.productVariant.findUnique({
          where: { id: item.variantId },
          select: { stock: true, reservedStock: true },
        });

        if (variant) {
          const stockToDecrement = Math.min(variant.stock, item.quantity);
          const reservedToDecrement = Math.min(
            variant.reservedStock,
            item.quantity
          );

          await tx.productVariant.update({
            where: { id: item.variantId },
            data: {
              stock: { decrement: stockToDecrement },
              reservedStock: { decrement: reservedToDecrement },
            },
          });
        }
      }

      // 3. Registrar / actualizar el registro de Payment como APPROVED (Transferencia / Efectivo)
      const now = new Date();
      await tx.payment.upsert({
        where: { orderId },
        update: {
          provider: PaymentProvider.BANK_TRANSFER,
          status: PaymentStatus.APPROVED,
          paymentMethod: "transferencia_efectivo",
          paymentType: "manual_validation",
          statusDetail: "manual_admin_approval",
          paidAt: now,
        },
        create: {
          orderId,
          provider: PaymentProvider.BANK_TRANSFER,
          status: PaymentStatus.APPROVED,
          paymentMethod: "transferencia_efectivo",
          paymentType: "manual_validation",
          installments: 1,
          transactionAmount: order.totalAmount,
          statusDetail: "manual_admin_approval",
          paidAt: now,
        },
      });

      return true;
    });

    // 4. Email transaccional "Pago Acreditado" (solo si la orden efectivamente pasó a PAID ahora)
    if (transitionedToPaid) {
      await sendPaymentApprovedEmail(orderId);
    }

    revalidatePath("/admin");
    revalidatePath("/admin/ordenes");
    revalidatePath(`/admin/ordenes/${orderId}`);
    revalidatePath("/admin/productos");
    revalidatePath("/productos");

      return {
      success: true,
      message:
        "Pago manual acreditado con éxito. La orden pasó a estado PAID y se descontó el stock definitivo.",
    };
  } catch (error) {
    console.error("[approveManualOrderPayment] Error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Ocurrió un error al intentar acreditar el pago manualmente.",
    };
  }
}

/**
 * Despacha una orden en estado PAID -> SHIPPED, guardando empresa de envío (`carrier`),
 * código de seguimiento (`trackingCode`) y fecha de despacho (`shippedAt`),
 * y dispara inmediatamente el correo transaccional "Tu paquete está en viaje".
 */
export async function dispatchAdminOrder(
  orderId: string,
  payload: {
    carrier: string;
    trackingCode: string;
  }
): Promise<AdminOrderMutationResult> {
  const carrier = payload.carrier?.trim();
  const trackingCode = payload.trackingCode?.trim();

  if (!carrier) {
    return {
      success: false,
      error: "Seleccioná la empresa de envío.",
    };
  }

  if (!trackingCode) {
    return {
      success: false,
      error: "Ingresá el código de seguimiento del envío.",
    };
  }

  try {
    const order = await db.order.findUnique({
      where: { id: orderId },
      select: { id: true, orderNumber: true, status: true },
    });

    if (!order) {
      return {
        success: false,
        error: "La orden solicitada no existe.",
      };
    }

    if (
      order.status !== OrderStatus.PAID &&
      order.status !== OrderStatus.PROCESSING
    ) {
      return {
        success: false,
        error: `Solo se pueden despachar órdenes pagadas (estado actual: ${order.status}).`,
      };
    }

    const now = new Date();
    await db.order.update({
      where: { id: orderId },
      data: {
        status: OrderStatus.SHIPPED,
        carrier,
        shippingCarrier: carrier,
        trackingCode,
        trackingNumber: trackingCode,
        shippedAt: now,
      },
    });

    // Disparar inmediatamente el email "Tu paquete está en viaje"
    await sendOrderShippedEmail(orderId);

    revalidatePath("/admin");
    revalidatePath("/admin/ordenes");
    revalidatePath(`/admin/ordenes/${orderId}`);
    revalidatePath("/mi-cuenta");

    return {
      success: true,
      message: `Orden #${order.orderNumber} despachada (${carrier} • ${trackingCode}) y notificación enviada por correo.`,
    };
  } catch (error) {
    console.error("[dispatchAdminOrder] Error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Ocurrió un error al despachar el pedido.",
    };
  }
}

/**
 * Cancela una orden en estado PENDING -> CANCELLED dentro de una transacción segura (`db.$transaction`)
 * y restituye automáticamente las unidades reservadas (`reservedStock`) al stock disponible
 * de cada variante de prenda involucrada.
 */
export async function cancelAdminOrder(
  orderId: string
): Promise<AdminOrderMutationResult> {
  try {
    await db.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: {
          items: true,
        },
      });

      if (!order) {
        throw new Error("La orden solicitada no existe.");
      }

      if (order.status === OrderStatus.CANCELLED) {
        return;
      }

      if (order.status !== OrderStatus.PENDING) {
        throw new Error(
          `Solo se pueden cancelar órdenes en estado PENDING (estado actual: ${order.status}).`
        );
      }

      // 1. Transición atómica de PENDING a CANCELLED
      const claimed = await tx.order.updateMany({
        where: { id: orderId, status: OrderStatus.PENDING },
        data: { status: OrderStatus.CANCELLED },
      });

      if (claimed.count === 0) {
        return;
      }

      // 2. Restituir las unidades reservadas al stock disponible de cada variante
      for (const item of order.items) {
        const variant = await tx.productVariant.findUnique({
          where: { id: item.variantId },
          select: { reservedStock: true },
        });

        if (variant && variant.reservedStock > 0) {
          const toRelease = Math.min(variant.reservedStock, item.quantity);
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: {
              reservedStock: {
                decrement: toRelease,
              },
            },
          });
        }
      }

      // 3. Marcar el Payment asociado como CANCELLED
      await tx.payment.updateMany({
        where: { orderId },
        data: { status: PaymentStatus.CANCELLED },
      });
    });

    revalidatePath("/admin");
    revalidatePath("/admin/ordenes");
    revalidatePath(`/admin/ordenes/${orderId}`);
    revalidatePath("/admin/productos");
    revalidatePath("/productos");
    revalidatePath("/mi-cuenta");

    return {
      success: true,
      message:
        "Orden cancelada con éxito. Las unidades reservadas fueron restituidas al stock disponible.",
    };
  } catch (error) {
    console.error("[cancelAdminOrder] Error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Ocurrió un error al cancelar la orden.",
    };
  }
}

/**
 * Obtiene los indicadores ejecutivos (KPIs) y las últimas 5 órdenes para `/admin`.
 */
export async function getAdminDashboardSummary(): Promise<AdminDashboardSummaryDTO> {
  const [
    paidAggregation,
    paidOrdersCount,
    pendingOrdersCount,
    activeProductsCount,
    recentOrdersRaw,
  ] = await Promise.all([
    db.order.aggregate({
      where: {
        status: {
          in: [
            OrderStatus.PAID,
            OrderStatus.PROCESSING,
            OrderStatus.SHIPPED,
            OrderStatus.DELIVERED,
          ],
        },
      },
      _sum: { totalAmount: true },
    }),
    db.order.count({
      where: { status: OrderStatus.PAID },
    }),
    db.order.count({
      where: { status: OrderStatus.PENDING },
    }),
    db.product.count({
      where: { status: ProductStatus.ACTIVE },
    }),
    db.order.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        items: true,
        payment: {
          select: {
            id: true,
            provider: true,
            status: true,
            preferenceId: true,
            paymentId: true,
            paymentMethod: true,
            paymentType: true,
            installments: true,
            paidAt: true,
          },
        },
      },
    }),
  ]);

  return {
    totalRevenueArs: Number(paidAggregation._sum.totalAmount ?? 0),
    paidOrdersCount,
    pendingOrdersCount,
    activeProductsCount,
    recentOrders: recentOrdersRaw.map(mapOrderToDTO),
  };
}
