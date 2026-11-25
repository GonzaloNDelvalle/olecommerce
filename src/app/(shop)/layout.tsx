import { Suspense, type ReactNode } from "react";
import { ShopHeader, type NavLink } from "@/components/layout/ShopHeader";
import { ShopFooter } from "@/components/layout/ShopFooter";
import { CartDrawer } from "@/components/shop/CartDrawer";
import { SmoothScrollProvider } from "@/components/layout/SmoothScrollProvider";
import { RevealObserver } from "@/components/motion/RevealObserver";
import { getAnnouncementMessages, getSiteContent } from "@/modules/content/site-content";
import { getSiteTexts } from "@/modules/content/site-texts";
import { getActiveCategories, getActiveCollections, getFeaturedProducts } from "@/modules/products/queries";
import { getActiveShippingMethods, getStoreSettings, isBankTransferAvailable } from "@/modules/settings/store-settings";
import { categoryHref, collectionHref } from "@/modules/products/urls";
import { buildCategoryTree } from "@/modules/products/category-tree";
import { JsonLd } from "@/modules/seo/json-ld";
import { getAppUrl } from "@/lib/app-url";

export default async function ShopLayout({ children }: { children: ReactNode }) {
  // Contenido editable desde /admin (cacheado; se invalida al guardar)
  const [content, announcements, categories, collections, settings, shippingMethods, suggestions] = await Promise.all([
    getSiteContent(),
    getAnnouncementMessages(),
    getActiveCategories(),
    getActiveCollections(),
    getStoreSettings(),
    getActiveShippingMethods(),
    getFeaturedProducts(8),
  ]);

  // Envío gratis: el umbral más bajo entre los envíos a domicilio que lo tienen
  const thresholds = shippingMethods
    .filter((m) => m.type === "HOME_DELIVERY" && m.freeShippingThreshold !== null)
    .map((m) => m.freeShippingThreshold as number);
  const freeShippingThreshold = thresholds.length ? Math.min(...thresholds) : null;
  const transferDiscount = isBankTransferAvailable(settings) ? settings.bankTransferDiscountPercentage : 0;

  const categoryLinks: NavLink[] = buildCategoryTree(categories).map((c) => ({
    href: categoryHref(c.slug),
    label: c.name,
    children: c.children.map((child) => ({ href: categoryHref(child.slug), label: child.name })),
  }));

  // La colección/campaña vigente: la que lleva el nombre cargado en Contenido
  const currentName = content.collectionName.trim().toLowerCase();
  const currentCollection = currentName
    ? collections.find((c) => c.name.trim().toLowerCase() === currentName)
    : undefined;

  const texts = await getSiteTexts();

  const navLinks: NavLink[] = [
    { href: "/productos?orden=recientes", label: texts["nav.newIn"] || "New In" },
    ...(currentCollection ? [{ href: collectionHref(currentCollection.slug), label: currentCollection.name }] : []),
    { href: "/productos", label: texts["nav.products"] || "Productos", children: categoryLinks },
  ];

  return (
    <SmoothScrollProvider>
      <div className="flex min-h-screen flex-col bg-paper text-ink">
        <ShopHeader
          navLinks={navLinks}
          announcements={content.announcementEnabled ? announcements : []}
          announcementRotateSeconds={content.announcementRotateSeconds}
        />

        <div className="flex-1">{children}</div>

        <ShopFooter
          collectionName={content.collectionName}
          seasonLabel={content.seasonLabel}
          about={texts["footer.about"]}
          helpTitle={texts["footer.helpTitle"]}
          socialTitle={texts["footer.socialTitle"]}
          bottomLine={texts["footer.bottom"]}
          instagramUrl={settings.instagramUrl}
          tiktokUrl={settings.tiktokUrl}
          facebookUrl={settings.facebookUrl}
          whatsappNumber={settings.whatsappNumber}
          supportEmail={settings.supportEmail}
        />

        <CartDrawer
          freeShippingThreshold={freeShippingThreshold}
          transferDiscount={transferDiscount}
          suggestions={suggestions.map((p) => ({
            id: p.id,
            name: p.name,
            slug: p.slug,
            price: p.finalPrice,
            imageUrl: p.primaryImage?.url ?? null,
            imageAlt: p.primaryImage?.altText ?? p.name,
          }))}
        />

        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "ClothingStore",
                "@id": `${getAppUrl()}/#store`,
                name: settings.storeName,
                url: getAppUrl(),
                logo: `${getAppUrl()}/apple-icon`,
                image: `${getAppUrl()}/opengraph-image`,
                email: settings.supportEmail,
                ...(settings.whatsappNumber ? { telephone: settings.whatsappNumber } : {}),
                ...(settings.showroomAddress
                  ? { address: { "@type": "PostalAddress", streetAddress: settings.showroomAddress, addressCountry: "AR" } }
                  : {}),
                ...(settings.instagramUrl ? { sameAs: [settings.instagramUrl] } : {}),
                currenciesAccepted: "ARS",
                paymentAccepted: "Mercado Pago, transferencia bancaria",
              },
              {
                "@type": "WebSite",
                "@id": `${getAppUrl()}/#website`,
                url: getAppUrl(),
                name: settings.storeName,
                inLanguage: "es-AR",
                publisher: { "@id": `${getAppUrl()}/#store` },
                potentialAction: {
                  "@type": "SearchAction",
                  target: { "@type": "EntryPoint", urlTemplate: `${getAppUrl()}/productos?q={search_term_string}` },
                  "query-input": "required name=search_term_string",
                },
              },
            ],
          }}
        />

        {/* Apariciones al scrollear (DESIGN.md §8) */}
        <RevealObserver />
      </div>
    </SmoothScrollProvider>
  );
}
