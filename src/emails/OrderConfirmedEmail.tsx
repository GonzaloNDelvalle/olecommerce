import { Link, Text } from "react-email";
import { getAppUrl } from "@/lib/app-url";
import { EmailLayout } from "@/emails/components/EmailLayout";
import { EmailButton } from "@/emails/components/EmailButton";
import { InfoPanel, InfoRow } from "@/emails/components/InfoPanel";
import { DeliveryAddress, OrderSummary } from "@/emails/components/OrderSummary";
import { colors, formatArs, paragraphStyle, strongStyle } from "@/emails/theme";
import { PREVIEW_ORDER, type EmailOrderData } from "@/emails/types";

function BankTransferDetails({ order }: { order: EmailOrderData }) {
  const bank = order.store;
  return (
    <InfoPanel title="Datos para la transferencia">
      <Text style={{ margin: "10px 0 12px", fontSize: "13px", color: colors.body }}>
        Transferí <strong style={strongStyle}>{formatArs(order.totalAmount)}</strong> e
        indicá el número de orden{" "}
        <strong style={strongStyle}>#{order.orderNumber}</strong> como referencia.
      </Text>
      {bank.bankName && <InfoRow label="Banco" mono={false}>{bank.bankName}</InfoRow>}
      <InfoRow label="Titular" mono={false}>{bank.bankAccountHolder}</InfoRow>
      {bank.bankCuit && <InfoRow label="CUIT">{bank.bankCuit}</InfoRow>}
      <InfoRow label="CBU">{bank.bankCbu}</InfoRow>
      <InfoRow label="Alias">{bank.bankAlias}</InfoRow>
      <Text style={{ margin: "16px 0 0", fontSize: "12px", color: colors.muted }}>
        Enviá el comprobante a{" "}
        <Link href={`mailto:${bank.supportEmail}`} style={{ color: colors.ink }}>
          {bank.supportEmail}
        </Link>
        {bank.whatsappNumber ? ` o por WhatsApp al ${bank.whatsappNumber}` : ""}.
        Reservamos tus prendas por {order.transferReservationHours} hs.
      </Text>
    </InfoPanel>
  );
}

export function orderConfirmedSubject(order: EmailOrderData) {
  return `Orden #${order.orderNumber} confirmada — OL.`;
}

export default function OrderConfirmedEmail({ order }: { order: EmailOrderData }) {
  return (
    <EmailLayout
      preview={
        order.isBankTransfer
          ? `Tu pedido #${order.orderNumber} está reservado. Te dejamos los datos para transferir.`
          : `Recibimos tu pedido #${order.orderNumber}.`
      }
      eyebrow={`Orden #${order.orderNumber}`}
      title="Orden Confirmada"
      supportEmail={order.store.supportEmail}
    >
      <Text style={paragraphStyle}>
        Hola {order.customerFirstName}, recibimos tu pedido{" "}
        <strong style={strongStyle}>#{order.orderNumber}</strong>.{" "}
        {order.isBankTransfer
          ? "Para confirmarlo, solo resta realizar la transferencia bancaria con los datos que encontrás más abajo."
          : "Apenas Mercado Pago confirme el pago, comenzaremos a preparar tus prendas."}
      </Text>
      {order.isBankTransfer && <BankTransferDetails order={order} />}
      <OrderSummary order={order} />
      <DeliveryAddress order={order} />
      <EmailButton href={`${getAppUrl()}/mi-cuenta`} label="Ver mi pedido" />
    </EmailLayout>
  );
}

OrderConfirmedEmail.PreviewProps = { order: PREVIEW_ORDER };
