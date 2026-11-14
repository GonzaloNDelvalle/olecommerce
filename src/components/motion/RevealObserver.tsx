"use client";

import { useEffect } from "react";

/**
 * Activa el modo de apariciones al scrollear una vez hidratada la página.
 * Hasta entonces nada se oculta: sin JS, el HTML del servidor se ve completo.
 * Cada <Reveal> se observa a sí mismo (ver Reveal.tsx).
 */
export function RevealObserver() {
  useEffect(() => {
    document.documentElement.setAttribute("data-reveal", "");
  }, []);
  return null;
}
