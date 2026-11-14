"use client";

import { useEffect, useRef, type ElementType, type HTMLAttributes, type ReactNode } from "react";

type RevealVariant = "up" | "stagger" | "lines" | "image";

interface RevealProps extends HTMLAttributes<HTMLElement> {
  as?: ElementType;
  variant?: RevealVariant;
  children: ReactNode;
}

/**
 * Aparición al scrollear (DESIGN.md §8). El elemento se observa a sí mismo
 * recién después de hidratar, así nunca toca HTML que React todavía no
 * reconcilió. Lo que ya está en pantalla en la primera carga se muestra sin
 * animar (no se demora el LCP ni parpadea).
 */
export function Reveal({ as: Tag = "div", variant = "up", children, ...rest }: RevealProps) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reveal = () => el.setAttribute("data-revealed", "");

    // Antes de que RevealRoot active el modo (primera hidratación), lo visible se muestra tal cual.
    const firstPaint = !document.documentElement.hasAttribute("data-reveal");
    if (firstPaint && el.getBoundingClientRect().top < window.innerHeight * 0.85) {
      reveal();
      return;
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        reveal();
        io.disconnect();
      },
      { rootMargin: "0px 0px -15% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Tag ref={ref} data-reveal={variant} {...rest}>
      {children}
    </Tag>
  );
}
