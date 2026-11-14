/**
 * DTOs públicos del catálogo (compartidos entre servidor y componentes cliente).
 */

export interface PublicCategoryDTO {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  productsCount: number;
}

export interface PublicSizeDTO {
  id: string;
  name: string;
  sortOrder: number;
}

export type CatalogSortOption = "recientes" | "precio_asc" | "precio_desc";

export interface ProductCatalogFilters {
  categorySlug?: string;
  searchQuery?: string;
  sizeName?: string;
  sortBy?: string;
  minPrice?: number;
  maxPrice?: number;
  page?: number;
}

/**
 * DTO serializable para tarjetas del listado de productos.
 */
export interface ProductListItemDTO {
  id: string;
  name: string;
  slug: string;
  basePrice: number;
  compareAtPrice: number | null;
  discountPercentage: number;
  finalPrice: number;
  isFeatured: boolean;
  category: {
    name: string;
    slug: string;
  };
  collection: {
    name: string;
    slug: string;
  } | null;
  primaryImage: {
    url: string;
    altText: string | null;
  } | null;
  secondaryImage?: {
    url: string;
    altText: string | null;
  } | null;
}

export interface ProductVariantDTO {
  id: string;
  sku: string;
  stock: number;
  reservedStock: number;
  availableStock: number;
  imageUrl: string | null;
  priceOverride: number | null;
  size: {
    id: string;
    name: string;
    sortOrder: number;
  };
  color: {
    id: string;
    name: string;
    hexCode: string;
  };
}

export interface ProductDetailDTO {
  id: string;
  name: string;
  slug: string;
  description: string;
  careGuide: string | null;
  composition: string | null;
  sizeGuideUrl: string | null;
  basePrice: number;
  compareAtPrice: number | null;
  discountPercentage: number;
  weightInGrams: number;
  category: {
    id: string;
    name: string;
    slug: string;
  };
  collection: {
    id: string;
    name: string;
    slug: string;
  } | null;
  images: {
    id: string;
    url: string;
    altText: string | null;
    position: number;
    colorId: string | null;
  }[];
  variants: ProductVariantDTO[];
}

export interface CatalogPage {
  items: ProductListItemDTO[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
}
