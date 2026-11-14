"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SlidersHorizontal, X } from "lucide-react";
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
  "pressable inline-flex h-10 shrink-0 items-center gap-2 rounded-full border border-stone-300 bg-white px-4 text-sm font-medium whitespace-nowrap text-ink transition-colors duration-150 hover:border-ink";
const pillOn = "border-ink bg-ink text-paper hover:border-ink";

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

  function hrefWith(changes: Partial<CatalogFilterState>) {
    const next: Record<string, string | undefined> = { ...filters, ...changes };
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(next)) {
      if (value && !(key === "orden" && value === "recientes")) params.set(key, value);
    }
    const query = params.toString();
    return query ? `${basePath}?${query}` : basePath;
  }

  function apply(changes: Partial<CatalogFilterState>) {
    startTransition(() => {
      router.push(hrefWith(changes), { scroll: false });
    });
  }

  const activePreset = PRICE_PRESETS.find(
    (p) => String(p.min ?? "") === (filters.precio_min ?? "") && String(p.max ?? "") === (filters.precio_max ?? ""),
  );

  const chips: { key: string; label: string; clear: Partial<CatalogFilterState> }[] = [];
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
  const activeCount = (filters.talle ? 1 : 0) + (filters.precio_min || filters.precio_max ? 1 : 0);

  const visibleCategories = categories.filter((c) => c.productsCount > 0);

  return (
    <div className="flex flex-col">
      {/* Categorías */}
      <nav aria-label="Categorías" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-5 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0">
        <Link href="/productos" aria-current={!activeCategorySlug ? "page" : undefined} className={cn(pill, !activeCategorySlug && pillOn)}>
          Todo
        </Link>
        {visibleCategories.map((category) => {
          const active = category.slug === activeCategorySlug;
          return (
            <Link
              key={category.id}
              href={categoryHref(category.slug)}
              aria-current={active ? "page" : undefined}
              className={cn(pill, active && pillOn)}
            >
              {category.name}
            </Link>
          );
        })}
      </nav>

      {/* Barra sticky: filtros + orden */}
      <div className="sticky top-[76px] z-30 -mx-4 border-y border-stone-200 bg-paper/95 px-4 py-3 backdrop-blur-sm sm:top-[88px] sm:mx-0 sm:px-0">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 overflow-x-auto [scrollbar-width:none]">
            <button type="button" onClick={() => setSheetOpen(true)} className={pill} aria-haspopup="dialog">
              <SlidersHorizontal className="size-4" strokeWidth={1.8} aria-hidden="true" />
              Filtros
              {activeCount > 0 && (
                <span className="tabular rounded-full bg-chocolate px-1.5 text-[11px] font-bold text-paper">{activeCount}</span>
              )}
            </button>
            <div className="hidden items-center gap-2 md:flex" role="group" aria-label="Talle">
              {sizes.slice(0, 7).map((size) => {
                const active = filters.talle?.toLowerCase() === size.name.toLowerCase();
                return (
                  <button
                    key={size.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => apply({ talle: active ? undefined : size.name })}
                    className={cn(pill, "min-w-10 justify-center px-3", active && pillOn)}
                  >
                    {size.name}
                  </button>
                );
              })}
            </div>
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
                className="h-10 rounded-full border border-stone-300 bg-white pr-8 pl-4 text-sm font-medium text-ink"
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
                href={hrefWith(chip.clear)}
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
            className="min-h-9 px-2 text-[13px] font-semibold text-chocolate underline underline-offset-4"
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
                    className={cn(pill, "h-12 min-w-14 justify-center", active && pillOn)}
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
                    "flex h-12 items-center justify-between rounded-xl border px-4 text-left text-[15px] transition-colors",
                    active ? "border-ink bg-cream font-semibold" : "border-stone-200 hover:border-stone-400",
                  )}
                >
                  {preset.label}
                  <span
                    aria-hidden="true"
                    className={cn("size-5 rounded-full border-[1.5px] border-stone-400", active && "border-[6px] border-ink")}
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
                    className={cn(pill, "h-11", active && pillOn)}
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
