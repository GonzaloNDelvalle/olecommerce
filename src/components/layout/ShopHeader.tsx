"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, Search, ShoppingBag, User, X } from "lucide-react";
import { useCartStore } from "@/store/cart.store";
import { SearchBar } from "@/components/shop/SearchBar";

const NAV_LINKS = [
  { href: "/productos", label: "Catálogo" },
  { href: "/productos?orden=recientes", label: "FW'26" },
  { href: "/productos?categoria=partes-de-arriba", label: "Sastrería" },
  { href: "/productos?categoria=denim", label: "Denim" },
];

function ShopHeaderInner() {
  const pathname = usePathname();
  const isHome = pathname === "/";

  const [mounted, setMounted] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const openCart = useCartStore((state) => state.openCart);
  const totalItems = useCartStore((state) =>
    state.items.reduce((acc, item) => acc + item.quantity, 0)
  );

  useEffect(() => {
    setMounted(true);

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 36);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Transparente únicamente en la portada (/) cuando está arriba sobre el hero video
  const isTransparent = isHome && !isScrolled && !isSearchOpen && !isMobileMenuOpen;

  const navLinkClass = `text-[11px] font-light tracking-[0.2em] uppercase transition-colors duration-300 ${
    isTransparent
      ? "text-white/90 hover:text-[#D2B48C]"
      : "text-stone-700 hover:text-stone-950"
  }`;

  return (
    <header
      className={`${
        isHome ? "fixed top-0 right-0 left-0" : "sticky top-0"
      } z-50 transition-all duration-500 ease-out ${
        isTransparent
          ? "border-b border-white/15 bg-transparent text-white"
          : "border-b border-stone-200 bg-white text-stone-900"
      }`}
    >
      <div className="mx-auto grid h-20 max-w-7xl grid-cols-3 items-center px-4 sm:px-6 lg:px-8">
        {/* 1. Izquierda: Navegación Editorial Espaciada (Desktop) / Botón Menú (Mobile) */}
        <div className="flex items-center">
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
            aria-label="Abrir menú de navegación"
            className={`inline-flex items-center gap-2 text-[11px] font-light tracking-[0.2em] uppercase lg:hidden ${
              isTransparent ? "text-white" : "text-stone-900"
            }`}
          >
            {isMobileMenuOpen ? (
              <X className="h-4 w-4" strokeWidth={1.4} />
            ) : (
              <Menu className="h-4 w-4" strokeWidth={1.4} />
            )}
            <span className="hidden sm:inline">Menú</span>
          </button>

          <nav
            aria-label="Navegación principal"
            className="hidden items-center gap-8 lg:flex"
          >
            {NAV_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className={navLinkClass}>
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* 2. Centro: Isotipo "OL." en Serif Imponente */}
        <div className="flex justify-center">
          <Link
            href="/"
            className={`font-serif text-3xl font-normal tracking-[0.18em] uppercase transition-colors duration-300 sm:text-4xl ${
              isTransparent
                ? "text-white hover:text-[#D2B48C]"
                : "text-stone-950 hover:text-[#5C4033]"
            }`}
          >
            OL.
          </Link>
        </div>

        {/* 3. Derecha: Buscador, Mi Cuenta y Carrito (Arquitectura de bordes rectos) */}
        <div className="flex items-center justify-end gap-5 sm:gap-7">
          <button
            type="button"
            onClick={() => setIsSearchOpen((prev) => !prev)}
            aria-label="Buscar prendas"
            className={`inline-flex items-center gap-2 text-[11px] font-light tracking-[0.2em] uppercase transition-colors ${
              isTransparent
                ? "text-white/90 hover:text-[#D2B48C]"
                : "text-stone-700 hover:text-stone-950"
            }`}
          >
            <Search className="h-3.5 w-3.5" strokeWidth={1.4} />
            <span className="hidden md:inline">Buscar</span>
          </button>

          <Link
            href="/mi-cuenta"
            title="Mi Cuenta / Mis Pedidos"
            aria-label="Ir a Mi Cuenta"
            className={`inline-flex items-center gap-2 text-[11px] font-light tracking-[0.2em] uppercase transition-colors ${
              isTransparent
                ? "text-white/90 hover:text-[#D2B48C]"
                : "text-stone-700 hover:text-stone-950"
            }`}
          >
            <User className="h-3.5 w-3.5" strokeWidth={1.4} />
            <span className="hidden xl:inline">Cuenta</span>
          </Link>

          <button
            type="button"
            onClick={openCart}
            aria-label="Abrir carrito de compras"
            className={`inline-flex items-center gap-2 text-[11px] font-normal tracking-[0.2em] uppercase transition-colors ${
              isTransparent
                ? "text-white hover:text-[#D2B48C]"
                : "text-stone-900 hover:text-[#5C4033]"
            }`}
          >
            <ShoppingBag className="h-3.5 w-3.5" strokeWidth={1.4} />
            <span className="hidden sm:inline">Carrito</span>
            <span
              className={`inline-flex h-5 min-w-5 items-center justify-center rounded-none border px-1.5 text-[10px] font-medium tracking-normal transition-colors ${
                isTransparent
                  ? "border-white/50 bg-white/10 text-white"
                  : "border-stone-900 bg-stone-900 text-white"
              }`}
            >
              {mounted ? totalItems : 0}
            </span>
          </button>
        </div>
      </div>

      {/* Barra Desplegable de Búsqueda Editorial */}
      <AnimatePresence>
        {isSearchOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden border-t border-stone-200 bg-white text-stone-900"
          >
            <div className="mx-auto flex max-w-3xl items-center gap-4 px-4 py-4 sm:px-6">
              <div className="flex-1">
                <SearchBar
                  isTransparent={false}
                  onAfterSubmit={() => setIsSearchOpen(false)}
                />
              </div>
              <button
                type="button"
                onClick={() => setIsSearchOpen(false)}
                className="text-[10px] font-light tracking-[0.2em] text-stone-500 uppercase hover:text-stone-950"
              >
                Cerrar
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Menú Móvil Editorial */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.nav
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            aria-label="Menú móvil"
            className="overflow-hidden border-t border-stone-200 bg-white text-stone-900 lg:hidden"
          >
            <div className="flex flex-col space-y-4 px-6 py-6">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-xs font-light tracking-[0.22em] text-stone-800 uppercase transition-colors hover:text-[#5C4033]"
                >
                  {link.label}
                </Link>
              ))}
              <div className="pt-2">
                <SearchBar
                  isTransparent={false}
                  onAfterSubmit={() => setIsMobileMenuOpen(false)}
                />
              </div>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}

export function ShopHeader() {
  return (
    <Suspense
      fallback={
        <header className="sticky top-0 z-50 h-20 border-b border-stone-200 bg-white" />
      }
    >
      <ShopHeaderInner />
    </Suspense>
  );
}
