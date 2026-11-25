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
  const category = categories.find((c) => c.slug === decodeURIComponent(slug)) ?? null;
  if (!category) return null;
  return {
    category,
    parent: category.parentId ? (categories.find((c) => c.id === category.parentId) ?? null) : null,
    children: categories.filter((c) => c.parentId === category.id && c.productsCount > 0),
  };
}

export async function generateStaticParams(): Promise<Params[]> {
  const categories = await getActiveCategories();
  return categories.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<CatalogSearchParams>;
}): Promise<Metadata> {
  const [{ slug }, { pagina }] = await Promise.all([params, searchParams]);
  const page = Number(pagina) > 1 ? Number(pagina) : 1;
  const found = await findCategory(slug);
  if (!found) return { title: "Categoría no encontrada", robots: { index: false } };
  const { category } = found;

  const description =
    category.description?.slice(0, 155) ??
    `${category.name} de OL. Indumenti: ${category.productsCount} ${plural(category.productsCount, "prenda", "prendas")} en tonos tierra. Envíos a todo el país y 3 cuotas sin interés.`;

  return {
    title: page > 1 ? `${category.name} · página ${page}` : category.name,
    description,
    alternates: { canonical: page > 1 ? `${categoryHref(category.slug)}?pagina=${page}` : categoryHref(category.slug) },
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

export default function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<CatalogSearchParams>;
}) {
  return (
    <Suspense
      fallback={
        <main className="mx-auto w-full max-w-none px-4 pt-24 sm:px-10">
          <CatalogSkeleton />
        </main>
      }
    >
      <CategoryContent params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function CategoryContent({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<CatalogSearchParams>;
}) {
  const { slug } = await params;
  const found = await findCategory(slug);
  if (!found) notFound();
  const { category, parent, children } = found;

  return (
    <main className="mx-auto w-full max-w-none px-4 pt-6 sm:px-10">
      <Breadcrumbs
        crumbs={[
          { name: "Inicio", path: "/" },
          { name: "Shop", path: "/productos" },
          ...(parent ? [{ name: parent.name, path: categoryHref(parent.slug) }] : []),
          { name: category.name },
        ]}
      />

      <header className="grid gap-6 pt-10 pb-8 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:items-end">
        <div className="flex flex-col gap-3">
          <p className="eyebrow text-chocolate">
            <span className="tabular">{category.productsCount}</span>{" "}
            {plural(category.productsCount, "producto", "productos")}
          </p>
          <h1 className="display break-words text-[clamp(48px,9vw,160px)] text-ink">{category.name}</h1>
        </div>
        {category.description && (
          <p className="max-w-[520px] text-base leading-relaxed text-stone-700">{category.description}</p>
        )}
      </header>

      {children.length > 0 && (
        <nav aria-label="Subcategorías" className="flex flex-wrap gap-2 pb-6">
          {children.map((child) => (
            <Link
              key={child.id}
              href={categoryHref(child.slug)}
              className="glass-light pressable inline-flex h-10 items-center rounded-full px-4 text-sm font-medium text-ink hover:bg-paper"
            >
              {child.name}
            </Link>
          ))}
        </nav>
      )}

      <Suspense fallback={<CatalogSkeleton />}>
        <Catalog slug={category.slug} searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
