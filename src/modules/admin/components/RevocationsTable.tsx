"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import {
  updateAdminRevocation,
  type AdminRevocationDTO,
} from "@/modules/admin/actions/admin-revocations.actions";
import {
  AdminCard,
  AdminNotice,
  adminInputClass,
  adminSecondaryButtonClass,
} from "@/modules/admin/components/AdminUi";

const STATUS_LABELS: Record<AdminRevocationDTO["status"], string> = {
  RECEIVED: "Recibida",
  IN_PROGRESS: "En gestión",
  RESOLVED: "Reintegrada",
  REJECTED: "Rechazada",
};

const STATUS_STYLES: Record<AdminRevocationDTO["status"], string> = {
  RECEIVED: "bg-amber-50 text-amber-800",
  IN_PROGRESS: "bg-sky-50 text-sky-800",
  RESOLVED: "bg-emerald-50 text-emerald-700",
  REJECTED: "bg-stone-100 text-stone-600",
};

const dateFormatter = new Intl.DateTimeFormat("es-AR", {
  dateStyle: "short",
  timeStyle: "short",
});

function RevocationRow({ request }: { request: AdminRevocationDTO }) {
  const router = useRouter();
  const [status, setStatus] = useState(request.status);
  const [notes, setNotes] = useState(request.adminNotes ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const isDirty = status !== request.status || notes !== (request.adminNotes ?? "");

  function save() {
    setError(null);
    startTransition(async () => {
      const result = await updateAdminRevocation({
        id: request.id,
        status,
        adminNotes: notes,
      });
      if (!result.success) setError(result.error);
      else router.refresh();
    });
  }

  return (
    <tr className="align-top">
      <td className="py-3 pr-4">
        <span className="font-mono text-xs font-semibold text-stone-900">
          {request.code}
        </span>
        <span className="block text-xs text-stone-500">
          {dateFormatter.format(new Date(request.createdAt))}
        </span>
      </td>
      <td className="py-3 pr-4 text-sm">
        {request.orderId ? (
          <Link
            href={`/admin/ordenes/${request.orderId}`}
            className="font-medium text-stone-900 underline-offset-2 hover:underline"
          >
            #{request.orderNumber}
          </Link>
        ) : (
          <span className="text-red-700">#{request.orderNumber} (no encontrada)</span>
        )}
        <span className="block text-xs text-stone-500">{request.email}</span>
      </td>
      <td className="max-w-xs py-3 pr-4 text-xs text-stone-600">
        {request.reason || "—"}
      </td>
      <td className="py-3 pr-4">
        <span
          className={`mb-2 inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${STATUS_STYLES[request.status]}`}
        >
          {STATUS_LABELS[request.status]}
        </span>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as AdminRevocationDTO["status"])}
          className={adminInputClass}
          aria-label={`Estado de ${request.code}`}
        >
          {Object.entries(STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </td>
      <td className="py-3 pr-4">
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          placeholder="Notas internas"
          className={`${adminInputClass} min-w-48 text-xs`}
        />
        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      </td>
      <td className="py-3">
        <button
          type="button"
          onClick={save}
          disabled={!isDirty || isPending}
          className={adminSecondaryButtonClass}
        >
          {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          Guardar
        </button>
      </td>
    </tr>
  );
}

export function RevocationsTable({ requests }: { requests: AdminRevocationDTO[] }) {
  const pending = requests.filter((r) => r.status === "RECEIVED").length;

  return (
    <div className="space-y-4">
      {pending > 0 && (
        <AdminNotice tone="warning">
          Hay {pending} solicitud(es) sin gestionar. La Res. 424/2020 pide
          responder dentro de las 24 h hábiles.
        </AdminNotice>
      )}
      <AdminCard>
        {requests.length === 0 ? (
          <p className="text-sm text-stone-500">No hay solicitudes de arrepentimiento.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="text-[11px] tracking-wider text-stone-500 uppercase">
                <tr>
                  <th className="py-2 pr-4 font-semibold">Código</th>
                  <th className="py-2 pr-4 font-semibold">Orden</th>
                  <th className="py-2 pr-4 font-semibold">Motivo</th>
                  <th className="py-2 pr-4 font-semibold">Estado</th>
                  <th className="py-2 pr-4 font-semibold">Notas</th>
                  <th className="py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {requests.map((request) => (
                  <RevocationRow key={request.id} request={request} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AdminCard>
    </div>
  );
}
