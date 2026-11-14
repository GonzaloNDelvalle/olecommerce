"use client";

import { useState, useTransition } from "react";
import { ArrowRight, Check, Loader2 } from "lucide-react";
import { subscribeToNewsletter } from "@/modules/newsletter/newsletter.actions";

/** Formulario de suscripción del bloque chocolate de la portada. */
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
        className="flex max-w-md items-start gap-2 text-[15px] leading-relaxed text-cream"
      >
        <Check className="mt-0.5 size-5 shrink-0 text-sand" aria-hidden="true" />
        {result.text}
      </p>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="w-full max-w-lg"
    >
      <label htmlFor="newsletter-email" className="mb-2.5 block text-[13px] font-semibold text-cream">
        Tu email
      </label>
      <div className="flex flex-col gap-2.5 sm:flex-row">
        <div className="w-full flex-1">
          <input
            id="newsletter-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="nombre@email.com"
            aria-invalid={result?.tone === "error"}
            aria-describedby="newsletter-feedback newsletter-legal"
            className="h-[52px] w-full rounded-full border border-sand bg-transparent px-5 text-base text-paper placeholder:text-stone-300 focus:border-paper focus:outline-none"
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
          className="pressable inline-flex h-[52px] shrink-0 items-center justify-center gap-2 rounded-full bg-paper px-7 text-[15px] font-semibold text-ink transition-colors hover:bg-cream disabled:opacity-60"
        >
          <span>{isPending ? "Enviando…" : buttonLabel}</span>
          {isPending ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <ArrowRight className="size-4" aria-hidden="true" />
          )}
        </button>
      </div>

      <p id="newsletter-feedback" role="alert" className="mt-3 min-h-5 text-[13px] font-medium text-[#F3C9BF]">
        {result?.tone === "error" ? result.text : ""}
      </p>
      <p id="newsletter-legal" className="mt-1 text-xs leading-relaxed text-cream/80">
        Al suscribirte aceptás recibir novedades por email. Podés darte de baja
        cuando quieras desde el link de cada envío.
      </p>
    </form>
  );
}
