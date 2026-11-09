import { Link, Text } from "react-email";
import { EmailLayout } from "@/emails/components/EmailLayout";
import { EmailButton } from "@/emails/components/EmailButton";
import { colors, paragraphStyle, smallMutedStyle } from "@/emails/theme";

/** Alguien intentó registrarse con un email que ya tiene cuenta. */
export default function AccountExistsEmail({
  loginUrl,
  resetUrl,
}: {
  loginUrl: string;
  resetUrl: string;
}) {
  return (
    <EmailLayout
      preview="Ya tenés una cuenta registrada con este email."
      eyebrow="Tu cuenta"
      title="Ya tenés una cuenta"
    >
      <Text style={paragraphStyle}>
        Alguien intentó crear una cuenta con este email, pero ya tenés una
        registrada. Si fuiste vos, iniciá sesión. Si no recordás tu contraseña,
        podés restablecerla.
      </Text>
      <EmailButton href={loginUrl} label="Iniciar sesión" />
      <Text style={{ ...smallMutedStyle, marginTop: "28px" }}>
        ¿Olvidaste tu contraseña?{" "}
        <Link href={resetUrl} style={{ color: colors.muted }}>
          Restablecerla
        </Link>
        . Si no fuiste vos, no hace falta que hagas nada.
      </Text>
    </EmailLayout>
  );
}
AccountExistsEmail.PreviewProps = {
  loginUrl: "https://example.com/login",
  resetUrl: "https://example.com/recuperar-contrasena",
};
