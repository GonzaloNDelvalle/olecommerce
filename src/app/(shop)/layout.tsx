import type { ReactNode } from "react";
import { ShopHeader, type NavLink } from "@/components/layout/ShopHeader";
import { ShopFooter } from "@/components/layout/ShopFooter";
import { MobileTabBar } from "@/components/layout/MobileTabBar";
import { CartDrawer } from "@/components/shop/CartDrawer";
import { SmoothScrollProvider } from "@/components/layout/SmoothScrollProvider";
import { RevealObserver } from "@/components/motion/RevealObserver";
import { getAnnouncementMessages, getSiteContent } from "@/modules/content/site-content";
import { getActiveCategories } from "@/modules/products/queries";
import { getStoreSettings } from "@/modules/settings/store-settings";
import { categoryHref } from "@/modules/products/urls";

export default async function ShopLayout({ children }: { children: ReactNode }) {
  // Contenido editable desde /admin (cacheado; se invalida al guardar)
  const [content, announcements, categories, settings] = await Promise.all([
    getSiteContent(),
    getAnnouncementMessages(),
    getActiveCategories(),
    getStoreSettings(),
  ]);

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

        <MobileTabBar />
        <CartDrawer />

        {/* Apariciones al scrollear (DESIGN.md §8) */}
        <RevealObserver />
      </div>
    </SmoothScrollProvider>
  );
}
