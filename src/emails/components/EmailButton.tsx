import { Button, Section } from "react-email";
import { colors } from "@/emails/theme";

export function EmailButton({ href, label }: { href: string; label: string }) {
  return (
    <Section style={{ textAlign: "center", marginTop: "36px" }}>
      <Button
        href={href}
        style={{
          display: "inline-block",
          backgroundColor: colors.ink,
          color: colors.white,
          textDecoration: "none",
          fontSize: "11px",
          fontWeight: 600,
          letterSpacing: "0.28em",
          textTransform: "uppercase",
          padding: "16px 36px",
        }}
      >
        {label}
      </Button>
    </Section>
  );
}
