"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Plus, Minus, Ruler } from "lucide-react";
import type { ProductDetailDTO } from "@/modules/products/actions";
import { useCartStore } from "@/store/cart.store";

interface ProductVariantSelectorProps {
  product: ProductDetailDTO;
}

type AccordionSectionId = "composicion" | "talles" | "envios";

const arsFormatter = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

const REFERENCE_SIZE_TABLE = [
  { size: "XS", bust: "82 – 85", waist: "62 – 65", hip: "88 – 91" },
  { size: "S", bust: "86 – 89", waist: "66 – 69", hip: "92 – 95" },
  { size: "M", bust: "90 – 94", waist: "70 – 74", hip: "96 – 100" },
  { size: "L", bust: "95 – 99", waist: "75 – 79", hip: "101 – 105" },
  { size: "XL", bust: "100 – 105", waist: "80 – 85", hip: "106 – 111" },
];

export function ProductVariantSelector({
  product,
}: ProductVariantSelectorProps) {
  const addItem = useCartStore((state) => state.addItem);
  const openCart = useCartStore((state) => state.openCart);
  const cartItems = useCartStore((state) => state.items);

  // 1. Extraer colores únicos presentes en la matriz de variantes
  const uniqueColors = useMemo(() => {
    const map = new Map<
      string,
      { id: string; name: string; hexCode: string }
    >();
    for (const v of product.variants) {
      if (!map.has(v.color.id)) {
        map.set(v.color.id, v.color);
      }
    }
    return Array.from(map.values());
  }, [product.variants]);

  // 2. Extraer talles únicos ordenados por sortOrder (XS -> S -> M -> L -> XL)
  const uniqueSizes = useMemo(() => {
    const map = new Map<
      string,
      { id: string; name: string; sortOrder: number }
    >();
    for (const v of product.variants) {
      if (!map.has(v.size.id)) {
        map.set(v.size.id, v.size);
      }
    }
    return Array.from(map.values()).sort((a, b) => a.sortOrder - b.sortOrder);
  }, [product.variants]);

  // Variante inicial por defecto (la primera con stock disponible, o la primera de la matriz)
  const defaultVariant =
    product.variants.find((v) => v.availableStock > 0) ?? product.variants[0];

  const [selectedColorId, setSelectedColorId] = useState<string | null>(
    defaultVariant?.color.id ?? null
  );
  const [selectedSizeId, setSelectedSizeId] = useState<string | null>(
    defaultVariant?.size.id ?? null
  );
  const [validationError, setValidationError] = useState<string | null>(null);
  const [openAccordion, setOpenAccordion] = useState<AccordionSectionId | null>(
    "composicion"
  );

  function toggleAccordion(sectionId: AccordionSectionId) {
    setOpenAccordion((prev) => (prev === sectionId ? null : sectionId));
  }

  // Construir la secuencia de imágenes "Lookbook" apiladas verticalmente
  const lookbookImages = useMemo(() => {
    const seenUrls = new Set<string>();
    const list: { url: string; alt: string }[] = [];

    if (selectedColorId) {
      const exactVariant = product.variants.find(
        (v) =>
          v.color.id === selectedColorId &&
          v.size.id === selectedSizeId &&
          v.imageUrl
      );
      const anyColorVariant = product.variants.find(
        (v) => v.color.id === selectedColorId && v.imageUrl
      );
      const colorImageUrl =
        exactVariant?.imageUrl ?? anyColorVariant?.imageUrl ?? null;

      if (colorImageUrl && !seenUrls.has(colorImageUrl)) {
        seenUrls.add(colorImageUrl);
        list.push({
          url: colorImageUrl,
          alt: `${product.name} — Vista Principal`,
        });
      }
    }

    for (const img of product.images) {
      if (img.url && !seenUrls.has(img.url)) {
        seenUrls.add(img.url);
        list.push({
          url: img.url,
          alt: img.altText ?? product.name,
        });
      }
    }

    for (const variant of product.variants) {
      if (variant.imageUrl && !seenUrls.has(variant.imageUrl)) {
        seenUrls.add(variant.imageUrl);
        list.push({
          url: variant.imageUrl,
          alt: `${product.name} — ${variant.color.name}`,
        });
      }
    }

    return list;
  }, [
    product.images,
    product.variants,
    product.name,
    selectedColorId,
    selectedSizeId,
  ]);

  // Variante exacta que coincide con el Color y Talle seleccionados
  const activeVariant = useMemo(() => {
    if (!selectedColorId || !selectedSizeId) return null;
    return (
      product.variants.find(
        (v) => v.color.id === selectedColorId && v.size.id === selectedSizeId
      ) ?? null
    );
  }, [product.variants, selectedColorId, selectedSizeId]);

  // Cantidad ya presente en el carrito para esta variante
  const quantityInCart = useMemo(() => {
    if (!activeVariant) return 0;
    return (
      cartItems.find((item) => item.variantId === activeVariant.id)?.quantity ??
      0
    );
  }, [cartItems, activeVariant]);

  const reachedMaxStock =
    activeVariant !== null && quantityInCart >= activeVariant.availableStock;

  function handleColorSelect(colorId: string) {
    setSelectedColorId(colorId);
    setValidationError(null);

    const existsCurrentSizeForColor = product.variants.some(
      (v) => v.color.id === colorId && v.size.id === selectedSizeId
    );
    if (!existsCurrentSizeForColor) {
      const firstVariantForColor = product.variants.find(
        (v) => v.color.id === colorId
      );
      if (firstVariantForColor) {
        setSelectedSizeId(firstVariantForColor.size.id);
      }
    }
  }

  function handleSizeSelect(sizeId: string) {
    setSelectedSizeId(sizeId);
    setValidationError(null);
  }

  // Cálculo de precio contemplando discountPercentage y compareAtPrice
  const baseUnitPrice = activeVariant?.priceOverride ?? product.basePrice;
  const hasExplicitDiscount = product.discountPercentage > 0;
  const finalPrice = hasExplicitDiscount
    ? Math.round(baseUnitPrice * (1 - product.discountPercentage / 100))
    : baseUnitPrice;

  const strikethroughPrice = hasExplicitDiscount
    ? baseUnitPrice
    : product.compareAtPrice !== null && product.compareAtPrice > finalPrice
      ? product.compareAtPrice
      : null;

  const transferPrice = Math.round(finalPrice * 0.85);

  const selectedColorName = uniqueColors.find(
    (c) => c.id === selectedColorId
  )?.name;
  const selectedSizeName = uniqueSizes.find(
    (s) => s.id === selectedSizeId
  )?.name;

  function handleAddToCart() {
    if (!selectedColorId || !selectedSizeId) {
      setValidationError(
        "Por favor, seleccioná un talle antes de agregar al carrito."
      );
      return;
    }

    if (!activeVariant || activeVariant.availableStock <= 0) {
      setValidationError(
        "El talle seleccionado no se encuentra disponible en stock."
      );
      return;
    }

    if (reachedMaxStock) {
      setValidationError(
        `Ya tenés el máximo de stock disponible (${activeVariant.availableStock} u.) en tu carrito.`
      );
      return;
    }

    setValidationError(null);

    const itemImageUrl =
      activeVariant.imageUrl ?? lookbookImages[0]?.url ?? null;

    addItem({
      variantId: activeVariant.id,
      productId: product.id,
      productName: product.name,
      productSlug: product.slug,
      sku: activeVariant.sku,
      sizeName: activeVariant.size.name,
      colorName: activeVariant.color.name,
      colorHex: activeVariant.color.hexCode,
      unitPrice: finalPrice,
      maxStock: activeVariant.availableStock,
      imageUrl: itemImageUrl,
      quantity: 1,
    });
    openCart();
  }

  const canAddToCart =
    Boolean(selectedColorId) &&
    Boolean(selectedSizeId) &&
    activeVariant !== null &&
    activeVariant.availableStock > 0 &&
    !reachedMaxStock;

  return (
    <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:items-start lg:gap-16 xl:gap-20">
      {/* COLUMNA IZQUIERDA: Galería Editorial Lookbook Apilada Verticalmente (7 columnas) */}
      <div className="space-y-4 sm:space-y-6 lg:col-span-7">
        {lookbookImages.length > 0 ? (
          lookbookImages.map((image, idx) => (
            <div
              key={`${image.url}-${idx}`}
              className="relative aspect-[3/4] w-full overflow-hidden rounded-none bg-stone-100"
            >
              <Image
                src={image.url}
                alt={image.alt}
                fill
                priority={idx === 0}
                sizes="(max-width: 1024px) 100vw, 58vw"
                className="h-full w-full rounded-none object-cover object-center"
              />

              {idx === 0 && product.discountPercentage > 0 && (
                <span className="absolute top-4 left-4 rounded-none bg-stone-900 px-3 py-1.5 text-[10px] font-medium tracking-[0.2em] text-white uppercase">
                  -{product.discountPercentage}% OFF
                </span>
              )}
            </div>
          ))
        ) : (
          <div className="flex aspect-[3/4] w-full items-center justify-center rounded-none border border-stone-200 bg-stone-50 text-xs tracking-[0.25em] text-stone-400 uppercase">
            Sin imagen disponible
          </div>
        )}
      </div>

      {/* COLUMNA DERECHA: Información de Compra Fija / Sticky (5 columnas) */}
      <div className="h-fit lg:sticky lg:top-28 lg:col-span-5">
        <div className="rounded-none bg-white lg:pl-2">
          {/* Eyebrow: Categoría y Colección */}
          <div className="flex flex-wrap items-center gap-2 text-xs tracking-[0.2em] text-stone-500 uppercase">
            <span>{product.category.name}</span>
            {product.collection && (
              <>
                <span className="text-stone-300">/</span>
                <span>{product.collection.name}</span>
              </>
            )}
          </div>

          {/* Nombre de la Prenda en Serif Editorial */}
          <h1 className="mt-3 font-serif text-3xl font-normal tracking-[0.04em] text-stone-900 uppercase sm:text-4xl">
            {product.name}
          </h1>

          {/* Precio en font-sans font-light text-xl + Descuento por Transferencia */}
          <div className="mt-4 border-b border-stone-200 pb-6">
            <div className="flex flex-wrap items-baseline gap-3">
              <span className="font-sans text-xl font-light tracking-wide text-stone-900">
                {arsFormatter.format(finalPrice)}
              </span>
              {strikethroughPrice !== null && (
                <span className="font-sans text-sm font-light text-stone-400 line-through">
                  {arsFormatter.format(strikethroughPrice)}
                </span>
              )}
            </div>
            <p className="mt-2 text-[11px] font-light tracking-wide text-stone-500">
              <span className="font-medium text-[#5C4033]">
                {arsFormatter.format(transferPrice)}
              </span>{" "}
              abonando por Transferencia Bancaria (-15% OFF)
            </p>
          </div>

          {/* Descripción Editorial */}
          <p className="mt-6 text-xs leading-relaxed font-light tracking-wide text-stone-600 sm:text-sm">
            {product.description}
          </p>

          {/* 1. Selector de Color */}
          {uniqueColors.length > 0 && (
            <div className="mt-8">
              <div className="flex items-center justify-between text-[11px] tracking-[0.2em] uppercase">
                <span className="font-medium text-stone-900">Color</span>
                <span className="font-light text-stone-500">
                  {selectedColorName ?? "Seleccionar"}
                </span>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-3">
                {uniqueColors.map((color) => {
                  const isSelected = color.id === selectedColorId;
                  return (
                    <button
                      key={color.id}
                      type="button"
                      onClick={() => handleColorSelect(color.id)}
                      title={color.name}
                      aria-label={`Seleccionar color ${color.name}`}
                      className={`relative flex h-8 w-8 items-center justify-center rounded-none border transition-all ${
                        isSelected
                          ? "border-stone-900 ring-1 ring-stone-900 ring-offset-2"
                          : "border-stone-300 hover:border-stone-900"
                      }`}
                      style={{ backgroundColor: color.hexCode }}
                    >
                      {isSelected && (
                        <Check
                          className={`h-3.5 w-3.5 ${
                            color.hexCode.toUpperCase() === "#FAF8F5" ||
                            color.hexCode.toUpperCase() === "#FAF9F6" ||
                            color.hexCode.toUpperCase() === "#FFFFFF"
                              ? "text-stone-900"
                              : "text-white"
                          }`}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 2. Selector Visual de Talles y Stock (Botones cuadrados rounded-none) */}
          <div className="mt-8">
            <div className="flex items-center justify-between text-[11px] tracking-[0.2em] uppercase">
              <span className="font-medium text-stone-900">
                Talle:{" "}
                <span className="font-light text-stone-500">
                  {selectedSizeName ?? "Seleccionar"}
                </span>
              </span>

              <button
                type="button"
                onClick={() => setOpenAccordion("talles")}
                className="inline-flex items-center gap-1.5 text-[10px] font-light tracking-[0.18em] text-stone-500 uppercase underline underline-offset-4 transition-colors hover:text-stone-900"
              >
                <Ruler className="h-3 w-3" strokeWidth={1.4} />
                Medidas
              </button>
            </div>

            <div className="mt-3 grid grid-cols-4 gap-2.5 sm:grid-cols-5">
              {uniqueSizes.map((size) => {
                const variantForCombination = product.variants.find(
                  (v) =>
                    v.color.id === selectedColorId && v.size.id === size.id
                );
                const isAvailable =
                  variantForCombination !== undefined &&
                  variantForCombination.availableStock > 0;
                const isSelected = size.id === selectedSizeId;

                return (
                  <button
                    key={size.id}
                    type="button"
                    onClick={() => handleSizeSelect(size.id)}
                    className={`flex h-12 w-full items-center justify-center rounded-none border text-xs tracking-[0.16em] uppercase transition-colors ${
                      isSelected
                        ? "border-stone-900 bg-stone-900 font-medium text-white"
                        : isAvailable
                          ? "border-stone-200 bg-white font-normal text-stone-900 hover:border-stone-900"
                          : "border-stone-200 bg-stone-50 font-light text-stone-400 line-through opacity-50"
                    }`}
                  >
                    {size.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Indicador sutil de stock y SKU */}
          {activeVariant && (
            <div className="mt-4 flex items-center justify-between text-[11px] font-light text-stone-500">
              <span>
                {activeVariant.availableStock > 0
                  ? `Disponible en stock (${activeVariant.availableStock} u.)`
                  : "Agotado en este talle"}
              </span>
              <span className="font-mono text-[10px] text-stone-400">
                SKU {activeVariant.sku}
              </span>
            </div>
          )}

          {validationError && (
            <p className="mt-3 text-xs font-normal text-red-600">
              {validationError}
            </p>
          )}

          {/* 3. Botón de Compra Minimalista de Ancho Completo */}
          <div className="mt-7">
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={!canAddToCart}
              className="flex h-12 w-full items-center justify-center rounded-none bg-stone-900 px-6 text-xs font-medium tracking-[0.2em] text-white uppercase transition-colors hover:bg-stone-800 disabled:cursor-not-allowed disabled:bg-stone-200 disabled:text-stone-400"
            >
              {!selectedColorId || !selectedSizeId
                ? "SELECCIONÁ UN TALLE"
                : !activeVariant || activeVariant.availableStock <= 0
                  ? "SIN STOCK"
                  : reachedMaxStock
                    ? "STOCK MÁXIMO EN CARRITO"
                    : "AGREGAR AL CARRITO"}
            </button>
          </div>

          {/* 4. Acordeones de Información (Disclosure separados por border-b border-stone-200) */}
          <div className="mt-10 border-t border-stone-200">
            {/* Acordeón 1: Composición y Calce */}
            <div className="border-b border-stone-200">
              <button
                type="button"
                onClick={() => toggleAccordion("composicion")}
                aria-expanded={openAccordion === "composicion"}
                className="flex w-full items-center justify-between py-4 text-left text-[11px] font-normal tracking-[0.2em] text-stone-900 uppercase transition-colors hover:text-[#5C4033]"
              >
                <span>Composición y Calce</span>
                {openAccordion === "composicion" ? (
                  <Minus className="h-3.5 w-3.5 text-stone-500" strokeWidth={1.5} />
                ) : (
                  <Plus className="h-3.5 w-3.5 text-stone-500" strokeWidth={1.5} />
                )}
              </button>

              <AnimatePresence initial={false}>
                {openAccordion === "composicion" && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="space-y-3 pb-5 text-xs font-light leading-relaxed text-stone-600">
                      <div>
                        <p className="text-[10px] font-medium tracking-[0.18em] text-stone-900 uppercase">
                          Materia Prima
                        </p>
                        <p className="mt-1">
                          {product.composition ||
                            "Géneros seleccionados de primera calidad. Confeccionado en talleres especializados de Buenos Aires."}
                        </p>
                      </div>

                      <div>
                        <p className="text-[10px] font-medium tracking-[0.18em] text-stone-900 uppercase">
                          Cuidado de la Prenda
                        </p>
                        <p className="mt-1">
                          {product.careGuide ||
                            "Lavar a mano con agua fría o limpieza en seco profesional. No usar secadora. Planchar a baja temperatura del revés."}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Acordeón 2: Guía de Talles */}
            <div className="border-b border-stone-200">
              <button
                type="button"
                onClick={() => toggleAccordion("talles")}
                aria-expanded={openAccordion === "talles"}
                className="flex w-full items-center justify-between py-4 text-left text-[11px] font-normal tracking-[0.2em] text-stone-900 uppercase transition-colors hover:text-[#5C4033]"
              >
                <span>Guía de Talles</span>
                {openAccordion === "talles" ? (
                  <Minus className="h-3.5 w-3.5 text-stone-500" strokeWidth={1.5} />
                ) : (
                  <Plus className="h-3.5 w-3.5 text-stone-500" strokeWidth={1.5} />
                )}
              </button>

              <AnimatePresence initial={false}>
                {openAccordion === "talles" && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="space-y-3 pb-5 text-xs font-light text-stone-600">
                      <p className="text-[11px] text-stone-500">
                        Medidas corporales orientativas expresadas en centímetros
                        (cm):
                      </p>

                      <table className="w-full border-collapse text-left text-[11px]">
                        <thead>
                          <tr className="border-b border-stone-200 text-[10px] font-medium tracking-[0.16em] text-stone-900 uppercase">
                            <th className="py-2">Talle</th>
                            <th className="py-2">Busto</th>
                            <th className="py-2">Cintura</th>
                            <th className="py-2">Cadera</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100">
                          {REFERENCE_SIZE_TABLE.map((row) => (
                            <tr key={row.size}>
                              <td className="py-2 font-medium text-stone-900">
                                {row.size}
                              </td>
                              <td className="py-2">{row.bust}</td>
                              <td className="py-2">{row.waist}</td>
                              <td className="py-2">{row.hip}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      {product.sizeGuideUrl && (
                        <div className="pt-1">
                          <a
                            href={product.sizeGuideUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-[10px] font-medium tracking-[0.18em] text-stone-900 uppercase underline underline-offset-4 hover:text-[#5C4033]"
                          >
                            <Ruler className="h-3 w-3" />
                            Ver ficha técnica completa
                          </a>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Acordeón 3: Envíos y Devoluciones */}
            <div className="border-b border-stone-200">
              <button
                type="button"
                onClick={() => toggleAccordion("envios")}
                aria-expanded={openAccordion === "envios"}
                className="flex w-full items-center justify-between py-4 text-left text-[11px] font-normal tracking-[0.2em] text-stone-900 uppercase transition-colors hover:text-[#5C4033]"
              >
                <span>Envíos y Devoluciones</span>
                {openAccordion === "envios" ? (
                  <Minus className="h-3.5 w-3.5 text-stone-500" strokeWidth={1.5} />
                ) : (
                  <Plus className="h-3.5 w-3.5 text-stone-500" strokeWidth={1.5} />
                )}
              </button>

              <AnimatePresence initial={false}>
                {openAccordion === "envios" && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="space-y-2.5 pb-5 text-xs font-light leading-relaxed text-stone-600">
                      <p>
                        <strong className="font-medium text-stone-900">
                          Despacho y Packaging:
                        </strong>{" "}
                        Todas las prendas de OL. se entregan en packaging de
                        autor libre de plásticos, despachadas a todo el país en
                        24 a 48 hs hábiles una vez acreditado el pago.
                      </p>
                      <p>
                        <strong className="font-medium text-stone-900">
                          Cambios y Devoluciones:
                        </strong>{" "}
                        Disponés de 30 días corridos desde la recepción del
                        pedido para gestionar cambios de talle o prenda sin
                        cargo adicional en tu primer cambio.
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
