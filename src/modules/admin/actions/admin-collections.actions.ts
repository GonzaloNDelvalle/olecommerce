"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-guards";
import { CACHE_TAGS, expireTagsNow } from "@/lib/cache-tags";

export type CollectionMutationResult =
  | { success: true; message: string }
  | { success: false; error: string };

export interface AdminCollectionDTO {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  isActive: boolean;
  productIds: string[];
}

export interface AdminCollectionProductDTO {
  id: string;
  name: string;
  categoryName: string;
  imageUrl: string | null;
  /** Colección a la que pertenece hoy (un producto está en una sola). */
  collectionId: string | null;
}

function slugify(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const collectionSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(2, "Escribí el nombre de la colección").max(100),
  description: z
    .string()
    .trim()
    .max(90, "La bajada admite hasta 90 caracteres")
    .transform((value) => (value === "" ? null : value))
    .nullable(),
  isActive: z.boolean(),
  productIds: z.array(z.string().uuid()).max(500),
});

export type CollectionInput = z.input<typeof collectionSchema>;

export async function getAdminCollections(): Promise<AdminCollectionDTO[]> {
  await requireAdmin();

  const collections = await db.collection.findMany({
    orderBy: { name: "asc" },
    include: { products: { select: { id: true } } },
  });
  return collections.map((collection) => ({
    id: collection.id,
    name: collection.name,
    slug: collection.slug,
    description: collection.description,
    isActive: collection.isActive,
    productIds: collection.products.map((product) => product.id),
  }));
}

/** Productos (no archivados) para armar colecciones. */
export async function getAdminCollectionProducts(): Promise<AdminCollectionProductDTO[]> {
  await requireAdmin();

  const products = await db.product.findMany({
    where: { status: { not: "ARCHIVED" } },
    orderBy: [{ category: { name: "asc" } }, { name: "asc" }],
    take: 500,
    select: {
      id: true,
      name: true,
      collectionId: true,
      category: { select: { name: true } },
      images: { orderBy: { position: "asc" }, take: 1, select: { url: true } },
    },
  });
  return products.map((product) => ({
    id: product.id,
    name: product.name,
    categoryName: product.category.name,
    imageUrl: product.images[0]?.url ?? null,
    collectionId: product.collectionId,
  }));
}

export async function saveAdminCollection(
  input: CollectionInput
): Promise<CollectionMutationResult> {
  await requireAdmin();

  const parsed = collectionSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Revisá los datos." };
  }
  const { id, productIds, ...data } = parsed.data;
  const ids = [...new Set(productIds)];

  try {
    if (id) {
      await db.$transaction([
        db.collection.update({ where: { id }, data }),
        // Los que ya no están elegidos salen de la colección
        db.product.updateMany({
          where: { collectionId: id, id: { notIn: ids } },
          data: { collectionId: null },
        }),
        db.product.updateMany({ where: { id: { in: ids } }, data: { collectionId: id } }),
      ]);
    } else {
      const slug = slugify(data.name);
      if (!slug) return { success: false, error: "El nombre no permite generar un link válido." };
      if (await db.collection.findUnique({ where: { slug }, select: { id: true } })) {
        return { success: false, error: `Ya existe una colección con el link "${slug}".` };
      }
      const created = await db.collection.create({ data: { ...data, slug } });
      await db.product.updateMany({ where: { id: { in: ids } }, data: { collectionId: created.id } });
    }
  } catch (error) {
    console.error("[saveAdminCollection] Error:", error);
    return { success: false, error: "No se pudo guardar la colección." };
  }

  expireTagsNow(CACHE_TAGS.catalog, CACHE_TAGS.siteContent);
  revalidatePath("/admin/colecciones");
  revalidatePath("/admin/productos");
  return { success: true, message: id ? "Colección actualizada." : "Colección creada." };
}

export async function deleteAdminCollection(id: string): Promise<CollectionMutationResult> {
  await requireAdmin();
  if (!z.string().uuid().safeParse(id).success) {
    return { success: false, error: "Colección inválida." };
  }
  // Los productos quedan sin colección (onDelete: SetNull), conservan su categoría
  await db.collection.deleteMany({ where: { id } });

  expireTagsNow(CACHE_TAGS.catalog, CACHE_TAGS.siteContent);
  revalidatePath("/admin/colecciones");
  revalidatePath("/admin/productos");
  return { success: true, message: "Colección eliminada. Sus productos siguen en la tienda." };
}
