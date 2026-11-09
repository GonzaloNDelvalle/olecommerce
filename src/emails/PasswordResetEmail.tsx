import { Text } from "react-email";
import { EmailLayout } from "@/emails/components/EmailLayout";
import { EmailButton } from "@/emails/components/EmailButton";
import { paragraphStyle, smallMutedStyle } from "@/emails/theme";

/**
 * Restablecer contraseña, o crearla por primera vez si la clienta había
 * comprado como invitada.
 */
export default function PasswordResetEmail({
  firstName,
  resetUrl,
  isFirstPassword,
}: {
  firstName: string;
  resetUrl: string;
  isFirstPassword: boolean;
}) {
  const title = isFirstPassword ? "Creá tu contraseña" : "Restablecé tu contraseña";
  return (
    <EmailLayout preview={title} eyebrow="Tu cuenta" title={title}>
      <Text style={paragraphStyle}>
        Hola {firstName},{" "}
        {isFirstPassword
          ? "ya hiciste compras con este email. Para activar tu cuenta y ver tu historial de pedidos, creá tu contraseña desde este link."
          : "recibimos un pedido para restablecer la contraseña de tu cuenta."}
      </Text>
      <EmailButton
        href={resetUrl}
        label={isFirstPassword ? "Crear contraseña" : "Elegir nueva contraseña"}
      />
      <Text style={{ ...smallMutedStyle, marginTop: "28px" }}>
        El link vence en 1 hora. Si no lo pediste, ignorá este mensaje: tu
        cuenta no cambia.
      </Text>
    </EmailLayout>
  );
}
PasswordResetEmail.PreviewProps = {
  firstName: "Ana",
  resetUrl: "https://example.com/restablecer-contrasena?token=demo",
  isFirstPassword: true,
};
