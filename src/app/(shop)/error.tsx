"use client";

import { useEffect } from "react";
import Link from "next/link";
import * as Sentry from "@sentry/nextjs";
import { buttonVariants } from "@/components/ui/button";

export default function ShopError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-[70svh] max-w-xl flex-col items-center justify-center gap-5 px-4 py-24 text-center">
      <p className="eyebrow text-chocolate">
        Algo salió mal
      </p>
      <h1 className="display text-[clamp(40px,6vw,64px)] text-ink">
        No pudimos cargar esta página
      </h1>
      <p className="max-w-md text-base leading-relaxed text-stone-700">
        Ya registramos el problema. Probá de nuevo en unos segundos.
      </p>
      <div className="mt-3 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className={buttonVariants({ size: "lg" })}
        >
          Reintentar
        </button>
        <Link
          href="/"
          className={buttonVariants({ variant: "secondary", size: "lg" })}
        >
          Ir al inicio
        </Link>
      </div>
      {error.digest && (
        <p className="font-mono text-xs text-stone-600">
          Ref: {error.digest}
        </p>
      )}
    </main>
  );
}
