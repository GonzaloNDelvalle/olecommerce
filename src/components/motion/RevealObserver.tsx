"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Activa las apariciones al scrollear (DESIGN.md §8) para todo elemento con
 * `data-reveal`. Funciona con Server Components: no envuelve nada, solo
 * observa el DOM. Los elementos ya visibles al montar se marcan sin animar,
 * así no hay parpadeo ni se demora el LCP.
 */
export function RevealObserver() {
  const pathname = usePathname();

  useEffect(() => {
    const root = document.documentElement;
    const observed = new WeakSet<Element>();

    const reveal = (el: Element) => {
      el.setAttribute("data-revealed", "");
    };

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          reveal(entry.target);
          io.unobserve(entry.target);
        }
      },
      { rootMargin: "0px 0px -15% 0px", threshold: 0 },
    );

    const prepare = (el: Element, immediate: boolean) => {
      if (observed.has(el)) return;
      observed.add(el);

      if (immediate) {
        reveal(el);
      } else {
        io.observe(el);
      }
    };

    const scan = (initial: boolean) => {
      const viewportBottom = window.innerHeight;
      document.querySelectorAll("[data-reveal]:not([data-revealed])").forEach((el) => {
        // En la primera pasada, lo que ya está en pantalla se muestra sin animar.
        const inView = initial && el.getBoundingClientRect().top < viewportBottom * 0.85;
        prepare(el, inView);
      });
    };

    scan(true);
    root.setAttribute("data-reveal", "");

    // Contenido que llega después (Suspense, paginación, navegación del cliente)
    const mo = new MutationObserver(() => scan(false));
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      io.disconnect();
      mo.disconnect();
    };
  }, [pathname]);

  return null;
}
