"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { ProductStatus } from "@prisma/client";
import {
  createProductFormSchema,
  type CreateProductFormValues,
} from "@/modules/admin/schemas/product-form.schema";

export interface AdminCatalogProductDTO {
  id: string;
  name: string;
  slug: string;
  status: ProductStatus;
  basePrice: number;
  compareAtPrice: number | null;
  discountPercentage: number;
  weightInGrams: number;
  categoryName: string;
  collectionName: string | null;
  primaryImageUrl: string | null;
  galleryImagesCount: number;
  variantsCount: number;
  totalPhysicalStock: number;
  totalReservedStock: number;
  totalAvailableStock: number;
  variants: {
    id: string;
    sku: string;
    sizeName: string;
    colorName: string;
    colorHex: string;
    stock: number;
    reservedStock: number;
    availableStock: number;
    imageUrl: string | null;
  }[];
  createdAt: string;
}

export interface AdminProductFormCatalogsDTO {
  categories: { id: string; name: string }[];
  collections: { id: string; name: string }[];
  sizes: { id: string; name: string; sortOrder: number }[];
  colors: { id: string; name: string; hexCode: string }[];
}

export interface AdminEditableProductDTO {
  id: string;
  name: string;
  slug: string;
  description: string;
  basePrice: number;
  compareAtPrice: number | null;
  discountPercentage: number;
  weightInGrams: number;
  categoryId: string;
  collectionId: string;
  status: "DRAFT" | "ACTIVE" | "ARCHIVED";
  composition: string;
  careGuide: string;
  galleryUrls: { url: string }[];
  variants: {
    id: string;
    sizeId: string;
    colorId: string;
    sku: string;
    stock: number;
    imageUrl: string;
  }[];
}

export type CreateAdminProductResult =
  | {
      success: true;
      productId: string;
      slug: string;
    }
  | {
      success: false;
      error: string;
    };

export type AdminProductMutationResult =
  | {
      success: true;
      message: string;
    }
  | {
      success: false;
      error: string;
    };

/**
 * Genera un slug URL-safe a partir del nombre de la prenda.
 */
function slugifyProductName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Consulta todas las prendas del catálogo con la suma consolidada de stock
 * físico, reservado y disponible agrupando todas sus variantes.
 */
export async function getAdminCatalogProducts(): Promise<
  AdminCatalogProductDTO[]
> {
  const products = await db.product.findMany({
    include: {
      category: { select: { name: true } },
      collection: { select: { name: true } },
      images: {
        orderBy: { position: "asc" },
        select: { url: true },
      },
      variants: {
        where: { isActive: true },
        include: {
          size: { select: { name: true, sortOrder: true } },
          color: { select: { name: true, hexCode: true } },
        },
        orderBy: [{ size: { sortOrder: "asc" } }, { color: { name: "asc" } }],
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return products.map((product) => {
    let totalPhysicalStock = 0;
    let totalReservedStock = 0;
    let totalAvailableStock = 0;

    const mappedVariants = product.variants.map((v) => {
      const available = Math.max(0, v.stock - v.reservedStock);
      totalPhysicalStock += v.stock;
      totalReservedStock += v.reservedStock;
      totalAvailableStock += available;

      return {
        id: v.id,
        sku: v.sku,
        sizeName: v.size.name,
        colorName: v.color.name,
        colorHex: v.color.hexCode,
        stock: v.stock,
        reservedStock: v.reservedStock,
        availableStock: available,
        imageUrl: v.imageUrl ?? null,
      };
    });

    return {
      id: product.id,
      name: product.name,
      slug: product.slug,
      status: product.status,
      basePrice: Number(product.basePrice),
      compareAtPrice: product.compareAtPrice
        ? Number(product.compareAtPrice)
        : null,
      discountPercentage: product.discountPercentage,
      weightInGrams: product.weightInGrams,
      categoryName: product.category.name,
      collectionName: product.collection?.name ?? null,
      primaryImageUrl: product.images[0]?.url ?? null,
      galleryImagesCount: product.images.length,
      variantsCount: mappedVariants.length,
      totalPhysicalStock,
      totalReservedStock,
      totalAvailableStock,
      variants: mappedVariants,
      createdAt: product.createdAt.toISOString(),
    };
  });
}

/**
 * Obtiene los catálogos maestros (Categorías, Colecciones, Talles y Colores)
 * para poblar los selectores del formulario de alta/edición de producto.
 */
export async function getAdminProductFormCatalogs(): Promise<AdminProductFormCatalogsDTO> {
  const [categories, collections, sizes, colors] = await Promise.all([
    db.category.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    db.collection.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    db.size.findMany({
      select: { id: true, name: true, sortOrder: true },
      orderBy: { sortOrder: "asc" },
    }),
    db.color.findMany({
      select: { id: true, name: true, hexCode: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return {
    categories,
    collections,
    sizes,
    colors,
  };
}

/**
 * Obtiene los datos actuales de un producto, su galería de imágenes y sus variantes activas por ID
 * para precargar el formulario de edición `/admin/productos/[id]/editar`.
 */
export async function getAdminProductById(
  productId: string
): Promise<AdminEditableProductDTO | null> {
  const product = await db.product.findUnique({
    where: { id: productId },
    include: {
      images: {
        orderBy: { position: "asc" },
        select: { url: true },
      },
      variants: {
        where: { isActive: true },
        orderBy: [{ size: { sortOrder: "asc" } }, { color: { name: "asc" } }],
        select: {
          id: true,
          sizeId: true,
          colorId: true,
          sku: true,
          stock: true,
          imageUrl: true,
        },
      },
    },
  });

  if (!product) return null;

  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description,
    basePrice: Number(product.basePrice),
    compareAtPrice: product.compareAtPrice
      ? Number(product.compareAtPrice)
      : null,
    discountPercentage: product.discountPercentage,
    weightInGrams: product.weightInGrams,
    categoryId: product.categoryId,
    collectionId: product.collectionId ?? "",
    status: product.status,
    composition: product.composition ?? "",
    careGuide: product.careGuide ?? "",
    galleryUrls:
      product.images.length > 0
        ? product.images.map((img) => ({ url: img.url }))
        : [{ url: "" }],
    variants: product.variants.map((v) => ({
      id: v.id,
      sizeId: v.sizeId,
      colorId: v.colorId,
      sku: v.sku,
      stock: v.stock,
      imageUrl: v.imageUrl ?? "",
    })),
  };
}

/**
 * Inserta transaccionalmente un nuevo Producto junto con su galería de imágenes (`ProductImage[]`)
 * y su matriz de Variantes (`ProductVariant[]` con `imageUrl` opcional).
 */
export async function createAdminProduct(
  payload: CreateProductFormValues
): Promise<CreateAdminProductResult> {
  const parsed = createProductFormSchema.safeParse(payload);

  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    return {
      success: false,
      error:
        firstIssue?.message ??
        "Revisá los campos del formulario antes de guardar.",
    };
  }

  const data = parsed.data;
  const baseSlug = slugifyProductName(data.name);

  if (!baseSlug) {
    return {
      success: false,
      error: "El nombre ingresado no permite generar un slug válido.",
    };
  }

  const validGalleryUrls = data.galleryUrls
    .map((item) => item.url.trim())
    .filter((url) => url.length > 0);

  try {
    const created = await db.$transaction(async (tx) => {
      const requestedSkus = data.variants.map((v) =>
        v.sku.trim().toUpperCase()
      );
      const existingVariantSku = await tx.productVariant.findFirst({
        where: {
          sku: { in: requestedSkus },
        },
        select: { sku: true },
      });

      if (existingVariantSku) {
        throw new Error(
          `El código SKU "${existingVariantSku.sku}" ya está asignado a otra variante en el catálogo.`
        );
      }

      const existingSlug = await tx.product.findUnique({
        where: { slug: baseSlug },
        select: { id: true },
      });

      const finalSlug = existingSlug
        ? `${baseSlug}-${Date.now().toString().slice(-4)}`
        : baseSlug;

      const product = await tx.product.create({
        data: {
          name: data.name,
          slug: finalSlug,
          description: data.description,
          basePrice: data.basePrice,
          compareAtPrice: data.compareAtPrice || null,
          discountPercentage: data.discountPercentage,
          weightInGrams: data.weightInGrams,
          categoryId: data.categoryId,
          collectionId: data.collectionId || null,
          status: data.status as ProductStatus,
          composition: data.composition || null,
          careGuide: data.careGuide || null,
          variants: {
            create: data.variants.map((variant) => ({
              sizeId: variant.sizeId,
              colorId: variant.colorId,
              sku: variant.sku.trim().toUpperCase(),
              stock: variant.stock,
              reservedStock: 0,
              imageUrl: variant.imageUrl?.trim() || null,
              isActive: true,
            })),
          },
          ...(validGalleryUrls.length > 0
            ? {
                images: {
                  create: validGalleryUrls.map((url, index) => ({
                    url,
                    altText: `${data.name} - Imagen ${index + 1}`,
                    position: index,
                  })),
                },
              }
            : {}),
        },
        select: {
          id: true,
          slug: true,
        },
      });

      return product;
    });

    revalidatePath("/admin/productos");
    revalidatePath("/admin");
    revalidatePath("/productos");

    return {
      success: true,
      productId: created.id,
      slug: created.slug,
    };
  } catch (error) {
    console.error("[createAdminProduct] Error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "No se pudo guardar el producto en la base de datos.",
    };
  }
}

/**
 * Actualiza transaccionalmente una prenda existente, su galería de imágenes (1:N)
 * y sincroniza su matriz de variantes (incluyendo `imageUrl` por variante).
 */
export async function updateAdminProduct(
  productId: string,
  payload: CreateProductFormValues
): Promise<AdminProductMutationResult> {
  const parsed = createProductFormSchema.safeParse(payload);

  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    return {
      success: false,
      error:
        firstIssue?.message ??
        "Revisá los campos del formulario antes de actualizar.",
    };
  }

  const data = parsed.data;
  const validGalleryUrls = data.galleryUrls
    .map((item) => item.url.trim())
    .filter((url) => url.length > 0);

  try {
    await db.$transaction(async (tx) => {
      const existingProduct = await tx.product.findUnique({
        where: { id: productId },
        include: {
          variants: true,
        },
      });

      if (!existingProduct) {
        throw new Error("El producto que intentás editar no existe.");
      }

      // 1. Verificar que los SKUs no colisionen con variantes de OTROS productos
      const requestedSkus = data.variants.map((v) =>
        v.sku.trim().toUpperCase()
      );
      const conflictingSku = await tx.productVariant.findFirst({
        where: {
          sku: { in: requestedSkus },
          productId: { not: productId },
        },
        select: { sku: true },
      });

      if (conflictingSku) {
        throw new Error(
          `El código SKU "${conflictingSku.sku}" ya pertenece a otro producto del catálogo.`
        );
      }

      // 2. Actualizar datos base del Producto (incluyendo discountPercentage y weightInGrams)
      await tx.product.update({
        where: { id: productId },
        data: {
          name: data.name,
          description: data.description,
          basePrice: data.basePrice,
          compareAtPrice: data.compareAtPrice || null,
          discountPercentage: data.discountPercentage,
          weightInGrams: data.weightInGrams,
          categoryId: data.categoryId,
          collectionId: data.collectionId || null,
          status: data.status as ProductStatus,
          composition: data.composition || null,
          careGuide: data.careGuide || null,
        },
      });

      // 3. Reemplazar sincronizadamente la Galería de Imágenes (1 a N en ProductImage)
      await tx.productImage.deleteMany({
        where: { productId },
      });

      if (validGalleryUrls.length > 0) {
        await tx.productImage.createMany({
          data: validGalleryUrls.map((url, index) => ({
            productId,
            url,
            altText: `${data.name} - Imagen ${index + 1}`,
            position: index,
          })),
        });
      }

      // 4. Sincronizar matriz de variantes (upsert por clave compuesta productId_sizeId_colorId)
      const activeComboKeys = new Set<string>();

      for (const variant of data.variants) {
        const comboKey = `${variant.sizeId}:${variant.colorId}`;
        activeComboKeys.add(comboKey);

        await tx.productVariant.upsert({
          where: {
            productId_sizeId_colorId: {
              productId,
              sizeId: variant.sizeId,
              colorId: variant.colorId,
            },
          },
          update: {
            sku: variant.sku.trim().toUpperCase(),
            stock: variant.stock,
            imageUrl: variant.imageUrl?.trim() || null,
            isActive: true,
          },
          create: {
            productId,
            sizeId: variant.sizeId,
            colorId: variant.colorId,
            sku: variant.sku.trim().toUpperCase(),
            stock: variant.stock,
            reservedStock: 0,
            imageUrl: variant.imageUrl?.trim() || null,
            isActive: true,
          },
        });
      }

      // 5. Desactivar (soft-delete) las variantes previas que fueron quitadas del formulario
      for (const oldVariant of existingProduct.variants) {
        const oldKey = `${oldVariant.sizeId}:${oldVariant.colorId}`;
        if (!activeComboKeys.has(oldKey) && oldVariant.isActive) {
          await tx.productVariant.update({
            where: { id: oldVariant.id },
            data: { isActive: false, stock: 0 },
          });
        }
      }
    });

    revalidatePath("/admin/productos");
    revalidatePath("/admin");
    revalidatePath("/productos");

    return {
      success: true,
      message: "Producto, galería y variantes actualizados correctamente.",
    };
  } catch (error) {
    console.error("[updateAdminProduct] Error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "No se pudo actualizar el producto.",
    };
  }
}

/**
 * Cambia rápidamente el estado de un producto (ej. Pausar a ARCHIVED/DRAFT o Reactivar a ACTIVE).
 */
export async function toggleAdminProductStatus(
  productId: string,
  nextStatus: ProductStatus
): Promise<AdminProductMutationResult> {
  try {
    await db.product.update({
      where: { id: productId },
      data: { status: nextStatus },
    });

    revalidatePath("/admin/productos");
    revalidatePath("/admin");
    revalidatePath("/productos");

    return {
      success: true,
      message: `Estado actualizado a ${nextStatus}.`,
    };
  } catch (error) {
    console.error("[toggleAdminProductStatus] Error:", error);
    return {
      success: false,
      error: "No se pudo cambiar el estado del producto.",
    };
  }
}

/**
 * Baja de Producto:
 * - Si la prenda NO tiene órdenes históricas asociadas, la elimina físicamente de la base de datos.
 * - Si la prenda YA tiene ventas históricas (protegidas por onDelete: Restrict en OrderItem),
 *   aplica automáticamente un Soft Delete (status = ARCHIVED e inactiva sus variantes) para preservar
 *   la integridad contable.
 */
export async function deleteOrArchiveAdminProduct(
  productId: string
): Promise<AdminProductMutationResult> {
  try {
    const orderItemsCount = await db.orderItem.count({
      where: {
        variant: {
          productId,
        },
      },
    });

    if (orderItemsCount > 0) {
      await db.$transaction([
        db.product.update({
          where: { id: productId },
          data: { status: ProductStatus.ARCHIVED },
        }),
        db.productVariant.updateMany({
          where: { productId },
          data: { isActive: false, stock: 0 },
        }),
      ]);

      revalidatePath("/admin/productos");
      revalidatePath("/admin");
      revalidatePath("/productos");

      return {
        success: true,
        message:
          "La prenda posee órdenes históricas asociadas: se archivó (Soft Delete) para proteger el historial contable.",
      };
    }

    await db.product.delete({
      where: { id: productId },
    });

    revalidatePath("/admin/productos");
    revalidatePath("/admin");
    revalidatePath("/productos");

    return {
      success: true,
      message: "Producto eliminado definitivamente del catálogo.",
    };
  } catch (error) {
    console.error("[deleteOrArchiveAdminProduct] Error:", error);
    return {
      success: false,
      error: "Ocurrió un error al intentar dar de baja el producto.",
    };
  }
}
