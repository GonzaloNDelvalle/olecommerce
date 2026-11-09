"use server";

import { getSession } from "@/auth";
import { db } from "@/lib/db";
import { OrderStatus, PaymentProvider, PaymentStatus } from "@prisma/client";

/*
 * Registro, login, logout, verificación de email y recuperación de contraseña
 * se resuelven en el navegador con `authClient` (src/lib/auth-client.ts), que
 * llama a /api/auth/* de Better Auth (con límite de intentos).
 */

export interface CustomerOrderItemDTO {
  id: string;
  productName: string;
  variantSku: string;
  sizeName: string;
  colorName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  imageUrl: string | null;
}

export interface CustomerOrderDTO {
  id: string;
  orderNumber: number;
  status: OrderStatus;
  subtotal: number;
  discountAmount: number;
  shippingCost: number;
  totalAmount: number;
  createdAt: string;
  carrier: string | null;
  trackingCode: string | null;
  shippedAt: string | null;
  items: CustomerOrderItemDTO[];
  payment: {
    id: string;
    provider: PaymentProvider;
    status: PaymentStatus;
    paymentMethod: string | null;
    paidAt: string | null;
  } | null;
}

export interface CustomerAccountProfileDTO {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  documentNumber: string | null;
  phone: string | null;
  createdAt: string;
  orders: CustomerOrderDTO[];
}

/**
 * Obtiene el perfil completo de la clienta autenticada y el historial de sus órdenes
 * (incluyendo el estado de pago y el detalle de prendas compradas) para `/mi-cuenta`.
 */
export async function getCurrentCustomerProfile(): Promise<CustomerAccountProfileDTO | null> {
  const session = await getSession();
  if (!session?.user?.id) {
    return null;
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    include: {
      orders: {
        orderBy: { createdAt: "desc" },
        include: {
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
          payment: {
            select: {
              id: true,
              provider: true,
              status: true,
              paymentMethod: true,
              paidAt: true,
            },
          },
        },
      },
    },
  });

  if (!user) return null;

  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    documentNumber: user.documentNumber,
    phone: user.phone,
    createdAt: user.createdAt.toISOString(),
    orders: user.orders.map((order) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      subtotal: Number(order.subtotal),
      discountAmount: Number(order.discountAmount),
      shippingCost: Number(order.shippingCost),
      totalAmount: Number(order.totalAmount),
      createdAt: order.createdAt.toISOString(),
      carrier: order.carrier ?? null,
      trackingCode: order.trackingCode ?? null,
      shippedAt: order.shippedAt ? order.shippedAt.toISOString() : null,
      items: order.items.map((item) => ({
        id: item.id,
        productName: item.productName,
        variantSku: item.variantSku,
        sizeName: item.sizeName,
        colorName: item.colorName,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
        subtotal: Number(item.subtotal),
        imageUrl:
          item.variant.imageUrl ?? item.variant.product.images[0]?.url ?? null,
      })),
      payment: order.payment
        ? {
            id: order.payment.id,
            provider: order.payment.provider,
            status: order.payment.status,
            paymentMethod: order.payment.paymentMethod,
            paidAt: order.payment.paidAt
              ? order.payment.paidAt.toISOString()
              : null,
          }
        : null,
    })),
  };
}
