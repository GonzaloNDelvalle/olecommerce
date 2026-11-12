import { Link, Text } from "react-email";
import { getAppUrl } from "@/lib/app-url";
import { EmailLayout } from "@/emails/components/EmailLayout";
import { EmailButton } from "@/emails/components/EmailButton";
import { colors, paragraphStyle, smallMutedStyle } from "@/emails/theme";

/** Bienvenida al newsletter, con link de baja (Ley 25.326). */
export default function NewsletterWelcomeEmail({
  unsubscribeUrl,
}: {
  unsubscribeUrl: string;
}) {
  return (
    <EmailLayout
      preview="Ya formás parte del archivo privado de OL."
      eyebrow="Newsletter"
      title="Bienvenida al archivo"
    >
      <Text style={paragraphStyle}>
        Gracias por suscribirte. Vas a recibir antes que nadie los nuevos
        lanzamientos de cápsula, las preventas exclusivas y las ediciones
        limitadas.
      </Text>
      <EmailButton href={`${getAppUrl()}/productos`} label="Ver la colección" />
      <Text style={{ ...smallMutedStyle, marginTop: "28px" }}>
        Recibís este email porque te suscribiste en nuestra tienda. Si no fuiste
        vos o no querés recibir más novedades, podés{" "}
        <Link href={unsubscribeUrl} style={{ color: colors.muted }}>
          darte de baja
        </Link>
        .
      </Text>
    </EmailLayout>
  );
}

NewsletterWelcomeEmail.PreviewProps = {
  unsubscribeUrl: "https://example.com/newsletter/baja?token=demo",
};
