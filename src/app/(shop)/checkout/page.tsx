import { Suspense } from "react";
import type { Metadata } from "next";
import { PaymentRetryBanner } from "@/modules/orders/components/PaymentRetryBanner";
import { CheckoutForm } from "@/modules/orders/components/CheckoutForm";
import {
  getActiveShippingMethods,
  getStoreSettings,
  isBankTransferAvailable,
} from "@/modules/settings/store-settings";

export const metadata: Metadata = {
  title: "Finalizar compra",
  robots: { index: false, follow: false },
};

/**
 * Los métodos de envío y los datos de transferencia salen de la configuración
 * de la tienda (editable en /admin/envios y /admin/configuracion).
 */
export default async function CheckoutPage() {
  const [settings, shippingMethods] = await Promise.all([
    getStoreSettings(),
    getActiveShippingMethods(),
  ]);

  return (
    <>
      <Suspense fallback={null}>
        <PaymentRetryBanner />
      </Suspense>
      <CheckoutForm
        shippingMethods={shippingMethods}
        bankTransfer={{
          enabled: isBankTransferAvailable(settings),
          discountPercentage: settings.bankTransferDiscountPercentage,
        }}
        showroomAddress={settings.showroomAddress}
      />
    </>
  );
}
