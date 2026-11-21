"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { sendContactMessage } from "@/modules/contact/contact.actions";
import {
  FIELD_ERROR_CLASS,
  INPUT_CLASS,
  LABEL_CLASS,
  SUBMIT_CLASS,
  TEXTAREA_CLASS,
} from "@/components/ui/form";

const schema = z.object({
  name: z.string().trim().min(2, "Ingresá tu nombre."),
  email: z.string().trim().email("Ingresá un correo electrónico válido."),
  phone: z.string().optional(),
  orderNumber: z.string().optional(),
  message: z.string().trim().min(10, "Contanos un poco más (mínimo 10 caracteres)."),
  website: z.string().optional(),
});

type Values = z.infer<typeof schema>;

export function ContactForm() {
  const [done, setDone] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", phone: "", orderNumber: "", message: "", website: "" },
  });

  async function onSubmit(values: Values) {
    setServerError(null);
    const result = await sendContactMessage(values);
    if (!result.success) {
      setServerError(result.error);
      return;
    }
    setDone(result.message);
    reset();
  }

  if (done) {
    return (
      <div role="status" className="flex flex-col items-start gap-3 border border-stone-200 bg-cream p-8">
        <CheckCircle2 className="size-7 text-olive-deep" aria-hidden="true" />
        <p className="text-[17px] font-semibold text-ink">Mensaje enviado</p>
        <p className="text-[15px] leading-relaxed text-stone-700">{done}</p>
        <button type="button" onClick={() => setDone(null)} className="text-sm font-semibold text-ink underline underline-offset-4">
          Enviar otra consulta
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
      {/* Campo trampa anti-bots */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          No completar
          <input type="text" tabIndex={-1} autoComplete="off" {...register("website")} />
        </label>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="contact-name" className={LABEL_CLASS}>
            Nombre
          </label>
          <input
            id="contact-name"
            autoComplete="name"
            aria-invalid={Boolean(errors.name)}
            className={INPUT_CLASS}
            {...register("name")}
          />
          {errors.name && <p className={FIELD_ERROR_CLASS}>{errors.name.message}</p>}
        </div>
        <div>
          <label htmlFor="contact-email" className={LABEL_CLASS}>
            Email
          </label>
          <input
            id="contact-email"
            type="email"
            autoComplete="email"
            aria-invalid={Boolean(errors.email)}
            className={INPUT_CLASS}
            {...register("email")}
          />
          {errors.email && <p className={FIELD_ERROR_CLASS}>{errors.email.message}</p>}
        </div>
        <div>
          <label htmlFor="contact-phone" className={LABEL_CLASS}>
            Teléfono <span className="font-normal text-stone-500">(opcional)</span>
          </label>
          <input id="contact-phone" type="tel" autoComplete="tel" className={INPUT_CLASS} {...register("phone")} />
        </div>
        <div>
          <label htmlFor="contact-order" className={LABEL_CLASS}>
            N.º de pedido <span className="font-normal text-stone-500">(opcional)</span>
          </label>
          <input id="contact-order" inputMode="numeric" className={INPUT_CLASS} {...register("orderNumber")} />
        </div>
      </div>

      <div>
        <label htmlFor="contact-message" className={LABEL_CLASS}>
          Mensaje
        </label>
        <textarea
          id="contact-message"
          rows={6}
          aria-invalid={Boolean(errors.message)}
          className={TEXTAREA_CLASS}
          {...register("message")}
        />
        {errors.message && <p className={FIELD_ERROR_CLASS}>{errors.message.message}</p>}
      </div>

      {serverError && (
        <p role="alert" className="flex items-start gap-2 text-[14px] font-medium text-brick">
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {serverError}
        </p>
      )}

      <button type="submit" disabled={isSubmitting} className={SUBMIT_CLASS}>
        {isSubmitting && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
        Enviar mensaje
      </button>
    </form>
  );
}
