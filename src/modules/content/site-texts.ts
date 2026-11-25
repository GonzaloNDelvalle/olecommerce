import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/lib/db";
import { CACHE_TAGS } from "@/lib/cache-tags";
import { mergeTexts, type SiteTexts } from "@/modules/content/texts";

/** Textos guardados. Sin la tabla (migración sin aplicar) no hay ninguno. */
export async function readTextOverrides(): Promise<{ key: string; value: string }[]> {
  try {
    return await db.siteText.findMany({ select: { key: true, value: true } });
  } catch (error) {
    // P2021: la tabla todavía no existe: la tienda usa los textos por defecto
    if ((error as { code?: string } | null)?.code !== "P2021") throw error;
    return [];
  }
}

/** Todos los textos de la tienda (cacheados; se invalidan al guardar). */
export async function getSiteTexts(): Promise<SiteTexts> {
  "use cache";
  cacheLife("days");
  cacheTag(CACHE_TAGS.siteContent);
  return mergeTexts(await readTextOverrides());
}
