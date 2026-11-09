import type { MetadataRoute } from "next";
import { getAppUrl } from "@/lib/app-url";
import {
  getActiveCategories,
  getSitemapProducts,
} from "@/modules/products/queries";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const appUrl = getAppUrl();
  const [products, categories] = await Promise.all([
    getSitemapProducts(),
    getActiveCategories(),
  ]);

  return [
    { url: `${appUrl}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${appUrl}/productos`, changeFrequency: "daily", priority: 0.9 },
    ...categories
      .filter((category) => category.productsCount > 0)
      .map((category) => ({
        url: `${appUrl}/productos?categoria=${encodeURIComponent(category.slug)}`,
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
  ];
}
