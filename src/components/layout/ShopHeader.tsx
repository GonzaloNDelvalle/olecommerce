"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShoppingBag, User } from "lucide-react";
import { useCartStore } from "@/store/cart.store";
import { SearchBar } from "@/components/shop/SearchBar";

export function ShopHeader() {
  const [mounted, setMounted] = useState(false);

  const openCart = useCartStore((state) => state.openCart);
  const totalItems = useCartStore((state) =>
    state.items.reduce((acc, item) => acc + item.quantity, 0)
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-stone-200 bg-white">
      {/* Cinta superior minimalista en tono stone oscuro */}
      <div className="bg-stone-900 px-4 py-1.5 text-center text-[11px] font-medium tracking-[0.2em] text-stone-100 uppercase">
        Envíos a todo el país • 3 y 6 cuotas sin interés • 15% OFF por
        Transferencia
      </div>

      {/* Barra Principal Esencial: Logo (Izquierda) + Buscador (Centro) + Usuario/Carrito (Derecha) */}
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        {/* 1. Logo Editorial */}
        <div className="flex shrink-0 items-center">
          <Link
            href="/"
            className="text-xl font-bold tracking-[0.28em] text-stone-900 uppercase transition-opacity hover:opacity-80"
          >
            OLÉ
          </Link>
        </div>

        {/* 2. Barra de Búsqueda Central (Desktop / Tablet) */}
        <div className="hidden flex-1 justify-center sm:flex">
          <SearchBar />
        </div>

        {/* 3. Accesos de Usuario y Carrito */}
        <div className="flex shrink-0 items-center gap-2.5">
          <Link
            href="/mi-cuenta"
            title="Mi Cuenta / Mis Pedidos"
            aria-label="Ir a Mi Cuenta"
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-stone-200 bg-white px-3 text-xs font-medium text-stone-700 transition-colors hover:border-stone-900 hover:text-stone-900"
          >
            <User className="h-4 w-4" />
            <span className="hidden lg:inline">Mi Cuenta</span>
          </Link>

          <button
            type="button"
            onClick={openCart}
            aria-label="Abrir carrito de compras"
            className="relative inline-flex h-9 items-center gap-2 rounded-lg border border-stone-200 bg-white px-3.5 text-xs font-semibold tracking-wider text-stone-900 uppercase transition-colors hover:border-stone-900"
          >
            <ShoppingBag className="h-4 w-4" />
            <span className="hidden md:inline">Carrito</span>
            {mounted && totalItems > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-stone-900 px-1.5 text-[11px] font-bold text-white">
                {totalItems}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Barra de búsqueda en pantallas móviles pequeñas */}
      <div className="border-t border-stone-100 bg-white px-4 py-2.5 sm:hidden">
        <SearchBar />
      </div>
    </header>
  );
}
