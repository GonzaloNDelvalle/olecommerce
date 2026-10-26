"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingBag,
  Shirt,
  PlusCircle,
  Tags,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";

const ADMIN_NAV_ITEMS = [
  {
    label: "Resumen General",
    href: "/admin",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    label: "Órdenes de Compra",
    href: "/admin/ordenes",
    icon: ShoppingBag,
    exact: false,
  },
  {
    label: "Catálogo de Productos",
    href: "/admin/productos",
    icon: Shirt,
    exact: true,
  },
  {
    label: "Categorías",
    href: "/admin/categorias",
    icon: Tags,
    exact: false,
  },
  {
    label: "Nuevo Producto",
    href: "/admin/productos/nuevo",
    icon: PlusCircle,
    exact: true,
  },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-full flex-col border-b border-stone-200 bg-stone-950 text-stone-200 lg:w-64 lg:shrink-0 lg:border-r lg:border-b-0">
      {/* Identidad del Backoffice */}
      <div className="flex h-16 items-center justify-between border-b border-stone-800 px-6">
        <Link href="/admin" className="flex items-center gap-2.5">
          <span className="text-base font-bold tracking-[0.2em] text-white uppercase">
            OLÉ
          </span>
          <span className="rounded bg-stone-800 px-2 py-0.5 text-[10px] font-semibold tracking-wider text-stone-300 uppercase">
            Admin
          </span>
        </Link>

        <ShieldCheck className="h-4 w-4 text-emerald-400" />
      </div>

      {/* Navegación Principal */}
      <nav className="flex-1 space-y-1 px-3 py-5">
        <p className="px-3 pb-2 text-[10px] font-semibold tracking-widest text-stone-500 uppercase">
          Gestión Operativa
        </p>

        {ADMIN_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-medium transition-colors ${
                isActive
                  ? "bg-white text-stone-950 shadow-xs"
                  : "text-stone-400 hover:bg-stone-900 hover:text-white"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Pie del Sidebar: Acceso directo a la Tienda Pública */}
      <div className="border-t border-stone-800 p-4">
        <Link
          href="/"
          target="_blank"
          className="flex items-center justify-between rounded-lg border border-stone-800 bg-stone-900/60 px-3.5 py-2.5 text-xs font-medium text-stone-300 transition-colors hover:border-stone-700 hover:text-white"
        >
          <span>Ver Tienda Pública</span>
          <ExternalLink className="h-3.5 w-3.5 text-stone-400" />
        </Link>
      </div>
    </aside>
  );
}
