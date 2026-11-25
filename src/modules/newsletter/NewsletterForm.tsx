"use client";

import { useState, useTransition } from "react";
import { ArrowRight, Check, Loader2 } from "lucide-react";
import { subscribeToNewsletter } from "@/modules/newsletter/newsletter.actions";

/** Formulario de suscripción del bloque claro de la portada. */
export function NewsletterForm({ buttonLabel, legalText }: { buttonLabel: string; legalText: string }) {
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
        className="flex max-w-md items-start gap-2 text-[15px] leading-relaxed text-chocolate"
      >
        <Check className="mt-0.5 size-5 shrink-0 text-chocolate" aria-hidden="true" />
        {result.text}
      </p>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="w-full max-w-xl"
    >
      <label htmlFor="newsletter-email" className="mb-2.5 block text-[13px] font-semibold text-chocolate">
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
            className="h-[52px] w-full rounded-full border border-chocolate/40 bg-white px-5 text-base text-ink placeholder:text-stone-500 focus:border-chocolate focus:outline-none"
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
          className="pressable inline-flex h-[52px] shrink-0 items-center justify-center gap-2 rounded-full bg-chocolate px-7 text-[15px] font-semibold text-paper transition-colors hover:bg-ink disabled:opacity-60"
        >
          <span>{isPending ? "Enviando…" : buttonLabel}</span>
          {isPending ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <ArrowRight className="size-4" aria-hidden="true" />
          )}
        </button>
      </div>

      <p id="newsletter-feedback" role="alert" className="mt-3 min-h-5 text-[13px] font-medium text-brick">
        {result?.tone === "error" ? result.text : ""}
      </p>
      <p id="newsletter-legal" className="mt-1 text-xs leading-relaxed text-stone-600">
        {legalText}
      </p>
    </form>
  );
}
