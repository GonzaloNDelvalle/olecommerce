"use client";

import { Suspense, useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, Lock, Menu, Search, ShoppingBag, User, X } from "lucide-react";
import { useCartStore } from "@/store/cart.store";
import { useHydrated } from "@/hooks/use-hydrated";
import { AnnouncementBar } from "@/components/layout/AnnouncementBar";
import { SearchBar } from "@/components/shop/SearchBar";
import type { AnnouncementDTO } from "@/modules/content/announcements";
import { DURATION, EASE_OUT } from "@/lib/motion";
import { cn } from "@/lib/cn";

export interface NavLink {
  href: string;
  label: string;
}

export interface ShopHeaderProps {
  navLinks: NavLink[];
  announcements: AnnouncementDTO[];
  announcementRotateSeconds: number;
}

function subscribeToScroll(onChange: () => void) {
  window.addEventListener("scroll", onChange, { passive: true });
  return () => window.removeEventListener("scroll", onChange);
}

const iconButton =
  "pressable relative inline-flex size-11 items-center justify-center rounded-full text-ink transition-colors duration-150 hover:bg-ink/5";

/** Header mínimo del checkout: sin navegación que distraiga de pagar. */
function CheckoutHeader() {
  return (
    <header className="border-b border-stone-200 bg-paper">
      <div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-4 sm:px-10">
        <Link href="/productos" className="inline-flex items-center gap-2 text-sm font-semibold text-ink hover:text-chocolate">
          <ArrowLeft className="size-4" strokeWidth={1.8} aria-hidden="true" />
          <span className="hidden sm:inline">Seguir comprando</span>
        </Link>
        <Link href="/" className="display text-[34px] font-semibold tracking-normal text-ink">
          OL.
        </Link>
        <span className="inline-flex items-center gap-1.5 text-[13px] text-stone-600">
          <Lock className="size-4" strokeWidth={1.8} aria-hidden="true" />
          Compra segura
        </span>
      </div>
    </header>
  );
}

function ShopHeaderInner({ navLinks, announcements, announcementRotateSeconds }: ShopHeaderProps) {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const hydrated = useHydrated();

  const isScrolled = useSyncExternalStore(
    subscribeToScroll,
    () => window.scrollY > 24,
    () => false,
  );
  const [panel, setPanel] = useState<"menu" | "search" | null>(null);

  const openCart = useCartStore((state) => state.openCart);
  const totalItems = useCartStore((state) => state.items.reduce((acc, item) => acc + item.quantity, 0));

  // Cerrar paneles al navegar
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setPanel(null);
  }

  useEffect(() => {
    if (!panel) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setPanel(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [panel]);

  if (pathname.startsWith("/checkout")) return <CheckoutHeader />;

  // Sobre el hero de la portada el vidrio arranca invisible y aparece al scrollear.
  const showGlass = !isHome || isScrolled || panel !== null;
  const count = hydrated ? totalItems : 0;

  return (
    <>
      <AnnouncementBar messages={announcements} rotateSeconds={announcementRotateSeconds} />
      <header
        className="sticky top-0 z-50 px-3 pt-3 sm:px-6 lg:px-10"
        style={{ viewTransitionName: "site-header" }}
      >
        <div className="relative mx-auto max-w-[1360px]">
          <div
            className={cn(
              "relative flex h-14 items-center justify-between rounded-full px-1.5 sm:h-16 sm:pr-3 sm:pl-3 lg:pl-7",
            )}
          >
            {/* Capa de vidrio: solo se anima su opacidad, nunca el blur */}
            <span
              aria-hidden="true"
              className={cn(
                "glass-light pointer-events-none absolute inset-0 rounded-full shadow-[0_8px_30px_rgba(44,33,25,0.08)] transition-opacity duration-300",
                showGlass ? "opacity-100" : "opacity-0",
              )}
            />

            {/* Izquierda */}
            <div className="relative flex flex-1 items-center">
              <button
                type="button"
                onClick={() => setPanel((p) => (p === "menu" ? null : "menu"))}
                aria-expanded={panel === "menu"}
                aria-controls="header-panel"
                aria-label={panel === "menu" ? "Cerrar menú" : "Abrir menú"}
                className={cn(iconButton, "lg:hidden")}
              >
                {panel === "menu" ? <X className="size-5" strokeWidth={1.6} /> : <Menu className="size-5" strokeWidth={1.6} />}
              </button>
              <nav aria-label="Principal" className="hidden items-center gap-7 lg:flex">
                {navLinks.map((link) => {
                  const active = pathname === link.href.split("?")[0] && link.href !== "/productos";
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "py-2 text-sm font-medium text-ink transition-colors duration-150 hover:text-chocolate",
                        active && "text-chocolate underline decoration-1 underline-offset-[6px]",
                      )}
                    >
                      {link.label}
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Centro */}
            <Link href="/" aria-label="OL. Indumenti, inicio" className="display relative text-[30px] font-semibold tracking-normal text-ink sm:text-[34px]">
              OL.
            </Link>

            {/* Derecha */}
            <div className="relative flex flex-1 items-center justify-end gap-0.5">
              <button
                type="button"
                onClick={() => setPanel((p) => (p === "search" ? null : "search"))}
                aria-expanded={panel === "search"}
                aria-controls="header-panel"
                aria-label="Buscar"
                className={iconButton}
              >
                <Search className="size-5" strokeWidth={1.6} />
              </button>
              <Link href="/mi-cuenta" aria-label="Mi cuenta" className={cn(iconButton, "hidden lg:inline-flex")}>
                <User className="size-5" strokeWidth={1.6} />
              </Link>
              <button
                type="button"
                onClick={openCart}
                aria-label={`Abrir carrito, ${count} ${count === 1 ? "producto" : "productos"}`}
                className={cn(iconButton, "hidden lg:inline-flex")}
              >
                <ShoppingBag className="size-5" strokeWidth={1.6} />
                {count > 0 && (
                  <span className="tabular absolute top-1 right-0.5 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-chocolate px-1 text-[11px] font-bold text-paper">
                    {count}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Panel desplegable: menú (mobile) o buscador */}
          <AnimatePresence>
            {panel && (
              <motion.div
                id="header-panel"
                key={panel}
                initial={{ opacity: 0, scale: 0.97, y: -6 }}
                animate={{ opacity: 1, scale: 1, y: 0, transition: { duration: DURATION.dropdownIn, ease: EASE_OUT } }}
                exit={{ opacity: 0, scale: 0.98, transition: { duration: DURATION.dropdownOut, ease: EASE_OUT } }}
                style={{ transformOrigin: "top center" }}
                className="absolute inset-x-0 top-[calc(100%+8px)] rounded-[28px] border border-stone-200 bg-paper p-4 shadow-[0_24px_60px_rgba(44,33,25,0.16)] sm:p-6"
              >
                {panel === "search" ? (
                  <div className="mx-auto max-w-2xl">
                    <SearchBar autoFocus onAfterSubmit={() => setPanel(null)} />
                  </div>
                ) : (
                  <nav aria-label="Menú" className="flex flex-col">
                    {navLinks.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        className="display border-b border-stone-200 py-3 text-[32px] text-ink last:border-0 hover:text-chocolate"
                      >
                        {link.label}
                      </Link>
                    ))}
                    <Link href="/mi-cuenta" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-ink">
                      <User className="size-4" strokeWidth={1.8} aria-hidden="true" /> Mi cuenta
                    </Link>
                  </nav>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </header>
    </>
  );
}

export function ShopHeader(props: ShopHeaderProps) {
  return (
    <Suspense fallback={<div className="h-[76px]" />}>
      <ShopHeaderInner {...props} />
    </Suspense>
  );
}
