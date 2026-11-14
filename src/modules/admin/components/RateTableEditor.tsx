"use client";

import { Plus, Trash2 } from "lucide-react";
import {
  formatPostalRanges,
  parsePostalRanges,
  type RateTable,
} from "@/modules/orders/shipping-rates";
import {
  adminInputClass,
  adminLabelClass,
  adminSecondaryButtonClass,
} from "@/modules/admin/components/AdminUi";

/** Estado editable (todo en texto, se valida al guardar). */
export interface RateTableDraft {
  packagingGrams: string;
  defaultItemGrams: string;
  zones: {
    name: string;
    ranges: string;
    extraPerKg: string;
    brackets: { maxGrams: string; price: string }[];
  }[];
}

export const EMPTY_RATE_TABLE: RateTableDraft = {
  packagingGrams: "150",
  defaultItemGrams: "500",
  zones: [
    {
      name: "CABA",
      ranges: "1000-1499",
      extraPerKg: "",
      brackets: [
        { maxGrams: "1000", price: "" },
        { maxGrams: "3000", price: "" },
        { maxGrams: "5000", price: "" },
      ],
    },
  ],
};

export function rateTableToDraft(table: RateTable): RateTableDraft {
  return {
    packagingGrams: String(table.packagingGrams),
    defaultItemGrams: String(table.defaultItemGrams),
    zones: table.zones.map((zone) => ({
      name: zone.name,
      ranges: formatPostalRanges(zone.postalRanges),
      extraPerKg: zone.extraPerKg === null ? "" : String(zone.extraPerKg),
      brackets: zone.brackets.map((b) => ({ maxGrams: String(b.maxGrams), price: String(b.price) })),
    })),
  };
}

/** Convierte el borrador en tabla, o devuelve el primer error en castellano. */
export function draftToRateTable(draft: RateTableDraft): { table: RateTable } | { error: string } {
  if (draft.zones.length === 0) return { error: "Agregá al menos una zona." };
  const zones: RateTable["zones"] = [];
  for (const [i, zone] of draft.zones.entries()) {
    const label = zone.name.trim() || `la zona ${i + 1}`;
    if (!zone.name.trim()) return { error: `Ponele nombre a la zona ${i + 1}.` };
    const ranges = parsePostalRanges(zone.ranges);
    if (!ranges) return { error: `Revisá los códigos postales de ${label}: usá rangos como 1000-1499, 1600.` };
    const brackets = zone.brackets
      .filter((b) => b.maxGrams.trim() || b.price.trim())
      .map((b) => ({ maxGrams: Math.round(Number(b.maxGrams)), price: Number(b.price) }));
    if (brackets.length === 0) return { error: `Cargá al menos un tramo de peso en ${label}.` };
    if (brackets.some((b) => !Number.isFinite(b.maxGrams) || b.maxGrams <= 0 || !Number.isFinite(b.price) || b.price < 0)) {
      return { error: `Revisá los tramos de ${label}: peso en gramos mayor a 0 y precio en pesos.` };
    }
    const extra = zone.extraPerKg.trim() === "" ? null : Number(zone.extraPerKg);
    if (extra !== null && (!Number.isFinite(extra) || extra < 0)) return { error: `Revisá el recargo por kg de ${label}.` };
    zones.push({ name: zone.name.trim(), postalRanges: ranges, brackets, extraPerKg: extra });
  }
  return {
    table: {
      zones,
      packagingGrams: Math.max(0, Math.round(Number(draft.packagingGrams) || 0)),
      defaultItemGrams: Math.max(1, Math.round(Number(draft.defaultItemGrams) || 500)),
    },
  };
}

/**
 * Editor de tarifas por zona (rangos de código postal) y peso. Pensado para
 * copiar el tarifario del correo: cada zona tiene tramos "hasta X gramos → $Y".
 */
export function RateTableEditor({
  value,
  onChange,
}: {
  value: RateTableDraft;
  onChange: (next: RateTableDraft) => void;
}) {
  const setZone = (index: number, patch: Partial<RateTableDraft["zones"][number]>) =>
    onChange({ ...value, zones: value.zones.map((z, i) => (i === index ? { ...z, ...patch } : z)) });

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={adminLabelClass} htmlFor="rt-pack">Peso del embalaje (g)</label>
          <input id="rt-pack" type="number" min={0} className={`mt-1.5 ${adminInputClass}`} value={value.packagingGrams} onChange={(e) => onChange({ ...value, packagingGrams: e.target.value })} />
        </div>
        <div>
          <label className={adminLabelClass} htmlFor="rt-default">Peso por prenda si no tiene peso cargado (g)</label>
          <input id="rt-default" type="number" min={1} className={`mt-1.5 ${adminInputClass}`} value={value.defaultItemGrams} onChange={(e) => onChange({ ...value, defaultItemGrams: e.target.value })} />
        </div>
      </div>

      {value.zones.map((zone, zi) => (
        <div key={zi} className="rounded-xl border border-stone-200 p-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_2fr_auto]">
            <div>
              <label className={adminLabelClass} htmlFor={`rt-zn-${zi}`}>Zona</label>
              <input id={`rt-zn-${zi}`} className={`mt-1.5 ${adminInputClass}`} value={zone.name} placeholder="GBA" onChange={(e) => setZone(zi, { name: e.target.value })} />
            </div>
            <div>
              <label className={adminLabelClass} htmlFor={`rt-zr-${zi}`}>Códigos postales</label>
              <input id={`rt-zr-${zi}`} className={`mt-1.5 ${adminInputClass}`} value={zone.ranges} placeholder="1600-1899, 1900-1999" onChange={(e) => setZone(zi, { ranges: e.target.value })} />
            </div>
            <button
              type="button"
              onClick={() => onChange({ ...value, zones: value.zones.filter((_, i) => i !== zi) })}
              className="mt-6 self-start rounded-lg p-2 text-stone-400 hover:bg-red-50 hover:text-red-600"
              aria-label={`Quitar zona ${zone.name || zi + 1}`}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>

          <table className="mt-4 w-full text-left text-sm">
            <thead className="text-[11px] tracking-wider text-stone-500 uppercase">
              <tr>
                <th className="pb-1 font-semibold">Hasta (gramos)</th>
                <th className="pb-1 font-semibold">Precio (ARS)</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {zone.brackets.map((bracket, bi) => (
                <tr key={bi}>
                  <td className="py-1 pr-2">
                    <input type="number" min={1} aria-label="Peso máximo en gramos" className={adminInputClass} value={bracket.maxGrams} onChange={(e) => setZone(zi, { brackets: zone.brackets.map((b, j) => (j === bi ? { ...b, maxGrams: e.target.value } : b)) })} />
                  </td>
                  <td className="py-1 pr-2">
                    <input type="number" min={0} aria-label="Precio" className={adminInputClass} value={bracket.price} onChange={(e) => setZone(zi, { brackets: zone.brackets.map((b, j) => (j === bi ? { ...b, price: e.target.value } : b)) })} />
                  </td>
                  <td className="py-1 text-right">
                    <button type="button" onClick={() => setZone(zi, { brackets: zone.brackets.filter((_, j) => j !== bi) })} className="rounded-lg p-1.5 text-stone-400 hover:bg-red-50 hover:text-red-600" aria-label="Quitar tramo">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-3 flex flex-wrap items-end gap-4">
            <button type="button" onClick={() => setZone(zi, { brackets: [...zone.brackets, { maxGrams: "", price: "" }] })} className={adminSecondaryButtonClass}>
              <Plus className="h-3.5 w-3.5" /> Tramo
            </button>
            <div>
              <label className={adminLabelClass} htmlFor={`rt-ex-${zi}`}>Recargo por kg extra (vacío = no envía más pesado)</label>
              <input id={`rt-ex-${zi}`} type="number" min={0} className={`mt-1.5 ${adminInputClass}`} value={zone.extraPerKg} onChange={(e) => setZone(zi, { extraPerKg: e.target.value })} />
            </div>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={() => onChange({ ...value, zones: [...value.zones, { name: "", ranges: "", extraPerKg: "", brackets: [{ maxGrams: "1000", price: "" }] }] })}
        className={adminSecondaryButtonClass}
      >
        <Plus className="h-3.5 w-3.5" /> Agregar zona
      </button>
      <p className="text-xs text-stone-500">
        Un código postal que no está en ninguna zona no puede elegir este envío. El CP de 4 dígitos se toma también del CPA (C1043AAB → 1043).
      </p>
    </div>
  );
}
