"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  X,
  Plus,
  Minus,
  Trash2,
  ShoppingBag,
  ArrowRight,
} from "lucide-react";
import { useCartStore } from "@/store/cart.store";

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

  if (!mounted || !isOpen) return null;

  const subtotal = getSubtotal();
  const totalItems = getTotalItems();

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden"
      aria-labelledby="cart-drawer-title"
      role="dialog"
      aria-modal="true"
    >
      {/* Overlay oscuro con desenfoque */}
      <div
        onClick={closeCart}
        className="fixed inset-0 bg-stone-950/40 backdrop-blur-xs transition-opacity"
        aria-hidden="true"
      />

      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
        {/* Panel lateral (Slide-over) */}
        <div className="flex w-screen max-w-md flex-col bg-white shadow-2xl">
          {/* Encabezado del Drawer */}
          <div className="flex items-center justify-between border-b border-stone-200 px-6 py-5">
            <div className="flex items-center gap-2.5">
              <ShoppingBag className="h-5 w-5 text-stone-900" />
              <h2
                id="cart-drawer-title"
                className="text-base font-semibold tracking-wider text-stone-900 uppercase"
              >
                Tu Carrito ({totalItems})
              </h2>
            </div>

            <div className="flex items-center gap-2">
              {items.length > 0 && (
                <button
                  type="button"
                  onClick={clearCart}
                  className="text-[11px] font-medium text-stone-500 underline underline-offset-2 transition-colors hover:text-red-600"
                >
                  Vaciar
                </button>
              )}

              <button
                type="button"
                onClick={closeCart}
                aria-label="Cerrar carrito"
                className="rounded-full p-1.5 text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-900"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Lista de Productos en el Carrito */}
          <div className="flex-1 overflow-y-auto px-6 py-6">
            {items.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-stone-100">
                  <ShoppingBag className="h-7 w-7 text-stone-400" />
                </div>
                <p className="mt-4 text-base font-medium text-stone-900">
                  Tu carrito está vacío
                </p>
                <p className="mt-1 max-w-xs text-xs text-stone-500">
                  Explorá nuestra colección y agregá tus prendas favoritas en tu
                  talle y color.
                </p>
                <button
                  type="button"
                  onClick={closeCart}
                  className="mt-6 rounded-lg border border-stone-900 px-5 py-2.5 text-xs font-semibold tracking-wider text-stone-900 uppercase transition-colors hover:bg-stone-900 hover:text-white"
                >
                  Seguir viendo prendas
                </button>
              </div>
            ) : (
              <ul className="divide-y divide-stone-200">
                {items.map((item) => {
                  const atMaxStock = item.quantity >= item.maxStock;
                  return (
                    <li key={item.variantId} className="flex py-5 first:pt-0">
                      {/* Miniatura de la prenda */}
                      <Link
                        href={`/productos/${item.productId}`}
                        onClick={closeCart}
                        className="relative h-28 w-20 shrink-0 overflow-hidden rounded-md bg-stone-100"
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
                              className="text-sm font-medium text-stone-900 hover:text-stone-600"
                            >
                              {item.productName}
                            </Link>
                            <button
                              type="button"
                              onClick={() => removeItem(item.variantId)}
                              aria-label={`Eliminar ${item.productName}`}
                              className="text-stone-400 transition-colors hover:text-red-600"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>

                          {/* Talle y Color */}
                          <div className="mt-1 flex items-center gap-2 text-xs text-stone-500">
                            <span className="inline-flex items-center gap-1.5">
                              <span
                                className="h-3 w-3 rounded-full border border-stone-300"
                                style={{ backgroundColor: item.colorHex }}
                              />
                              {item.colorName}
                            </span>
                            <span>•</span>
                            <span>Talle {item.sizeName}</span>
                          </div>

                          {atMaxStock && (
                            <p className="mt-1 text-[11px] font-medium text-amber-700">
                              Máximo stock disponible ({item.maxStock} u.)
                            </p>
                          )}
                        </div>

                        {/* Controles de cantidad y subtotal del ítem */}
                        <div className="mt-3 flex items-center justify-between">
                          <div className="inline-flex items-center rounded-md border border-stone-200">
                            <button
                              type="button"
                              onClick={() =>
                                updateQuantity(
                                  item.variantId,
                                  item.quantity - 1
                                )
                              }
                              aria-label="Disminuir cantidad"
                              className="p-1.5 text-stone-600 transition-colors hover:bg-stone-100 hover:text-stone-900"
                            >
                              <Minus className="h-3.5 w-3.5" />
                            </button>

                            <span className="min-w-8 text-center text-xs font-medium text-stone-900">
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
                              className="p-1.5 text-stone-600 transition-colors hover:bg-stone-100 hover:text-stone-900 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                          </div>

                          <span className="text-sm font-semibold text-stone-900">
                            {arsFormatter.format(
                              item.unitPrice * item.quantity
                            )}
                          </span>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Pie del Drawer: Subtotal y Botón "Iniciar Compra" */}
          {items.length > 0 && (
            <div className="border-t border-stone-200 bg-stone-50 px-6 py-6">
              <div className="flex items-center justify-between text-base font-semibold text-stone-900">
                <span>Subtotal</span>
                <span>{arsFormatter.format(subtotal)}</span>
              </div>
              <p className="mt-1 text-xs text-stone-500">
                El costo de envío se calcula al ingresar tu código postal en el
                checkout.
              </p>

              <Link
                href="/checkout"
                onClick={closeCart}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-stone-900 px-6 py-4 text-sm font-semibold tracking-wider text-white uppercase transition-colors hover:bg-stone-800"
              >
                Iniciar Compra
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
