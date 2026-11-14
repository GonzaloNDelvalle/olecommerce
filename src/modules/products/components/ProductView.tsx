"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Ruler } from "lucide-react";
import { trackAddToCart } from "@/lib/analytics";
import type { ProductDetailDTO } from "@/modules/products/types";
import { useCartStore } from "@/store/cart.store";
import { ProductGallery, type GalleryImage } from "@/modules/products/components/ProductGallery";
import { buttonVariants } from "@/components/ui/button";
import { formatARS } from "@/lib/format";
import { cn } from "@/lib/cn";

const REFERENCE_SIZE_TABLE = [
  { size: "XS", bust: "82 – 85", waist: "62 – 65", hip: "88 – 91" },
  { size: "S", bust: "86 – 89", waist: "66 – 69", hip: "92 – 95" },
  { size: "M", bust: "90 – 94", waist: "70 – 74", hip: "96 – 100" },
  { size: "L", bust: "95 – 99", waist: "75 – 79", hip: "101 – 105" },
  { size: "XL", bust: "100 – 105", waist: "80 – 85", hip: "106 – 111" },
];

/** Pocas unidades: avisamos para ayudar a decidir, sin inventar urgencia. */
const LOW_STOCK = 3;

interface ProductViewProps {
  product: ProductDetailDTO;
  /** % de descuento por transferencia, o 0 si no está disponible. */
  transferDiscount: number;
  /** Cuotas sin interés que se muestran bajo el precio (0 = no mostrar). */
  installments: number;
}

const summaryClass =
  "flex cursor-pointer list-none items-center justify-between py-[18px] text-[15px] font-semibold text-ink [&::-webkit-details-marker]:hidden";

export function ProductView({ product, transferDiscount, installments }: ProductViewProps) {
  const addItem = useCartStore((s) => s.addItem);
  const cartItems = useCartStore((s) => s.items);

  const colors = useMemo(() => {
    const map = new Map<string, { id: string; name: string; hexCode: string }>();
    for (const v of product.variants) if (!map.has(v.color.id)) map.set(v.color.id, v.color);
    return [...map.values()];
  }, [product.variants]);

  const sizes = useMemo(() => {
    const map = new Map<string, { id: string; name: string; sortOrder: number }>();
    for (const v of product.variants) if (!map.has(v.size.id)) map.set(v.size.id, v.size);
    return [...map.values()].sort((a, b) => a.sortOrder - b.sortOrder);
  }, [product.variants]);

  const firstInStock = product.variants.find((v) => v.availableStock > 0) ?? product.variants[0];
  const [colorId, setColorId] = useState<string | null>(firstInStock?.color.id ?? null);
  // El talle arranca vacío a propósito: elegirlo es una decisión de la clienta.
  const [sizeId, setSizeId] = useState<string | null>(sizes.length === 1 ? sizes[0].id : null);
  const [error, setError] = useState<string | null>(null);
  const [justAdded, setJustAdded] = useState(false);

  const images: GalleryImage[] = useMemo(() => {
    const seen = new Set<string>();
    const list: GalleryImage[] = [];
    const push = (url: string | null | undefined, alt: string) => {
      if (url && !seen.has(url)) {
        seen.add(url);
        list.push({ url, alt });
      }
    };
    const color = colors.find((c) => c.id === colorId);
    // Primero, las fotos del color elegido
    for (const img of product.images) if (img.colorId === colorId) push(img.url, img.altText ?? `${product.name} en ${color?.name}`);
    push(product.variants.find((v) => v.color.id === colorId && v.imageUrl)?.imageUrl, `${product.name} en ${color?.name}`);
    for (const img of product.images) if (!img.colorId) push(img.url, img.altText ?? product.name);
    if (list.length === 0) for (const img of product.images) push(img.url, img.altText ?? product.name);
    return list;
  }, [product.images, product.variants, product.name, colors, colorId]);

  const variant = product.variants.find((v) => v.color.id === colorId && v.size.id === sizeId) ?? null;
  const inCart = variant ? (cartItems.find((i) => i.variantId === variant.id)?.quantity ?? 0) : 0;
  const maxedOut = variant !== null && inCart >= variant.availableStock;

  const basePrice = variant?.priceOverride ?? product.basePrice;
  const finalPrice = product.discountPercentage > 0 ? Math.round(basePrice * (1 - product.discountPercentage / 100)) : basePrice;
  const strikethrough =
    product.discountPercentage > 0
      ? basePrice
      : product.compareAtPrice !== null && product.compareAtPrice > finalPrice
        ? product.compareAtPrice
        : null;
  const percentOff = strikethrough ? Math.round((1 - finalPrice / strikethrough) * 100) : 0;

  const colorName = colors.find((c) => c.id === colorId)?.name;
  const sizeName = sizes.find((s) => s.id === sizeId)?.name;

  const stockFor = (sId: string) =>
    product.variants.find((v) => v.color.id === colorId && v.size.id === sId)?.availableStock ?? 0;

  function selectColor(id: string) {
    setColorId(id);
    setError(null);
    setJustAdded(false);
    if (sizeId && !product.variants.some((v) => v.color.id === id && v.size.id === sizeId && v.availableStock > 0)) {
      setSizeId(null);
    }
  }

  function add() {
    if (!sizeId || !variant) {
      setError("Elegí tu talle para agregarlo al carrito.");
      document.getElementById("size-picker")?.focus();
      return;
    }
    if (variant.availableStock <= 0) {
      setError("Este talle no tiene stock en este color.");
      return;
    }
    if (maxedOut) {
      setError(`Ya tenés en el carrito todas las unidades disponibles (${variant.availableStock}).`);
      return;
    }
    setError(null);
    addItem({
      variantId: variant.id,
      productId: product.id,
      productName: product.name,
      productSlug: product.slug,
      sku: variant.sku,
      sizeName: variant.size.name,
      colorName: variant.color.name,
      colorHex: variant.color.hexCode,
      unitPrice: finalPrice,
      maxStock: variant.availableStock,
      imageUrl: variant.imageUrl ?? images[0]?.url ?? null,
      quantity: 1,
    });
    trackAddToCart({
      id: variant.sku,
      name: product.name,
      variant: `${variant.color.name} / ${variant.size.name}`,
      price: finalPrice,
      quantity: 1,
    });
    setJustAdded(true);
  }

  useEffect(() => {
    if (!justAdded) return;
    const t = window.setTimeout(() => setJustAdded(false), 2400);
    return () => window.clearTimeout(t);
  }, [justAdded]);

  // Barra de compra fija en mobile: solo cuando el botón principal salió de pantalla
  const ctaRef = useRef<HTMLButtonElement>(null);
  const [ctaVisible, setCtaVisible] = useState(true);
  useEffect(() => {
    const el = ctaRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setCtaVisible(entry.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const soldOut = product.variants.every((v) => v.availableStock <= 0);
  const ctaLabel = justAdded
    ? "Agregado al carrito"
    : soldOut
      ? "Sin stock"
      : !sizeId
        ? "Elegí tu talle"
        : variant && variant.availableStock <= 0
          ? "Sin stock en este talle"
          : maxedOut
            ? "Máximo en el carrito"
            : "Agregar al carrito";

  const ctaDisabled = soldOut || (variant !== null && (variant.availableStock <= 0 || maxedOut));
  const lowStock = variant && variant.availableStock > 0 && variant.availableStock <= LOW_STOCK ? variant.availableStock : 0;

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:items-start lg:gap-14">
      <ProductGallery productId={product.id} images={images} badge={percentOff > 0 ? `−${percentOff}%` : null} />

      <div className="flex flex-col gap-6 lg:sticky lg:top-[104px]">
        <div className="flex flex-col gap-2.5">
          <p className="eyebrow text-chocolate">
            {product.collection ? `Colección ${product.collection.name}` : product.category.name}
          </p>
          <h1 className="display text-[clamp(40px,4.5vw,64px)] text-ink">{product.name}</h1>
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className={cn("tabular text-[26px] font-semibold", strikethrough && "text-brick")}>{formatARS(finalPrice)}</span>
            {strikethrough && <s className="tabular text-base text-stone-600">{formatARS(strikethrough)}</s>}
            {installments > 1 && (
              <span className="text-sm text-stone-700">
                {installments} cuotas sin interés de <span className="tabular">{formatARS(Math.ceil(finalPrice / installments))}</span>
              </span>
            )}
          </div>
          {transferDiscount > 0 && (
            <p className="text-sm text-stone-700">
              <span className="tabular font-semibold text-chocolate">{formatARS(Math.round(finalPrice * (1 - transferDiscount / 100)))}</span>{" "}
              pagando por transferencia ({transferDiscount}% off)
            </p>
          )}
        </div>

        {colors.length > 0 && (
          <fieldset className="flex flex-col gap-3">
            <legend className="mb-3 text-sm">
              <span className="font-semibold">Color:</span> {colorName}
            </legend>
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Color">
              {colors.map((color) => {
                const active = color.id === colorId;
                return (
                  <button
                    key={color.id}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    aria-label={color.name}
                    title={color.name}
                    onClick={() => selectColor(color.id)}
                    className={cn(
                      "pressable size-11 rounded-full border-2 p-[3px]",
                      active ? "border-chocolate" : "border-transparent hover:border-stone-300",
                    )}
                  >
                    <span className="block size-full rounded-full border border-ink/10" style={{ backgroundColor: color.hexCode }} />
                  </button>
                );
              })}
            </div>
          </fieldset>
        )}

        <fieldset className="flex flex-col gap-3">
          <legend className="mb-3 flex w-full items-center justify-between text-sm">
            <span>
              <span className="font-semibold">Talle:</span> {sizeName ?? "elegí uno"}
            </span>
            <a href="#guia-de-talles" className="inline-flex min-h-11 items-center gap-1.5 font-semibold text-chocolate underline underline-offset-4">
              <Ruler className="size-4" strokeWidth={1.8} aria-hidden="true" />
              Guía de talles
            </a>
          </legend>
          <div id="size-picker" tabIndex={-1} className="flex flex-wrap gap-2 outline-none" role="radiogroup" aria-label="Talle">
            {sizes.map((size) => {
              const stock = stockFor(size.id);
              const active = size.id === sizeId;
              return (
                <button
                  key={size.id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  disabled={stock <= 0}
                  aria-label={stock <= 0 ? `${size.name}, sin stock` : size.name}
                  onClick={() => {
                    setSizeId(size.id);
                    setError(null);
                    setJustAdded(false);
                  }}
                  className={cn(
                    "pressable h-12 min-w-14 rounded-full border px-4 text-sm font-semibold transition-colors duration-150",
                    active
                      ? "border-ink bg-ink text-paper"
                      : stock <= 0
                        ? "cursor-not-allowed border-stone-200 bg-stone-100 text-stone-500 line-through"
                        : "border-stone-300 bg-white text-ink hover:border-ink",
                  )}
                >
                  {size.name}
                </button>
              );
            })}
          </div>
          {lowStock > 0 && (
            <p className="text-[13px] font-semibold text-brick">
              {lowStock === 1 ? "Queda 1 unidad" : `Quedan ${lowStock} unidades`} en talle {sizeName}
            </p>
          )}
        </fieldset>

        <div className="flex flex-col gap-2.5">
          <button
            ref={ctaRef}
            type="button"
            onClick={add}
            disabled={ctaDisabled}
            className={buttonVariants({ variant: justAdded ? "success" : "primary", size: "lg", block: true })}
          >
            {justAdded && <Check className="size-[18px]" strokeWidth={2.2} aria-hidden="true" />}
            {ctaLabel}
          </button>
          <p role="status" aria-live="polite" className={cn("min-h-5 text-center text-[13px]", error ? "font-semibold text-brick" : "text-stone-600")}>
            {error ??
              (justAdded ? (
                <button type="button" onClick={() => useCartStore.getState().openCart()} className="pressable inline-flex h-9 items-center rounded-full border border-ink px-4 font-semibold text-ink hover:bg-ink hover:text-paper">
                  Ver carrito
                </button>
              ) : (
                "Envíos a todo el país · Pagá con Mercado Pago"
              ))}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2 text-[13px] text-stone-700">
          <div className="flex min-w-0 flex-col gap-1 bg-cream p-3">
            <span className="font-semibold text-ink">Envíos</span>
            <span>a todo el país</span>
          </div>
          <div className="flex min-w-0 flex-col gap-1 bg-cream p-3">
            <span className="font-semibold text-ink">Cambios</span>
            <span>30 días sin cargo</span>
          </div>
          <div className="flex min-w-0 flex-col gap-1 bg-cream p-3">
            <span className="font-semibold text-ink">Devolución</span>
            <span>10 días para arrepentirte</span>
          </div>
        </div>

        <div className="border-t border-stone-200">
          <details open className="group border-b border-stone-200">
            <summary className={summaryClass}>
              Descripción <span aria-hidden="true" className="text-lg group-open:hidden">+</span>
              <span aria-hidden="true" className="hidden text-lg group-open:inline">−</span>
            </summary>
            <p className="max-w-[65ch] pb-5 text-[15px] leading-relaxed whitespace-pre-line text-stone-700">{product.description}</p>
          </details>
          <details className="group border-b border-stone-200">
            <summary className={summaryClass}>
              Composición y cuidado <span aria-hidden="true" className="text-lg group-open:hidden">+</span>
              <span aria-hidden="true" className="hidden text-lg group-open:inline">−</span>
            </summary>
            <dl className="flex flex-col gap-3 pb-5 text-[15px] leading-relaxed text-stone-700">
              <div>
                <dt className="font-semibold text-ink">Composición</dt>
                <dd>{product.composition || "Géneros seleccionados, confeccionados en talleres de Buenos Aires."}</dd>
              </div>
              <div>
                <dt className="font-semibold text-ink">Cuidado</dt>
                <dd>{product.careGuide || "Lavar a mano con agua fría o limpieza en seco. No usar secadora. Planchar del revés a baja temperatura."}</dd>
              </div>
            </dl>
          </details>
          <details id="guia-de-talles" className="group scroll-mt-28 border-b border-stone-200">
            <summary className={summaryClass}>
              Guía de talles <span aria-hidden="true" className="text-lg group-open:hidden">+</span>
              <span aria-hidden="true" className="hidden text-lg group-open:inline">−</span>
            </summary>
            <div className="flex flex-col gap-3 pb-5 text-sm text-stone-700">
              <p>Medidas del cuerpo en centímetros.</p>
              <div className="overflow-x-auto">
                <table className="tabular w-full border-collapse text-left">
                  <thead>
                    <tr className="border-b border-stone-200 text-ink">
                      <th className="py-2 font-semibold">Talle</th>
                      <th className="py-2 font-semibold">Busto</th>
                      <th className="py-2 font-semibold">Cintura</th>
                      <th className="py-2 font-semibold">Cadera</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {REFERENCE_SIZE_TABLE.map((row) => (
                      <tr key={row.size}>
                        <td className="py-2 font-semibold text-ink">{row.size}</td>
                        <td className="py-2">{row.bust}</td>
                        <td className="py-2">{row.waist}</td>
                        <td className="py-2">{row.hip}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {product.sizeGuideUrl && (
                <a href={product.sizeGuideUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-chocolate underline underline-offset-4">
                  Ver ficha técnica completa
                </a>
              )}
            </div>
          </details>
          <details className="group border-b border-stone-200">
            <summary className={summaryClass}>
              Envíos y cambios <span aria-hidden="true" className="text-lg group-open:hidden">+</span>
              <span aria-hidden="true" className="hidden text-lg group-open:inline">−</span>
            </summary>
            <div className="flex flex-col gap-2.5 pb-5 text-[15px] leading-relaxed text-stone-700">
              <p>Despachamos a todo el país en 24 a 48 h hábiles desde que se acredita el pago.</p>
              <p>Tenés 30 días desde que recibís el pedido para cambiar talle o prenda, sin cargo en el primer cambio.</p>
            </div>
          </details>
        </div>
      </div>

      {/* Barra de compra fija de vidrio (mobile) */}
      <div
        className={cn(
          "glass-light fixed inset-x-3 z-40 flex items-center gap-3 rounded-[28px] py-2.5 pr-2.5 pl-[18px] shadow-[0_10px_30px_rgba(44,33,25,0.18)] transition-[opacity,transform] duration-200 ease-out lg:hidden",
          ctaVisible ? "pointer-events-none translate-y-4 opacity-0" : "translate-y-0 opacity-100",
        )}
        style={{ bottom: "max(12px, env(safe-area-inset-bottom, 0px))" }}
        aria-hidden={ctaVisible}
      >
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-[13px] font-semibold">
            {product.name}
            {sizeName ? ` · ${sizeName}` : ""}
          </span>
          <span className="tabular text-[15px] font-semibold">{formatARS(finalPrice)}</span>
        </div>
        <button
          type="button"
          tabIndex={ctaVisible ? -1 : 0}
          onClick={() => (sizeId ? add() : document.getElementById("size-picker")?.scrollIntoView({ behavior: "smooth", block: "center" }))}
          disabled={ctaDisabled}
          className={buttonVariants({ variant: justAdded ? "success" : "primary", size: "md", className: "h-[52px]" })}
        >
          {justAdded ? "Agregado" : sizeId ? "Agregar" : "Elegir talle"}
        </button>
      </div>
    </div>
  );
}
