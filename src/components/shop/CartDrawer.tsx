"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  X,
  Plus,
  Minus,
  ShoppingBag,
  ArrowRight,
} from "lucide-react";
import { useCartStore } from "@/store/cart.store";

/**
 * Umbral configurable para alcanzar el envío bonificado en ARS.
 */
const FREE_SHIPPING_THRESHOLD_ARS = 180_000;

const arsFormatter = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

export function CartDrawer() {
  const [mounted, setMounted] = useState(false);

  const items = useCartStore((state) => state.items);
  const isOpen = useCartStore((state) => state.isOpen);
  const closeCart = useCartStore((state) => state.closeCart);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const clearCart = useCartStore((state) => state.clearCart);
  const getSubtotal = useCartStore((state) => state.getSubtotal);
  const getTotalItems = useCartStore((state) => state.getTotalItems);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Cerrar con tecla Escape y bloquear el scroll del body cuando el slide-over está abierto
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeCart();
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, closeCart]);

  if (!mounted) return null;

  const subtotal = getSubtotal();
  const totalItems = getTotalItems();

  const remainingForFreeShipping = Math.max(
    0,
    FREE_SHIPPING_THRESHOLD_ARS - subtotal
  );
  const shippingProgressPercent = Math.min(
    100,
    Math.round((subtotal / FREE_SHIPPING_THRESHOLD_ARS) * 100)
  );
  const hasFreeShipping = subtotal >= FREE_SHIPPING_THRESHOLD_ARS;

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 overflow-hidden"
          aria-labelledby="cart-drawer-title"
          role="dialog"
          aria-modal="true"
        >
          {/* Overlay oscuro con desenfoque */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={closeCart}
            className="fixed inset-0 bg-stone-950/45 backdrop-blur-xs"
            aria-hidden="true"
          />

          <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
            {/* Panel lateral (Slide-over con bordes rectos arquitectónicos) */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="flex w-screen max-w-md flex-col rounded-none border-l border-stone-200 bg-white shadow-2xl"
            >
              {/* Encabezado del Drawer */}
              <div className="flex items-center justify-between border-b border-stone-200 px-6 py-5">
                <div className="flex items-center gap-2.5">
                  <ShoppingBag
                    className="h-4 w-4 text-stone-900"
                    strokeWidth={1.4}
                  />
                  <h2
                    id="cart-drawer-title"
                    className="font-serif text-xl font-normal tracking-[0.14em] text-stone-900 uppercase"
                  >
                    Tu Carrito ({totalItems})
                  </h2>
                </div>

                <div className="flex items-center gap-4">
                  {items.length > 0 && (
                    <button
                      type="button"
                      onClick={clearCart}
                      className="text-[10px] font-light tracking-[0.2em] text-stone-400 uppercase transition-colors hover:text-stone-900"
                    >
                      Vaciar
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={closeCart}
                    aria-label="Cerrar carrito"
                    className="rounded-none p-1 text-stone-500 transition-colors hover:text-stone-950"
                  >
                    <X className="h-5 w-5" strokeWidth={1.4} />
                  </button>
                </div>
              </div>

              {/* Barra Dinámica de Envío Bonificado */}
              <div className="border-b border-stone-200 bg-stone-50/70 px-6 py-3.5">
                <div className="flex items-center justify-between text-[10px] font-light tracking-[0.16em] text-stone-600 uppercase">
                  {hasFreeShipping ? (
                    <span className="font-normal text-stone-900">
                      Contás con envío bonificado en tu pedido
                    </span>
                  ) : (
                    <span>
                      Te faltan{" "}
                      <strong className="font-medium text-stone-900">
                        {arsFormatter.format(remainingForFreeShipping)}
                      </strong>{" "}
                      para envío bonificado
                    </span>
                  )}
                  <span className="font-mono text-[10px] text-stone-400">
                    {shippingProgressPercent}%
                  </span>
                </div>

                {/* Línea de progreso negra sobre fondo gris claro */}
                <div className="mt-2 h-[2px] w-full overflow-hidden bg-stone-200">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${shippingProgressPercent}%` }}
                    transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                    className="h-full bg-stone-900"
                  />
                </div>
              </div>

              {/* Lista de Productos en el Carrito */}
              <div
                data-lenis-prevent
                className="flex-1 overflow-y-auto px-6 py-6"
              >
                {items.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-none border border-stone-200 bg-stone-50">
                      <ShoppingBag
                        className="h-6 w-6 text-stone-400"
                        strokeWidth={1.2}
                      />
                    </div>
                    <p className="mt-5 font-serif text-2xl font-normal tracking-[0.08em] text-stone-900 uppercase">
                      Tu carrito está vacío
                    </p>
                    <p className="mt-2 max-w-xs text-xs font-light leading-relaxed text-stone-500">
                      Explorá nuestra colección y agregá tus prendas favoritas en
                      tu talle y color.
                    </p>
                    <button
                      type="button"
                      onClick={closeCart}
                      className="mt-7 rounded-none border border-stone-900 px-6 py-3 text-[11px] font-normal tracking-[0.22em] text-stone-900 uppercase transition-colors hover:bg-stone-900 hover:text-white"
                    >
                      Seguir viendo prendas
                    </button>
                  </div>
                ) : (
                  <ul className="divide-y divide-stone-200/80">
                    <AnimatePresence initial={false}>
                      {items.map((item) => {
                        const atMaxStock = item.quantity >= item.maxStock;
                        return (
                          <motion.li
                            key={item.variantId}
                            layout
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, x: 24 }}
                            transition={{ duration: 0.25 }}
                            className="flex py-5 first:pt-0"
                          >
                            {/* Miniatura de la prenda */}
                            <Link
                              href={`/productos/${item.productId}`}
                              onClick={closeCart}
                              className="relative aspect-[3/4] w-20 shrink-0 overflow-hidden rounded-none bg-stone-100"
                            >
                              {item.imageUrl ? (
                                <Image
                                  src={item.imageUrl}
                                  alt={item.productName}
                                  fill
                                  sizes="80px"
                                  className="object-cover"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-[10px] text-stone-400 uppercase">
                                  Sin foto
                                </div>
                              )}
                            </Link>

                            {/* Detalles de la variante */}
                            <div className="ml-4 flex flex-1 flex-col justify-between">
                              <div>
                                <div className="flex items-start justify-between gap-2">
                                  <Link
                                    href={`/productos/${item.productId}`}
                                    onClick={closeCart}
                                    className="text-xs font-normal tracking-[0.12em] text-stone-900 uppercase transition-colors hover:text-[#5C4033]"
                                  >
                                    {item.productName}
                                  </Link>
                                  <button
                                    type="button"
                                    onClick={() => removeItem(item.variantId)}
                                    aria-label={`Eliminar ${item.productName}`}
                                    className="text-[10px] font-light tracking-[0.16em] text-stone-400 uppercase transition-colors hover:text-stone-900"
                                  >
                                    Quitar
                                  </button>
                                </div>

                                {/* Talle y Color */}
                                <div className="mt-1.5 flex items-center gap-2 text-[11px] font-light text-stone-500">
                                  <span className="inline-flex items-center gap-1.5">
                                    <span
                                      className="h-2.5 w-2.5 rounded-none border border-stone-300"
                                      style={{ backgroundColor: item.colorHex }}
                                    />
                                    {item.colorName}
                                  </span>
                                  <span className="text-stone-300">/</span>
                                  <span>Talle {item.sizeName}</span>
                                </div>

                                {atMaxStock && (
                                  <p className="mt-1 text-[10px] font-light text-amber-700">
                                    Stock máximo alcanzado ({item.maxStock} u.)
                                  </p>
                                )}
                              </div>

                              {/* Controles de cantidad limpios sin cajas pesadas + Subtotal */}
                              <div className="mt-3 flex items-center justify-between">
                                <div className="inline-flex items-center gap-3 border-b border-stone-200 pb-0.5">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      updateQuantity(
                                        item.variantId,
                                        item.quantity - 1
                                      )
                                    }
                                    aria-label="Disminuir cantidad"
                                    className="py-0.5 text-stone-500 transition-colors hover:text-stone-950"
                                  >
                                    <Minus className="h-3 w-3" strokeWidth={1.5} />
                                  </button>

                                  <span className="min-w-4 text-center font-sans text-xs font-light text-stone-900">
                                    {item.quantity}
                                  </span>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      updateQuantity(
                                        item.variantId,
                                        item.quantity + 1
                                      )
                                    }
                                    disabled={atMaxStock}
                                    aria-label="Aumentar cantidad"
                                    className="py-0.5 text-stone-500 transition-colors hover:text-stone-950 disabled:cursor-not-allowed disabled:opacity-30"
                                  >
                                    <Plus className="h-3 w-3" strokeWidth={1.5} />
                                  </button>
                                </div>

                                <span className="font-sans text-sm font-light tracking-wide text-stone-900">
                                  {arsFormatter.format(
                                    item.unitPrice * item.quantity
                                  )}
                                </span>
                              </div>
                            </div>
                          </motion.li>
                        );
                      })}
                    </AnimatePresence>
                  </ul>
                )}
              </div>

              {/* Pie del Drawer: Resumen de Subtotal con tipografía font-sans ligera y botón de Checkout */}
              {items.length > 0 && (
                <div className="border-t border-stone-200 bg-stone-50 px-6 py-6">
                  <div className="flex items-baseline justify-between">
                    <span className="font-sans text-xs font-light tracking-[0.2em] text-stone-500 uppercase">
                      Subtotal
                    </span>
                    <span className="font-sans text-xl font-light tracking-wide text-stone-900">
                      {arsFormatter.format(subtotal)}
                    </span>
                  </div>
                  <p className="mt-1.5 font-sans text-[11px] font-light text-stone-500">
                    15% OFF adicional abonando por transferencia bancaria en el
                    checkout.
                  </p>

                  <Link
                    href="/checkout"
                    onClick={closeCart}
                    className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-none bg-stone-900 px-6 text-xs font-medium tracking-[0.2em] text-white uppercase transition-colors hover:bg-stone-800"
                  >
                    Iniciar Compra
                    <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
                  </Link>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
