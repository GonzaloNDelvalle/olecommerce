import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getActiveCategories } from "@/modules/products/queries";
import { categoryHref } from "@/modules/products/urls";
import { CatalogView, CatalogSkeleton, type CatalogSearchParams } from "@/components/shop/CatalogView";
import { Breadcrumbs } from "@/components/shop/Breadcrumbs";
import { buttonVariants } from "@/components/ui/button";
import { plural } from "@/lib/format";

type Params = { slug: string };

async function findCategory(slug: string) {
  const categories = await getActiveCategories();
  return categories.find((c) => c.slug === decodeURIComponent(slug)) ?? null;
}

export async function generateStaticParams(): Promise<Params[]> {
  const categories = await getActiveCategories();
  return categories.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const category = await findCategory(slug);
  if (!category) return { title: "Categoría no encontrada", robots: { index: false } };

  const description =
    category.description?.slice(0, 155) ??
    `${category.name} de OL. Indumenti: ${category.productsCount} ${plural(category.productsCount, "prenda", "prendas")} en tonos tierra. Envíos a todo el país y 3 cuotas sin interés.`;

  return {
    title: category.name,
    description,
    alternates: { canonical: categoryHref(category.slug) },
    openGraph: {
      title: `${category.name} | OL. Indumenti`,
      description,
      url: categoryHref(category.slug),
      ...(category.imageUrl ? { images: [{ url: category.imageUrl }] } : {}),
    },
  };
}

async function Catalog({ slug, searchParams }: { slug: string; searchParams: Promise<CatalogSearchParams> }) {
  return (
    <CatalogView
      basePath={categoryHref(slug)}
      categorySlug={slug}
      searchParams={await searchParams}
      emptyAction={
        <Link href="/productos" className={buttonVariants({ size: "lg" })}>
          Ver toda la tienda
        </Link>
      }
    />
  );
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<CatalogSearchParams>;
}) {
  const { slug } = await params;
  const category = await findCategory(slug);
  if (!category) notFound();

  return (
    <main className="mx-auto w-full max-w-[1440px] px-4 pt-6 sm:px-10">
      <Breadcrumbs
        crumbs={[
          { name: "Inicio", path: "/" },
          { name: "Tienda", path: "/productos" },
          { name: category.name },
        ]}
      />

      <header className="grid gap-6 pt-10 pb-8 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:items-end">
        <div className="flex flex-col gap-3">
          <p className="eyebrow text-chocolate">
            <span className="tabular">{category.productsCount}</span>{" "}
            {plural(category.productsCount, "producto", "productos")}
          </p>
          <h1 className="display text-[clamp(56px,7vw,96px)] text-ink">{category.name}</h1>
        </div>
        {category.description && (
          <p className="max-w-[520px] text-base leading-relaxed text-stone-700">{category.description}</p>
        )}
      </header>

      <Suspense fallback={<CatalogSkeleton />}>
        <Catalog slug={category.slug} searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
