"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Minus, Plus, ShoppingBag } from "lucide-react";
import { useCartStore } from "@/store/cart.store";
import { useHydrated } from "@/hooks/use-hydrated";
import { Sheet } from "@/components/ui/Sheet";
import { buttonVariants } from "@/components/ui/button";
import { productHref } from "@/modules/products/urls";
import { formatARS, plural } from "@/lib/format";

export interface CartSuggestion {
  id: string;
  name: string;
  slug: string;
  price: number;
  imageUrl: string | null;
  imageAlt: string;
}

interface CartDrawerProps {
  /** Productos para "Combina con" (se excluyen los que ya están en el carrito). */
  suggestions: CartSuggestion[];
  /** Monto desde el que el envío a domicilio es gratis (null = no hay envío gratis). */
  freeShippingThreshold: number | null;
  /** % de descuento por transferencia (0 = no disponible). */
  transferDiscount: number;
}

const stepButton =
  "pressable inline-flex size-9 items-center justify-center rounded-full text-ink hover:bg-ink/5 disabled:opacity-30";

/**
 * Carrito (DESIGN.md §9): panel derecho de fondo sólido (sin vidrio, para
 * legibilidad), barra de envío gratis y acceso directo al checkout.
 */
export function CartDrawer({ freeShippingThreshold, transferDiscount, suggestions }: CartDrawerProps) {
  const hydrated = useHydrated();
  const items = useCartStore((s) => s.items);
  const isOpen = useCartStore((s) => s.isOpen);
  const closeCart = useCartStore((s) => s.closeCart);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);

  if (!hydrated) return null;

  const inCart = new Set(items.map((i) => i.productId));
  const picks = suggestions.filter((p) => !inCart.has(p.id)).slice(0, 4);

  const suggestionBlock =
    picks.length > 0 ? (
      <section aria-labelledby="cart-suggestions" className="flex flex-col gap-3.5 px-6 pt-2 pb-6">
        <h3 id="cart-suggestions" className="eyebrow text-chocolate">
          Combina con
        </h3>
        <ul className="-mx-6 flex snap-x gap-3 overflow-x-auto px-6 pb-1 [scrollbar-width:none]">
          {picks.map((p) => (
            <li key={p.id} className="w-[132px] shrink-0 snap-start">
              <Link href={productHref(p.slug)} onClick={closeCart} className="group flex flex-col gap-2">
                <span className="relative block aspect-[3/4] overflow-hidden bg-cream">
                  {p.imageUrl && (
                    <Image
                      src={p.imageUrl}
                      alt={p.imageAlt}
                      fill
                      sizes="132px"
                      className="object-cover transition-transform duration-300 ease-out group-hover:scale-[1.03]"
                    />
                  )}
                </span>
                <span className="line-clamp-2 text-[13px] leading-snug font-semibold text-ink">{p.name}</span>
                <span className="tabular -mt-1 text-[13px] text-stone-700">{formatARS(p.price)}</span>
                <span className="inline-flex h-9 items-center justify-center rounded-full border border-ink text-[13px] font-semibold text-ink transition-colors duration-150 group-hover:bg-ink group-hover:text-paper">
                  Elegir talle
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    ) : null;

  const subtotal = items.reduce((acc, i) => acc + i.unitPrice * i.quantity, 0);
  const count = items.reduce((acc, i) => acc + i.quantity, 0);
  const remaining = freeShippingThreshold ? Math.max(0, freeShippingThreshold - subtotal) : null;
  const progress = freeShippingThreshold ? Math.min(100, Math.round((subtotal / freeShippingThreshold) * 100)) : 0;

  return (
    <Sheet
      open={isOpen}
      onClose={closeCart}
      ariaLabel={`Tu carrito, ${count} ${plural(count, "producto", "productos")}`}
      title={
        <>
          Tu carrito{" "}
          <span className="tabular font-sans text-[15px] font-medium tracking-normal text-stone-600">({count})</span>
        </>
      }
      footer={
        items.length > 0 ? (
          <div className="flex flex-col gap-3.5">
            {freeShippingThreshold !== null && (
              <div className="flex justify-between text-sm text-stone-600">
                <span>Envío</span>
                {remaining === 0 ? (
                  <span className="font-semibold text-olive-deep">Gratis</span>
                ) : (
                  <span>Se calcula en el checkout</span>
                )}
              </div>
            )}
            <div className="flex items-baseline justify-between">
              <span className="text-base font-semibold">Subtotal</span>
              <span className="tabular text-[22px] font-semibold">{formatARS(subtotal)}</span>
            </div>
            {transferDiscount > 0 && (
              <p className="-mt-2 text-[13px] text-stone-600">
                {transferDiscount}% off extra pagando por transferencia en el checkout.
              </p>
            )}
            <Link href="/checkout" onClick={closeCart} className={buttonVariants({ size: "lg", block: true })}>
              Finalizar compra
              <ArrowRight className="size-[18px]" strokeWidth={1.8} aria-hidden="true" />
            </Link>
            <button type="button" onClick={closeCart} className={buttonVariants({ variant: "secondary", size: "lg", block: true })}>
              Seguir comprando
            </button>
          </div>
        ) : undefined
      }
    >
      {items.length === 0 ? (
        <>
        <div className="flex flex-col items-center gap-5 px-6 py-16 text-center">
          <span className="inline-flex size-16 items-center justify-center rounded-full bg-cream text-chocolate">
            <ShoppingBag className="size-7" strokeWidth={1.4} aria-hidden="true" />
          </span>
          <p className="display text-[28px] text-ink">Tu carrito está vacío</p>
          <p className="max-w-xs text-[15px] text-stone-600">Mirá las novedades de la temporada y elegí tu talle.</p>
          <Link href="/productos" onClick={closeCart} className={buttonVariants({ size: "lg" })}>
            Ir a la tienda
          </Link>
        </div>
        {suggestionBlock}
        </>
      ) : (
        <>
          {remaining !== null && (
            <div className="flex flex-col gap-2.5 bg-cream px-6 py-4">
              <p className="text-sm">
                {remaining === 0 ? (
                  <span className="font-semibold text-olive-deep">Tu compra tiene envío gratis</span>
                ) : (
                  <>
                    Te faltan <strong className="tabular">{formatARS(remaining)}</strong> para el <strong>envío gratis</strong>
                  </>
                )}
              </p>
              <div className="h-1 rounded-full bg-chocolate/15" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label="Progreso hacia el envío gratis">
                <div
                  className="h-1 rounded-full bg-olive transition-[width] duration-500 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          <ul className="flex flex-col px-6">
            {items.map((item) => (
              <li key={item.variantId} className="grid grid-cols-[88px_minmax(0,1fr)] gap-4 border-b border-stone-200 py-5 last:border-0">
                <Link href={productHref(item.productSlug)} onClick={closeCart} className="relative block aspect-[3/4] overflow-hidden bg-cream">
                  {item.imageUrl && <Image src={item.imageUrl} alt={item.productName} fill sizes="88px" className="object-cover" />}
                </Link>
                <div className="flex min-w-0 flex-col gap-1.5">
                  <div className="flex items-start justify-between gap-3">
                    <Link href={productHref(item.productSlug)} onClick={closeCart} className="text-[15px] leading-snug font-semibold hover:text-chocolate">
                      {item.productName}
                    </Link>
                    <span className="tabular shrink-0 text-[15px] font-semibold">{formatARS(item.unitPrice * item.quantity)}</span>
                  </div>
                  <span className="flex items-center gap-1.5 text-[13px] text-stone-600">
                    <span aria-hidden="true" className="size-3 rounded-full border border-ink/10" style={{ backgroundColor: item.colorHex }} />
                    {item.colorName} · Talle {item.sizeName}
                  </span>
                  <div className="mt-auto flex items-center justify-between pt-2">
                    <div className="inline-flex items-center rounded-full border border-stone-300 p-0.5">
                      <button
                        type="button"
                        className={stepButton}
                        onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                        aria-label={item.quantity === 1 ? `Quitar ${item.productName}` : "Restar uno"}
                      >
                        <Minus className="size-4" strokeWidth={1.8} />
                      </button>
                      <span className="tabular min-w-7 text-center text-sm font-semibold" aria-live="polite">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        className={stepButton}
                        onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                        disabled={item.quantity >= item.maxStock}
                        aria-label="Sumar uno"
                      >
                        <Plus className="size-4" strokeWidth={1.8} />
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeItem(item.variantId)}
                      className="pressable inline-flex h-9 items-center rounded-full border border-stone-300 px-3.5 text-[13px] font-semibold text-stone-700 hover:border-ink hover:text-ink"
                    >
                      Quitar
                    </button>
                  </div>
                  {item.quantity >= item.maxStock && (
                    <p className="text-xs text-stone-600">Es todo el stock disponible de este talle.</p>
                  )}
                </div>
              </li>
            ))}
          </ul>
          {suggestionBlock}
        </>
      )}
    </Sheet>
  );
}
