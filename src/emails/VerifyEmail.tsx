import { Text } from "react-email";
import { EmailLayout } from "@/emails/components/EmailLayout";
import { EmailButton } from "@/emails/components/EmailButton";
import { paragraphStyle, smallMutedStyle } from "@/emails/theme";

/** Confirmación de email al registrarse. */
export default function VerifyEmail({
  firstName,
  verifyUrl,
}: {
  firstName: string;
  verifyUrl: string;
}) {
  return (
    <EmailLayout
      preview="Confirmá tu email para activar tu cuenta."
      eyebrow="Tu cuenta"
      title="Confirmá tu email"
    >
      <Text style={paragraphStyle}>
        Hola {firstName}, para activar tu cuenta confirmá que este correo es tuyo.
      </Text>
      <EmailButton href={verifyUrl} label="Confirmar mi email" />
      <Text style={{ ...smallMutedStyle, marginTop: "28px" }}>
        El link vence en 24 horas. Si no creaste una cuenta en OL., ignorá este
        mensaje: no se activará ninguna contraseña.
      </Text>
    </EmailLayout>
  );
}
VerifyEmail.PreviewProps = {
  firstName: "Ana",
  verifyUrl: "https://example.com/verificar-email?token=demo",
};
