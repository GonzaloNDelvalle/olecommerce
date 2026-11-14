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
  checkoutFormSchema,
  type CheckoutFormValues,
} from "@/modules/orders/schemas/checkout.schema";
import { processCheckoutOrder } from "@/modules/orders/checkout.actions";
import {
  computeOrderTotals,
  computeShippingCost,
  isShippingAvailableFor,
  type ShippingRule,
} from "@/modules/orders/pricing";

export interface CheckoutFormProps {
  shippingMethods: ShippingRule[];
  bankTransfer: { enabled: boolean; discountPercentage: number };
  showroomAddress: string | null;
}

const DEFAULT_PROVINCE = "Ciudad Autónoma de Buenos Aires";

const arsFormatter = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

const inputMinimalClass =
  "mt-1.5 h-[52px] w-full rounded-xl border border-stone-300 bg-white px-4 text-base text-ink placeholder:text-stone-500 transition-[border-color,box-shadow] duration-150 focus:border-ink focus:outline-none aria-[invalid=true]:border-brick aria-[invalid=true]:shadow-[0_0_0_3px_rgba(158,59,46,0.12)]";

const labelMinimalClass =
  "block text-[13px] font-semibold text-ink";

export function CheckoutForm({
  shippingMethods,
  bankTransfer,
  showroomAddress,
}: CheckoutFormProps) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const initialMethod =
    shippingMethods.find((m) => isShippingAvailableFor(m, DEFAULT_PROVINCE)) ??
    null;

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
      state: DEFAULT_PROVINCE,
      notes: "",
      shippingMethodId: initialMethod?.id ?? "",
      deliveryType: initialMethod?.type ?? "HOME_DELIVERY",
      paymentMethod: "MERCADOPAGO",
    },
  });

  const selectedPaymentMethod = watch("paymentMethod");
  const selectedProvince = watch("state");
  const selectedShippingMethodId = watch("shippingMethodId");

  const availableMethods = shippingMethods.filter((method) =>
    isShippingAvailableFor(method, selectedProvince)
  );
  const selectedMethod =
    availableMethods.find((m) => m.id === selectedShippingMethodId) ?? null;
  const isHomeDelivery = selectedMethod?.type !== "PICKUP";

  function selectShippingMethod(method: ShippingRule) {
    setValue("shippingMethodId", method.id, { shouldValidate: true });
    setValue("deliveryType", method.type, { shouldValidate: false });
  }

  // Al cambiar de provincia, si el método elegido no llega ahí, se elige el primero disponible
  function handleProvinceChange(province: string) {
    const stillAvailable = shippingMethods.find(
      (m) =>
        m.id === selectedShippingMethodId && isShippingAvailableFor(m, province)
    );
    if (stillAvailable) return;
    const next = shippingMethods.find((m) => isShippingAvailableFor(m, province));
    setValue("shippingMethodId", next?.id ?? "", { shouldValidate: true });
    setValue("deliveryType", next?.type ?? "HOME_DELIVERY");
  }

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
      <main className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
          <div className="h-96 animate-pulse bg-cream lg:col-span-7" />
          <div className="h-80 animate-pulse bg-cream lg:col-span-5" />
        </div>
      </main>
    );
  }

  if (items.length === 0 && !isRedirecting) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-24 text-center sm:px-6 lg:px-8">
        <div className="mx-auto flex h-16 w-16 items-center justify-center border border-stone-200 bg-cream/50">
          <ShoppingBag className="h-6 w-6 text-stone-500" strokeWidth={1.3} />
        </div>
        <h1 className="display mt-6 text-[40px] text-ink">
          Tu carrito está vacío
        </h1>
        <p className="mt-2 font-sans text-xs font-normal text-stone-500">
          Seleccioná tus prendas en el catálogo antes de iniciar el proceso de
          compra.
        </p>
        <Link
          href="/productos"
          className="pressable mt-8 inline-flex h-14 items-center gap-2 rounded-full bg-ink px-8 text-[15px] font-semibold text-paper hover:bg-espresso"
        >
          <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.5} />
          Explorar Catálogo
        </Link>
      </main>
    );
  }

  const subtotal = getSubtotal();
  const subtotalForShipping = subtotal;
  const isBankTransfer = selectedPaymentMethod === "BANK_TRANSFER";
  const shippingCost = selectedMethod
    ? computeShippingCost(selectedMethod, subtotal)
    : 0;
  const totals = computeOrderTotals({
    subtotal,
    shippingCost,
    isBankTransfer,
    bankTransferDiscountPercentage: bankTransfer.discountPercentage,
  });
  const transferDiscountAmount = totals.discountAmount;
  const finalTotal = totals.totalAmount;

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
      {/* Encabezado Editorial del Checkout */}
      <div className="mb-12 border-b border-stone-200 pb-8">
        <Link
          href="/productos"
          className="inline-flex items-center gap-2 text-xs font-normal tracking-[0.2em] text-stone-500 uppercase transition-colors hover:text-ink"
        >
          <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.4} />
          Volver al Catálogo
        </Link>
        <h1 className="display mt-4 text-[clamp(44px,5vw,64px)] text-ink">
          Finalizar compra
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
            <div className="flex items-start gap-3 border border-red-300 bg-red-50/60 p-4 text-xs font-normal text-red-800">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-brick" />
              <p>{serverError}</p>
            </div>
          )}

          {/* PASO 01 / CONTACTO Y ENVÍO */}
          <section>
            <div className="border-b border-stone-200 pb-3">
              <h2 className="flex items-center gap-3 font-sans text-lg font-semibold text-ink">
                <span className="inline-flex size-7 items-center justify-center rounded-full bg-ink text-[13px] font-bold text-paper">1</span>Tus datos
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
                  <p className="mt-1.5 text-xs font-normal text-brick">
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
                  <p className="mt-1.5 text-xs font-normal text-brick">
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
                  <p className="mt-1.5 text-xs font-normal text-brick">
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
                  <p className="mt-1.5 text-xs font-normal text-brick">
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
                  <p className="mt-1.5 text-xs font-normal text-brick">
                    {errors.phone.message}
                  </p>
                )}
              </div>

              {isHomeDelivery && (
                <>
              <div className="sm:col-span-6">
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
                  <p className="mt-1.5 text-xs font-normal text-brick">
                    {errors.street.message}
                  </p>
                )}
              </div>

              <div className="sm:col-span-3">
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
                  <p className="mt-1.5 text-xs font-normal text-brick">
                    {errors.number.message}
                  </p>
                )}
              </div>

              <div className="sm:col-span-3">
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
                  <p className="mt-1.5 text-xs font-normal text-brick">
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
                  <p className="mt-1.5 text-xs font-normal text-brick">
                    {errors.city.message}
                  </p>
                )}
              </div>

                </>
              )}

              <div className="sm:col-span-2">
                <label htmlFor="state" className={labelMinimalClass}>
                  Provincia *
                </label>
                <select
                  id="state"
                  {...register("state", {
                    onChange: (e) => handleProvinceChange(e.target.value),
                  })}
                  className={inputMinimalClass}
                >
                  {ARGENTINA_PROVINCES.map((province) => (
                    <option key={province} value={province}>
                      {province}
                    </option>
                  ))}
                </select>
                {errors.state && (
                  <p className="mt-1.5 text-xs font-normal text-brick">
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
              <h2 className="flex items-center gap-3 font-sans text-lg font-semibold text-ink">
                <span className="inline-flex size-7 items-center justify-center rounded-full bg-ink text-[13px] font-bold text-paper">2</span>Entrega
              </h2>
            </div>

            {availableMethods.length === 0 ? (
              <p className="mt-6 border border-stone-200 bg-cream/50 p-4 text-xs font-normal text-stone-600">
                Todavía no tenemos envíos configurados para {selectedProvince}.
                Escribinos y lo coordinamos.
              </p>
            ) : (
              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                {availableMethods.map((method) => {
                  const isSelected = selectedMethod?.id === method.id;
                  const cost = computeShippingCost(method, subtotalForShipping);
                  return (
                    <button
                      key={method.id}
                      type="button"
                      onClick={() => selectShippingMethod(method)}
                      aria-pressed={isSelected}
                      className={`flex cursor-pointer flex-col justify-between rounded-xl border p-4 text-left transition-[border-color,box-shadow] duration-150 ${
                        isSelected
                          ? "border-ink bg-white shadow-[0_0_0_1px_var(--color-ink)]"
                          : "border-stone-200 bg-white hover:border-stone-400"
                      }`}
                    >
                      <div className="flex w-full items-start justify-between gap-2">
                        <div>
                          <span className="block text-[15px] font-semibold text-ink">
                            {method.name}
                          </span>
                          {(method.description || method.estimatedDelivery) && (
                            <span className="mt-1 block text-xs font-normal text-stone-500">
                              {[method.description, method.estimatedDelivery]
                                .filter(Boolean)
                                .join(" · ")}
                            </span>
                          )}
                          {method.type === "PICKUP" && showroomAddress && (
                            <span className="mt-1 block text-xs font-normal text-stone-500">
                              {showroomAddress}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium tracking-[0.18em] whitespace-nowrap text-ink uppercase">
                            {cost === 0 ? "Sin cargo" : arsFormatter.format(cost)}
                          </span>
                          {isSelected && (
                            <Check className="h-4 w-4 text-ink" strokeWidth={1.6} />
                          )}
                        </div>
                      </div>
                      {method.freeShippingThreshold !== null && cost > 0 && (
                        <span className="mt-3 block text-xs font-normal tracking-wide text-chocolate">
                          Gratis desde {arsFormatter.format(method.freeShippingThreshold)}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
            {errors.shippingMethodId && (
              <p className="mt-2 text-xs font-normal text-brick">
                {errors.shippingMethodId.message}
              </p>
            )}
          </section>

          {/* PASO 03 / FORMA DE PAGO */}
          <section>
            <div className="border-b border-stone-200 pb-3">
              <h2 className="flex items-center gap-3 font-sans text-lg font-semibold text-ink">
                <span className="inline-flex size-7 items-center justify-center rounded-full bg-ink text-[13px] font-bold text-paper">3</span>Pago
              </h2>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Opción 1: Transferencia Bancaria (descuento configurable) */}
              {bankTransfer.enabled && (
              <button
                type="button"
                onClick={() =>
                  setValue("paymentMethod", "BANK_TRANSFER", {
                    shouldValidate: true,
                  })
                }
                className={`flex cursor-pointer flex-col justify-between rounded-xl border p-4 text-left transition-[border-color,box-shadow] duration-150 ${
                  selectedPaymentMethod === "BANK_TRANSFER"
                    ? "border-ink bg-white shadow-[0_0_0_1px_var(--color-ink)]"
                    : "border-stone-200 bg-white hover:border-stone-400"
                }`}
              >
                <div className="flex w-full items-start justify-between gap-2">
                  <div>
                    <span className="block text-[15px] font-semibold text-ink">
                      Transferencia Bancaria
                    </span>
                    <span className="mt-1.5 inline-block border border-chocolate/40 bg-chocolate/10 px-2 py-0.5 text-xs font-medium tracking-[0.18em] text-chocolate uppercase">
                      {bankTransfer.discountPercentage}% OFF Adicional
                    </span>
                  </div>
                  {selectedPaymentMethod === "BANK_TRANSFER" && (
                    <Check className="h-4 w-4 shrink-0 text-ink" strokeWidth={1.6} />
                  )}
                </div>

                <p className="mt-4 font-sans text-xs font-normal leading-relaxed text-stone-500">
                  Transferí desde cualquier banco o billetera virtual a nuestro
                  CBU / Alias con descuento directo sobre el total.
                </p>
              </button>
              )}

              {/* Opción 2: Mercado Pago */}
              <button
                type="button"
                onClick={() =>
                  setValue("paymentMethod", "MERCADOPAGO", {
                    shouldValidate: true,
                  })
                }
                className={`flex cursor-pointer flex-col justify-between rounded-xl border p-4 text-left transition-[border-color,box-shadow] duration-150 ${
                  selectedPaymentMethod === "MERCADOPAGO"
                    ? "border-ink bg-white shadow-[0_0_0_1px_var(--color-ink)]"
                    : "border-stone-200 bg-white hover:border-stone-400"
                }`}
              >
                <div className="flex w-full items-start justify-between gap-2">
                  <div>
                    <span className="block text-[15px] font-semibold text-ink">
                      Mercado Pago
                    </span>
                    <span className="mt-1.5 inline-block border border-stone-200 bg-cream px-2 py-0.5 text-xs font-normal tracking-[0.16em] text-stone-600 uppercase">
                      Tarjetas &amp; Dinero en Cuenta
                    </span>
                  </div>
                  {selectedPaymentMethod === "MERCADOPAGO" && (
                    <Check className="h-4 w-4 shrink-0 text-ink" strokeWidth={1.6} />
                  )}
                </div>

                <p className="mt-4 font-sans text-xs font-normal leading-relaxed text-stone-500">
                  Aboná con tarjetas de crédito en cuotas, débito o saldo de
                  Mercado Pago con acreditación instantánea.
                </p>
              </button>
            </div>
          </section>
        </div>

        {/* COLUMNA DERECHA: Resumen del Pedido (5 columnas, sticky top-28) */}
        <div className="h-fit lg:sticky lg:top-28 lg:col-span-5">
          <div className="bg-cream p-6 sm:p-8">
            <h2 className="border-b border-chocolate/15 pb-4 font-sans text-lg font-semibold text-ink">
              Resumen
            </h2>

            {/* Lista de prendas compradas */}
            <ul className="divide-y divide-stone-200/80">
              {items.map((item) => (
                <li key={item.variantId} className="flex gap-4 py-4">
                  <div className="relative aspect-[3/4] w-16 shrink-0 overflow-hidden bg-cream">
                    {item.imageUrl && (
                      <Image
                        src={item.imageUrl}
                        alt={item.productName}
                        fill
                        sizes="64px"
                        className="h-full w-full object-cover"
                      />
                    )}
                  </div>

                  <div className="flex flex-1 flex-col justify-between">
                    <div>
                      <p className="text-sm font-semibold text-ink">
                        {item.productName}
                      </p>
                      <p className="mt-1 font-sans text-xs font-normal text-stone-500">
                        {item.colorName} / Talle {item.sizeName}
                      </p>
                    </div>
                    <div className="mt-2 flex items-center justify-between font-sans text-xs font-normal">
                      <span className="text-stone-500">
                        Cant. {item.quantity}
                      </span>
                      <span className="text-ink">
                        {arsFormatter.format(item.unitPrice * item.quantity)}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            {/* Desglose tipográfico fino */}
            <div className="mt-4 space-y-3 border-t border-stone-200 pt-5 font-sans text-xs font-normal">
              <div className="flex justify-between text-stone-600">
                <span className="">Subtotal</span>
                <span className="text-sm text-ink">
                  {arsFormatter.format(subtotal)}
                </span>
              </div>

              {isBankTransfer && transferDiscountAmount > 0 && (
                <div className="flex justify-between text-chocolate">
                  <span className="">
                    Ahorro Transferencia ({bankTransfer.discountPercentage}%
                    OFF)
                  </span>
                  <span className="text-sm font-normal">
                    -{arsFormatter.format(transferDiscountAmount)}
                  </span>
                </div>
              )}

              <div className="flex justify-between text-stone-600">
                <span className="">Envío</span>
                <span className="tabular text-sm font-semibold text-ink">
                  {!selectedMethod
                    ? "—"
                    : shippingCost === 0
                      ? "Sin cargo"
                      : arsFormatter.format(shippingCost)}
                </span>
              </div>

              <div className="flex items-baseline justify-between border-t border-stone-200 pt-4">
                <span className="text-base font-semibold text-ink">
                  Total
                </span>
                <span className="tabular text-[28px] font-semibold text-ink">
                  {arsFormatter.format(finalTotal)}
                </span>
              </div>
            </div>

            {/* Botón final de confirmación en negro profundo */}
            <button
              type="submit"
              disabled={isSubmitting || isRedirecting}
              className="pressable mt-7 flex h-14 w-full items-center justify-center gap-2 rounded-full bg-ink px-6 text-[15px] font-semibold text-paper transition-colors hover:bg-espresso disabled:cursor-not-allowed disabled:opacity-40"
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

            <p className="mt-4 text-center font-sans text-xs font-normal leading-relaxed text-stone-500">
              Al confirmar tu pedido, reservamos el stock de tus prendas de
              forma inmediata y te enviamos el resumen por correo electrónico.
            </p>
          </div>
        </div>
      </form>
    </main>
  );
}
