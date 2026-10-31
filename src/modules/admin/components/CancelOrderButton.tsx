"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { XCircle, Loader2, AlertCircle } from "lucide-react";
import { cancelAdminOrder } from "@/modules/admin/actions/admin-orders.actions";

interface CancelOrderButtonProps {
  orderId: string;
  orderNumber: number;
}

export function CancelOrderButton({
  orderId,
  orderNumber,
}: CancelOrderButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function handleCancelOrder() {
    const confirmed = window.confirm(
      `¿Confirmás cancelar la Orden #${orderNumber}?\n\nLa orden pasará a estado CANCELLED y todas las unidades reservadas se restituirán automáticamente al stock disponible.`
    );

    if (!confirmed) return;

    setErrorMessage(null);

    startTransition(async () => {
      const result = await cancelAdminOrder(orderId);
      if (!result.success) {
        setErrorMessage(result.error);
        return;
      }

      router.refresh();
    });
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      <button
        type="button"
        onClick={handleCancelOrder}
        disabled={isPending}
        className="inline-flex items-center gap-1.5 rounded-none border border-red-300 bg-white px-3.5 py-2 text-xs font-semibold tracking-[0.14em] text-red-700 uppercase transition-colors hover:border-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? (
          <>
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            <span>Cancelando...</span>
          </>
        ) : (
          <>
            <XCircle className="h-3.5 w-3.5" />
            <span>Cancelar Orden</span>
          </>
        )}
      </button>

      {errorMessage && (
        <p className="flex items-center gap-1 text-[11px] font-medium text-red-600">
          <AlertCircle className="h-3 w-3 shrink-0" />
          <span>{errorMessage}</span>
        </p>
      )}
    </div>
  );
}
