"use client";

import { ViewTransition, useRef, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import { ArrowLeft, ArrowRight, ZoomIn, ZoomOut } from "lucide-react";
import { cn } from "@/lib/cn";

export interface GalleryImage {
  url: string;
  alt: string;
}

interface ProductGalleryProps {
  productId: string;
  images: GalleryImage[];
  badge?: string | null;
}

/**
 * Galería de la ficha (DESIGN.md §9).
 * - Desktop: miniaturas + imagen principal con controles flotantes de vidrio y zoom.
 * - Mobile: carrusel nativo con scroll-snap (la física del sistema le gana a
 *   cualquier gesto propio) y contador de vidrio.
 * La primera imagen comparte nombre de View Transition con la card del listado.
 */
function subscribeDesktop(cb: () => void) {
  const mq = window.matchMedia("(min-width: 1024px)");
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}

export function ProductGallery({ productId, images, badge }: ProductGalleryProps) {
  const [index, setIndex] = useState(0);
  const [zoom, setZoom] = useState(false);
  const [origin, setOrigin] = useState("50% 50%");
  const trackRef = useRef<HTMLDivElement>(null);
  // Un solo nombre de View Transition montado a la vez: el de la galería visible.
  const isDesktop = useSyncExternalStore(subscribeDesktop, () => window.matchMedia("(min-width: 1024px)").matches, () => true);
  const morphName = `product-image-${productId}`;
  const count = images.length;

  // Si cambian las imágenes (otro color), volver a la primera
  const [lastImages, setLastImages] = useState(images);
  if (lastImages !== images) {
    setLastImages(images);
    setIndex(0);
    setZoom(false);
  }

  if (count === 0) {
    return (
      <div className="eyebrow flex aspect-[4/5] w-full items-center justify-center bg-cream text-stone-600">
        Sin imagen disponible
      </div>
    );
  }

  const current = images[Math.min(index, count - 1)];
  const go = (next: number) => {
    setZoom(false);
    setIndex((next + count) % count);
  };

  return (
    <>
      {/* Mobile: carrusel a sangre */}
      <div className="relative -mx-4 sm:-mx-10 lg:hidden">
        <div
          ref={trackRef}
          className="flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain [scrollbar-width:none]"
          onScroll={(e) => {
            const el = e.currentTarget;
            setIndex(Math.round(el.scrollLeft / el.clientWidth));
          }}
          aria-label="Fotos del producto"
        >
          {images.map((image, i) => (
            <div key={image.url} className="relative aspect-[4/5] w-full shrink-0 snap-center bg-cream">
              {i === 0 ? (
                <ViewTransition name={isDesktop ? undefined : morphName} share="morph" default="none">
                  <Image src={image.url} alt={image.alt} fill priority sizes="100vw" className="object-cover" />
                </ViewTransition>
              ) : (
                <Image src={image.url} alt={image.alt} fill sizes="100vw" className="object-cover" />
              )}
            </div>
          ))}
        </div>
        {badge && <span className="eyebrow absolute top-4 left-4 bg-brick px-2.5 py-1.5 text-[11px] text-paper">{badge}</span>}
        {count > 1 && (
          <div className="glass-light absolute bottom-4 left-1/2 flex h-9 -translate-x-1/2 items-center gap-2.5 rounded-full px-3.5">
            <span className="flex gap-1.5" aria-hidden="true">
              {images.map((image, i) => (
                <span
                  key={image.url}
                  className={cn("h-1.5 rounded-full bg-stone-400 transition-[width,background-color] duration-200", i === index ? "w-[18px] bg-ink" : "w-1.5")}
                />
              ))}
            </span>
            <span className="tabular text-xs font-semibold" aria-live="polite">
              {index + 1} / {count}
            </span>
          </div>
        )}
      </div>

      {/* Desktop: miniaturas + principal */}
      <div className="hidden gap-4 lg:grid lg:grid-cols-[88px_minmax(0,1fr)]">
        <div className="flex flex-col gap-2.5" role="group" aria-label="Miniaturas">
          {images.map((image, i) => (
            <button
              key={image.url}
              type="button"
              onClick={() => go(i)}
              aria-label={`Ver foto ${i + 1} de ${count}`}
              aria-pressed={i === index}
              className={cn(
                "relative aspect-[3/4] w-full overflow-hidden bg-cream outline-offset-2 transition-opacity duration-150",
                i === index ? "ring-[1.5px] ring-ink" : "opacity-70 hover:opacity-100",
              )}
            >
              <Image src={image.url} alt="" fill sizes="88px" className="object-cover" />
            </button>
          ))}
        </div>

        <div
          className={cn("relative aspect-[4/5] w-full overflow-hidden bg-cream", zoom ? "cursor-zoom-out" : "cursor-zoom-in")}
          onClick={() => setZoom((z) => !z)}
          onPointerMove={(e) => {
            if (!zoom) return;
            const rect = e.currentTarget.getBoundingClientRect();
            setOrigin(`${((e.clientX - rect.left) / rect.width) * 100}% ${((e.clientY - rect.top) / rect.height) * 100}%`);
          }}
        >
          <ViewTransition name={isDesktop && index === 0 ? morphName : undefined} share="morph" default="none">
            <div className="absolute inset-0">
              <Image
                key={current.url}
                src={current.url}
                alt={current.alt}
                fill
                priority={index === 0}
                sizes="(max-width: 1024px) 100vw, 55vw"
                className="object-cover transition-transform duration-300 ease-out"
                style={{ transform: zoom ? "scale(2)" : "scale(1)", transformOrigin: origin }}
              />
            </div>
          </ViewTransition>

          {badge && <span className="eyebrow absolute top-4 left-4 bg-brick px-2.5 py-1.5 text-[11px] text-paper">{badge}</span>}

          <div
            className="glass-light absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full p-1.5"
            onClick={(e) => e.stopPropagation()}
          >
            {count > 1 && (
              <>
                <button type="button" onClick={() => go(index - 1)} aria-label="Foto anterior" className="pressable inline-flex size-11 items-center justify-center rounded-full hover:bg-ink/5">
                  <ArrowLeft className="size-[18px]" strokeWidth={1.8} />
                </button>
                <span className="tabular px-1.5 text-[13px] font-semibold" aria-live="polite">
                  {index + 1} / {count}
                </span>
                <button type="button" onClick={() => go(index + 1)} aria-label="Foto siguiente" className="pressable inline-flex size-11 items-center justify-center rounded-full hover:bg-ink/5">
                  <ArrowRight className="size-[18px]" strokeWidth={1.8} />
                </button>
                <span className="mx-1 h-5 w-px bg-ink/15" aria-hidden="true" />
              </>
            )}
            <button
              type="button"
              onClick={() => setZoom((z) => !z)}
              aria-pressed={zoom}
              className="pressable inline-flex h-11 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-semibold hover:bg-ink/5"
            >
              {zoom ? <ZoomOut className="size-4" strokeWidth={1.8} aria-hidden="true" /> : <ZoomIn className="size-4" strokeWidth={1.8} aria-hidden="true" />}
              {zoom ? "Alejar" : "Ampliar"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
