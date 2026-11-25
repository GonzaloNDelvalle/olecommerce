"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, RotateCcw } from "lucide-react";
import { saveAdminSiteTexts } from "@/modules/admin/actions/admin-texts.actions";
import {
  TEXT_DEFINITIONS,
  TEXT_KEYS,
  type SiteTexts,
  type TextDefinition,
  type TextKey,
} from "@/modules/content/texts";
import {
  AdminCard,
  AdminNotice,
  adminInputClass,
  adminLabelClass,
  adminPrimaryButtonClass,
} from "@/modules/admin/components/AdminUi";

export function SiteTextsForm({ initial }: { initial: SiteTexts }) {
  const router = useRouter();
  const [values, setValues] = useState(initial);
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const groups = new Map<string, TextKey[]>();
  for (const key of TEXT_KEYS) {
    const group = TEXT_DEFINITIONS[key].group;
    groups.set(group, [...(groups.get(group) ?? []), key]);
  }

  function save() {
    setMessage(null);
    startTransition(async () => {
      const result = await saveAdminSiteTexts(values);
      setMessage(
        result.success
          ? { tone: "success", text: result.message }
          : { tone: "error", text: result.error }
      );
      if (result.success) router.refresh();
    });
  }

  const renderField = (key: TextKey) => {
    const definition: TextDefinition = TEXT_DEFINITIONS[key];
    const changed = values[key] !== definition.default;
    const set = (value: string) => setValues((current) => ({ ...current, [key]: value }));
    return (
      <div key={key}>
        <div className="flex items-center justify-between gap-3">
          <label htmlFor={key} className={adminLabelClass}>
            {definition.label}
          </label>
          {changed && (
            <button
              type="button"
              onClick={() => set(definition.default)}
              className="inline-flex items-center gap-1 text-[11px] text-stone-500 hover:text-stone-900"
            >
              <RotateCcw className="h-3 w-3" /> Volver al original
            </button>
          )}
        </div>
        {definition.multiline ? (
          <textarea
            id={key}
            rows={definition.max > 300 ? 4 : 2}
            maxLength={definition.max}
            value={values[key]}
            onChange={(e) => set(e.target.value)}
            className={`mt-1.5 ${adminInputClass}`}
          />
        ) : (
          <input
            id={key}
            type="text"
            maxLength={definition.max}
            value={values[key]}
            onChange={(e) => set(e.target.value)}
            className={`mt-1.5 ${adminInputClass}`}
          />
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {message && <AdminNotice tone={message.tone}>{message.text}</AdminNotice>}

      <p className="text-sm text-stone-600">
        El banner, la campaña, el bloque del newsletter («Manifiesto») y la barra de anuncios se editan en{" "}
        <Link href="/admin/contenido" className="font-medium underline underline-offset-4">
          Contenido
        </Link>
        . Si dejás un texto vacío, no se muestra. Podés usar {"{coleccion}"}, {"{temporada}"} y {"{descuento}"}.
      </p>

      {[...groups.entries()].map(([group, keys]) => (
        <AdminCard key={group} title={group}>
          <div className="space-y-4">{keys.map(renderField)}</div>
        </AdminCard>
      ))}

      <div className="sticky bottom-4 flex justify-end">
        <button type="button" onClick={save} disabled={isPending} className={`${adminPrimaryButtonClass} shadow-lg`}>
          {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          Publicar textos
        </button>
      </div>
    </div>
  );
}
