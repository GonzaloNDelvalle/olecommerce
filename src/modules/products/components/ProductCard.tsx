import Image from "next/image";
import Link from "next/link";
import type { ProductListItemDTO } from "@/modules/products/actions";

interface ProductCardProps {
  product: ProductListItemDTO;
}

const arsFormatter = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

export function ProductCard({ product }: ProductCardProps) {
  const hasExplicitDiscount = product.discountPercentage > 0;
  const hasCompareAtDiscount =
    !hasExplicitDiscount &&
    product.compareAtPrice !== null &&
    product.compareAtPrice > product.basePrice;

  const badgePercentage = hasExplicitDiscount
    ? product.discountPercentage
    : hasCompareAtDiscount
      ? Math.round(
          ((product.compareAtPrice! - product.basePrice) /
            product.compareAtPrice!) *
            100
        )
      : 0;

  const strikethroughPrice = hasExplicitDiscount
    ? product.basePrice
    : hasCompareAtDiscount
      ? product.compareAtPrice
      : null;

  return (
    <article className="group relative flex flex-col">
      <Link
        href={`/productos/${product.id}`}
        className="relative aspect-[3/4] w-full overflow-hidden rounded-xl border border-stone-200 bg-stone-50"
      >
        {product.primaryImage ? (
          <Image
            src={product.primaryImage.url}
            alt={product.primaryImage.altText ?? product.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover object-center transition-transform duration-500 ease-out group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs tracking-widest text-stone-400 uppercase">
            Sin imagen
          </div>
        )}

        {/* Badges superiores minimalistas sin sombras pesadas */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {badgePercentage > 0 && (
            <span className="rounded bg-stone-900 px-2.5 py-1 text-[10px] font-semibold tracking-wider text-white uppercase">
              -{badgePercentage}% OFF
            </span>
          )}
          {product.collection && (
            <span className="rounded border border-stone-200 bg-white/95 px-2.5 py-1 text-[10px] font-medium tracking-wider text-stone-800 uppercase">
              {product.collection.name}
            </span>
          )}
        </div>
      </Link>

      {/* Información comercial de la prenda */}
      <div className="mt-3.5 flex flex-col gap-1">
        <span className="text-[11px] font-medium tracking-wider text-stone-500 uppercase">
          {product.category.name}
        </span>

        <h3 className="text-sm font-medium text-stone-900 transition-colors group-hover:text-stone-600">
          <Link href={`/productos/${product.id}`}>{product.name}</Link>
        </h3>

        <div className="mt-0.5 flex items-baseline gap-2.5">
          <span className="text-base font-semibold text-stone-900">
            {arsFormatter.format(product.finalPrice)}
          </span>
          {strikethroughPrice !== null && (
            <span className="text-xs text-stone-400 line-through">
              {arsFormatter.format(strikethroughPrice)}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
