import { Suspense, type ReactNode } from "react";
import { ShopHeader, type NavLink } from "@/components/layout/ShopHeader";
import { ShopFooter } from "@/components/layout/ShopFooter";
import { MobileTabBar } from "@/components/layout/MobileTabBar";
import { CartDrawer } from "@/components/shop/CartDrawer";
import { SmoothScrollProvider } from "@/components/layout/SmoothScrollProvider";
import { RevealObserver } from "@/components/motion/RevealObserver";
import { getAnnouncementMessages, getSiteContent } from "@/modules/content/site-content";
import { getActiveCategories } from "@/modules/products/queries";
import { getActiveShippingMethods, getStoreSettings, isBankTransferAvailable } from "@/modules/settings/store-settings";
import { categoryHref } from "@/modules/products/urls";
import { JsonLd } from "@/modules/seo/json-ld";
import { getAppUrl } from "@/lib/app-url";

export default async function ShopLayout({ children }: { children: ReactNode }) {
  // Contenido editable desde /admin (cacheado; se invalida al guardar)
  const [content, announcements, categories, settings, shippingMethods] = await Promise.all([
    getSiteContent(),
    getAnnouncementMessages(),
    getActiveCategories(),
    getStoreSettings(),
    getActiveShippingMethods(),
  ]);

  // Envío gratis: el umbral más bajo entre los envíos a domicilio que lo tienen
  const thresholds = shippingMethods
    .filter((m) => m.type === "HOME_DELIVERY" && m.freeShippingThreshold !== null)
    .map((m) => m.freeShippingThreshold as number);
  const freeShippingThreshold = thresholds.length ? Math.min(...thresholds) : null;
  const transferDiscount = isBankTransferAvailable(settings) ? settings.bankTransferDiscountPercentage : 0;

  const categoryLinks: NavLink[] = categories
    .filter((c) => c.productsCount > 0)
    .slice(0, 6)
    .map((c) => ({ href: categoryHref(c.slug), label: c.name }));

  const navLinks: NavLink[] = [
    { href: "/productos", label: "Tienda" },
    { href: "/productos?orden=recientes", label: content.seasonLabel || "Novedades" },
    ...categoryLinks.slice(0, 3),
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
          categoryLinks={categoryLinks}
          instagramUrl={settings.instagramUrl}
          whatsappNumber={settings.whatsappNumber}
          supportEmail={settings.supportEmail}
        />

        <Suspense fallback={null}>
          <MobileTabBar />
        </Suspense>
        <CartDrawer freeShippingThreshold={freeShippingThreshold} transferDiscount={transferDiscount} />

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
