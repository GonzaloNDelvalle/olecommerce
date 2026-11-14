"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  animate,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useTransform,
  type MotionValue,
  type PanInfo,
} from "motion/react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import type { ProductListItemDTO } from "@/modules/products/types";
import { productHref } from "@/modules/products/urls";
import { formatARS } from "@/lib/format";
import { SPRING } from "@/lib/motion";
import { cn } from "@/lib/cn";

/** Distancia horizontal entre cards; también es la escala del arrastre 1:1. */
const STEP = 260;

function CarouselCard({
  product,
  index,
  position,
  isActive,
  onSelect,
  draggedRef,
}: {
  product: ProductListItemDTO;
  index: number;
  position: MotionValue<number>;
  isActive: boolean;
  onSelect: (index: number) => void;
  draggedRef: React.RefObject<boolean>;
}) {
  const offset = useTransform(position, (p) => index - p);
  const transform = useTransform(offset, (o) => {
    const a = Math.min(Math.abs(o), 3);
    return `translateX(${o * STEP}px) translateZ(${-a * 170}px) rotateY(${-Math.sign(o) * Math.min(a, 1.4) * 26}deg)`;
  });
  const opacity = useTransform(offset, (o) => Math.max(0, 1 - Math.abs(o) * 0.28));
  const zIndex = useTransform(offset, (o) => 100 - Math.round(Math.abs(o) * 10));

  return (
    <motion.div
      className="absolute top-0 left-1/2 -ml-[150px] w-[300px] sm:-ml-[170px] sm:w-[340px]"
      style={{ transform, opacity, zIndex }}
    >
      <Link
        href={productHref(product.slug)}
        tabIndex={isActive ? 0 : -1}
        aria-hidden={!isActive}
        draggable={false}
        onClick={(e) => {
          if (draggedRef.current) {
            e.preventDefault();
            return;
          }
          if (!isActive) {
            e.preventDefault();
            onSelect(index);
          }
        }}
        className={cn(
          "flex flex-col bg-paper shadow-[0_40px_80px_rgba(44,33,25,0.18)] select-none",
          isActive ? "cursor-pointer" : "cursor-grab",
        )}
      >
        <span className="relative block aspect-[3/4] w-full overflow-hidden bg-cream">
          {product.primaryImage && (
            <Image
              src={product.primaryImage.url}
              alt={product.primaryImage.altText ?? product.name}
              fill
              draggable={false}
              sizes="340px"
              className="pointer-events-none object-cover"
            />
          )}
        </span>
        <span className="flex items-center justify-between gap-3 px-4 py-4">
          <span className="text-[15px] font-semibold text-ink">{product.name}</span>
          <span className="tabular text-[15px] font-semibold">{formatARS(product.finalPrice)}</span>
        </span>
      </Link>
    </motion.div>
  );
}

/**
 * Carrusel 3D de destacados (DESIGN.md §7): las cards se ubican en
 * profundidad y se arrastran 1:1; al soltar, un spring lleva a la más cercana
 * proyectando la velocidad del gesto.
 */
export function FeaturedCarousel({ products }: { products: ProductListItemDTO[] }) {
  const initial = Math.min(1, products.length - 1);
  const position = useMotionValue(initial);
  const [active, setActive] = useState(initial);
  const draggedRef = useRef(false);
  const last = products.length - 1;

  useMotionValueEvent(position, "change", (p) => {
    const next = Math.max(0, Math.min(last, Math.round(p)));
    if (next !== active) setActive(next);
  });

  const goTo = (index: number) => {
    const target = Math.max(0, Math.min(last, index));
    animate(position, target, SPRING);
  };

  const onPan = (_: PointerEvent, info: PanInfo) => {
    if (Math.abs(info.offset.x) > 4) draggedRef.current = true;
    // Fricción en los extremos en vez de un tope seco
    const next = position.get() - info.delta.x / STEP;
    const overshoot = next < 0 ? next : next > last ? next - last : 0;
    position.set(overshoot ? position.get() - (info.delta.x / STEP) * 0.3 : next);
  };

  const onPanEnd = (_: PointerEvent, info: PanInfo) => {
    // Proyectar dónde se detendría con la inercia del gesto
    const projected = position.get() - (info.velocity.x / STEP) * 0.2;
    goTo(Math.round(projected));
    window.setTimeout(() => {
      draggedRef.current = false;
    }, 0);
  };

  if (products.length === 0) return null;

  return (
    <div className="flex flex-col gap-6">
      <motion.div
        className="relative h-[470px] cursor-grab touch-pan-y [perspective:1600px] [transform-style:preserve-3d] active:cursor-grabbing sm:h-[520px]"
        onPan={onPan}
        onPanStart={() => {
          position.stop();
        }}
        onPanEnd={onPanEnd}
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft") goTo(active - 1);
          if (e.key === "ArrowRight") goTo(active + 1);
        }}
        role="region"
        aria-roledescription="carrusel"
        aria-label="Productos destacados"
      >
        {products.map((product, i) => (
          <CarouselCard
            key={product.id}
            product={product}
            index={i}
            position={position}
            isActive={i === active}
            onSelect={goTo}
            draggedRef={draggedRef}
          />
        ))}
      </motion.div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => goTo(active - 1)}
          disabled={active === 0}
          aria-label="Producto anterior"
          className="pressable inline-flex size-11 items-center justify-center rounded-full border border-ink text-ink disabled:opacity-30"
        >
          <ArrowLeft className="size-[18px]" strokeWidth={1.8} />
        </button>
        <button
          type="button"
          onClick={() => goTo(active + 1)}
          disabled={active === last}
          aria-label="Producto siguiente"
          className="pressable inline-flex size-11 items-center justify-center rounded-full bg-ink text-paper disabled:opacity-30"
        >
          <ArrowRight className="size-[18px]" strokeWidth={1.8} />
        </button>
        <span className="tabular ml-3 text-sm text-stone-600" aria-live="polite">
          {String(active + 1).padStart(2, "0")} / {String(products.length).padStart(2, "0")}
        </span>
      </div>
    </div>
  );
}
