import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/lib/db";
import { CACHE_TAGS } from "@/lib/cache-tags";
import type { AnnouncementDTO } from "@/modules/content/announcements";

/**
 * Contenido editable de la tienda: textos de temporada, banner de portada y
 * barra de anuncios. Se edita en /admin/contenido y se publica al instante
 * (las lecturas están cacheadas y se invalidan al guardar).
 */

export interface SiteContentDTO {
  collectionName: string;
  seasonLabel: string;
  heroEyebrow: string;
  heroTitle: string;
  heroSubtitle: string | null;
  heroCtaLabel: string;
  heroCtaHref: string;
  heroImageUrl: string | null;
  heroVideoUrl: string | null;
  announcementEnabled: boolean;
  announcementRotateSeconds: number;
}

export const DEFAULT_SITE_CONTENT: SiteContentDTO = {
  collectionName: "Neutral State",
  seasonLabel: "FW'26",
  heroEyebrow: "OL Indumenti • Autumn / Winter Collection",
  heroTitle: "Neutral State - FW'26",
  heroSubtitle: null,
  heroCtaLabel: "Explorar",
  heroCtaHref: "/productos",
  heroImageUrl: null,
  heroVideoUrl: null,
  announcementEnabled: false,
  announcementRotateSeconds: 5,
};

/** Lectura directa (sin caché), para el panel de administración. */
export async function readSiteContent(): Promise<SiteContentDTO> {
  const row = await db.siteContent.findUnique({ where: { id: 1 } });
  if (!row) return DEFAULT_SITE_CONTENT;
  return {
    collectionName: row.collectionName,
    seasonLabel: row.seasonLabel,
    heroEyebrow: row.heroEyebrow,
    heroTitle: row.heroTitle,
    heroSubtitle: row.heroSubtitle,
    heroCtaLabel: row.heroCtaLabel,
    heroCtaHref: row.heroCtaHref,
    heroImageUrl: row.heroImageUrl,
    heroVideoUrl: row.heroVideoUrl,
    announcementEnabled: row.announcementEnabled,
    announcementRotateSeconds: row.announcementRotateSeconds,
  };
}

export async function getSiteContent(): Promise<SiteContentDTO> {
  "use cache";
  cacheLife("days");
  cacheTag(CACHE_TAGS.siteContent);
  return readSiteContent();
}

/**
 * Mensajes activos de la barra de anuncios. Se devuelven también los que
 * tienen fechas futuras o vencidas: el filtro por fecha se hace en el
 * navegador, así una campaña aparece y desaparece sola sin esperar a que
 * venza la caché.
 */
export async function getAnnouncementMessages(): Promise<AnnouncementDTO[]> {
  "use cache";
  cacheLife("days");
  cacheTag(CACHE_TAGS.siteContent);

  const messages = await db.announcementMessage.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    take: 20,
  });

  return messages.map((message) => ({
    id: message.id,
    text: message.text,
    linkUrl: message.linkUrl,
    startsAt: message.startsAt?.toISOString() ?? null,
    endsAt: message.endsAt?.toISOString() ?? null,
  }));
}
