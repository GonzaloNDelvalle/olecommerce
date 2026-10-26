import { Suspense } from "react";
import Link from "next/link";
import { OrderStatus } from "@prisma/client";
import {
  User,
  MapPin,
  CreditCard,
  Package,
  FileText,
  ArrowRight,
} from "lucide-react";
import { getAdminOrders } from "@/modules/admin/actions/admin-orders.actions";
import { OrderStatusBadge } from "@/modules/admin/components/OrderStatusBadge";
import { ApproveManualPaymentButton } from "@/modules/admin/components/ApproveManualPaymentButton";

interface AdminOrdersPageProps {
  searchParams: Promise<{
    status?: string;
  }>;
}

const arsFormatter = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

const dateFormatter = new Intl.DateTimeFormat("es-AR", {
  dateStyle: "medium",
  timeStyle: "short",
});

const FILTER_TABS: { label: string; value?: OrderStatus }[] = [
  { label: "Todas", value: undefined },
  { label: "Pagadas (PAID)", value: OrderStatus.PAID },
  { label: "Pendientes (PENDING)", value: OrderStatus.PENDING },
  { label: "Canceladas", value: OrderStatus.CANCELLED },
];

function parseOrderStatus(raw?: string): OrderStatus | undefined {
  if (!raw) return undefined;
  const upper = raw.toUpperCase();
  if (Object.values(OrderStatus).includes(upper as OrderStatus)) {
    return upper as OrderStatus;
  }
  return undefined;
}

async function OrdersListContent({
  searchParamsPromise,
}: {
  searchParamsPromise: Promise<{ status?: string }>;
}) {
  const { status } = await searchParamsPromise;
  const activeStatus = parseOrderStatus(status);
  const orders = await getAdminOrders(activeStatus);

  return (
    <div className="space-y-6">
      {/* Pestañas de Filtro por Estado */}
      <div className="flex flex-wrap items-center gap-2 border-b border-stone-200 pb-4">
        {FILTER_TABS.map((tab) => {
          const isSelected = activeStatus === tab.value;
          const href = tab.value
            ? `/admin/ordenes?status=${tab.value}`
            : "/admin/ordenes";

          return (
            <Link
              key={tab.label}
              href={href}
              className={`rounded-lg px-4 py-2 text-xs font-semibold transition-colors ${
                isSelected
                  ? "bg-stone-900 text-white"
                  : "border border-stone-200 bg-white text-stone-600 hover:border-stone-400 hover:text-stone-900"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      {/* Listado de Tarjetas Detalladas de Órdenes */}
      {orders.length === 0 ? (
        <div className="rounded-xl border border-dashed border-stone-300 bg-white p-12 text-center">
          <p className="text-base font-medium text-stone-800">
            No se encontraron órdenes con este filtro.
          </p>
          <p className="mt-1 text-xs text-stone-500">
            Las nuevas compras aparecerán automáticamente aquí.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {orders.map((order) => (
            <article
              key={order.id}
              className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-2xs"
            >
              {/* Cabecera de la Orden */}
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-200 bg-stone-50 px-6 py-4">
                <div className="flex flex-wrap items-center gap-3">
                  <Link
                    href={`/admin/ordenes/${order.id}`}
                    className="text-base font-bold text-stone-900 underline-offset-4 hover:underline"
                  >
                    Orden #{order.orderNumber}
                  </Link>
                  <OrderStatusBadge status={order.status} />
                  <span className="text-xs text-stone-500">
                    {dateFormatter.format(new Date(order.createdAt))}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-baseline gap-2">
                    <span className="text-xs tracking-wider text-stone-500 uppercase">
                      Total:
                    </span>
                    <span className="text-lg font-bold text-stone-900">
                      {arsFormatter.format(order.totalAmount)}
                    </span>
                  </div>

                  {order.status === OrderStatus.PENDING && (
                    <ApproveManualPaymentButton
                      orderId={order.id}
                      orderNumber={order.orderNumber}
                    />
                  )}

                  <Link
                    href={`/admin/ordenes/${order.id}`}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-stone-300 bg-white px-3.5 py-2 text-xs font-semibold text-stone-700 transition-colors hover:border-stone-900 hover:text-stone-900"
                  >
                    Ver Detalle
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>

              {/* Cuerpo en 3 Columnas: Compradora + Envío + Pago */}
              <div className="grid grid-cols-1 gap-6 border-b border-stone-100 p-6 lg:grid-cols-3">
                {/* 1. Datos de la Compradora y Facturación */}
                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2 font-semibold tracking-wider text-stone-900 uppercase">
                    <User className="h-4 w-4 text-stone-500" />
                    <span>Datos de la Compradora</span>
                  </div>
                  <div className="space-y-1 text-stone-600">
                    <p className="font-medium text-stone-900">
                      {order.user.firstName} {order.user.lastName}
                    </p>
                    <p>
                      <strong>DNI / CUIT:</strong> {order.customerDocument}
                    </p>
                    <p>
                      <strong>Email:</strong> {order.user.email}
                    </p>
                    {order.user.phone && (
                      <p>
                        <strong>Teléfono:</strong> {order.user.phone}
                      </p>
                    )}
                  </div>
                </div>

                {/* 2. Dirección de Entrega (Snapshot Inmutable) */}
                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2 font-semibold tracking-wider text-stone-900 uppercase">
                    <MapPin className="h-4 w-4 text-stone-500" />
                    <span>Domicilio de Envío</span>
                  </div>
                  <div className="space-y-1 text-stone-600">
                    <p className="font-medium text-stone-900">
                      {order.shippingAddress.street}{" "}
                      {order.shippingAddress.number}
                      {order.shippingAddress.apartment
                        ? ` (${order.shippingAddress.apartment})`
                        : ""}
                    </p>
                    <p>
                      CP {order.shippingAddress.postalCode} —{" "}
                      {order.shippingAddress.city},{" "}
                      {order.shippingAddress.state}
                    </p>
                    {order.notes && (
                      <p className="mt-1.5 flex items-start gap-1.5 rounded bg-amber-50 p-2 text-amber-900">
                        <FileText className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                        <span>Nota: {order.notes}</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* 3. Estado e Identificadores de MercadoPago */}
                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2 font-semibold tracking-wider text-stone-900 uppercase">
                    <CreditCard className="h-4 w-4 text-stone-500" />
                    <span>Pasarela MercadoPago</span>
                  </div>
                  {order.payment ? (
                    <div className="space-y-1 text-stone-600">
                      <p>
                        <strong>Estado MP:</strong>{" "}
                        <span className="font-mono font-semibold text-stone-900">
                          {order.payment.status}
                        </span>
                      </p>
                      {order.payment.paymentId && (
                        <p>
                          <strong>Payment ID:</strong>{" "}
                          <span className="font-mono">
                            {order.payment.paymentId}
                          </span>
                        </p>
                      )}
                      {order.payment.paymentMethod && (
                        <p>
                          <strong>Medio:</strong> {order.payment.paymentMethod}{" "}
                          ({order.payment.installments} cuota/s)
                        </p>
                      )}
                      {order.payment.preferenceId && (
                        <p className="truncate text-[11px] text-stone-400">
                          Pref: {order.payment.preferenceId}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-stone-400">
                      Sin registro de pago asociado.
                    </p>
                  )}
                </div>
              </div>

              {/* Detalle de Prendas Reservadas / Compradas */}
              <div className="bg-stone-50/50 px-6 py-4">
                <div className="mb-3 flex items-center gap-2 text-xs font-semibold tracking-wider text-stone-700 uppercase">
                  <Package className="h-4 w-4 text-stone-500" />
                  <span>
                    Prendas de la Orden ({order.items.length}{" "}
                    {order.items.length === 1 ? "variante" : "variantes"})
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-stone-200 text-stone-500 uppercase">
                      <tr>
                        <th className="py-2 pr-4">Prenda</th>
                        <th className="px-4 py-2">SKU</th>
                        <th className="px-4 py-2">Color / Talle</th>
                        <th className="px-4 py-2 text-center">Cantidad</th>
                        <th className="px-4 py-2 text-right">Unitario</th>
                        <th className="py-2 pl-4 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-200/60">
                      {order.items.map((item) => (
                        <tr key={item.id}>
                          <td className="py-2.5 pr-4 font-medium text-stone-900">
                            {item.productName}
                          </td>
                          <td className="px-4 py-2.5 font-mono text-stone-500">
                            {item.variantSku}
                          </td>
                          <td className="px-4 py-2.5 text-stone-700">
                            {item.colorName} • Talle {item.sizeName}
                          </td>
                          <td className="px-4 py-2.5 text-center font-semibold text-stone-900">
                            {item.quantity}
                          </td>
                          <td className="px-4 py-2.5 text-right text-stone-600">
                            {arsFormatter.format(item.unitPrice)}
                          </td>
                          <td className="py-2.5 pl-4 text-right font-semibold text-stone-900">
                            {arsFormatter.format(item.subtotal)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminOrdersPage({
  searchParams,
}: AdminOrdersPageProps) {
  return (
    <div>
      <header className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-stone-900">
          Órdenes de Compra
        </h1>
        <p className="mt-1 text-sm text-stone-500">
          Visualizá los pedidos pendientes y acreditados, datos de facturación
          ARCA/AFIP, dirección de entrega y prendas reservadas.
        </p>
      </header>

      <Suspense
        fallback={
          <div className="h-96 animate-pulse rounded-xl bg-stone-200/70" />
        }
      >
        <OrdersListContent searchParamsPromise={searchParams} />
      </Suspense>
    </div>
  );
}
