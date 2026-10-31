import { Suspense } from "react";
import Link from "next/link";
import { SlidersHorizontal, X } from "lucide-react";
import {
  getActiveCategories,
  getAvailableSizes,
} from "@/modules/products/actions";
import { PriceSortSelect } from "@/components/shop/PriceSortSelect";

interface SidebarFiltersProps {
  activeCategorySlug?: string;
  activeSearchQuery?: string;
  activeSizeName?: string;
  activeSort?: string;
}

function buildFilterHref(paramsObj: {
  categoria?: string;
  q?: string;
  talle?: string;
  orden?: string;
}): string {
  const params = new URLSearchParams();

  if (paramsObj.categoria?.trim()) {
    params.set("categoria", paramsObj.categoria.trim());
  }
  if (paramsObj.q?.trim()) {
    params.set("q", paramsObj.q.trim());
  }
  if (paramsObj.talle?.trim()) {
    params.set("talle", paramsObj.talle.trim());
  }
  if (paramsObj.orden?.trim() && paramsObj.orden !== "recientes") {
    params.set("orden", paramsObj.orden.trim());
  }

  const qs = params.toString();
  return qs ? `/productos?${qs}` : "/productos";
}

export async function SidebarFilters({
  activeCategorySlug,
  activeSearchQuery,
  activeSizeName,
  activeSort,
}: SidebarFiltersProps) {
  const [categories, sizes] = await Promise.all([
    getActiveCategories(),
    getAvailableSizes(),
  ]);

  const hasAnyFilter = Boolean(
    activeCategorySlug ||
      activeSearchQuery?.trim() ||
      activeSizeName?.trim() ||
      (activeSort && activeSort !== "recientes")
  );

  const totalProductsAcrossCategories = categories.reduce(
    (acc, cat) => acc + cat.productsCount,
    0
  );

  return (
    <aside className="w-full lg:w-64 lg:shrink-0">
      <div className="sticky top-24 space-y-6 rounded-none border border-stone-200 bg-white p-5">
        {/* Cabecera del Panel de Filtros */}
        <div className="flex items-center justify-between border-b border-stone-200 pb-3.5">
          <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-stone-900 uppercase">
            <SlidersHorizontal className="h-3.5 w-3.5 text-stone-500" />
            <h2>Filtros</h2>
          </div>

          {hasAnyFilter && (
            <Link
              href="/productos"
              className="inline-flex items-center gap-1 text-[11px] font-medium text-stone-500 transition-colors hover:text-[#5C4033]"
            >
              <X className="h-3 w-3" />
              Limpiar
            </Link>
          )}
        </div>

        {/* 1. Ordenar por Precio (Menor a Mayor / Mayor a Menor) */}
        <Suspense
          fallback={
            <div className="h-14 animate-pulse rounded-none bg-stone-50" />
          }
        >
          <PriceSortSelect activeSort={activeSort} />
        </Suspense>

        {/* 2. Filtro de Categorías */}
        <div className="border-t border-stone-200 pt-5">
          <h3 className="text-[11px] font-semibold tracking-wider text-stone-900 uppercase">
            Categorías
          </h3>

          <nav aria-label="Filtro de categorías" className="mt-3">
            <ul className="space-y-1 text-xs">
              <li>
                <Link
                  href={buildFilterHref({
                    categoria: undefined,
                    q: activeSearchQuery,
                    talle: activeSizeName,
                    orden: activeSort,
                  })}
                  className={`flex items-center justify-between rounded-none px-3 py-2 font-medium transition-colors ${
                    !activeCategorySlug
                      ? "bg-stone-900 text-white"
                      : "text-stone-600 hover:bg-stone-50 hover:text-stone-900"
                  }`}
                >
                  <span>Todas las Prendas</span>
                  <span
                    className={`rounded-none px-2 py-0.5 text-[10px] font-semibold ${
                      !activeCategorySlug
                        ? "bg-stone-700 text-stone-100"
                        : "bg-stone-100 text-stone-600"
                    }`}
                  >
                    {totalProductsAcrossCategories}
                  </span>
                </Link>
              </li>

              {categories.map((category) => {
                const isSelected = activeCategorySlug === category.slug;
                return (
                  <li key={category.id}>
                    <Link
                      href={buildFilterHref({
                        categoria: category.slug,
                        q: activeSearchQuery,
                        talle: activeSizeName,
                        orden: activeSort,
                      })}
                      className={`flex items-center justify-between rounded-none px-3 py-2 font-medium transition-colors ${
                        isSelected
                          ? "bg-stone-900 text-white"
                          : "text-stone-600 hover:bg-stone-50 hover:text-stone-900"
                      }`}
                    >
                      <span>{category.name}</span>
                      <span
                        className={`rounded-none px-2 py-0.5 text-[10px] font-semibold ${
                          isSelected
                            ? "bg-stone-700 text-stone-100"
                            : "bg-stone-100 text-stone-600"
                        }`}
                      >
                        {category.productsCount}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>

        {/* 3. Selector Visual de Talles */}
        {sizes.length > 0 && (
          <div className="border-t border-stone-200 pt-5">
            <div className="flex items-center justify-between">
              <h3 className="text-[11px] font-semibold tracking-wider text-stone-900 uppercase">
                Talle
              </h3>
              {activeSizeName && (
                <Link
                  href={buildFilterHref({
                    categoria: activeCategorySlug,
                    q: activeSearchQuery,
                    talle: undefined,
                    orden: activeSort,
                  })}
                  className="text-[11px] font-medium text-stone-500 underline underline-offset-2 hover:text-stone-900"
                >
                  Todos
                </Link>
              )}
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2">
              {sizes.map((size) => {
                const isSelected =
                  activeSizeName?.toUpperCase() === size.name.toUpperCase();
                const nextTalle = isSelected ? undefined : size.name;

                return (
                  <Link
                    key={size.id}
                    href={buildFilterHref({
                      categoria: activeCategorySlug,
                      q: activeSearchQuery,
                      talle: nextTalle,
                      orden: activeSort,
                    })}
                    className={`flex h-9 items-center justify-center rounded-none border text-xs font-medium transition-colors ${
                      isSelected
                        ? "border-stone-900 bg-stone-900 text-white"
                        : "border-stone-200 bg-white text-stone-700 hover:border-stone-900 hover:text-stone-900"
                    }`}
                  >
                    {size.name}
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
