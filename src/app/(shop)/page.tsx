import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import {
  getActiveCollections,
  getActiveOutfits,
  getFeaturedPickItems,
  getFeaturedProducts,
} from "@/modules/products/queries";
import { getSiteContent } from "@/modules/content/site-content";
import { getSiteTexts } from "@/modules/content/site-texts";
import { fillText, type SiteTexts } from "@/modules/content/texts";
import { NewsletterForm } from "@/modules/newsletter/NewsletterForm";
import { HeroCarousel } from "@/components/shop/home/HeroCarousel";
import { CategoryTiles } from "@/components/shop/home/CategoryTiles";
import { OutfitsSection } from "@/components/shop/home/OutfitsSection";
import { CampaignMedia } from "@/components/shop/home/CampaignMedia";
import { FeaturedCarousel } from "@/components/shop/home/FeaturedCarousel";
import { collectionHref } from "@/modules/products/urls";
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

/** Encabezado de sección: título chico en chocolate y título grande (editables). */
function SectionHeading({ id, eyebrow, title }: { id: string; eyebrow: string; title: string }) {
  return (
    <div className="flex flex-col gap-2.5 px-4 pt-16 pb-8 sm:px-10 lg:pt-24 lg:pb-10">
      {eyebrow && (
        <Reveal as="p" className="eyebrow text-chocolate">
          {eyebrow}
        </Reveal>
      )}
      <RevealLines id={id} lines={[title]} className="display text-[clamp(48px,8vw,128px)] text-ink" />
    </div>
  );
}

async function CollectionsSection({ texts }: { texts: SiteTexts }) {
  const collections = await getActiveCollections();
  if (collections.length === 0) return null;
  return (
    <section aria-labelledby="collections-title">
      <SectionHeading id="collections-title" eyebrow={texts["home.collections.eyebrow"]} title={texts["home.collections.title"]} />
      <Reveal variant="stagger">
        <CategoryTiles categories={collections} hrefFor={collectionHref} />
      </Reveal>
    </section>
  );
}

async function OutfitsBlock({ texts }: { texts: SiteTexts }) {
  const outfits = await getActiveOutfits();
  if (outfits.length === 0) return null;
  return (
    <section aria-labelledby="outfits-title" className="bg-cream">
      <SectionHeading id="outfits-title" eyebrow={texts["home.outfits.eyebrow"]} title={texts["home.outfits.title"]} />
      <OutfitsSection outfits={outfits} />
    </section>
  );
}

export default async function HomePage() {
  const [content, texts] = await Promise.all([getSiteContent(), getSiteTexts()]);
  const wildcards = { coleccion: content.collectionName, temporada: content.seasonLabel };

  return (
    <main>
      {/* 1. HERO — carrusel de 3 imágenes a pantalla completa (editable en /admin/contenido).
          Se mete debajo del header de vidrio. */}
      <section aria-labelledby="hero-title" className="relative -mt-[68px] h-[100svh] min-h-[620px] overflow-hidden bg-espresso sm:-mt-[76px]">
        <HeroCarousel images={content.heroImageUrls.slice(0, 3)} alt={content.heroTitle} />
        {/* Velo para que el texto claro siempre sea legible sobre la foto */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-gradient-to-b from-ink/30 via-ink/35 to-ink/80" />

        <div className="pointer-events-none relative z-10 mx-auto flex h-full max-w-none flex-col items-center justify-end gap-6 px-4 pb-[12svh] text-center [text-shadow:0_2px_24px_rgba(21,17,14,0.45)] sm:px-10">
          {content.heroEyebrow && (
            <p className={`eyebrow text-cream ${heroIn}`}>{content.heroEyebrow}</p>
          )}
          <h1
            id="hero-title"
            className={`display text-[clamp(44px,10vw,168px)] leading-[0.92] text-paper ${heroIn} [animation-delay:100ms]`}
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
              {texts["home.hero.button"] || "Ver todo"}
              <ArrowRight className="size-[18px]" strokeWidth={1.8} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      {/* 2. DESTACADOS — carrusel 3D arrastrable */}
      <section aria-labelledby="featured-title" className="overflow-hidden bg-cream">
        <div className="mx-auto grid max-w-none gap-10 px-4 py-20 sm:px-10 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)] lg:items-center lg:py-28">
          <div className="flex flex-col gap-5">
            {texts["home.featured.eyebrow"] && (
              <Reveal as="p" className="eyebrow text-chocolate">
                {fillText(texts["home.featured.eyebrow"], wildcards)}
              </Reveal>
            )}
            <RevealLines
              id="featured-title"
              lines={[fillText(texts["home.featured.title"], wildcards)]}
              className="display text-[clamp(44px,5.5vw,88px)] break-words text-ink"
            />
            {texts["home.featured.description"] && (
              <Reveal as="p" className="max-w-[360px] text-base leading-relaxed text-stone-700">
                {fillText(texts["home.featured.description"], wildcards)}
              </Reveal>
            )}
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
          <div className="absolute inset-x-0 bottom-0 mx-auto flex max-w-none flex-col gap-4 px-4 pb-8 text-paper sm:px-10 sm:pb-14">
            {content.campaignEyebrow && <Reveal as="p" className="eyebrow text-sand">{content.campaignEyebrow}</Reveal>}
            <RevealLines
              id="campaign-title"
              lines={[content.campaignTitle]}
              className="display max-w-[12ch] text-[clamp(52px,8vw,104px)] text-paper"
            />
          </div>
        </section>
      )}

      {/* 4. COLECCIONES — mosaico 2×3 */}
      <Suspense fallback={<div className="h-[600px]" />}>
        <CollectionsSection texts={texts} />
      </Suspense>

      {/* 5. SHOP THE LOOK — outfits con sus productos */}
      <Suspense fallback={null}>
        <OutfitsBlock texts={texts} />
      </Suspense>

      {/* 6. NEWSLETTER — editable en /admin/contenido */}
      {content.newsletterEnabled && (
        <section aria-labelledby="newsletter-title" className="bg-bone text-chocolate">
          <div className="grid gap-10 px-4 py-20 sm:px-10 lg:grid-cols-2 lg:items-center lg:py-28">
            <div className="flex flex-col gap-4">
              {content.newsletterEyebrow && <p className="eyebrow text-chocolate">{content.newsletterEyebrow}</p>}
              <RevealLines
                id="newsletter-title"
                lines={[content.newsletterTitle]}
                className="display max-w-[18ch] text-[clamp(40px,5vw,80px)] text-chocolate"
              />
              {content.newsletterText && (
                <p className="max-w-[520px] text-base leading-relaxed whitespace-pre-line text-stone-700">{content.newsletterText}</p>
              )}
            </div>
            <Reveal className="lg:justify-self-end lg:w-full lg:max-w-xl">
              <NewsletterForm buttonLabel={content.newsletterButtonLabel} legalText={texts["home.newsletter.legal"]} />
            </Reveal>
          </div>
        </section>
      )}
    </main>
  );
}
