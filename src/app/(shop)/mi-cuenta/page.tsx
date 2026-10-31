import { Suspense } from "react";
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
    label: "PENDIENTE DE PAGO",
    className: "border-amber-300 bg-amber-50/70 text-amber-900",
  },
  PAID: {
    label: "PAGADO · EN PREPARACIÓN",
    className: "border-emerald-300 bg-emerald-50/70 text-emerald-900",
  },
  PROCESSING: {
    label: "EN PREPARACIÓN",
    className: "border-stone-300 bg-stone-100 text-stone-800",
  },
  SHIPPED: {
    label: "DESPACHADO",
    className: "border-stone-900 bg-stone-900 text-white",
  },
  DELIVERED: {
    label: "ENTREGADO",
    className: "border-stone-300 bg-stone-100 text-stone-800",
  },
  CANCELLED: {
    label: "CANCELADO",
    className: "border-red-200 bg-red-50/70 text-red-800",
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
          <p className="font-sans text-[10px] tracking-[0.25em] text-stone-500 uppercase">
            ESPACIO PERSONAL · OL.
          </p>
          <h1 className="mt-3 font-serif text-3xl tracking-wide text-stone-900 sm:text-4xl">
            Hola, {profile.firstName} {profile.lastName}
          </h1>
          <p className="mt-1.5 font-sans text-sm font-light text-stone-500">
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
          <h2 className="font-serif text-2xl tracking-wide text-stone-900 uppercase">
            Mis Pedidos
          </h2>
          <span className="font-sans text-xs font-light tracking-[0.15em] text-stone-500 uppercase">
            {profile.orders.length}{" "}
            {profile.orders.length === 1 ? "orden registrada" : "órdenes registradas"}
          </span>
        </div>

        {profile.orders.length === 0 ? (
          <div className="rounded-none border border-stone-200 bg-white px-6 py-16 text-center">
            <p className="font-serif text-2xl text-stone-900">
              Aún no registrás pedidos en tu cuenta
            </p>
            <p className="mx-auto mt-2 max-w-md font-sans text-xs font-light leading-relaxed text-stone-500">
              Descubrí las piezas de nuestra colección actual. Todas tus órdenes
              y seguimientos de envío aparecerán en este espacio.
            </p>
            <Link
              href="/productos"
              className="mt-8 inline-flex h-12 items-center justify-center rounded-none bg-stone-900 px-8 font-sans text-xs tracking-[0.2em] text-white uppercase transition-colors hover:bg-stone-800"
            >
              EXPLORAR COLECCIÓN
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
                  className="mb-6 rounded-none border border-stone-200 bg-white p-6"
                >
                  {/* CABECERA DE PEDIDO */}
                  <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-200 pb-5">
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                      <div>
                        <p className="font-sans text-[10px] tracking-[0.2em] text-stone-400 uppercase">
                          N° DE ORDEN
                        </p>
                        <p className="mt-0.5 font-serif text-xl text-stone-900">
                          #{order.orderNumber}
                        </p>
                      </div>

                      <div>
                        <p className="font-sans text-[10px] tracking-[0.2em] text-stone-400 uppercase">
                          FECHA DE COMPRA
                        </p>
                        <p className="mt-0.5 font-sans text-xs font-light text-stone-700">
                          {dateFormatter.format(new Date(order.createdAt))}
                        </p>
                      </div>

                      <div>
                        <p className="font-sans text-[10px] tracking-[0.2em] text-stone-400 uppercase">
                          MEDIO DE PAGO
                        </p>
                        <p className="mt-0.5 font-sans text-xs font-light text-stone-700">
                          {isBankTransfer
                            ? "Transferencia Bancaria"
                            : "Mercado Pago"}
                        </p>
                      </div>

                      <div>
                        <p className="font-sans text-[10px] tracking-[0.2em] text-stone-400 uppercase">
                          TOTAL ABONADO
                        </p>
                        <p className="mt-0.5 font-sans text-sm font-medium text-stone-900">
                          {arsFormatter.format(order.totalAmount)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span
                        className={`inline-block rounded-none border px-3 py-1 font-sans text-[10px] tracking-[0.18em] uppercase ${statusInfo.className}`}
                      >
                        {statusInfo.label}
                      </span>
                    </div>
                  </div>

                  {/* SEGUIMIENTO LOGÍSTICO (SHIPPED) */}
                  {isShipped && (
                    <div className="mt-5 flex flex-col justify-between gap-4 rounded-none border border-stone-200 bg-[#FAF9F6] p-5 sm:flex-row sm:items-center">
                      <div className="flex items-start gap-3.5">
                        <Truck className="mt-0.5 h-4 w-4 shrink-0 text-stone-800" />
                        <div>
                          <p className="font-sans text-[10px] tracking-[0.2em] text-stone-500 uppercase">
                            SEGUIMIENTO LOGÍSTICO
                          </p>
                          <p className="mt-1 font-sans text-xs font-light text-stone-800">
                            Transportista:{" "}
                            <span className="font-normal text-stone-900">
                              {order.carrier || "Correo Logístico"}
                            </span>
                            {" · "}
                            Código:{" "}
                            <span className="font-mono font-medium text-stone-900">
                              {order.trackingCode || "En asignación"}
                            </span>
                          </p>
                        </div>
                      </div>

                      <a
                        href={trackingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-none bg-stone-900 px-5 font-sans text-[10px] tracking-[0.2em] text-white uppercase transition-colors hover:bg-stone-800"
                      >
                        RASTREAR PAQUETE
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  )}

                  {/* ACCIÓN RÁPIDA PARA TRANSFERENCIA PENDIENTE */}
                  {order.status === "PENDING" && isBankTransfer && (
                    <div className="mt-5 flex flex-col justify-between gap-4 rounded-none border border-stone-200 bg-[#FAF9F6] p-4 sm:flex-row sm:items-center">
                      <p className="font-sans text-xs font-light text-stone-600">
                        Orden pendiente de transferencia bancaria. Recordá
                        enviar el comprobante para confirmar tu despacho.
                      </p>
                      <Link
                        href={`/checkout/confirmacion/${order.id}`}
                        className="inline-flex h-9 shrink-0 items-center justify-center rounded-none border border-stone-900 bg-white px-4 font-sans text-[10px] tracking-[0.18em] text-stone-900 uppercase transition-colors hover:bg-stone-900 hover:text-white"
                      >
                        VER DATOS BANCARIOS
                      </Link>
                    </div>
                  )}

                  {/* MINIATURAS DE PRENDAS COMPRADAS */}
                  <div className="mt-5">
                    <p className="mb-3 font-sans text-[10px] tracking-[0.2em] text-stone-400 uppercase">
                      PRENDAS DEL PEDIDO ({order.items.length})
                    </p>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      {order.items.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center gap-4 rounded-none border border-stone-100 bg-[#FAF9F6]/60 p-3"
                        >
                          {item.imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={item.imageUrl}
                              alt={item.productName}
                              className="aspect-[3/4] w-14 shrink-0 rounded-none object-cover bg-stone-100"
                            />
                          ) : (
                            <div className="flex aspect-[3/4] w-14 shrink-0 items-center justify-center rounded-none border border-stone-200 bg-stone-100 font-serif text-[10px] text-stone-400">
                              OL.
                            </div>
                          )}

                          <div className="min-w-0 flex-1">
                            <p className="truncate font-serif text-base text-stone-900">
                              {item.productName}
                            </p>
                            <p className="mt-0.5 font-sans text-[11px] font-light text-stone-500">
                              Talle {item.sizeName} · {item.colorName}
                            </p>
                            <div className="mt-1 flex items-center justify-between font-sans text-xs font-light text-stone-700">
                              <span>Cant. {item.quantity}</span>
                              <span className="font-normal text-stone-900">
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
                    <span className="font-sans text-[11px] font-light text-stone-400">
                      {order.discountAmount > 0
                        ? `Incluye descuento por transferencia (-${arsFormatter.format(order.discountAmount)})`
                        : "Comprobante digital disponible"}
                    </span>
                    <Link
                      href={`/checkout/confirmacion/${order.id}`}
                      className="border-b border-stone-300 pb-0.5 font-sans text-[10px] tracking-[0.18em] text-stone-600 uppercase transition-colors hover:border-stone-900 hover:text-stone-900"
                    >
                      VER RECIBO DIGITAL
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
    <main className="min-h-[calc(100vh-5rem)] bg-[#FAF9F6]">
      <Suspense
        fallback={
          <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
            <div className="h-24 animate-pulse rounded-none border-b border-stone-200 bg-stone-100/60" />
            <div className="mt-12 h-72 animate-pulse rounded-none border border-stone-200 bg-white" />
          </div>
        }
      >
        <CustomerAccountContent />
      </Suspense>
    </main>
  );
}
