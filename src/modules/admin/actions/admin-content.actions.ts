"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-guards";
import { CACHE_TAGS, expireTagsNow } from "@/lib/cache-tags";
import { assertAllowedMediaUrl } from "@/lib/cloudinary";
import { isSafeAnnouncementLink } from "@/modules/content/announcements";
import {
  readSiteContent,
  type SiteContentDTO,
} from "@/modules/content/site-content";

export type ContentMutationResult =
  | { success: true; message: string }
  | { success: false; error: string };

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((value) => (value === "" ? null : value))
    .nullable();

const linkSchema = z
  .string()
  .trim()
  .max(255)
  .refine(isSafeAnnouncementLink, "El link debe empezar con / (página de la tienda) o https://");

// ==========================================
// TEMPORADA Y BANNER
// ==========================================

const siteContentSchema = z.object({
  collectionName: z.string().trim().max(80),
  seasonLabel: z.string().trim().max(40),
  heroEyebrow: z.string().trim().max(120),
  heroTitle: z.string().trim().min(2, "Ingresá el título del banner").max(80),
  heroSubtitle: optionalText(300),
  heroCtaLabel: z.string().trim().min(2, "Ingresá el texto del botón").max(40),
  heroCtaHref: linkSchema,
  heroImageUrl: optionalText(1000),
  heroVideoUrl: optionalText(1000),
  newsletterEnabled: z.boolean(),
  newsletterEyebrow: z.string().trim().max(120),
  newsletterTitle: z.string().trim().min(2, "Ingresá el título del newsletter").max(160),
  newsletterText: optionalText(400),
  newsletterButtonLabel: z.string().trim().min(2, "Ingresá el texto del botón del newsletter").max(40),
  announcementEnabled: z.boolean(),
  announcementRotateSeconds: z.number().int().min(2).max(30),
});

export type SiteContentInput = z.input<typeof siteContentSchema>;

export async function getAdminSiteContent(): Promise<SiteContentDTO> {
  await requireAdmin();
  return readSiteContent();
}

export async function updateAdminSiteContent(
  input: SiteContentInput
): Promise<ContentMutationResult> {
  await requireAdmin();

  const parsed = siteContentSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Revisá los datos.",
    };
  }

  const data = parsed.data;
  try {
    if (data.heroImageUrl) data.heroImageUrl = assertAllowedMediaUrl(data.heroImageUrl);
    if (data.heroVideoUrl) data.heroVideoUrl = assertAllowedMediaUrl(data.heroVideoUrl);
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Archivo inválido.",
    };
  }
  if (!data.heroImageUrl && !data.heroVideoUrl) {
    return {
      success: false,
      error: "El banner necesita al menos una imagen o un video de fondo.",
    };
  }

  await db.siteContent.upsert({
    where: { id: 1 },
    update: data,
    create: { id: 1, ...data },
  });

  expireTagsNow(CACHE_TAGS.siteContent);
  revalidatePath("/admin/contenido");
  return { success: true, message: "Contenido publicado en la tienda." };
}

// ==========================================
// BARRA DE ANUNCIOS
// ==========================================

export interface AdminAnnouncementDTO {
  id: string;
  text: string;
  linkUrl: string | null;
  isActive: boolean;
  sortOrder: number;
  startsAt: string | null;
  endsAt: string | null;
}

const announcementSchema = z
  .object({
    id: z.string().uuid().optional(),
    text: z.string().trim().min(3, "Escribí el mensaje").max(160, "Máximo 160 caracteres"),
    linkUrl: z
      .string()
      .trim()
      .max(255)
      .transform((value) => (value === "" ? null : value))
      .nullable()
      .refine(
        (value) => value === null || isSafeAnnouncementLink(value),
        "El link debe empezar con / (página de la tienda) o https://"
      ),
    isActive: z.boolean(),
    sortOrder: z.number().int().min(0).max(999),
    startsAt: z.string().datetime().nullable(),
    endsAt: z.string().datetime().nullable(),
  })
  .refine(
    (data) =>
      !data.startsAt || !data.endsAt || new Date(data.endsAt) > new Date(data.startsAt),
    { message: "La fecha de fin tiene que ser posterior a la de inicio", path: ["endsAt"] }
  );

export type AnnouncementInput = z.input<typeof announcementSchema>;

export async function getAdminAnnouncements(): Promise<AdminAnnouncementDTO[]> {
  await requireAdmin();

  const messages = await db.announcementMessage.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
  return messages.map((message) => ({
    id: message.id,
    text: message.text,
    linkUrl: message.linkUrl,
    isActive: message.isActive,
    sortOrder: message.sortOrder,
    startsAt: message.startsAt?.toISOString() ?? null,
    endsAt: message.endsAt?.toISOString() ?? null,
  }));
}

export async function saveAdminAnnouncement(
  input: AnnouncementInput
): Promise<ContentMutationResult> {
  await requireAdmin();

  const parsed = announcementSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Revisá el mensaje.",
    };
  }

  const { id, startsAt, endsAt, ...rest } = parsed.data;
  const data = {
    ...rest,
    startsAt: startsAt ? new Date(startsAt) : null,
    endsAt: endsAt ? new Date(endsAt) : null,
  };

  if (id) {
    await db.announcementMessage.update({ where: { id }, data });
  } else {
    const count = await db.announcementMessage.count();
    if (count >= 20) {
      return { success: false, error: "Máximo 20 mensajes. Borrá alguno viejo." };
    }
    await db.announcementMessage.create({ data });
  }

  expireTagsNow(CACHE_TAGS.siteContent);
  revalidatePath("/admin/contenido");
  return { success: true, message: id ? "Mensaje actualizado." : "Mensaje agregado." };
}

export async function deleteAdminAnnouncement(
  id: string
): Promise<ContentMutationResult> {
  await requireAdmin();

  if (!z.string().uuid().safeParse(id).success) {
    return { success: false, error: "Mensaje inválido." };
  }
  await db.announcementMessage.deleteMany({ where: { id } });

  expireTagsNow(CACHE_TAGS.siteContent);
  revalidatePath("/admin/contenido");
  return { success: true, message: "Mensaje eliminado." };
}
