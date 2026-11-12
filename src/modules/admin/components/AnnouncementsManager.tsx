"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CalendarClock, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import {
  deleteAdminAnnouncement,
  saveAdminAnnouncement,
  type AdminAnnouncementDTO,
} from "@/modules/admin/actions/admin-content.actions";
import {
  AdminCard,
  AdminNotice,
  adminInputClass,
  adminLabelClass,
  adminPrimaryButtonClass,
  adminSecondaryButtonClass,
} from "@/modules/admin/components/AdminUi";

type Draft = {
  id?: string;
  text: string;
  linkUrl: string;
  isActive: boolean;
  sortOrder: string;
  startsAt: string; // valor de <input type="datetime-local"> (hora local)
  endsAt: string;
};

const EMPTY: Draft = {
  text: "",
  linkUrl: "",
  isActive: true,
  sortOrder: "0",
  startsAt: "",
  endsAt: "",
};

/** ISO → "YYYY-MM-DDTHH:mm" en la hora local del navegador. */
function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function toIso(local: string): string | null {
  return local ? new Date(local).toISOString() : null;
}

const dateFormatter = new Intl.DateTimeFormat("es-AR", {
  dateStyle: "short",
  timeStyle: "short",
});

function scheduleLabel(message: AdminAnnouncementDTO): string | null {
  if (!message.startsAt && !message.endsAt) return null;
  const from = message.startsAt
    ? `desde ${dateFormatter.format(new Date(message.startsAt))}`
    : "";
  const to = message.endsAt
    ? `hasta ${dateFormatter.format(new Date(message.endsAt))}`
    : "";
  return [from, to].filter(Boolean).join(" ");
}

export function AnnouncementsManager({
  messages,
}: {
  messages: AdminAnnouncementDTO[];
}) {
  const router = useRouter();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [notice, setNotice] = useState<
    { tone: "success" | "error"; text: string } | null
  >(null);
  const [isPending, startTransition] = useTransition();

  function update<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((current) => (current ? { ...current, [key]: value } : current));
  }

  function edit(message: AdminAnnouncementDTO) {
    setNotice(null);
    setDraft({
      id: message.id,
      text: message.text,
      linkUrl: message.linkUrl ?? "",
      isActive: message.isActive,
      sortOrder: String(message.sortOrder),
      startsAt: toLocalInput(message.startsAt),
      endsAt: toLocalInput(message.endsAt),
    });
  }

  function save() {
    if (!draft) return;
    startTransition(async () => {
      const result = await saveAdminAnnouncement({
        id: draft.id,
        text: draft.text,
        linkUrl: draft.linkUrl,
        isActive: draft.isActive,
        sortOrder: Number(draft.sortOrder) || 0,
        startsAt: toIso(draft.startsAt),
        endsAt: toIso(draft.endsAt),
      });
      if (result.success) {
        setDraft(null);
        setNotice({ tone: "success", text: result.message });
        router.refresh();
      } else {
        setNotice({ tone: "error", text: result.error });
      }
    });
  }

  function remove(message: AdminAnnouncementDTO) {
    if (!window.confirm(`¿Eliminar "${message.text}"?`)) return;
    startTransition(async () => {
      const result = await deleteAdminAnnouncement(message.id);
      setNotice(
        result.success
          ? { tone: "success", text: result.message }
          : { tone: "error", text: result.error }
      );
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      {notice && <AdminNotice tone={notice.tone}>{notice.text}</AdminNotice>}

      <AdminCard>
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold tracking-wide text-stone-900 uppercase">
              Mensajes de la barra
            </h2>
            <p className="mt-1 text-xs text-stone-500">
              Rotan en orden. Con fechas, un mensaje aparece y se oculta solo
              (ideal para Hot Sale o Black Friday).
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setNotice(null);
              setDraft({ ...EMPTY, sortOrder: String(messages.length + 1) });
            }}
            className={adminSecondaryButtonClass}
          >
            <Plus className="h-3.5 w-3.5" /> Nuevo mensaje
          </button>
        </div>

        {messages.length === 0 ? (
          <p className="text-sm text-stone-500">Todavía no hay mensajes.</p>
        ) : (
          <ul className="divide-y divide-stone-100">
            {messages.map((message) => {
              const schedule = scheduleLabel(message);
              return (
                <li key={message.id} className="flex items-center gap-3 py-3">
                  <span className="w-6 text-xs text-stone-400">{message.sortOrder}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-stone-900">{message.text}</p>
                    <p className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] text-stone-500">
                      {message.linkUrl && <span>→ {message.linkUrl}</span>}
                      {schedule && (
                        <span className="inline-flex items-center gap-1">
                          <CalendarClock className="h-3 w-3" /> {schedule}
                        </span>
                      )}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                      message.isActive
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-stone-100 text-stone-500"
                    }`}
                  >
                    {message.isActive ? "Activo" : "Pausado"}
                  </span>
                  <button
                    type="button"
                    onClick={() => edit(message)}
                    aria-label={`Editar "${message.text}"`}
                    className="rounded-lg p-1.5 text-stone-500 hover:bg-stone-100 hover:text-stone-900"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(message)}
                    disabled={isPending}
                    aria-label={`Eliminar "${message.text}"`}
                    className="rounded-lg p-1.5 text-stone-400 hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </AdminCard>

      {draft && (
        <AdminCard title={draft.id ? "Editar mensaje" : "Nuevo mensaje"}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="ann-text" className={adminLabelClass}>
                Mensaje ({draft.text.length}/160)
              </label>
              <input
                id="ann-text"
                maxLength={160}
                value={draft.text}
                onChange={(e) => update("text", e.target.value)}
                placeholder="Envío gratis desde $250.000 • 3 cuotas sin interés"
                className={`mt-1.5 ${adminInputClass}`}
              />
            </div>
            <div>
              <label htmlFor="ann-link" className={adminLabelClass}>
                Link (opcional)
              </label>
              <input
                id="ann-link"
                value={draft.linkUrl}
                onChange={(e) => update("linkUrl", e.target.value)}
                placeholder="/productos?categoria=denim"
                className={`mt-1.5 ${adminInputClass}`}
              />
            </div>
            <div>
              <label htmlFor="ann-order" className={adminLabelClass}>
                Orden
              </label>
              <input
                id="ann-order"
                type="number"
                min={0}
                value={draft.sortOrder}
                onChange={(e) => update("sortOrder", e.target.value)}
                className={`mt-1.5 ${adminInputClass}`}
              />
            </div>
            <div>
              <label htmlFor="ann-start" className={adminLabelClass}>
                Mostrar desde (opcional)
              </label>
              <input
                id="ann-start"
                type="datetime-local"
                value={draft.startsAt}
                onChange={(e) => update("startsAt", e.target.value)}
                className={`mt-1.5 ${adminInputClass}`}
              />
            </div>
            <div>
              <label htmlFor="ann-end" className={adminLabelClass}>
                Mostrar hasta (opcional)
              </label>
              <input
                id="ann-end"
                type="datetime-local"
                value={draft.endsAt}
                onChange={(e) => update("endsAt", e.target.value)}
                className={`mt-1.5 ${adminInputClass}`}
              />
            </div>
            <label className="inline-flex items-center gap-2 text-sm text-stone-700">
              <input
                type="checkbox"
                checked={draft.isActive}
                onChange={(e) => update("isActive", e.target.checked)}
                className="h-4 w-4 rounded border-stone-300"
              />
              Activo
            </label>
          </div>
          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={save}
              disabled={isPending}
              className={adminPrimaryButtonClass}
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Guardar mensaje
            </button>
            <button
              type="button"
              onClick={() => setDraft(null)}
              className={adminSecondaryButtonClass}
            >
              Cancelar
            </button>
          </div>
        </AdminCard>
      )}
    </div>
  );
}
