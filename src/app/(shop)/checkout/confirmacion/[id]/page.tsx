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
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { getConfirmationOrderDetails } from "@/modules/orders/checkout.actions";
import { BANK_ACCOUNT_INFO } from "@/lib/bank-account";
import { BANK_TRANSFER_DISCOUNT_PERCENTAGE } from "@/modules/orders/schemas/checkout.schema";
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
  const order = await getConfirmationOrderDetails(id);

  if (!order) {
    notFound();
  }

  const isBankTransfer = order.paymentProvider === PaymentProvider.BANK_TRANSFER;
  const isPaid =
    order.status === OrderStatus.PAID ||
    order.paymentStatus === PaymentStatus.APPROVED;

  // Enlace y mensaje predeterminado para WhatsApp
  const cleanPhone = BANK_ACCOUNT_INFO.whatsappNumber.replace(/[^0-9]/g, "");
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
  const mailtoUrl = `mailto:${BANK_ACCOUNT_INFO.supportEmail}?subject=${mailSubject}&body=${mailBody}`;

  return (
    <div className="w-full max-w-2xl mx-auto py-12 sm:py-16 px-4">
      {/* Contenedor central de remito / recibo editorial */}
      <article className="border border-stone-200 bg-[#FAF9F6] p-8 sm:p-12 text-stone-900 rounded-none shadow-xs">
        {/* Encabezado Editorial */}
        <header className="text-center pb-8 border-b border-stone-200">
          <Link
            href="/"
            className="font-serif text-3xl sm:text-4xl tracking-[0.2em] font-normal uppercase text-stone-900 inline-block hover:text-[#5C4033] transition-colors"
          >
            OL.
          </Link>
          <h1 className="font-serif text-2xl sm:text-3xl tracking-wide uppercase mt-6 text-stone-900">
            {isPaid ? "PAGO ACREDITADO" : "ORDEN CONFIRMADA"}
          </h1>
          <p className="font-sans text-xs tracking-[0.2em] text-stone-500 uppercase mt-2">
            ORDEN #{order.orderNumber} &bull; {dateFormatter.format(new Date(order.createdAt))}
          </p>
        </header>

        {/* Sección de Estado & Mensaje */}
        <div className="py-8 border-b border-stone-200 text-center">
          {isPaid ? (
            <div className="flex flex-col items-center">
              <div className="h-10 w-10 flex items-center justify-center rounded-none border border-stone-900 bg-stone-900 text-white mb-4">
                <Check className="h-5 w-5 stroke-[1.5]" />
              </div>
              <h2 className="font-serif text-lg tracking-wide uppercase text-stone-900">
                Pago Acreditado
              </h2>
              <p className="font-sans text-xs font-light tracking-wide text-stone-600 mt-2 max-w-md">
                Hola {order.customerName}, confirmamos el cobro de tu compra. Tu pedido está siendo preparado con dedicación en nuestro atelier para ser despachado.
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <div className="h-10 w-10 flex items-center justify-center rounded-none border border-stone-900 bg-transparent text-stone-900 mb-4">
                <Clock className="h-5 w-5 stroke-[1.2]" />
              </div>
              <h2 className="font-serif text-lg tracking-wide uppercase text-stone-900">
                Reserva de Prendas Exitosa
              </h2>
              <p className="font-sans text-xs font-light tracking-wide text-stone-600 mt-2 max-w-md">
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
              <h3 className="font-serif text-sm tracking-[0.15em] uppercase text-stone-900">
                Datos para la Transferencia Bancaria
              </h3>
            </div>

            <div className="bg-white border border-stone-200/90 p-5 space-y-3.5 text-xs font-sans">
              <div className="flex justify-between items-baseline border-b border-stone-100 pb-2">
                <span className="text-[11px] font-light text-stone-500 uppercase tracking-wider">
                  Banco
                </span>
                <span className="font-medium text-stone-800 text-right">
                  {BANK_ACCOUNT_INFO.bankName}
                </span>
              </div>

              <div className="flex justify-between items-baseline border-b border-stone-100 pb-2">
                <span className="text-[11px] font-light text-stone-500 uppercase tracking-wider">
                  Titular
                </span>
                <span className="font-medium text-stone-800 text-right">
                  {BANK_ACCOUNT_INFO.accountHolder}
                </span>
              </div>

              <div className="flex justify-between items-baseline border-b border-stone-100 pb-2">
                <span className="text-[11px] font-light text-stone-500 uppercase tracking-wider">
                  CUIT
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-stone-900 font-medium">{BANK_ACCOUNT_INFO.cuit}</span>
                  <CopyButton textToCopy={BANK_ACCOUNT_INFO.cuit} label="Copiar" />
                </div>
              </div>

              <div className="flex justify-between items-baseline border-b border-stone-100 pb-2">
                <span className="text-[11px] font-light text-stone-500 uppercase tracking-wider">
                  Alias CBU
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-stone-900 font-medium">{BANK_ACCOUNT_INFO.alias}</span>
                  <CopyButton textToCopy={BANK_ACCOUNT_INFO.alias} label="Copiar" />
                </div>
              </div>

              <div className="flex justify-between items-baseline">
                <span className="text-[11px] font-light text-stone-500 uppercase tracking-wider">
                  CBU (22 dígitos)
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[11px] text-stone-900 font-medium sm:text-xs">
                    {BANK_ACCOUNT_INFO.cbu}
                  </span>
                  <CopyButton textToCopy={BANK_ACCOUNT_INFO.cbu} label="Copiar" />
                </div>
              </div>
            </div>

            {/* Llamados a la acción para enviar el comprobante */}
            <div className="mt-5 space-y-2.5">
              <p className="text-[11px] font-light text-stone-500 text-center tracking-wide">
                Al transferir, enviá el comprobante indicando tu número de orden:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-none bg-stone-900 text-white font-sans text-xs tracking-[0.16em] uppercase hover:bg-stone-800 transition-colors"
                >
                  <MessageCircle className="h-4 w-4 stroke-[1.5]" />
                  <span>Enviar por WhatsApp</span>
                </a>
                <a
                  href={mailtoUrl}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-none border border-stone-900 bg-transparent text-stone-900 font-sans text-xs tracking-[0.16em] uppercase hover:bg-stone-100 transition-colors"
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
          <h3 className="font-serif text-sm tracking-[0.15em] uppercase text-stone-900 mb-5">
            Detalle de las Prendas
          </h3>

          <div className="divide-y divide-stone-200/70">
            {order.items.map((item) => (
              <div key={item.id} className="py-4 first:pt-0 last:pb-0 flex items-center gap-4">
                <div className="relative aspect-[3/4] w-14 shrink-0 bg-stone-200 overflow-hidden rounded-none border border-stone-200">
                  {item.imageUrl ? (
                    <Image
                      src={item.imageUrl}
                      alt={item.productName}
                      fill
                      sizes="56px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[9px] uppercase tracking-wider text-stone-400">
                      OL.
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0 font-sans">
                  <p className="text-xs font-normal tracking-[0.08em] text-stone-900 uppercase truncate">
                    {item.productName}
                  </p>
                  <p className="text-[11px] font-light text-stone-500 mt-0.5">
                    Talle: {item.sizeName} &bull; Color: {item.colorName}
                  </p>
                  <p className="text-[11px] font-light text-stone-500">
                    Cantidad: {item.quantity}
                  </p>
                </div>

                <div className="text-right font-sans">
                  <p className="text-xs font-medium text-stone-900">
                    {arsFormatter.format(item.subtotal)}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Resumen Financiero */}
          <div className="mt-6 pt-5 border-t border-stone-200 space-y-2 text-xs font-sans font-light">
            <div className="flex justify-between text-stone-600">
              <span className="uppercase tracking-wider text-[11px]">Subtotal</span>
              <span className="font-normal text-stone-800">{arsFormatter.format(order.subtotal)}</span>
            </div>

            {order.discountAmount > 0 && (
              <div className="flex justify-between text-[#5C4033]">
                <span className="uppercase tracking-wider text-[11px]">
                  Descuento Transferencia ({BANK_TRANSFER_DISCOUNT_PERCENTAGE}% OFF)
                </span>
                <span className="font-medium">-{arsFormatter.format(order.discountAmount)}</span>
              </div>
            )}

            <div className="flex justify-between text-stone-600">
              <span className="uppercase tracking-wider text-[11px]">Envío</span>
              <span className="font-normal uppercase tracking-wider text-[10px] text-stone-800">
                {order.shippingCost > 0 ? arsFormatter.format(order.shippingCost) : "Bonificado"}
              </span>
            </div>

            <div className="flex justify-between items-baseline pt-3 border-t border-stone-200 text-stone-900">
              <span className="font-serif text-sm tracking-[0.15em] uppercase font-normal">
                Total {isPaid ? "Abonado" : "a Transferir"}
              </span>
              <span className="font-sans text-xl font-light tracking-tight text-stone-900">
                {arsFormatter.format(order.totalAmount)}
              </span>
            </div>
          </div>
        </section>

        {/* Garantía y Botón Secundario */}
        <footer className="pt-8 text-center space-y-6">
          <div className="flex items-center justify-center gap-2 text-xs text-stone-500 font-sans font-light">
            <ShieldCheck className="h-4 w-4 stroke-[1.4] text-stone-600" />
            <span>Enviamos la confirmación detallada a <strong>{order.customerEmail}</strong></span>
          </div>

          <div>
            <Link
              href="/productos"
              className="inline-flex h-11 items-center justify-center px-8 border border-stone-900 bg-transparent text-stone-900 text-[11px] font-sans font-medium uppercase tracking-[0.2em] rounded-none hover:bg-stone-900 hover:text-white transition-colors"
            >
              VOLVER A LA TIENDA
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
    <main className="min-h-screen bg-stone-50/50">
      <Suspense
        fallback={
          <div className="w-full max-w-2xl mx-auto py-16 px-4">
            <div className="border border-stone-200 bg-[#FAF9F6] p-12 h-96 animate-pulse rounded-none" />
          </div>
        }
      >
        <OrderConfirmationContent paramsPromise={params} />
      </Suspense>
    </main>
  );
}
