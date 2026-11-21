"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, SlidersHorizontal, X } from "lucide-react";
import type { PublicCategoryDTO, PublicSizeDTO } from "@/modules/products/types";
import { categoryHref } from "@/modules/products/urls";
import { Sheet } from "@/components/ui/Sheet";
import { buttonVariants } from "@/components/ui/button";
import { formatARS, plural } from "@/lib/format";
import { cn } from "@/lib/cn";

const PRICE_PRESETS: { id: string; label: string; min?: number; max?: number }[] = [
  { id: "under-60k", label: "Hasta $60.000", max: 60000 },
  { id: "60k-120k", label: "$60.000 a $120.000", min: 60000, max: 120000 },
  { id: "120k-200k", label: "$120.000 a $200.000", min: 120000, max: 200000 },
  { id: "over-200k", label: "Más de $200.000", min: 200000 },
];

const SORT_OPTIONS = [
  { value: "recientes", label: "Más nuevos" },
  { value: "precio_asc", label: "Menor precio" },
  { value: "precio_desc", label: "Mayor precio" },
];

export interface CatalogFilterState {
  q?: string;
  talle?: string;
  orden?: string;
  precio_min?: string;
  precio_max?: string;
}

interface CatalogFilterBarProps {
  /** "/productos" o "/categoria/<slug>": los filtros se aplican sobre esta ruta. */
  basePath: string;
  categories: PublicCategoryDTO[];
  activeCategorySlug?: string;
  sizes: PublicSizeDTO[];
  total: number;
  filters: CatalogFilterState;
}

const pill =
  "pressable inline-flex h-10 shrink-0 items-center gap-2 rounded-full px-4 text-sm font-medium whitespace-nowrap text-ink transition-colors duration-150 hover:bg-paper";
/** Activo: se vuelve sólido para que se note sobre el vidrio. */
const pillOn = "bg-ink text-paper hover:bg-ink";
const glass = "glass-light";

/**
 * Filtros del catálogo (DESIGN.md §9): categorías en pills, barra sticky con
 * filtros y orden, chips de filtros activos de vidrio. Cambios instantáneos,
 * sin animación: es una acción frecuente.
 */
export function CatalogFilterBar({
  basePath,
  categories,
  activeCategorySlug,
  sizes,
  total,
  filters,
}: CatalogFilterBarProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(Boolean(activeCategorySlug));

  function hrefWith(changes: Partial<CatalogFilterState>) {
    const next: Record<string, string | undefined> = { ...filters, ...changes };
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(next)) {
      if (value && !(key === "orden" && value === "recientes")) params.set(key, value);
    }
    const query = params.toString();
    return query ? `${basePath}?${query}` : basePath;
  }

  /** Va a otra categoría conservando talle, precio y orden. */
  function categoryUrl(slug?: string) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(filters)) {
      if (value && !(key === "orden" && value === "recientes")) params.set(key, value);
    }
    const query = params.toString();
    const path = slug ? categoryHref(slug) : "/productos";
    return query ? `${path}?${query}` : path;
  }

  function apply(changes: Partial<CatalogFilterState>) {
    startTransition(() => {
      router.push(hrefWith(changes), { scroll: false });
    });
  }

  const activePreset = PRICE_PRESETS.find(
    (p) => String(p.min ?? "") === (filters.precio_min ?? "") && String(p.max ?? "") === (filters.precio_max ?? ""),
  );

  const visibleCategories = categories.filter((c) => c.productsCount > 0);
  const activeCategory = visibleCategories.find((c) => c.slug === activeCategorySlug);

  const chips: { key: string; label: string; clear: Partial<CatalogFilterState>; href?: string }[] = [];
  if (activeCategory) chips.push({ key: "categoria", label: activeCategory.name, clear: {}, href: categoryUrl() });
  if (filters.q) chips.push({ key: "q", label: `“${filters.q}”`, clear: { q: undefined } });
  if (filters.talle) chips.push({ key: "talle", label: `Talle ${filters.talle}`, clear: { talle: undefined } });
  if (filters.precio_min || filters.precio_max) {
    const label =
      activePreset?.label ??
      [filters.precio_min && `Desde ${formatARS(Number(filters.precio_min))}`, filters.precio_max && `hasta ${formatARS(Number(filters.precio_max))}`]
        .filter(Boolean)
        .join(" ");
    chips.push({ key: "precio", label, clear: { precio_min: undefined, precio_max: undefined } });
  }
  const activeCount =
    (filters.talle ? 1 : 0) + (filters.precio_min || filters.precio_max ? 1 : 0) + (activeCategorySlug ? 1 : 0);


  return (
    <div className="flex flex-col">
      {/* Barra sticky: filtros + orden */}
      <div className="sticky top-[76px] z-30 -mx-4 border-y border-stone-200 bg-paper/80 px-4 py-3 backdrop-blur-md sm:top-[88px] sm:mx-0 sm:px-0">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 overflow-x-auto [scrollbar-width:none]">
            <button type="button" onClick={() => setSheetOpen(true)} className={cn(pill, glass)} aria-haspopup="dialog">
              <SlidersHorizontal className="size-4" strokeWidth={1.8} aria-hidden="true" />
              Filtros
              {activeCount > 0 && (
                <span className="tabular rounded-full bg-chocolate px-1.5 text-[11px] font-bold text-paper">{activeCount}</span>
              )}
            </button>
          </div>

          <div className="flex items-center gap-4">
            <p className={cn("text-sm text-stone-600 transition-opacity", isPending && "opacity-50")} aria-live="polite">
              <span className="tabular">{total}</span> {plural(total, "resultado", "resultados")}
            </p>
            <label className="flex items-center gap-2 text-sm">
              <span className="hidden text-stone-600 sm:inline">Ordenar</span>
              <select
                value={filters.orden ?? "recientes"}
                onChange={(e) => apply({ orden: e.target.value })}
                className="glass-light h-10 rounded-full pr-8 pl-4 text-sm font-medium text-ink"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
      </div>

      {/* Filtros activos */}
      {chips.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 pt-4">
          {chips.map((chip) => (
            <span
              key={chip.key}
              className="glass-light inline-flex h-9 items-center gap-1 rounded-full border-stone-300 pr-1 pl-3.5 text-[13px] font-semibold"
            >
              {chip.label}
              <Link
                href={chip.href ?? hrefWith(chip.clear)}
                scroll={false}
                aria-label={`Quitar filtro ${chip.label}`}
                className="inline-flex size-8 items-center justify-center rounded-full hover:bg-ink/5"
              >
                <X className="size-3.5" strokeWidth={2.2} />
              </Link>
            </span>
          ))}
          <Link
            href={basePath}
            scroll={false}
            className="glass-light pressable inline-flex h-9 items-center rounded-full px-3.5 text-[13px] font-semibold text-chocolate hover:border-chocolate"
          >
            Limpiar todo
          </Link>
        </div>
      )}

      <Sheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title="Filtros"
        footer={
          <div className="flex gap-3">
            <Link href={basePath} scroll={false} onClick={() => setSheetOpen(false)} className={buttonVariants({ variant: "secondary", size: "lg", className: "flex-1" })}>
              Limpiar
            </Link>
            <button type="button" onClick={() => setSheetOpen(false)} className={buttonVariants({ size: "lg", className: "flex-[2]" })}>
              Ver {total} {plural(total, "resultado", "resultados")}
            </button>
          </div>
        }
      >
        <div className="flex flex-col gap-8 px-6 py-6">
          {visibleCategories.length > 0 && (
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => setCategoriesOpen((open) => !open)}
                aria-expanded={categoriesOpen}
                aria-controls="filter-categories"
                className={cn(glass, "pressable flex h-12 items-center justify-between rounded-xl px-4 text-[15px] font-semibold")}
              >
                <span>
                  Categorías
                  {activeCategory && <span className="ml-2 font-normal text-chocolate">· {activeCategory.name}</span>}
                </span>
                <ChevronDown
                  className={cn("size-5 transition-transform duration-200", categoriesOpen && "rotate-180")}
                  strokeWidth={1.8}
                  aria-hidden="true"
                />
              </button>
              {categoriesOpen && (
                <ul id="filter-categories" className={cn(glass, "flex flex-col rounded-xl p-1.5")}>
                  {[{ id: "todo", name: "Todo", slug: undefined as string | undefined }, ...visibleCategories].map((category) => {
                    const active = category.slug === activeCategorySlug;
                    return (
                      <li key={category.id}>
                        <Link
                          href={categoryUrl(category.slug)}
                          onClick={() => setSheetOpen(false)}
                          aria-current={active ? "page" : undefined}
                          className={cn(
                            "flex h-11 items-center justify-between rounded-lg px-3 text-[15px] transition-colors hover:bg-paper",
                            active && "bg-ink font-semibold text-paper hover:bg-ink",
                          )}
                        >
                          {category.name}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          )}

          <fieldset className="flex flex-col gap-3">
            <legend className="mb-3 text-[15px] font-semibold">Talle</legend>
            <div className="flex flex-wrap gap-2">
              {sizes.map((size) => {
                const active = filters.talle?.toLowerCase() === size.name.toLowerCase();
                return (
                  <button
                    key={size.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => apply({ talle: active ? undefined : size.name })}
                    className={cn(pill, "h-12 min-w-14 justify-center", active ? pillOn : glass)}
                  >
                    {size.name}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <fieldset className="flex flex-col gap-2">
            <legend className="mb-3 text-[15px] font-semibold">Precio</legend>
            {PRICE_PRESETS.map((preset) => {
              const active = activePreset?.id === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() =>
                    apply(
                      active
                        ? { precio_min: undefined, precio_max: undefined }
                        : { precio_min: preset.min?.toString(), precio_max: preset.max?.toString() },
                    )
                  }
                  className={cn(
                    "flex h-12 items-center justify-between rounded-xl px-4 text-left text-[15px] transition-colors",
                    active ? "bg-ink font-semibold text-paper" : cn(glass, "hover:bg-paper"),
                  )}
                >
                  {preset.label}
                  <span
                    aria-hidden="true"
                    className={cn("size-5 rounded-full border-[1.5px] border-stone-400", active && "border-[6px] border-paper")}
                  />
                </button>
              );
            })}
          </fieldset>

          <fieldset className="flex flex-col gap-2">
            <legend className="mb-3 text-[15px] font-semibold">Ordenar por</legend>
            <div className="flex flex-wrap gap-2">
              {SORT_OPTIONS.map((option) => {
                const active = (filters.orden ?? "recientes") === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    aria-pressed={active}
                    onClick={() => apply({ orden: option.value })}
                    className={cn(pill, "h-11", active ? pillOn : glass)}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </fieldset>
        </div>
      </Sheet>
    </div>
  );
}
