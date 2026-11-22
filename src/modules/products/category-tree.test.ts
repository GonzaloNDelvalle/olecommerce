import { describe, expect, it } from "vitest";
import { buildCategoryTree } from "@/modules/products/category-tree";
import type { PublicCategoryDTO } from "@/modules/products/types";

const cat = (id: string, parentId: string | null, productsCount: number): PublicCategoryDTO => ({
  id,
  name: id,
  slug: id,
  description: null,
  imageUrl: null,
  coverImageUrl: null,
  parentId,
  productsCount,
});

describe("buildCategoryTree", () => {
  it("agrupa las subcategorías bajo su categoría principal", () => {
    const tree = buildCategoryTree([cat("shorts", null, 3), cat("shorts-denim", "shorts", 2), cat("shorts-eco", "shorts", 1), cat("remeras", null, 4)]);
    expect(tree.map((c) => c.id)).toEqual(["shorts", "remeras"]);
    expect(tree[0].children.map((c) => c.id)).toEqual(["shorts-denim", "shorts-eco"]);
    expect(tree[1].children).toEqual([]);
  });

  it("omite categorías y subcategorías sin productos", () => {
    const tree = buildCategoryTree([cat("shorts", null, 2), cat("shorts-denim", "shorts", 2), cat("shorts-eco", "shorts", 0), cat("vacia", null, 0)]);
    expect(tree.map((c) => c.id)).toEqual(["shorts"]);
    expect(tree[0].children.map((c) => c.id)).toEqual(["shorts-denim"]);
  });
});
