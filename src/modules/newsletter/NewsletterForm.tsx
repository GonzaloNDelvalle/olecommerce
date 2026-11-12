"use client";

import { useState, useTransition } from "react";
import { ArrowRight, Check, Loader2 } from "lucide-react";
import { subscribeToNewsletter } from "@/modules/newsletter/newsletter.actions";

/** Formulario de suscripción del banner oscuro de la portada. */
export function NewsletterForm({ buttonLabel }: { buttonLabel: string }) {
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [result, setResult] = useState<
    { tone: "success" | "error"; text: string } | null
  >(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setResult(null);
    startTransition(async () => {
      const response = await subscribeToNewsletter({ email, website });
      if (response.success) {
        setResult({ tone: "success", text: response.message });
        setEmail("");
      } else {
        setResult({ tone: "error", text: response.error });
      }
    });
  }

  if (result?.tone === "success") {
    return (
      <p
        role="status"
        className="mx-auto mt-10 flex max-w-md items-start justify-center gap-2 text-xs leading-relaxed text-stone-200 sm:text-sm"
      >
        <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#D2B48C]" />
        {result.text}
      </p>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="mx-auto mt-10 max-w-md"
    >
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-end">
        <div className="w-full flex-1">
          <label htmlFor="newsletter-email" className="sr-only">
            Correo electrónico
          </label>
          <input
            id="newsletter-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Ingresá tu correo electrónico..."
            aria-invalid={result?.tone === "error"}
            aria-describedby="newsletter-feedback newsletter-legal"
            className="w-full border-0 border-b border-stone-100/40 bg-transparent px-1 py-3 text-xs tracking-wider text-stone-100 placeholder:text-stone-400 focus:border-[#D2B48C] focus:outline-none sm:text-sm"
          />
          {/* Campo trampa para bots: oculto para personas y lectores de pantalla */}
          <input
            type="text"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            className="absolute left-[-9999px] h-0 w-0 opacity-0"
          />
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="inline-flex shrink-0 items-center gap-2 border-b border-[#D2B48C] px-2 py-3 text-xs font-semibold tracking-[0.25em] text-stone-100 uppercase transition-colors hover:border-stone-100 hover:text-[#D2B48C] disabled:opacity-60"
        >
          <span>{isPending ? "Enviando..." : buttonLabel}</span>
          {isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <ArrowRight className="h-3.5 w-3.5" />
          )}
        </button>
      </div>

      <p id="newsletter-feedback" role="alert" className="mt-3 min-h-4 text-xs text-red-300">
        {result?.tone === "error" ? result.text : ""}
      </p>
      <p id="newsletter-legal" className="mt-1 text-[10px] leading-relaxed text-stone-400">
        Al suscribirte aceptás recibir novedades por email. Podés darte de baja
        cuando quieras desde el link de cada envío.
      </p>
    </form>
  );
}
