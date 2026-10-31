import { Suspense, type ReactNode } from "react";
import type { Metadata } from "next";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

export const metadata: Metadata = {
  title: "Backoffice Admin | OLEcommerce",
  description:
    "Panel de administración de órdenes, inventario y catálogo de OLEcommerce.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-stone-100 text-stone-900 lg:flex-row">
      {/* Menú de Navegación Lateral */}
      <Suspense
        fallback={
          <aside className="h-16 w-full bg-stone-950 lg:h-screen lg:w-64 lg:shrink-0" />
        }
      >
        <AdminSidebar />
      </Suspense>

      {/* Área Principal de Trabajo */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Barra Superior de Contexto */}
        <header className="flex h-16 items-center justify-between border-b border-stone-200 bg-white px-6 lg:px-10">
          <div>
            <p className="text-xs font-semibold tracking-wider text-stone-500 uppercase">
              Panel de Control Operativo
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
              Sesión Admin Activa
            </span>
          </div>
        </header>

        {/* Contenido Dinámico de cada Vista (/admin, /admin/ordenes, /admin/productos) */}
        <main className="min-w-0 flex-1 p-6 lg:p-10">{children}</main>
      </div>
    </div>
  );
}
