"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertCircle,
  Loader2,
  ArrowLeft,
  ShoppingBag,
  Check,
} from "lucide-react";
import { useCartStore } from "@/store/cart.store";
import {
  ARGENTINA_PROVINCES,
  BANK_TRANSFER_DISCOUNT_PERCENTAGE,
  checkoutFormSchema,
  type CheckoutFormValues,
} from "@/modules/orders/schemas/checkout.schema";
import { processCheckoutOrder } from "@/modules/orders/checkout.actions";

const FREE_SHIPPING_THRESHOLD_ARS = 180_000;

type DeliveryMethodOption = "HOME_DELIVERY" | "SHOWROOM_PICKUP";

const arsFormatter = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

const inputMinimalClass =
  "w-full rounded-none border-0 border-b border-stone-300 bg-transparent px-0 py-3 font-sans text-sm font-light text-stone-900 placeholder:text-stone-400 transition-colors focus:border-stone-900 focus:outline-none";

const labelMinimalClass =
  "block text-[10px] font-normal tracking-[0.2em] text-stone-500 uppercase";

export default function CheckoutPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [deliveryMethod, setDeliveryMethod] =
    useState<DeliveryMethodOption>("HOME_DELIVERY");

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

    const deliveryPrefix =
      deliveryMethod === "SHOWROOM_PICKUP"
        ? "[Retiro en Showroom Palermo] "
        : "[Envío a Domicilio] ";

    const combinedNotes = `${deliveryPrefix}${values.notes?.trim() ?? ""}`.trim();

    const response = await processCheckoutOrder({
      customer: {
        ...values,
        notes: combinedNotes,
      },
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
      <main className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
          <div className="h-96 animate-pulse rounded-none bg-stone-100 lg:col-span-7" />
          <div className="h-80 animate-pulse rounded-none bg-stone-100 lg:col-span-5" />
        </div>
      </main>
    );
  }

  if (items.length === 0 && !isRedirecting) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-24 text-center sm:px-6 lg:px-8">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-none border border-stone-200 bg-stone-50">
          <ShoppingBag className="h-6 w-6 text-stone-400" strokeWidth={1.3} />
        </div>
        <h1 className="mt-6 font-serif text-3xl font-normal tracking-[0.08em] text-stone-900 uppercase">
          Tu carrito está vacío
        </h1>
        <p className="mt-2 font-sans text-xs font-light text-stone-500">
          Seleccioná tus prendas en el catálogo antes de iniciar el proceso de
          compra.
        </p>
        <Link
          href="/productos"
          className="mt-8 inline-flex h-12 items-center gap-2 rounded-none bg-stone-900 px-8 text-xs font-medium tracking-[0.2em] text-white uppercase transition-colors hover:bg-stone-800"
        >
          <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.5} />
          Explorar Catálogo
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
  const qualifiesFreeShipping =
    subtotal >= FREE_SHIPPING_THRESHOLD_ARS ||
    deliveryMethod === "SHOWROOM_PICKUP";

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
      {/* Encabezado Editorial del Checkout */}
      <div className="mb-12 border-b border-stone-200 pb-8">
        <Link
          href="/productos"
          className="inline-flex items-center gap-2 text-[11px] font-light tracking-[0.2em] text-stone-500 uppercase transition-colors hover:text-stone-900"
        >
          <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.4} />
          Volver al Catálogo
        </Link>
        <h1 className="mt-4 font-serif text-3xl font-normal tracking-[0.08em] text-stone-900 uppercase sm:text-5xl">
          Finalizar Compra
        </h1>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:items-start"
      >
        {/* COLUMNA IZQUIERDA: Flujo de Datos del Comprador (7 columnas) */}
        <div className="space-y-14 lg:col-span-7">
          {serverError && (
            <div className="flex items-start gap-3 rounded-none border border-red-300 bg-red-50/60 p-4 text-xs font-light text-red-800">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-700" />
              <p>{serverError}</p>
            </div>
          )}

          {/* PASO 01 / CONTACTO Y ENVÍO */}
          <section>
            <div className="border-b border-stone-200 pb-3">
              <h2 className="font-serif text-lg font-normal tracking-wider text-stone-900 uppercase sm:text-xl">
                01 / CONTACTO Y ENVÍO
              </h2>
            </div>

            <div className="mt-7 grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-6">
              <div className="sm:col-span-6">
                <label htmlFor="email" className={labelMinimalClass}>
                  Correo Electrónico *
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="tu@correo.com"
                  {...register("email")}
                  className={inputMinimalClass}
                />
                {errors.email && (
                  <p className="mt-1.5 text-[11px] font-light text-red-600">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="firstName" className={labelMinimalClass}>
                  Nombre *
                </label>
                <input
                  id="firstName"
                  type="text"
                  placeholder="Nombre"
                  {...register("firstName")}
                  className={inputMinimalClass}
                />
                {errors.firstName && (
                  <p className="mt-1.5 text-[11px] font-light text-red-600">
                    {errors.firstName.message}
                  </p>
                )}
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="lastName" className={labelMinimalClass}>
                  Apellido *
                </label>
                <input
                  id="lastName"
                  type="text"
                  placeholder="Apellido"
                  {...register("lastName")}
                  className={inputMinimalClass}
                />
                {errors.lastName && (
                  <p className="mt-1.5 text-[11px] font-light text-red-600">
                    {errors.lastName.message}
                  </p>
                )}
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="documentNumber" className={labelMinimalClass}>
                  DNI o CUIL/CUIT (Facturación ARCA) *
                </label>
                <input
                  id="documentNumber"
                  type="text"
                  inputMode="numeric"
                  placeholder="Sin puntos ni guiones"
                  {...register("documentNumber")}
                  className={inputMinimalClass}
                />
                {errors.documentNumber && (
                  <p className="mt-1.5 text-[11px] font-light text-red-600">
                    {errors.documentNumber.message}
                  </p>
                )}
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="phone" className={labelMinimalClass}>
                  Teléfono / WhatsApp *
                </label>
                <input
                  id="phone"
                  type="tel"
                  placeholder="11 2345 6789"
                  {...register("phone")}
                  className={inputMinimalClass}
                />
                {errors.phone && (
                  <p className="mt-1.5 text-[11px] font-light text-red-600">
                    {errors.phone.message}
                  </p>
                )}
              </div>

              <div className="sm:col-span-4">
                <label htmlFor="street" className={labelMinimalClass}>
                  Calle *
                </label>
                <input
                  id="street"
                  type="text"
                  placeholder="Ej. Av. Alvear"
                  {...register("street")}
                  className={inputMinimalClass}
                />
                {errors.street && (
                  <p className="mt-1.5 text-[11px] font-light text-red-600">
                    {errors.street.message}
                  </p>
                )}
              </div>

              <div className="sm:col-span-1">
                <label htmlFor="number" className={labelMinimalClass}>
                  Altura *
                </label>
                <input
                  id="number"
                  type="text"
                  placeholder="1850"
                  {...register("number")}
                  className={inputMinimalClass}
                />
                {errors.number && (
                  <p className="mt-1.5 text-[11px] font-light text-red-600">
                    {errors.number.message}
                  </p>
                )}
              </div>

              <div className="sm:col-span-1">
                <label htmlFor="apartment" className={labelMinimalClass}>
                  Piso / Depto
                </label>
                <input
                  id="apartment"
                  type="text"
                  placeholder="3 A"
                  {...register("apartment")}
                  className={inputMinimalClass}
                />
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="postalCode" className={labelMinimalClass}>
                  Código Postal *
                </label>
                <input
                  id="postalCode"
                  type="text"
                  placeholder="1425"
                  {...register("postalCode")}
                  className={inputMinimalClass}
                />
                {errors.postalCode && (
                  <p className="mt-1.5 text-[11px] font-light text-red-600">
                    {errors.postalCode.message}
                  </p>
                )}
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="city" className={labelMinimalClass}>
                  Localidad / Ciudad *
                </label>
                <input
                  id="city"
                  type="text"
                  placeholder="Palermo"
                  {...register("city")}
                  className={inputMinimalClass}
                />
                {errors.city && (
                  <p className="mt-1.5 text-[11px] font-light text-red-600">
                    {errors.city.message}
                  </p>
                )}
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="state" className={labelMinimalClass}>
                  Provincia *
                </label>
                <select
                  id="state"
                  {...register("state")}
                  className={inputMinimalClass}
                >
                  {ARGENTINA_PROVINCES.map((province) => (
                    <option key={province} value={province}>
                      {province}
                    </option>
                  ))}
                </select>
                {errors.state && (
                  <p className="mt-1.5 text-[11px] font-light text-red-600">
                    {errors.state.message}
                  </p>
                )}
              </div>

              <div className="sm:col-span-6">
                <label htmlFor="notes" className={labelMinimalClass}>
                  Notas de entrega (Opcional)
                </label>
                <input
                  id="notes"
                  type="text"
                  placeholder="Indicaciones para recepción, portería o franja horaria..."
                  {...register("notes")}
                  className={inputMinimalClass}
                />
              </div>
            </div>
          </section>

          {/* PASO 02 / MÉTODO DE ENTREGA */}
          <section>
            <div className="border-b border-stone-200 pb-3">
              <h2 className="font-serif text-lg font-normal tracking-wider text-stone-900 uppercase sm:text-xl">
                02 / MÉTODO DE ENTREGA
              </h2>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setDeliveryMethod("HOME_DELIVERY")}
                className={`flex cursor-pointer flex-col justify-between rounded-none border p-4 text-left transition-colors ${
                  deliveryMethod === "HOME_DELIVERY"
                    ? "border-stone-900 bg-stone-50/70"
                    : "border-stone-200 bg-white hover:border-stone-400"
                }`}
              >
                <div className="flex w-full items-start justify-between gap-2">
                  <div>
                    <span className="block text-xs font-medium tracking-[0.16em] text-stone-900 uppercase">
                      Envío a Domicilio
                    </span>
                    <span className="mt-1 block text-[11px] font-light text-stone-500">
                      Andreani / Correo Argentino (24–72 hs hábiles)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-medium tracking-[0.18em] text-[#5C4033] uppercase">
                      Bonificado
                    </span>
                    {deliveryMethod === "HOME_DELIVERY" && (
                      <Check className="h-4 w-4 text-stone-900" strokeWidth={1.6} />
                    )}
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setDeliveryMethod("SHOWROOM_PICKUP")}
                className={`flex cursor-pointer flex-col justify-between rounded-none border p-4 text-left transition-colors ${
                  deliveryMethod === "SHOWROOM_PICKUP"
                    ? "border-stone-900 bg-stone-50/70"
                    : "border-stone-200 bg-white hover:border-stone-400"
                }`}
              >
                <div className="flex w-full items-start justify-between gap-2">
                  <div>
                    <span className="block text-xs font-medium tracking-[0.16em] text-stone-900 uppercase">
                      Retiro en Showroom OL.
                    </span>
                    <span className="mt-1 block text-[11px] font-light text-stone-500">
                      Palermo, Buenos Aires (Disponible en 24 hs)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-medium tracking-[0.18em] text-stone-900 uppercase">
                      Sin Cargo
                    </span>
                    {deliveryMethod === "SHOWROOM_PICKUP" && (
                      <Check className="h-4 w-4 text-stone-900" strokeWidth={1.6} />
                    )}
                  </div>
                </div>
              </button>
            </div>
          </section>

          {/* PASO 03 / FORMA DE PAGO */}
          <section>
            <div className="border-b border-stone-200 pb-3">
              <h2 className="font-serif text-lg font-normal tracking-wider text-stone-900 uppercase sm:text-xl">
                03 / FORMA DE PAGO
              </h2>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Opción 1: Transferencia Bancaria (-15% OFF) */}
              <button
                type="button"
                onClick={() =>
                  setValue("paymentMethod", "BANK_TRANSFER", {
                    shouldValidate: true,
                  })
                }
                className={`flex cursor-pointer flex-col justify-between rounded-none border p-4 text-left transition-colors ${
                  selectedPaymentMethod === "BANK_TRANSFER"
                    ? "border-stone-900 bg-stone-50/70"
                    : "border-stone-200 bg-white hover:border-stone-400"
                }`}
              >
                <div className="flex w-full items-start justify-between gap-2">
                  <div>
                    <span className="block text-xs font-medium tracking-[0.16em] text-stone-900 uppercase">
                      Transferencia Bancaria
                    </span>
                    <span className="mt-1.5 inline-block border border-[#5C4033]/40 bg-[#5C4033]/10 px-2 py-0.5 text-[10px] font-medium tracking-[0.18em] text-[#5C4033] uppercase">
                      {BANK_TRANSFER_DISCOUNT_PERCENTAGE}% OFF Adicional
                    </span>
                  </div>
                  {selectedPaymentMethod === "BANK_TRANSFER" && (
                    <Check className="h-4 w-4 shrink-0 text-stone-900" strokeWidth={1.6} />
                  )}
                </div>

                <p className="mt-4 font-sans text-xs font-light leading-relaxed text-stone-500">
                  Transferí desde cualquier banco o billetera virtual a nuestro
                  CBU / Alias con descuento directo sobre el total.
                </p>
              </button>

              {/* Opción 2: Mercado Pago */}
              <button
                type="button"
                onClick={() =>
                  setValue("paymentMethod", "MERCADOPAGO", {
                    shouldValidate: true,
                  })
                }
                className={`flex cursor-pointer flex-col justify-between rounded-none border p-4 text-left transition-colors ${
                  selectedPaymentMethod === "MERCADOPAGO"
                    ? "border-stone-900 bg-stone-50/70"
                    : "border-stone-200 bg-white hover:border-stone-400"
                }`}
              >
                <div className="flex w-full items-start justify-between gap-2">
                  <div>
                    <span className="block text-xs font-medium tracking-[0.16em] text-stone-900 uppercase">
                      Mercado Pago
                    </span>
                    <span className="mt-1.5 inline-block border border-stone-200 bg-stone-100 px-2 py-0.5 text-[10px] font-light tracking-[0.16em] text-stone-600 uppercase">
                      Tarjetas &amp; Dinero en Cuenta
                    </span>
                  </div>
                  {selectedPaymentMethod === "MERCADOPAGO" && (
                    <Check className="h-4 w-4 shrink-0 text-stone-900" strokeWidth={1.6} />
                  )}
                </div>

                <p className="mt-4 font-sans text-xs font-light leading-relaxed text-stone-500">
                  Aboná con tarjetas de crédito en cuotas, débito o saldo de
                  Mercado Pago con acreditación instantánea.
                </p>
              </button>
            </div>
          </section>
        </div>

        {/* COLUMNA DERECHA: Resumen del Pedido (5 columnas, sticky top-28) */}
        <div className="h-fit lg:sticky lg:top-28 lg:col-span-5">
          <div className="rounded-none border border-stone-200 bg-[#FAF9F6] p-6 sm:p-8">
            <h2 className="border-b border-stone-200 pb-4 font-serif text-xl font-normal tracking-[0.12em] text-stone-900 uppercase">
              Resumen de Orden
            </h2>

            {/* Lista de prendas compradas */}
            <ul className="divide-y divide-stone-200/80">
              {items.map((item) => (
                <li key={item.variantId} className="flex gap-4 py-4">
                  <div className="relative aspect-[3/4] w-16 shrink-0 overflow-hidden rounded-none bg-stone-200">
                    {item.imageUrl && (
                      <Image
                        src={item.imageUrl}
                        alt={item.productName}
                        fill
                        sizes="64px"
                        className="h-full w-full rounded-none object-cover"
                      />
                    )}
                  </div>

                  <div className="flex flex-1 flex-col justify-between">
                    <div>
                      <p className="text-xs font-normal tracking-[0.12em] text-stone-900 uppercase">
                        {item.productName}
                      </p>
                      <p className="mt-1 font-sans text-[11px] font-light text-stone-500">
                        {item.colorName} / Talle {item.sizeName}
                      </p>
                    </div>
                    <div className="mt-2 flex items-center justify-between font-sans text-xs font-light">
                      <span className="text-stone-500">
                        Cant. {item.quantity}
                      </span>
                      <span className="text-stone-900">
                        {arsFormatter.format(item.unitPrice * item.quantity)}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            {/* Desglose tipográfico fino */}
            <div className="mt-4 space-y-3 border-t border-stone-200 pt-5 font-sans text-xs font-light">
              <div className="flex justify-between text-stone-600">
                <span className="tracking-[0.14em] uppercase">Subtotal</span>
                <span className="text-sm text-stone-900">
                  {arsFormatter.format(subtotal)}
                </span>
              </div>

              {isBankTransfer && transferDiscountAmount > 0 && (
                <div className="flex justify-between text-[#5C4033]">
                  <span className="tracking-[0.14em] uppercase">
                    Ahorro Transferencia ({BANK_TRANSFER_DISCOUNT_PERCENTAGE}%
                    OFF)
                  </span>
                  <span className="text-sm font-normal">
                    -{arsFormatter.format(transferDiscountAmount)}
                  </span>
                </div>
              )}

              <div className="flex justify-between text-stone-600">
                <span className="tracking-[0.14em] uppercase">Envío</span>
                <span className="text-[11px] font-normal tracking-[0.18em] text-stone-900 uppercase">
                  {qualifiesFreeShipping ? "Bonificado" : "Bonificado"}
                </span>
              </div>

              <div className="flex items-baseline justify-between border-t border-stone-200 pt-4">
                <span className="text-xs font-normal tracking-[0.2em] text-stone-900 uppercase">
                  Total
                </span>
                <span className="font-sans text-2xl font-light tracking-wide text-stone-900">
                  {arsFormatter.format(finalTotal)}
                </span>
              </div>
            </div>

            {/* Botón final de confirmación en negro profundo */}
            <button
              type="submit"
              disabled={isSubmitting || isRedirecting}
              className="mt-7 flex h-12 w-full items-center justify-center gap-2 rounded-none bg-stone-900 px-6 text-xs font-medium tracking-[0.2em] text-white uppercase transition-colors hover:bg-stone-800 disabled:cursor-not-allowed disabled:bg-stone-300"
            >
              {isSubmitting || isRedirecting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>
                    {selectedPaymentMethod === "MERCADOPAGO"
                      ? "Conectando con Mercado Pago..."
                      : "Confirmando Orden..."}
                  </span>
                </>
              ) : selectedPaymentMethod === "MERCADOPAGO" ? (
                "Pagar con Mercado Pago"
              ) : (
                "Confirmar Pedido por Transferencia"
              )}
            </button>

            <p className="mt-4 text-center font-sans text-[11px] font-light leading-relaxed text-stone-500">
              Al confirmar tu pedido, reservamos el stock de tus prendas de
              forma inmediata y te enviamos el resumen por correo electrónico.
            </p>
          </div>
        </div>
      </form>
    </main>
  );
}
