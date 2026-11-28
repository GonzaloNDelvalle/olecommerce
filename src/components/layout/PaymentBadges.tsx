import { Banknote } from "lucide-react";

/**
 * Medios de pago del pie, cada uno en su "tarjetita", en un gris apagado para
 * que no compitan con el resto. El efectivo / transferencia es solo el billete.
 */
const card =
  "inline-flex h-9 min-w-14 items-center justify-center rounded-md border border-cream/15 px-2.5 text-stone-400";

export function PaymentBadges() {
  return (
    <ul className="flex flex-wrap gap-2">
      <li className={card}>
        <span aria-hidden="true" className="text-[15px] font-extrabold tracking-tight italic">
          VISA
        </span>
        <span className="sr-only">Visa</span>
      </li>
      <li className={card}>
        <svg viewBox="0 0 36 22" className="h-5 w-8" fill="currentColor" aria-hidden="true">
          <circle cx="13" cy="11" r="10" />
          <circle cx="23" cy="11" r="10" fillOpacity="0.55" />
        </svg>
        <span className="sr-only">Mastercard</span>
      </li>
      <li className={card}>
        <span className="text-[12px] leading-none font-bold tracking-tight">mercado pago</span>
      </li>
      <li className={card}>
        <Banknote className="size-5" strokeWidth={1.8} aria-hidden="true" />
        <span className="sr-only">Efectivo o transferencia</span>
      </li>
    </ul>
  );
}
