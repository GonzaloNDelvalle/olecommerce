"use client";

import Image from "next/image";
import { ArrowLeft, ArrowRight, Check, X } from "lucide-react";
import type { AdminProductImagesDTO } from "@/modules/admin/actions/admin-content.actions";
import { adminLabelClass } from "@/modules/admin/components/AdminUi";
import { cn } from "@/lib/cn";

const MAX_PICKS = 12;

/**
 * Selector de las imágenes de la sección de temporada: se tocan las fotos de
 * los productos para sumarlas (en el orden en que se eligen) y se reordenan
 * o quitan desde la tira de seleccionadas.
 */
export function FeaturedPicksField({
  products,
  value,
  onChange,
}: {
  products: AdminProductImagesDTO[];
  value: string[];
  onChange: (ids: string[]) => void;
}) {
  const imageIndex = new Map<string, { url: string; name: string }>();
  for (const product of products) {
    for (const image of product.images) {
      imageIndex.set(image.id, { url: image.url, name: product.name });
    }
  }
  // Ignora ids de imágenes que ya no existen
  const selected = value.filter((id) => imageIndex.has(id));

  function toggle(id: string) {
    if (selected.includes(id)) {
      onChange(selected.filter((current) => current !== id));
    } else if (selected.length < MAX_PICKS) {
      onChange([...selected, id]);
    }
  }

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= selected.length) return;
    const next = [...selected];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between gap-3">
        <span className={adminLabelClass}>Imágenes de la sección de temporada</span>
        <span className="text-[11px] text-stone-400">
          {selected.length} / {MAX_PICKS} elegidas
          {selected.length === 0 && " · sin elegir se muestran los destacados"}
        </span>
      </div>

      {selected.length > 0 && (
        <ol className="flex flex-wrap gap-3">
          {selected.map((id, index) => {
            const item = imageIndex.get(id)!;
            return (
              <li key={id} className="w-24">
                <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-stone-100">
                  <Image src={item.url} alt={item.name} fill sizes="96px" className="object-cover" />
                  <span className="absolute top-1 left-1 rounded-full bg-stone-900 px-1.5 text-[10px] font-semibold text-white">
                    {index + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => toggle(id)}
                    aria-label={`Quitar ${item.name}`}
                    className="absolute top-1 right-1 rounded-full bg-white/90 p-0.5 text-stone-700 hover:text-red-600"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="mt-1 flex justify-between">
                  <button
                    type="button"
                    onClick={() => move(index, -1)}
                    disabled={index === 0}
                    aria-label="Mover antes"
                    className="rounded p-1 text-stone-500 hover:bg-stone-100 disabled:opacity-30"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => move(index, 1)}
                    disabled={index === selected.length - 1}
                    aria-label="Mover después"
                    className="rounded p-1 text-stone-500 hover:bg-stone-100 disabled:opacity-30"
                  >
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </li>
            );
          })}
        </ol>
      )}

      <div className="max-h-[420px] space-y-5 overflow-y-auto rounded-xl border border-stone-200 p-4">
        {products.length === 0 && (
          <p className="text-xs text-stone-500">Todavía no hay productos activos con fotos.</p>
        )}
        {products.map((product) => (
          <div key={product.id}>
            <p className="mb-2 text-xs font-medium text-stone-700">{product.name}</p>
            <div className="flex flex-wrap gap-2">
              {product.images.map((image) => {
                const isSelected = selected.includes(image.id);
                return (
                  <button
                    key={image.id}
                    type="button"
                    onClick={() => toggle(image.id)}
                    aria-pressed={isSelected}
                    aria-label={`${isSelected ? "Quitar" : "Elegir"} foto de ${product.name}`}
                    className={cn(
                      "relative h-24 w-[72px] overflow-hidden rounded-md bg-stone-100 ring-offset-2 transition",
                      isSelected ? "ring-2 ring-stone-900" : "hover:opacity-80"
                    )}
                  >
                    <Image src={image.url} alt="" fill sizes="72px" className="object-cover" />
                    {isSelected && (
                      <span className="absolute inset-0 flex items-center justify-center bg-stone-900/40 text-white">
                        <Check className="h-5 w-5" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
