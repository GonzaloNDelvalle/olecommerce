import { Text } from "react-email";
import { EmailLayout } from "@/emails/components/EmailLayout";
import {
  colors,
  monoStack,
  paragraphStyle,
  strongStyle,
} from "@/emails/theme";

/** Constancia del botón de arrepentimiento con su código (Res. 424/2020). */
export default function RevocationReceivedEmail({
  code,
  orderNumber,
  supportEmail,
}: {
  code: string;
  orderNumber: number;
  supportEmail: string;
}) {
  return (
    <EmailLayout
      preview={`Tu código de solicitud es ${code}`}
      eyebrow="Botón de arrepentimiento"
      title="Solicitud recibida"
      supportEmail={supportEmail}
    >
      <Text style={paragraphStyle}>
        Recibimos tu solicitud de arrepentimiento para la orden{" "}
        <strong style={strongStyle}>#{orderNumber}</strong>.
      </Text>
      <Text
        style={{
          margin: "0 0 8px",
          fontSize: "11px",
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          color: colors.faint,
        }}
      >
        Código de identificación
      </Text>
      <Text
        style={{
          margin: "0 0 24px",
          fontSize: "22px",
          letterSpacing: "0.12em",
          color: colors.ink,
          fontFamily: monoStack,
        }}
      >
        {code}
      </Text>
      <Text style={{ ...paragraphStyle, fontSize: "13px" }}>
        Guardá este código. Te vamos a escribir para coordinar la devolución de
        la prenda y el reintegro, sin costo para vos.
      </Text>
    </EmailLayout>
  );
}

RevocationReceivedEmail.PreviewProps = {
  code: "ARR-7K3P9QXM",
  orderNumber: 1042,
  supportEmail: "hola@olindumenti.com",
};
