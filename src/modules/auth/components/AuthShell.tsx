import type { ReactNode } from "react";
import { INPUT_CLASS, LABEL_CLASS, SUBMIT_CLASS } from "@/components/ui/form";
import { cn } from "@/lib/cn";

export const AUTH_INPUT_CLASS = INPUT_CLASS;
export const AUTH_LABEL_CLASS = LABEL_CLASS;
export const AUTH_BUTTON_CLASS = SUBMIT_CLASS;

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
    <main className="min-h-[calc(100svh-5rem)] bg-paper">
      <div className="mx-auto max-w-md px-4 pt-14 pb-24">
        <header className="mb-8 text-center">
          <h1 className="display text-[clamp(40px,6vw,56px)] text-ink">{title}</h1>
          {subtitle && <p className="mx-auto mt-3 max-w-sm text-[15px] text-stone-700">{subtitle}</p>}
        </header>
        <div className="rounded-[28px] border border-stone-200 bg-white p-6 shadow-[0_20px_60px_rgba(44,33,25,0.06)] sm:p-9">
          {children}
        </div>
      </div>
    </main>
  );
}

export function AuthAlert({ tone, children }: { tone: "error" | "success"; children: ReactNode }) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "mb-6 rounded-xl border p-4 text-sm leading-relaxed",
        tone === "error" ? "border-brick/30 bg-brick/5 text-brick" : "border-olive/30 bg-olive/10 text-olive-deep",
      )}
    >
      {children}
    </div>
  );
}
