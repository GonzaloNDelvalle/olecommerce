import { Suspense } from "react";
import { getAdminSiteTexts } from "@/modules/admin/actions/admin-texts.actions";
import { SiteTextsForm } from "@/modules/admin/components/SiteTextsForm";
import { AdminPageHeader, AdminSkeleton } from "@/modules/admin/components/AdminUi";

async function TextsEditor() {
  return <SiteTextsForm initial={await getAdminSiteTexts()} />;
}

export default function AdminTextsPage() {
  return (
    <div className="max-w-4xl">
      <AdminPageHeader
        title="Textos de la tienda"
        description="Títulos y descripciones de todas las pantallas. Los cambios se publican al instante."
      />
      <Suspense fallback={<AdminSkeleton />}>
        <TextsEditor />
      </Suspense>
    </div>
  );
}
