import { buttonVariants } from "@/components/ui/button";

/** Estilos de formulario compartidos por la tienda (DESIGN.md §6). */

export const INPUT_CLASS =
  "mt-1.5 h-[52px] w-full rounded-xl border border-stone-300 bg-white px-4 text-base text-ink placeholder:text-stone-500 transition-[border-color,box-shadow] duration-150 focus:border-ink focus:outline-none aria-[invalid=true]:border-brick aria-[invalid=true]:shadow-[0_0_0_3px_rgba(158,59,46,0.12)]";

export const TEXTAREA_CLASS =
  "mt-1.5 w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-base text-ink placeholder:text-stone-500 transition-[border-color,box-shadow] duration-150 focus:border-ink focus:outline-none";

export const LABEL_CLASS = "block text-[13px] font-semibold text-ink";

export const FIELD_ERROR_CLASS = "mt-1.5 text-[13px] font-medium text-brick";

export const SUBMIT_CLASS = buttonVariants({ size: "lg", block: true });
