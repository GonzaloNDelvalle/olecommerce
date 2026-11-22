import type { PublicCategoryDTO } from "@/modules/products/types";

export interface CategoryNode extends PublicCategoryDTO {
  children: PublicCategoryDTO[];
}

/**
 * Árbol de un solo nivel: categorías principales con sus subcategorías.
 * Solo incluye las que tienen productos a la venta.
 */
export function buildCategoryTree(categories: PublicCategoryDTO[]): CategoryNode[] {
  const withProducts = categories.filter((c) => c.productsCount > 0);
  return withProducts
    .filter((c) => !c.parentId)
    .map((parent) => ({
      ...parent,
      children: withProducts.filter((c) => c.parentId === parent.id),
    }));
}
