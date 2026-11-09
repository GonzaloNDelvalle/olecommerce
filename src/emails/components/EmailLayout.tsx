import type { ReactNode } from "react";
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "react-email";
import { getAppUrl } from "@/lib/app-url";
import { colors, fontStack } from "@/emails/theme";

/**
 * Layout base: fondo blanco, logo "OL.", encabezado con volanta y pie con
 * el email de atención. React Email lo convierte en HTML con tablas y
 * estilos inline compatibles con Gmail, Outlook y Apple Mail.
 */
export function EmailLayout({
  preview,
  eyebrow,
  title,
  supportEmail,
  children,
}: {
  preview: string;
  eyebrow: string;
  title: string;
  supportEmail?: string | null;
  children: ReactNode;
}) {
  return (
    <Html lang="es">
      <Head>
        <title>{title}</title>
      </Head>
      <Preview>{preview}</Preview>
      <Body
        style={{
          margin: 0,
          padding: "48px 16px",
          backgroundColor: colors.white,
          fontFamily: fontStack,
          color: colors.ink,
        }}
      >
        <Container style={{ maxWidth: "560px", margin: "0 auto" }}>
          <Section
            style={{
              textAlign: "center",
              paddingBottom: "40px",
              borderBottom: `1px solid ${colors.line}`,
            }}
          >
            <Link
              href={getAppUrl()}
              style={{
                color: colors.ink,
                textDecoration: "none",
                fontSize: "26px",
                fontWeight: 700,
                letterSpacing: "0.22em",
              }}
            >
              OL.
            </Link>
          </Section>

          <Section style={{ textAlign: "center", padding: "40px 0 8px" }}>
            <Text
              style={{
                margin: 0,
                fontSize: "10px",
                fontWeight: 600,
                letterSpacing: "0.3em",
                textTransform: "uppercase",
                color: colors.accent,
              }}
            >
              {eyebrow}
            </Text>
            <Heading
              as="h1"
              style={{
                margin: "14px 0 0",
                fontSize: "24px",
                fontWeight: 300,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: colors.ink,
              }}
            >
              {title}
            </Heading>
          </Section>

          <Section
            style={{
              paddingTop: "24px",
              fontSize: "14px",
              fontWeight: 300,
              lineHeight: 1.7,
              color: colors.body,
            }}
          >
            {children}
          </Section>

          <Section
            style={{
              textAlign: "center",
              marginTop: "48px",
              borderTop: `1px solid ${colors.line}`,
            }}
          >
            <Text
              style={{
                margin: "24px 0 0",
                fontSize: "10px",
                letterSpacing: "0.24em",
                textTransform: "uppercase",
                color: colors.faint,
              }}
            >
              Neutral State • FW&apos;26
            </Text>
            <Text
              style={{
                margin: "10px 0 0",
                fontSize: "11px",
                fontWeight: 300,
                color: colors.faint,
              }}
            >
              OL Indumenti — República Argentina
              {supportEmail && (
                <>
                  <br />
                  ¿Consultas? Escribinos a{" "}
                  <Link
                    href={`mailto:${supportEmail}`}
                    style={{ color: colors.muted }}
                  >
                    {supportEmail}
                  </Link>
                </>
              )}
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
