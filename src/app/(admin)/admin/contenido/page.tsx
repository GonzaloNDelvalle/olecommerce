import { Suspense } from "react";
import {
  getAdminAnnouncements,
  getAdminProductImages,
  getAdminSiteContent,
} from "@/modules/admin/actions/admin-content.actions";
import { SiteContentForm } from "@/modules/admin/components/SiteContentForm";
import { AnnouncementsManager } from "@/modules/admin/components/AnnouncementsManager";
import {
  AdminPageHeader,
  AdminSkeleton,
} from "@/modules/admin/components/AdminUi";

async function ContentEditor() {
  const [content, announcements, productImages] = await Promise.all([
    getAdminSiteContent(),
    getAdminAnnouncements(),
    getAdminProductImages(),
  ]);
  return (
    <div className="space-y-10">
      <SiteContentForm initial={content} productImages={productImages} />
      <AnnouncementsManager messages={announcements} />
    </div>
  );
}

export default function AdminContentPage() {
  return (
    <div className="max-w-4xl">
      <AdminPageHeader
        title="Contenido de la tienda"
        description="Temporada, banner de la portada y barra de anuncios. Los cambios se publican al instante, sin depender de un desarrollador."
      />
      <Suspense fallback={<AdminSkeleton />}>
        <ContentEditor />
      </Suspense>
    </div>
  );
}
