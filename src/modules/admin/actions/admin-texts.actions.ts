"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-guards";
import { CACHE_TAGS, expireTagsNow } from "@/lib/cache-tags";
import { mergeTexts, TEXT_DEFINITIONS, type SiteTexts, type TextKey } from "@/modules/content/texts";
import { readTextOverrides } from "@/modules/content/site-texts";

export type TextsMutationResult =
  | { success: true; message: string }
  | { success: false; error: string };

export async function getAdminSiteTexts(): Promise<SiteTexts> {
  await requireAdmin();
  return mergeTexts(await readTextOverrides());
}

/**
 * Guarda los textos editados. Los que quedan iguales al original se borran de la
 * base (así siguen el valor por defecto).
 */
export async function saveAdminSiteTexts(
  input: Record<string, string>
): Promise<TextsMutationResult> {
  await requireAdmin();

  const parsed = z.record(z.string(), z.string()).safeParse(input);
  if (!parsed.success) return { success: false, error: "Revisá los datos." };

  const toSave: { key: string; value: string }[] = [];
  const toDelete: string[] = [];
  for (const [key, raw] of Object.entries(parsed.data)) {
    if (!Object.hasOwn(TEXT_DEFINITIONS, key)) continue;
    const definition = TEXT_DEFINITIONS[key as TextKey];
    const value = raw.replace(/\r\n/g, "\n").trim();
    if (value.length > definition.max) {
      return {
        success: false,
        error: `«${definition.group} · ${definition.label}» supera los ${definition.max} caracteres.`,
      };
    }
    if (value === definition.default) toDelete.push(key);
    else toSave.push({ key, value });
  }

  try {
    await db.$transaction([
      db.siteText.deleteMany({ where: { key: { in: toDelete } } }),
      ...toSave.map(({ key, value }) =>
        db.siteText.upsert({ where: { key }, update: { value }, create: { key, value } })
      ),
    ]);
  } catch (error) {
    console.error("[saveAdminSiteTexts] Error:", error);
    return { success: false, error: "No se pudieron guardar los textos." };
  }

  expireTagsNow(CACHE_TAGS.siteContent);
  revalidatePath("/admin/textos");
  return { success: true, message: "Textos publicados en la tienda." };
}
