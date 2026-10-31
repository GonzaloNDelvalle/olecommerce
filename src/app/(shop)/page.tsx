import { Suspense } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import {
  getActiveCategories,
  getLatestProducts,
} from "@/modules/products/actions";
import { ProductCard } from "@/modules/products/components/ProductCard";
import { EditorialHeroParallax } from "@/components/shop/EditorialHeroParallax";
import { StaggerGrid, StaggerItem } from "@/components/shop/EditorialMotion";

export const metadata: Metadata = {
  title: "OL. | Neutral State — FW'26 | OL Indumenti",
  description:
    "Colección Neutral State FW'26 de OL Indumenti. Sastrería minimalista, denim y siluetas atemporales en tonos neutros.",
};

interface EditorialBlock {
  id: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  defaultSlug: string;
  imageUrl: string;
  gridSpanClass: string;
  aspectClass: string;
}

const EDITORIAL_BLOCKS: EditorialBlock[] = [
  {
    id: "minimal-tailoring",
    eyebrow: "01 / SASTRERÍA & ESTRUCTURA",
    title: "Partes de Arriba & Blazers",
    subtitle: "Cortes arquitectónicos en lanas frías, crudos y tonos piedra.",
    defaultSlug: "partes-de-arriba",
    imageUrl:
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1400&q=85",
    gridSpanClass: "lg:col-span-7",
    aspectClass: "aspect-[4/5] sm:aspect-[16/11] lg:aspect-[16/12]",
  },
  {
    id: "denim-line",
    eyebrow: "02 / DENIM ARCHIVE",
    title: "Denim & Pantalones",
    subtitle:
      "Calces relajados de tiro alto en lavados neutros y algodón orgánico.",
    defaultSlug: "denim",
    imageUrl:
      "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=1200&q=85",
    gridSpanClass: "lg:col-span-5",
    aspectClass: "aspect-[4/5] lg:aspect-[4/4.65]",
  },
  {
    id: "neutral-aesthetic",
    eyebrow: "03 / TEXTURAS NATURALES",
    title: "Tejidos & Esenciales",
    subtitle: "Hilados suaves en paleta arena, hueso y chocolate profundo.",
    defaultSlug: "tejidos",
    imageUrl:
      "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?auto=format&fit=crop&w=1200&q=85",
    gridSpanClass: "lg:col-span-5",
    aspectClass: "aspect-[4/5] lg:aspect-[4/4.65]",
  },
  {
    id: "fluid-silhouettes",
    eyebrow: "04 / SILUETAS FLUIDAS",
    title: "Vestidos & Monocromo",
    subtitle:
      "Caídas limpias y minimalismo contemporáneo para el día y la noche.",
    defaultSlug: "vestidos",
    imageUrl:
      "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1400&q=85",
    gridSpanClass: "lg:col-span-7",
    aspectClass: "aspect-[4/5] sm:aspect-[16/11] lg:aspect-[16/12]",
  },
];

async function FeaturedCategoriesGrid() {
  const categories = await getActiveCategories();
  const categoriesBySlug = new Map(categories.map((c) => [c.slug, c]));

  return (
    <StaggerGrid
      className="grid grid-cols-1 gap-6 lg:grid-cols-12"
      staggerDelay={0.12}
    >
      {EDITORIAL_BLOCKS.map((block, index) => {
        const matchedBySlug = categoriesBySlug.get(block.defaultSlug);
        const matchedCategory = matchedBySlug ?? categories[index];
        const targetCategorySlug = matchedCategory?.slug ?? block.defaultSlug;
        const displayTitle = matchedCategory?.name ?? block.title;

        return (
          <StaggerItem key={block.id} className={block.gridSpanClass}>
            <Link
              href={`/productos?categoria=${encodeURIComponent(targetCategorySlug)}`}
              className="group relative block overflow-hidden rounded-none border border-stone-200 bg-stone-200"
            >
              <div
                className={`relative w-full overflow-hidden ${block.aspectClass}`}
              >
                <Image
                  src={block.imageUrl}
                  alt={displayTitle}
                  fill
                  sizes="(max-width: 1024px) 100vw, 58vw"
                  className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
                />

                {/* Velo editorial sutil */}
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950/75 via-stone-950/20 to-transparent transition-opacity duration-500 group-hover:from-stone-950/85" />

                {/* Contenido del Bloque */}
                <div className="absolute inset-0 flex flex-col justify-between p-6 sm:p-8 lg:p-10">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold tracking-[0.28em] text-stone-200 uppercase">
                      {block.eyebrow}
                    </span>
                    <span className="flex h-9 w-9 items-center justify-center border border-stone-100/40 bg-black/20 text-stone-100 backdrop-blur-xs transition-colors duration-300 group-hover:border-[#D2B48C] group-hover:bg-[#5C4033] group-hover:text-white">
                      <ArrowUpRight className="h-4 w-4" />
                    </span>
                  </div>

                  <div className="max-w-md">
                    <h3 className="font-serif text-3xl font-normal tracking-[0.06em] text-stone-50 uppercase sm:text-4xl">
                      {displayTitle}
                    </h3>
                    <p className="mt-2 text-xs font-light leading-relaxed text-stone-200/90 sm:text-sm">
                      {block.subtitle}
                    </p>
                    <span className="mt-4 inline-block border-b border-stone-200/70 pb-1 text-[11px] font-medium tracking-[0.22em] text-stone-100 uppercase transition-colors group-hover:border-[#D2B48C] group-hover:text-[#D2B48C]">
                      Ver Categoría
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          </StaggerItem>
        );
      })}
    </StaggerGrid>
  );
}

async function NewArrivalsSectionContent() {
  const newArrivals = await getLatestProducts(4);

  if (newArrivals.length === 0) return null;

  return (
    <StaggerGrid
      className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4"
      staggerDelay={0.1}
    >
      {newArrivals.map((product) => (
        <StaggerItem key={product.id}>
          <ProductCard product={product} />
        </StaggerItem>
      ))}
    </StaggerGrid>
  );
}

export default function EditorialHomePage() {
  return (
    <main className="bg-white">
      {/* 1. HERO BANNER A PANTALLA COMPLETA CON VIDEO EN LOOP Y PARALLAX */}
      <EditorialHeroParallax />

      {/* 2. SECCIÓN DE DESTACADOS (CUADRÍCULA ASIMÉTRICA EN BG-STONE-50) */}
      <section className="border-t border-stone-200 bg-stone-50 py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 flex flex-col justify-between gap-4 border-b border-stone-200 pb-8 sm:flex-row sm:items-end">
            <div>
              <p className="text-[11px] font-semibold tracking-[0.28em] text-[#5C4033] uppercase">
                Curaduría de Temporada
              </p>
              <h2 className="mt-2 font-serif text-3xl font-normal tracking-[0.08em] text-stone-900 uppercase sm:text-4xl">
                Categorías Destacadas
              </h2>
            </div>

            <Link
              href="/productos"
              className="inline-flex items-center gap-1.5 text-xs font-medium tracking-[0.2em] text-stone-800 uppercase transition-colors hover:text-[#5C4033]"
            >
              <span>Ver Todo el Catálogo</span>
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>

          <Suspense
            fallback={
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                <div className="aspect-[16/12] animate-pulse bg-stone-200 lg:col-span-7" />
                <div className="aspect-[4/4.65] animate-pulse bg-stone-200 lg:col-span-5" />
                <div className="aspect-[4/4.65] animate-pulse bg-stone-200 lg:col-span-5" />
                <div className="aspect-[16/12] animate-pulse bg-stone-200 lg:col-span-7" />
              </div>
            }
          >
            <FeaturedCategoriesGrid />
          </Suspense>
        </div>
      </section>

      {/* 3. SECCIÓN "NOVEDADES" (NEW ARRIVALS - 4 COLUMNAS CON HOVER DE 2DA IMAGEN) */}
      <section className="border-t border-stone-200 bg-white py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 flex flex-col justify-between gap-4 border-b border-stone-200 pb-8 sm:flex-row sm:items-end">
            <div>
              <p className="text-[11px] font-semibold tracking-[0.28em] text-[#5C4033] uppercase">
                New Arrivals • FW&apos;26
              </p>
              <h2 className="mt-2 font-serif text-3xl font-normal tracking-[0.08em] text-stone-900 uppercase sm:text-4xl">
                Novedades
              </h2>
            </div>

            <Link
              href="/productos?orden=recientes"
              className="inline-flex items-center gap-1.5 text-xs font-medium tracking-[0.2em] text-stone-800 uppercase transition-colors hover:text-[#5C4033]"
            >
              <span>Explorar Lanzamientos</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <Suspense
            fallback={
              <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex flex-col gap-3">
                    <div className="aspect-[3/4] w-full animate-pulse rounded-none bg-stone-100" />
                    <div className="h-3 w-20 animate-pulse rounded-none bg-stone-100" />
                    <div className="h-4 w-3/4 animate-pulse rounded-none bg-stone-100" />
                    <div className="h-5 w-24 animate-pulse rounded-none bg-stone-100" />
                  </div>
                ))}
              </div>
            }
          >
            <NewArrivalsSectionContent />
          </Suspense>
        </div>
      </section>

      {/* 4. BANNER "NEUTRAL STATE" / MANIFIESTO & NEWSLETTER (CHOCOLATE OSCURO) */}
      <section className="bg-[#2C2119] py-24 text-stone-100 sm:py-32">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <p className="text-[10px] font-semibold tracking-[0.35em] text-[#D2B48C] uppercase sm:text-[11px]">
            Manifiesto OL. — Neutral State
          </p>

          <h2 className="mt-6 font-serif text-3xl leading-snug font-normal tracking-[0.06em] text-stone-100 italic sm:text-5xl lg:text-6xl">
            &ldquo;Prendas versátiles. Estado de calma y equilibrio.&rdquo;
          </h2>

          <p className="mx-auto mt-5 max-w-xl text-xs leading-relaxed text-stone-300/80 sm:text-sm">
            Suscribite a nuestro archivo privado para recibir acceso anticipado a
            nuevos lanzamientos de cápsula, preventas exclusivas y ediciones
            limitadas.
          </p>

          <form
            action="/productos"
            method="get"
            className="mx-auto mt-10 flex max-w-md flex-col items-center gap-4 sm:flex-row sm:items-end"
          >
            <div className="w-full flex-1">
              <label htmlFor="newsletter-email" className="sr-only">
                Correo electrónico
              </label>
              <input
                id="newsletter-email"
                type="email"
                required
                placeholder="Ingresá tu correo electrónico..."
                className="w-full border-0 border-b border-stone-100/40 bg-transparent px-1 py-3 text-xs tracking-wider text-stone-100 placeholder:text-stone-400 focus:border-[#D2B48C] focus:outline-none sm:text-sm"
              />
            </div>

            <button
              type="submit"
              className="inline-flex shrink-0 items-center gap-2 border-b border-[#D2B48C] px-2 py-3 text-xs font-semibold tracking-[0.25em] text-stone-100 uppercase transition-colors hover:border-stone-100 hover:text-[#D2B48C]"
            >
              <span>Suscribirme</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
