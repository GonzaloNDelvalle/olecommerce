import Link from "next/link";
import type { ReactNode } from "react";
import { getActiveCategories, getAvailableSizes, getCatalogPage } from "@/modules/products/queries";
import { ProductCard } from "@/modules/products/components/ProductCard";
import { CatalogFilterBar, type CatalogFilterState } from "@/components/shop/CatalogFilterBar";
import { CatalogPagination } from "@/components/shop/CatalogPagination";
import { Reveal } from "@/components/motion/Reveal";
import { buttonVariants } from "@/components/ui/button";

export type CatalogSearchParams = CatalogFilterState & { pagina?: string };

function positiveNumber(value?: string): number | undefined {
  const n = Number(value);
  return value && Number.isFinite(n) && n > 0 ? n : undefined;
}

/**
 * Grilla del catálogo compartida por /productos y /categoria/[slug].
 * La primera fila carga sus imágenes con prioridad (es el LCP del listado).
 */
export async function CatalogView({
  basePath,
  categorySlug,
  searchParams,
  emptyAction,
}: {
  basePath: string;
  categorySlug?: string;
  searchParams: CatalogSearchParams;
  emptyAction?: ReactNode;
}) {
  const { q, talle, orden, precio_min, precio_max, pagina } = searchParams;
  const page = positiveNumber(pagina) ?? 1;

  const [catalog, categories, sizes] = await Promise.all([
    getCatalogPage({
      categorySlug,
      searchQuery: q,
      sizeName: talle,
      sortBy: orden,
      minPrice: positiveNumber(precio_min),
      maxPrice: positiveNumber(precio_max),
      page,
    }),
    getActiveCategories(),
    getAvailableSizes(),
  ]);

  const filters: CatalogFilterState = { q, talle, orden, precio_min, precio_max };
  const hasFilters = Boolean(q || talle || precio_min || precio_max);

  return (
    <div>
      <CatalogFilterBar
        basePath={basePath}
        categories={categories}
        activeCategorySlug={categorySlug}
        sizes={sizes}
        total={catalog.total}
        filters={filters}
      />

      {catalog.items.length === 0 ? (
        <div className="mt-8 flex min-h-[360px] flex-col items-center justify-center gap-4 bg-cream px-6 py-16 text-center">
          <p className="display text-[32px] text-ink">No encontramos prendas</p>
          <p className="max-w-md text-[15px] leading-relaxed text-stone-700">
            {hasFilters
              ? "Probá con otro talle, otro rango de precio o una búsqueda distinta."
              : "Todavía no hay productos en esta sección. Volvé pronto."}
          </p>
          {hasFilters ? (
            <Link href={basePath} className={buttonVariants({ size: "lg" })}>
              Quitar filtros
            </Link>
          ) : (
            emptyAction
          )}
        </div>
      ) : (
        <Reveal variant="stagger" className="grid grid-cols-2 gap-x-2.5 gap-y-8 pt-8 sm:gap-x-4 sm:gap-y-12 lg:grid-cols-4">
          {catalog.items.map((product, i) => (
            <div key={product.id} data-reveal-item>
              <ProductCard product={product} priority={i < 4} />
            </div>
          ))}
        </Reveal>
      )}

      <CatalogPagination
        basePath={basePath}
        page={catalog.page}
        pageCount={catalog.pageCount}
        pageSize={catalog.pageSize}
        total={catalog.total}
        searchParams={{ q, talle, orden, precio_min, precio_max }}
      />
    </div>
  );
}

export function CatalogSkeleton() {
  return (
    <div aria-hidden="true">
      <div className="flex gap-2 pb-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-10 w-24 animate-pulse rounded-full bg-cream" />
        ))}
      </div>
      <div className="h-16 animate-pulse border-y border-stone-200 bg-paper" />
      <div className="grid grid-cols-2 gap-x-2.5 gap-y-8 pt-8 sm:gap-x-4 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-3">
            <div className="aspect-[3/4] w-full animate-pulse bg-cream" />
            <div className="h-4 w-3/4 animate-pulse bg-cream" />
          </div>
        ))}
      </div>
    </div>
  );
}
