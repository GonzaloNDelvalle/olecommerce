"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Lock,
  AlertCircle,
  Loader2,
  ArrowLeft,
  ShoppingBag,
  CreditCard,
  Landmark,
  CheckCircle2,
} from "lucide-react";
import { useCartStore } from "@/store/cart.store";
import {
  ARGENTINA_PROVINCES,
  BANK_TRANSFER_DISCOUNT_PERCENTAGE,
  checkoutFormSchema,
  type CheckoutFormValues,
} from "@/modules/orders/schemas/checkout.schema";
import { processCheckoutOrder } from "@/modules/orders/checkout.actions";

const arsFormatter = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

export default function CheckoutPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);

  const items = useCartStore((state) => state.items);
  const getSubtotal = useCartStore((state) => state.getSubtotal);
  const clearCart = useCartStore((state) => state.clearCart);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutFormSchema),
    defaultValues: {
      email: "",
      firstName: "",
      lastName: "",
      documentNumber: "",
      phone: "",
      street: "",
      number: "",
      apartment: "",
      postalCode: "",
      city: "",
      state: "Ciudad Autónoma de Buenos Aires",
      notes: "",
      paymentMethod: "MERCADOPAGO",
    },
  });

  const selectedPaymentMethod = watch("paymentMethod");

  useEffect(() => {
    setMounted(true);
  }, []);

  async function onSubmit(values: CheckoutFormValues) {
    setServerError(null);

    if (items.length === 0) {
      setServerError("Tu carrito está vacío.");
      return;
    }

    const response = await processCheckoutOrder({
      customer: values,
      items: items.map((item) => ({
        variantId: item.variantId,
        quantity: item.quantity,
      })),
    });

    if (!response.success) {
      setServerError(response.error);
      return;
    }

    setIsRedirecting(true);
    clearCart();

    if (response.paymentMethod === "BANK_TRANSFER") {
      router.push(response.redirectUrl);
      return;
    }

    // Redirección externa hacia Checkout Pro de Mercado Pago
    window.location.href = response.redirectUrl;
  }

  if (!mounted) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="h-96 animate-pulse rounded-xl bg-stone-100" />
      </main>
    );
  }

  if (items.length === 0 && !isRedirecting) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6 lg:px-8">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-stone-100">
          <ShoppingBag className="h-7 w-7 text-stone-400" />
        </div>
        <h1 className="mt-4 text-2xl font-semibold text-stone-900">
          Tu carrito está vacío
        </h1>
        <p className="mt-2 text-sm text-stone-500">
          Agregá prendas del catálogo antes de iniciar el proceso de compra.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-stone-900 px-6 py-3.5 text-xs font-semibold tracking-wider text-white uppercase hover:bg-stone-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Ir al Catálogo
        </Link>
      </main>
    );
  }

  const subtotal = getSubtotal();
  const isBankTransfer = selectedPaymentMethod === "BANK_TRANSFER";
  const transferDiscountAmount = isBankTransfer
    ? Math.round(subtotal * (BANK_TRANSFER_DISCOUNT_PERCENTAGE / 100))
    : 0;
  const finalTotal = Math.max(0, subtotal - transferDiscountAmount);

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-stone-500 transition-colors hover:text-stone-900"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Seguir comprando
        </Link>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-stone-900 sm:text-3xl">
          Finalizar Compra
        </h1>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="grid grid-cols-1 gap-10 lg:grid-cols-12"
      >
        {/* COLUMNA IZQUIERDA: Datos de Envío y Selector de Medio de Pago (7 columnas) */}
        <div className="space-y-8 lg:col-span-7">
          {serverError && (
            <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
              <p>{serverError}</p>
            </div>
          )}

          {/* SECCIÓN 1: Datos de Contacto y Facturación */}
          <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-2xs">
            <h2 className="text-sm font-semibold tracking-wider text-stone-900 uppercase">
              1. Contacto y Facturación (ARCA / AFIP)
            </h2>

            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label
                  htmlFor="email"
                  className="block text-xs font-medium text-stone-700"
                >
                  Correo Electrónico *
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="ejemplo@correo.com"
                  {...register("email")}
                  className="mt-1.5 w-full rounded-lg border border-stone-300 px-3.5 py-2.5 text-sm text-stone-900 focus:border-stone-900 focus:outline-none"
                />
                {errors.email && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="firstName"
                  className="block text-xs font-medium text-stone-700"
                >
                  Nombre *
                </label>
                <input
                  id="firstName"
                  type="text"
                  {...register("firstName")}
                  className="mt-1.5 w-full rounded-lg border border-stone-300 px-3.5 py-2.5 text-sm text-stone-900 focus:border-stone-900 focus:outline-none"
                />
                {errors.firstName && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.firstName.message}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="lastName"
                  className="block text-xs font-medium text-stone-700"
                >
                  Apellido *
                </label>
                <input
                  id="lastName"
                  type="text"
                  {...register("lastName")}
                  className="mt-1.5 w-full rounded-lg border border-stone-300 px-3.5 py-2.5 text-sm text-stone-900 focus:border-stone-900 focus:outline-none"
                />
                {errors.lastName && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.lastName.message}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="documentNumber"
                  className="block text-xs font-medium text-stone-700"
                >
                  DNI o CUIL/CUIT (sin puntos) *
                </label>
                <input
                  id="documentNumber"
                  type="text"
                  inputMode="numeric"
                  placeholder="Ej: 38123456"
                  {...register("documentNumber")}
                  className="mt-1.5 w-full rounded-lg border border-stone-300 px-3.5 py-2.5 text-sm text-stone-900 focus:border-stone-900 focus:outline-none"
                />
                {errors.documentNumber && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.documentNumber.message}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="phone"
                  className="block text-xs font-medium text-stone-700"
                >
                  Teléfono / WhatsApp *
                </label>
                <input
                  id="phone"
                  type="tel"
                  placeholder="Ej: 11 2345 6789"
                  {...register("phone")}
                  className="mt-1.5 w-full rounded-lg border border-stone-300 px-3.5 py-2.5 text-sm text-stone-900 focus:border-stone-900 focus:outline-none"
                />
                {errors.phone && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.phone.message}
                  </p>
                )}
              </div>
            </div>
          </section>

          {/* SECCIÓN 2: Dirección de Envío */}
          <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-2xs">
            <h2 className="text-sm font-semibold tracking-wider text-stone-900 uppercase">
              2. Domicilio de Entrega
            </h2>

            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-6">
              <div className="sm:col-span-4">
                <label
                  htmlFor="street"
                  className="block text-xs font-medium text-stone-700"
                >
                  Calle *
                </label>
                <input
                  id="street"
                  type="text"
                  placeholder="Ej: Av. Santa Fe"
                  {...register("street")}
                  className="mt-1.5 w-full rounded-lg border border-stone-300 px-3.5 py-2.5 text-sm text-stone-900 focus:border-stone-900 focus:outline-none"
                />
                {errors.street && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.street.message}
                  </p>
                )}
              </div>

              <div className="sm:col-span-1">
                <label
                  htmlFor="number"
                  className="block text-xs font-medium text-stone-700"
                >
                  Altura *
                </label>
                <input
                  id="number"
                  type="text"
                  placeholder="3200"
                  {...register("number")}
                  className="mt-1.5 w-full rounded-lg border border-stone-300 px-3.5 py-2.5 text-sm text-stone-900 focus:border-stone-900 focus:outline-none"
                />
                {errors.number && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.number.message}
                  </p>
                )}
              </div>

              <div className="sm:col-span-1">
                <label
                  htmlFor="apartment"
                  className="block text-xs font-medium text-stone-700"
                >
                  Piso / Depto
                </label>
                <input
                  id="apartment"
                  type="text"
                  placeholder="4 B"
                  {...register("apartment")}
                  className="mt-1.5 w-full rounded-lg border border-stone-300 px-3.5 py-2.5 text-sm text-stone-900 focus:border-stone-900 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label
                  htmlFor="postalCode"
                  className="block text-xs font-medium text-stone-700"
                >
                  Código Postal *
                </label>
                <input
                  id="postalCode"
                  type="text"
                  placeholder="Ej: 1425"
                  {...register("postalCode")}
                  className="mt-1.5 w-full rounded-lg border border-stone-300 px-3.5 py-2.5 text-sm text-stone-900 focus:border-stone-900 focus:outline-none"
                />
                {errors.postalCode && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.postalCode.message}
                  </p>
                )}
              </div>

              <div className="sm:col-span-2">
                <label
                  htmlFor="city"
                  className="block text-xs font-medium text-stone-700"
                >
                  Localidad / Ciudad *
                </label>
                <input
                  id="city"
                  type="text"
                  placeholder="Palermo"
                  {...register("city")}
                  className="mt-1.5 w-full rounded-lg border border-stone-300 px-3.5 py-2.5 text-sm text-stone-900 focus:border-stone-900 focus:outline-none"
                />
                {errors.city && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.city.message}
                  </p>
                )}
              </div>

              <div className="sm:col-span-2">
                <label
                  htmlFor="state"
                  className="block text-xs font-medium text-stone-700"
                >
                  Provincia *
                </label>
                <select
                  id="state"
                  {...register("state")}
                  className="mt-1.5 w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-sm text-stone-900 focus:border-stone-900 focus:outline-none"
                >
                  {ARGENTINA_PROVINCES.map((province) => (
                    <option key={province} value={province}>
                      {province}
                    </option>
                  ))}
                </select>
                {errors.state && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.state.message}
                  </p>
                )}
              </div>

              <div className="sm:col-span-6">
                <label
                  htmlFor="notes"
                  className="block text-xs font-medium text-stone-700"
                >
                  Observaciones para el envío (opcional)
                </label>
                <textarea
                  id="notes"
                  rows={2}
                  placeholder="Entre calles, horarios de recepción o indicaciones para portería..."
                  {...register("notes")}
                  className="mt-1.5 w-full rounded-lg border border-stone-300 px-3.5 py-2 text-sm text-stone-900 focus:border-stone-900 focus:outline-none"
                />
              </div>
            </div>
          </section>

          {/* SECCIÓN 3: Selector de Medio de Pago (Mercado Pago vs Transferencia Bancaria) */}
          <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-2xs">
            <h2 className="text-sm font-semibold tracking-wider text-stone-900 uppercase">
              3. Medio de Pago
            </h2>
            <p className="mt-1 text-xs text-stone-500">
              Seleccioná cómo preferís abonar tu pedido.
            </p>

            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Opción 1: Mercado Pago */}
              <button
                type="button"
                onClick={() =>
                  setValue("paymentMethod", "MERCADOPAGO", {
                    shouldValidate: true,
                  })
                }
                className={`flex flex-col items-start justify-between rounded-xl border-2 p-4 text-left transition-all ${
                  selectedPaymentMethod === "MERCADOPAGO"
                    ? "border-stone-900 bg-stone-50 ring-1 ring-stone-900"
                    : "border-stone-200 bg-white hover:border-stone-400"
                }`}
              >
                <div className="flex w-full items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#009EE3]/10 text-[#009EE3]">
                      <CreditCard className="h-5 w-5" />
                    </div>
                    <span className="text-sm font-semibold text-stone-900">
                      Mercado Pago
                    </span>
                  </div>
                  {selectedPaymentMethod === "MERCADOPAGO" && (
                    <CheckCircle2 className="h-5 w-5 text-stone-900" />
                  )}
                </div>

                <p className="mt-3 text-xs leading-relaxed text-stone-500">
                  Tarjetas de crédito (3 y 6 cuotas), débito o dinero en cuenta
                  con acreditación automática.
                </p>
              </button>

              {/* Opción 2: Transferencia Bancaria */}
              <button
                type="button"
                onClick={() =>
                  setValue("paymentMethod", "BANK_TRANSFER", {
                    shouldValidate: true,
                  })
                }
                className={`flex flex-col items-start justify-between rounded-xl border-2 p-4 text-left transition-all ${
                  selectedPaymentMethod === "BANK_TRANSFER"
                    ? "border-stone-900 bg-stone-50 ring-1 ring-stone-900"
                    : "border-stone-200 bg-white hover:border-stone-400"
                }`}
              >
                <div className="flex w-full items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                      <Landmark className="h-5 w-5" />
                    </div>
                    <div>
                      <span className="block text-sm font-semibold text-stone-900">
                        Transferencia Bancaria
                      </span>
                      <span className="inline-block rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800 uppercase">
                        {BANK_TRANSFER_DISCOUNT_PERCENTAGE}% OFF Adicional
                      </span>
                    </div>
                  </div>
                  {selectedPaymentMethod === "BANK_TRANSFER" && (
                    <CheckCircle2 className="h-5 w-5 text-stone-900" />
                  )}
                </div>

                <p className="mt-3 text-xs leading-relaxed text-stone-500">
                  Transferí desde cualquier banco o billetera virtual a nuestro
                  CBU / Alias con descuento directo.
                </p>
              </button>
            </div>
          </section>
        </div>

        {/* COLUMNA DERECHA: Resumen del Pedido y Confirmación (5 columnas) */}
        <div className="lg:col-span-5">
          <div className="sticky top-24 rounded-xl border border-stone-200 bg-stone-50 p-6 shadow-2xs">
            <h2 className="text-sm font-semibold tracking-wider text-stone-900 uppercase">
              Resumen del Pedido
            </h2>

            <ul className="mt-5 divide-y divide-stone-200">
              {items.map((item) => (
                <li key={item.variantId} className="flex gap-3.5 py-3.5">
                  <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-md bg-stone-200">
                    {item.imageUrl && (
                      <Image
                        src={item.imageUrl}
                        alt={item.productName}
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    )}
                  </div>

                  <div className="flex flex-1 flex-col justify-between text-xs">
                    <div>
                      <p className="font-medium text-stone-900">
                        {item.productName}
                      </p>
                      <p className="mt-0.5 text-stone-500">
                        {item.colorName} • Talle {item.sizeName}
                      </p>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-stone-500">
                        Cant: {item.quantity}
                      </span>
                      <span className="font-semibold text-stone-900">
                        {arsFormatter.format(item.unitPrice * item.quantity)}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <div className="mt-4 space-y-2 border-t border-stone-200 pt-4 text-sm">
              <div className="flex justify-between text-stone-600">
                <span>Subtotal prendas</span>
                <span>{arsFormatter.format(subtotal)}</span>
              </div>

              {isBankTransfer && transferDiscountAmount > 0 && (
                <div className="flex justify-between font-medium text-emerald-700">
                  <span>
                    Descuento Transferencia ({BANK_TRANSFER_DISCOUNT_PERCENTAGE}
                    % OFF)
                  </span>
                  <span>-{arsFormatter.format(transferDiscountAmount)}</span>
                </div>
              )}

              <div className="flex justify-between text-stone-600">
                <span>Envío</span>
                <span className="text-xs font-medium text-emerald-700 uppercase">
                  Bonificado
                </span>
              </div>

              <div className="flex justify-between border-t border-stone-200 pt-3 text-base font-bold text-stone-900">
                <span>Total a Pagar</span>
                <span>{arsFormatter.format(finalTotal)}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || isRedirecting}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-stone-900 px-6 py-4 text-sm font-semibold tracking-wider text-white uppercase transition-colors hover:bg-stone-800 disabled:cursor-not-allowed disabled:bg-stone-400"
            >
              {isSubmitting || isRedirecting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {selectedPaymentMethod === "MERCADOPAGO"
                    ? "Conectando con Mercado Pago..."
                    : "Generando Orden por Transferencia..."}
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4" />
                  {selectedPaymentMethod === "MERCADOPAGO"
                    ? "Pagar con Mercado Pago"
                    : "Confirmar Pedido por Transferencia"}
                </>
              )}
            </button>

            <p className="mt-3 text-center text-[11px] text-stone-500">
              Al confirmar, reservaremos tu stock en tiempo real y generaremos
              tu orden #{selectedPaymentMethod === "MERCADOPAGO" ? "Checkout Pro" : "Transferencia"}.
            </p>
          </div>
        </div>
      </form>
    </main>
  );
}
