import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { OrderStatus } from "@prisma/client";
import {
  ArrowLeft,
  User,
  MapPin,
  CreditCard,
  Package,
  FileText,
  Landmark,
} from "lucide-react";
import { getAdminOrderById } from "@/modules/admin/actions/admin-orders.actions";
import { OrderStatusBadge } from "@/modules/admin/components/OrderStatusBadge";
import { ApproveManualPaymentButton } from "@/modules/admin/components/ApproveManualPaymentButton";

interface AdminOrderDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

const arsFormatter = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

const dateFormatter = new Intl.DateTimeFormat("es-AR", {
  dateStyle: "long",
  timeStyle: "short",
});

async function OrderDetailContent({
  paramsPromise,
}: {
  paramsPromise: Promise<{ id: string }>;
}) {
  const { id } = await paramsPromise;
  const order = await getAdminOrderById(id);

  if (!order) {
    notFound();
  }

  return (
    <div className="space-y-6">
      {/* Cabecera Ejecutiva de la Orden + Acción de Acreditación Manual */}
      <div className="flex flex-wrap items-start justify-between gap-4 rounded-xl border border-stone-200 bg-white p-6 shadow-2xs">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-stone-900">
              Orden #{order.orderNumber}
            </h1>
            <OrderStatusBadge status={order.status} />
          </div>
          <p className="text-xs text-stone-500">
            Creada el {dateFormatter.format(new Date(order.createdAt))} • ID:{" "}
            <span className="font-mono">{order.id}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          {order.status === OrderStatus.PENDING && (
            <ApproveManualPaymentButton
              orderId={order.id}
              orderNumber={order.orderNumber}
            />
          )}
        </div>
      </div>

      {/* Grilla de Información: Clienta + Domicilio + Estado de Pago */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* 1. Datos de la Compradora y Facturación */}
        <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-2xs">
          <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-stone-900 uppercase">
            <User className="h-4 w-4 text-stone-500" />
            <h2>Datos de la Compradora</h2>
          </div>

          <dl className="mt-4 space-y-2.5 text-sm text-stone-600">
            <div>
              <dt className="text-xs text-stone-400">Nombre y Apellido</dt>
              <dd className="font-semibold text-stone-900">
                {order.user.firstName} {order.user.lastName}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-stone-400">
                DNI / CUIT (Facturación ARCA)
              </dt>
              <dd className="font-mono font-medium text-stone-900">
                {order.customerDocument}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-stone-400">Correo Electrónico</dt>
              <dd className="text-stone-800">{order.user.email}</dd>
            </div>
            {order.user.phone && (
              <div>
                <dt className="text-xs text-stone-400">Teléfono de Contacto</dt>
                <dd className="text-stone-800">{order.user.phone}</dd>
              </div>
            )}
          </dl>
        </section>

        {/* 2. Dirección de Envío (Snapshot Inmutable) */}
        <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-2xs">
          <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-stone-900 uppercase">
            <MapPin className="h-4 w-4 text-stone-500" />
            <h2>Domicilio de Entrega</h2>
          </div>

          <div className="mt-4 space-y-2 text-sm text-stone-600">
            <p className="font-semibold text-stone-900">
              {order.shippingAddress.street} {order.shippingAddress.number}
              {order.shippingAddress.apartment
                ? ` (${order.shippingAddress.apartment})`
                : ""}
            </p>
            <p>
              Código Postal:{" "}
              <strong className="text-stone-900">
                {order.shippingAddress.postalCode}
              </strong>
            </p>
            <p>
              {order.shippingAddress.city}, {order.shippingAddress.state}
            </p>
            {order.shippingAddress.recipient && (
              <p className="text-xs text-stone-500">
                Recibe: {order.shippingAddress.recipient}
              </p>
            )}

            {order.notes && (
              <div className="mt-3 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                <FileText className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  <strong>Indicaciones de entrega:</strong> {order.notes}
                </span>
              </div>
            )}
          </div>
        </section>

        {/* 3. Información Financiera y Pasarela de Pago */}
        <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-2xs">
          <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-stone-900 uppercase">
            {order.payment?.provider === "BANK_TRANSFER" ? (
              <Landmark className="h-4 w-4 text-stone-500" />
            ) : (
              <CreditCard className="h-4 w-4 text-stone-500" />
            )}
            <h2>Información del Pago</h2>
          </div>

          {order.payment ? (
            <dl className="mt-4 space-y-2.5 text-sm text-stone-600">
              <div>
                <dt className="text-xs text-stone-400">Canal / Proveedor</dt>
                <dd className="font-semibold text-stone-900">
                  {order.payment.provider === "BANK_TRANSFER"
                    ? "Transferencia / Efectivo (Validación Manual)"
                    : "MercadoPago Checkout Pro"}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-stone-400">
                  Estado de Transacción
                </dt>
                <dd className="font-mono font-semibold text-stone-900">
                  {order.payment.status}
                </dd>
              </div>
              {order.payment.paymentId && (
                <div>
                  <dt className="text-xs text-stone-400">
                    ID de Pago (MercadoPago)
                  </dt>
                  <dd className="font-mono text-xs text-stone-800">
                    {order.payment.paymentId}
                  </dd>
                </div>
              )}
              {order.payment.paymentMethod && (
                <div>
                  <dt className="text-xs text-stone-400">Medio de Pago</dt>
                  <dd className="text-stone-800">
                    {order.payment.paymentMethod} ({order.payment.installments}{" "}
                    cuota/s)
                  </dd>
                </div>
              )}
              {order.payment.paidAt && (
                <div>
                  <dt className="text-xs text-stone-400">
                    Fecha de Acreditación
                  </dt>
                  <dd className="text-xs font-medium text-emerald-700">
                    {dateFormatter.format(new Date(order.payment.paidAt))}
                  </dd>
                </div>
              )}
            </dl>
          ) : (
            <p className="mt-4 text-sm text-stone-400">
              Sin registro de pago asociado.
            </p>
          )}
        </section>
      </div>

      {/* Tabla de Prendas de la Orden y Desglose de Totales */}
      <section className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-2xs">
        <div className="flex items-center gap-2 border-b border-stone-200 bg-stone-50 px-6 py-4 text-xs font-semibold tracking-wider text-stone-800 uppercase">
          <Package className="h-4 w-4 text-stone-500" />
          <h2>
            Prendas Incluidas en el Pedido ({order.items.length}{" "}
            {order.items.length === 1 ? "ítem" : "ítems"})
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-stone-200 text-xs text-stone-500 uppercase">
              <tr>
                <th className="px-6 py-3.5">Prenda</th>
                <th className="px-6 py-3.5">SKU</th>
                <th className="px-6 py-3.5">Color / Talle</th>
                <th className="px-6 py-3.5 text-center">Cantidad</th>
                <th className="px-6 py-3.5 text-right">Precio Unitario</th>
                <th className="px-6 py-3.5 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200">
              {order.items.map((item) => (
                <tr key={item.id} className="hover:bg-stone-50/60">
                  <td className="px-6 py-4 font-medium text-stone-900">
                    {item.productName}
                  </td>
                  <td className="px-6 py-4 font-mono text-xs text-stone-500">
                    {item.variantSku}
                  </td>
                  <td className="px-6 py-4 text-stone-700">
                    {item.colorName} • Talle {item.sizeName}
                  </td>
                  <td className="px-6 py-4 text-center font-semibold text-stone-900">
                    {item.quantity}
                  </td>
                  <td className="px-6 py-4 text-right text-stone-600">
                    {arsFormatter.format(item.unitPrice)}
                  </td>
                  <td className="px-6 py-4 text-right font-semibold text-stone-900">
                    {arsFormatter.format(item.subtotal)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Resumen Financiero */}
        <div className="border-t border-stone-200 bg-stone-50/70 px-6 py-5">
          <div className="ml-auto max-w-xs space-y-2 text-sm">
            <div className="flex justify-between text-stone-600">
              <span>Subtotal prendas</span>
              <span>{arsFormatter.format(order.subtotal)}</span>
            </div>
            {order.discountAmount > 0 && (
              <div className="flex justify-between text-emerald-700">
                <span>Descuento aplicado</span>
                <span>-{arsFormatter.format(order.discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between text-stone-600">
              <span>Costo de envío</span>
              <span>
                {order.shippingCost > 0
                  ? arsFormatter.format(order.shippingCost)
                  : "Gratis"}
              </span>
            </div>
            <div className="flex justify-between border-t border-stone-200 pt-2 text-base font-bold text-stone-900">
              <span>Total de la Orden</span>
              <span>{arsFormatter.format(order.totalAmount)}</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default function AdminOrderDetailPage({
  params,
}: AdminOrderDetailPageProps) {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <Link
          href="/admin/ordenes"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-stone-500 transition-colors hover:text-stone-900"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Volver al listado de órdenes
        </Link>
      </div>

      <Suspense
        fallback={
          <div className="h-96 animate-pulse rounded-xl bg-stone-200/70" />
        }
      >
        <OrderDetailContent paramsPromise={params} />
      </Suspense>
    </div>
  );
}
