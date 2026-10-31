import type { ReactNode } from "react";
import { ShopHeader } from "@/components/layout/ShopHeader";
import { ShopFooter } from "@/components/layout/ShopFooter";
import { CartDrawer } from "@/components/shop/CartDrawer";
import { SmoothScrollProvider } from "@/components/layout/SmoothScrollProvider";

export default function ShopLayout({ children }: { children: ReactNode }) {
  return (
    <SmoothScrollProvider>
      <div className="flex min-h-screen flex-col bg-white text-stone-900">
        {/* Barra de Navegación Editorial (Transparente en Hero / Blanca Pura al scrollear) */}
        <ShopHeader />

        {/* Contenido Principal de la Tienda */}
        <div className="flex-1">{children}</div>

        {/* Pie de Página Editorial */}
        <ShopFooter />

        {/* Drawer Lateral del Carrito (Zustand Persist) */}
        <CartDrawer />
      </div>
    </SmoothScrollProvider>
  );
}
