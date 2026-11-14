"use client";

import { Suspense, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { authErrorMessage } from "@/lib/auth-errors";
import {
  AUTH_BUTTON_CLASS,
  AuthAlert,
  AuthShell,
} from "@/modules/auth/components/AuthShell";

function VerifyEmailCard() {
  const router = useRouter();
  const token = useSearchParams().get("token") ?? "";
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // La verificación se dispara con un clic (no al abrir el link) para que los
  // escáneres de seguridad de los proveedores de correo no la activen solos.
  function handleConfirm() {
    setError(null);
    startTransition(async () => {
      const { error: verifyError } = await authClient.verifyEmail({
        query: { token },
      });
      if (verifyError) {
        setError(authErrorMessage(verifyError));
        return;
      }
      router.push("/mi-cuenta");
      router.refresh();
    });
  }

  if (!token) {
    return (
      <p className="text-center font-sans text-sm font-normal text-stone-600">
        El link está incompleto. Abrilo nuevamente desde el email que te
        enviamos.
      </p>
    );
  }

  return (
    <div className="text-center">
      {error && (
        <AuthAlert tone="error">
          {error}{" "}
          <Link href="/login" className="underline">
            Iniciá sesión
          </Link>{" "}
          para recibir un link nuevo.
        </AuthAlert>
      )}
      <p className="font-sans text-sm leading-relaxed font-normal text-stone-600">
        Tocá el botón para confirmar que este email es tuyo y activar tu
        cuenta.
      </p>
      <button
        type="button"
        onClick={handleConfirm}
        disabled={isPending}
        className={`mt-8 ${AUTH_BUTTON_CLASS}`}
      >
        {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
        {isPending ? "CONFIRMANDO..." : "CONFIRMAR MI EMAIL"}
      </button>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <AuthShell title="Confirmar email">
      <Suspense fallback={<div className="h-32 animate-pulse bg-cream" />}>
        <VerifyEmailCard />
      </Suspense>
    </AuthShell>
  );
}
