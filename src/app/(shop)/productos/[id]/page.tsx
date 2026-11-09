import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { getProductByIdOrSlug } from "@/modules/products/queries";
import { ProductVariantSelector } from "@/modules/products/components/ProductVariantSelector";
import { applyDiscount } from "@/modules/orders/pricing";
import { getAppUrl } from "@/lib/app-url";
import type { ProductDetailDTO } from "@/modules/products/types";

interface ProductDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

function plainText(text: string, max = 160): string {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length > max ? `${clean.slice(0, max - 1)}…` : clean;
}

export async function generateMetadata({
  params,
}: ProductDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const product = await getProductByIdOrSlug(id);
  if (!product) return { title: "Producto no encontrado" };

  const description = plainText(product.description);
  const image = product.images[0]?.url ?? product.variants[0]?.imageUrl;

  return {
    title: product.name,
    description,
    alternates: { canonical: `/productos/${product.slug}` },
    openGraph: {
      title: product.name,
      description,
      url: `/productos/${product.slug}`,
      images: image ? [{ url: image, alt: product.name }] : undefined,
    },
  };
}

/** Datos estructurados de producto para Google (precio, stock, imágenes). */
function ProductJsonLd({ product }: { product: ProductDetailDTO }) {
  const appUrl = getAppUrl();
  const price = applyDiscount(product.basePrice, product.discountPercentage);
  const inStock = product.variants.some((variant) => variant.availableStock > 0);
  const images = product.images.map((image) => image.url);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: plainText(product.description, 500),
    image: images.length > 0 ? images : undefined,
    sku: product.variants[0]?.sku,
    brand: { "@type": "Brand", name: "OL. Indumenti" },
    category: product.category.name,
    material: product.composition ?? undefined,
    offers: {
      "@type": "Offer",
      url: `${appUrl}/productos/${product.slug}`,
      priceCurrency: "ARS",
      price,
      availability: inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
    },
  };

  return (
    <script
      type="application/ld+json"
      // JSON.stringify escapa comillas; se neutraliza "<" para evitar cerrar el <script>
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
      }}
    />
  );
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
      <ProductJsonLd product={product} />

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
