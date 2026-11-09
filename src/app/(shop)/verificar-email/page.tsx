"use client";

import { Suspense, useState, useTransition } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { verifyEmailAction } from "@/modules/auth/actions/auth.actions";

type VerifyState =
  | { kind: "idle" }
  | { kind: "success" }
  | { kind: "error"; message: string };

function VerifyEmailCard() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [state, setState] = useState<VerifyState>({ kind: "idle" });
  const [isPending, startTransition] = useTransition();

  function handleConfirm() {
    startTransition(async () => {
      const result = await verifyEmailAction(token);
      setState(
        result.success
          ? { kind: "success" }
          : { kind: "error", message: result.error }
      );
    });
  }

  if (!token) {
    return (
      <p className="font-sans text-sm font-light text-stone-600">
        El link de verificación está incompleto. Abrilo nuevamente desde el
        email que te enviamos.
      </p>
    );
  }

  if (state.kind === "success") {
    return (
      <>
        <CheckCircle2
          className="mx-auto h-8 w-8 text-stone-900"
          strokeWidth={1.25}
        />
        <p className="mt-6 font-sans text-sm leading-relaxed font-light text-stone-600">
          Tu email quedó confirmado y tu cuenta está activa.
        </p>
        <Link
          href="/login"
          className="mt-8 inline-flex h-12 w-full items-center justify-center rounded-none bg-stone-900 px-6 font-sans text-xs tracking-[0.2em] text-white uppercase transition-colors hover:bg-stone-800"
        >
          Iniciar sesión
        </Link>
      </>
    );
  }

  return (
    <>
      {state.kind === "error" && (
        <div className="mb-6 flex items-start gap-2.5 rounded-none border border-red-200 bg-red-50/70 p-4 text-left font-sans text-xs font-light text-red-800">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-700" />
          <p>{state.message}</p>
        </div>
      )}
      <p className="font-sans text-sm leading-relaxed font-light text-stone-600">
        Tocá el botón para confirmar que este email es tuyo y activar tu
        cuenta.
      </p>
      <button
        type="button"
        onClick={handleConfirm}
        disabled={isPending}
        className="mt-8 flex h-12 w-full items-center justify-center gap-2 rounded-none bg-stone-900 px-6 font-sans text-xs tracking-[0.2em] text-white uppercase transition-colors hover:bg-stone-800 disabled:cursor-not-allowed disabled:bg-stone-400"
      >
        {isPending ? (
          <>
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            CONFIRMANDO...
          </>
        ) : (
          "CONFIRMAR MI EMAIL"
        )}
      </button>
    </>
  );
}

export default function VerifyEmailPage() {
  return (
    <main className="min-h-[calc(100vh-5rem)] bg-[#FAF9F6]">
      <div className="mx-auto max-w-md px-4 py-20">
        <header className="mb-10 text-center">
          <p className="font-serif text-3xl tracking-tight text-stone-900">
            OL.
          </p>
          <h1 className="mt-4 font-serif text-3xl tracking-wide text-stone-900 uppercase">
            CONFIRMAR EMAIL
          </h1>
        </header>

        <div className="rounded-none border border-stone-200 bg-white p-8 text-center sm:p-10">
          <Suspense
            fallback={<div className="h-32 animate-pulse bg-stone-100" />}
          >
            <VerifyEmailCard />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
