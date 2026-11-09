import { Suspense } from "react";
import { getAdminShippingMethods } from "@/modules/admin/actions/admin-settings.actions";
import { ShippingMethodsManager } from "@/modules/admin/components/ShippingMethodsManager";
import {
  AdminPageHeader,
  AdminSkeleton,
} from "@/modules/admin/components/AdminUi";

async function ShippingContent() {
  const methods = await getAdminShippingMethods();
  return <ShippingMethodsManager methods={methods} />;
}

export default function AdminShippingPage() {
  return (
    <div className="max-w-5xl">
      <AdminPageHeader
        title="Envíos"
        description="Métodos de entrega que ve la clienta en el checkout. El costo se calcula en el servidor según el subtotal y la provincia."
      />
      <Suspense fallback={<AdminSkeleton />}>
        <ShippingContent />
      </Suspense>
    </div>
  );
}
