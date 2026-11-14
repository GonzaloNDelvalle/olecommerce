import { cva, type VariantProps } from "class-variance-authority";

/**
 * Estilos de botón compartidos (DESIGN.md §6). Se aplican tanto a <button>
 * como a <Link>, así un CTA que navega se ve igual que uno que envía.
 */
export const buttonVariants = cva(
  [
    "pressable inline-flex shrink-0 items-center justify-center gap-2.5 rounded-full",
    "font-sans font-semibold tracking-[0.02em] whitespace-nowrap",
    "transition-[transform,background-color,color,border-color] duration-150",
    "disabled:pointer-events-none disabled:opacity-40",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-chocolate",
  ],
  {
    variants: {
      variant: {
        primary: "bg-ink text-paper hover:bg-espresso",
        secondary: "border border-ink bg-transparent text-ink hover:bg-ink hover:text-paper",
        light: "bg-paper text-ink hover:bg-cream",
        glass: "glass-light text-ink hover:bg-paper",
        ghost: "bg-transparent text-ink underline-offset-4 hover:underline",
        success: "bg-olive text-paper",
      },
      size: {
        sm: "h-10 px-4 text-[13px]",
        md: "h-12 px-6 text-sm",
        lg: "h-14 px-8 text-[15px]",
        icon: "size-11",
      },
      block: {
        true: "w-full",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export type ButtonVariantProps = VariantProps<typeof buttonVariants>;
