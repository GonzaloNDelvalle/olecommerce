import type { ReactNode } from "react";
import { Column, Row, Section, Text } from "react-email";
import { colors, eyebrowStyle, monoStack } from "@/emails/theme";

/** Recuadro beige para datos destacados (transferencia, seguimiento). */
export function InfoPanel({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <Section
      style={{
        marginTop: "32px",
        backgroundColor: colors.surface,
        border: `1px solid ${colors.line}`,
        padding: "24px",
      }}
    >
      <Text style={eyebrowStyle}>{title}</Text>
      {children}
    </Section>
  );
}

/** Fila etiqueta / valor dentro de un InfoPanel. */
export function InfoRow({
  label,
  children,
  mono = true,
}: {
  label: string;
  children: ReactNode;
  mono?: boolean;
}) {
  return (
    <Row>
      <Column
        style={{
          padding: "7px 0",
          fontSize: "11px",
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: colors.faint,
        }}
      >
        {label}
      </Column>
      <Column
        align="right"
        style={{
          padding: "7px 0",
          fontSize: "13px",
          color: colors.ink,
          fontFamily: mono ? monoStack : undefined,
        }}
      >
        {children}
      </Column>
    </Row>
  );
}
