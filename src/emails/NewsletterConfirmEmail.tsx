import { Text } from "react-email";
import { EmailLayout } from "@/emails/components/EmailLayout";
import { EmailButton } from "@/emails/components/EmailButton";
import { paragraphStyle, smallMutedStyle } from "@/emails/theme";

/** Doble confirmación: la suscripción se activa recién al abrir este link. */
export default function NewsletterConfirmEmail({
  confirmUrl,
}: {
  confirmUrl: string;
}) {
  return (
    <EmailLayout
      preview="Confirmá tu suscripción al archivo privado de OL."
      eyebrow="Newsletter"
      title="Confirmá tu suscripción"
    >
      <Text style={paragraphStyle}>
        Recibimos una solicitud para suscribir este email a nuestro newsletter.
        Para activarla, confirmala con el botón de abajo.
      </Text>
      <EmailButton href={confirmUrl} label="Confirmar suscripción" />
      <Text style={{ ...smallMutedStyle, marginTop: "28px" }}>
        Si no fuiste vos, ignorá este mensaje: no vas a recibir nada más.
      </Text>
    </EmailLayout>
  );
}

NewsletterConfirmEmail.PreviewProps = {
  confirmUrl: "https://example.com/newsletter/confirmar?token=demo",
};
