import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/lib/db";
import { CACHE_TAGS } from "@/lib/cache-tags";
import type { ShippingRule } from "@/modules/orders/pricing";

/**
 * Configuración de la tienda (datos de contacto, transferencia bancaria) y
 * métodos de envío, editables desde el panel de administración.
 */

export interface StoreSettingsDTO {
  storeName: string;
  supportEmail: string;
  whatsappNumber: string | null;
  instagramUrl: string | null;
  showroomAddress: string | null;
  bankTransferEnabled: boolean;
  bankTransferDiscountPercentage: number;
  bankName: string | null;
  bankAccountHolder: string | null;
  bankCuit: string | null;
  bankCbu: string | null;
  bankAlias: string | null;
}

const DEFAULT_SETTINGS: StoreSettingsDTO = {
  storeName: "OL. Indumenti",
  supportEmail: "hola@olecommerce.com.ar",
  whatsappNumber: null,
  instagramUrl: null,
  showroomAddress: null,
  bankTransferEnabled: false,
  bankTransferDiscountPercentage: 0,
  bankName: null,
  bankAccountHolder: null,
  bankCuit: null,
  bankCbu: null,
  bankAlias: null,
};

/**
 * Lectura directa (sin caché). Para emails y contextos fuera del render.
 */
export async function readStoreSettings(): Promise<StoreSettingsDTO> {
  const row = await db.storeSettings.findUnique({ where: { id: 1 } });
  if (!row) return DEFAULT_SETTINGS;
  return {
    storeName: row.storeName,
    supportEmail: row.supportEmail,
    whatsappNumber: row.whatsappNumber,
    instagramUrl: row.instagramUrl,
    showroomAddress: row.showroomAddress,
    bankTransferEnabled: row.bankTransferEnabled,
    bankTransferDiscountPercentage: row.bankTransferDiscountPercentage,
    bankName: row.bankName,
    bankAccountHolder: row.bankAccountHolder,
    bankCuit: row.bankCuit,
    bankCbu: row.bankCbu,
    bankAlias: row.bankAlias,
  };
}

/** Lectura cacheada para páginas y checkout. Se invalida al editar desde el admin. */
export async function getStoreSettings(): Promise<StoreSettingsDTO> {
  "use cache";
  cacheLife("days");
  cacheTag(CACHE_TAGS.storeSettings);
  return readStoreSettings();
}

/** Transferencia habilitada y con datos bancarios completos. */
export function isBankTransferAvailable(settings: StoreSettingsDTO): boolean {
  return Boolean(
    settings.bankTransferEnabled &&
      settings.bankCbu &&
      settings.bankAlias &&
      settings.bankAccountHolder
  );
}

export async function getActiveShippingMethods(): Promise<ShippingRule[]> {
  "use cache";
  cacheLife("days");
  cacheTag(CACHE_TAGS.shippingMethods);

  const methods = await db.shippingMethod.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

  return methods.map((method) => ({
    id: method.id,
    name: method.name,
    description: method.description,
    type: method.type,
    price: Number(method.price),
    freeShippingThreshold:
      method.freeShippingThreshold === null
        ? null
        : Number(method.freeShippingThreshold),
    estimatedDelivery: method.estimatedDelivery,
    provinces: method.provinces,
  }));
}
