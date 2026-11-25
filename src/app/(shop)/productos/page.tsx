import { Suspense } from "react";
import type { Metadata } from "next";
import { getSiteContent } from "@/modules/content/site-content";
import { getSiteTexts } from "@/modules/content/site-texts";
import { fillText } from "@/modules/content/texts";
import { CatalogView, CatalogSkeleton, type CatalogSearchParams } from "@/components/shop/CatalogView";
import { Breadcrumbs } from "@/components/shop/Breadcrumbs";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<CatalogSearchParams>;
}): Promise<Metadata> {
  const { pagina, q } = await searchParams;
  const page = Number(pagina) > 1 ? Number(pagina) : 1;
  return {
    title: page > 1 ? `Tienda · página ${page}` : "Shop: toda la colección",
    description:
      "Toda la colección de OL. Indumenti: sastrería, tejidos y básicos en tonos tierra. Filtrá por talle y precio. Envíos a todo el país.",
    // Cada página de la paginación es su propia URL canónica; las búsquedas no se indexan
    alternates: { canonical: page > 1 ? `/productos?pagina=${page}` : "/productos" },
    ...(q ? { robots: { index: false, follow: true } } : {}),
  };
}

async function CatalogHeading() {
  const [{ collectionName, seasonLabel }, texts] = await Promise.all([getSiteContent(), getSiteTexts()]);
  const eyebrow = fillText(texts["shop.eyebrow"], { coleccion: collectionName, temporada: seasonLabel });
  return (
    <>
      {eyebrow && <p className="eyebrow text-chocolate">{eyebrow}</p>}
      <h1 className="display text-[clamp(64px,12vw,200px)] text-ink">{texts["shop.title"] || "Shop"}</h1>
    </>
  );
}

async function CatalogDescription() {
  const texts = await getSiteTexts();
  return texts["shop.description"] ? (
    <p className="max-w-[520px] text-base leading-relaxed text-stone-700">{texts["shop.description"]}</p>
  ) : null;
}

async function SearchHeading({ searchParams }: { searchParams: Promise<CatalogSearchParams> }) {
  const { q } = await searchParams;
  return q ? (
    <p className="text-[15px] text-stone-700">
      Resultados para <span className="font-semibold text-ink">“{q}”</span>
    </p>
  ) : null;
}

async function Catalog({ searchParams }: { searchParams: Promise<CatalogSearchParams> }) {
  return <CatalogView basePath="/productos" searchParams={await searchParams} />;
}

export default function CatalogPage({ searchParams }: { searchParams: Promise<CatalogSearchParams> }) {
  return (
    <main className="mx-auto w-full max-w-none px-4 pt-6 sm:px-10">
      <Breadcrumbs crumbs={[{ name: "Inicio", path: "/" }, { name: "Shop" }]} />

      <header className="grid gap-6 pt-10 pb-8 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:items-end">
        <div className="flex flex-col gap-3">
          <Suspense fallback={<div className="h-32" />}>
            <CatalogHeading />
          </Suspense>
          <Suspense fallback={null}>
            <SearchHeading searchParams={searchParams} />
          </Suspense>
        </div>
        <Suspense fallback={null}>
          <CatalogDescription />
        </Suspense>
      </header>

      <Suspense fallback={<CatalogSkeleton />}>
        <Catalog searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
