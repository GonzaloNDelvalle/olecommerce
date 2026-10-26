import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { X } from "lucide-react";
import { getActiveProducts } from "@/modules/products/actions";
import { ProductCard } from "@/modules/products/components/ProductCard";
import { SidebarFilters } from "@/components/shop/SidebarFilters";

export const metadata: Metadata = {
  title: "OLÉ | Indumentaria Femenina & Colección",
  description:
    "Descubrí nuestra colección de indumentaria femenina. Prendas de diseño, sastrería y básicos atemporales con envíos a todo el país.",
};

interface ShopCatalogSearchParams {
  categoria?: string;
  q?: string;
  talle?: string;
  orden?: string;
}

interface ShopHomePageProps {
  searchParams: Promise<ShopCatalogSearchParams>;
}

const SORT_LABELS: Record<string, string> = {
  precio_asc: "Precio: Menor a Mayor",
  precio_desc: "Precio: Mayor a Menor",
};

async function CatalogContent({
  searchParamsPromise,
}: {
  searchParamsPromise: Promise<ShopCatalogSearchParams>;
}) {
  const { categoria, q, talle, orden } = await searchParamsPromise;

  const products = await getActiveProducts({
    categorySlug: categoria,
    searchQuery: q,
    sizeName: talle,
    sortBy: orden,
  });

  const hasActiveFilters = Boolean(
    categoria || q?.trim() || talle?.trim() || (orden && orden !== "recientes")
  );

  return (
    <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
      {/* Barra Lateral de Filtros Paramétricos */}
      <SidebarFilters
        activeCategorySlug={categoria}
        activeSearchQuery={q}
        activeSizeName={talle}
        activeSort={orden}
      />

      {/* Columna Principal: Estado de Filtros Activos + Grilla de Prendas */}
      <div className="flex-1 space-y-6">
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-xs text-stone-600">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-stone-500">Filtros aplicados:</span>

              {q?.trim() && (
                <span className="inline-flex items-center rounded-md bg-stone-900 px-2.5 py-1 text-[11px] font-medium text-white">
                  &ldquo;{q.trim()}&rdquo;
                </span>
              )}

              {categoria && (
                <span className="inline-flex items-center rounded-md border border-stone-200 bg-white px-2.5 py-1 text-[11px] font-medium text-stone-800 uppercase">
                  Categoría: {categoria}
                </span>
              )}

              {talle?.trim() && (
                <span className="inline-flex items-center rounded-md border border-stone-200 bg-white px-2.5 py-1 text-[11px] font-medium text-stone-800 uppercase">
                  Talle: {talle.trim()}
                </span>
              )}

              {orden && SORT_LABELS[orden] && (
                <span className="inline-flex items-center rounded-md border border-stone-200 bg-white px-2.5 py-1 text-[11px] font-medium text-stone-800">
                  {SORT_LABELS[orden]}
                </span>
              )}

              <span className="ml-1 text-stone-400">
                ({products.length}{" "}
                {products.length === 1 ? "prenda" : "prendas"})
              </span>
            </div>

            <Link
              href="/"
              className="inline-flex items-center gap-1 font-medium text-stone-900 underline underline-offset-4 transition-colors hover:text-stone-600"
            >
              <X className="h-3.5 w-3.5" />
              Limpiar todo
            </Link>
          </div>
        )}

        {products.length === 0 ? (
          <div className="flex min-h-[340px] flex-col items-center justify-center rounded-xl border border-stone-200 bg-stone-50 p-12 text-center">
            <p className="text-base font-medium text-stone-900">
              No encontramos prendas con estos filtros.
            </p>
            <p className="mt-1 max-w-md text-xs text-stone-500">
              Probá buscando otro término o limpiando los filtros seleccionados
              en la barra lateral.
            </p>
            {hasActiveFilters && (
              <Link
                href="/"
                className="mt-5 inline-flex items-center rounded-lg bg-stone-900 px-5 py-2.5 text-xs font-semibold tracking-wider text-white uppercase transition-colors hover:bg-stone-800"
              >
                Ver Todo el Catálogo
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 xl:grid-cols-3">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CatalogSkeleton() {
  return (
    <div className="flex flex-col gap-8 lg:flex-row">
      <div className="h-80 w-full animate-pulse rounded-xl border border-stone-200 bg-stone-50 lg:w-64" />
      <div className="grid flex-1 grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-3">
            <div className="aspect-[3/4] w-full animate-pulse rounded-xl bg-stone-100" />
            <div className="h-3 w-20 animate-pulse rounded bg-stone-100" />
            <div className="h-4 w-3/4 animate-pulse rounded bg-stone-100" />
            <div className="h-5 w-24 animate-pulse rounded bg-stone-100" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ShopCatalogHomePage({
  searchParams,
}: ShopHomePageProps) {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Encabezado Editorial Minimalista */}
      <header className="mb-10 border-b border-stone-200 pb-8">
        <p className="text-[11px] font-semibold tracking-[0.25em] text-stone-500 uppercase">
          Nueva Temporada • Colección Exclusiva
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl">
          Catálogo de Prendas
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-stone-600">
          Piezas sastreras y esenciales de diseño confeccionadas con géneros
          nobles y calce pensado para acompañarte todos los días.
        </p>
      </header>

      {/* Sidebar de Filtros + Grilla de Productos filtrada por searchParams */}
      <Suspense fallback={<CatalogSkeleton />}>
        <CatalogContent searchParamsPromise={searchParams} />
      </Suspense>
    </main>
  );
}
