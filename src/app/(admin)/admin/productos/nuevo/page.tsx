"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Wand2,
  ImageIcon,
  Percent,
  Scale,
} from "lucide-react";
import {
  createProductFormSchema,
  type CreateProductFormValues,
} from "@/modules/admin/schemas/product-form.schema";
import {
  createAdminProduct,
  getAdminProductFormCatalogs,
  type AdminProductFormCatalogsDTO,
} from "@/modules/admin/actions/admin-products.actions";

function NewProductForm() {
  const router = useRouter();
  const [catalogs, setCatalogs] = useState<AdminProductFormCatalogsDTO | null>(
    null
  );
  const [loadingCatalogs, setLoadingCatalogs] = useState(true);
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreateProductFormValues>({
    resolver: zodResolver(createProductFormSchema),
    defaultValues: {
      name: "",
      description: "",
      basePrice: 0,
      compareAtPrice: null,
      discountPercentage: 0,
      weightInGrams: 350,
      categoryId: "",
      collectionId: "",
      status: "ACTIVE",
      composition: "",
      careGuide: "",
      galleryUrls: [{ url: "" }],
      variants: [
        {
          sizeId: "",
          colorId: "",
          sku: "",
          stock: 10,
          imageUrl: "",
        },
      ],
    },
  });

  const {
    fields: galleryFields,
    append: appendGalleryUrl,
    remove: removeGalleryUrl,
  } = useFieldArray({
    control,
    name: "galleryUrls",
  });

  const {
    fields: variantFields,
    append: appendVariant,
    remove: removeVariant,
  } = useFieldArray({
    control,
    name: "variants",
  });

  const watchedName = watch("name");
  const watchedVariants = watch("variants");
  const watchedBasePrice = watch("basePrice");
  const watchedDiscount = watch("discountPercentage");

  useEffect(() => {
    let active = true;
    getAdminProductFormCatalogs()
      .then((data) => {
        if (!active) return;
        setCatalogs(data);

        if (data.categories[0]) {
          setValue("categoryId", data.categories[0].id);
        }
        if (data.collections[0]) {
          setValue("collectionId", data.collections[0].id);
        }
        if (data.sizes[0] && data.colors[0]) {
          setValue("variants.0.sizeId", data.sizes[0].id);
          setValue("variants.0.colorId", data.colors[0].id);
        }
      })
      .finally(() => {
        if (active) setLoadingCatalogs(false);
      });

    return () => {
      active = false;
    };
  }, [setValue]);

  /**
   * Genera un código SKU sugerido en base al nombre de la prenda, color y talle de la fila.
   */
  function generateSuggestedSku(index: number) {
    if (!catalogs) return;
    const row = watchedVariants?.[index];
    if (!row) return;

    const sizeObj = catalogs.sizes.find((s) => s.id === row.sizeId);
    const colorObj = catalogs.colors.find((c) => c.id === row.colorId);

    const namePart = (watchedName || "PRD")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9\s]/g, "")
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w.slice(0, 3).toUpperCase())
      .join("-");

    const colorPart = (colorObj?.name || "COL")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .slice(0, 3)
      .toUpperCase();

    const sizePart = (sizeObj?.name || "U").toUpperCase();

    const suggested = `${namePart || "PRD"}-${colorPart}-${sizePart}`;
    setValue(`variants.${index}.sku`, suggested, { shouldValidate: true });
  }

  async function onSubmit(values: CreateProductFormValues) {
    setServerError(null);
    setSuccessMessage(null);

    const response = await createAdminProduct(values);

    if (!response.success) {
      setServerError(response.error);
      return;
    }

    setSuccessMessage("¡Producto, galería y variantes creados con éxito!");
    router.push("/admin/productos");
    router.refresh();
  }

  if (loadingCatalogs) {
    return <div className="h-96 animate-pulse rounded-xl bg-stone-200/70" />;
  }

  const effectivePreviewPrice =
    watchedBasePrice > 0 && watchedDiscount > 0
      ? Math.round(watchedBasePrice * (1 - watchedDiscount / 100))
      : null;

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-8">
      {serverError && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
          <p>{serverError}</p>
        </div>
      )}

      {successMessage && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
          <p>{successMessage}</p>
        </div>
      )}

      {/* SECCIÓN 1: Datos Base, Descuento y Logística */}
      <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-2xs sm:p-8">
        <h2 className="text-sm font-semibold tracking-wider text-stone-900 uppercase">
          1. Información General, Precio y Logística
        </h2>

        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-6">
          <div className="sm:col-span-4">
            <label
              htmlFor="name"
              className="block text-xs font-medium text-stone-700"
            >
              Nombre del Producto *
            </label>
            <input
              id="name"
              type="text"
              placeholder="Ej: Blazer Sastrero Milán"
              {...register("name")}
              className="mt-1.5 w-full rounded-lg border border-stone-300 px-3.5 py-2.5 text-sm text-stone-900 focus:border-stone-900 focus:outline-none"
            />
            {errors.name && (
              <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>
            )}
          </div>

          <div className="sm:col-span-2">
            <label
              htmlFor="status"
              className="block text-xs font-medium text-stone-700"
            >
              Estado de Publicación *
            </label>
            <select
              id="status"
              {...register("status")}
              className="mt-1.5 w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-sm text-stone-900 focus:border-stone-900 focus:outline-none"
            >
              <option value="ACTIVE">ACTIVE (Publicado en tienda)</option>
              <option value="DRAFT">DRAFT (Borrador oculto)</option>
              <option value="ARCHIVED">ARCHIVED (Fuera de temporada)</option>
            </select>
          </div>

          <div className="sm:col-span-3">
            <div className="flex items-center justify-between">
              <label
                htmlFor="categoryId"
                className="block text-xs font-medium text-stone-700"
              >
                Categoría *
              </label>
              <Link
                href="/admin/categorias"
                className="text-[11px] font-semibold text-stone-600 underline underline-offset-2 hover:text-stone-900"
              >
                + Gestionar categorías
              </Link>
            </div>
            <select
              id="categoryId"
              {...register("categoryId")}
              className="mt-1.5 w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-sm text-stone-900 focus:border-stone-900 focus:outline-none"
            >
              <option value="">Seleccionar categoría...</option>
              {catalogs?.categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
            {errors.categoryId && (
              <p className="mt-1 text-xs text-red-600">
                {errors.categoryId.message}
              </p>
            )}
          </div>

          <div className="sm:col-span-3">
            <label
              htmlFor="collectionId"
              className="block text-xs font-medium text-stone-700"
            >
              Colección / Temporada (Opcional)
            </label>
            <select
              id="collectionId"
              {...register("collectionId")}
              className="mt-1.5 w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-sm text-stone-900 focus:border-stone-900 focus:outline-none"
            >
              <option value="">Sin colección específica</option>
              {catalogs?.collections.map((col) => (
                <option key={col.id} value={col.id}>
                  {col.name}
                </option>
              ))}
            </select>
          </div>

          {/* Precio Base */}
          <div className="sm:col-span-2">
            <label
              htmlFor="basePrice"
              className="block text-xs font-medium text-stone-700"
            >
              Precio Base (ARS) *
            </label>
            <input
              id="basePrice"
              type="number"
              step="0.01"
              min="0"
              placeholder="Ej: 85000"
              {...register("basePrice", { valueAsNumber: true })}
              className="mt-1.5 w-full rounded-lg border border-stone-300 px-3.5 py-2.5 text-sm text-stone-900 focus:border-stone-900 focus:outline-none"
            />
            {errors.basePrice && (
              <p className="mt-1 text-xs text-red-600">
                {errors.basePrice.message}
              </p>
            )}
          </div>

          {/* Porcentaje de Descuento */}
          <div className="sm:col-span-2">
            <label
              htmlFor="discountPercentage"
              className="flex items-center gap-1 text-xs font-medium text-stone-700"
            >
              <Percent className="h-3.5 w-3.5 text-stone-500" />
              Descuento (%) *
            </label>
            <input
              id="discountPercentage"
              type="number"
              step="1"
              min="0"
              max="100"
              placeholder="0"
              {...register("discountPercentage", { valueAsNumber: true })}
              className="mt-1.5 w-full rounded-lg border border-stone-300 px-3.5 py-2.5 text-sm text-stone-900 focus:border-stone-900 focus:outline-none"
            />
            {effectivePreviewPrice !== null && (
              <p className="mt-1 text-[11px] font-medium text-emerald-700">
                Precio final sugerido: $
                {effectivePreviewPrice.toLocaleString("es-AR")}
              </p>
            )}
            {errors.discountPercentage && (
              <p className="mt-1 text-xs text-red-600">
                {errors.discountPercentage.message}
              </p>
            )}
          </div>

          {/* Peso en Gramos (Logística) */}
          <div className="sm:col-span-2">
            <label
              htmlFor="weightInGrams"
              className="flex items-center gap-1 text-xs font-medium text-stone-700"
            >
              <Scale className="h-3.5 w-3.5 text-stone-500" />
              Peso Logístico (gramos) *
            </label>
            <input
              id="weightInGrams"
              type="number"
              step="1"
              min="0"
              placeholder="Ej: 450"
              {...register("weightInGrams", { valueAsNumber: true })}
              className="mt-1.5 w-full rounded-lg border border-stone-300 px-3.5 py-2.5 text-sm text-stone-900 focus:border-stone-900 focus:outline-none"
            />
            {errors.weightInGrams && (
              <p className="mt-1 text-xs text-red-600">
                {errors.weightInGrams.message}
              </p>
            )}
          </div>

          <div className="sm:col-span-3">
            <label
              htmlFor="compareAtPrice"
              className="block text-xs font-medium text-stone-700"
            >
              Precio Anterior Tachado (ARS - Opcional)
            </label>
            <input
              id="compareAtPrice"
              type="number"
              step="0.01"
              min="0"
              placeholder="Ej: 98000"
              {...register("compareAtPrice", {
                setValueAs: (v) =>
                  v === "" || v === null || Number.isNaN(Number(v))
                    ? null
                    : Number(v),
              })}
              className="mt-1.5 w-full rounded-lg border border-stone-300 px-3.5 py-2.5 text-sm text-stone-900 focus:border-stone-900 focus:outline-none"
            />
            {errors.compareAtPrice && (
              <p className="mt-1 text-xs text-red-600">
                {errors.compareAtPrice.message}
              </p>
            )}
          </div>

          <div className="sm:col-span-3">
            <label
              htmlFor="composition"
              className="block text-xs font-medium text-stone-700"
            >
              Composición Textil (Opcional)
            </label>
            <input
              id="composition"
              type="text"
              placeholder="Ej: 95% Seda Fría, 5% Elastano"
              {...register("composition")}
              className="mt-1.5 w-full rounded-lg border border-stone-300 px-3.5 py-2.5 text-sm text-stone-900 focus:border-stone-900 focus:outline-none"
            />
          </div>

          <div className="sm:col-span-6">
            <label
              htmlFor="description"
              className="block text-xs font-medium text-stone-700"
            >
              Descripción Comercial y Calce *
            </label>
            <textarea
              id="description"
              rows={3}
              placeholder="Describí el corte, la caída de la tela y las ocasiones de uso..."
              {...register("description")}
              className="mt-1.5 w-full rounded-lg border border-stone-300 px-3.5 py-2.5 text-sm text-stone-900 focus:border-stone-900 focus:outline-none"
            />
            {errors.description && (
              <p className="mt-1 text-xs text-red-600">
                {errors.description.message}
              </p>
            )}
          </div>

          <div className="sm:col-span-6">
            <label
              htmlFor="careGuide"
              className="block text-xs font-medium text-stone-700"
            >
              Cuidados de la Prenda (Opcional)
            </label>
            <input
              id="careGuide"
              type="text"
              placeholder="Ej: Lavar a mano con agua fría. No usar secadora."
              {...register("careGuide")}
              className="mt-1.5 w-full rounded-lg border border-stone-300 px-3.5 py-2.5 text-sm text-stone-900 focus:border-stone-900 focus:outline-none"
            />
          </div>
        </div>
      </section>

      {/* SECCIÓN 2: Galería de Imágenes del Producto (1 a N ProductImage) */}
      <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-2xs sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-200 pb-4">
          <div>
            <h2 className="flex items-center gap-2 text-sm font-semibold tracking-wider text-stone-900 uppercase">
              <ImageIcon className="h-4 w-4 text-stone-500" />
              2. Galería de Imágenes del Producto (1 a N)
            </h2>
            <p className="mt-0.5 text-xs text-stone-500">
              La primera URL será la foto de portada principal; podés sumar
              todas las vistas adicionales que necesites.
            </p>
          </div>

          <button
            type="button"
            onClick={() => appendGalleryUrl({ url: "" })}
            className="inline-flex items-center gap-1.5 rounded-lg border border-stone-900 bg-white px-3.5 py-2 text-xs font-semibold text-stone-900 transition-colors hover:bg-stone-900 hover:text-white"
          >
            <Plus className="h-3.5 w-3.5" />
            Agregar Foto a la Galería
          </button>
        </div>

        <div className="mt-5 space-y-3">
          {galleryFields.map((field, index) => {
            const urlError = errors.galleryUrls?.[index]?.url;
            return (
              <div key={field.id} className="flex items-start gap-3">
                <span className="mt-2.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-stone-100 text-xs font-semibold text-stone-600">
                  {index + 1}
                </span>
                <div className="flex-1">
                  <input
                    type="url"
                    placeholder={
                      index === 0
                        ? "https://images.unsplash.com/... (Foto de Portada Principal)"
                        : "https://images.unsplash.com/... (Foto secundaria de galería)"
                    }
                    {...register(`galleryUrls.${index}.url`)}
                    className="w-full rounded-lg border border-stone-300 px-3.5 py-2 text-sm text-stone-900 focus:border-stone-900 focus:outline-none"
                  />
                  {urlError && (
                    <p className="mt-1 text-xs text-red-600">
                      {urlError.message}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => removeGalleryUrl(index)}
                  disabled={galleryFields.length <= 1}
                  aria-label="Eliminar foto de galería"
                  className="mt-1 rounded-lg p-2 text-stone-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* SECCIÓN 3: Matriz Dinámica de Variantes (Talle + Color + Stock + Foto de Variante) */}
      <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-2xs sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-200 pb-4">
          <div>
            <h2 className="text-sm font-semibold tracking-wider text-stone-900 uppercase">
              3. Matriz de Variantes (Talle + Color + Stock + Foto Específica)
            </h2>
            <p className="mt-0.5 text-xs text-stone-500">
              Definí el inventario por talle/color y asigná opcionalmente una
              URL de imagen específica para cada variante.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              appendVariant({
                sizeId: catalogs?.sizes[0]?.id ?? "",
                colorId: catalogs?.colors[0]?.id ?? "",
                sku: "",
                stock: 10,
                imageUrl: "",
              })
            }
            className="inline-flex items-center gap-1.5 rounded-lg border border-stone-900 bg-white px-3.5 py-2 text-xs font-semibold text-stone-900 transition-colors hover:bg-stone-900 hover:text-white"
          >
            <Plus className="h-3.5 w-3.5" />
            Agregar Variante
          </button>
        </div>

        {errors.variants?.root && (
          <p className="mt-3 text-xs font-medium text-red-600">
            {errors.variants.root.message}
          </p>
        )}

        <div className="mt-5 space-y-4">
          {variantFields.map((field, index) => {
            const rowErrors = errors.variants?.[index];
            const selectedColorId = watchedVariants?.[index]?.colorId;
            const selectedColorHex =
              catalogs?.colors.find((c) => c.id === selectedColorId)
                ?.hexCode ?? "#e7e5e4";

            return (
              <div
                key={field.id}
                className="space-y-3 rounded-xl border border-stone-200 bg-stone-50/70 p-4"
              >
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-12 sm:items-start">
                  {/* Selector de Talle */}
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-semibold tracking-wider text-stone-600 uppercase">
                      Talle *
                    </label>
                    <select
                      {...register(`variants.${index}.sizeId`)}
                      className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-2.5 py-2 text-xs text-stone-900 focus:border-stone-900 focus:outline-none"
                    >
                      <option value="">Talle...</option>
                      {catalogs?.sizes.map((size) => (
                        <option key={size.id} value={size.id}>
                          {size.name}
                        </option>
                      ))}
                    </select>
                    {rowErrors?.sizeId && (
                      <p className="mt-1 text-[11px] text-red-600">
                        {rowErrors.sizeId.message}
                      </p>
                    )}
                  </div>

                  {/* Selector de Color con muestra cromática */}
                  <div className="sm:col-span-3">
                    <label className="block text-[11px] font-semibold tracking-wider text-stone-600 uppercase">
                      Color *
                    </label>
                    <div className="mt-1 flex items-center gap-2">
                      <span
                        className="h-5 w-5 shrink-0 rounded-full border border-stone-300"
                        style={{ backgroundColor: selectedColorHex }}
                      />
                      <select
                        {...register(`variants.${index}.colorId`)}
                        className="w-full rounded-lg border border-stone-300 bg-white px-2.5 py-2 text-xs text-stone-900 focus:border-stone-900 focus:outline-none"
                      >
                        <option value="">Color...</option>
                        {catalogs?.colors.map((color) => (
                          <option key={color.id} value={color.id}>
                            {color.name} ({color.hexCode})
                          </option>
                        ))}
                      </select>
                    </div>
                    {rowErrors?.colorId && (
                      <p className="mt-1 text-[11px] text-red-600">
                        {rowErrors.colorId.message}
                      </p>
                    )}
                  </div>

                  {/* Código SKU + Autogenerador */}
                  <div className="sm:col-span-4">
                    <div className="flex items-center justify-between">
                      <label className="block text-[11px] font-semibold tracking-wider text-stone-600 uppercase">
                        Código SKU Único *
                      </label>
                      <button
                        type="button"
                        onClick={() => generateSuggestedSku(index)}
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-stone-600 hover:text-stone-900"
                      >
                        <Wand2 className="h-3 w-3" />
                        Sugerir SKU
                      </button>
                    </div>
                    <input
                      type="text"
                      placeholder="Ej: BLZ-MIL-NEG-S"
                      {...register(`variants.${index}.sku`)}
                      className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 font-mono text-xs uppercase text-stone-900 focus:border-stone-900 focus:outline-none"
                    />
                    {rowErrors?.sku && (
                      <p className="mt-1 text-[11px] text-red-600">
                        {rowErrors.sku.message}
                      </p>
                    )}
                  </div>

                  {/* Stock Físico */}
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-semibold tracking-wider text-stone-600 uppercase">
                      Stock Físico *
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      {...register(`variants.${index}.stock`, {
                        valueAsNumber: true,
                      })}
                      className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs font-semibold text-stone-900 focus:border-stone-900 focus:outline-none"
                    />
                    {rowErrors?.stock && (
                      <p className="mt-1 text-[11px] text-red-600">
                        {rowErrors.stock.message}
                      </p>
                    )}
                  </div>

                  {/* Eliminar fila */}
                  <div className="flex items-end justify-end sm:col-span-1 sm:pt-5">
                    <button
                      type="button"
                      onClick={() => removeVariant(index)}
                      disabled={variantFields.length <= 1}
                      aria-label="Eliminar fila de variante"
                      className="rounded-lg p-2 text-stone-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* URL de Imagen Específica de la Variante */}
                <div>
                  <label className="block text-[11px] font-semibold tracking-wider text-stone-600 uppercase">
                    URL de Foto Específica para esta Variante / Color (Opcional)
                  </label>
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/... (Foto específica de este color/talle)"
                    {...register(`variants.${index}.imageUrl`)}
                    className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs text-stone-900 focus:border-stone-900 focus:outline-none"
                  />
                  {rowErrors?.imageUrl && (
                    <p className="mt-1 text-[11px] text-red-600">
                      {rowErrors.imageUrl.message}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Botonera de Guardado */}
      <div className="flex items-center justify-end gap-4">
        <Link
          href="/admin/productos"
          className="rounded-lg border border-stone-300 bg-white px-6 py-3.5 text-xs font-semibold tracking-wider text-stone-700 uppercase hover:border-stone-900 hover:text-stone-900"
        >
          Cancelar
        </Link>

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center gap-2 rounded-lg bg-stone-900 px-8 py-3.5 text-xs font-semibold tracking-wider text-white uppercase transition-colors hover:bg-stone-800 disabled:cursor-not-allowed disabled:bg-stone-400"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Guardando en Base de Datos...
            </>
          ) : (
            "Guardar Producto y Variantes"
          )}
        </button>
      </div>
    </form>
  );
}

export default function AdminNewProductPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-8">
      {/* Encabezado Estático (Pre-renderizable) */}
      <div>
        <Link
          href="/admin/productos"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-stone-500 transition-colors hover:text-stone-900"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Volver al catálogo
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-stone-900">
          Alta de Nuevo Producto
        </h1>
        <p className="mt-1 text-sm text-stone-500">
          Completá la ficha comercial, porcentaje de descuento, peso logístico,
          galería de imágenes y matriz de variantes.
        </p>
      </div>

      {/* Límite Suspense para permitir crypto.randomUUID() de useFieldArray bajo cacheComponents */}
      <Suspense
        fallback={
          <div className="h-96 animate-pulse rounded-xl bg-stone-200/70" />
        }
      >
        <NewProductForm />
      </Suspense>
    </div>
  );
}
