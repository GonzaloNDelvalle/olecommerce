import { useEffect, useRef, useState, type RefObject } from "react";

/** Tiempo que se ve cada elemento antes de pasar al siguiente (toda la tienda). */
export const AUTO_ADVANCE_MS = 6000;

/**
 * Pasa solo un carrusel. Se detiene mientras la persona lo apunta o lo usa con
 * el teclado, cuando no está en pantalla, con la pestaña oculta y con
 * "reducir movimiento". `pauseProps` va en el contenedor señalado por `ref`.
 */
export function useAutoAdvance<T extends HTMLElement>(
  ref: RefObject<T | null>,
  count: number,
  current: number,
  goTo: (index: number) => void,
) {
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const goToRef = useRef(goTo);

  useEffect(() => {
    goToRef.current = goTo;
  });

  useEffect(() => {
    const element = ref.current;
    if (!element || count <= 1 || hovered || focused) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let visible = false;
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    }, { threshold: 0.25 });
    observer.observe(element);

    // `current` en las dependencias: al elegir a mano, el reloj vuelve a empezar
    const timer = window.setInterval(() => {
      if (visible && !document.hidden) goToRef.current((current + 1) % count);
    }, AUTO_ADVANCE_MS);

    return () => {
      window.clearInterval(timer);
      observer.disconnect();
    };
  }, [ref, count, current, hovered, focused]);

  return {
    onPointerEnter: () => setHovered(true),
    onPointerLeave: () => setHovered(false),
    onFocus: (event: React.FocusEvent) => {
      // Solo el foco de teclado detiene el carrusel (no el que deja un clic)
      if (event.target.matches(":focus-visible")) setFocused(true);
    },
    onBlur: () => setFocused(false),
  };
}
