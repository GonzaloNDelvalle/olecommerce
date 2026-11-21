import { Suspense } from "react";
import {
  getAdminCollectionProducts,
  getAdminCollections,
} from "@/modules/admin/actions/admin-collections.actions";
import { CollectionsManager } from "@/modules/admin/components/CollectionsManager";
import { AdminPageHeader, AdminSkeleton } from "@/modules/admin/components/AdminUi";

async function CollectionsEditor() {
  const [collections, products] = await Promise.all([getAdminCollections(), getAdminCollectionProducts()]);
  return <CollectionsManager collections={collections} products={products} />;
}

export default function AdminCollectionsPage() {
  return (
    <div className="max-w-4xl">
      <AdminPageHeader
        title="Colecciones"
        description="Agrupá productos de varias categorías bajo una colección (ej: Mutare). Tienen su propia página en la tienda."
      />
      <Suspense fallback={<AdminSkeleton />}>
        <CollectionsEditor />
      </Suspense>
    </div>
  );
}
