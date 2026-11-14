"use client";

import { Suspense, useState, useTransition } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { unsubscribeFromNewsletter } from "@/modules/newsletter/newsletter.actions";
import {
  AUTH_BUTTON_CLASS,
  AuthAlert,
  AuthShell,
} from "@/modules/auth/components/AuthShell";

function UnsubscribeCard() {
  const token = useSearchParams().get("token") ?? "";
  const [result, setResult] = useState<
    { tone: "success" | "error"; text: string } | null
  >(null);
  const [isPending, startTransition] = useTransition();

  // La baja se confirma con un clic (no al abrir el link) para que los
  // escáneres de correo no den de baja a nadie por accidente.
  function handleConfirm() {
    startTransition(async () => {
      const response = await unsubscribeFromNewsletter(token);
      setResult(
        response.success
          ? { tone: "success", text: response.message }
          : { tone: "error", text: response.error }
      );
    });
  }

  if (result) {
    return (
      <>
        <AuthAlert tone={result.tone}>{result.text}</AuthAlert>
        <Link href="/" className={AUTH_BUTTON_CLASS}>
          Volver a la tienda
        </Link>
      </>
    );
  }

  return (
    <div className="text-center">
      <p className="font-sans text-sm leading-relaxed font-normal text-stone-600">
        ¿Querés dejar de recibir nuestro newsletter? Podés volver a suscribirte
        cuando quieras desde la portada.
      </p>
      <button
        type="button"
        onClick={handleConfirm}
        disabled={isPending || !token}
        className={`mt-8 ${AUTH_BUTTON_CLASS}`}
      >
        {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
        CONFIRMAR BAJA
      </button>
    </div>
  );
}

export default function NewsletterUnsubscribePage() {
  return (
    <AuthShell title="Newsletter">
      <Suspense fallback={<div className="h-32 animate-pulse bg-cream" />}>
        <UnsubscribeCard />
      </Suspense>
    </AuthShell>
  );
}
