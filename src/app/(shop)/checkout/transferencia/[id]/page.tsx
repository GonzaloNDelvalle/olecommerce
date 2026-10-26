import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  CheckCircle2,
  Landmark,
  FileCheck2,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { getTransferOrderDetails } from "@/modules/orders/checkout.actions";
import { BANK_TRANSFER_DISCOUNT_PERCENTAGE } from "@/modules/orders/schemas/checkout.schema";

interface TransferOrderPageProps {
  params: Promise<{
    id: string;
  }>;
}

const BANK_ACCOUNT_INFO = {
  bankName: "Banco Galicia — Cuenta Corriente en Pesos",
  accountHolder: "OLÉ INDUMENTARIA S.R.L.",
  cuit: "30-71849201-9",
  cbu: "0070099320000048192014",
  alias: "OLE.TIENDA.OFICIAL",
  whatsappNumber: "+54 9 11 2345-6789",
  supportEmail: "pagos@olecommerce.com.ar",
};

const arsFormatter = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

async function TransferSuccessContent({
  paramsPromise,
}: {
  paramsPromise: Promise<{ id: string }>;
}) {
  const { id } = await paramsPromise;
  const order = await getTransferOrderDetails(id);

  if (!order) {
    notFound();
  }

  return (
    <div className="space-y-8">
      {/* Cabecera de Confirmación */}
      <div className="rounded-2xl border border-stone-200 bg-white p-8 text-center shadow-2xs sm:p-10">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
          <CheckCircle2 className="h-8 w-8" />
        </div>

        <p className="mt-4 text-xs font-bold tracking-[0.2em] text-emerald-700 uppercase">
          ¡Stock Reservado • Orden #{order.orderNumber}!
        </p>

        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-stone-900 sm:text-3xl">
          Instrucciones para tu Transferencia Bancaria
        </h1>

        <p className="mx-auto mt-2 max-w-xl text-sm text-stone-600">
          Hola <strong>{order.customerName}</strong>, registramos tu pedido.
          Realizá la transferencia por el monto final indicado abajo e informá
          tu número de orden <strong>#{order.orderNumber}</strong> al enviar el
          comprobante.
        </p>
      </div>

      {/* Grilla: Datos Bancarios + Resumen del Monto con Descuento */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Datos de la Cuenta Bancaria (7 columnas) */}
        <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-2xs sm:p-8 lg:col-span-7">
          <div className="flex items-center gap-2.5 border-b border-stone-200 pb-4">
            <Landmark className="h-5 w-5 text-stone-900" />
            <h2 className="text-sm font-semibold tracking-wider text-stone-900 uppercase">
              Datos de la Cuenta Bancaria
            </h2>
          </div>

          <dl className="mt-5 divide-y divide-stone-100 text-sm">
            <div className="flex flex-col justify-between gap-1 py-3 sm:flex-row sm:items-center">
              <dt className="text-xs font-medium tracking-wider text-stone-500 uppercase">
                Entidad Bancaria
              </dt>
              <dd className="font-semibold text-stone-900">
                {BANK_ACCOUNT_INFO.bankName}
              </dd>
            </div>

            <div className="flex flex-col justify-between gap-1 py-3 sm:flex-row sm:items-center">
              <dt className="text-xs font-medium tracking-wider text-stone-500 uppercase">
                Titular / Razón Social
              </dt>
              <dd className="font-semibold text-stone-900">
                {BANK_ACCOUNT_INFO.accountHolder}
              </dd>
            </div>

            <div className="flex flex-col justify-between gap-1 py-3 sm:flex-row sm:items-center">
              <dt className="text-xs font-medium tracking-wider text-stone-500 uppercase">
                CUIT
              </dt>
              <dd className="font-mono font-semibold text-stone-900">
                {BANK_ACCOUNT_INFO.cuit}
              </dd>
            </div>

            <div className="flex flex-col justify-between gap-1 py-3.5 sm:flex-row sm:items-center">
              <dt className="text-xs font-medium tracking-wider text-stone-500 uppercase">
                Alias CBU
              </dt>
              <dd className="rounded-md bg-stone-100 px-3 py-1 font-mono text-sm font-bold tracking-wider text-stone-900">
                {BANK_ACCOUNT_INFO.alias}
              </dd>
            </div>

            <div className="flex flex-col justify-between gap-1 py-3.5 sm:flex-row sm:items-center">
              <dt className="text-xs font-medium tracking-wider text-stone-500 uppercase">
                CBU (22 dígitos)
              </dt>
              <dd className="rounded-md bg-stone-100 px-3 py-1 font-mono text-xs font-bold tracking-wider text-stone-900 sm:text-sm">
                {BANK_ACCOUNT_INFO.cbu}
              </dd>
            </div>
          </dl>

          <div className="mt-6 flex items-start gap-3 rounded-xl border border-stone-200 bg-stone-50 p-4 text-xs text-stone-600">
            <FileCheck2 className="mt-0.5 h-5 w-5 shrink-0 text-stone-900" />
            <div className="space-y-1">
              <p className="font-semibold text-stone-900 uppercase">
                ¿Cómo acreditamos tu pago?
              </p>
              <p className="leading-relaxed">
                Una vez realizada la transferencia, enviá el comprobante por
                WhatsApp al <strong>{BANK_ACCOUNT_INFO.whatsappNumber}</strong>{" "}
                o por correo a <strong>{BANK_ACCOUNT_INFO.supportEmail}</strong>{" "}
                indicando el <strong>Pedido #{order.orderNumber}</strong>.
              </p>
            </div>
          </div>
        </section>

        {/* Monto Final a Transferir y Número de Orden (5 columnas) */}
        <section className="flex flex-col justify-between rounded-2xl border border-stone-200 bg-stone-900 p-6 text-white shadow-2xs sm:p-8 lg:col-span-5">
          <div>
            <span className="text-xs font-semibold tracking-widest text-stone-400 uppercase">
              Comprobante de Referencia
            </span>
            <p className="mt-1 text-3xl font-bold tracking-tight text-white">
              Orden #{order.orderNumber}
            </p>
            <p className="mt-1 font-mono text-[11px] text-stone-400">
              ID: {order.id}
            </p>

            <div className="mt-6 space-y-3 border-t border-stone-800 pt-5 text-sm">
              <div className="flex justify-between text-stone-300">
                <span>Subtotal ({order.itemsCount} prenda/s)</span>
                <span>{arsFormatter.format(order.subtotal)}</span>
              </div>

              {order.discountAmount > 0 && (
                <div className="flex justify-between font-medium text-emerald-400">
                  <span>
                    Descuento Transferencia ({BANK_TRANSFER_DISCOUNT_PERCENTAGE}
                    % OFF)
                  </span>
                  <span>-{arsFormatter.format(order.discountAmount)}</span>
                </div>
              )}

              <div className="flex justify-between text-stone-300">
                <span>Envío</span>
                <span className="text-xs font-semibold text-emerald-400 uppercase">
                  Bonificado
                </span>
              </div>

              <div className="border-t border-stone-800 pt-4">
                <span className="block text-xs tracking-wider text-stone-400 uppercase">
                  Monto Final Exacto a Transferir
                </span>
                <span className="mt-1 block text-3xl font-bold text-white">
                  {arsFormatter.format(order.totalAmount)}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-8 space-y-4">
            <div className="flex items-center gap-2 text-xs text-stone-300">
              <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-400" />
              <span>
                Tus prendas permanecerán reservadas durante 24 hs hábiles.
              </span>
            </div>

            <Link
              href="/"
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-white px-6 py-3.5 text-xs font-semibold tracking-wider text-stone-900 uppercase transition-colors hover:bg-stone-200"
            >
              Volver a la Tienda
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}

export default function TransferOrderSuccessPage({
  params,
}: TransferOrderPageProps) {
  return (
    <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <Suspense
        fallback={
          <div className="h-96 animate-pulse rounded-2xl bg-stone-200/70" />
        }
      >
        <TransferSuccessContent paramsPromise={params} />
      </Suspense>
    </main>
  );
}
