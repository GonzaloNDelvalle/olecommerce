"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { approveManualOrderPayment } from "@/modules/admin/actions/admin-orders.actions";

interface ApproveManualPaymentButtonProps {
  orderId: string;
  orderNumber: number;
}

export function ApproveManualPaymentButton({
  orderId,
  orderNumber,
}: ApproveManualPaymentButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  function handleApprove() {
    const confirmed = window.confirm(
      `¿Confirmás acreditar manualmente el pago (Transferencia / Efectivo) de la Orden #${orderNumber}?\n\nLa orden pasará a estado PAID y se descontará el stock físico reservado.`
    );

    if (!confirmed) return;

    setErrorMessage(null);
    setSuccessMessage(null);

    startTransition(async () => {
      const result = await approveManualOrderPayment(orderId);
      if (!result.success) {
        setErrorMessage(result.error);
        return;
      }

      setSuccessMessage(result.message);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        type="button"
        onClick={handleApprove}
        disabled={isPending}
        className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-4 py-2.5 text-xs font-semibold tracking-wider text-white uppercase shadow-2xs transition-colors hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Acreditando Pago...
          </>
        ) : (
          <>
            <CheckCircle2 className="h-4 w-4" />
            Acreditar Pago Manual
          </>
        )}
      </button>

      {errorMessage && (
        <p className="flex items-center gap-1.5 text-xs font-medium text-red-600">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          {errorMessage}
        </p>
      )}

      {successMessage && (
        <p className="flex items-center gap-1.5 text-xs font-medium text-emerald-700">
          <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
          {successMessage}
        </p>
      )}
    </div>
  );
}
