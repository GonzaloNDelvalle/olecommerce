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
    conditions.push(Prisma.sql`c."slug" = ${f.categorySlug}`);
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
