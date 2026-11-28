"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import type { OutfitDTO } from "@/modules/products/queries";
import { productHref } from "@/modules/products/urls";
import { formatARS } from "@/lib/format";

/** Velocidad de la cinta, en píxeles por segundo. */
const SPEED = 30;
/** Looks (repetidos) como mínimo en cada mitad, para que la cinta llene pantallas anchas. */
const MIN_LOOKS_PER_HALF = 4;

function Look({ outfit, hidden }: { outfit: OutfitDTO; hidden: boolean }) {
  return (
    <article
      data-look
      aria-hidden={hidden || undefined}
      className="flex w-[82vw] shrink-0 flex-col gap-4 sm:w-auto sm:flex-row sm:items-center sm:gap-6"
    >
      {/* La foto conserva su proporción: nunca se recorta */}
      <Image
        src={outfit.imageUrl}
        alt={hidden ? "" : `Outfit ${outfit.title}`}
        width={800}
        height={1000}
        sizes="(max-width: 640px) 82vw, 520px"
        draggable={false}
        className="h-auto w-full bg-cream-deep sm:h-[min(78svh,680px)] sm:w-auto sm:max-w-[60vw]"
      />

      <div className="flex flex-col gap-3 sm:w-[300px]">
        <h3 className="display text-[22px] text-ink">{outfit.title}</h3>
        <ul className="flex flex-col divide-y divide-ink/10 border-y border-ink/10">
          {outfit.products.map((product) => (
            <li key={product.id}>
              <Link
                href={productHref(product.slug)}
                tabIndex={hidden ? -1 : undefined}
                draggable={false}
                className="group flex items-center gap-4 py-3"
              >
                <span className="relative block aspect-[3/4] w-20 shrink-0 overflow-hidden bg-cream-deep sm:w-24">
                  {product.primaryImage && (
                    <Image
                      src={product.primaryImage.url}
                      alt=""
                      fill
                      sizes="96px"
                      draggable={false}
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  )}
                </span>
                <span className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="text-[14px] leading-snug font-semibold text-ink group-hover:text-chocolate">
                    {product.name}
                  </span>
                  <span className="tabular text-[14px] text-ink">{formatARS(product.finalPrice)}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}

/**
 * "Shop the look": una cinta horizontal de looks (foto y, al lado, las prendas
 * que lo componen) que avanza sola y en bucle. Se detiene al apuntarla, al
 * tocarla o al usarla con el teclado; las flechas saltan de a un look y también
 * se puede deslizar. Con "reducir movimiento" no avanza sola.
 *
 * El bucle usa dos mitades idénticas: al terminar la primera se vuelve atrás
 * justo su ancho, sin que se note. La segunda es decorativa (aria-hidden).
 */
export function OutfitsSection({ outfits }: { outfits: OutfitDTO[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef({ pointer: false, focus: false, until: 0 });
  const count = outfits.length;
  const loop = count > 1;
  const repeats = loop ? Math.max(1, Math.ceil(MIN_LOOKS_PER_HALF / count)) : 1;
  const half = Array.from({ length: repeats }, () => outfits).flat();

  /** Ancho de una mitad: distancia entre el primer look y su copia. */
  function halfWidth(track: HTMLDivElement) {
    const looks = track.querySelectorAll<HTMLElement>("[data-look]");
    const copy = looks[looks.length / 2];
    return copy && looks[0] ? copy.offsetLeft - looks[0].offsetLeft : 0;
  }

  useEffect(() => {
    const track = trackRef.current;
    if (!track || !loop) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;
    let last = 0;
    // Posición con decimales: scrollLeft redondea y a baja velocidad no avanzaría
    let position = track.scrollLeft;
    let visible = false;

    const step = (time: number) => {
      const elapsed = last ? Math.min(time - last, 64) : 0;
      last = time;
      const paused = pausedRef.current;
      // Si la persona movió la cinta, se sigue desde donde quedó
      if (Math.abs(track.scrollLeft - position) > 2) position = track.scrollLeft;
      if (!paused.pointer && !paused.focus && time > paused.until) {
        position += (SPEED * elapsed) / 1000;
        const width = halfWidth(track);
        if (width > 0 && position >= width) position -= width;
        track.scrollLeft = position;
      }
      if (visible) frame = requestAnimationFrame(step);
    };

    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      cancelAnimationFrame(frame);
      last = 0;
      if (visible) frame = requestAnimationFrame(step);
    });
    observer.observe(track);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [loop]);

  function move(direction: 1 | -1) {
    const track = trackRef.current;
    const look = track?.querySelector<HTMLElement>("[data-look]");
    if (!track || !look) return;
    const distance = look.offsetWidth + parseFloat(getComputedStyle(track).columnGap || "0");
    // Antes de retroceder desde el principio, saltar a la copia (se ve igual)
    if (loop && direction < 0 && track.scrollLeft < distance) track.scrollLeft += halfWidth(track);
    if (loop && direction > 0 && track.scrollLeft >= halfWidth(track)) track.scrollLeft -= halfWidth(track);
    pausedRef.current.until = performance.now() + 1500;
    track.scrollBy({ left: direction * distance, behavior: "smooth" });
  }

  if (count === 0) return null;

  const arrow =
    "glass-light pressable absolute top-1/2 z-10 inline-flex size-11 -translate-y-1/2 items-center justify-center rounded-full text-ink";

  return (
    <div
      className="relative pb-14 lg:pb-20"
      role="region"
      aria-roledescription="carrusel"
      aria-label="Outfits"
      onPointerEnter={(e) => {
        if (e.pointerType === "mouse") pausedRef.current.pointer = true;
      }}
      onPointerLeave={() => {
        pausedRef.current.pointer = false;
      }}
      onTouchStart={() => {
        pausedRef.current.pointer = true;
      }}
      onTouchEnd={() => {
        pausedRef.current.pointer = false;
        pausedRef.current.until = performance.now() + 2500;
      }}
      onFocus={(e) => {
        if (e.target.matches(":focus-visible")) pausedRef.current.focus = true;
      }}
      onBlur={() => {
        pausedRef.current.focus = false;
      }}
    >
      <div
        ref={trackRef}
        data-lenis-prevent-horizontal
        className="flex gap-6 overflow-x-auto overscroll-x-contain px-4 [scrollbar-width:none] sm:gap-10 sm:px-10"
      >
        {half.map((outfit, i) => (
          <Look key={`a-${outfit.id}-${i}`} outfit={outfit} hidden={i >= count} />
        ))}
        {loop && half.map((outfit, i) => <Look key={`b-${outfit.id}-${i}`} outfit={outfit} hidden />)}
      </div>

      {loop && (
        <>
          <button type="button" onClick={() => move(-1)} aria-label="Look anterior" className={`${arrow} left-3`}>
            <ArrowLeft className="size-[18px]" strokeWidth={1.8} />
          </button>
          <button type="button" onClick={() => move(1)} aria-label="Look siguiente" className={`${arrow} right-3`}>
            <ArrowRight className="size-[18px]" strokeWidth={1.8} />
          </button>
        </>
      )}
    </div>
  );
}
