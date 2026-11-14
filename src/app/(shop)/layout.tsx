import type { ReactNode } from "react";
import { ShopHeader } from "@/components/layout/ShopHeader";
import { ShopFooter } from "@/components/layout/ShopFooter";
import { CartDrawer } from "@/components/shop/CartDrawer";
import { SmoothScrollProvider } from "@/components/layout/SmoothScrollProvider";
import { RevealObserver } from "@/components/motion/RevealObserver";
import {
  getAnnouncementMessages,
  getSiteContent,
} from "@/modules/content/site-content";

export default async function ShopLayout({
  children,
}: {
  children: ReactNode;
}) {
  // Contenido editable desde /admin/contenido (cacheado; se invalida al guardar)
  const [content, announcements] = await Promise.all([
    getSiteContent(),
    getAnnouncementMessages(),
  ]);

  return (
    <SmoothScrollProvider>
      <div className="flex min-h-screen flex-col bg-paper text-ink">
        {/* Barra de Navegación Editorial (Transparente en Hero / Blanca Pura al scrollear) */}
        <ShopHeader
          seasonLabel={content.seasonLabel}
          announcements={content.announcementEnabled ? announcements : []}
          announcementRotateSeconds={content.announcementRotateSeconds}
        />

        {/* Contenido Principal de la Tienda */}
        <div className="flex-1">{children}</div>

        {/* Pie de Página Editorial */}
        <ShopFooter
          collectionName={content.collectionName}
          seasonLabel={content.seasonLabel}
        />

        {/* Drawer Lateral del Carrito (Zustand Persist) */}
        <CartDrawer />

        {/* Apariciones al scrollear (DESIGN.md §8) */}
        <RevealObserver />
      </div>
    </SmoothScrollProvider>
  );
}
