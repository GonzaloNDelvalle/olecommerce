import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { getProductByIdOrSlug } from "@/modules/products/actions";
import { ProductVariantSelector } from "@/modules/products/components/ProductVariantSelector";

interface ProductDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

async function ProductDetailContent({
  paramsPromise,
}: {
  paramsPromise: Promise<{ id: string }>;
}) {
  const { id } = await paramsPromise;
  const product = await getProductByIdOrSlug(id);

  if (!product) {
    notFound();
  }

  return (
    <>
      {/* Breadcrumb de navegación */}
      <nav
        aria-label="Breadcrumb"
        className="mb-8 flex flex-wrap items-center gap-2 text-xs text-stone-500"
      >
        <Link href="/" className="transition-colors hover:text-stone-900">
          Catálogo
        </Link>
        <ChevronRight className="h-3.5 w-3.5 text-stone-400" />
        <Link
          href={`/?categoria=${product.category.slug}`}
          className="transition-colors hover:text-stone-900"
        >
          {product.category.name}
        </Link>
        <ChevronRight className="h-3.5 w-3.5 text-stone-400" />
        <span className="font-medium text-stone-900">{product.name}</span>
      </nav>

      {/* Galería Dinámica por Color + Selector Interactivo de Variantes */}
      <ProductVariantSelector product={product} />
    </>
  );
}

function ProductDetailSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-12">
      <div className="aspect-[3/4] w-full animate-pulse rounded-2xl bg-stone-200 lg:col-span-7" />
      <div className="flex flex-col gap-4 lg:col-span-5">
        <div className="h-4 w-32 animate-pulse rounded bg-stone-200" />
        <div className="h-8 w-3/4 animate-pulse rounded bg-stone-200" />
        <div className="h-7 w-28 animate-pulse rounded bg-stone-200" />
        <div className="mt-4 h-20 w-full animate-pulse rounded bg-stone-200" />
      </div>
    </div>
  );
}

export default function ProductDetailPage({ params }: ProductDetailPageProps) {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <Suspense fallback={<ProductDetailSkeleton />}>
        <ProductDetailContent paramsPromise={params} />
      </Suspense>
    </main>
  );
}
