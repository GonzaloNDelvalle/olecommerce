"use server";

import bcrypt from "bcryptjs";
import { createHash, randomBytes } from "node:crypto";
import { AuthError } from "next-auth";
import { revalidatePath } from "next/cache";
import { auth, signIn, signOut } from "@/auth";
import { db } from "@/lib/db";
import { APP_URL, resend, sendEmailVerificationEmail } from "@/lib/email";
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

export type RegisterActionResult =
  | {
      success: true;
      email: string;
    }
  | {
      success: false;
      error: string;
    };

const EMAIL_VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000;

function hashVerificationToken(rawToken: string): string {
  return createHash("sha256").update(rawToken).digest("hex");
}

/**
 * Registra una nueva clienta con verificación de email obligatoria:
 * - La contraseña elegida se guarda como `pendingPasswordHash` y recién se activa
 *   (pasa a `passwordHash`) cuando la dueña del email hace clic en el link enviado.
 * - Si el email ya existía por una compra como invitada, NO se toca su perfil ni
 *   sus órdenes hasta confirmar la casilla: nadie puede "reclamar" el historial
 *   (DNI, direcciones, pedidos) de otra persona solo conociendo su email.
 * - Volver a registrarse con un email pendiente reenvía un link nuevo.
 */
export async function registerCustomerAction(
  payload: RegisterFormValues
): Promise<RegisterActionResult> {
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
      select: { id: true, passwordHash: true, firstName: true },
    });

    if (existingUser?.passwordHash) {
      return {
        success: false,
        error: "Ya existe una cuenta registrada con este correo electrónico.",
      };
    }

    const pendingPasswordHash = await bcrypt.hash(password, 12);
    const fullName = `${firstName} ${lastName}`.trim();

    if (existingUser) {
      // Email de una compradora invitada: solo se guarda la contraseña pendiente.
      await db.user.update({
        where: { id: existingUser.id },
        data: { pendingPasswordHash },
      });
    } else {
      await db.user.create({
        data: {
          email: normalizedEmail,
          name: fullName,
          firstName,
          lastName,
          pendingPasswordHash,
          documentNumber: documentNumber || null,
          phone: phone || null,
          isActive: true,
        },
      });
    }

    // Un único link vigente por email; en la base se guarda solo el hash del token
    const rawToken = randomBytes(32).toString("base64url");
    await db.$transaction([
      db.verificationToken.deleteMany({
        where: { identifier: normalizedEmail },
      }),
      db.verificationToken.create({
        data: {
          identifier: normalizedEmail,
          token: hashVerificationToken(rawToken),
          expires: new Date(Date.now() + EMAIL_VERIFICATION_TTL_MS),
        },
      }),
    ]);

    const verifyUrl = `${APP_URL}/verificar-email?token=${encodeURIComponent(rawToken)}`;
    const emailResult = await sendEmailVerificationEmail({
      to: normalizedEmail,
      firstName: existingUser?.firstName || firstName,
      verifyUrl,
    });

    if (!resend && process.env.NODE_ENV !== "production") {
      console.info(`[registro] Link de verificación (modo desarrollo): ${verifyUrl}`);
    }

    if (!emailResult.success) {
      return {
        success: false,
        error:
          "No pudimos enviarte el email de confirmación. Intentá nuevamente en unos minutos.",
      };
    }

    return { success: true, email: normalizedEmail };
  } catch (error) {
    console.error("[registerCustomerAction] Error:", error);
    return {
      success: false,
      error: "Ocurrió un error al registrar tu cuenta. Intentá nuevamente.",
    };
  }
}

/**
 * Confirma el email a partir del token del link y activa la contraseña pendiente.
 * Se invoca desde un botón (POST) y no al abrir el link, para que los
 * escáneres de seguridad de los proveedores de correo no la activen solos.
 */
export async function verifyEmailAction(
  rawToken: string
): Promise<AuthActionResult> {
  const token = typeof rawToken === "string" ? rawToken.trim() : "";
  if (!token || token.length > 200) {
    return { success: false, error: "El link de verificación no es válido." };
  }

  try {
    const tokenHash = hashVerificationToken(token);
    const record = await db.verificationToken.findUnique({
      where: { token: tokenHash },
    });

    if (!record || record.expires < new Date()) {
      return {
        success: false,
        error:
          "El link venció o ya fue utilizado. Volvé a registrarte para recibir uno nuevo.",
      };
    }

    const activated = await db.$transaction(async (tx) => {
      await tx.verificationToken.deleteMany({
        where: { identifier: record.identifier },
      });

      const user = await tx.user.findUnique({
        where: { email: record.identifier },
        select: { id: true, pendingPasswordHash: true },
      });

      if (!user?.pendingPasswordHash) return false;

      await tx.user.update({
        where: { id: user.id },
        data: {
          passwordHash: user.pendingPasswordHash,
          pendingPasswordHash: null,
          emailVerified: new Date(),
        },
      });
      return true;
    });

    if (!activated) {
      return {
        success: false,
        error: "Esta cuenta ya estaba activada. Iniciá sesión con tu contraseña.",
      };
    }

    return { success: true };
  } catch (error) {
    console.error("[verifyEmailAction] Error:", error);
    return {
      success: false,
      error: "No pudimos confirmar tu email. Intentá nuevamente.",
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
      const pending = await db.user
        .findUnique({
          where: { email: parsed.data.email.toLowerCase() },
          select: { passwordHash: true, pendingPasswordHash: true },
        })
        .catch(() => null);

      if (pending && !pending.passwordHash && pending.pendingPasswordHash) {
        return {
          success: false,
          error:
            "Tenés que confirmar tu email antes de ingresar. Revisá tu casilla (y la carpeta de spam); si no lo encontrás, volvé a registrarte para recibir un link nuevo.",
        };
      }

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
