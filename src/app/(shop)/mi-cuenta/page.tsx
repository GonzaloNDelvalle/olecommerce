import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { ExternalLink, Truck } from "lucide-react";
import { OrderStatus } from "@prisma/client";
import { getCurrentCustomerProfile } from "@/modules/auth/actions/auth.actions";
import { CustomerLogoutButton } from "@/modules/auth/components/CustomerLogoutButton";

const arsFormatter = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

const dateFormatter = new Intl.DateTimeFormat("es-AR", {
  day: "2-digit",
  month: "long",
  year: "numeric",
});

const EDITORIAL_STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; className: string }
> = {
  PENDING: {
    label: "Pago pendiente",
    className: "border-brick/30 bg-brick/5 text-brick",
  },
  PAID: {
    label: "Pagado · en preparación",
    className: "border-olive/30 bg-olive/10 text-olive-deep",
  },
  PROCESSING: {
    label: "En preparación",
    className: "border-stone-300 bg-cream text-ink",
  },
  SHIPPED: {
    label: "En camino",
    className: "border-caramel/40 bg-cream text-chocolate",
  },
  DELIVERED: {
    label: "Entregado",
    className: "border-stone-300 bg-cream text-ink",
  },
  CANCELLED: {
    label: "Cancelado",
    className: "border-stone-300 bg-cream text-stone-700",
  },
};

function resolveCarrierTrackingUrl(
  carrier: string | null,
  trackingCode: string | null
): string {
  const normalized = (carrier || "").toLowerCase();
  const code = (trackingCode || "").trim();

  if (normalized.includes("andreani")) {
    return code
      ? `https://www.andreani.com/#!/informacionEnvio/${encodeURIComponent(code)}`
      : "https://www.andreani.com/";
  }

  if (normalized.includes("correo argentino")) {
    return "https://www.correoargentino.com.ar/formularios/e-commerce";
  }

  return "https://www.google.com/search?q=" +
    encodeURIComponent(`${carrier ?? "seguimiento"} ${code}`);
}

async function CustomerAccountContent() {
  // Espera la solicitud HTTP entrante antes de invocar Auth.js (compatibilidad Next.js 16 cacheComponents)
  await connection();

  const profile = await getCurrentCustomerProfile();

  if (!profile) {
    redirect("/login");
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
      {/* CABECERA EDITORIAL DE LA CLIENTA */}
      <header className="flex flex-col justify-between gap-6 border-b border-stone-200 pb-10 sm:flex-row sm:items-end">
        <div>
          <p className="font-sans text-xs tracking-[0.16em] text-stone-500 uppercase">
            ESPACIO PERSONAL · OL.
          </p>
          <h1 className="mt-3 font-serif text-3xl tracking-wide text-ink sm:text-4xl">
            Hola, {profile.firstName} {profile.lastName}
          </h1>
          <p className="mt-1.5 font-sans text-sm font-normal text-stone-500">
            {profile.email}
            {profile.documentNumber ? ` · DNI/CUIT ${profile.documentNumber}` : ""}
          </p>
        </div>

        <div className="shrink-0">
          <CustomerLogoutButton />
        </div>
      </header>

      {/* SECCIÓN MIS PEDIDOS */}
      <section className="mt-12">
        <div className="mb-8 flex items-baseline justify-between">
          <h2 className="display text-[36px] text-ink">
            Mis pedidos
          </h2>
          <span className="text-sm text-stone-600">
            {profile.orders.length}{" "}
            {profile.orders.length === 1 ? "orden registrada" : "órdenes registradas"}
          </span>
        </div>

        {profile.orders.length === 0 ? (
          <div className="rounded-2xl border border-stone-200 bg-white px-6 py-16 text-center">
            <p className="font-serif text-2xl text-ink">
              Aún no registrás pedidos en tu cuenta
            </p>
            <p className="mx-auto mt-2 max-w-md font-sans text-xs font-normal leading-relaxed text-stone-500">
              Descubrí las piezas de nuestra colección actual. Todas tus órdenes
              y seguimientos de envío aparecerán en este espacio.
            </p>
            <Link
              href="/productos"
              className="pressable mt-8 inline-flex h-14 items-center justify-center rounded-full bg-ink px-8 text-[15px] font-semibold text-paper hover:bg-espresso"
            >
              Ir a la tienda
            </Link>
          </div>
        ) : (
          <div>
            {profile.orders.map((order) => {
              const statusInfo =
                EDITORIAL_STATUS_CONFIG[order.status] ??
                EDITORIAL_STATUS_CONFIG.PENDING;
              const isBankTransfer =
                order.payment?.provider === "BANK_TRANSFER";
              const isShipped = order.status === "SHIPPED";
              const trackingUrl = resolveCarrierTrackingUrl(
                order.carrier,
                order.trackingCode
              );

              return (
                <article
                  key={order.id}
                  className="mb-6 rounded-2xl border border-stone-200 bg-white p-6"
                >
                  {/* CABECERA DE PEDIDO */}
                  <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-200 pb-5">
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                      <div>
                        <p className="eyebrow text-stone-600">
                          N° DE ORDEN
                        </p>
                        <p className="mt-0.5 font-serif text-xl text-ink">
                          #{order.orderNumber}
                        </p>
                      </div>

                      <div>
                        <p className="eyebrow text-stone-600">
                          Fecha
                        </p>
                        <p className="mt-0.5 font-sans text-xs font-normal text-stone-700">
                          {dateFormatter.format(new Date(order.createdAt))}
                        </p>
                      </div>

                      <div>
                        <p className="eyebrow text-stone-600">
                          Medio de pago
                        </p>
                        <p className="mt-0.5 font-sans text-xs font-normal text-stone-700">
                          {isBankTransfer
                            ? "Transferencia Bancaria"
                            : "Mercado Pago"}
                        </p>
                      </div>

                      <div>
                        <p className="eyebrow text-stone-600">
                          Total
                        </p>
                        <p className="mt-0.5 font-sans text-sm font-medium text-ink">
                          {arsFormatter.format(order.totalAmount)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span
                        className={`inline-flex h-7 items-center rounded-full border px-3 text-xs font-semibold ${statusInfo.className}`}
                      >
                        {statusInfo.label}
                      </span>
                    </div>
                  </div>

                  {/* SEGUIMIENTO LOGÍSTICO (SHIPPED) */}
                  {isShipped && (
                    <div className="mt-5 flex flex-col justify-between gap-4 border border-stone-200 bg-paper p-5 sm:flex-row sm:items-center">
                      <div className="flex items-start gap-3.5">
                        <Truck className="mt-0.5 h-4 w-4 shrink-0 text-stone-800" />
                        <div>
                          <p className="eyebrow text-stone-600">
                            Seguimiento
                          </p>
                          <p className="mt-1 font-sans text-xs font-normal text-stone-800">
                            Transportista:{" "}
                            <span className="font-normal text-ink">
                              {order.carrier || "Correo Logístico"}
                            </span>
                            {" · "}
                            Código:{" "}
                            <span className="font-mono font-medium text-ink">
                              {order.trackingCode || "En asignación"}
                            </span>
                          </p>
                        </div>
                      </div>

                      <a
                        href={trackingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="pressable inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-ink px-5 text-sm font-semibold text-paper hover:bg-espresso"
                      >
                        Seguir envío
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  )}

                  {/* ACCIÓN RÁPIDA PARA TRANSFERENCIA PENDIENTE */}
                  {order.status === "PENDING" && isBankTransfer && (
                    <div className="mt-5 flex flex-col justify-between gap-4 border border-stone-200 bg-paper p-4 sm:flex-row sm:items-center">
                      <p className="font-sans text-xs font-normal text-stone-600">
                        Orden pendiente de transferencia bancaria. Recordá
                        enviar el comprobante para confirmar tu despacho.
                      </p>
                      <Link
                        href={`/checkout/confirmacion/${order.id}`}
                        className="pressable inline-flex h-11 shrink-0 items-center justify-center rounded-full border border-ink bg-white px-5 text-sm font-semibold text-ink hover:bg-ink hover:text-paper"
                      >
                        Ver datos de pago
                      </Link>
                    </div>
                  )}

                  {/* MINIATURAS DE PRENDAS COMPRADAS */}
                  <div className="mt-5">
                    <p className="mb-3 eyebrow text-stone-600">
                      Prendas ({order.items.length})
                    </p>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      {order.items.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center gap-4 border border-stone-100 bg-paper/60 p-3"
                        >
                          {item.imageUrl ? (
                            <span className="relative aspect-[3/4] w-14 shrink-0 overflow-hidden bg-cream">
                              <Image src={item.imageUrl} alt={item.productName} fill sizes="56px" className="object-cover" />
                            </span>
                          ) : (
                            <div className="flex aspect-[3/4] w-14 shrink-0 items-center justify-center border border-stone-200 bg-cream font-serif text-xs text-stone-500">
                              OL.
                            </div>
                          )}

                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-ink">
                              {item.productName}
                            </p>
                            <p className="mt-0.5 font-sans text-xs font-normal text-stone-500">
                              Talle {item.sizeName} · {item.colorName}
                            </p>
                            <div className="mt-1 flex items-center justify-between font-sans text-xs font-normal text-stone-700">
                              <span>Cant. {item.quantity}</span>
                              <span className="font-normal text-ink">
                                {arsFormatter.format(item.subtotal)}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* PIE DE TARJETA: ENLACE AL RECIBO DIGITAL */}
                  <div className="mt-5 flex items-center justify-between border-t border-stone-100 pt-4">
                    <span className="font-sans text-xs font-normal text-stone-500">
                      {order.discountAmount > 0
                        ? `Incluye descuento por transferencia (-${arsFormatter.format(order.discountAmount)})`
                        : "Comprobante digital disponible"}
                    </span>
                    <Link
                      href={`/checkout/confirmacion/${order.id}`}
                      className="inline-flex min-h-11 items-center text-sm font-semibold text-chocolate underline underline-offset-4"
                    >
                      Ver comprobante
                    </Link>
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
    <main className="min-h-[calc(100vh-5rem)] bg-paper">
      <Suspense
        fallback={
          <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
            <div className="h-24 animate-pulse border-b border-stone-200 bg-cream/60" />
            <div className="mt-12 h-72 animate-pulse rounded-2xl border border-stone-200 bg-white" />
          </div>
        }
      >
        <CustomerAccountContent />
      </Suspense>
    </main>
  );
}
