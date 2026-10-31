"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { submitRevocationRequestAction } from "@/modules/legal/actions/revocation.actions";

const revocationSchema = z.object({
  email: z.string().email("Ingresá un correo electrónico válido."),
  orderNumber: z
    .string()
    .min(1, "Ingresá un número de pedido.")
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
      message: "El número de pedido debe ser numérico y mayor a 0.",
    }),
  reason: z.string().optional(),
});

type RevocationFormValues = z.infer<typeof revocationSchema>;

const INPUT_CLASS =
  "w-full bg-transparent border-0 border-b border-stone-300 focus:border-stone-900 rounded-none px-0 py-3 font-sans text-sm font-light text-stone-900 placeholder:text-stone-400 focus:outline-none transition-colors";
const LABEL_CLASS =
  "block font-sans text-[10px] uppercase tracking-[0.2em] text-stone-600";

export function RevocationForm() {
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<RevocationFormValues>({
    resolver: zodResolver(revocationSchema),
    defaultValues: {
      email: "",
      orderNumber: "",
      reason: "",
    },
  });

  async function onSubmit(values: RevocationFormValues) {
    setServerError(null);
    setSuccessMessage(null);

    const res = await submitRevocationRequestAction({
      email: values.email,
      orderNumber: Number(values.orderNumber),
      reason: values.reason,
    });

    if (!res.success) {
      setServerError(res.error || "Ocurrió un error al procesar tu solicitud.");
      return;
    }

    setSuccessMessage(
      res.message || "Tu solicitud de arrepentimiento fue enviada con éxito."
    );
    reset();
  }

  if (successMessage) {
    return (
      <div className="rounded-none border border-stone-200 bg-white p-8 text-center sm:p-12">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-none bg-stone-100 text-stone-900">
          <CheckCircle2 className="h-6 w-6 text-emerald-700" />
        </div>
        <h3 className="mt-4 font-serif text-2xl uppercase tracking-wide text-stone-900">
          Solicitud Registrada
        </h3>
        <p className="mt-3 font-sans text-xs font-light leading-relaxed text-stone-600">
          {successMessage}
        </p>
        <p className="mt-4 font-sans text-[11px] text-stone-400">
          Revisá tu casilla de correo electrónico (incluso la carpeta de spam o promociones).
        </p>
        <div className="mt-8 border-t border-stone-100 pt-6">
          <button
            type="button"
            onClick={() => setSuccessMessage(null)}
            className="font-sans text-[11px] tracking-[0.2em] uppercase text-stone-900 underline underline-offset-4 hover:text-stone-600"
          >
            Enviar otra solicitud
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-none border border-stone-200 bg-white p-8 sm:p-10">
      {serverError && (
        <div className="mb-6 flex items-start gap-2.5 rounded-none border border-red-200 bg-red-50/70 p-4 font-sans text-xs font-light text-red-800">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-700" />
          <p>{serverError}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
        <div>
          <label htmlFor="email" className={LABEL_CLASS}>
            Correo Electrónico de la Compra *
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="tu@correo.com"
            {...register("email")}
            className={INPUT_CLASS}
          />
          {errors.email && (
            <p className="mt-1.5 font-sans text-[11px] font-light text-red-600">
              {errors.email.message}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="orderNumber" className={LABEL_CLASS}>
            Número de Pedido u Orden *
          </label>
          <input
            id="orderNumber"
            type="number"
            placeholder="Ej: 1042"
            {...register("orderNumber")}
            className={INPUT_CLASS}
          />
          {errors.orderNumber && (
            <p className="mt-1.5 font-sans text-[11px] font-light text-red-600">
              {errors.orderNumber.message}
            </p>
          )}
          <p className="mt-1 font-sans text-[11px] font-light text-stone-400">
            Podés encontrarlo en el asunto de tu correo de confirmación de compra.
          </p>
        </div>

        <div>
          <label htmlFor="reason" className={LABEL_CLASS}>
            Motivo de Revocación (Opcional)
          </label>
          <textarea
            id="reason"
            rows={3}
            placeholder="Comentario adicional o motivo de la devolución..."
            {...register("reason")}
            className="w-full bg-transparent border-0 border-b border-stone-300 focus:border-stone-900 rounded-none px-0 py-3 font-sans text-sm font-light text-stone-900 placeholder:text-stone-400 focus:outline-none transition-colors resize-none"
          />
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-none bg-stone-900 px-6 font-sans text-xs tracking-[0.2em] text-white uppercase transition-colors hover:bg-stone-800 disabled:cursor-not-allowed disabled:bg-stone-400"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ENVIANDO SOLICITUD...
              </>
            ) : (
              "CONFIRMAR REVOCACIÓN DE COMPRA"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
