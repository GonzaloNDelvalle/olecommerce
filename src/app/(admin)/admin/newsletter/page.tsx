import { Suspense } from "react";
import { Download } from "lucide-react";
import { getAdminNewsletterOverview } from "@/modules/admin/actions/admin-newsletter.actions";
import {
  AdminCard,
  AdminPageHeader,
  AdminSkeleton,
  adminPrimaryButtonClass,
} from "@/modules/admin/components/AdminUi";

const dateFormatter = new Intl.DateTimeFormat("es-AR", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "America/Argentina/Buenos_Aires",
});

async function NewsletterContent() {
  const overview = await getAdminNewsletterOverview();

  const stats = [
    { label: "Suscriptoras activas", value: overview.subscribedCount },
    { label: "Nuevas (últimos 30 días)", value: overview.last30DaysCount },
    { label: "Dadas de baja", value: overview.unsubscribedCount },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-stone-200 bg-white p-5 shadow-2xs"
          >
            <p className="text-[11px] font-semibold tracking-wider text-stone-500 uppercase">
              {stat.label}
            </p>
            <p className="mt-2 text-3xl font-semibold text-stone-900">
              {stat.value.toLocaleString("es-AR")}
            </p>
          </div>
        ))}
      </div>

      <AdminCard>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold tracking-wide text-stone-900 uppercase">
              Suscriptoras
            </h2>
            <p className="mt-1 text-xs text-stone-500">
              Exportá el listado para importarlo en tu herramienta de envíos
              (Mailchimp, Brevo, Resend). Solo incluye las activas.
            </p>
          </div>
          <a href="/admin/newsletter/export" className={adminPrimaryButtonClass}>
            <Download className="h-4 w-4" /> Exportar CSV
          </a>
        </div>

        {overview.subscribers.length === 0 ? (
          <p className="text-sm text-stone-500">
            Todavía no hay suscriptoras. Aparecen acá cuando alguien se suscribe
            desde la portada.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-[11px] tracking-wider text-stone-500 uppercase">
                <tr>
                  <th className="py-2 pr-4 font-semibold">Email</th>
                  <th className="py-2 pr-4 font-semibold">Suscripción</th>
                  <th className="py-2 pr-4 font-semibold">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {overview.subscribers.map((subscriber) => (
                  <tr key={subscriber.id}>
                    <td className="py-2.5 pr-4 text-stone-900">{subscriber.email}</td>
                    <td className="py-2.5 pr-4 text-stone-600">
                      {dateFormatter.format(new Date(subscriber.consentAt))}
                    </td>
                    <td className="py-2.5 pr-4">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                          subscriber.status === "SUBSCRIBED"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-stone-100 text-stone-500"
                        }`}
                      >
                        {subscriber.status === "SUBSCRIBED" ? "Activa" : "Baja"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {overview.subscribers.length === 200 && (
              <p className="mt-3 text-xs text-stone-500">
                Se muestran las 200 más recientes. El CSV incluye todas las activas.
              </p>
            )}
          </div>
        )}
      </AdminCard>
    </div>
  );
}

export default function AdminNewsletterPage() {
  return (
    <div className="max-w-5xl">
      <AdminPageHeader
        title="Newsletter"
        description="Personas que se suscribieron desde la portada. Los textos del banner se editan en Contenido."
      />
      <Suspense fallback={<AdminSkeleton />}>
        <NewsletterContent />
      </Suspense>
    </div>
  );
}
