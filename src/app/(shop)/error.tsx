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
      <p className="text-[11px] tracking-[0.28em] text-[#5C4033] uppercase">
        Algo salió mal
      </p>
      <h1 className="mt-4 font-serif text-3xl tracking-[0.08em] text-stone-900 uppercase">
        No pudimos cargar esta página
      </h1>
      <p className="mt-3 text-sm font-light text-stone-500">
        Ya registramos el problema. Probá de nuevo en unos segundos.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="inline-flex h-12 items-center bg-stone-900 px-8 text-xs tracking-[0.2em] text-white uppercase hover:bg-stone-800"
        >
          Reintentar
        </button>
        <Link
          href="/"
          className="inline-flex h-12 items-center border border-stone-300 px-8 text-xs tracking-[0.2em] text-stone-900 uppercase hover:border-stone-900"
        >
          Ir al inicio
        </Link>
      </div>
      {error.digest && (
        <p className="mt-6 font-mono text-[10px] text-stone-400">
          Ref: {error.digest}
        </p>
      )}
    </main>
  );
}
