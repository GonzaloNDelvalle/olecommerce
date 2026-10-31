"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Truck, X, Loader2, AlertCircle, Check } from "lucide-react";
import { dispatchAdminOrder } from "@/modules/admin/actions/admin-orders.actions";

interface DispatchOrderModalButtonProps {
  orderId: string;
  orderNumber: number;
}

const CARRIER_OPTIONS = [
  "Andreani",
  "Correo Argentino",
  "Envío Propio",
] as const;

export function DispatchOrderModalButton({
  orderId,
  orderNumber,
}: DispatchOrderModalButtonProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [carrier, setCarrier] = useState<string>("Andreani");
  const [trackingCode, setTrackingCode] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleOpen() {
    setErrorMessage(null);
    setIsOpen(true);
  }

  function handleClose() {
    if (isPending) return;
    setIsOpen(false);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMessage(null);

    if (!trackingCode.trim()) {
      setErrorMessage("Ingresá el código de seguimiento del envío.");
      return;
    }

    startTransition(async () => {
      const result = await dispatchAdminOrder(orderId, {
        carrier,
        trackingCode: trackingCode.trim(),
      });

      if (!result.success) {
        setErrorMessage(result.error);
        return;
      }

      setIsOpen(false);
      router.refresh();
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className="inline-flex items-center gap-2 rounded-none bg-stone-900 px-4 py-2.5 text-xs font-semibold tracking-[0.16em] text-white uppercase transition-colors hover:bg-stone-800"
      >
        <Truck className="h-3.5 w-3.5" />
        <span>Despachar Pedido</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby={`dispatch-modal-title-${orderId}`}
          >
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={handleClose}
              className="fixed inset-0 bg-stone-950/50 backdrop-blur-xs"
              aria-hidden="true"
            />

            {/* Modal Minimalista con Bordes Rectos */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="relative z-10 w-full max-w-md rounded-none border border-stone-200 bg-white p-6 text-stone-900 shadow-2xl sm:p-8"
            >
              <div className="flex items-start justify-between border-b border-stone-200 pb-4">
                <div>
                  <p className="text-[10px] font-semibold tracking-[0.24em] text-[#5C4033] uppercase">
                    Logística &amp; Despacho • Orden #{orderNumber}
                  </p>
                  <h2
                    id={`dispatch-modal-title-${orderId}`}
                    className="mt-1 font-serif text-2xl font-normal tracking-[0.08em] text-stone-900 uppercase"
                  >
                    Despachar Pedido
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={handleClose}
                  aria-label="Cerrar modal"
                  className="rounded-none p-1 text-stone-400 transition-colors hover:text-stone-900"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="mt-6 space-y-6">
                {errorMessage && (
                  <div className="flex items-start gap-2 rounded-none border border-red-300 bg-red-50 p-3 text-xs text-red-700">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {/* Selector Rápido de Empresa de Envío */}
                <div>
                  <label className="block text-[10px] font-semibold tracking-[0.2em] text-stone-600 uppercase">
                    1. Empresa de Envío *
                  </label>
                  <div className="mt-2.5 grid grid-cols-1 gap-2 sm:grid-cols-3">
                    {CARRIER_OPTIONS.map((option) => {
                      const isSelected = carrier === option;
                      return (
                        <button
                          key={option}
                          type="button"
                          onClick={() => setCarrier(option)}
                          className={`flex items-center justify-between rounded-none border px-3 py-2.5 text-left text-[11px] tracking-[0.1em] uppercase transition-colors ${
                            isSelected
                              ? "border-stone-900 bg-stone-900 font-medium text-white"
                              : "border-stone-200 bg-white font-normal text-stone-700 hover:border-stone-900"
                          }`}
                        >
                          <span>{option}</span>
                          {isSelected && <Check className="h-3 w-3 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Código de Seguimiento */}
                <div>
                  <label
                    htmlFor={`tracking-code-${orderId}`}
                    className="block text-[10px] font-semibold tracking-[0.2em] text-stone-600 uppercase"
                  >
                    2. Código de Seguimiento *
                  </label>
                  <input
                    id={`tracking-code-${orderId}`}
                    type="text"
                    required
                    value={trackingCode}
                    onChange={(e) => setTrackingCode(e.target.value)}
                    placeholder="Ej: 360001294857120 o CD123456789AR"
                    className="mt-2 w-full rounded-none border border-stone-300 bg-stone-50 px-3.5 py-2.5 font-mono text-xs text-stone-900 placeholder:font-sans placeholder:text-stone-400 focus:border-stone-900 focus:bg-white focus:outline-none"
                  />
                  <p className="mt-1.5 text-[11px] font-light text-stone-500">
                    Al confirmar, la clienta recibirá automáticamente el correo{" "}
                    <strong className="font-medium text-stone-800">
                      &ldquo;Tu paquete está en viaje&rdquo;
                    </strong>{" "}
                    con este número de guía.
                  </p>
                </div>

                <div className="flex items-center justify-end gap-3 border-t border-stone-200 pt-5">
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={isPending}
                    className="rounded-none border border-stone-300 bg-white px-5 py-2.5 text-[11px] font-medium tracking-[0.18em] text-stone-700 uppercase transition-colors hover:border-stone-900 hover:text-stone-900 disabled:opacity-50"
                  >
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    disabled={isPending}
                    className="inline-flex items-center gap-2 rounded-none bg-stone-900 px-6 py-2.5 text-[11px] font-semibold tracking-[0.18em] text-white uppercase transition-colors hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isPending ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>Despachando...</span>
                      </>
                    ) : (
                      <>
                        <Truck className="h-3.5 w-3.5" />
                        <span>Confirmar Despacho</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
