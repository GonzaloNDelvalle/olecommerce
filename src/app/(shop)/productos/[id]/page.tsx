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
      {/* Breadcrumb Editorial Minimalista */}
      <nav
        aria-label="Breadcrumb"
        className="mb-10 flex flex-wrap items-center gap-2 text-[11px] tracking-[0.18em] text-stone-400 uppercase"
      >
        <Link href="/" className="transition-colors hover:text-[#5C4033]">
          OL.
        </Link>
        <ChevronRight className="h-3 w-3 text-stone-300" />
        <Link
          href="/productos"
          className="transition-colors hover:text-[#5C4033]"
        >
          Catálogo
        </Link>
        <ChevronRight className="h-3 w-3 text-stone-300" />
        <Link
          href={`/productos?categoria=${product.category.slug}`}
          className="transition-colors hover:text-[#5C4033]"
        >
          {product.category.name}
        </Link>
        <ChevronRight className="h-3 w-3 text-stone-300" />
        <span className="font-medium text-stone-900">{product.name}</span>
      </nav>

      {/* Layout Editorial de 2 Columnas: Lookbook Vertical (Izq) + Ficha Sticky (Der) */}
      <ProductVariantSelector product={product} />
    </>
  );
}

function ProductDetailSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16 xl:gap-20">
      <div className="space-y-6 lg:col-span-7">
        <div className="aspect-[3/4] w-full animate-pulse rounded-none bg-stone-100" />
        <div className="aspect-[3/4] w-full animate-pulse rounded-none bg-stone-100" />
      </div>
      <div className="flex flex-col gap-4 bg-white lg:col-span-5 lg:pl-2">
        <div className="h-3 w-32 animate-pulse rounded-none bg-stone-100" />
        <div className="h-9 w-3/4 animate-pulse rounded-none bg-stone-100" />
        <div className="h-6 w-28 animate-pulse rounded-none bg-stone-100" />
        <div className="mt-4 h-24 w-full animate-pulse rounded-none bg-stone-100" />
        <div className="mt-6 h-12 w-full animate-pulse rounded-none bg-stone-200" />
      </div>
    </div>
  );
}

export default function ProductDetailPage({ params }: ProductDetailPageProps) {
  return (
    <main className="mx-auto w-full max-w-7xl bg-white px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
      <Suspense fallback={<ProductDetailSkeleton />}>
        <ProductDetailContent paramsPromise={params} />
      </Suspense>
    </main>
  );
}
