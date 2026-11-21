import { Text } from "react-email";
import { EmailLayout } from "@/emails/components/EmailLayout";
import { colors, paragraphStyle } from "@/emails/theme";

/** Mensaje enviado desde el formulario de contacto de la tienda (para el equipo). */
export default function ContactMessageEmail({
  name,
  email,
  phone,
  orderNumber,
  message,
}: {
  name: string;
  email: string;
  phone: string | null;
  orderNumber: string | null;
  message: string;
}) {
  return (
    <EmailLayout preview={`Consulta de ${name}`} eyebrow="Contacto" title={`Consulta de ${name}`}>
      <Text style={{ ...paragraphStyle, margin: "0 0 4px" }}>
        <strong>Email:</strong> {email}
      </Text>
      {phone && (
        <Text style={{ ...paragraphStyle, margin: "0 0 4px" }}>
          <strong>Teléfono:</strong> {phone}
        </Text>
      )}
      {orderNumber && (
        <Text style={{ ...paragraphStyle, margin: "0 0 4px" }}>
          <strong>Pedido:</strong> #{orderNumber}
        </Text>
      )}
      <Text
        style={{
          ...paragraphStyle,
          marginTop: "18px",
          paddingTop: "18px",
          borderTop: `1px solid ${colors.line}`,
          whiteSpace: "pre-wrap",
        }}
      >
        {message}
      </Text>
    </EmailLayout>
  );
}

ContactMessageEmail.PreviewProps = {
  name: "Lucía Pérez",
  email: "lucia@example.com",
  phone: "+54 9 11 1234-5678",
  orderNumber: "1042",
  message: "Hola! Quería consultar por el talle del blazer.\nGracias!",
};
