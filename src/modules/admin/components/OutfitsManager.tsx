"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Check, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import {
  deleteAdminOutfit,
  saveAdminOutfit,
  type AdminOutfitDTO,
  type AdminProductImagesDTO,
} from "@/modules/admin/actions/admin-content.actions";
import { SingleImageDropzone } from "@/modules/admin/components/ImageDropzone";
import {
  AdminCard,
  AdminNotice,
  adminInputClass,
  adminLabelClass,
  adminPrimaryButtonClass,
  adminSecondaryButtonClass,
} from "@/modules/admin/components/AdminUi";
import { cn } from "@/lib/cn";

const MAX_PRODUCTS = 8;

type Draft = {
  id?: string;
  title: string;
  imageUrl: string;
  isActive: boolean;
  sortOrder: string;
  productIds: string[];
};

const EMPTY: Draft = { title: "", imageUrl: "", isActive: true, sortOrder: "0", productIds: [] };

export function OutfitsManager({
  outfits,
  products,
}: {
  outfits: AdminOutfitDTO[];
  products: AdminProductImagesDTO[];
}) {
  const router = useRouter();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const productsById = new Map(products.map((product) => [product.id, product]));

  function run(action: () => Promise<{ success: boolean; message?: string; error?: string }>, onOk?: () => void) {
    setMessage(null);
    startTransition(async () => {
      const result = await action();
      setMessage(
        result.success
          ? { tone: "success", text: result.message ?? "Listo." }
          : { tone: "error", text: result.error ?? "No se pudo guardar." }
      );
      if (result.success) {
        onOk?.();
        router.refresh();
      }
    });
  }

  function toggleProduct(id: string) {
    setDraft((current) => {
      if (!current) return current;
      if (current.productIds.includes(id)) {
        return { ...current, productIds: current.productIds.filter((value) => value !== id) };
      }
      if (current.productIds.length >= MAX_PRODUCTS) return current;
      return { ...current, productIds: [...current.productIds, id] };
    });
  }

  function save() {
    if (!draft) return;
    run(
      () =>
        saveAdminOutfit({
          id: draft.id,
          title: draft.title,
          imageUrl: draft.imageUrl,
          isActive: draft.isActive,
          sortOrder: Number(draft.sortOrder) || 0,
          productIds: draft.productIds,
        }),
      () => setDraft(null)
    );
  }

  return (
    <div className="space-y-6">
      {message && <AdminNotice tone={message.tone}>{message.text}</AdminNotice>}

      <AdminCard
        title="Outfits"
        description="Cada outfit es una foto con las prendas que lo componen. Se muestran en la portada, antes del newsletter."
      >
        {outfits.length === 0 && !draft && (
          <p className="mb-4 text-sm text-stone-500">Todavía no cargaste ningún outfit.</p>
        )}

        <ul className="divide-y divide-stone-200">
          {outfits.map((outfit) => (
            <li key={outfit.id} className="flex items-center gap-4 py-3">
              <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-md bg-stone-100">
                <Image src={outfit.imageUrl} alt="" fill sizes="64px" className="object-cover" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-stone-900">{outfit.title}</p>
                <p className="text-xs text-stone-500">
                  {outfit.productIds.length} {outfit.productIds.length === 1 ? "producto" : "productos"} ·
                  orden {outfit.sortOrder} · {outfit.isActive ? "visible" : "oculto"}
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setDraft({
                    id: outfit.id,
                    title: outfit.title,
                    imageUrl: outfit.imageUrl,
                    isActive: outfit.isActive,
                    sortOrder: String(outfit.sortOrder),
                    productIds: outfit.productIds,
                  })
                }
                aria-label={`Editar ${outfit.title}`}
                className="rounded-lg p-2 text-stone-500 hover:bg-stone-100 hover:text-stone-900"
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={() => {
                  if (window.confirm(`¿Eliminar el outfit "${outfit.title}"?`)) {
                    run(() => deleteAdminOutfit(outfit.id));
                  }
                }}
                aria-label={`Eliminar ${outfit.title}`}
                className="rounded-lg p-2 text-stone-400 hover:bg-red-50 hover:text-red-600"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>

        {!draft && (
          <button
            type="button"
            onClick={() => setDraft({ ...EMPTY })}
            className={cn(adminSecondaryButtonClass, "mt-4")}
          >
            <Plus className="h-4 w-4" /> Nuevo outfit
          </button>
        )}
      </AdminCard>

      {draft && (
        <AdminCard title={draft.id ? "Editar outfit" : "Nuevo outfit"}>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-[220px_minmax(0,1fr)]">
            <SingleImageDropzone
              label="Foto del outfit"
              helperText="Vertical (4:5), con la persona o el look completo"
              subfolder="hero"
              value={draft.imageUrl}
              onChange={(url) => setDraft({ ...draft, imageUrl: url })}
            />
            <div className="space-y-4">
              <div>
                <label htmlFor="outfit-title" className={adminLabelClass}>
                  Nombre del outfit
                </label>
                <input
                  id="outfit-title"
                  type="text"
                  maxLength={120}
                  value={draft.title}
                  onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                  placeholder="Sastrería en tonos tierra"
                  className={`mt-1.5 ${adminInputClass}`}
                />
              </div>
              <div className="flex flex-wrap items-center gap-6">
                <label className="inline-flex items-center gap-2 text-sm text-stone-700">
                  <input
                    type="checkbox"
                    checked={draft.isActive}
                    onChange={(e) => setDraft({ ...draft, isActive: e.target.checked })}
                    className="h-4 w-4 rounded border-stone-300"
                  />
                  Visible en la tienda
                </label>
                <div className="flex items-center gap-2">
                  <label htmlFor="outfit-order" className={adminLabelClass}>
                    Orden
                  </label>
                  <input
                    id="outfit-order"
                    type="number"
                    min={0}
                    max={999}
                    value={draft.sortOrder}
                    onChange={(e) => setDraft({ ...draft, sortOrder: e.target.value })}
                    className={`w-20 ${adminInputClass}`}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <div className="flex items-baseline justify-between gap-3">
              <span className={adminLabelClass}>Productos del outfit</span>
              <span className="text-[11px] text-stone-400">
                {draft.productIds.length} / {MAX_PRODUCTS} · se muestran en el orden en que los elegís
              </span>
            </div>
            <div className="mt-2 grid max-h-[380px] grid-cols-3 gap-3 overflow-y-auto rounded-xl border border-stone-200 p-3 sm:grid-cols-5 lg:grid-cols-6">
              {products.map((product) => {
                const position = draft.productIds.indexOf(product.id);
                const selected = position !== -1;
                const cover = product.images[0]?.url;
                return (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => toggleProduct(product.id)}
                    aria-pressed={selected}
                    className="text-left"
                  >
                    <span
                      className={cn(
                        "relative block aspect-[3/4] overflow-hidden rounded-md bg-stone-100 ring-offset-2 transition",
                        selected ? "ring-2 ring-stone-900" : "hover:opacity-80"
                      )}
                    >
                      {cover && <Image src={cover} alt="" fill sizes="120px" className="object-cover" />}
                      {selected && (
                        <span className="absolute inset-0 flex items-center justify-center bg-stone-900/40 text-white">
                          <Check className="h-4 w-4" />
                          <span className="ml-1 text-xs font-semibold">{position + 1}</span>
                        </span>
                      )}
                    </span>
                    <span className="mt-1 block truncate text-[11px] text-stone-600">{product.name}</span>
                  </button>
                );
              })}
            </div>
            {draft.productIds.some((id) => !productsById.has(id)) && (
              <p className="mt-2 text-[11px] text-amber-700">
                Hay productos del outfit que ya no están activos: no se muestran en la tienda.
              </p>
            )}
          </div>

          <div className="mt-6 flex items-center gap-3">
            <button type="button" onClick={save} disabled={isPending} className={adminPrimaryButtonClass}>
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Guardar outfit
            </button>
            <button type="button" onClick={() => setDraft(null)} className={adminSecondaryButtonClass}>
              Cancelar
            </button>
          </div>
        </AdminCard>
      )}
    </div>
  );
}
