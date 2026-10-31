import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import {
  getActiveCategories,
  getActiveProducts,
  getAvailableSizes,
} from "@/modules/products/actions";
import { ProductCard } from "@/modules/products/components/ProductCard";
import { CatalogFilterBar } from "@/components/shop/CatalogFilterBar";
import { StaggerGrid, StaggerItem } from "@/components/shop/EditorialMotion";

export const metadata: Metadata = {
  title: "Catálogo de Prendas — FW'26",
  description:
    "Explorá el catálogo completo de OL Indumenti. Sastrería, denim y esenciales minimalistas con envíos a todo el país.",
};

interface ShopCatalogSearchParams {
  categoria?: string;
  q?: string;
  talle?: string;
  orden?: string;
  precio_min?: string;
  precio_max?: string;
}

interface ShopCatalogPageProps {
  searchParams: Promise<ShopCatalogSearchParams>;
}

async function CatalogContent({
  searchParamsPromise,
}: {
  searchParamsPromise: Promise<ShopCatalogSearchParams>;
}) {
  const { categoria, q, talle, orden, precio_min, precio_max } =
    await searchParamsPromise;

  const parsedMinPrice = precio_min ? Number(precio_min) : undefined;
  const parsedMaxPrice = precio_max ? Number(precio_max) : undefined;

  const [products, categories, sizes] = await Promise.all([
    getActiveProducts({
      categorySlug: categoria,
      searchQuery: q,
      sizeName: talle,
      sortBy: orden,
      minPrice:
        parsedMinPrice && !Number.isNaN(parsedMinPrice)
          ? parsedMinPrice
          : undefined,
      maxPrice:
        parsedMaxPrice && !Number.isNaN(parsedMaxPrice)
          ? parsedMaxPrice
          : undefined,
    }),
    getActiveCategories(),
    getAvailableSizes(),
  ]);

  const hasActiveFilters = Boolean(
    categoria ||
      q?.trim() ||
      talle?.trim() ||
      parsedMinPrice ||
      parsedMaxPrice ||
      (orden && orden !== "recientes")
  );

  return (
    <div>
      {/* Barra Horizontal Superior Editorial + Drawer Lateral de Filtros */}
      <CatalogFilterBar
        categories={categories}
        sizes={sizes}
        productsCount={products.length}
        activeCategorySlug={categoria}
        activeSearchQuery={q}
        activeSizeName={talle}
        activeSort={orden}
        activeMinPrice={parsedMinPrice}
        activeMaxPrice={parsedMaxPrice}
      />

      {/* Grilla a Pantalla Completa en 3 Columnas (Aspect Ratio 3:4 de Campaña) */}
      {products.length === 0 ? (
        <div className="flex min-h-[380px] flex-col items-center justify-center rounded-none border border-stone-200 bg-stone-50 p-12 text-center">
          <p className="font-serif text-2xl font-normal tracking-[0.08em] text-stone-900 uppercase">
            No encontramos prendas con estos filtros
          </p>
          <p className="mt-2 max-w-md text-xs font-light leading-relaxed text-stone-500">
            Probá buscando otro término o limpiando los filtros seleccionados en
            el panel superior.
          </p>
          {hasActiveFilters && (
            <Link
              href="/productos"
              className="mt-7 inline-flex items-center rounded-none bg-stone-900 px-7 py-3.5 text-[11px] font-medium tracking-[0.22em] text-white uppercase transition-colors hover:bg-[#2C2119]"
            >
              Ver Todo el Catálogo
            </Link>
          )}
        </div>
      ) : (
        <StaggerGrid
          className="grid grid-cols-1 gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3"
          staggerDelay={0.08}
        >
          {products.map((product) => (
            <StaggerItem key={product.id}>
              <ProductCard product={product} />
            </StaggerItem>
          ))}
        </StaggerGrid>
      )}
    </div>
  );
}

function CatalogSkeleton() {
  return (
    <div className="space-y-10">
      <div className="h-16 w-full animate-pulse border-y border-stone-200 bg-stone-50" />
      <div className="grid grid-cols-1 gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-3">
            <div className="aspect-[3/4] w-full animate-pulse rounded-none bg-stone-100" />
            <div className="h-3 w-20 animate-pulse rounded-none bg-stone-100" />
            <div className="h-4 w-3/4 animate-pulse rounded-none bg-stone-100" />
            <div className="h-5 w-24 animate-pulse rounded-none bg-stone-100" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ShopCatalogPage({
  searchParams,
}: ShopCatalogPageProps) {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
      {/* Encabezado Editorial Minimalista */}
      <header className="mb-10">
        <p className="text-[11px] font-medium tracking-[0.28em] text-[#5C4033] uppercase">
          Neutral State — FW&apos;26 • Colección Exclusiva
        </p>
        <h1 className="mt-3 font-serif text-4xl font-normal tracking-[0.08em] text-stone-900 uppercase sm:text-5xl">
          Catálogo de Prendas
        </h1>
        <p className="mt-3 max-w-2xl text-xs font-light leading-relaxed tracking-wide text-stone-600 sm:text-sm">
          Piezas sastreras y esenciales de diseño confeccionadas con géneros
          nobles y calce pensado para acompañarte todos los días.
        </p>
      </header>

      {/* Barra Superior de Filtros + Grilla de 3 Columnas a Pantalla Completa */}
      <Suspense fallback={<CatalogSkeleton />}>
        <CatalogContent searchParamsPromise={searchParams} />
      </Suspense>
    </main>
  );
}
