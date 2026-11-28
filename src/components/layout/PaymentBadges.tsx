import { Banknote } from "lucide-react";

/**
 * Medios de pago del pie, cada uno en su "tarjetita". Son representaciones
 * simples; si se quieren los logos oficiales, se reemplazan acá.
 */
const card =
  "inline-flex h-9 min-w-14 items-center justify-center gap-1.5 rounded-md bg-white px-2.5 text-ink";

export function PaymentBadges() {
  return (
    <ul className="flex flex-wrap gap-2">
      <li className={card}>
        <span aria-hidden="true" className="text-[15px] font-extrabold tracking-tight text-[#1434cb] italic">
          VISA
        </span>
        <span className="sr-only">Visa</span>
      </li>
      <li className={card}>
        <svg viewBox="0 0 36 22" className="h-5 w-8" aria-hidden="true">
          <circle cx="13" cy="11" r="10" fill="#eb001b" />
          <circle cx="23" cy="11" r="10" fill="#f79e1b" fillOpacity="0.9" />
        </svg>
        <span className="sr-only">Mastercard</span>
      </li>
      <li className={card}>
        <span className="text-[12px] leading-none font-bold tracking-tight text-[#009ee3]">mercado pago</span>
      </li>
      <li className={card}>
        <Banknote className="size-[18px] text-olive" strokeWidth={1.8} aria-hidden="true" />
        <span className="text-[11px] leading-none font-semibold">Efectivo / Transferencia</span>
      </li>
    </ul>
  );
}
