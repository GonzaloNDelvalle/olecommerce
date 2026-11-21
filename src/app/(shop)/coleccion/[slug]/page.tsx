import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getActiveCollections } from "@/modules/products/queries";
import { collectionHref } from "@/modules/products/urls";
import { CatalogView, CatalogSkeleton, type CatalogSearchParams } from "@/components/shop/CatalogView";
import { Breadcrumbs } from "@/components/shop/Breadcrumbs";
import { buttonVariants } from "@/components/ui/button";
import { plural } from "@/lib/format";

type Params = { slug: string };

async function findCollection(slug: string) {
  const collections = await getActiveCollections();
  return collections.find((c) => c.slug === decodeURIComponent(slug)) ?? null;
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const collection = await findCollection(slug);
  if (!collection) return { title: "Colección no encontrada", robots: { index: false } };

  const description =
    collection.description?.slice(0, 155) ??
    `Colección ${collection.name} de OL. Indumenti: ${collection.productsCount} ${plural(collection.productsCount, "prenda", "prendas")}. Envíos a todo el país.`;

  return {
    title: `Colección ${collection.name}`,
    description,
    alternates: { canonical: collectionHref(collection.slug) },
    openGraph: { title: `Colección ${collection.name} | OL. Indumenti`, description, url: collectionHref(collection.slug) },
  };
}

async function Catalog({ slug, searchParams }: { slug: string; searchParams: Promise<CatalogSearchParams> }) {
  return (
    <CatalogView
      basePath={collectionHref(slug)}
      collectionSlug={slug}
      searchParams={await searchParams}
      emptyAction={
        <Link href="/productos" className={buttonVariants({ size: "lg" })}>
          Ver toda la tienda
        </Link>
      }
    />
  );
}

async function CollectionContent({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<CatalogSearchParams>;
}) {
  const { slug } = await params;
  const collection = await findCollection(slug);
  if (!collection) notFound();

  return (
    <main className="mx-auto w-full max-w-[1440px] px-4 pt-6 sm:px-10">
      <Breadcrumbs
        crumbs={[
          { name: "Inicio", path: "/" },
          { name: "Tienda", path: "/productos" },
          { name: collection.name },
        ]}
      />

      <header className="grid gap-6 pt-10 pb-8 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:items-end">
        <div className="flex flex-col gap-3">
          <p className="eyebrow text-chocolate">
            Colección · <span className="tabular">{collection.productsCount}</span>{" "}
            {plural(collection.productsCount, "producto", "productos")}
          </p>
          <h1 className="display text-[clamp(56px,7vw,96px)] text-ink">{collection.name}</h1>
        </div>
        {collection.description && (
          <p className="max-w-[520px] text-base leading-relaxed text-stone-700">{collection.description}</p>
        )}
      </header>

      <Suspense fallback={<CatalogSkeleton />}>
        <Catalog slug={collection.slug} searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

export default function CollectionPage({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<CatalogSearchParams>;
}) {
  return (
    <Suspense
      fallback={
        <main className="mx-auto w-full max-w-[1440px] px-4 pt-24 sm:px-10">
          <CatalogSkeleton />
        </main>
      }
    >
      <CollectionContent params={params} searchParams={searchParams} />
    </Suspense>
  );
}
