import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCatalogPage, getProductByIdOrSlug } from "@/modules/products/queries";
import { ProductView } from "@/modules/products/components/ProductView";
import { ProductCard } from "@/modules/products/components/ProductCard";
import { Breadcrumbs } from "@/components/shop/Breadcrumbs";
import { RevealLines } from "@/components/motion/RevealLines";
import { categoryHref, productHref } from "@/modules/products/urls";
import { getStoreSettings, isBankTransferAvailable } from "@/modules/settings/store-settings";
import { JsonLd } from "@/modules/seo/json-ld";
import { formatARS } from "@/lib/format";
import { applyDiscount } from "@/modules/orders/pricing";
import { getAppUrl } from "@/lib/app-url";
import { Reveal } from "@/components/motion/Reveal";
import type { ProductDetailDTO } from "@/modules/products/types";

interface ProductDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

function plainText(text: string, max = 160): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  // Cortar en el último espacio para no partir palabras
  const cut = clean.slice(0, max - 1);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(" "), max * 0.6)).replace(/[s,.;:]+$/, "")}…`;
}

export async function generateMetadata({
  params,
}: ProductDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const product = await getProductByIdOrSlug(id);
  if (!product) return { title: "Producto no encontrado", robots: { index: false } };

  // Meta descripción con precio y llamado a la acción (≤155 caracteres)
  const price = formatARS(applyDiscount(product.basePrice, product.discountPercentage));
  const suffix = ` ${price}. Envíos a todo el país.`;
  const description = `${plainText(product.description, 155 - suffix.length)}${suffix}`;
  const image = product.images[0]?.url ?? product.variants[0]?.imageUrl;

  return {
    // ≤60 caracteres con la marca: la categoría solo entra si hay lugar
    title:
      `${product.name} · ${product.category.name} | OL. Indumenti`.length <= 60
        ? `${product.name} · ${product.category.name}`
        : product.name,
    description,
    alternates: { canonical: productHref(product.slug) },
    openGraph: {
      title: `${product.name} | OL. Indumenti`,
      description,
      url: productHref(product.slug),
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
    "@id": `${appUrl}${productHref(product.slug)}#product`,
    url: `${appUrl}${productHref(product.slug)}`,
    name: product.name,
    description: plainText(product.description, 500),
    image: images.length > 0 ? images : undefined,
    sku: product.variants[0]?.sku,
    brand: { "@type": "Brand", name: "OL. Indumenti" },
    category: product.category.name,
    material: product.composition ?? undefined,
    color: [...new Set(product.variants.map((v) => v.color.name))].join(", ") || undefined,
    size: [...new Set(product.variants.map((v) => v.size.name))].join(", ") || undefined,
    offers: {
      "@type": "Offer",
      url: `${appUrl}${productHref(product.slug)}`,
      priceCurrency: "ARS",
      price,
      availability: inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
      seller: { "@id": `${appUrl}/#store` },
      hasMerchantReturnPolicy: {
        "@type": "MerchantReturnPolicy",
        applicableCountry: "AR",
        returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
        merchantReturnDays: 10,
        returnMethod: "https://schema.org/ReturnByMail",
      },
      shippingDetails: {
        "@type": "OfferShippingDetails",
        shippingDestination: { "@type": "DefinedRegion", addressCountry: "AR" },
      },
    },
  };

  return <JsonLd data={jsonLd} />;
}

async function RelatedProducts({ product }: { product: ProductDetailDTO }) {
  const { items } = await getCatalogPage({ categorySlug: product.category.slug });
  const related = items.filter((item) => item.id !== product.id).slice(0, 4);
  if (related.length === 0) return null;
  return (
    <section aria-labelledby="related-title" className="pt-24 pb-8 lg:pt-28">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <RevealLines id="related-title" lines={["Completá el look"]} className="display text-[clamp(36px,4vw,48px)] text-ink" />
        <Link href={categoryHref(product.category.slug)} className="inline-flex min-h-11 items-center border-b border-current text-sm font-semibold hover:text-chocolate">
          Más {product.category.name.toLowerCase()}
        </Link>
      </div>
      <Reveal variant="stagger" className="grid grid-cols-2 gap-x-2.5 gap-y-8 sm:gap-x-4 lg:grid-cols-4">
        {related.map((item) => (
          <div key={item.id} data-reveal-item>
            <ProductCard product={item} />
          </div>
        ))}
      </Reveal>
    </section>
  );
}

async function ProductDetailContent({ paramsPromise }: { paramsPromise: Promise<{ id: string }> }) {
  const { id } = await paramsPromise;
  const [product, settings] = await Promise.all([getProductByIdOrSlug(id), getStoreSettings()]);
  if (!product) notFound();

  const transferDiscount = isBankTransferAvailable(settings) ? settings.bankTransferDiscountPercentage : 0;

  return (
    <>
      <ProductJsonLd product={product} />
      <div className="pb-5">
        <Breadcrumbs
          crumbs={[
            { name: "Inicio", path: "/" },
            { name: product.category.name, path: categoryHref(product.category.slug) },
            { name: product.name },
          ]}
        />
      </div>
      <ProductView product={product} transferDiscount={transferDiscount} installments={0} />
      <Suspense fallback={null}>
        <RelatedProducts product={product} />
      </Suspense>
    </>
  );
}

function ProductDetailSkeleton() {
  return (
    <div className="grid gap-8 pt-9 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-14" aria-hidden="true">
      <div className="aspect-[4/5] w-full animate-pulse bg-cream" />
      <div className="flex flex-col gap-4">
        <div className="h-3 w-40 animate-pulse bg-cream" />
        <div className="h-14 w-3/4 animate-pulse bg-cream" />
        <div className="h-7 w-32 animate-pulse bg-cream" />
        <div className="mt-6 h-12 w-full animate-pulse rounded-full bg-cream" />
        <div className="h-14 w-full animate-pulse rounded-full bg-cream" />
      </div>
    </div>
  );
}

export default function ProductDetailPage({ params }: ProductDetailPageProps) {
  return (
    <main className="mx-auto w-full max-w-[1440px] px-4 pt-6 sm:px-10">
      <Suspense fallback={<ProductDetailSkeleton />}>
        <ProductDetailContent paramsPromise={params} />
      </Suspense>
    </main>
  );
}
