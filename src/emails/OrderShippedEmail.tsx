import { Link, Text } from "react-email";
import { getAppUrl } from "@/lib/app-url";
import { EmailLayout } from "@/emails/components/EmailLayout";
import { EmailButton } from "@/emails/components/EmailButton";
import { InfoPanel, InfoRow } from "@/emails/components/InfoPanel";
import { DeliveryAddress, OrderSummary } from "@/emails/components/OrderSummary";
import { colors, paragraphStyle, strongStyle } from "@/emails/theme";
import { PREVIEW_ORDER, type EmailOrderData } from "@/emails/types";

export function carrierTrackingUrl(
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
  return `${getAppUrl()}/mi-cuenta`;
}

export function orderShippedSubject(order: EmailOrderData) {
  return `Tu paquete está en viaje — Orden #${order.orderNumber} | OL.`;
}

export default function OrderShippedEmail({ order }: { order: EmailOrderData }) {
  const carrierName = order.carrier || "Correo Logístico";
  const trackingCode = order.trackingCode || "En asignación";
  const trackingUrl = carrierTrackingUrl(order.carrier, order.trackingCode);

  return (
    <EmailLayout
      preview={`Tu pedido #${order.orderNumber} fue despachado por ${carrierName} (Seguimiento: ${trackingCode}).`}
      eyebrow={`Orden #${order.orderNumber} • Despachada`}
      title="Tu paquete está en viaje"
      supportEmail={order.store.supportEmail}
    >
      <Text style={paragraphStyle}>
        Hola {order.customerFirstName}, tu pedido{" "}
        <strong style={strongStyle}>#{order.orderNumber}</strong> ya fue
        despachado desde nuestro atelier y se encuentra en viaje hacia tu
        domicilio.
      </Text>

      <InfoPanel title="Datos de seguimiento">
        <InfoRow label="Empresa de envío" mono={false}>
          {carrierName}
        </InfoRow>
        <InfoRow label="Código de seguimiento">
          <Link href={trackingUrl} style={{ color: colors.ink, textDecoration: "underline" }}>
            {trackingCode}
          </Link>
        </InfoRow>
      </InfoPanel>

      <DeliveryAddress order={order} label="Dirección de entrega" />
      <OrderSummary order={order} />
      <EmailButton href={trackingUrl} label="Rastrear mi paquete" />
    </EmailLayout>
  );
}

OrderShippedEmail.PreviewProps = { order: PREVIEW_ORDER };
