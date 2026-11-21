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
  heroImageUrls: z.array(z.string().trim().min(1).max(1000)).max(3, "El carrusel admite hasta 3 imágenes"),
  featuredImageIds: z.array(z.string().uuid()).max(12, "Elegí hasta 12 imágenes"),
  campaignEnabled: z.boolean(),
  campaignEyebrow: z.string().trim().max(120),
  campaignTitle: z.string().trim().min(2, "Ingresá el título de la campaña").max(80),
  campaignImageUrl: optionalText(1000),
  campaignVideoUrl: optionalText(1000),
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
    data.heroImageUrls = data.heroImageUrls.map((url) => assertAllowedMediaUrl(url));
    if (data.campaignImageUrl) data.campaignImageUrl = assertAllowedMediaUrl(data.campaignImageUrl);
    if (data.campaignVideoUrl) data.campaignVideoUrl = assertAllowedMediaUrl(data.campaignVideoUrl);
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Archivo inválido.",
    };
  }
  if (data.heroImageUrls.length === 0) {
    return {
      success: false,
      error: "El banner necesita al menos una imagen.",
    };
  }

  if (data.campaignEnabled && !data.campaignVideoUrl) {
    return {
      success: false,
      error: "La campaña necesita un video (o desactivala).",
    };
  }

  // El primer slide también queda en el campo histórico (compatibilidad)
  const record = { ...data, heroImageUrl: data.heroImageUrls[0] };
  await db.siteContent.upsert({
    where: { id: 1 },
    update: record,
    create: { id: 1, ...record },
  });

  expireTagsNow(CACHE_TAGS.siteContent);
  revalidatePath("/admin/contenido");
  return { success: true, message: "Contenido publicado en la tienda." };
}

// ==========================================
// IMÁGENES DE PRODUCTOS (selector de la portada)
// ==========================================

export interface AdminProductImagesDTO {
  id: string;
  name: string;
  images: { id: string; url: string }[];
}

/** Productos activos con sus fotos, para elegir qué imágenes muestra la portada. */
export async function getAdminProductImages(): Promise<AdminProductImagesDTO[]> {
  await requireAdmin();

  const products = await db.product.findMany({
    where: { status: "ACTIVE", images: { some: {} } },
    orderBy: { updatedAt: "desc" },
    take: 200,
    select: {
      id: true,
      name: true,
      images: { orderBy: { position: "asc" }, take: 8, select: { id: true, url: true } },
    },
  });
  return products;
}

// ==========================================
// OUTFITS ("SHOP THE LOOK")
// ==========================================

export interface AdminOutfitDTO {
  id: string;
  title: string;
  imageUrl: string;
  isActive: boolean;
  sortOrder: number;
  productIds: string[];
}

const outfitSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().trim().min(2, "Escribí el nombre del outfit").max(120),
  imageUrl: z.string().trim().min(1, "Subí la foto del outfit").max(1000),
  isActive: z.boolean(),
  sortOrder: z.number().int().min(0).max(999),
  productIds: z
    .array(z.string().uuid())
    .min(1, "Elegí al menos un producto")
    .max(8, "Máximo 8 productos por outfit"),
});

export type OutfitInput = z.input<typeof outfitSchema>;

export async function getAdminOutfits(): Promise<AdminOutfitDTO[]> {
  await requireAdmin();

  const outfits = await db.outfit.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    include: { items: { orderBy: { position: "asc" }, select: { productId: true } } },
  });
  return outfits.map((outfit) => ({
    id: outfit.id,
    title: outfit.title,
    imageUrl: outfit.imageUrl,
    isActive: outfit.isActive,
    sortOrder: outfit.sortOrder,
    productIds: outfit.items.map((item) => item.productId),
  }));
}

export async function saveAdminOutfit(input: OutfitInput): Promise<ContentMutationResult> {
  await requireAdmin();

  const parsed = outfitSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Revisá el outfit." };
  }
  const { id, productIds, ...rest } = parsed.data;

  let imageUrl: string;
  try {
    imageUrl = assertAllowedMediaUrl(rest.imageUrl);
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Imagen inválida." };
  }

  const uniqueIds = [...new Set(productIds)];
  const items = uniqueIds.map((productId, position) => ({ productId, position }));
  const data = { ...rest, imageUrl };

  if (id) {
    await db.$transaction([
      db.outfitItem.deleteMany({ where: { outfitId: id } }),
      db.outfit.update({ where: { id }, data: { ...data, items: { create: items } } }),
    ]);
  } else {
    const count = await db.outfit.count();
    if (count >= 12) {
      return { success: false, error: "Máximo 12 outfits. Borrá alguno viejo." };
    }
    await db.outfit.create({ data: { ...data, items: { create: items } } });
  }

  expireTagsNow(CACHE_TAGS.siteContent, CACHE_TAGS.catalog);
  revalidatePath("/admin/outfits");
  return { success: true, message: id ? "Outfit actualizado." : "Outfit creado." };
}

export async function deleteAdminOutfit(id: string): Promise<ContentMutationResult> {
  await requireAdmin();
  if (!z.string().uuid().safeParse(id).success) {
    return { success: false, error: "Outfit inválido." };
  }
  await db.outfit.deleteMany({ where: { id } });

  expireTagsNow(CACHE_TAGS.siteContent, CACHE_TAGS.catalog);
  revalidatePath("/admin/outfits");
  return { success: true, message: "Outfit eliminado." };
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
