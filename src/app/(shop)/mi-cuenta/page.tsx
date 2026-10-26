import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import {
  User,
  ShoppingBag,
  CreditCard,
  Landmark,
  CheckCircle2,
  Clock,
  ArrowRight,
  Package,
} from "lucide-react";
import { getCurrentCustomerProfile } from "@/modules/auth/actions/auth.actions";
import { CustomerLogoutButton } from "@/modules/auth/components/CustomerLogoutButton";
import { OrderStatusBadge } from "@/modules/admin/components/OrderStatusBadge";

const arsFormatter = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

const dateFormatter = new Intl.DateTimeFormat("es-AR", {
  dateStyle: "long",
  timeStyle: "short",
});

async function CustomerAccountContent() {
  // Fuerza la espera de la solicitud HTTP entrante antes de que Auth.js invoque crypto.getRandomValues()
  await connection();

  const profile = await getCurrentCustomerProfile();

  if (!profile) {
    redirect("/login");
  }

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
      {/* COLUMNA IZQUIERDA: Perfil de la Clienta (4 columnas) */}
      <aside className="lg:col-span-4">
        <div className="sticky top-24 rounded-xl border border-stone-200 bg-white p-6">
          <div className="flex items-center justify-between border-b border-stone-200 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-stone-100 text-stone-800">
                <User className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-stone-900">
                  {profile.firstName} {profile.lastName}
                </h2>
                <p className="text-xs text-stone-500">Clienta Registrada</p>
              </div>
            </div>
          </div>

          <dl className="mt-5 space-y-3 text-xs">
            <div>
              <dt className="text-stone-400 uppercase">Correo Electrónico</dt>
              <dd className="mt-0.5 font-medium text-stone-900">
                {profile.email}
              </dd>
            </div>

            <div>
              <dt className="text-stone-400 uppercase">DNI / CUIT</dt>
              <dd className="mt-0.5 font-mono font-medium text-stone-900">
                {profile.documentNumber || "Se completará en tu próxima compra"}
              </dd>
            </div>

            {profile.phone && (
              <div>
                <dt className="text-stone-400 uppercase">Teléfono</dt>
                <dd className="mt-0.5 font-medium text-stone-900">
                  {profile.phone}
                </dd>
              </div>
            )}

            <div>
              <dt className="text-stone-400 uppercase">Compras Realizadas</dt>
              <dd className="mt-0.5 font-semibold text-stone-900">
                {profile.orders.length}{" "}
                {profile.orders.length === 1 ? "pedido" : "pedidos"}
              </dd>
            </div>
          </dl>

          <div className="mt-6 border-t border-stone-200 pt-5">
            <CustomerLogoutButton />
          </div>
        </div>
      </aside>

      {/* COLUMNA DERECHA: Historial de Compras y Estado de Pagos (8 columnas) */}
      <section className="space-y-6 lg:col-span-8">
        <div className="flex items-center justify-between border-b border-stone-200 pb-4">
          <div>
            <h2 className="text-lg font-semibold text-stone-900">
              Historial de Mis Compras
            </h2>
            <p className="mt-0.5 text-xs text-stone-500">
              Seguimiento del estado de pago y detalle de las prendas de cada
              orden.
            </p>
          </div>
        </div>

        {profile.orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-stone-200 bg-stone-50 p-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-stone-500">
              <ShoppingBag className="h-5 w-5" />
            </div>
            <h3 className="mt-4 text-sm font-semibold text-stone-900">
              Todavía no realizaste compras con esta cuenta
            </h3>
            <p className="mt-1 max-w-sm text-xs text-stone-500">
              Explorá el catálogo para elegir tus prendas y hacer seguimiento de
              tus pedidos desde aquí.
            </p>
            <Link
              href="/"
              className="mt-5 inline-flex items-center gap-2 rounded-lg bg-stone-900 px-5 py-2.5 text-xs font-semibold tracking-wider text-white uppercase transition-colors hover:bg-stone-800"
            >
              Explorar Catálogo
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        ) : (
          <div className="space-y-5">
            {profile.orders.map((order) => {
              const isBankTransfer =
                order.payment?.provider === "BANK_TRANSFER";
              const isPaid =
                order.status === "PAID" ||
                order.status === "PROCESSING" ||
                order.status === "SHIPPED" ||
                order.status === "DELIVERED" ||
                order.payment?.status === "APPROVED";

              return (
                <article
                  key={order.id}
                  className="overflow-hidden rounded-xl border border-stone-200 bg-white"
                >
                  {/* Cabecera de la Orden */}
                  <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-200 bg-stone-50 px-6 py-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="text-sm font-bold text-stone-900">
                        Orden #{order.orderNumber}
                      </span>
                      <OrderStatusBadge status={order.status} />
                      <span className="text-xs text-stone-500">
                        {dateFormatter.format(new Date(order.createdAt))}
                      </span>
                    </div>

                    <div className="flex items-baseline gap-2">
                      <span className="text-[11px] tracking-wider text-stone-500 uppercase">
                        Total:
                      </span>
                      <span className="text-base font-bold text-stone-900">
                        {arsFormatter.format(order.totalAmount)}
                      </span>
                    </div>
                  </div>

                  {/* Bloque de Estado Actual del Pago (Validación de Transferencia / MercadoPago) */}
                  <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-100 px-6 py-4 text-xs">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-stone-200 bg-stone-50 text-stone-700">
                        {isBankTransfer ? (
                          <Landmark className="h-4 w-4" />
                        ) : (
                          <CreditCard className="h-4 w-4" />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-stone-900">
                          Medio de Pago:{" "}
                          {isBankTransfer
                            ? "Transferencia Bancaria"
                            : "Mercado Pago"}
                        </p>
                        <div className="mt-0.5 flex items-center gap-1.5">
                          {isPaid ? (
                            <span className="inline-flex items-center gap-1 font-medium text-emerald-700">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Pago Acreditado y Verificado
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 font-medium text-amber-700">
                              <Clock className="h-3.5 w-3.5" />
                              {isBankTransfer
                                ? "Pendiente de validación de transferencia por administración"
                                : "Pago en proceso / pendiente de confirmación"}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {isBankTransfer && order.status === "PENDING" && (
                      <Link
                        href={`/checkout/transferencia/${order.id}`}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-stone-900 bg-white px-3.5 py-2 text-xs font-semibold text-stone-900 transition-colors hover:bg-stone-900 hover:text-white"
                      >
                        Ver Datos Bancarios / CBU
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    )}
                  </div>

                  {/* Detalle de Ítems Comprados */}
                  <div className="px-6 py-4">
                    <div className="mb-3 flex items-center gap-2 text-[11px] font-semibold tracking-wider text-stone-500 uppercase">
                      <Package className="h-3.5 w-3.5" />
                      <span>
                        Detalle de Prendas ({order.items.length}{" "}
                        {order.items.length === 1 ? "ítem" : "ítems"})
                      </span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="border-b border-stone-200 text-stone-400 uppercase">
                          <tr>
                            <th className="py-2 pr-4">Prenda</th>
                            <th className="px-3 py-2">Color / Talle</th>
                            <th className="px-3 py-2 text-center">Cant.</th>
                            <th className="px-3 py-2 text-right">Unitario</th>
                            <th className="py-2 pl-3 text-right">Subtotal</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100">
                          {order.items.map((item) => (
                            <tr key={item.id}>
                              <td className="py-2.5 pr-4">
                                <p className="font-medium text-stone-900">
                                  {item.productName}
                                </p>
                                <p className="font-mono text-[10px] text-stone-400">
                                  SKU: {item.variantSku}
                                </p>
                              </td>
                              <td className="px-3 py-2.5 text-stone-600">
                                {item.colorName} • Talle {item.sizeName}
                              </td>
                              <td className="px-3 py-2.5 text-center font-semibold text-stone-900">
                                {item.quantity}
                              </td>
                              <td className="px-3 py-2.5 text-right text-stone-600">
                                {arsFormatter.format(item.unitPrice)}
                              </td>
                              <td className="py-2.5 pl-3 text-right font-semibold text-stone-900">
                                {arsFormatter.format(item.subtotal)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {order.discountAmount > 0 && (
                      <div className="mt-3 flex justify-end border-t border-stone-100 pt-2.5 text-xs text-emerald-700">
                        <span>
                          Descuento por Transferencia aplicado: -
                          {arsFormatter.format(order.discountAmount)}
                        </span>
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

export default function CustomerAccountPage() {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <header className="mb-10 border-b border-stone-200 pb-6">
        <p className="text-[11px] font-semibold tracking-[0.25em] text-stone-500 uppercase">
          Espacio Personal
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-stone-900 sm:text-3xl">
          Mi Cuenta y Mis Pedidos
        </h1>
      </header>

      <Suspense
        fallback={
          <div className="h-96 animate-pulse rounded-xl border border-stone-200 bg-stone-50" />
        }
      >
        <CustomerAccountContent />
      </Suspense>
    </main>
  );
}
