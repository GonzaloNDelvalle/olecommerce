import { Resend } from "resend";
import { db } from "@/lib/db";
import { BANK_ACCOUNT_INFO } from "@/lib/bank-account";

/**
 * Motor de emails transaccionales de OL Indumenti (Resend).
 *
 * Variables de entorno:
 * - RESEND_API_KEY: API key de Resend. Si no está definida, los emails se loguean en consola (modo desarrollo).
 * - EMAIL_FROM: remitente verificado en Resend (ej. "OL. <pedidos@tudominio.com>").
 *   Por defecto usa el remitente de pruebas de Resend (`onboarding@resend.dev`).
 * - NEXT_PUBLIC_APP_URL: URL base de la tienda para los enlaces del email.
 */

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM || "OL. Indumenti <onboarding@resend.dev>";
const APP_URL = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");

const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

const arsFormatter = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

// ==========================================
// TIPOS
// ==========================================

interface EmailOrderItem {
  productName: string;
  sizeName: string;
  colorName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

interface EmailOrderData {
  id: string;
  orderNumber: number;
  customerFirstName: string;
  customerEmail: string;
  isBankTransfer: boolean;
  subtotal: number;
  discountAmount: number;
  shippingCost: number;
  totalAmount: number;
  items: EmailOrderItem[];
  shippingAddressLine: string;
  carrier: string | null;
  trackingCode: string | null;
}

export type SendEmailResult =
  | { success: true; id: string | null }
  | { success: false; error: string };

// ==========================================
// HELPERS DE MAQUETACIÓN
// ==========================================

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const FONT_STACK =
  "'Helvetica Neue', Helvetica, Arial, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

/**
 * Layout base minimalista: fondo blanco, tipografía sans-serif fina y logo "OL.".
 * Maquetado con tablas + estilos inline para máxima compatibilidad (Gmail, Outlook, Apple Mail).
 */
function renderEmailLayout(params: {
  preheader: string;
  eyebrow: string;
  title: string;
  bodyHtml: string;
}): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(params.title)}</title>
</head>
<body style="margin:0;padding:0;background-color:#ffffff;font-family:${FONT_STACK};color:#1c1917;-webkit-font-smoothing:antialiased;">
  <span style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(params.preheader)}</span>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#ffffff;">
    <tr>
      <td align="center" style="padding:48px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;">
          <!-- Logo -->
          <tr>
            <td align="center" style="padding-bottom:40px;border-bottom:1px solid #e7e5e4;">
              <a href="${APP_URL}" style="text-decoration:none;color:#1c1917;font-size:26px;font-weight:700;letter-spacing:0.22em;">OL.</a>
            </td>
          </tr>

          <!-- Encabezado -->
          <tr>
            <td align="center" style="padding:40px 0 8px;">
              <p style="margin:0;font-size:10px;font-weight:600;letter-spacing:0.3em;text-transform:uppercase;color:#5C4033;">${escapeHtml(params.eyebrow)}</p>
              <h1 style="margin:14px 0 0;font-size:24px;font-weight:300;letter-spacing:0.08em;text-transform:uppercase;color:#1c1917;">${escapeHtml(params.title)}</h1>
            </td>
          </tr>

          <!-- Contenido -->
          <tr>
            <td style="padding:24px 0 0;font-size:14px;font-weight:300;line-height:1.7;color:#57534e;">
              ${params.bodyHtml}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top:48px;margin-top:48px;border-top:1px solid #e7e5e4;">
              <p style="margin:24px 0 0;font-size:10px;letter-spacing:0.24em;text-transform:uppercase;color:#a8a29e;">Neutral State • FW'26</p>
              <p style="margin:10px 0 0;font-size:11px;font-weight:300;color:#a8a29e;">
                OL Indumenti — República Argentina<br />
                ¿Consultas? Escribinos a <a href="mailto:${BANK_ACCOUNT_INFO.supportEmail}" style="color:#78716c;">${BANK_ACCOUNT_INFO.supportEmail}</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function renderItemsTable(order: EmailOrderData): string {
  const rows = order.items
    .map(
      (item) => `
      <tr>
        <td style="padding:14px 0;border-bottom:1px solid #f5f5f4;">
          <p style="margin:0;font-size:13px;font-weight:500;color:#1c1917;">${escapeHtml(item.productName)}</p>
          <p style="margin:3px 0 0;font-size:11px;color:#a8a29e;">${escapeHtml(item.colorName)} · Talle ${escapeHtml(item.sizeName)} · x${item.quantity}</p>
        </td>
        <td align="right" style="padding:14px 0;border-bottom:1px solid #f5f5f4;font-size:13px;color:#1c1917;white-space:nowrap;vertical-align:top;">
          ${arsFormatter.format(item.subtotal)}
        </td>
      </tr>`
    )
    .join("");

  const summaryRow = (label: string, value: string, highlight = false) => `
      <tr>
        <td style="padding:6px 0;font-size:12px;color:${highlight ? "#1c1917" : "#78716c"};${highlight ? "font-weight:600;letter-spacing:0.1em;text-transform:uppercase;" : ""}">${label}</td>
        <td align="right" style="padding:6px 0;font-size:${highlight ? "16px" : "12px"};color:#1c1917;${highlight ? "font-weight:600;" : ""}">${value}</td>
      </tr>`;

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:32px;">
      <tr>
        <td colspan="2" style="padding-bottom:8px;border-bottom:1px solid #e7e5e4;font-size:10px;font-weight:600;letter-spacing:0.24em;text-transform:uppercase;color:#1c1917;">
          Detalle de tu compra
        </td>
      </tr>
      ${rows}
    </table>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:16px;">
      ${summaryRow("Subtotal", arsFormatter.format(order.subtotal))}
      ${
        order.discountAmount > 0
          ? summaryRow(
              "Descuento por Transferencia",
              `-${arsFormatter.format(order.discountAmount)}`
            )
          : ""
      }
      ${summaryRow(
        "Envío",
        order.shippingCost > 0 ? arsFormatter.format(order.shippingCost) : "Bonificado"
      )}
      <tr><td colspan="2" style="padding-top:8px;border-bottom:1px solid #e7e5e4;"></td></tr>
      ${summaryRow("Total", arsFormatter.format(order.totalAmount), true)}
    </table>`;
}

function renderBankTransferBlock(order: EmailOrderData): string {
  const row = (label: string, value: string) => `
    <tr>
      <td style="padding:7px 0;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#a8a29e;">${label}</td>
      <td align="right" style="padding:7px 0;font-size:13px;color:#1c1917;font-family:'SFMono-Regular',Menlo,Consolas,monospace;">${value}</td>
    </tr>`;

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:36px;background-color:#fafaf9;border:1px solid #e7e5e4;">
      <tr>
        <td style="padding:24px 24px 8px;">
          <p style="margin:0;font-size:10px;font-weight:600;letter-spacing:0.24em;text-transform:uppercase;color:#5C4033;">Datos para la transferencia</p>
          <p style="margin:10px 0 0;font-size:13px;font-weight:300;color:#57534e;">
            Transferí <strong style="font-weight:600;color:#1c1917;">${arsFormatter.format(order.totalAmount)}</strong>
            e indicá el número de orden <strong style="font-weight:600;color:#1c1917;">#${order.orderNumber}</strong> como referencia.
          </p>
        </td>
      </tr>
      <tr>
        <td style="padding:8px 24px 20px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            ${row("Banco", escapeHtml(BANK_ACCOUNT_INFO.bankName))}
            ${row("Titular", escapeHtml(BANK_ACCOUNT_INFO.accountHolder))}
            ${row("CUIT", BANK_ACCOUNT_INFO.cuit)}
            ${row("CBU", BANK_ACCOUNT_INFO.cbu)}
            ${row("Alias", BANK_ACCOUNT_INFO.alias)}
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding:0 24px 24px;font-size:12px;font-weight:300;color:#78716c;">
          Enviá el comprobante a <a href="mailto:${BANK_ACCOUNT_INFO.supportEmail}" style="color:#1c1917;">${BANK_ACCOUNT_INFO.supportEmail}</a>
          o por WhatsApp al ${BANK_ACCOUNT_INFO.whatsappNumber}. Reservamos tus prendas por 48 hs.
        </td>
      </tr>
    </table>`;
}

function renderButton(href: string, label: string): string {
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:36px;">
      <tr>
        <td align="center">
          <a href="${href}" style="display:inline-block;background-color:#1c1917;color:#ffffff;text-decoration:none;font-size:11px;font-weight:600;letter-spacing:0.28em;text-transform:uppercase;padding:16px 36px;">${label}</a>
        </td>
      </tr>
    </table>`;
}

// ==========================================
// PLANTILLAS
// ==========================================

export function renderOrderConfirmedEmail(order: EmailOrderData): {
  subject: string;
  html: string;
} {
  const intro = order.isBankTransfer
    ? `Hola ${escapeHtml(order.customerFirstName)}, recibimos tu pedido <strong style="font-weight:600;color:#1c1917;">#${order.orderNumber}</strong>. Para confirmarlo, solo resta realizar la transferencia bancaria con los datos que encontrás más abajo.`
    : `Hola ${escapeHtml(order.customerFirstName)}, recibimos tu pedido <strong style="font-weight:600;color:#1c1917;">#${order.orderNumber}</strong>. Apenas Mercado Pago confirme el pago, comenzaremos a preparar tus prendas.`;

  const bodyHtml = `
    <p style="margin:0;">${intro}</p>
    ${order.isBankTransfer ? renderBankTransferBlock(order) : ""}
    ${renderItemsTable(order)}
    <p style="margin:28px 0 0;font-size:12px;color:#78716c;">
      <span style="font-size:10px;font-weight:600;letter-spacing:0.24em;text-transform:uppercase;color:#1c1917;">Envío a</span><br />
      ${escapeHtml(order.shippingAddressLine)}
    </p>
    ${renderButton(`${APP_URL}/mi-cuenta`, "Ver mi pedido")}`;

  return {
    subject: `Orden #${order.orderNumber} confirmada — OL.`,
    html: renderEmailLayout({
      preheader: order.isBankTransfer
        ? `Tu pedido #${order.orderNumber} está reservado. Te dejamos los datos para transferir.`
        : `Recibimos tu pedido #${order.orderNumber}.`,
      eyebrow: `Orden #${order.orderNumber}`,
      title: "Orden Confirmada",
      bodyHtml,
    }),
  };
}

export function renderPaymentApprovedEmail(order: EmailOrderData): {
  subject: string;
  html: string;
} {
  const bodyHtml = `
    <p style="margin:0;">
      Hola ${escapeHtml(order.customerFirstName)}, confirmamos la acreditación del pago de tu pedido
      <strong style="font-weight:600;color:#1c1917;">#${order.orderNumber}</strong>.
      Ya estamos preparando tus prendas con el cuidado que merecen; te avisaremos cuando el envío esté en camino.
    </p>
    ${renderItemsTable(order)}
    <p style="margin:28px 0 0;font-size:12px;color:#78716c;">
      <span style="font-size:10px;font-weight:600;letter-spacing:0.24em;text-transform:uppercase;color:#1c1917;">Envío a</span><br />
      ${escapeHtml(order.shippingAddressLine)}
    </p>
    ${renderButton(`${APP_URL}/mi-cuenta`, "Seguir mi pedido")}`;

  return {
    subject: `Pago acreditado — Orden #${order.orderNumber} | OL.`,
    html: renderEmailLayout({
      preheader: `El pago de tu orden #${order.orderNumber} fue acreditado.`,
      eyebrow: `Orden #${order.orderNumber}`,
      title: "Pago Acreditado",
      bodyHtml,
    }),
  };
}

function resolveCarrierTrackingUrl(
  carrier: string | null,
  trackingCode: string | null
): string {
  const normalized = (carrier || "").toLowerCase();
  const code = (trackingCode || "").trim();

  if (normalized.includes("andreani")) {
    return code
      ? `https://www.andreani.com/#!/informacionEnvio/${encodeURIComponent(code)}`
      : "https://www.andreani.com/";
  }

  if (normalized.includes("correo argentino")) {
    return "https://www.correoargentino.com.ar/formularios/e-commerce";
  }

  return `${APP_URL}/mi-cuenta`;
}

export function renderOrderShippedEmail(order: EmailOrderData): {
  subject: string;
  html: string;
} {
  const carrierName = order.carrier || "Correo Logístico";
  const trackingCode = order.trackingCode || "En asignación";
  const trackingUrl = resolveCarrierTrackingUrl(order.carrier, order.trackingCode);

  const trackingBlock = `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:32px;background-color:#fafaf9;border:1px solid #e7e5e4;">
      <tr>
        <td style="padding:24px;">
          <p style="margin:0;font-size:10px;font-weight:600;letter-spacing:0.24em;text-transform:uppercase;color:#5C4033;">Datos de Seguimiento</p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:12px;">
            <tr>
              <td style="padding:6px 0;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#a8a29e;">Empresa de Envío</td>
              <td align="right" style="padding:6px 0;font-size:13px;font-weight:500;color:#1c1917;">${escapeHtml(carrierName)}</td>
            </tr>
            <tr>
              <td style="padding:6px 0;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#a8a29e;">Código de Seguimiento</td>
              <td align="right" style="padding:6px 0;font-size:13px;font-weight:600;color:#1c1917;font-family:'SFMono-Regular',Menlo,Consolas,monospace;">
                <a href="${trackingUrl}" style="color:#1c1917;text-decoration:underline;">${escapeHtml(trackingCode)}</a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>`;

  const bodyHtml = `
    <p style="margin:0;">
      Hola ${escapeHtml(order.customerFirstName)}, tu pedido
      <strong style="font-weight:600;color:#1c1917;">#${order.orderNumber}</strong>
      ya fue despachado desde nuestro atelier y se encuentra en viaje hacia tu domicilio.
    </p>
    ${trackingBlock}
    <p style="margin:28px 0 0;font-size:12px;color:#78716c;">
      <span style="font-size:10px;font-weight:600;letter-spacing:0.24em;text-transform:uppercase;color:#1c1917;">Dirección de Entrega</span><br />
      ${escapeHtml(order.shippingAddressLine)}
    </p>
    ${renderItemsTable(order)}
    ${renderButton(trackingUrl, "Rastrear mi paquete")}`;

  return {
    subject: `Tu paquete está en viaje — Orden #${order.orderNumber} | OL.`,
    html: renderEmailLayout({
      preheader: `Tu pedido #${order.orderNumber} fue despachado por ${carrierName} (Seguimiento: ${trackingCode}).`,
      eyebrow: `Orden #${order.orderNumber} • Despachada`,
      title: "Tu paquete está en viaje",
      bodyHtml,
    }),
  };
}

// ==========================================
// ENVÍO
// ==========================================

async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
}): Promise<SendEmailResult> {
  if (!resend) {
    console.info(
      `[email] RESEND_API_KEY no configurada. Email simulado -> to: ${params.to} | subject: "${params.subject}"`
    );
    return { success: true, id: null };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: params.to,
      subject: params.subject,
      html: params.html,
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

/**
 * Carga la orden completa desde Prisma y la normaliza para las plantillas.
 */
async function loadOrderForEmail(orderId: string): Promise<EmailOrderData | null> {
  const order = await db.order.findUnique({
    where: { id: orderId },
    include: {
      user: { select: { firstName: true, email: true } },
      items: true,
      payment: { select: { provider: true } },
    },
  });

  if (!order) return null;

  const address =
    typeof order.shippingAddress === "object" && order.shippingAddress !== null
      ? (order.shippingAddress as Record<string, string | null | undefined>)
      : {};

  const shippingAddressLine = [
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
    carrier: order.carrier ?? order.shippingCarrier ?? null,
    trackingCode: order.trackingCode ?? order.trackingNumber ?? null,
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

/**
 * Envía el email "Orden Confirmada" (con datos de CBU si el pago es por transferencia).
 * Nunca lanza excepciones: un fallo de email no debe romper el checkout.
 */
export async function sendOrderConfirmedEmail(
  orderId: string
): Promise<SendEmailResult> {
  try {
    const order = await loadOrderForEmail(orderId);
    if (!order) return { success: false, error: "Orden no encontrada" };

    const { subject, html } = renderOrderConfirmedEmail(order);
    return sendEmail({ to: order.customerEmail, subject, html });
  } catch (error) {
    console.error("[sendOrderConfirmedEmail] Error:", error);
    return { success: false, error: "No se pudo enviar el email de confirmación" };
  }
}

/**
 * Envía el email "Pago Acreditado" cuando la orden pasa a estado PAID.
 * Nunca lanza excepciones: un fallo de email no debe revertir la acreditación.
 */
export async function sendPaymentApprovedEmail(
  orderId: string
): Promise<SendEmailResult> {
  try {
    const order = await loadOrderForEmail(orderId);
    if (!order) return { success: false, error: "Orden no encontrada" };

    const { subject, html } = renderPaymentApprovedEmail(order);
    return sendEmail({ to: order.customerEmail, subject, html });
  } catch (error) {
    console.error("[sendPaymentApprovedEmail] Error:", error);
    return { success: false, error: "No se pudo enviar el email de pago acreditado" };
  }
}

/**
 * Envía el email "Tu paquete está en viaje" cuando la orden pasa a estado SHIPPED.
 * Nunca lanza excepciones: un fallo de email no debe revertir el despacho.
 */
export async function sendOrderShippedEmail(
  orderId: string
): Promise<SendEmailResult> {
  try {
    const order = await loadOrderForEmail(orderId);
    if (!order) return { success: false, error: "Orden no encontrada" };

    const { subject, html } = renderOrderShippedEmail(order);
    return sendEmail({ to: order.customerEmail, subject, html });
  } catch (error) {
    console.error("[sendOrderShippedEmail] Error:", error);
    return {
      success: false,
      error: "No se pudo enviar el email de despacho de pedido",
    };
  }
}
