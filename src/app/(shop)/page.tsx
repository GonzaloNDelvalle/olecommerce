import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import {
  getActiveCategories,
  getActiveOutfits,
  getFeaturedPickItems,
  getFeaturedProducts,
} from "@/modules/products/queries";
import { getSiteContent } from "@/modules/content/site-content";
import { NewsletterForm } from "@/modules/newsletter/NewsletterForm";
import { HeroCarousel } from "@/components/shop/home/HeroCarousel";
import { CategoryTiles } from "@/components/shop/home/CategoryTiles";
import { OutfitsSection } from "@/components/shop/home/OutfitsSection";
import { CampaignMedia } from "@/components/shop/home/CampaignMedia";
import { FeaturedCarousel } from "@/components/shop/home/FeaturedCarousel";
import { RevealLines } from "@/components/motion/RevealLines";
import { buttonVariants } from "@/components/ui/button";
import { Reveal } from "@/components/motion/Reveal";

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

async function FeaturedSection({ imageIds }: { imageIds: string[] }) {
  // Fotos elegidas en el admin; sin elección, los productos destacados
  const picked = await getFeaturedPickItems(imageIds);
  const products = picked.length >= 3 ? picked : await getFeaturedProducts(6);
  if (products.length < 3) return null;
  return <FeaturedCarousel products={products} />;
}

async function CategoriesSection() {
  const categories = (await getActiveCategories()).filter((c) => c.productsCount > 0);
  if (categories.length === 0) return null;
  return (
    <section aria-labelledby="categories-title" className="mx-auto max-w-[1440px] px-4 py-20 sm:px-10 lg:py-28">
      <div className="mb-8 flex flex-col gap-2.5 sm:mb-10">
        <Reveal as="p" className="eyebrow text-chocolate">
          Explorá por categoría
        </Reveal>
        <RevealLines id="categories-title" lines={["Categorías"]} className="display text-[clamp(40px,4.5vw,56px)] text-ink" />
      </div>
      <Reveal variant="stagger">
        <CategoryTiles categories={categories} />
      </Reveal>
    </section>
  );
}

async function OutfitsBlock() {
  const outfits = await getActiveOutfits();
  if (outfits.length === 0) return null;
  return (
    <section aria-labelledby="outfits-title" className="bg-cream">
      <div className="mx-auto max-w-[1440px] px-4 py-20 sm:px-10 lg:py-28">
        <div className="mb-8 flex flex-col gap-2.5 sm:mb-12">
          <Reveal as="p" className="eyebrow text-caramel">
            Shop the look
          </Reveal>
          <RevealLines id="outfits-title" lines={["Outfits para armar"]} className="display text-[clamp(40px,4.5vw,56px)] text-ink" />
        </div>
        <OutfitsSection outfits={outfits} />
      </div>
    </section>
  );
}

export default async function HomePage() {
  const content = await getSiteContent();
  
  return (
    <main>
      {/* 1. HERO — carrusel de 3 imágenes a pantalla completa (editable en /admin/contenido).
          Se mete debajo del header de vidrio. */}
      <section aria-labelledby="hero-title" className="relative -mt-[68px] h-[100svh] min-h-[620px] overflow-hidden bg-espresso sm:-mt-[76px]">
        <HeroCarousel images={content.heroImageUrls.slice(0, 3)} alt={content.heroTitle} />
        {/* Velo para que el texto claro siempre sea legible sobre la foto */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-gradient-to-b from-ink/30 via-ink/35 to-ink/80" />

        <div className="pointer-events-none relative z-10 mx-auto flex h-full max-w-[1100px] flex-col items-center justify-end gap-6 px-4 pb-[12svh] text-center [text-shadow:0_2px_24px_rgba(21,17,14,0.45)] sm:px-10">
          {content.heroEyebrow && (
            <p className={`eyebrow text-cream ${heroIn}`}>{content.heroEyebrow}</p>
          )}
          <h1
            id="hero-title"
            className={`display text-[clamp(56px,10vw,140px)] leading-[0.95] text-paper ${heroIn} [animation-delay:100ms]`}
          >
            {content.heroTitle}
          </h1>
          {content.heroSubtitle && (
            <p className={`max-w-[520px] text-base leading-relaxed text-cream sm:text-lg ${heroIn} [animation-delay:200ms]`}>
              {content.heroSubtitle}
            </p>
          )}
          <div className={`pointer-events-auto flex w-full flex-col justify-center sm:w-auto ${heroIn} [animation-delay:300ms]`}>
            <Link href="/productos" className={buttonVariants({ variant: "glass", size: "lg" })}>
              Ver todo
              <ArrowRight className="size-[18px]" strokeWidth={1.8} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      {/* 2. DESTACADOS — carrusel 3D arrastrable */}
      <section aria-labelledby="featured-title" className="overflow-hidden bg-cream">
        <div className="mx-auto grid max-w-[1440px] gap-10 px-4 py-20 sm:px-10 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)] lg:items-center lg:py-28">
          <div className="flex flex-col gap-5">
            <Reveal as="p" className="eyebrow text-caramel">
              Selección {content.seasonLabel}
            </Reveal>
            <RevealLines
              id="featured-title"
              lines={[content.collectionName]}
              className="display text-[clamp(44px,5.5vw,72px)] text-ink"
            />
            <Reveal as="p" className="max-w-[360px] text-base leading-relaxed text-stone-700">
              Las piezas que eligimos de la temporada. Arrastrá para recorrerlas.
            </Reveal>
          </div>
          <Suspense fallback={<div className="h-[520px]" />}>
            <FeaturedSection imageIds={content.featuredImageIds} />
          </Suspense>
        </div>
      </section>

      {/* 3. CAMPAÑA — solo video en loop, con volanta y título (sin botones) */}
      {content.campaignEnabled && (content.campaignVideoUrl || content.campaignMobileVideoUrl) && (
        <section aria-labelledby="campaign-title" className="relative h-[85svh] min-h-[560px] overflow-hidden bg-espresso">
          <CampaignMedia
            imageUrl={content.campaignImageUrl}
            desktopVideoUrl={content.campaignVideoUrl}
            mobileVideoUrl={content.campaignMobileVideoUrl}
          />
          <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-b from-ink/0 from-40% to-ink/60" />
          <div className="absolute inset-x-0 bottom-0 mx-auto flex max-w-[1440px] flex-col gap-4 px-4 pb-8 text-paper sm:px-10 sm:pb-14">
            {content.campaignEyebrow && <Reveal as="p" className="eyebrow text-sand">{content.campaignEyebrow}</Reveal>}
            <RevealLines
              id="campaign-title"
              lines={[content.campaignTitle]}
              className="display max-w-[12ch] text-[clamp(52px,8vw,104px)] text-paper"
            />
          </div>
        </section>
      )}

      {/* 4. CATEGORÍAS — mosaico 2×3 */}
      <Suspense fallback={<div className="h-[600px]" />}>
        <CategoriesSection />
      </Suspense>

      {/* 5. SHOP THE LOOK — outfits con sus productos */}
      <Suspense fallback={null}>
        <OutfitsBlock />
      </Suspense>

      {/* 6. NEWSLETTER — editable en /admin/contenido */}
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
            <Reveal>
              <NewsletterForm buttonLabel={content.newsletterButtonLabel} />
            </Reveal>
          </div>
        </section>
      )}
    </main>
  );
}
