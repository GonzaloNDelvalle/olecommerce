import { Suspense } from "react";
import {
  getAdminOutfits,
  getAdminProductImages,
} from "@/modules/admin/actions/admin-content.actions";
import { OutfitsManager } from "@/modules/admin/components/OutfitsManager";
import {
  AdminPageHeader,
  AdminSkeleton,
} from "@/modules/admin/components/AdminUi";

async function OutfitsEditor() {
  const [outfits, products] = await Promise.all([getAdminOutfits(), getAdminProductImages()]);
  return <OutfitsManager outfits={outfits} products={products} />;
}

export default function AdminOutfitsPage() {
  return (
    <div className="max-w-4xl">
      <AdminPageHeader
        title="Outfits"
        description="Armá looks con una foto y los productos que los componen. Se publican en la portada («Shop the look»)."
      />
      <Suspense fallback={<AdminSkeleton />}>
        <OutfitsEditor />
      </Suspense>
    </div>
  );
}
