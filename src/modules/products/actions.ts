"use server";

import { db } from "@/lib/db";
import { ProductStatus, type Prisma } from "@prisma/client";

export interface PublicCategoryDTO {
  id: string;
  name: string;
  slug: string;
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

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Obtiene las categorías activas desde Prisma junto con el conteo de prendas activas
 * para alimentar el componente `<SidebarFilters />`.
 */
export async function getActiveCategories(): Promise<PublicCategoryDTO[]> {
  const categories = await db.category.findMany({
    where: { isActive: true },
    include: {
      _count: {
        select: {
          products: {
            where: { status: ProductStatus.ACTIVE },
          },
        },
      },
    },
    orderBy: { name: "asc" },
  });

  return categories.map((cat) => ({
    id: cat.id,
    name: cat.name,
    slug: cat.slug,
    productsCount: cat._count.products,
  }));
}

/**
 * Obtiene el catálogo maestro de talles ordenados por `sortOrder` para el filtro visual.
 */
export async function getAvailableSizes(): Promise<PublicSizeDTO[]> {
  return db.size.findMany({
    select: {
      id: true,
      name: true,
      sortOrder: true,
    },
    orderBy: { sortOrder: "asc" },
  });
}

/**
 * Obtiene los productos en estado ACTIVE aplicando los filtros paramétricos:
 * - `searchQuery` (`?q=`): `{ name: { contains: q, mode: 'insensitive' } }`
 * - `categorySlug` (`?categoria=`): `{ category: { slug } }`
 * - `sizeName` (`?talle=`): `{ variants: { some: { isActive: true, size: { name } } } }`
 * - `sortBy` (`?orden=`): `precio_asc` | `precio_desc` | recientes
 */
export async function getActiveProducts(
  filters?: ProductCatalogFilters | string
): Promise<ProductListItemDTO[]> {
  const normalizedFilters: ProductCatalogFilters =
    typeof filters === "string"
      ? { categorySlug: filters }
      : (filters ?? {});

  const categorySlug = normalizedFilters.categorySlug?.trim();
  const q = normalizedFilters.searchQuery?.trim();
  const sizeName = normalizedFilters.sizeName?.trim();
  const sortBy = normalizedFilters.sortBy?.trim();
  const minPrice =
    typeof normalizedFilters.minPrice === "number" &&
    !Number.isNaN(normalizedFilters.minPrice) &&
    normalizedFilters.minPrice > 0
      ? normalizedFilters.minPrice
      : undefined;
  const maxPrice =
    typeof normalizedFilters.maxPrice === "number" &&
    !Number.isNaN(normalizedFilters.maxPrice) &&
    normalizedFilters.maxPrice > 0
      ? normalizedFilters.maxPrice
      : undefined;

  const whereClause: Prisma.ProductWhereInput = {
    status: ProductStatus.ACTIVE,
    ...(q
      ? {
          name: {
            contains: q,
            mode: "insensitive",
          },
        }
      : {}),
    ...(categorySlug
      ? {
          category: {
            slug: categorySlug,
          },
        }
      : {}),
    ...(sizeName
      ? {
          variants: {
            some: {
              isActive: true,
              size: {
                name: {
                  equals: sizeName,
                  mode: "insensitive",
                },
              },
            },
          },
        }
      : {}),
  };

  const orderByClause:
    | Prisma.ProductOrderByWithRelationInput
    | Prisma.ProductOrderByWithRelationInput[] =
    sortBy === "precio_asc"
      ? { basePrice: "asc" }
      : sortBy === "precio_desc"
        ? { basePrice: "desc" }
        : [{ isFeatured: "desc" }, { createdAt: "desc" }];

  const products = await db.product.findMany({
    where: whereClause,
    include: {
      category: {
        select: { name: true, slug: true },
      },
      collection: {
        select: { name: true, slug: true },
      },
      images: {
        orderBy: { position: "asc" },
        take: 2,
        select: { url: true, altText: true },
      },
      variants: {
        where: { isActive: true },
        take: 1,
        select: { imageUrl: true },
      },
    },
    orderBy: orderByClause,
  });

  const mapped = products.map((product) => {
    const basePrice = Number(product.basePrice);
    const discountPercentage = product.discountPercentage ?? 0;
    const finalPrice =
      discountPercentage > 0
        ? Math.round(basePrice * (1 - discountPercentage / 100))
        : basePrice;

    const fallbackVariantImg = product.variants[0]?.imageUrl
      ? { url: product.variants[0].imageUrl, altText: product.name }
      : null;

    return {
      id: product.id,
      name: product.name,
      slug: product.slug,
      basePrice,
      compareAtPrice: product.compareAtPrice
        ? Number(product.compareAtPrice)
        : null,
      discountPercentage,
      finalPrice,
      isFeatured: product.isFeatured,
      category: product.category,
      collection: product.collection,
      primaryImage: product.images[0] ?? fallbackVariantImg,
      secondaryImage: product.images[1] ?? null,
    };
  });

  return mapped.filter((item) => {
    if (minPrice !== undefined && item.finalPrice < minPrice) return false;
    if (maxPrice !== undefined && item.finalPrice > maxPrice) return false;
    return true;
  });
}

/**
 * Obtiene los últimos N productos agregados en estado ACTIVE (take: 4 por defecto)
 * junto con sus primeras 2 imágenes para la sección "Novedades" (New Arrivals).
 */
export async function getLatestProducts(
  take = 4
): Promise<ProductListItemDTO[]> {
  const products = await db.product.findMany({
    where: { status: ProductStatus.ACTIVE },
    orderBy: { createdAt: "desc" },
    take,
    include: {
      category: {
        select: { name: true, slug: true },
      },
      collection: {
        select: { name: true, slug: true },
      },
      images: {
        orderBy: { position: "asc" },
        take: 2,
        select: { url: true, altText: true },
      },
      variants: {
        where: { isActive: true },
        take: 1,
        select: { imageUrl: true },
      },
    },
  });

  return products.map((product) => {
    const basePrice = Number(product.basePrice);
    const discountPercentage = product.discountPercentage ?? 0;
    const finalPrice =
      discountPercentage > 0
        ? Math.round(basePrice * (1 - discountPercentage / 100))
        : basePrice;

    const fallbackVariantImg = product.variants[0]?.imageUrl
      ? { url: product.variants[0].imageUrl, altText: product.name }
      : null;

    return {
      id: product.id,
      name: product.name,
      slug: product.slug,
      basePrice,
      compareAtPrice: product.compareAtPrice
        ? Number(product.compareAtPrice)
        : null,
      discountPercentage,
      finalPrice,
      isFeatured: product.isFeatured,
      category: product.category,
      collection: product.collection,
      primaryImage: product.images[0] ?? fallbackVariantImg,
      secondaryImage: product.images[1] ?? null,
    };
  });
}

/**
 * Obtiene el detalle completo de un producto activo por su ID (UUID) o por su slug,
 * incluyendo galería general (`images`) y matriz de variantes (`variants` con `imageUrl`).
 */
export async function getProductByIdOrSlug(
  idOrSlug: string
): Promise<ProductDetailDTO | null> {
  const isUuid = UUID_REGEX.test(idOrSlug);

  const product = await db.product.findFirst({
    where: {
      status: ProductStatus.ACTIVE,
      ...(isUuid ? { id: idOrSlug } : { slug: idOrSlug }),
    },
    include: {
      category: {
        select: { id: true, name: true, slug: true },
      },
      collection: {
        select: { id: true, name: true, slug: true },
      },
      images: {
        orderBy: { position: "asc" },
        select: {
          id: true,
          url: true,
          altText: true,
          position: true,
          colorId: true,
        },
      },
      variants: {
        where: { isActive: true },
        include: {
          size: {
            select: { id: true, name: true, sortOrder: true },
          },
          color: {
            select: { id: true, name: true, hexCode: true },
          },
        },
        orderBy: [{ size: { sortOrder: "asc" } }, { color: { name: "asc" } }],
      },
    },
  });

  if (!product) return null;

  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description,
    careGuide: product.careGuide,
    composition: product.composition,
    sizeGuideUrl: product.sizeGuideUrl,
    basePrice: Number(product.basePrice),
    compareAtPrice: product.compareAtPrice
      ? Number(product.compareAtPrice)
      : null,
    discountPercentage: product.discountPercentage ?? 0,
    weightInGrams: product.weightInGrams ?? 0,
    category: product.category,
    collection: product.collection,
    images: product.images,
    variants: product.variants.map((variant) => ({
      id: variant.id,
      sku: variant.sku,
      stock: variant.stock,
      reservedStock: variant.reservedStock,
      availableStock: Math.max(0, variant.stock - variant.reservedStock),
      imageUrl: variant.imageUrl ?? null,
      priceOverride: variant.priceOverride
        ? Number(variant.priceOverride)
        : null,
      size: variant.size,
      color: variant.color,
    })),
  };
}

/**
 * Alias de compatibilidad para búsquedas por slug o ID.
 */
export async function getProductBySlug(
  slugOrId: string
): Promise<ProductDetailDTO | null> {
  return getProductByIdOrSlug(slugOrId);
}
