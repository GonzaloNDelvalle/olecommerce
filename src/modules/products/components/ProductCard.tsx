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

  const hasSecondaryImage = Boolean(product.secondaryImage?.url);

  return (
    <article className="group relative flex flex-col">
      <Link
        href={`/productos/${product.id}`}
        className="relative aspect-[3/4] w-full overflow-hidden rounded-none border border-stone-200/80 bg-stone-100"
      >
        {product.primaryImage ? (
          <>
            {/* Segunda imagen revelada al hacer hover */}
            {hasSecondaryImage && product.secondaryImage && (
              <Image
                src={product.secondaryImage.url}
                alt={product.secondaryImage.altText ?? `${product.name} vista 2`}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
              />
            )}

            {/* Imagen principal que se desvanece suavemente al pasar el cursor */}
            <Image
              src={product.primaryImage.url}
              alt={product.primaryImage.altText ?? product.name}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className={`object-cover object-center transition-all duration-700 ease-out ${
                hasSecondaryImage
                  ? "opacity-100 group-hover:opacity-0"
                  : "group-hover:scale-105"
              }`}
            />
          </>
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[11px] font-light tracking-[0.22em] text-stone-400 uppercase">
            Sin imagen
          </div>
        )}

        {/* Badges superiores con bordes rectos arquitectónicos (rounded-none) */}
        <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5">
          {badgePercentage > 0 && (
            <span className="rounded-none bg-stone-950 px-2.5 py-1 text-[10px] font-medium tracking-[0.2em] text-white uppercase">
              -{badgePercentage}% OFF
            </span>
          )}
          {product.collection && (
            <span className="rounded-none border border-stone-200 bg-white/95 px-2.5 py-1 text-[10px] font-light tracking-[0.2em] text-stone-800 uppercase">
              {product.collection.name}
            </span>
          )}
        </div>
      </Link>

      {/* Información comercial de la prenda */}
      <div className="mt-4 flex flex-col gap-1">
        <span className="text-[10px] font-light tracking-[0.22em] text-stone-500 uppercase">
          {product.category.name}
        </span>

        <h3 className="text-xs font-normal tracking-[0.12em] text-stone-900 uppercase transition-colors group-hover:text-[#5C4033] sm:text-sm">
          <Link href={`/productos/${product.id}`}>{product.name}</Link>
        </h3>

        <div className="mt-1 flex items-baseline gap-2.5">
          <span className="text-sm font-medium tracking-wide text-stone-900">
            {arsFormatter.format(product.finalPrice)}
          </span>
          {strikethroughPrice !== null && (
            <span className="text-xs font-light text-stone-400 line-through">
              {arsFormatter.format(strikethroughPrice)}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
