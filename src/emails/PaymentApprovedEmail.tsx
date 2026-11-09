import { Text } from "react-email";
import { getAppUrl } from "@/lib/app-url";
import { EmailLayout } from "@/emails/components/EmailLayout";
import { EmailButton } from "@/emails/components/EmailButton";
import { DeliveryAddress, OrderSummary } from "@/emails/components/OrderSummary";
import { paragraphStyle, strongStyle } from "@/emails/theme";
import { PREVIEW_ORDER, type EmailOrderData } from "@/emails/types";

export function paymentApprovedSubject(order: EmailOrderData) {
  return `Pago acreditado — Orden #${order.orderNumber} | OL.`;
}

export default function PaymentApprovedEmail({ order }: { order: EmailOrderData }) {
  return (
    <EmailLayout
      preview={`El pago de tu orden #${order.orderNumber} fue acreditado.`}
      eyebrow={`Orden #${order.orderNumber}`}
      title="Pago Acreditado"
      supportEmail={order.store.supportEmail}
    >
      <Text style={paragraphStyle}>
        Hola {order.customerFirstName}, confirmamos la acreditación del pago de
        tu pedido <strong style={strongStyle}>#{order.orderNumber}</strong>. Ya
        estamos preparando tus prendas con el cuidado que merecen;{" "}
        {order.isPickup
          ? "te avisamos cuando estén listas para retirar."
          : "te avisaremos cuando el envío esté en camino."}
      </Text>
      <OrderSummary order={order} />
      <DeliveryAddress order={order} />
      <EmailButton href={`${getAppUrl()}/mi-cuenta`} label="Seguir mi pedido" />
    </EmailLayout>
  );
}

PaymentApprovedEmail.PreviewProps = {
  order: { ...PREVIEW_ORDER, isBankTransfer: false, discountAmount: 0, totalAmount: 169500 },
};
