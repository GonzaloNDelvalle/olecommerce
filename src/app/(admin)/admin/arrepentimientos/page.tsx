import { Suspense } from "react";
import { getAdminRevocations } from "@/modules/admin/actions/admin-revocations.actions";
import { RevocationsTable } from "@/modules/admin/components/RevocationsTable";
import {
  AdminPageHeader,
  AdminSkeleton,
} from "@/modules/admin/components/AdminUi";

async function RevocationsContent() {
  const requests = await getAdminRevocations();
  return <RevocationsTable requests={requests} />;
}

export default function AdminRevocationsPage() {
  return (
    <div className="max-w-6xl">
      <AdminPageHeader
        title="Botón de arrepentimiento"
        description="Solicitudes de revocación (Res. 424/2020). Cada una tiene el código que se le informó a la clienta."
      />
      <Suspense fallback={<AdminSkeleton />}>
        <RevocationsContent />
      </Suspense>
    </div>
  );
}
