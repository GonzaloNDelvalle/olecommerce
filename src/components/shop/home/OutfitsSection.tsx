"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import type { OutfitDTO } from "@/modules/products/queries";
import { productHref } from "@/modules/products/urls";
import { formatARS } from "@/lib/format";
import { cn } from "@/lib/cn";
import { useAutoAdvance } from "@/hooks/use-auto-advance";

/**
 * "Shop the look": a la izquierda la foto del outfit y a la derecha las
 * prendas que lo componen, cada una con su link a la ficha. Si hay varios
 * outfits se recorren con las flechas.
 */
export function OutfitsSection({ outfits }: { outfits: OutfitDTO[] }) {
  const [index, setIndex] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const count = outfits.length;
  const pauseProps = useAutoAdvance(ref, count, index, setIndex);
  if (count === 0) return null;

  const outfit = outfits[index];
  const go = (delta: number) => setIndex((current) => (current + delta + count) % count);

  return (
    <div ref={ref} {...pauseProps} className="grid lg:grid-cols-[auto_minmax(0,1fr)]">
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-cream lg:h-[calc(100svh-96px)] lg:max-h-[1100px] lg:min-h-[560px] lg:w-[min(55vw,calc((100svh-96px)*0.8))]">
        {outfits.map((item, i) => (
          <Image
            key={item.id}
            src={item.imageUrl}
            alt={i === index ? `Outfit ${item.title}` : ""}
            fill
            sizes="(max-width: 1024px) 100vw, 55vw"
            className={cn(
              "object-contain transition-opacity duration-700",
              i === index ? "opacity-100" : "opacity-0"
            )}
          />
        ))}
      </div>

      <div className="flex flex-col justify-center gap-8 px-4 py-10 sm:px-10 lg:px-16">
        <div className="flex items-end justify-between gap-4">
          <div className="flex flex-col gap-2">
            <p className="eyebrow text-chocolate">Look {String(index + 1).padStart(2, "0")}</p>
            <h3 className="display text-[clamp(24px,2.4vw,34px)] leading-tight text-ink">{outfit.title}</h3>
          </div>
          {count > 1 && (
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={() => go(-1)}
                aria-label="Look anterior"
                className="pressable inline-flex size-11 items-center justify-center rounded-full border border-ink text-ink"
              >
                <ArrowLeft className="size-[18px]" strokeWidth={1.8} />
              </button>
              <button
                type="button"
                onClick={() => go(1)}
                aria-label="Look siguiente"
                className="pressable inline-flex size-11 items-center justify-center rounded-full bg-ink text-paper"
              >
                <ArrowRight className="size-[18px]" strokeWidth={1.8} />
              </button>
            </div>
          )}
        </div>

        <ul className="flex flex-col divide-y divide-stone-200 border-y border-stone-200" >
          {outfit.products.map((product) => (
            <li key={product.id}>
              <Link
                href={productHref(product.slug)}
                className="group flex items-center gap-4 py-4 transition-colors sm:gap-6 hover:bg-cream/60"
              >
                <span className="relative block aspect-[3/4] w-28 shrink-0 overflow-hidden bg-cream sm:w-36 xl:w-44">
                  {product.primaryImage && (
                    <Image
                      src={product.primaryImage.url}
                      alt=""
                      fill
                      sizes="(max-width: 640px) 112px, 176px"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  )}
                </span>
                <span className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="text-[15px] font-semibold text-ink sm:text-[17px]">{product.name}</span>
                  <span className="text-[13px] text-stone-600">{product.category.name}</span>
                  <span className="tabular pt-1 text-[15px] font-semibold text-ink sm:text-[17px]">
                    {formatARS(product.finalPrice)}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>

        {count > 1 && (
          <p className="tabular text-sm text-stone-600">
            {String(index + 1).padStart(2, "0")} / {String(count).padStart(2, "0")}
          </p>
        )}
      </div>
    </div>
  );
}
