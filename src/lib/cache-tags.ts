import { revalidateTag, updateTag } from "next/cache";

/**
 * Etiquetas de caché (`cacheTag`) usadas por la capa de datos.
 */
export const CACHE_TAGS = {
  /** Todo lo que se muestra en la tienda: listados, fichas, categorías. */
  catalog: "catalog",
  categories: "categories",
  product: (productId: string) => `product:${productId}`,
  storeSettings: "store-settings",
  shippingMethods: "shipping-methods",
  siteContent: "site-content",
} as const;

/**
 * Invalidación desde Server Actions del admin: la próxima lectura espera
 * datos frescos (read-your-own-writes).
 */
export function expireTagsNow(...tags: string[]) {
  for (const tag of tags) updateTag(tag);
}

/**
 * Invalidación desde Route Handlers, webhooks, cron o el checkout: sirve el
 * dato anterior mientras se regenera en segundo plano.
 */
export function revalidateTagsSoon(...tags: string[]) {
  for (const tag of tags) revalidateTag(tag, "max");
}

/**
 * Tras reservar, liberar o descontar stock: refresca las fichas de los
 * productos afectados (el dato anterior se sirve mientras se regenera).
 */
export async function revalidateStockForVariants(variantIds: string[]) {
  if (variantIds.length === 0) return;
  const { db } = await import("@/lib/db");
  const variants = await db.productVariant.findMany({
    where: { id: { in: variantIds } },
    select: { productId: true },
  });
  const productIds = [...new Set(variants.map((v) => v.productId))];
  revalidateTagsSoon(...productIds.map((id) => CACHE_TAGS.product(id)));
}
