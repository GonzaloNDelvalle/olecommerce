import { Banknote } from "lucide-react";
import { PAYMENT_LOGOS } from "@/components/layout/payment-logos";

/**
 * Medios de pago del pie, cada uno en su "tarjetita", en un gris apagado para
 * que no compitan con el resto. El efectivo / transferencia es solo el billete.
 */
const card =
  "inline-flex h-9 min-w-14 items-center justify-center rounded-md border border-cream/15 px-2.5 text-stone-400";

export function PaymentBadges() {
  return (
    <ul className="flex flex-wrap gap-2">
      {PAYMENT_LOGOS.map((logo) => (
        <li key={logo.label} className={card}>
          <svg viewBox={logo.viewBox} className={logo.className} fill="currentColor" role="img" aria-label={logo.label}>
            <path d={logo.path} />
          </svg>
        </li>
      ))}
      <li className={card}>
        <Banknote className="size-5" strokeWidth={1.8} aria-hidden="true" />
        <span className="sr-only">Efectivo o transferencia</span>
      </li>
    </ul>
  );
}
