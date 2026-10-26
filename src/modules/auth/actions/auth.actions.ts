"use server";

import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { revalidatePath } from "next/cache";
import { auth, signIn, signOut } from "@/auth";
import { db } from "@/lib/db";
import { OrderStatus, PaymentProvider, PaymentStatus } from "@prisma/client";
import {
  loginFormSchema,
  registerFormSchema,
  type LoginFormValues,
  type RegisterFormValues,
} from "@/modules/auth/schemas/auth.schema";

export type AuthActionResult =
  | {
      success: true;
    }
  | {
      success: false;
      error: string;
    };

export interface CustomerOrderItemDTO {
  id: string;
  productName: string;
  variantSku: string;
  sizeName: string;
  colorName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
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
 * Registra una nueva clienta en PostgreSQL:
 * - Si el email ya existía por una compra previa como invitada (`passwordHash === null`),
 *   activa su cuenta asignándole su `passwordHash` y conservando todas sus órdenes históricas.
 * - Inicia sesión automáticamente con Auth.js tras crear la cuenta.
 */
export async function registerCustomerAction(
  payload: RegisterFormValues
): Promise<AuthActionResult> {
  const parsed = registerFormSchema.safeParse(payload);

  if (!parsed.success) {
    return {
      success: false,
      error:
        parsed.error.issues[0]?.message ??
        "Revisá los campos del formulario de registro.",
    };
  }

  const { firstName, lastName, email, documentNumber, phone, password } =
    parsed.data;
  const normalizedEmail = email.toLowerCase();

  try {
    const existingUser = await db.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, passwordHash: true },
    });

    if (existingUser && existingUser.passwordHash) {
      return {
        success: false,
        error: "Ya existe una cuenta registrada con este correo electrónico.",
      };
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await db.user.upsert({
      where: { email: normalizedEmail },
      update: {
        firstName,
        lastName,
        passwordHash,
        ...(documentNumber ? { documentNumber } : {}),
        ...(phone ? { phone } : {}),
        isActive: true,
      },
      create: {
        email: normalizedEmail,
        firstName,
        lastName,
        passwordHash,
        documentNumber: documentNumber || null,
        phone: phone || null,
        isActive: true,
      },
    });

    await signIn("credentials", {
      email: normalizedEmail,
      password,
      redirect: false,
    });

    revalidatePath("/mi-cuenta");
    return { success: true };
  } catch (error) {
    if (error instanceof AuthError) {
      return {
        success: false,
        error: "Cuenta creada, pero no se pudo iniciar sesión automáticamente.",
      };
    }
    console.error("[registerCustomerAction] Error:", error);
    return {
      success: false,
      error: "Ocurrió un error al registrar tu cuenta. Intentá nuevamente.",
    };
  }
}

/**
 * Autentica a una clienta mediante Auth.js (Credentials Provider).
 */
export async function loginCustomerAction(
  payload: LoginFormValues
): Promise<AuthActionResult> {
  const parsed = loginFormSchema.safeParse(payload);

  if (!parsed.success) {
    return {
      success: false,
      error:
        parsed.error.issues[0]?.message ??
        "Ingresá tu email y contraseña válidos.",
    };
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email.toLowerCase(),
      password: parsed.data.password,
      redirect: false,
    });

    revalidatePath("/mi-cuenta");
    return { success: true };
  } catch (error) {
    if (error instanceof AuthError) {
      return {
        success: false,
        error: "El correo electrónico o la contraseña son incorrectos.",
      };
    }
    console.error("[loginCustomerAction] Error:", error);
    return {
      success: false,
      error: "No se pudo iniciar sesión en este momento.",
    };
  }
}

/**
 * Cierra la sesión activa de la clienta.
 */
export async function logoutCustomerAction(): Promise<void> {
  await signOut({ redirect: false });
  revalidatePath("/mi-cuenta");
  revalidatePath("/");
}

/**
 * Obtiene el perfil completo de la clienta autenticada y el historial de sus órdenes
 * (incluyendo el estado de pago y el detalle de prendas compradas) para `/mi-cuenta`.
 */
export async function getCurrentCustomerProfile(): Promise<CustomerAccountProfileDTO | null> {
  const session = await auth();
  if (!session?.user?.id) {
    return null;
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    include: {
      orders: {
        orderBy: { createdAt: "desc" },
        include: {
          items: true,
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
      items: order.items.map((item) => ({
        id: item.id,
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
            paymentMethod: order.payment.paymentMethod,
            paidAt: order.payment.paidAt
              ? order.payment.paidAt.toISOString()
              : null,
          }
        : null,
    })),
  };
}
