"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/cn";

const INTERVAL_MS = 6000;

/**
 * Carrusel de fondo del banner principal: hasta 3 imágenes que se funden entre
 * sí. Pasa solo (cada 6 s) salvo con "reducir movimiento"; los puntos permiten
 * elegir una imagen. La primera carga con prioridad: es el LCP de la portada.
 */
export function HeroCarousel({ images, alt }: { images: string[]; alt: string }) {
  const [active, setActive] = useState(0);
  const count = images.length;

  useEffect(() => {
    if (count <= 1) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => {
      if (document.hidden) return;
      setActive((current) => (current + 1) % count);
    }, INTERVAL_MS);
    // Reinicia el reloj al elegir manualmente: la imagen elegida no se va enseguida
    return () => window.clearInterval(timer);
  }, [count, active]);

  if (count === 0) return null;

  return (
    <div className="absolute inset-0 overflow-hidden" aria-roledescription="carrusel">
      {images.map((url, index) => (
        <div
          key={url}
          aria-hidden={index !== active}
          className={cn(
            "absolute inset-0 transition-opacity duration-1000 ease-in-out",
            index === active ? "opacity-100" : "opacity-0"
          )}
        >
          <Image
            src={url}
            alt={index === 0 ? alt : ""}
            fill
            priority={index === 0}
            fetchPriority={index === 0 ? "high" : "auto"}
            sizes="100vw"
            className={cn(
              "object-cover",
              index === active && "motion-safe:animate-[hero-zoom_7s_ease-out_both]"
            )}
          />
        </div>
      ))}

      {count > 1 && (
        <div className="absolute inset-x-0 bottom-6 z-20 flex justify-center gap-2.5 sm:bottom-8">
          {images.map((url, index) => (
            <button
              key={url}
              type="button"
              onClick={() => setActive(index)}
              aria-label={`Ver imagen ${index + 1} de ${count}`}
              aria-current={index === active}
              className="group flex size-6 items-center justify-center"
            >
              <span
                className={cn(
                  "block h-[3px] rounded-full bg-paper transition-all duration-300",
                  index === active ? "w-8 opacity-100" : "w-5 opacity-50 group-hover:opacity-80"
                )}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
