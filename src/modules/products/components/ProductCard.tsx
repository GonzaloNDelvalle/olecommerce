import { ViewTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { ProductListItemDTO } from "@/modules/products/types";
import { productHref } from "@/modules/products/urls";
import { formatARS } from "@/lib/format";
import { cn } from "@/lib/cn";

interface ProductCardProps {
  product: ProductListItemDTO;
  /** Solo la primera fila visible: carga la imagen con prioridad. */
  priority?: boolean;
  sizes?: string;
}

/** Precio tachado y % de descuento a partir del precio final. */
export function getPriceDisplay(product: ProductListItemDTO) {
  const hasExplicitDiscount = product.discountPercentage > 0;
  const hasCompareAt =
    !hasExplicitDiscount && product.compareAtPrice !== null && product.compareAtPrice > product.basePrice;
  const strikethrough = hasExplicitDiscount ? product.basePrice : hasCompareAt ? product.compareAtPrice : null;
  const percent = hasExplicitDiscount
    ? product.discountPercentage
    : hasCompareAt
      ? Math.round(((product.compareAtPrice! - product.basePrice) / product.compareAtPrice!) * 100)
      : 0;
  return { strikethrough, percent };
}

/**
 * Card de producto (DESIGN.md §9). Sin tilt: es contenido funcional.
 * La imagen comparte nombre de View Transition con la galería de la ficha,
 * así al entrar al producto la foto "viaja" a su lugar.
 */
export function ProductCard({ product, priority = false, sizes }: ProductCardProps) {
  const { strikethrough, percent } = getPriceDisplay(product);
  const href = productHref(product.slug);
  const hasSecondary = Boolean(product.secondaryImage?.url);
  const imageSizes = sizes ?? "(max-width: 1024px) 50vw, 25vw";

  return (
    <article className="group relative flex flex-col gap-3.5">
      <Link
        href={href}
        className="relative block aspect-[3/4] w-full overflow-hidden bg-cream"
        aria-label={product.name}
      >
        {product.primaryImage ? (
          <ViewTransition name={`product-image-${product.id}`} share="morph" default="none">
            <div className="absolute inset-0">
              {hasSecondary && product.secondaryImage && (
                <Image
                  src={product.secondaryImage.url}
                  alt=""
                  fill
                  sizes={imageSizes}
                  className="object-cover"
                />
              )}
              <Image
                src={product.primaryImage.url}
                alt={product.primaryImage.altText ?? product.name}
                fill
                priority={priority}
                sizes={imageSizes}
                className={cn(
                  "object-cover transition-[opacity,transform] duration-500 ease-out",
                  hasSecondary ? "group-hover:opacity-0" : "group-hover:scale-[1.03]",
                )}
              />
            </div>
          </ViewTransition>
        ) : (
          <span className="eyebrow absolute inset-0 flex items-center justify-center text-stone-500">Sin imagen</span>
        )}

        {/* Solo el descuento va sobre la foto, chico y en la esquina */}
        {percent > 0 && (
          <span className="tabular absolute top-2.5 left-2.5 rounded-full bg-brick px-2 py-0.5 text-[11px] font-bold text-paper">
            −{percent}%
          </span>
        )}

        {/* Atajo mínimo al hover (solo con mouse): no tapa la prenda */}
        <span
          aria-hidden="true"
          className="glass-light absolute right-2.5 bottom-2.5 hidden size-9 translate-y-1 items-center justify-center rounded-full text-ink opacity-0 transition-[opacity,transform] duration-200 ease-out [@media(hover:hover)_and_(pointer:fine)]:flex group-hover:translate-y-0 group-hover:opacity-100"
        >
          <ArrowUpRight className="size-4" strokeWidth={1.8} />
        </span>
      </Link>

      <div className="flex flex-col gap-1">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-[15px] leading-snug font-semibold text-ink">
            <Link href={href} className="hover:text-chocolate">
              {product.name}
            </Link>
          </h3>
          <p className="tabular flex shrink-0 flex-col items-end text-[15px] font-semibold">
            <span className={cn(strikethrough !== null && "text-brick")}>{formatARS(product.finalPrice)}</span>
            {strikethrough !== null && (
              <s className="text-[13px] font-normal text-stone-600">{formatARS(strikethrough)}</s>
            )}
          </p>
        </div>
        <p className="text-[13px] text-stone-600">
          {product.category.name}
          {product.collection && <span className="text-caramel"> · {product.collection.name}</span>}
        </p>
      </div>
    </article>
  );
}
