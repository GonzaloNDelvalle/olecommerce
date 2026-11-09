"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { ShippingMethodType } from "@prisma/client";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-guards";
import { CACHE_TAGS, expireTagsNow } from "@/lib/cache-tags";
import {
  readStoreSettings,
  type StoreSettingsDTO,
} from "@/modules/settings/store-settings";
import { ARGENTINA_PROVINCES } from "@/modules/orders/schemas/checkout.schema";

export type AdminMutationResult =
  | { success: true; message: string }
  | { success: false; error: string };

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((value) => (value === "" ? null : value))
    .nullable();

// ==========================================
// CONFIGURACIÓN DE TIENDA
// ==========================================

const storeSettingsSchema = z
  .object({
    storeName: z.string().trim().min(2, "Ingresá el nombre de la tienda").max(120),
    supportEmail: z.string().trim().email("Ingresá un email válido"),
    whatsappNumber: optionalText(40),
    instagramUrl: optionalText(255).refine(
      (value) => value === null || value.startsWith("https://"),
      "La URL de Instagram debe empezar con https://"
    ),
    showroomAddress: optionalText(255),
    bankTransferEnabled: z.boolean(),
    bankTransferDiscountPercentage: z.number().int().min(0).max(50),
    bankName: optionalText(120),
    bankAccountHolder: optionalText(150),
    bankCuit: optionalText(20),
    bankCbu: optionalText(30).refine(
      (value) => value === null || /^\d{22}$/.test(value),
      "El CBU/CVU debe tener 22 números"
    ),
    bankAlias: optionalText(60),
  })
  .superRefine((data, ctx) => {
    if (!data.bankTransferEnabled) return;
    for (const field of ["bankAccountHolder", "bankCbu", "bankAlias"] as const) {
      if (!data[field]) {
        ctx.addIssue({
          code: "custom",
          path: [field],
          message: "Obligatorio para habilitar la transferencia",
        });
      }
    }
  });

export type StoreSettingsInput = z.input<typeof storeSettingsSchema>;

export async function getAdminStoreSettings(): Promise<StoreSettingsDTO> {
  await requireAdmin();
  return readStoreSettings();
}

export async function updateAdminStoreSettings(
  input: StoreSettingsInput
): Promise<AdminMutationResult> {
  await requireAdmin();

  const parsed = storeSettingsSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Revisá los datos.",
    };
  }

  await db.storeSettings.upsert({
    where: { id: 1 },
    update: parsed.data,
    create: { id: 1, ...parsed.data },
  });

  expireTagsNow(CACHE_TAGS.storeSettings);
  revalidatePath("/admin/configuracion");
  return { success: true, message: "Configuración guardada." };
}

// ==========================================
// MÉTODOS DE ENVÍO
// ==========================================

export interface AdminShippingMethodDTO {
  id: string;
  name: string;
  description: string | null;
  type: ShippingMethodType;
  price: number;
  freeShippingThreshold: number | null;
  estimatedDelivery: string | null;
  provinces: string[];
  isActive: boolean;
  sortOrder: number;
  ordersCount: number;
}

const shippingMethodSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(2, "Ingresá un nombre").max(120),
  description: optionalText(255),
  type: z.nativeEnum(ShippingMethodType),
  price: z.number().min(0, "El costo no puede ser negativo").max(10_000_000),
  freeShippingThreshold: z.number().positive().nullable(),
  estimatedDelivery: optionalText(80),
  provinces: z.array(z.enum(ARGENTINA_PROVINCES)).max(24),
  isActive: z.boolean(),
  sortOrder: z.number().int().min(0).max(999),
});

export type ShippingMethodInput = z.input<typeof shippingMethodSchema>;

export async function getAdminShippingMethods(): Promise<AdminShippingMethodDTO[]> {
  await requireAdmin();

  const methods = await db.shippingMethod.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: { _count: { select: { orders: true } } },
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
    isActive: method.isActive,
    sortOrder: method.sortOrder,
    ordersCount: method._count.orders,
  }));
}

export async function saveAdminShippingMethod(
  input: ShippingMethodInput
): Promise<AdminMutationResult> {
  await requireAdmin();

  const parsed = shippingMethodSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Revisá los datos del envío.",
    };
  }

  const { id, ...data } = parsed.data;
  if (id) {
    await db.shippingMethod.update({ where: { id }, data });
  } else {
    await db.shippingMethod.create({ data });
  }

  expireTagsNow(CACHE_TAGS.shippingMethods);
  revalidatePath("/admin/envios");
  return {
    success: true,
    message: id ? "Método de envío actualizado." : "Método de envío creado.",
  };
}

/**
 * Elimina un método sin órdenes; si ya se usó, lo desactiva para conservar
 * el historial.
 */
export async function deleteAdminShippingMethod(
  id: string
): Promise<AdminMutationResult> {
  await requireAdmin();

  const used = await db.order.count({ where: { shippingMethodId: id } });
  if (used > 0) {
    await db.shippingMethod.update({
      where: { id },
      data: { isActive: false },
    });
  } else {
    await db.shippingMethod.delete({ where: { id } });
  }

  expireTagsNow(CACHE_TAGS.shippingMethods);
  revalidatePath("/admin/envios");
  return {
    success: true,
    message:
      used > 0
        ? "El método tiene órdenes asociadas: se desactivó en lugar de borrarse."
        : "Método de envío eliminado.",
  };
}
