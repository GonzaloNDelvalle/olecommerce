import { Suspense } from "react";
import { getAdminStoreSettings } from "@/modules/admin/actions/admin-settings.actions";
import { StoreSettingsForm } from "@/modules/admin/components/StoreSettingsForm";
import {
  AdminPageHeader,
  AdminSkeleton,
} from "@/modules/admin/components/AdminUi";

async function SettingsContent() {
  const settings = await getAdminStoreSettings();
  return <StoreSettingsForm initial={settings} />;
}

export default function AdminSettingsPage() {
  return (
    <div className="max-w-4xl">
      <AdminPageHeader
        title="Configuración de la tienda"
        description="Datos de contacto y de transferencia bancaria que se muestran en el checkout y en los emails."
      />
      <Suspense fallback={<AdminSkeleton />}>
        <SettingsContent />
      </Suspense>
    </div>
  );
}
