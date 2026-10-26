"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";

export interface AdminCategoryDTO {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  isActive: boolean;
  productsCount: number;
  createdAt: string;
}

export type AdminCategoryMutationResult =
  | {
      success: true;
      message: string;
    }
  | {
      success: false;
      error: string;
    };

const createCategorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "El nombre de la categoría debe tener al menos 2 caracteres")
    .max(100, "El nombre no puede superar los 100 caracteres"),
  description: z
    .string()
    .trim()
    .max(300, "La descripción no puede superar los 300 caracteres")
    .optional()
    .or(z.literal("")),
});

function slugifyCategoryName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Obtiene todas las categorías registradas en la base de datos junto con la cantidad
 * de productos asociados a cada una.
 */
export async function getAdminCategories(): Promise<AdminCategoryDTO[]> {
  const categories = await db.category.findMany({
    include: {
      _count: {
        select: { products: true },
      },
    },
    orderBy: { name: "asc" },
  });

  return categories.map((cat) => ({
    id: cat.id,
    name: cat.name,
    slug: cat.slug,
    description: cat.description,
    isActive: cat.isActive,
    productsCount: cat._count.products,
    createdAt: cat.createdAt.toISOString(),
  }));
}

/**
 * Crea una nueva categoría generando su slug automáticamente.
 */
export async function createAdminCategory(input: {
  name: string;
  description?: string;
}): Promise<AdminCategoryMutationResult> {
  const parsed = createCategorySchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      error:
        parsed.error.issues[0]?.message ??
        "Revisá los datos de la categoría ingresada.",
    };
  }

  const { name, description } = parsed.data;
  const slug = slugifyCategoryName(name);

  if (!slug) {
    return {
      success: false,
      error: "El nombre ingresado no permite generar un slug válido.",
    };
  }

  try {
    const existing = await db.category.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (existing) {
      return {
        success: false,
        error: `Ya existe una categoría con el identificador (slug) "${slug}".`,
      };
    }

    await db.category.create({
      data: {
        name,
        slug,
        description: description || null,
        isActive: true,
      },
    });

    revalidatePath("/admin/categorias");
    revalidatePath("/admin/productos/nuevo");
    revalidatePath("/");
    revalidatePath("/productos");

    return {
      success: true,
      message: `Categoría "${name}" creada exitosamente.`,
    };
  } catch (error) {
    console.error("[createAdminCategory] Error:", error);
    return {
      success: false,
      error: "No se pudo crear la categoría en la base de datos.",
    };
  }
}

/**
 * Elimina una categoría por su ID si no posee productos vinculados.
 */
export async function deleteAdminCategory(
  categoryId: string
): Promise<AdminCategoryMutationResult> {
  try {
    const category = await db.category.findUnique({
      where: { id: categoryId },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    if (!category) {
      return {
        success: false,
        error: "La categoría que intentás eliminar no existe.",
      };
    }

    if (category._count.products > 0) {
      return {
        success: false,
        error: `No se puede eliminar "${category.name}" porque tiene ${category._count.products} producto(s) asociado(s). Reasigná esas prendas a otra categoría primero.`,
      };
    }

    await db.category.delete({
      where: { id: categoryId },
    });

    revalidatePath("/admin/categorias");
    revalidatePath("/admin/productos/nuevo");
    revalidatePath("/");
    revalidatePath("/productos");

    return {
      success: true,
      message: `Categoría "${category.name}" eliminada correctamente.`,
    };
  } catch (error) {
    console.error("[deleteAdminCategory] Error:", error);
    return {
      success: false,
      error: "Ocurrió un error al intentar eliminar la categoría.",
    };
  }
}
