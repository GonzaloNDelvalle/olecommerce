"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { House, LayoutGrid, ShoppingBag, User } from "lucide-react";
import { useCartStore } from "@/store/cart.store";
import { useHydrated } from "@/hooks/use-hydrated";
import { cn } from "@/lib/cn";

const tabClass =
  "pressable relative flex min-w-14 flex-col items-center justify-center gap-0.5 rounded-full px-2 py-1.5 text-[11px] font-semibold text-stone-700";

/**
 * Barra de navegación inferior de vidrio, solo en mobile (DESIGN.md §9).
 * No aparece en el checkout ni en la ficha (ahí manda la barra de compra).
 */
export function MobileTabBar() {
  const pathname = usePathname();
  const hydrated = useHydrated();
  const openCart = useCartStore((s) => s.openCart);
  const count = useCartStore((s) => s.items.reduce((acc, i) => acc + i.quantity, 0));

  if (pathname.startsWith("/checkout") || /^\/productos\/[^/]+/.test(pathname)) return null;

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));
  const items = [
    { href: "/", label: "Inicio", Icon: House },
    { href: "/productos", label: "Tienda", Icon: LayoutGrid },
    { href: "/mi-cuenta", label: "Cuenta", Icon: User },
  ];

  return (
    <nav
      aria-label="Navegación inferior"
      className="glass-light fixed inset-x-3 z-40 flex h-16 items-center justify-around rounded-full shadow-[0_10px_30px_rgba(44,33,25,0.16)] lg:hidden"
      style={{ bottom: "max(12px, env(safe-area-inset-bottom, 0px))" }}
    >
      {items.map(({ href, label, Icon }) => (
        <Link
          key={href}
          href={href}
          aria-current={isActive(href) ? "page" : undefined}
          className={cn(tabClass, isActive(href) && "text-ink")}
        >
          <Icon className="size-5" strokeWidth={isActive(href) ? 2 : 1.6} aria-hidden="true" />
          {label}
        </Link>
      ))}
      <button type="button" onClick={openCart} className={tabClass} aria-label={`Carrito, ${hydrated ? count : 0} productos`}>
        <ShoppingBag className="size-5" strokeWidth={1.6} aria-hidden="true" />
        Carrito
        {hydrated && count > 0 && (
          <span className="tabular absolute top-0.5 right-2 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-chocolate px-1 text-[10px] font-bold text-paper">
            {count}
          </span>
        )}
      </button>
    </nav>
  );
}
