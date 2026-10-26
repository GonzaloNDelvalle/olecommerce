"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import {
  Check,
  Ruler,
  Sparkles,
  ShieldCheck,
  ShoppingBag,
} from "lucide-react";
import type { ProductDetailDTO } from "@/modules/products/actions";
import { useCartStore } from "@/store/cart.store";

interface ProductVariantSelectorProps {
  product: ProductDetailDTO;
}

const arsFormatter = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

export function ProductVariantSelector({
  product,
}: ProductVariantSelectorProps) {
  const addItem = useCartStore((state) => state.addItem);
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

  // Helper para resolver la foto de un color con fallback a la galería general
  const resolveImageForSelection = (
    colorId: string | null,
    sizeId: string | null
  ): string | null => {
    const generalGalleryFallback = product.images[0]?.url ?? null;

    if (!colorId) return generalGalleryFallback;

    // Prioridad 1: Foto específica de la variante exacta (Color + Talle)
    if (sizeId) {
      const exactVariant = product.variants.find(
        (v) => v.color.id === colorId && v.size.id === sizeId && v.imageUrl
      );
      if (exactVariant?.imageUrl) {
        return exactVariant.imageUrl;
      }
    }

    // Prioridad 2: Foto específica asignada a cualquier variante de ese Color
    const anyVariantWithColorImage = product.variants.find(
      (v) => v.color.id === colorId && v.imageUrl
    );
    if (anyVariantWithColorImage?.imageUrl) {
      return anyVariantWithColorImage.imageUrl;
    }

    // Prioridad 3: Imagen de galería etiquetada con ese colorId
    const galleryColorImage = product.images.find(
      (img) => img.colorId === colorId
    );
    if (galleryColorImage?.url) {
      return galleryColorImage.url;
    }

    // Fallback: Primera imagen de la galería general del producto
    return generalGalleryFallback;
  };

  // Variante inicial por defecto (la primera con stock disponible, o la primera de la matriz)
  const defaultVariant =
    product.variants.find((v) => v.availableStock > 0) ?? product.variants[0];

  const [selectedColorId, setSelectedColorId] = useState<string | null>(
    defaultVariant?.color.id ?? null
  );
  const [selectedSizeId, setSelectedSizeId] = useState<string | null>(
    defaultVariant?.size.id ?? null
  );
  const [activeImageUrl, setActiveImageUrl] = useState<string | null>(() =>
    resolveImageForSelection(
      defaultVariant?.color.id ?? null,
      defaultVariant?.size.id ?? null
    )
  );
  const [validationError, setValidationError] = useState<string | null>(null);

  // Consolidar miniaturas (galería general + fotos específicas de variantes sin duplicados)
  const galleryThumbnails = useMemo(() => {
    const seenUrls = new Set<string>();
    const items: { url: string; label: string }[] = [];

    for (const img of product.images) {
      if (img.url && !seenUrls.has(img.url)) {
        seenUrls.add(img.url);
        items.push({
          url: img.url,
          label: img.altText ?? product.name,
        });
      }
    }

    for (const variant of product.variants) {
      if (variant.imageUrl && !seenUrls.has(variant.imageUrl)) {
        seenUrls.add(variant.imageUrl);
        items.push({
          url: variant.imageUrl,
          label: `${product.name} - ${variant.color.name}`,
        });
      }
    }

    return items;
  }, [product.images, product.variants, product.name]);

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

  // Al hacer clic en un color de la matriz: actualiza color, ajusta talle si es necesario e intercambia la foto principal con fallback a galería general
  function handleColorSelect(colorId: string) {
    setSelectedColorId(colorId);
    setValidationError(null);

    let nextSizeId = selectedSizeId;
    const existsCurrentSizeForColor = product.variants.some(
      (v) => v.color.id === colorId && v.size.id === selectedSizeId
    );
    if (!existsCurrentSizeForColor) {
      const firstVariantForColor = product.variants.find(
        (v) => v.color.id === colorId
      );
      if (firstVariantForColor) {
        nextSizeId = firstVariantForColor.size.id;
        setSelectedSizeId(nextSizeId);
      }
    }

    const nextImage = resolveImageForSelection(colorId, nextSizeId);
    setActiveImageUrl(nextImage);
  }

  function handleSizeSelect(sizeId: string) {
    setSelectedSizeId(sizeId);
    setValidationError(null);

    // Si la variante de ese talle tiene una foto específica, la mostramos; sino mantenemos la del color o galería
    const exactVariant = product.variants.find(
      (v) => v.color.id === selectedColorId && v.size.id === sizeId
    );
    if (exactVariant?.imageUrl) {
      setActiveImageUrl(exactVariant.imageUrl);
    }
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

  const selectedColorName = uniqueColors.find(
    (c) => c.id === selectedColorId
  )?.name;
  const selectedSizeName = uniqueSizes.find(
    (s) => s.id === selectedSizeId
  )?.name;

  function handleAddToCart() {
    if (!selectedColorId || !selectedSizeId) {
      setValidationError(
        "Por favor, seleccioná un color y un talle antes de agregar al carrito."
      );
      return;
    }

    if (!activeVariant || activeVariant.availableStock <= 0) {
      setValidationError(
        "La combinación seleccionada no se encuentra disponible en stock."
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
      activeVariant.imageUrl ??
      activeImageUrl ??
      product.images[0]?.url ??
      null;

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
  }

  const canAddToCart =
    Boolean(selectedColorId) &&
    Boolean(selectedSizeId) &&
    activeVariant !== null &&
    activeVariant.availableStock > 0 &&
    !reachedMaxStock;

  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-12">
      {/* COLUMNA IZQUIERDA: Galería Interactiva de Imágenes (7 columnas en desktop) */}
      <div className="flex flex-col-reverse gap-4 sm:flex-row lg:col-span-7">
        {/* Miniaturas de Galería General + Fotos de Variantes */}
        {galleryThumbnails.length > 1 && (
          <div className="flex gap-3 overflow-x-auto sm:flex-col sm:overflow-y-auto">
            {galleryThumbnails.map((thumb, idx) => {
              const isSelected = thumb.url === activeImageUrl;
              return (
                <button
                  key={`${thumb.url}-${idx}`}
                  type="button"
                  onClick={() => setActiveImageUrl(thumb.url)}
                  className={`relative h-24 w-20 shrink-0 overflow-hidden rounded-lg border-2 transition-all ${
                    isSelected
                      ? "border-stone-900 ring-1 ring-stone-900"
                      : "border-transparent opacity-70 hover:opacity-100"
                  }`}
                >
                  <Image
                    src={thumb.url}
                    alt={thumb.label}
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                </button>
              );
            })}
          </div>
        )}

        {/* Foto Principal Dinámica */}
        <div className="relative aspect-[3/4] w-full flex-1 overflow-hidden rounded-2xl bg-stone-100">
          {activeImageUrl ? (
            <Image
              key={activeImageUrl}
              src={activeImageUrl}
              alt={`${product.name} - ${selectedColorName ?? ""}`}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 58vw"
              className="object-cover object-center transition-all duration-300"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm tracking-widest text-stone-400 uppercase">
              Sin imagen disponible
            </div>
          )}

          {/* Badge de Descuento sobre la foto principal */}
          {product.discountPercentage > 0 && (
            <span className="absolute top-4 left-4 rounded-md bg-stone-900 px-3 py-1.5 text-xs font-bold tracking-wider text-white uppercase shadow-sm">
              -{product.discountPercentage}% OFF
            </span>
          )}
        </div>
      </div>

      {/* COLUMNA DERECHA: Ficha Comercial y Matriz de Variantes (5 columnas en desktop) */}
      <div className="flex flex-col lg:col-span-5">
        {/* Categoría y Colección */}
        <div className="flex items-center gap-2 text-xs font-medium tracking-widest text-stone-500 uppercase">
          <span>{product.category.name}</span>
          {product.collection && (
            <>
              <span>•</span>
              <span>{product.collection.name}</span>
            </>
          )}
        </div>

        {/* Nombre de la Prenda */}
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-stone-900 sm:text-3xl">
          {product.name}
        </h1>

        {/* Bloque de Precio y Precio Tachado */}
        <div className="mt-4 flex flex-wrap items-baseline gap-3">
          <span className="text-2xl font-bold text-stone-900">
            {arsFormatter.format(finalPrice)}
          </span>
          {strikethroughPrice !== null && (
            <span className="text-base font-medium text-stone-400 line-through">
              {arsFormatter.format(strikethroughPrice)}
            </span>
          )}
          {product.discountPercentage > 0 && (
            <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
              Ahorrás {product.discountPercentage}%
            </span>
          )}
        </div>

        {/* Descripción Comercial */}
        <p className="mt-5 text-sm leading-relaxed text-stone-600">
          {product.description}
        </p>

        <hr className="my-6 border-stone-200" />

        {/* 1. SELECTOR VISUAL DE COLOR (Intercambia foto principal con fallback) */}
        <div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold tracking-wider text-stone-900 uppercase">
              Color:{" "}
              <span className="font-normal text-stone-600">
                {selectedColorName ?? "Seleccionar"}
              </span>
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
                  className={`group relative flex h-9 w-9 items-center justify-center rounded-full border transition-all ${
                    isSelected
                      ? "border-stone-900 ring-2 ring-stone-900 ring-offset-2"
                      : "border-stone-300 hover:scale-105"
                  }`}
                  style={{ backgroundColor: color.hexCode }}
                >
                  {isSelected && (
                    <Check
                      className={`h-4 w-4 ${
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

        {/* 2. SELECTOR VISUAL DE TALLE */}
        <div className="mt-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold tracking-wider text-stone-900 uppercase">
              Talle:{" "}
              <span className="font-normal text-stone-600">
                {selectedSizeName ?? "Seleccionar"}
              </span>
            </span>

            {product.sizeGuideUrl && (
              <a
                href={product.sizeGuideUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-stone-600 underline underline-offset-4 hover:text-stone-900"
              >
                <Ruler className="h-3.5 w-3.5" />
                Guía de talles
              </a>
            )}
          </div>

          <div className="mt-3 grid grid-cols-4 gap-2.5 sm:grid-cols-6">
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
                  className={`relative flex h-11 items-center justify-center rounded-md border text-sm font-medium transition-all ${
                    isSelected
                      ? "border-stone-900 bg-stone-900 text-white"
                      : isAvailable
                        ? "border-stone-300 bg-white text-stone-900 hover:border-stone-900"
                        : "border-stone-200 bg-stone-50 text-stone-400 line-through"
                  }`}
                >
                  {size.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* ESTADO DE DISPONIBILIDAD Y SKU DE LA VARIANTE SELECCIONADA */}
        <div className="mt-6 rounded-lg border border-stone-200 bg-stone-50 p-4">
          {activeVariant ? (
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span
                  className={`h-2 w-2 rounded-full ${
                    activeVariant.availableStock > 0
                      ? "bg-emerald-600"
                      : "bg-red-500"
                  }`}
                />
                <span className="font-medium text-stone-800">
                  {activeVariant.availableStock > 0
                    ? `Stock disponible (${activeVariant.availableStock} u.)`
                    : "Agotado en esta combinación"}
                </span>
              </div>
              <span className="font-mono text-stone-500">
                SKU: {activeVariant.sku}
              </span>
            </div>
          ) : (
            <p className="text-xs text-amber-700">
              La combinación de color <strong>{selectedColorName}</strong> y
              talle <strong>{selectedSizeName}</strong> no está disponible en
              este modelo.
            </p>
          )}
        </div>

        {/* MENSAJE DE ERROR DE VALIDACIÓN SI CORRESPONDE */}
        {validationError && (
          <p className="mt-3 text-xs font-medium text-red-600">
            {validationError}
          </p>
        )}

        {/* BOTÓN AGREGAR AL CARRITO */}
        <div className="mt-6">
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={!canAddToCart}
            className="flex w-full items-center justify-center gap-2.5 rounded-lg bg-stone-900 px-6 py-4 text-sm font-semibold tracking-wider text-white uppercase transition-all hover:bg-stone-800 active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-stone-300 disabled:text-stone-500"
          >
            <ShoppingBag className="h-4 w-4" />
            {!selectedColorId || !selectedSizeId
              ? "Seleccioná Talle y Color"
              : !activeVariant || activeVariant.availableStock <= 0
                ? "Sin Stock en esta Combinación"
                : reachedMaxStock
                  ? "Stock Máximo en el Carrito"
                  : "Agregar al Carrito"}
          </button>
        </div>

        {/* DETALLES TÉCNICOS DE LA PRENDA (Composición y Cuidados) */}
        <div className="mt-8 space-y-4 border-t border-stone-200 pt-6 text-xs text-stone-600">
          {product.composition && (
            <div className="flex items-start gap-3">
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-stone-900" />
              <div>
                <p className="font-semibold text-stone-900 uppercase">
                  Composición textil
                </p>
                <p className="mt-0.5">{product.composition}</p>
              </div>
            </div>
          )}

          {product.careGuide && (
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-stone-900" />
              <div>
                <p className="font-semibold text-stone-900 uppercase">
                  Cuidados de la prenda
                </p>
                <p className="mt-0.5 leading-relaxed">{product.careGuide}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
