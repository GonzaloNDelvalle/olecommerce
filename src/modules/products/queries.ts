import { cacheLife, cacheTag } from "next/cache";
import { Prisma, ProductStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { CACHE_TAGS } from "@/lib/cache-tags";
import { applyDiscount } from "@/modules/orders/pricing";
import type {
  CatalogPage,
  ProductCatalogFilters,
  ProductDetailDTO,
  ProductListItemDTO,
  PublicCategoryDTO,
  PublicCollectionDTO,
  PublicSizeDTO,
} from "@/modules/products/types";

/**
 * Capa de lectura del catálogo público.
 *
 * Todas las consultas están cacheadas con `"use cache"` y etiquetadas con
 * `cacheTag`: el admin invalida las etiquetas al editar productos, categorías
 * o stock (ver `src/lib/cache-tags.ts`). Así la tienda no consulta Neon en
 * cada visita.
 */

export const CATALOG_PAGE_SIZE = 24;

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const LIST_INCLUDE = {
  category: { select: { name: true, slug: true } },
  collection: { select: { name: true, slug: true } },
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
} satisfies Prisma.ProductInclude;

type ListProduct = Prisma.ProductGetPayload<{ include: typeof LIST_INCLUDE }>;

function toListItem(product: ListProduct): ProductListItemDTO {
  const basePrice = Number(product.basePrice);
  const discountPercentage = product.discountPercentage ?? 0;
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
    finalPrice: applyDiscount(basePrice, discountPercentage),
    isFeatured: product.isFeatured,
    category: product.category,
    collection: product.collection,
    primaryImage: product.images[0] ?? fallbackVariantImg,
    secondaryImage: product.images[1] ?? null,
  };
}

export async function getActiveCategories(): Promise<PublicCategoryDTO[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(CACHE_TAGS.catalog, CACHE_TAGS.categories);

  const categories = await db.category.findMany({
    where: { isActive: true },
    include: {
      _count: {
        select: { products: { where: { status: ProductStatus.ACTIVE } } },
      },
      products: {
        where: { status: ProductStatus.ACTIVE, images: { some: {} } },
        orderBy: { updatedAt: "desc" },
        take: 1,
        select: { images: { orderBy: { position: "asc" }, take: 1, select: { url: true } } },
      },
    },
    orderBy: { name: "asc" },
  });

  // Una subcategoría solo se muestra si su categoría principal también está activa
  const activeIds = new Set(categories.map((cat) => cat.id));
  const visible = categories.filter((cat) => !cat.parentId || activeIds.has(cat.parentId));

  // Cada categoría principal suma los productos de sus subcategorías
  const childrenTotal = new Map<string, number>();
  for (const cat of visible) {
    if (cat.parentId) {
      childrenTotal.set(cat.parentId, (childrenTotal.get(cat.parentId) ?? 0) + cat._count.products);
    }
  }
  const parentFallbackImage = new Map<string, string>();
  for (const cat of visible) {
    const url = cat.products[0]?.images[0]?.url;
    if (cat.parentId && url && !parentFallbackImage.has(cat.parentId)) parentFallbackImage.set(cat.parentId, url);
  }

  return visible.map((cat) => ({
    id: cat.id,
    name: cat.name,
    slug: cat.slug,
    description: cat.description,
    imageUrl: cat.imageUrl,
    coverImageUrl: cat.imageUrl ?? cat.products[0]?.images[0]?.url ?? parentFallbackImage.get(cat.id) ?? null,
    parentId: cat.parentId,
    productsCount: cat._count.products + (childrenTotal.get(cat.id) ?? 0),
  }));
}

/** Colecciones activas con al menos un producto a la venta. */
export async function getActiveCollections(): Promise<PublicCollectionDTO[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(CACHE_TAGS.catalog, CACHE_TAGS.siteContent);

  const collections = await db.collection.findMany({
    where: { isActive: true },
    include: {
      _count: { select: { products: { where: { status: ProductStatus.ACTIVE } } } },
    },
    orderBy: { name: "asc" },
  });
  return collections
    .filter((collection) => collection._count.products > 0)
    .map((collection) => ({
      id: collection.id,
      name: collection.name,
      slug: collection.slug,
      description: collection.description,
      productsCount: collection._count.products,
    }));
}

export async function getAvailableSizes(): Promise<PublicSizeDTO[]> {
  "use cache";
  cacheLife("days");
  cacheTag(CACHE_TAGS.catalog);

  return db.size.findMany({
    select: { id: true, name: true, sortOrder: true },
    orderBy: { sortOrder: "asc" },
  });
}

/** Escapa los comodines de LIKE para buscar el texto literal. */
function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (char) => `\\${char}`);
}

function normalizeFilters(filters: ProductCatalogFilters) {
  const positive = (value?: number) =>
    typeof value === "number" && Number.isFinite(value) && value > 0
      ? value
      : undefined;
  return {
    categorySlug: filters.categorySlug?.trim() || undefined,
    collectionSlug: filters.collectionSlug?.trim() || undefined,
    q: filters.searchQuery?.trim().slice(0, 80) || undefined,
    sizeName: filters.sizeName?.trim() || undefined,
    sortBy: filters.sortBy?.trim() || "recientes",
    minPrice: positive(filters.minPrice),
    maxPrice: positive(filters.maxPrice),
    page: Math.max(1, Math.floor(filters.page ?? 1)),
  };
}

/**
 * Página del catálogo con filtros, búsqueda sin acentos ("pantalon" encuentra
 * "Pantalón"), orden por precio final (con descuento) y paginación en SQL.
 */
export async function getCatalogPage(
  filters: ProductCatalogFilters = {}
): Promise<CatalogPage> {
  "use cache";
  cacheLife("hours");
  cacheTag(CACHE_TAGS.catalog);

  const f = normalizeFilters(filters);
  const offset = (f.page - 1) * CATALOG_PAGE_SIZE;

  const conditions: Prisma.Sql[] = [Prisma.sql`p."status" = 'ACTIVE'`];
  if (f.categorySlug) {
    // Una categoría principal incluye los productos de sus subcategorías
    conditions.push(Prisma.sql`(c."slug" = ${f.categorySlug} OR c."parent_id" IN (
      SELECT pc."id" FROM "categories" pc WHERE pc."slug" = ${f.categorySlug}
    ))`);
  }
  if (f.collectionSlug) {
    conditions.push(Prisma.sql`p."collection_id" IN (
      SELECT col."id" FROM "collections" col
      WHERE col."slug" = ${f.collectionSlug} AND col."is_active" = true
    )`);
  }
  if (f.q) {
    const pattern = `%${escapeLike(f.q.toLowerCase())}%`;
    conditions.push(Prisma.sql`unaccent(lower(
      p."name" || ' ' || c."name" || ' ' || COALESCE(p."composition", '')
    )) LIKE unaccent(${pattern})`);
  }
  if (f.sizeName) {
    conditions.push(Prisma.sql`EXISTS (
      SELECT 1 FROM "product_variants" v
      JOIN "sizes" s ON s."id" = v."size_id"
      WHERE v."product_id" = p."id" AND v."is_active" = true
        AND lower(s."name") = lower(${f.sizeName})
    )`);
  }

  const priceExpr = Prisma.sql`ROUND(p."base_price" * (100 - p."discount_percentage") / 100.0)`;
  if (f.minPrice !== undefined) {
    conditions.push(Prisma.sql`${priceExpr} >= ${f.minPrice}`);
  }
  if (f.maxPrice !== undefined) {
    conditions.push(Prisma.sql`${priceExpr} <= ${f.maxPrice}`);
  }

  const orderBy =
    f.sortBy === "precio_asc"
      ? Prisma.sql`${priceExpr} ASC, p."created_at" DESC`
      : f.sortBy === "precio_desc"
        ? Prisma.sql`${priceExpr} DESC, p."created_at" DESC`
        : Prisma.sql`p."is_featured" DESC, p."created_at" DESC`;

  const rows = await db.$queryRaw<{ id: string; total: number }[]>`
    SELECT p."id"::text AS id, (COUNT(*) OVER())::int AS total
    FROM "products" p
    JOIN "categories" c ON c."id" = p."category_id"
    WHERE ${Prisma.join(conditions, " AND ")}
    ORDER BY ${orderBy}
    LIMIT ${CATALOG_PAGE_SIZE} OFFSET ${offset}
  `;

  const total = rows[0]?.total ?? 0;
  const ids = rows.map((row) => row.id);

  const products = ids.length
    ? await db.product.findMany({
        where: { id: { in: ids } },
        include: LIST_INCLUDE,
      })
    : [];
  const byId = new Map(products.map((p) => [p.id, p]));

  return {
    items: ids
      .map((id) => byId.get(id))
      .filter((p): p is ListProduct => Boolean(p))
      .map(toListItem),
    total,
    page: f.page,
    pageSize: CATALOG_PAGE_SIZE,
    pageCount: Math.max(1, Math.ceil(total / CATALOG_PAGE_SIZE)),
  };
}

export async function getLatestProducts(
  take = 4
): Promise<ProductListItemDTO[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(CACHE_TAGS.catalog);

  const products = await db.product.findMany({
    where: { status: ProductStatus.ACTIVE },
    orderBy: { createdAt: "desc" },
    take,
    include: LIST_INCLUDE,
  });
  return products.map(toListItem);
}

/**
 * Productos destacados (marcados en el admin) para la sección 3D de la
 * portada. Si no hay suficientes, completa con los más nuevos.
 */
export async function getFeaturedProducts(
  take = 6
): Promise<ProductListItemDTO[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(CACHE_TAGS.catalog);

  const featured = await db.product.findMany({
    where: { status: ProductStatus.ACTIVE, isFeatured: true },
    orderBy: { updatedAt: "desc" },
    take,
    include: LIST_INCLUDE,
  });
  if (featured.length >= take) return featured.map(toListItem);

  const filler = await db.product.findMany({
    where: {
      status: ProductStatus.ACTIVE,
      id: { notIn: featured.map((p) => p.id) },
    },
    orderBy: { createdAt: "desc" },
    take: take - featured.length,
    include: LIST_INCLUDE,
  });
  return [...featured, ...filler].map(toListItem);
}

/**
 * Detalle de un producto activo por UUID o slug. El stock disponible cambia con
 * cada compra, por eso esta entrada vive pocos minutos y además se invalida
 * por etiqueta cuando se reserva o libera stock de ese producto.
 */
export async function getProductByIdOrSlug(
  idOrSlug: string
): Promise<ProductDetailDTO | null> {
  "use cache";
  cacheLife("minutes");
  cacheTag(CACHE_TAGS.catalog);

  const isUuid = UUID_REGEX.test(idOrSlug);
  const product = await db.product.findFirst({
    where: {
      status: ProductStatus.ACTIVE,
      ...(isUuid ? { id: idOrSlug } : { slug: idOrSlug }),
    },
    include: {
      category: { select: { id: true, name: true, slug: true } },
      collection: { select: { id: true, name: true, slug: true } },
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
          size: { select: { id: true, name: true, sortOrder: true } },
          color: { select: { id: true, name: true, hexCode: true } },
        },
        orderBy: [{ size: { sortOrder: "asc" } }, { color: { name: "asc" } }],
      },
    },
  });

  if (!product) return null;
  cacheTag(CACHE_TAGS.product(product.id));

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

/** Productos activos para el sitemap (slug + fecha de modificación). */
export async function getSitemapProducts(): Promise<
  { slug: string; updatedAt: Date }[]
> {
  "use cache";
  cacheLife("hours");
  cacheTag(CACHE_TAGS.catalog);

  return db.product.findMany({
    where: { status: ProductStatus.ACTIVE },
    select: { slug: true, updatedAt: true },
    orderBy: { updatedAt: "desc" },
  });
}

/**
 * Tarjetas de la sección de temporada con las fotos elegidas en el admin
 * (ids de ProductImage, en orden). Cada tarjeta usa la foto elegida como
 * imagen principal. Ignora fotos de productos no activos o ya borradas.
 */
export async function getFeaturedPickItems(
  imageIds: string[]
): Promise<ProductListItemDTO[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(CACHE_TAGS.catalog, CACHE_TAGS.siteContent);

  if (imageIds.length === 0) return [];

  const images = await db.productImage.findMany({
    where: { id: { in: imageIds }, product: { status: ProductStatus.ACTIVE } },
    include: { product: { include: LIST_INCLUDE } },
  });
  const byId = new Map(images.map((image) => [image.id, image]));

  return imageIds.flatMap((id) => {
    const image = byId.get(id);
    if (!image) return [];
    const item = toListItem(image.product);
    return [{ ...item, primaryImage: { url: image.url, altText: image.altText ?? item.name } }];
  });
}

export interface OutfitDTO {
  id: string;
  title: string;
  imageUrl: string;
  products: ProductListItemDTO[];
}

/** Outfits activos de la portada con los productos que los componen. */
export async function getActiveOutfits(): Promise<OutfitDTO[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(CACHE_TAGS.catalog, CACHE_TAGS.siteContent);

  try {
    const outfits = await db.outfit.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      take: 12,
      include: {
        items: {
          orderBy: { position: "asc" },
          where: { product: { status: ProductStatus.ACTIVE } },
          include: { product: { include: LIST_INCLUDE } },
        },
      },
    });
    return outfits
      .filter((outfit) => outfit.items.length > 0)
      .map((outfit) => ({
        id: outfit.id,
        title: outfit.title,
        imageUrl: outfit.imageUrl,
        products: outfit.items.map((item) => toListItem(item.product)),
      }));
  } catch (error) {
    // P2021: la tabla todavía no existe (migración sin aplicar): la portada sigue sin outfits
    if ((error as { code?: string } | null)?.code !== "P2021") throw error;
    return [];
  }
}
