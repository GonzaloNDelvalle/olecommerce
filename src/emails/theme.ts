import type { CSSProperties } from "react";

/** Paleta y estilos compartidos de los emails (mismos tonos que la tienda). */
export const colors = {
  ink: "#1c1917",
  body: "#57534e",
  muted: "#78716c",
  faint: "#a8a29e",
  line: "#e7e5e4",
  lineSoft: "#f5f5f4",
  surface: "#fafaf9",
  accent: "#5C4033",
  white: "#ffffff",
};

export const fontStack =
  "'Helvetica Neue', Helvetica, Arial, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
export const monoStack = "'SFMono-Regular', Menlo, Consolas, monospace";

export const eyebrowStyle: CSSProperties = {
  margin: 0,
  fontSize: "10px",
  fontWeight: 600,
  letterSpacing: "0.24em",
  textTransform: "uppercase",
  color: colors.accent,
};

export const paragraphStyle: CSSProperties = {
  margin: "0 0 16px",
  fontSize: "14px",
  fontWeight: 300,
  lineHeight: 1.7,
  color: colors.body,
};

export const smallMutedStyle: CSSProperties = {
  margin: 0,
  fontSize: "12px",
  lineHeight: 1.7,
  color: colors.faint,
};

export const strongStyle: CSSProperties = {
  fontWeight: 600,
  color: colors.ink,
};

const arsFormatter = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

export function formatArs(value: number): string {
  return arsFormatter.format(value);
}
