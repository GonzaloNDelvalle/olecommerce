"use client";

import { useState, useTransition } from "react";
import { ChevronDown, Loader2, Store, Truck } from "lucide-react";
import {
  quoteShippingForProduct,
  type ProductShippingOption,
} from "@/modules/orders/product-shipping.actions";
import { QUOTE_UNAVAILABLE_MESSAGES } from "@/modules/orders/shipping-rates";
import { formatARS } from "@/lib/format";
import { cn } from "@/lib/cn";

/**
 * "Envío / Retiro": se ingresa el código postal y se ven las opciones con su
 * costo. Cotiza con la variante elegida (o la primera) y la cantidad.
 */
export function ShippingCalculator({
  variantId,
  quantity,
}: {
  variantId: string | null;
  quantity: number;
}) {
  const [open, setOpen] = useState(false);
  const [postalCode, setPostalCode] = useState("");
  const [options, setOptions] = useState<ProductShippingOption[] | null>(null);
  const [quotedFor, setQuotedFor] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!variantId) return;
    const code = postalCode.trim();
    if (!/^[A-Za-z]?\d{4}[A-Za-z]{0,3}$/.test(code)) {
      setError("Ingresá tu código postal (4 números).");
      return;
    }
    startTransition(async () => {
      const result = await quoteShippingForProduct({ postalCode: code, variantId, quantity });
      if (!result.success) {
        setError(result.error);
        setOptions(null);
        return;
      }
      setOptions(result.options);
      setQuotedFor(code);
    });
  }

  return (
    <div className="glass-light rounded-2xl">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls="shipping-calculator"
        className="flex min-h-14 w-full items-center justify-between gap-3 px-4 text-left text-[15px] font-semibold text-ink"
      >
        <span className="inline-flex items-center gap-2.5">
          <Truck className="size-5" strokeWidth={1.6} aria-hidden="true" />
          Envío / Retiro
        </span>
        <ChevronDown
          className={cn("size-5 transition-transform duration-200", open && "rotate-180")}
          strokeWidth={1.8}
          aria-hidden="true"
        />
      </button>

      {open && (
        <div id="shipping-calculator" className="flex flex-col gap-4 px-4 pb-4">
          <form onSubmit={submit} className="flex gap-2">
            <label htmlFor="shipping-postal-code" className="sr-only">
              Código postal
            </label>
            <input
              id="shipping-postal-code"
              inputMode="numeric"
              autoComplete="postal-code"
              maxLength={8}
              placeholder="Tu código postal"
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value)}
              className="h-12 min-w-0 flex-1 rounded-full border border-stone-300 bg-white px-4 text-base text-ink placeholder:text-stone-500 focus:border-ink focus:outline-none"
            />
            <button
              type="submit"
              disabled={isPending || !variantId}
              className="pressable inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-full bg-ink px-5 text-sm font-semibold text-paper hover:bg-espresso disabled:opacity-40"
            >
              {isPending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
              Calcular
            </button>
          </form>

          {error && (
            <p role="alert" className="text-[13px] font-semibold text-brick">
              {error}
            </p>
          )}

          {options && (
            <ul className="flex flex-col divide-y divide-stone-200/80" aria-live="polite">
              {options.map((option) => (
                <li key={option.id} className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0">
                  <div className="flex min-w-0 items-start gap-2.5">
                    {option.type === "PICKUP" ? (
                      <Store className="mt-0.5 size-4 shrink-0" strokeWidth={1.6} aria-hidden="true" />
                    ) : (
                      <Truck className="mt-0.5 size-4 shrink-0" strokeWidth={1.6} aria-hidden="true" />
                    )}
                    <div className="min-w-0">
                      <p className="text-[14px] font-semibold text-ink">{option.name}</p>
                      <p className="text-[13px] text-stone-700">
                        {option.quote.available
                          ? (option.estimatedDelivery ?? (quotedFor ? `CP ${quotedFor}` : ""))
                          : QUOTE_UNAVAILABLE_MESSAGES[option.quote.reason]}
                      </p>
                    </div>
                  </div>
                  {option.quote.available && (
                    <p className="tabular shrink-0 text-[14px] font-semibold text-ink">
                      {option.quote.cost === 0 ? "Gratis" : formatARS(option.quote.cost)}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
