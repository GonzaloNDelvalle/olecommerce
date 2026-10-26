import { Suspense } from "react";
import Link from "next/link";
import {
  DollarSign,
  CheckCircle2,
  Clock,
  Shirt,
  ArrowRight,
} from "lucide-react";
import { getAdminDashboardSummary } from "@/modules/admin/actions/admin-orders.actions";
import { OrderStatusBadge } from "@/modules/admin/components/OrderStatusBadge";

const arsFormatter = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

const dateFormatter = new Intl.DateTimeFormat("es-AR", {
  dateStyle: "short",
  timeStyle: "short",
});

async function DashboardContent() {
  const summary = await getAdminDashboardSummary();

  return (
    <div className="space-y-8">
      {/* Tarjetas de KPIs Ejecutivos */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold tracking-wider text-stone-500 uppercase">
              Facturación Acreditada
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-4 text-2xl font-bold text-stone-900">
            {arsFormatter.format(summary.totalRevenueArs)}
          </p>
          <p className="mt-1 text-xs text-stone-500">
            Órdenes confirmadas por MercadoPago
          </p>
        </div>

        <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold tracking-wider text-stone-500 uppercase">
              Órdenes Pagadas (PAID)
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-4 text-2xl font-bold text-stone-900">
            {summary.paidOrdersCount}
          </p>
          <p className="mt-1 text-xs text-stone-500">
            Listas para empaque y despacho
          </p>
        </div>

        <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold tracking-wider text-stone-500 uppercase">
              Pendientes (PENDING)
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
              <Clock className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-4 text-2xl font-bold text-stone-900">
            {summary.pendingOrdersCount}
          </p>
          <p className="mt-1 text-xs text-stone-500">
            Con stock reservado esperando pago
          </p>
        </div>

        <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold tracking-wider text-stone-500 uppercase">
              Productos Activos
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-stone-100 text-stone-800">
              <Shirt className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-4 text-2xl font-bold text-stone-900">
            {summary.activeProductsCount}
          </p>
          <p className="mt-1 text-xs text-stone-500">
            Publicados en tienda online
          </p>
        </div>
      </div>

      {/* Últimas Órdenes Recibidas */}
      <section className="rounded-xl border border-stone-200 bg-white shadow-2xs">
        <div className="flex items-center justify-between border-b border-stone-200 px-6 py-5">
          <div>
            <h2 className="text-base font-semibold text-stone-900">
              Compras Recientes
            </h2>
            <p className="mt-0.5 text-xs text-stone-500">
              Últimas 5 órdenes generadas en la plataforma
            </p>
          </div>

          <Link
            href="/admin/ordenes"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-900 hover:text-stone-600"
          >
            Ver todas las órdenes
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {summary.recentOrders.length === 0 ? (
          <div className="p-12 text-center text-sm text-stone-500">
            Todavía no se registraron órdenes de compra.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-stone-200 bg-stone-50 text-xs font-semibold tracking-wider text-stone-500 uppercase">
                <tr>
                  <th className="px-6 py-3.5">Orden</th>
                  <th className="px-6 py-3.5">Clienta / DNI</th>
                  <th className="px-6 py-3.5">Prendas</th>
                  <th className="px-6 py-3.5">Estado</th>
                  <th className="px-6 py-3.5 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {summary.recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-stone-50/70">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link
                        href={`/admin/ordenes/${order.id}`}
                        className="font-semibold text-stone-900 underline-offset-4 hover:underline"
                      >
                        #{order.orderNumber}
                      </Link>
                      <p className="text-xs text-stone-500">
                        {dateFormatter.format(new Date(order.createdAt))}
                      </p>
                    </td>

                    <td className="px-6 py-4">
                      <p className="font-medium text-stone-900">
                        {order.user.firstName} {order.user.lastName}
                      </p>
                      <p className="text-xs text-stone-500">
                        DNI/CUIT: {order.customerDocument} • {order.user.email}
                      </p>
                    </td>

                    <td className="px-6 py-4">
                      <ul className="space-y-0.5 text-xs text-stone-600">
                        {order.items.map((item) => (
                          <li key={item.id}>
                            <strong>{item.quantity}x</strong> {item.productName}{" "}
                            <span className="text-stone-400">
                              ({item.colorName} / Talle {item.sizeName})
                            </span>
                          </li>
                        ))}
                      </ul>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <OrderStatusBadge status={order.status} />
                    </td>

                    <td className="px-6 py-4 text-right font-semibold whitespace-nowrap text-stone-900">
                      {arsFormatter.format(order.totalAmount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

export default function AdminDashboardPage() {
  return (
    <div>
      <header className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-stone-900">
          Resumen General
        </h1>
        <p className="mt-1 text-sm text-stone-500">
          Monitoreo de ventas, pagos de MercadoPago y reservas de inventario en
          tiempo real.
        </p>
      </header>

      <Suspense
        fallback={
          <div className="h-96 animate-pulse rounded-xl bg-stone-200/70" />
        }
      >
        <DashboardContent />
      </Suspense>
    </div>
  );
}
