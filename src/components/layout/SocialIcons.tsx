import type { SVGProps } from "react";

/** Íconos de redes (lucide ya no incluye marcas). Heredan el color del texto. */
type IconProps = SVGProps<SVGSVGElement>;

const base = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true } as const;

export function InstagramIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="0.6" fill="currentColor" />
    </svg>
  );
}

export function WhatsAppIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M3.5 20.5l1.3-4.6A8.5 8.5 0 1 1 8.2 19.3L3.5 20.5z" />
      <path d="M9 8.5c0 3.3 3.2 6.5 6.5 6.5l1.2-1.4-2.1-1-.9.8a4.5 4.5 0 0 1-2.2-2.2l.8-.9-1-2.1L9 8.5z" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function TikTokIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M14 3v11.2a3.7 3.7 0 1 1-3.7-3.7" />
      <path d="M14 3c.3 2.4 1.9 4 4.5 4.2" />
    </svg>
  );
}

export function FacebookIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M14.5 21v-8h2.7l.5-3.2h-3.2V7.9c0-.9.4-1.7 1.8-1.7h1.5V3.4S16.5 3.2 15.3 3.2c-2.5 0-4.1 1.5-4.1 4.2v2.4H8.5V13h2.7v8h3.3z" />
    </svg>
  );
}
