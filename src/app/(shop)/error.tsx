"use client";

import { useEffect } from "react";
import Link from "next/link";
import * as Sentry from "@sentry/nextjs";

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
    <main className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-4 py-24 text-center">
      <p className="text-xs tracking-[0.16em] text-chocolate uppercase">
        Algo salió mal
      </p>
      <h1 className="mt-4 font-serif text-3xl tracking-[0.08em] text-ink uppercase">
        No pudimos cargar esta página
      </h1>
      <p className="mt-3 text-sm font-normal text-stone-500">
        Ya registramos el problema. Probá de nuevo en unos segundos.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="inline-flex h-12 items-center bg-ink px-8 text-xs tracking-[0.2em] text-white uppercase hover:bg-espresso"
        >
          Reintentar
        </button>
        <Link
          href="/"
          className="inline-flex h-12 items-center border border-stone-300 px-8 text-xs tracking-[0.2em] text-ink uppercase hover:border-ink"
        >
          Ir al inicio
        </Link>
      </div>
      {error.digest && (
        <p className="mt-6 font-mono text-xs text-stone-500">
          Ref: {error.digest}
        </p>
      )}
    </main>
  );
}
