import type { ReactNode } from "react";
import Link from "next/link";
import { ShopHeader } from "@/components/layout/ShopHeader";
import { CartDrawer } from "@/components/shop/CartDrawer";

export default function ShopLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-white text-stone-900">
      {/* Barra de Navegación Superior (Logo + Categorías + Carrito) */}
      <ShopHeader />

      {/* Contenido Principal de la Tienda */}
      <div className="flex-1">{children}</div>

      {/* Pie de Página Editorial */}
      <footer className="border-t border-stone-200 bg-stone-50">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-10 text-xs text-stone-500 sm:flex-row sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <span className="font-bold tracking-[0.25em] text-stone-900 uppercase">
              OLÉ
            </span>
            <span>•</span>
            <span>Indumentaria Femenina — República Argentina</span>
          </div>

          <div className="flex items-center gap-6">
            <Link href="/" className="hover:text-stone-900">
              Catálogo
            </Link>
            <Link href="/checkout" className="hover:text-stone-900">
              Finalizar Compra
            </Link>
          </div>
        </div>
      </footer>

      {/* Drawer Lateral del Carrito (Zustand Persist) */}
      <CartDrawer />
    </div>
  );
}
