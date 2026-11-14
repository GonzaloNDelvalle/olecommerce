import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import {
  getActiveCategories,
  getFeaturedProducts,
  getLatestProducts,
} from "@/modules/products/queries";
import { ProductCard } from "@/modules/products/components/ProductCard";
import { getSiteContent } from "@/modules/content/site-content";
import { NewsletterForm } from "@/modules/newsletter/NewsletterForm";
import { HeroMedia } from "@/components/shop/home/HeroMedia";
import { CampaignMedia } from "@/components/shop/home/CampaignMedia";
import { FeaturedCarousel } from "@/components/shop/home/FeaturedCarousel";
import { RevealLines } from "@/components/motion/RevealLines";
import { buttonVariants } from "@/components/ui/button";
import { categoryHref } from "@/modules/products/urls";

function collectionLine(collectionName: string, seasonLabel: string) {
  return [collectionName, seasonLabel].filter(Boolean).join(" — ");
}

export async function generateMetadata(): Promise<Metadata> {
  const content = await getSiteContent();
  const collection = collectionLine(content.collectionName, content.seasonLabel);
  return {
    title: { absolute: `OL. Indumenti | ${collection}` },
    description: `Colección ${collection} de OL Indumenti: sastrería, tejidos y básicos atemporales en tonos tierra. Envíos a todo el país.`,
    alternates: { canonical: "/" },
  };
}

/** Animación de entrada del hero en CSS puro: corre antes de hidratar. */
const heroIn =
  "motion-safe:animate-[hero-in_600ms_var(--ease-out)_both]";

async function CampaignCategories() {
  const categories = (await getActiveCategories()).filter((c) => c.productsCount > 0).slice(0, 5);
  return (
    <nav aria-label="Categorías" className="flex flex-wrap gap-2 lg:max-w-[520px] lg:justify-end">
      {categories.map((category) => (
        <Link
          key={category.id}
          href={categoryHref(category.slug)}
          className="glass-light pressable inline-flex h-12 items-center rounded-full px-5 text-[15px] font-semibold text-ink hover:bg-paper"
        >
          {category.name}
        </Link>
      ))}
      <Link href="/productos" className={buttonVariants({ variant: "light", size: "md", className: "h-12" })}>
        Ver todo
      </Link>
    </nav>
  );
}

async function FeaturedSection() {
  const products = await getFeaturedProducts(6);
  if (products.length < 3) return null;
  return <FeaturedCarousel products={products} />;
}

async function NewArrivals() {
  const products = await getLatestProducts(8);
  if (products.length === 0) return null;
  return (
    <div data-reveal="stagger" className="grid grid-cols-2 gap-x-2.5 gap-y-8 sm:gap-x-4 sm:gap-y-10 lg:grid-cols-4">
      {products.map((product) => (
        <div key={product.id} data-reveal-item>
          <ProductCard product={product} />
        </div>
      ))}
    </div>
  );
}

function GridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-x-2.5 gap-y-8 sm:gap-x-4 lg:grid-cols-4" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex flex-col gap-3">
          <div className="aspect-[3/4] w-full animate-pulse bg-cream" />
          <div className="h-4 w-3/4 animate-pulse bg-cream" />
        </div>
      ))}
    </div>
  );
}

export default async function HomePage() {
  const content = await getSiteContent();
  const campaignHasMedia = Boolean(content.campaignImageUrl || content.campaignVideoUrl);

  return (
    <main>
      {/* 1. HERO — prenda 3D sobre crema. Se mete debajo del header flotante. */}
      <section aria-labelledby="hero-title" className="relative -mt-[68px] overflow-hidden bg-cream sm:-mt-[76px]">
        <div className="mx-auto grid min-h-[100svh] max-w-[1440px] grid-rows-[auto_minmax(320px,1fr)] items-center gap-6 px-4 pt-[100px] pb-10 sm:px-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:grid-rows-1 lg:pt-[120px] lg:pb-16">
          <div className="relative z-10 flex flex-col gap-6 lg:gap-7">
            {content.heroEyebrow && (
              <p className={`eyebrow text-chocolate ${heroIn}`}>{content.heroEyebrow}</p>
            )}
            <h1
              id="hero-title"
              className={`display text-[clamp(56px,9vw,128px)] leading-[0.95] text-ink ${heroIn} [animation-delay:100ms]`}
            >
              {content.heroTitle}
            </h1>
            {content.heroSubtitle && (
              <p className={`max-w-[420px] text-base leading-relaxed text-stone-700 sm:text-lg ${heroIn} [animation-delay:200ms]`}>
                {content.heroSubtitle}
              </p>
            )}
            <div className={`flex flex-col gap-3 sm:flex-row ${heroIn} [animation-delay:300ms]`}>
              <Link href={content.heroCtaHref} className={buttonVariants({ size: "lg" })}>
                {content.heroCtaLabel}
                <ArrowRight className="size-[18px]" strokeWidth={1.8} aria-hidden="true" />
              </Link>
              <Link href="/productos?orden=recientes" className={buttonVariants({ variant: "secondary", size: "lg" })}>
                Novedades
              </Link>
            </div>
          </div>

          <div className="relative h-full min-h-[320px] lg:min-h-[640px]">
            <HeroMedia imageUrl={content.heroImageUrl} videoUrl={content.heroVideoUrl} alt={content.heroTitle} />
          </div>
        </div>
      </section>

      {/* 2. CAMPAÑA — imagen o video a pantalla completa con parallax */}
      {content.campaignEnabled && campaignHasMedia && (
        <section aria-labelledby="campaign-title" className="relative h-[85svh] min-h-[560px] overflow-hidden bg-espresso">
          <CampaignMedia imageUrl={content.campaignImageUrl} videoUrl={content.campaignVideoUrl} />
          <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-b from-ink/0 from-40% to-ink/60" />
          <div className="absolute inset-x-0 bottom-0 mx-auto flex max-w-[1440px] flex-col gap-6 px-4 pb-8 sm:px-10 sm:pb-14 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex flex-col gap-4 text-paper">
              {content.campaignEyebrow && <p className="eyebrow text-sand" data-reveal="up">{content.campaignEyebrow}</p>}
              <RevealLines
                id="campaign-title"
                lines={[content.campaignTitle]}
                className="display max-w-[12ch] text-[clamp(52px,8vw,104px)] text-paper"
              />
            </div>
            <div data-reveal="up">
              <Suspense fallback={null}>
                <CampaignCategories />
              </Suspense>
            </div>
          </div>
        </section>
      )}

      {/* 3. DESTACADOS — carrusel 3D arrastrable */}
      <section aria-labelledby="featured-title" className="overflow-hidden bg-cream">
        <div className="mx-auto grid max-w-[1440px] gap-10 px-4 py-20 sm:px-10 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)] lg:items-center lg:py-28">
          <div className="flex flex-col gap-5">
            <p className="eyebrow text-caramel" data-reveal="up">
              Selección {content.seasonLabel}
            </p>
            <RevealLines
              id="featured-title"
              lines={[content.collectionName]}
              className="display text-[clamp(44px,5.5vw,72px)] text-ink"
            />
            <p className="max-w-[360px] text-base leading-relaxed text-stone-700" data-reveal="up">
              Las piezas que eligimos de la temporada. Arrastrá para recorrerlas.
            </p>
          </div>
          <Suspense fallback={<div className="h-[520px]" />}>
            <FeaturedSection />
          </Suspense>
        </div>
      </section>

      {/* 4. NOVEDADES */}
      <section aria-labelledby="new-title" className="mx-auto max-w-[1440px] px-4 py-20 sm:px-10 lg:py-28">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4 sm:mb-10">
          <div className="flex flex-col gap-2.5">
            <p className="eyebrow text-chocolate" data-reveal="up">
              Recién llegado{content.seasonLabel ? ` · ${content.seasonLabel}` : ""}
            </p>
            <RevealLines id="new-title" lines={["Novedades"]} className="display text-[clamp(40px,4.5vw,56px)] text-ink" />
          </div>
          <Link
            href="/productos?orden=recientes"
            className="inline-flex min-h-11 items-center gap-1.5 border-b border-current text-sm font-semibold text-ink hover:text-chocolate"
          >
            Ver todas las novedades
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
        <Suspense fallback={<GridSkeleton count={8} />}>
          <NewArrivals />
        </Suspense>
      </section>

      {/* 5. NEWSLETTER — editable en /admin/contenido */}
      {content.newsletterEnabled && (
        <section aria-labelledby="newsletter-title" className="bg-chocolate text-paper">
          <div className="mx-auto grid max-w-[1440px] gap-10 px-4 py-20 sm:px-10 lg:grid-cols-2 lg:items-center lg:py-24">
            <div className="flex flex-col gap-4">
              {content.newsletterEyebrow && <p className="eyebrow text-sand">{content.newsletterEyebrow}</p>}
              <RevealLines
                id="newsletter-title"
                lines={[content.newsletterTitle]}
                className="display max-w-[16ch] text-[clamp(40px,4.5vw,56px)] text-paper"
              />
              {content.newsletterText && (
                <p className="max-w-[440px] text-base leading-relaxed text-cream">{content.newsletterText}</p>
              )}
            </div>
            <div data-reveal="up">
              <NewsletterForm buttonLabel={content.newsletterButtonLabel} />
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
