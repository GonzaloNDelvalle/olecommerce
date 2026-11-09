import type { ReactNode } from "react";

/** Piezas visuales compartidas por las pantallas nuevas del backoffice. */

export const adminInputClass =
  "w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 placeholder:text-stone-400 focus:border-stone-900 focus:outline-none";
export const adminLabelClass =
  "block text-[11px] font-semibold tracking-wider text-stone-600 uppercase";
export const adminPrimaryButtonClass =
  "inline-flex items-center justify-center gap-2 rounded-lg bg-stone-900 px-4 py-2.5 text-xs font-semibold tracking-wider text-white uppercase transition-colors hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-60";
export const adminSecondaryButtonClass =
  "inline-flex items-center justify-center gap-2 rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs font-medium text-stone-700 transition-colors hover:border-stone-900 hover:text-stone-900 disabled:opacity-60";

export function AdminPageHeader({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <header className="mb-8">
      <h1 className="text-2xl font-semibold tracking-tight text-stone-900">
        {title}
      </h1>
      {description && (
        <p className="mt-1 max-w-2xl text-sm text-stone-500">{description}</p>
      )}
    </header>
  );
}

export function AdminCard({
  title,
  description,
  children,
}: {
  title?: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-2xs">
      {title && (
        <div className="mb-5">
          <h2 className="text-sm font-semibold tracking-wide text-stone-900 uppercase">
            {title}
          </h2>
          {description && (
            <p className="mt-1 text-xs text-stone-500">{description}</p>
          )}
        </div>
      )}
      {children}
    </section>
  );
}

export function AdminNotice({
  tone,
  children,
}: {
  tone: "error" | "success" | "warning";
  children: ReactNode;
}) {
  const styles = {
    error: "border-red-200 bg-red-50 text-red-800",
    success: "border-emerald-200 bg-emerald-50 text-emerald-800",
    warning: "border-amber-200 bg-amber-50 text-amber-900",
  }[tone];
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={`rounded-lg border px-4 py-3 text-sm ${styles}`}
    >
      {children}
    </div>
  );
}

export function AdminSkeleton() {
  return <div className="h-64 animate-pulse rounded-xl bg-stone-200/60" />;
}
