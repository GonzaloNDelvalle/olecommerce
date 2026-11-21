"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Check, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import {
  deleteAdminCollection,
  saveAdminCollection,
  type AdminCollectionDTO,
  type AdminCollectionProductDTO,
} from "@/modules/admin/actions/admin-collections.actions";
import {
  AdminCard,
  AdminNotice,
  adminInputClass,
  adminLabelClass,
  adminPrimaryButtonClass,
  adminSecondaryButtonClass,
} from "@/modules/admin/components/AdminUi";
import { cn } from "@/lib/cn";

type Draft = {
  id?: string;
  name: string;
  description: string;
  isActive: boolean;
  productIds: string[];
};

const EMPTY: Draft = { name: "", description: "", isActive: true, productIds: [] };

export function CollectionsManager({
  collections,
  products,
}: {
  collections: AdminCollectionDTO[];
  products: AdminCollectionProductDTO[];
}) {
  const router = useRouter();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const collectionNames = new Map(collections.map((collection) => [collection.id, collection.name]));

  function run(
    action: () => Promise<{ success: boolean; message?: string; error?: string }>,
    onOk?: () => void
  ) {
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
    setDraft((current) =>
      current
        ? {
            ...current,
            productIds: current.productIds.includes(id)
              ? current.productIds.filter((value) => value !== id)
              : [...current.productIds, id],
          }
        : current
    );
  }

  // Productos por categoría, para elegir cómodo
  const byCategory = new Map<string, AdminCollectionProductDTO[]>();
  for (const product of products) {
    byCategory.set(product.categoryName, [...(byCategory.get(product.categoryName) ?? []), product]);
  }

  return (
    <div className="space-y-6">
      {message && <AdminNotice tone={message.tone}>{message.text}</AdminNotice>}

      <AdminCard
        title="Colecciones"
        description="Agrupá productos de distintas categorías (shorts, polleras, remeras…) en una colección. Cada producto conserva su categoría y puede estar en una sola colección."
      >
        {collections.length === 0 && !draft && (
          <p className="mb-4 text-sm text-stone-500">Todavía no creaste ninguna colección.</p>
        )}
        <ul className="divide-y divide-stone-200">
          {collections.map((collection) => (
            <li key={collection.id} className="flex items-center gap-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-stone-900">{collection.name}</p>
                <p className="text-xs text-stone-500">
                  /coleccion/{collection.slug} · {collection.productIds.length}{" "}
                  {collection.productIds.length === 1 ? "producto" : "productos"} ·{" "}
                  {collection.isActive ? "visible" : "oculta"}
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setDraft({
                    id: collection.id,
                    name: collection.name,
                    description: collection.description ?? "",
                    isActive: collection.isActive,
                    productIds: collection.productIds,
                  })
                }
                aria-label={`Editar ${collection.name}`}
                className="rounded-lg p-2 text-stone-500 hover:bg-stone-100 hover:text-stone-900"
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={() => {
                  if (window.confirm(`¿Eliminar la colección "${collection.name}"? Sus productos siguen en la tienda.`)) {
                    run(() => deleteAdminCollection(collection.id));
                  }
                }}
                aria-label={`Eliminar ${collection.name}`}
                className="rounded-lg p-2 text-stone-400 hover:bg-red-50 hover:text-red-600"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
        {!draft && (
          <button type="button" onClick={() => setDraft({ ...EMPTY })} className={cn(adminSecondaryButtonClass, "mt-4")}>
            <Plus className="h-4 w-4" /> Nueva colección
          </button>
        )}
      </AdminCard>

      {draft && (
        <AdminCard title={draft.id ? "Editar colección" : "Nueva colección"}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="collection-name" className={adminLabelClass}>
                Nombre
              </label>
              <input
                id="collection-name"
                type="text"
                maxLength={100}
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                placeholder="Mutare"
                className={`mt-1.5 ${adminInputClass}`}
              />
              <p className="mt-1 text-[11px] text-stone-400">
                Si coincide con el «Nombre de la colección» de Contenido, aparece en el menú.
              </p>
            </div>
            <div>
              <label htmlFor="collection-description" className={adminLabelClass}>
                Descripción (opcional)
              </label>
              <input
                id="collection-description"
                type="text"
                maxLength={300}
                value={draft.description}
                onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                className={`mt-1.5 ${adminInputClass}`}
              />
            </div>
            <label className="inline-flex items-center gap-2 text-sm text-stone-700">
              <input
                type="checkbox"
                checked={draft.isActive}
                onChange={(e) => setDraft({ ...draft, isActive: e.target.checked })}
                className="h-4 w-4 rounded border-stone-300"
              />
              Visible en la tienda
            </label>
          </div>

          <div className="mt-6">
            <div className="flex items-baseline justify-between gap-3">
              <span className={adminLabelClass}>Productos de la colección</span>
              <span className="text-[11px] text-stone-400">{draft.productIds.length} elegidos</span>
            </div>
            <div className="mt-2 max-h-[460px] space-y-5 overflow-y-auto rounded-xl border border-stone-200 p-4">
              {[...byCategory.entries()].map(([categoryName, items]) => (
                <div key={categoryName}>
                  <p className="mb-2 text-xs font-semibold tracking-wider text-stone-500 uppercase">{categoryName}</p>
                  <div className="grid grid-cols-3 gap-3 sm:grid-cols-5 lg:grid-cols-6">
                    {items.map((product) => {
                      const selected = draft.productIds.includes(product.id);
                      const elsewhere =
                        product.collectionId && product.collectionId !== draft.id
                          ? collectionNames.get(product.collectionId)
                          : null;
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
                            {product.imageUrl && (
                              <Image src={product.imageUrl} alt="" fill sizes="120px" className="object-cover" />
                            )}
                            {selected && (
                              <span className="absolute inset-0 flex items-center justify-center bg-stone-900/40 text-white">
                                <Check className="h-5 w-5" />
                              </span>
                            )}
                          </span>
                          <span className="mt-1 block truncate text-[11px] text-stone-700">{product.name}</span>
                          {elsewhere && (
                            <span className="block truncate text-[10px] text-amber-700">Hoy en: {elsewhere}</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 flex items-center gap-3">
            <button
              type="button"
              disabled={isPending}
              onClick={() =>
                run(
                  () =>
                    saveAdminCollection({
                      id: draft.id,
                      name: draft.name,
                      description: draft.description,
                      isActive: draft.isActive,
                      productIds: draft.productIds,
                    }),
                  () => setDraft(null)
                )
              }
              className={adminPrimaryButtonClass}
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Guardar colección
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
