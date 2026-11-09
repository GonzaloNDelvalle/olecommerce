"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import {
  deleteAdminShippingMethod,
  saveAdminShippingMethod,
  type AdminShippingMethodDTO,
  type ShippingMethodInput,
} from "@/modules/admin/actions/admin-settings.actions";
import { ARGENTINA_PROVINCES } from "@/modules/orders/schemas/checkout.schema";
import {
  AdminCard,
  AdminNotice,
  adminInputClass,
  adminLabelClass,
  adminPrimaryButtonClass,
  adminSecondaryButtonClass,
} from "@/modules/admin/components/AdminUi";

const arsFormatter = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

type Draft = {
  id?: string;
  name: string;
  description: string;
  type: "HOME_DELIVERY" | "PICKUP";
  price: string;
  freeShippingThreshold: string;
  estimatedDelivery: string;
  provinces: string[];
  isActive: boolean;
  sortOrder: string;
};

const EMPTY_DRAFT: Draft = {
  name: "",
  description: "",
  type: "HOME_DELIVERY",
  price: "",
  freeShippingThreshold: "",
  estimatedDelivery: "",
  provinces: [],
  isActive: true,
  sortOrder: "0",
};

function toDraft(method: AdminShippingMethodDTO): Draft {
  return {
    id: method.id,
    name: method.name,
    description: method.description ?? "",
    type: method.type,
    price: String(method.price),
    freeShippingThreshold:
      method.freeShippingThreshold === null ? "" : String(method.freeShippingThreshold),
    estimatedDelivery: method.estimatedDelivery ?? "",
    provinces: method.provinces,
    isActive: method.isActive,
    sortOrder: String(method.sortOrder),
  };
}

export function ShippingMethodsManager({
  methods,
}: {
  methods: AdminShippingMethodDTO[];
}) {
  const router = useRouter();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [message, setMessage] = useState<
    { tone: "success" | "error"; text: string } | null
  >(null);
  const [isPending, startTransition] = useTransition();

  function update<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((current) => (current ? { ...current, [key]: value } : current));
  }

  function toggleProvince(province: string) {
    if (!draft) return;
    update(
      "provinces",
      draft.provinces.includes(province)
        ? draft.provinces.filter((p) => p !== province)
        : [...draft.provinces, province]
    );
  }

  function handleSave() {
    if (!draft) return;
    const payload: ShippingMethodInput = {
      id: draft.id,
      name: draft.name,
      description: draft.description,
      type: draft.type,
      price: Number(draft.price) || 0,
      freeShippingThreshold: draft.freeShippingThreshold
        ? Number(draft.freeShippingThreshold)
        : null,
      estimatedDelivery: draft.estimatedDelivery,
      provinces: draft.provinces as ShippingMethodInput["provinces"],
      isActive: draft.isActive,
      sortOrder: Number(draft.sortOrder) || 0,
    };
    startTransition(async () => {
      const result = await saveAdminShippingMethod(payload);
      if (result.success) {
        setDraft(null);
        setMessage({ tone: "success", text: result.message });
        router.refresh();
      } else {
        setMessage({ tone: "error", text: result.error });
      }
    });
  }

  function handleDelete(method: AdminShippingMethodDTO) {
    if (!window.confirm(`¿Eliminar "${method.name}"?`)) return;
    startTransition(async () => {
      const result = await deleteAdminShippingMethod(method.id);
      setMessage(
        result.success
          ? { tone: "success", text: result.message }
          : { tone: "error", text: result.error }
      );
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      {message && <AdminNotice tone={message.tone}>{message.text}</AdminNotice>}

      <AdminCard>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold tracking-wide text-stone-900 uppercase">
            Métodos de entrega
          </h2>
          <button
            type="button"
            onClick={() => setDraft({ ...EMPTY_DRAFT })}
            className={adminSecondaryButtonClass}
          >
            <Plus className="h-3.5 w-3.5" /> Nuevo método
          </button>
        </div>

        {methods.length === 0 ? (
          <p className="text-sm text-stone-500">
            Todavía no hay métodos de envío: sin al menos uno activo no se puede comprar.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-[11px] tracking-wider text-stone-500 uppercase">
                <tr>
                  <th className="py-2 pr-4 font-semibold">Nombre</th>
                  <th className="py-2 pr-4 font-semibold">Tipo</th>
                  <th className="py-2 pr-4 font-semibold">Costo</th>
                  <th className="py-2 pr-4 font-semibold">Gratis desde</th>
                  <th className="py-2 pr-4 font-semibold">Zona</th>
                  <th className="py-2 pr-4 font-semibold">Estado</th>
                  <th className="py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {methods.map((method) => (
                  <tr key={method.id}>
                    <td className="py-3 pr-4 font-medium text-stone-900">
                      {method.name}
                      {method.estimatedDelivery && (
                        <span className="block text-xs font-normal text-stone-500">
                          {method.estimatedDelivery}
                        </span>
                      )}
                    </td>
                    <td className="py-3 pr-4 text-stone-600">
                      {method.type === "PICKUP" ? "Retiro" : "Domicilio"}
                    </td>
                    <td className="py-3 pr-4 text-stone-900">
                      {method.price === 0 ? "Sin cargo" : arsFormatter.format(method.price)}
                    </td>
                    <td className="py-3 pr-4 text-stone-600">
                      {method.freeShippingThreshold === null
                        ? "—"
                        : arsFormatter.format(method.freeShippingThreshold)}
                    </td>
                    <td className="py-3 pr-4 text-stone-600">
                      {method.provinces.length === 0
                        ? "Todo el país"
                        : `${method.provinces.length} provincia(s)`}
                    </td>
                    <td className="py-3 pr-4">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                          method.isActive
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-stone-100 text-stone-500"
                        }`}
                      >
                        {method.isActive ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="py-3 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => setDraft(toDraft(method))}
                        className="rounded-lg p-1.5 text-stone-500 hover:bg-stone-100 hover:text-stone-900"
                        aria-label={`Editar ${method.name}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(method)}
                        disabled={isPending}
                        className="rounded-lg p-1.5 text-stone-400 hover:bg-red-50 hover:text-red-600"
                        aria-label={`Eliminar ${method.name}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AdminCard>

      {draft && (
        <AdminCard title={draft.id ? "Editar método" : "Nuevo método"}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={adminLabelClass} htmlFor="sm-name">Nombre</label>
              <input id="sm-name" className={`mt-1.5 ${adminInputClass}`} value={draft.name} onChange={(e) => update("name", e.target.value)} placeholder="Envío a domicilio" />
            </div>
            <div>
              <label className={adminLabelClass} htmlFor="sm-type">Tipo</label>
              <select id="sm-type" className={`mt-1.5 ${adminInputClass}`} value={draft.type} onChange={(e) => update("type", e.target.value as Draft["type"])}>
                <option value="HOME_DELIVERY">Envío a domicilio</option>
                <option value="PICKUP">Retiro en showroom / punto</option>
              </select>
            </div>
            <div>
              <label className={adminLabelClass} htmlFor="sm-price">Costo (ARS)</label>
              <input id="sm-price" type="number" min={0} className={`mt-1.5 ${adminInputClass}`} value={draft.price} onChange={(e) => update("price", e.target.value)} />
            </div>
            <div>
              <label className={adminLabelClass} htmlFor="sm-free">Gratis desde (ARS, opcional)</label>
              <input id="sm-free" type="number" min={0} className={`mt-1.5 ${adminInputClass}`} value={draft.freeShippingThreshold} onChange={(e) => update("freeShippingThreshold", e.target.value)} />
            </div>
            <div>
              <label className={adminLabelClass} htmlFor="sm-desc">Descripción</label>
              <input id="sm-desc" className={`mt-1.5 ${adminInputClass}`} value={draft.description} onChange={(e) => update("description", e.target.value)} placeholder="Correo Argentino a todo el país" />
            </div>
            <div>
              <label className={adminLabelClass} htmlFor="sm-eta">Plazo estimado</label>
              <input id="sm-eta" className={`mt-1.5 ${adminInputClass}`} value={draft.estimatedDelivery} onChange={(e) => update("estimatedDelivery", e.target.value)} placeholder="3 a 7 días hábiles" />
            </div>
            <div>
              <label className={adminLabelClass} htmlFor="sm-order">Orden</label>
              <input id="sm-order" type="number" min={0} className={`mt-1.5 ${adminInputClass}`} value={draft.sortOrder} onChange={(e) => update("sortOrder", e.target.value)} />
            </div>
            <label className="mt-6 inline-flex items-center gap-2 text-sm text-stone-700">
              <input type="checkbox" checked={draft.isActive} onChange={(e) => update("isActive", e.target.checked)} className="h-4 w-4 rounded border-stone-300" />
              Activo en el checkout
            </label>
          </div>

          <fieldset className="mt-6">
            <legend className={adminLabelClass}>
              Provincias habilitadas (sin marcar ninguna = todo el país)
            </legend>
            <div className="mt-2 grid grid-cols-1 gap-1.5 sm:grid-cols-3">
              {ARGENTINA_PROVINCES.map((province) => (
                <label key={province} className="inline-flex items-center gap-2 text-xs text-stone-700">
                  <input
                    type="checkbox"
                    checked={draft.provinces.includes(province)}
                    onChange={() => toggleProvince(province)}
                    className="h-3.5 w-3.5 rounded border-stone-300"
                  />
                  {province}
                </label>
              ))}
            </div>
          </fieldset>

          <div className="mt-6 flex gap-3">
            <button type="button" onClick={handleSave} disabled={isPending} className={adminPrimaryButtonClass}>
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Guardar
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
