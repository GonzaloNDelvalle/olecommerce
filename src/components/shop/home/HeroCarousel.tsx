"use client";

import { Component, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { cn } from "@/lib/cn";

const HeroCloth = dynamic(() => import("@/components/three/HeroCloth"), { ssr: false });

const INTERVAL_MS = 6000;

/** ¿Vale la pena montar WebGL en este dispositivo? */
function canUseWebGL(): boolean {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
  const nav = navigator as Navigator & { connection?: { saveData?: boolean }; deviceMemory?: number };
  if (nav.connection?.saveData) return false;
  if ((nav.hardwareConcurrency ?? 8) < 4) return false;
  if ((nav.deviceMemory ?? 8) < 4) return false;
  return true;
}

/** URL same-origin optimizada por Next: evita problemas de CORS en la textura. */
function textureUrl(src: string): string {
  return `/_next/image?url=${encodeURIComponent(src)}&w=1200&q=75`;
}

/** Si WebGL o una textura fallan, la escena se descarta y queda el carrusel normal. */
class SceneBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

/**
 * Carrusel de fondo del banner principal: hasta 3 imágenes que se funden entre
 * sí y pasan solas (cada 6 s) salvo con "reducir movimiento"; los puntos
 * permiten elegir una. Las <Image> del servidor son el LCP; cuando el
 * dispositivo lo permite, encima se monta la tela WebGL (ondulación y
 * difuminado) con las mismas imágenes.
 */
export function HeroCarousel({ images, alt }: { images: string[]; alt: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [enable3D, setEnable3D] = useState(false);
  const [ready, setReady] = useState(false);
  const [inView, setInView] = useState(true);
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

  useEffect(() => {
    // Esperar a que el navegador esté libre: el LCP es la imagen, no la escena.
    const start = () => setEnable3D(canUseWebGL());
    if (typeof window.requestIdleCallback === "function") {
      const id = window.requestIdleCallback(start, { timeout: 2500 });
      return () => window.cancelIdleCallback(id);
    }
    const id = globalThis.setTimeout(start, 1200);
    return () => globalThis.clearTimeout(id);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const handleReady = useCallback(() => setReady(true), []);

  if (count === 0) return null;

  return (
    <div ref={ref} className="absolute inset-0 overflow-hidden" aria-roledescription="carrusel">
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
            className="object-cover"
          />
        </div>
      ))}

      {enable3D && (
        <div
          className={cn(
            "absolute inset-0 transition-opacity duration-700",
            ready ? "opacity-100" : "opacity-0"
          )}
        >
          <SceneBoundary>
            <HeroCloth
              sources={images.map(textureUrl)}
              index={active}
              active={inView}
              onReady={handleReady}
            />
          </SceneBoundary>
        </div>
      )}

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
