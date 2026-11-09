import { Column, Row, Section, Text } from "react-email";
import { colors, formatArs } from "@/emails/theme";
import type { EmailOrderData } from "@/emails/types";

const cellBorder = `1px solid ${colors.lineSoft}`;

function SummaryRow({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <Row>
      <Column
        style={{
          padding: "6px 0",
          fontSize: "12px",
          color: highlight ? colors.ink : colors.muted,
          ...(highlight
            ? {
                fontWeight: 600,
                letterSpacing: "0.1em",
                textTransform: "uppercase" as const,
              }
            : {}),
        }}
      >
        {label}
      </Column>
      <Column
        align="right"
        style={{
          padding: "6px 0",
          fontSize: highlight ? "16px" : "12px",
          color: colors.ink,
          fontWeight: highlight ? 600 : 400,
        }}
      >
        {value}
      </Column>
    </Row>
  );
}

/** Detalle de prendas y totales de la orden. */
export function OrderSummary({ order }: { order: EmailOrderData }) {
  return (
    <>
      <Section style={{ marginTop: "32px" }}>
        <Text
          style={{
            margin: 0,
            paddingBottom: "8px",
            borderBottom: `1px solid ${colors.line}`,
            fontSize: "10px",
            fontWeight: 600,
            letterSpacing: "0.24em",
            textTransform: "uppercase",
            color: colors.ink,
          }}
        >
          Detalle de tu compra
        </Text>
        {order.items.map((item, index) => (
          <Row key={`${item.productName}-${index}`}>
            <Column style={{ padding: "14px 0", borderBottom: cellBorder }}>
              <Text
                style={{
                  margin: 0,
                  fontSize: "13px",
                  fontWeight: 500,
                  color: colors.ink,
                }}
              >
                {item.productName}
              </Text>
              <Text
                style={{ margin: "3px 0 0", fontSize: "11px", color: colors.faint }}
              >
                {item.colorName} · Talle {item.sizeName} · x{item.quantity}
              </Text>
            </Column>
            <Column
              align="right"
              style={{
                padding: "14px 0",
                borderBottom: cellBorder,
                fontSize: "13px",
                color: colors.ink,
                whiteSpace: "nowrap",
                verticalAlign: "top",
              }}
            >
              {formatArs(item.subtotal)}
            </Column>
          </Row>
        ))}
      </Section>

      <Section style={{ marginTop: "16px" }}>
        <SummaryRow label="Subtotal" value={formatArs(order.subtotal)} />
        {order.discountAmount > 0 && (
          <SummaryRow
            label="Descuento por Transferencia"
            value={`-${formatArs(order.discountAmount)}`}
          />
        )}
        <SummaryRow
          label={
            order.shippingMethodName
              ? `Envío (${order.shippingMethodName})`
              : "Envío"
          }
          value={order.shippingCost > 0 ? formatArs(order.shippingCost) : "Sin cargo"}
        />
        <Row>
          <Column style={{ paddingTop: "8px", borderBottom: `1px solid ${colors.line}` }} />
        </Row>
        <SummaryRow label="Total" value={formatArs(order.totalAmount)} highlight />
      </Section>
    </>
  );
}

/** Bloque "Envío a" / "Entrega" con la dirección o el punto de retiro. */
export function DeliveryAddress({
  order,
  label,
}: {
  order: EmailOrderData;
  label?: string;
}) {
  return (
    <Text style={{ margin: "28px 0 0", fontSize: "12px", color: colors.muted }}>
      <span
        style={{
          fontSize: "10px",
          fontWeight: 600,
          letterSpacing: "0.24em",
          textTransform: "uppercase",
          color: colors.ink,
        }}
      >
        {label ?? (order.isPickup ? "Entrega" : "Envío a")}
      </span>
      <br />
      {order.shippingAddressLine}
    </Text>
  );
}
