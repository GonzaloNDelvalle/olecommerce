import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import {
  Check,
  Clock,
  Landmark,
  MessageCircle,
  Mail,
  ShieldCheck,
} from "lucide-react";
import { getConfirmationOrderDetails } from "@/modules/orders/checkout.actions";
import { PurchaseTracker } from "@/components/analytics/PurchaseTracker";
import { getStoreSettings } from "@/modules/settings/store-settings";
import { CopyButton } from "@/components/shop/CopyButton";
import { OrderStatus, PaymentProvider, PaymentStatus } from "@prisma/client";

interface OrderConfirmationPageProps {
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
  dateStyle: "medium",
  timeStyle: "short",
});

async function OrderConfirmationContent({
  paramsPromise,
}: {
  paramsPromise: Promise<{ id: string }>;
}) {
  const { id } = await paramsPromise;
  const [order, store] = await Promise.all([
    getConfirmationOrderDetails(id),
    getStoreSettings(),
  ]);

  if (!order) {
    notFound();
  }

  const isBankTransfer = order.paymentProvider === PaymentProvider.BANK_TRANSFER;
  const isPaid =
    order.status === OrderStatus.PAID ||
    order.paymentStatus === PaymentStatus.APPROVED;

  // Enlace y mensaje predeterminado para WhatsApp
  const cleanPhone = (store.whatsappNumber ?? "").replace(/[^0-9]/g, "");
  const whatsappMessage = encodeURIComponent(
    `Hola OL., te envío el comprobante de pago para mi pedido #${order.orderNumber} a nombre de ${order.customerName}. Monto: ${arsFormatter.format(
      order.totalAmount
    )}.`
  );
  const whatsappUrl = `https://wa.me/${cleanPhone}?text=${whatsappMessage}`;

  const mailSubject = encodeURIComponent(`Comprobante de Pago — Orden #${order.orderNumber}`);
  const mailBody = encodeURIComponent(
    `Hola equipo de OL., adjunto el comprobante de transferencia bancaria para la orden #${order.orderNumber}.\n\nTitular: ${order.customerName}\nMonto: ${arsFormatter.format(
      order.totalAmount
    )}`
  );
  const mailtoUrl = `mailto:${store.supportEmail}?subject=${mailSubject}&body=${mailBody}`;

  return (
    <div className="w-full max-w-2xl mx-auto py-12 sm:py-16 px-4">
      {/* Contenedor central de remito / recibo editorial */}
      <article className="rounded-[28px] border border-stone-200 bg-white p-6 text-ink shadow-[0_20px_60px_rgba(44,33,25,0.06)] sm:p-12">
        {/* Encabezado Editorial */}
        <header className="text-center pb-8 border-b border-stone-200">
          <Link
            href="/"
            className="display text-4xl font-semibold tracking-normal text-ink inline-block hover:text-chocolate transition-colors"
          >
            OL.
          </Link>
          <h1 className="display mt-6 text-[clamp(36px,5vw,52px)] text-ink">
            {isPaid ? "Pago acreditado" : "Pedido confirmado"}
          </h1>
          <p className="mt-2 text-[15px] text-stone-700">
            ORDEN #{order.orderNumber} &bull; {dateFormatter.format(new Date(order.createdAt))}
          </p>
        </header>

        {/* Conversión: pago acreditado o pedido por transferencia confirmado */}
        {(isPaid || isBankTransfer) && (
          <PurchaseTracker
            orderId={order.id}
            orderNumber={order.orderNumber}
            total={order.totalAmount}
            shipping={order.shippingCost}
            items={order.items.map((item) => ({
              id: item.variantSku,
              name: item.productName,
              variant: `${item.colorName} / ${item.sizeName}`,
              price: item.unitPrice,
              quantity: item.quantity,
            }))}
          />
        )}

        {/* Sección de Estado & Mensaje */}
        <div className="py-8 border-b border-stone-200 text-center">
          {isPaid ? (
            <div className="flex flex-col items-center">
              <div className="h-10 w-10 flex items-center justify-center rounded-full bg-olive text-paper mb-4">
                <Check className="h-5 w-5 stroke-[1.5]" />
              </div>
              <h2 className="font-sans text-lg font-semibold text-ink">
                Pago Acreditado
              </h2>
              <p className="font-sans text-xs font-normal tracking-wide text-stone-600 mt-2 max-w-md">
                Hola {order.customerName}, confirmamos el cobro de tu compra. Tu pedido está siendo preparado con dedicación en nuestro atelier para ser despachado.
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <div className="h-10 w-10 flex items-center justify-center rounded-full border border-ink text-ink mb-4">
                <Clock className="h-5 w-5 stroke-[1.2]" />
              </div>
              <h2 className="font-sans text-lg font-semibold text-ink">
                Reserva de Prendas Exitosa
              </h2>
              <p className="font-sans text-xs font-normal tracking-wide text-stone-600 mt-2 max-w-md">
                Hola {order.customerName}, reservamos tu stock por 24 hs hábiles. Para completar tu orden, realizá la transferencia por el monto exacto detallado a continuación.
              </p>
            </div>
          )}
        </div>

        {/* Si pagó por Transferencia y aún no está acreditado: Bloque de CBU / Alias y Acciones */}
        {isBankTransfer && !isPaid && (
          <section className="py-8 border-b border-stone-200">
            <div className="flex items-center gap-2 mb-4">
              <Landmark className="h-4 w-4 stroke-[1.5] text-stone-700" />
              <h3 className="font-sans text-base font-semibold text-ink">
                Datos para la Transferencia Bancaria
              </h3>
            </div>

            <div className="bg-white border border-stone-200/90 p-5 space-y-3.5 text-xs font-sans">
              <div className="flex justify-between items-baseline border-b border-stone-100 pb-2">
                <span className="text-[13px] text-stone-600">
                  Banco
                </span>
                <span className="font-medium text-stone-800 text-right">
                  {store.bankName}
                </span>
              </div>

              <div className="flex justify-between items-baseline border-b border-stone-100 pb-2">
                <span className="text-[13px] text-stone-600">
                  Titular
                </span>
                <span className="font-medium text-stone-800 text-right">
                  {store.bankAccountHolder}
                </span>
              </div>

              <div className="flex justify-between items-baseline border-b border-stone-100 pb-2">
                <span className="text-[13px] text-stone-600">
                  CUIT
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-ink font-medium">{store.bankCuit}</span>
                  <CopyButton textToCopy={store.bankCuit ?? ""} label="Copiar" />
                </div>
              </div>

              <div className="flex justify-between items-baseline border-b border-stone-100 pb-2">
                <span className="text-[13px] text-stone-600">
                  Alias CBU
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-ink font-medium">{store.bankAlias}</span>
                  <CopyButton textToCopy={store.bankAlias ?? ""} label="Copiar" />
                </div>
              </div>

              <div className="flex justify-between items-baseline">
                <span className="text-[13px] text-stone-600">
                  CBU (22 dígitos)
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-ink font-medium sm:text-xs">
                    {store.bankCbu}
                  </span>
                  <CopyButton textToCopy={store.bankCbu ?? ""} label="Copiar" />
                </div>
              </div>
            </div>

            {/* Llamados a la acción para enviar el comprobante */}
            <div className="mt-5 space-y-2.5">
              <p className="text-xs font-normal text-stone-500 text-center tracking-wide">
                Al transferir, enviá el comprobante indicando tu número de orden:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="pressable inline-flex h-12 items-center justify-center gap-2 rounded-full bg-ink px-6 text-sm font-semibold text-paper hover:bg-espresso"
                >
                  <MessageCircle className="h-4 w-4 stroke-[1.5]" />
                  <span>Enviar por WhatsApp</span>
                </a>
                <a
                  href={mailtoUrl}
                  className="pressable inline-flex h-12 items-center justify-center gap-2 rounded-full border border-ink px-6 text-sm font-semibold text-ink hover:bg-ink hover:text-paper"
                >
                  <Mail className="h-4 w-4 stroke-[1.5]" />
                  <span>Enviar por Email</span>
                </a>
              </div>
            </div>
          </section>
        )}

        {/* Desglose Compacto del Pedido */}
        <section className="py-8 border-b border-stone-200">
          <h3 className="font-sans text-base font-semibold text-ink mb-5">
            Detalle de las Prendas
          </h3>

          <div className="divide-y divide-stone-200/70">
            {order.items.map((item) => (
              <div key={item.id} className="py-4 first:pt-0 last:pb-0 flex items-center gap-4">
                <div className="relative aspect-[3/4] w-14 shrink-0 bg-cream overflow-hidden border border-stone-200">
                  {item.imageUrl ? (
                    <Image
                      src={item.imageUrl}
                      alt={item.productName}
                      fill
                      sizes="56px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs uppercase tracking-wider text-stone-500">
                      OL.
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0 font-sans">
                  <p className="truncate text-sm font-semibold text-ink">
                    {item.productName}
                  </p>
                  <p className="text-xs font-normal text-stone-500 mt-0.5">
                    Talle: {item.sizeName} &bull; Color: {item.colorName}
                  </p>
                  <p className="text-xs font-normal text-stone-500">
                    Cantidad: {item.quantity}
                  </p>
                </div>

                <div className="text-right font-sans">
                  <p className="text-xs font-medium text-ink">
                    {arsFormatter.format(item.subtotal)}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Resumen Financiero */}
          <div className="mt-6 pt-5 border-t border-stone-200 space-y-2 text-xs font-sans font-normal">
            <div className="flex justify-between text-stone-600">
              <span className="text-sm">Subtotal</span>
              <span className="font-normal text-stone-800">{arsFormatter.format(order.subtotal)}</span>
            </div>

            {order.discountAmount > 0 && (
              <div className="flex justify-between text-chocolate">
                <span className="text-sm">
                  Descuento Transferencia ({store.bankTransferDiscountPercentage}% OFF)
                </span>
                <span className="font-medium">-{arsFormatter.format(order.discountAmount)}</span>
              </div>
            )}

            <div className="flex justify-between text-stone-600">
              <span className="text-sm">Envío</span>
              <span className="text-sm font-semibold text-ink">
                {order.shippingCost > 0 ? arsFormatter.format(order.shippingCost) : "Bonificado"}
              </span>
            </div>

            <div className="flex justify-between items-baseline pt-3 border-t border-stone-200 text-ink">
              <span className="text-base font-semibold">
                Total {isPaid ? "Abonado" : "a Transferir"}
              </span>
              <span className="font-sans text-xl font-normal tracking-tight text-ink">
                {arsFormatter.format(order.totalAmount)}
              </span>
            </div>
          </div>
        </section>

        {/* Garantía y Botón Secundario */}
        <footer className="pt-8 text-center space-y-6">
          <div className="flex items-center justify-center gap-2 text-xs text-stone-500 font-sans font-normal">
            <ShieldCheck className="h-4 w-4 stroke-[1.4] text-stone-600" />
            <span>Enviamos la confirmación detallada a <strong>{order.customerEmail}</strong></span>
          </div>

          <div>
            <Link
              href="/productos"
              className="pressable inline-flex h-12 items-center justify-center rounded-full border border-ink px-8 text-sm font-semibold text-ink hover:bg-ink hover:text-paper"
            >
              Volver a la tienda
            </Link>
          </div>
        </footer>
      </article>
    </div>
  );
}

export default function OrderConfirmationPage({
  params,
}: OrderConfirmationPageProps) {
  return (
    <main className="min-h-screen bg-cream/50/50">
      <Suspense
        fallback={
          <div className="w-full max-w-2xl mx-auto py-16 px-4">
            <div className="border border-stone-200 bg-paper p-12 h-96 animate-pulse" />
          </div>
        }
      >
        <OrderConfirmationContent paramsPromise={params} />
      </Suspense>
    </main>
  );
}
