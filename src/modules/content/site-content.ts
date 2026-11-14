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
  campaignEnabled: boolean;
  campaignEyebrow: string;
  campaignTitle: string;
  campaignImageUrl: string | null;
  campaignVideoUrl: string | null;
  newsletterEnabled: boolean;
  newsletterEyebrow: string;
  newsletterTitle: string;
  newsletterText: string | null;
  newsletterButtonLabel: string;
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
  campaignEnabled: true,
  campaignEyebrow: "Campaña",
  campaignTitle: "Hecho para durar",
  campaignImageUrl: null,
  campaignVideoUrl: null,
  newsletterEnabled: true,
  newsletterEyebrow: "Manifiesto OL.",
  newsletterTitle: "“Prendas versátiles. Estado de calma y equilibrio.”",
  newsletterText: null,
  newsletterButtonLabel: "Suscribirme",
  announcementEnabled: false,
  announcementRotateSeconds: 5,
};

/** Lectura directa (sin caché), para el panel de administración. */
const CAMPAIGN_FIELDS = [
  "campaignEnabled",
  "campaignEyebrow",
  "campaignTitle",
  "campaignImageUrl",
  "campaignVideoUrl",
] as const;

/**
 * Lee la fila de contenido. Si la base todavía no tiene las columnas de la
 * campaña (deploy antes de la migración), las lee sin ellas y usa los valores
 * por defecto, en vez de romper la portada.
 */
async function findSiteContentRow() {
  try {
    return await db.siteContent.findUnique({ where: { id: 1 } });
  } catch (error) {
    // P2022: columna inexistente (la migración de la campaña no se aplicó)
    if ((error as { code?: string } | null)?.code !== "P2022") throw error;
    const omit = Object.fromEntries(CAMPAIGN_FIELDS.map((key) => [key, true])) as Record<
      (typeof CAMPAIGN_FIELDS)[number],
      true
    >;
    const row = await db.siteContent.findUnique({ where: { id: 1 }, omit });
    return row
      ? {
          ...row,
          campaignEnabled: false,
          campaignEyebrow: DEFAULT_SITE_CONTENT.campaignEyebrow,
          campaignTitle: DEFAULT_SITE_CONTENT.campaignTitle,
          campaignImageUrl: null,
          campaignVideoUrl: null,
        }
      : null;
  }
}

export async function readSiteContent(): Promise<SiteContentDTO> {
  const row = await findSiteContentRow();
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
    campaignEnabled: row.campaignEnabled,
    campaignEyebrow: row.campaignEyebrow,
    campaignTitle: row.campaignTitle,
    campaignImageUrl: row.campaignImageUrl,
    campaignVideoUrl: row.campaignVideoUrl,
    newsletterEnabled: row.newsletterEnabled,
    newsletterEyebrow: row.newsletterEyebrow,
    newsletterTitle: row.newsletterTitle,
    newsletterText: row.newsletterText,
    newsletterButtonLabel: row.newsletterButtonLabel,
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
