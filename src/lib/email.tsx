import type { ReactElement } from "react";
import { render } from "react-email";
import { Resend } from "resend";
import { db } from "@/lib/db";
import { readStoreSettings } from "@/modules/settings/store-settings";
import { BANK_TRANSFER_TTL_HOURS } from "@/modules/orders/order-expiration";
import type { EmailOrderData } from "@/emails/types";
import OrderConfirmedEmail, {
  orderConfirmedSubject,
} from "@/emails/OrderConfirmedEmail";
import PaymentApprovedEmail, {
  paymentApprovedSubject,
} from "@/emails/PaymentApprovedEmail";
import OrderShippedEmail, {
  orderShippedSubject,
} from "@/emails/OrderShippedEmail";
import VerifyEmail from "@/emails/VerifyEmail";
import PasswordResetEmail from "@/emails/PasswordResetEmail";
import AccountExistsEmail from "@/emails/AccountExistsEmail";
import AdminAlertEmail from "@/emails/AdminAlertEmail";
import RevocationReceivedEmail from "@/emails/RevocationReceivedEmail";
import NewsletterWelcomeEmail from "@/emails/NewsletterWelcomeEmail";

/**
 * Envío de emails transaccionales con Resend.
 *
 * Las plantillas son componentes de React Email en `src/emails/` (vista
 * previa con `pnpm email:dev`). Este módulo solo carga los datos, renderiza
 * HTML + texto plano y envía. Ninguna función lanza excepciones: un email
 * fallido nunca debe romper un checkout, un pago o un despacho.
 *
 * Variables: RESEND_API_KEY (sin ella los emails se loguean en consola),
 * EMAIL_FROM y ADMIN_NOTIFY_EMAIL.
 */

const EMAIL_FROM =
  process.env.EMAIL_FROM || "OL. Indumenti <onboarding@resend.dev>";
const ADMIN_NOTIFY_EMAIL = process.env.ADMIN_NOTIFY_EMAIL?.trim() || null;
const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

export type SendEmailResult =
  | { success: true; id: string | null }
  | { success: false; error: string };

async function sendEmail(params: {
  to: string;
  subject: string;
  template: ReactElement;
}): Promise<SendEmailResult> {
  try {
    const [html, text] = await Promise.all([
      render(params.template),
      render(params.template, { plainText: true }),
    ]);

    if (!resend) {
      console.info(
        `[email] RESEND_API_KEY no configurada. Email simulado -> to: ${params.to} | subject: "${params.subject}"`
      );
      return { success: true, id: null };
    }

    const { data, error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: params.to,
      subject: params.subject,
      html,
      text,
    });

    if (error) {
      console.error("[email] Error de Resend:", error);
      return { success: false, error: error.message };
    }
    return { success: true, id: data?.id ?? null };
  } catch (error) {
    console.error("[email] Error inesperado al enviar:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

// ==========================================
// EMAILS DE ÓRDENES
// ==========================================

async function loadOrderForEmail(
  orderId: string
): Promise<EmailOrderData | null> {
  const order = await db.order.findUnique({
    where: { id: orderId },
    include: {
      user: { select: { firstName: true, email: true } },
      items: true,
      payment: { select: { provider: true } },
    },
  });
  if (!order) return null;

  const store = await readStoreSettings();
  const isPickup = order.deliveryType === "PICKUP";
  const address =
    typeof order.shippingAddress === "object" && order.shippingAddress !== null
      ? (order.shippingAddress as Record<string, string | null | undefined>)
      : {};

  const shippingAddressLine = isPickup
    ? `Retiro en showroom${store.showroomAddress ? ` — ${store.showroomAddress}` : ""}`
    : [
        [address.street, address.number].filter(Boolean).join(" "),
        address.apartment,
        [address.city, address.state].filter(Boolean).join(", "),
        address.postalCode ? `CP ${address.postalCode}` : null,
      ]
        .filter(Boolean)
        .join(" — ");

  return {
    id: order.id,
    orderNumber: order.orderNumber,
    customerFirstName: order.user.firstName,
    customerEmail: order.user.email,
    isBankTransfer: order.payment?.provider === "BANK_TRANSFER",
    subtotal: Number(order.subtotal),
    discountAmount: Number(order.discountAmount),
    shippingCost: Number(order.shippingCost),
    totalAmount: Number(order.totalAmount),
    shippingAddressLine,
    carrier: order.carrier ?? null,
    trackingCode: order.trackingCode ?? null,
    shippingMethodName: order.shippingMethodName ?? null,
    isPickup,
    store: {
      supportEmail: store.supportEmail,
      whatsappNumber: store.whatsappNumber,
      bankName: store.bankName,
      bankAccountHolder: store.bankAccountHolder,
      bankCuit: store.bankCuit,
      bankCbu: store.bankCbu,
      bankAlias: store.bankAlias,
    },
    transferReservationHours: BANK_TRANSFER_TTL_HOURS,
    items: order.items.map((item) => ({
      productName: item.productName,
      sizeName: item.sizeName,
      colorName: item.colorName,
      quantity: item.quantity,
      unitPrice: Number(item.unitPrice),
      subtotal: Number(item.subtotal),
    })),
  };
}

async function sendOrderEmail(
  orderId: string,
  kind: string,
  build: (order: EmailOrderData) => { subject: string; template: ReactElement }
): Promise<SendEmailResult> {
  try {
    const order = await loadOrderForEmail(orderId);
    if (!order) return { success: false, error: "Orden no encontrada" };
    const { subject, template } = build(order);
    return sendEmail({ to: order.customerEmail, subject, template });
  } catch (error) {
    console.error(`[email:${kind}] Error:`, error);
    return { success: false, error: `No se pudo enviar el email (${kind})` };
  }
}

/** "Orden confirmada" (con datos bancarios si paga por transferencia). */
export function sendOrderConfirmedEmail(orderId: string) {
  return sendOrderEmail(orderId, "orden-confirmada", (order) => ({
    subject: orderConfirmedSubject(order),
    template: <OrderConfirmedEmail order={order} />,
  }));
}

/** "Pago acreditado" cuando la orden pasa a PAID. */
export function sendPaymentApprovedEmail(orderId: string) {
  return sendOrderEmail(orderId, "pago-acreditado", (order) => ({
    subject: paymentApprovedSubject(order),
    template: <PaymentApprovedEmail order={order} />,
  }));
}

/** "Tu paquete está en viaje" cuando la orden pasa a SHIPPED. */
export function sendOrderShippedEmail(orderId: string) {
  return sendOrderEmail(orderId, "despacho", (order) => ({
    subject: orderShippedSubject(order),
    template: <OrderShippedEmail order={order} />,
  }));
}

// ==========================================
// CUENTAS
// ==========================================

export function sendEmailVerificationEmail(params: {
  to: string;
  firstName: string;
  verifyUrl: string;
}) {
  return sendEmail({
    to: params.to,
    subject: "Confirmá tu email | OL. Indumenti",
    template: (
      <VerifyEmail firstName={params.firstName} verifyUrl={params.verifyUrl} />
    ),
  });
}

export function sendPasswordResetEmail(params: {
  to: string;
  firstName: string;
  resetUrl: string;
  isFirstPassword: boolean;
}) {
  const title = params.isFirstPassword
    ? "Creá tu contraseña"
    : "Restablecé tu contraseña";
  return sendEmail({
    to: params.to,
    subject: `${title} | OL. Indumenti`,
    template: (
      <PasswordResetEmail
        firstName={params.firstName}
        resetUrl={params.resetUrl}
        isFirstPassword={params.isFirstPassword}
      />
    ),
  });
}

export function sendAccountExistsEmail(params: {
  to: string;
  loginUrl: string;
  resetUrl: string;
}) {
  return sendEmail({
    to: params.to,
    subject: "Ya tenés una cuenta | OL. Indumenti",
    template: (
      <AccountExistsEmail loginUrl={params.loginUrl} resetUrl={params.resetUrl} />
    ),
  });
}

// ==========================================
// ALERTAS INTERNAS Y LEGALES
// ==========================================

/**
 * Alerta para el equipo. Siempre queda en los logs; además se envía por
 * email si ADMIN_NOTIFY_EMAIL está configurada.
 */
export async function sendAdminAlertEmail(
  subject: string,
  lines: string[]
): Promise<SendEmailResult> {
  console.warn(`[ALERTA ADMIN] ${subject}\n  - ${lines.join("\n  - ")}`);
  if (!ADMIN_NOTIFY_EMAIL) return { success: true, id: null };

  return sendEmail({
    to: ADMIN_NOTIFY_EMAIL,
    subject: `[OL. Admin] ${subject}`,
    template: <AdminAlertEmail subject={subject} lines={lines} />,
  });
}

/** Constancia del botón de arrepentimiento con su código (Res. 424/2020). */
export async function sendRevocationReceivedEmail(params: {
  to: string;
  code: string;
  orderNumber: number;
}): Promise<SendEmailResult> {
  const store = await readStoreSettings();
  return sendEmail({
    to: params.to,
    subject: `Solicitud de arrepentimiento ${params.code} | OL. Indumenti`,
    template: (
      <RevocationReceivedEmail
        code={params.code}
        orderNumber={params.orderNumber}
        supportEmail={store.supportEmail}
      />
    ),
  });
}

/** Bienvenida al newsletter con el link de baja. */
export function sendNewsletterWelcomeEmail(params: {
  to: string;
  unsubscribeUrl: string;
}) {
  return sendEmail({
    to: params.to,
    subject: "Bienvenida al archivo privado | OL. Indumenti",
    template: <NewsletterWelcomeEmail unsubscribeUrl={params.unsubscribeUrl} />,
  });
}
