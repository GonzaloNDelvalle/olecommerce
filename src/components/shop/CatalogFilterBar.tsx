"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Plus, X, Check } from "lucide-react";
import type {
  PublicCategoryDTO,
  PublicSizeDTO,
} from "@/modules/products/actions";

interface CatalogFilterBarProps {
  categories: PublicCategoryDTO[];
  sizes: PublicSizeDTO[];
  productsCount: number;
  activeCategorySlug?: string;
  activeSearchQuery?: string;
  activeSizeName?: string;
  activeSort?: string;
  activeMinPrice?: number;
  activeMaxPrice?: number;
}

const PRICE_PRESETS: {
  id: string;
  label: string;
  min?: number;
  max?: number;
}[] = [
  { id: "all", label: "Todos los precios" },
  { id: "under-55k", label: "Hasta $55.000", max: 55000 },
  { id: "55k-85k", label: "$55.000 — $85.000", min: 55000, max: 85000 },
  { id: "over-85k", label: "Más de $85.000", min: 85000 },
];

const arsFormatter = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

export function CatalogFilterBar({
  categories,
  sizes,
  productsCount,
  activeCategorySlug,
  activeSearchQuery,
  activeSizeName,
  activeSort,
  activeMinPrice,
  activeMaxPrice,
}: CatalogFilterBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [minPriceInput, setMinPriceInput] = useState(
    activeMinPrice ? String(activeMinPrice) : ""
  );
  const [maxPriceInput, setMaxPriceInput] = useState(
    activeMaxPrice ? String(activeMaxPrice) : ""
  );

  useEffect(() => {
    setMinPriceInput(activeMinPrice ? String(activeMinPrice) : "");
    setMaxPriceInput(activeMaxPrice ? String(activeMaxPrice) : "");
  }, [activeMinPrice, activeMaxPrice]);

  useEffect(() => {
    if (!isDrawerOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsDrawerOpen(false);
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isDrawerOpen]);

  const totalProductsAcrossCategories = categories.reduce(
    (acc, cat) => acc + cat.productsCount,
    0
  );

  const activeFiltersCount = [
    activeCategorySlug,
    activeSearchQuery?.trim(),
    activeSizeName?.trim(),
    activeMinPrice || activeMaxPrice ? "price" : undefined,
  ].filter(Boolean).length;

  function buildUrl(overrides: {
    categoria?: string | null;
    q?: string | null;
    talle?: string | null;
    orden?: string | null;
    precio_min?: string | number | null;
    precio_max?: string | number | null;
  }) {
    const params = new URLSearchParams(searchParams.toString());

    const applyParam = (
      key: string,
      val: string | number | null | undefined
    ) => {
      if (val === undefined) return;
      if (val === null || String(val).trim() === "") {
        params.delete(key);
      } else {
        params.set(key, String(val).trim());
      }
    };

    applyParam("categoria", overrides.categoria);
    applyParam("q", overrides.q);
    applyParam("talle", overrides.talle);
    applyParam(
      "orden",
      overrides.orden === "recientes" ? null : overrides.orden
    );
    applyParam("precio_min", overrides.precio_min);
    applyParam("precio_max", overrides.precio_max);

    const qs = params.toString();
    return qs ? `/productos?${qs}` : "/productos";
  }

  function handleSortChange(e: React.ChangeEvent<HTMLSelectElement>) {
    router.push(buildUrl({ orden: e.target.value }));
  }

  function handleApplyPriceRange(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    router.push(
      buildUrl({
        precio_min: minPriceInput.trim() || null,
        precio_max: maxPriceInput.trim() || null,
      })
    );
  }

  function handleSelectPreset(min?: number, max?: number) {
    setMinPriceInput(min ? String(min) : "");
    setMaxPriceInput(max ? String(max) : "");
    router.push(
      buildUrl({
        precio_min: min ?? null,
        precio_max: max ?? null,
      })
    );
  }

  const currentSort = activeSort ?? "recientes";
  const activeCategoryName = categories.find(
    (c) => c.slug === activeCategorySlug
  )?.name;

  return (
    <>
      {/* BARRA HORIZONTAL SUPERIOR EDITORIAL */}
      <div className="mb-10 border-y border-stone-200 bg-white py-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Izquierda: Botón FILTRAR (+) y Chips de Filtros Activos */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setIsDrawerOpen(true)}
              className="inline-flex items-center gap-2.5 rounded-none border border-stone-900 bg-white px-5 py-2.5 text-[11px] font-medium tracking-[0.22em] text-stone-900 uppercase transition-colors hover:bg-stone-900 hover:text-white"
            >
              <span>
                Filtrar{activeFiltersCount > 0 ? ` (${activeFiltersCount})` : ""}
              </span>
              <Plus className="h-3.5 w-3.5" strokeWidth={1.6} />
            </button>

            {activeSearchQuery?.trim() && (
              <Link
                href={buildUrl({ q: null })}
                className="inline-flex items-center gap-1.5 rounded-none border border-stone-300 bg-stone-50 px-3 py-2 text-[10px] font-normal tracking-[0.16em] text-stone-800 uppercase transition-colors hover:border-stone-900"
              >
                <span>&ldquo;{activeSearchQuery.trim()}&rdquo;</span>
                <X className="h-3 w-3" />
              </Link>
            )}

            {activeCategorySlug && (
              <Link
                href={buildUrl({ categoria: null })}
                className="inline-flex items-center gap-1.5 rounded-none border border-stone-300 bg-stone-50 px-3 py-2 text-[10px] font-normal tracking-[0.16em] text-stone-800 uppercase transition-colors hover:border-stone-900"
              >
                <span>{activeCategoryName ?? activeCategorySlug}</span>
                <X className="h-3 w-3" />
              </Link>
            )}

            {activeSizeName?.trim() && (
              <Link
                href={buildUrl({ talle: null })}
                className="inline-flex items-center gap-1.5 rounded-none border border-stone-300 bg-stone-50 px-3 py-2 text-[10px] font-normal tracking-[0.16em] text-stone-800 uppercase transition-colors hover:border-stone-900"
              >
                <span>Talle {activeSizeName.trim()}</span>
                <X className="h-3 w-3" />
              </Link>
            )}

            {(activeMinPrice || activeMaxPrice) && (
              <Link
                href={buildUrl({ precio_min: null, precio_max: null })}
                className="inline-flex items-center gap-1.5 rounded-none border border-stone-300 bg-stone-50 px-3 py-2 text-[10px] font-normal tracking-[0.16em] text-stone-800 uppercase transition-colors hover:border-stone-900"
              >
                <span>
                  {activeMinPrice && activeMaxPrice
                    ? `${arsFormatter.format(activeMinPrice)} – ${arsFormatter.format(activeMaxPrice)}`
                    : activeMinPrice
                      ? `Desde ${arsFormatter.format(activeMinPrice)}`
                      : `Hasta ${arsFormatter.format(activeMaxPrice!)}`}
                </span>
                <X className="h-3 w-3" />
              </Link>
            )}

            {activeFiltersCount > 0 && (
              <Link
                href="/productos"
                className="ml-1 text-[10px] font-light tracking-[0.18em] text-stone-500 uppercase underline underline-offset-4 transition-colors hover:text-stone-950"
              >
                Limpiar todo
              </Link>
            )}
          </div>

          {/* Derecha: Conteo de Prendas + Selector de Ordenamiento */}
          <div className="flex items-center gap-6">
            <span className="text-[11px] font-light tracking-[0.2em] text-stone-500 uppercase">
              {productsCount} {productsCount === 1 ? "Prenda" : "Prendas"}
            </span>

            <div className="flex items-center gap-2.5">
              <label
                htmlFor="editorial-sort-select"
                className="hidden text-[10px] font-light tracking-[0.2em] text-stone-400 uppercase sm:inline"
              >
                Ordenar:
              </label>
              <select
                id="editorial-sort-select"
                value={currentSort}
                onChange={handleSortChange}
                className="rounded-none border border-stone-200 bg-white px-3.5 py-2 text-[11px] font-normal tracking-[0.16em] text-stone-900 uppercase transition-colors focus:border-stone-900 focus:outline-none"
              >
                <option value="recientes">Destacados / Recientes</option>
                <option value="precio_asc">Precio: Menor a Mayor</option>
                <option value="precio_desc">Precio: Mayor a Menor</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* DRAWER DESLIZABLE LATERAL DE FILTROS (SHEET CON BORDES RECTOS Y FONDO CREMA/BLANCO) */}
      <AnimatePresence>
        {isDrawerOpen && (
          <div
            className="fixed inset-0 z-50 overflow-hidden"
            role="dialog"
            aria-modal="true"
            aria-labelledby="filter-drawer-title"
          >
            {/* Backdrop oscuro sutil */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              onClick={() => setIsDrawerOpen(false)}
              className="fixed inset-0 bg-stone-950/45 backdrop-blur-xs"
              aria-hidden="true"
            />

            <div className="fixed inset-y-0 left-0 flex max-w-full pr-10">
              <motion.aside
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="flex w-screen max-w-md flex-col rounded-none border-r border-stone-200 bg-[#FAF9F6] text-stone-900 shadow-2xl"
              >
                {/* Cabecera del Sheet */}
                <div className="flex items-center justify-between border-b border-stone-200 bg-white px-7 py-6">
                  <div>
                    <p className="text-[10px] font-medium tracking-[0.28em] text-[#5C4033] uppercase">
                      Refinar Selección
                    </p>
                    <h2
                      id="filter-drawer-title"
                      className="mt-1 font-serif text-2xl font-normal tracking-[0.12em] text-stone-900 uppercase"
                    >
                      Filtros
                    </h2>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsDrawerOpen(false)}
                    aria-label="Cerrar panel de filtros"
                    className="rounded-none border border-transparent p-2 text-stone-500 transition-colors hover:border-stone-200 hover:text-stone-950"
                  >
                    <X className="h-5 w-5" strokeWidth={1.4} />
                  </button>
                </div>

                {/* Cuerpo del Sheet con Scroll Independiente */}
                <div
                  data-lenis-prevent
                  className="flex-1 space-y-9 overflow-y-auto px-7 py-8"
                >
                  {/* 1. Categorías */}
                  <section>
                    <h3 className="text-[11px] font-semibold tracking-[0.24em] text-stone-900 uppercase">
                      01 / Categorías
                    </h3>

                    <ul className="mt-4 divide-y divide-stone-200/80 border-y border-stone-200/80 bg-white">
                      <li>
                        <Link
                          href={buildUrl({ categoria: null })}
                          onClick={() => setIsDrawerOpen(false)}
                          className={`flex items-center justify-between px-4 py-3.5 text-xs tracking-[0.14em] uppercase transition-colors ${
                            !activeCategorySlug
                              ? "bg-stone-900 font-medium text-white"
                              : "font-light text-stone-700 hover:bg-stone-100 hover:text-stone-950"
                          }`}
                        >
                          <span>Todas las Prendas</span>
                          <span className="text-[10px] opacity-75">
                            ({totalProductsAcrossCategories})
                          </span>
                        </Link>
                      </li>

                      {categories.map((category) => {
                        const isSelected = activeCategorySlug === category.slug;
                        return (
                          <li key={category.id}>
                            <Link
                              href={buildUrl({
                                categoria: isSelected ? null : category.slug,
                              })}
                              onClick={() => setIsDrawerOpen(false)}
                              className={`flex items-center justify-between px-4 py-3.5 text-xs tracking-[0.14em] uppercase transition-colors ${
                                isSelected
                                  ? "bg-stone-900 font-medium text-white"
                                  : "font-light text-stone-700 hover:bg-stone-100 hover:text-stone-950"
                              }`}
                            >
                              <span>{category.name}</span>
                              <span className="text-[10px] opacity-75">
                                ({category.productsCount})
                              </span>
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </section>

                  {/* 2. Talles */}
                  {sizes.length > 0 && (
                    <section>
                      <div className="flex items-center justify-between">
                        <h3 className="text-[11px] font-semibold tracking-[0.24em] text-stone-900 uppercase">
                          02 / Talles
                        </h3>
                        {activeSizeName && (
                          <Link
                            href={buildUrl({ talle: null })}
                            onClick={() => setIsDrawerOpen(false)}
                            className="text-[10px] font-light tracking-[0.18em] text-stone-500 uppercase underline underline-offset-4 hover:text-stone-900"
                          >
                            Todos
                          </Link>
                        )}
                      </div>

                      <div className="mt-4 grid grid-cols-4 gap-2.5">
                        {sizes.map((size) => {
                          const isSelected =
                            activeSizeName?.toUpperCase() ===
                            size.name.toUpperCase();

                          return (
                            <Link
                              key={size.id}
                              href={buildUrl({
                                talle: isSelected ? null : size.name,
                              })}
                              onClick={() => setIsDrawerOpen(false)}
                              className={`flex h-11 items-center justify-center rounded-none border text-xs font-normal tracking-[0.16em] uppercase transition-colors ${
                                isSelected
                                  ? "border-stone-900 bg-stone-900 text-white"
                                  : "border-stone-200 bg-white text-stone-800 hover:border-stone-900"
                              }`}
                            >
                              {size.name}
                            </Link>
                          );
                        })}
                      </div>
                    </section>
                  )}

                  {/* 3. Rango de Precio */}
                  <section>
                    <h3 className="text-[11px] font-semibold tracking-[0.24em] text-stone-900 uppercase">
                      03 / Rango de Precio (ARS)
                    </h3>

                    <div className="mt-4 space-y-2">
                      {PRICE_PRESETS.map((preset) => {
                        const isPresetSelected =
                          (preset.min ?? undefined) === activeMinPrice &&
                          (preset.max ?? undefined) === activeMaxPrice;

                        return (
                          <button
                            key={preset.id}
                            type="button"
                            onClick={() => {
                              handleSelectPreset(preset.min, preset.max);
                              setIsDrawerOpen(false);
                            }}
                            className={`flex w-full items-center justify-between rounded-none border px-4 py-3 text-left text-xs tracking-[0.12em] uppercase transition-colors ${
                              isPresetSelected
                                ? "border-stone-900 bg-stone-900 font-medium text-white"
                                : "border-stone-200 bg-white font-light text-stone-700 hover:border-stone-900"
                            }`}
                          >
                            <span>{preset.label}</span>
                            {isPresetSelected && (
                              <Check className="h-3.5 w-3.5" />
                            )}
                          </button>
                        );
                      })}
                    </div>

                    <form
                      onSubmit={(e) => {
                        handleApplyPriceRange(e);
                        setIsDrawerOpen(false);
                      }}
                      className="mt-4 grid grid-cols-2 gap-3 border border-stone-200 bg-white p-4"
                    >
                      <div>
                        <label
                          htmlFor="filter-min-price"
                          className="block text-[10px] font-light tracking-[0.18em] text-stone-500 uppercase"
                        >
                          Mínimo ($)
                        </label>
                        <input
                          id="filter-min-price"
                          type="number"
                          min={0}
                          placeholder="0"
                          value={minPriceInput}
                          onChange={(e) => setMinPriceInput(e.target.value)}
                          className="mt-1.5 w-full rounded-none border border-stone-200 bg-stone-50 px-3 py-2 text-xs text-stone-900 focus:border-stone-900 focus:bg-white focus:outline-none"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="filter-max-price"
                          className="block text-[10px] font-light tracking-[0.18em] text-stone-500 uppercase"
                        >
                          Máximo ($)
                        </label>
                        <input
                          id="filter-max-price"
                          type="number"
                          min={0}
                          placeholder="150000"
                          value={maxPriceInput}
                          onChange={(e) => setMaxPriceInput(e.target.value)}
                          className="mt-1.5 w-full rounded-none border border-stone-200 bg-stone-50 px-3 py-2 text-xs text-stone-900 focus:border-stone-900 focus:bg-white focus:outline-none"
                        />
                      </div>

                      <button
                        type="submit"
                        className="col-span-2 mt-1 rounded-none border border-stone-900 bg-stone-900 py-2.5 text-[10px] font-medium tracking-[0.22em] text-white uppercase transition-colors hover:bg-[#2C2119]"
                      >
                        Aplicar Rango
                      </button>
                    </form>
                  </section>
                </div>

                {/* Pie del Sheet */}
                <div className="grid grid-cols-2 gap-3 border-t border-stone-200 bg-white px-7 py-5">
                  <Link
                    href="/productos"
                    onClick={() => setIsDrawerOpen(false)}
                    className="flex items-center justify-center rounded-none border border-stone-300 bg-white py-3.5 text-[11px] font-normal tracking-[0.2em] text-stone-800 uppercase transition-colors hover:border-stone-900"
                  >
                    Limpiar
                  </Link>
                  <button
                    type="button"
                    onClick={() => setIsDrawerOpen(false)}
                    className="flex items-center justify-center rounded-none bg-stone-900 py-3.5 text-[11px] font-medium tracking-[0.2em] text-white uppercase transition-colors hover:bg-[#2C2119]"
                  >
                    Ver ({productsCount})
                  </button>
                </div>
              </motion.aside>
            </div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
