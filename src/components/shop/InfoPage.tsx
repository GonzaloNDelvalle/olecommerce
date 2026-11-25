import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

/** Estructura común de las páginas informativas (contacto, preguntas, políticas). */
export function InfoPage({
  eyebrow,
  title,
  intro,
  children,
}: {
  eyebrow: string;
  title: string;
  intro?: string;
  children: ReactNode;
}) {
  return (
    <main className="bg-paper">
      <div className="px-4 pt-12 pb-20 sm:px-10 lg:pt-16 lg:pb-28">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-wider text-stone-600 uppercase transition-colors hover:text-ink"
        >
          <ArrowLeft className="size-3.5" aria-hidden="true" />
          Volver a la tienda
        </Link>
        <header className="mt-8 mb-10 flex flex-col gap-3 sm:mb-14">
          {eyebrow && <p className="eyebrow text-chocolate">{eyebrow}</p>}
          <h1 className="display text-[clamp(40px,8vw,136px)] break-words text-ink">{title}</h1>
          {intro && <p className="max-w-xl text-base leading-relaxed text-stone-700">{intro}</p>}
        </header>
        {children}
      </div>
    </main>
  );
}
