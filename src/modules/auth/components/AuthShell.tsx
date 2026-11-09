import type { ReactNode } from "react";

export const AUTH_INPUT_CLASS =
  "w-full bg-transparent border-0 border-b border-stone-300 focus:border-stone-900 rounded-none px-0 py-3 font-sans text-sm font-light text-stone-900 placeholder:text-stone-400 focus:outline-none transition-colors";
export const AUTH_LABEL_CLASS =
  "block font-sans text-[10px] uppercase tracking-[0.2em] text-stone-600";
export const AUTH_BUTTON_CLASS =
  "flex h-12 w-full items-center justify-center gap-2 rounded-none bg-stone-900 px-6 font-sans text-xs tracking-[0.2em] text-white uppercase transition-colors hover:bg-stone-800 disabled:cursor-not-allowed disabled:bg-stone-400";

/** Marco visual compartido por las pantallas de cuenta (login, recuperación, etc.). */
export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <main className="min-h-[calc(100vh-5rem)] bg-[#FAF9F6]">
      <div className="mx-auto max-w-md px-4 py-20">
        <header className="mb-10 text-center">
          <p className="font-serif text-3xl tracking-tight text-stone-900">OL.</p>
          <h1 className="mt-4 font-serif text-3xl tracking-wide text-stone-900 uppercase">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-2.5 font-sans text-xs tracking-[0.2em] text-stone-500 uppercase">
              {subtitle}
            </p>
          )}
        </header>
        <div className="rounded-none border border-stone-200 bg-white p-8 sm:p-10">
          {children}
        </div>
      </div>
    </main>
  );
}

export function AuthAlert({
  tone,
  children,
}: {
  tone: "error" | "success";
  children: ReactNode;
}) {
  const styles =
    tone === "error"
      ? "border-red-200 bg-red-50/70 text-red-800"
      : "border-emerald-200 bg-emerald-50/70 text-emerald-800";
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={`mb-6 rounded-none border p-4 font-sans text-xs leading-relaxed font-light ${styles}`}
    >
      {children}
    </div>
  );
}
