import { Text } from "react-email";
import { getAppUrl } from "@/lib/app-url";
import { EmailLayout } from "@/emails/components/EmailLayout";
import { EmailButton } from "@/emails/components/EmailButton";
import { colors } from "@/emails/theme";

/** Alerta operativa para el equipo (pagos a revisar, reintegros, arrepentimientos). */
export default function AdminAlertEmail({
  subject,
  lines,
}: {
  subject: string;
  lines: string[];
}) {
  return (
    <EmailLayout preview={subject} eyebrow="Alerta operativa" title={subject}>
      <ul style={{ margin: 0, paddingLeft: "18px" }}>
        {lines.map((line, index) => (
          <li key={index}>
            <Text
              style={{ margin: "0 0 6px", fontSize: "13px", lineHeight: 1.7, color: colors.body }}
            >
              {line}
            </Text>
          </li>
        ))}
      </ul>
      <EmailButton href={`${getAppUrl()}/admin/ordenes`} label="Ir al panel" />
    </EmailLayout>
  );
}

AdminAlertEmail.PreviewProps = {
  subject: "Monto de pago no coincide — Orden #1042",
  lines: [
    "Pago MP 123456789: cobrado 100000 ARS, esperado 145500 ARS.",
    "La orden NO se marcó como pagada. Revisar en Mercado Pago antes de despachar.",
  ],
};
