import { db } from "@/lib/db";
import { OrderStatus, PaymentProvider, PaymentStatus } from "@prisma/client";

/*
 * Lecturas de una orden por su ID para las páginas de confirmación.
 *
 * Esto NO es una Server Action ("use server"): las funciones exportadas de un
 * archivo "use server" son endpoints públicos que cualquiera puede invocar.
 * Acá solo las llaman Server Components. El ID de la orden es un UUID, y quien
 * lo conoce (la compradora, por el redirect o su email) puede ver el recibo, por
 * eso el DTO no incluye el DNI/CUIT y el email va enmascarado.
 */

/** "gonzalo@gmail.com" → "g•••••@gmail.com" */
export function maskEmail(email: string): string {
  const [local = "", domain = ""] = email.split("@");
  if (!domain) return "•••";
  return `${local.slice(0, 1)}${"•".repeat(Math.max(2, Math.min(local.length - 1, 6)))}@${domain}`;
}

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
  createdAt: string;
  itemsCount: number;
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
  createdAt: string;
  paymentProvider: PaymentProvider;
  paymentStatus: PaymentStatus;
  items: OrderItemSummaryDTO[];
}

/**
 * Datos de una orden para la vista de Confirmación de Pedido / Recibo Digital.
 */
export async function getConfirmationOrderDetails(
  orderId: string
): Promise<ConfirmationOrderDTO | null> {
  if (!/^[0-9a-f-]{36}$/i.test(orderId)) return null;

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
    customerEmail: maskEmail(order.user.email),
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
 * Datos resumidos de una orden para la pantalla `/checkout/transferencia/[id]`.
 */
export async function getTransferOrderDetails(
  orderId: string
): Promise<TransferOrderSummaryDTO | null> {
  if (!/^[0-9a-f-]{36}$/i.test(orderId)) return null;

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
    customerEmail: maskEmail(order.user.email),
    createdAt: order.createdAt.toISOString(),
    itemsCount,
  };
}
