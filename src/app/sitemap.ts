import type { MetadataRoute } from "next";
import { getAppUrl } from "@/lib/app-url";
import {
  getActiveCategories,
  getActiveCollections,
  getSitemapProducts,
} from "@/modules/products/queries";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const appUrl = getAppUrl();
  const [products, categories, collections] = await Promise.all([
    getSitemapProducts(),
    getActiveCategories(),
    getActiveCollections(),
  ]);

  return [
    { url: `${appUrl}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${appUrl}/productos`, changeFrequency: "daily", priority: 0.9 },
    ...categories
      .filter((category) => category.productsCount > 0)
      .map((category) => ({
        url: `${appUrl}/categoria/${encodeURIComponent(category.slug)}`,
        changeFrequency: "weekly" as const,
        priority: 0.7,
      })),
    ...collections.map((collection) => ({
      url: `${appUrl}/coleccion/${encodeURIComponent(collection.slug)}`,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...products.map((product) => ({
      url: `${appUrl}/productos/${product.slug}`,
      lastModified: product.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    { url: `${appUrl}/arrepentimiento`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${appUrl}/contacto`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${appUrl}/preguntas-frecuentes`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${appUrl}/cambios-y-devoluciones`, changeFrequency: "monthly", priority: 0.4 },
  ];
}
