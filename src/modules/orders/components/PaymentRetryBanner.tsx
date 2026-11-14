"use client";

import { useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { AlertCircle, Loader2 } from "lucide-react";
import { retryMercadoPagoPayment } from "@/modules/orders/payment.actions";

/**
 * Mercado Pago devuelve a `/checkout?status=rejected&orderId=...` cuando el
 * pago no se completa. La orden sigue reservada: se ofrece reintentar el pago
 * sin volver a cargar el carrito.
 */
export function PaymentRetryBanner() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const status = searchParams.get("status");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (status !== "rejected" || !orderId) return null;

  function handleRetry() {
    setError(null);
    startTransition(async () => {
      const result = await retryMercadoPagoPayment(orderId!);
      if (!result.success) {
        setError(result.error);
        return;
      }
      window.location.href = result.initPoint;
    });
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 pt-10 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 border border-amber-300 bg-amber-50/70 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3 text-sm font-normal text-amber-900">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-normal">El pago no se completó.</p>
            <p className="text-xs">
              Tu pedido sigue reservado por 24 horas. Podés intentarlo de nuevo
              con otra tarjeta o medio de pago.
            </p>
            {error && <p className="mt-1 text-xs text-brick">{error}</p>}
          </div>
        </div>
        <button
          type="button"
          onClick={handleRetry}
          disabled={isPending}
          className="inline-flex h-11 shrink-0 items-center justify-center gap-2 bg-ink px-6 text-xs tracking-[0.2em] text-white uppercase hover:bg-espresso disabled:bg-stone-400"
        >
          {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          Reintentar pago
        </button>
      </div>
    </div>
  );
}
