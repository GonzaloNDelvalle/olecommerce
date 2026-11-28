"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink, Loader2 } from "lucide-react";
import {
  updateAdminSiteContent,
  type AdminProductImagesDTO,
  type SiteContentInput,
} from "@/modules/admin/actions/admin-content.actions";
import type { SiteContentDTO } from "@/modules/content/site-content";
import { SingleImageDropzone } from "@/modules/admin/components/ImageDropzone";
import { HeroVideoUpload } from "@/modules/admin/components/HeroVideoUpload";
import { FeaturedPicksField } from "@/modules/admin/components/FeaturedPicksField";
import {
  AdminCard,
  AdminNotice,
  adminInputClass,
  adminLabelClass,
  adminPrimaryButtonClass,
} from "@/modules/admin/components/AdminUi";

type TextField = {
  name: keyof SiteContentDTO;
  label: string;
  placeholder?: string;
  hint?: string;
  maxLength: number;
  wide?: boolean;
};

const SEASON_FIELDS: TextField[] = [
  { name: "collectionName", label: "Nombre de la colección", placeholder: "Neutral State", maxLength: 80 },
  { name: "seasonLabel", label: "Temporada", placeholder: "SS'27 / Hot Sale / Black Friday", maxLength: 40, hint: "Aparece en el menú, el catálogo y el pie de página" },
];

const HERO_FIELDS: TextField[] = [
  { name: "heroEyebrow", label: "Volanta (texto chico arriba)", placeholder: "OL Indumenti • Spring / Summer Collection", maxLength: 120, wide: true },
  { name: "heroTitle", label: "Título", placeholder: "Neutral State - SS'27", maxLength: 80, wide: true },
  { name: "heroSubtitle", label: "Bajada (opcional)", maxLength: 300, wide: true },
];

const CAMPAIGN_FIELDS: TextField[] = [
  { name: "campaignTitle", label: "Título", placeholder: "Hecho para durar", maxLength: 80 },
];

const NEWSLETTER_FIELDS: TextField[] = [
  { name: "newsletterEyebrow", label: "Volanta", placeholder: "Manifiesto OL.", maxLength: 120, wide: true },
  { name: "newsletterTitle", label: "Frase principal", placeholder: "“Prendas versátiles. Estado de calma y equilibrio.”", maxLength: 160, wide: true },
  { name: "newsletterText", label: "Texto de invitación (opcional)", maxLength: 400, wide: true },
  { name: "newsletterButtonLabel", label: "Texto del botón", placeholder: "Suscribirme", maxLength: 40 },
];

const HERO_SLOTS = 3;

export function SiteContentForm({
  initial,
  productImages,
}: {
  initial: SiteContentDTO;
  productImages: AdminProductImagesDTO[];
}) {
  const router = useRouter();
  const [values, setValues] = useState(initial);
  const [message, setMessage] = useState<
    { tone: "success" | "error"; text: string } | null
  >(null);
  const [isPending, startTransition] = useTransition();

  function update<K extends keyof SiteContentDTO>(key: K, value: SiteContentDTO[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function handleSave() {
    setMessage(null);
    const payload: SiteContentInput = {
      ...values,
      heroSubtitle: values.heroSubtitle ?? "",
      newsletterText: values.newsletterText ?? "",
      campaignImageUrl: values.campaignImageUrl ?? "",
      campaignVideoUrl: values.campaignVideoUrl ?? "",
      campaignMobileVideoUrl: values.campaignMobileVideoUrl ?? "",
    };
    startTransition(async () => {
      const result = await updateAdminSiteContent(payload);
      setMessage(
        result.success
          ? { tone: "success", text: result.message }
          : { tone: "error", text: result.error }
      );
      if (result.success) router.refresh();
    });
  }

  const renderField = (field: TextField) => {
    const value = (values[field.name] as string | null) ?? "";
    const isLong = field.maxLength > 120;
    return (
      <div key={field.name} className={field.wide ? "sm:col-span-2" : undefined}>
        <label htmlFor={field.name} className={adminLabelClass}>
          {field.label}
        </label>
        {isLong ? (
          <textarea
            id={field.name}
            rows={2}
            maxLength={field.maxLength}
            value={value}
            onChange={(e) => update(field.name, e.target.value as never)}
            className={`mt-1.5 ${adminInputClass}`}
          />
        ) : (
          <input
            id={field.name}
            type="text"
            maxLength={field.maxLength}
            placeholder={field.placeholder}
            value={value}
            onChange={(e) => update(field.name, e.target.value as never)}
            className={`mt-1.5 ${adminInputClass}`}
          />
        )}
        {field.hint && <p className="mt-1 text-[11px] text-stone-400">{field.hint}</p>}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {message && <AdminNotice tone={message.tone}>{message.text}</AdminNotice>}

      <AdminCard
        title="Temporada"
        description="Cambiala al pasar de colección o para una campaña (Hot Sale, Black Friday)."
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {SEASON_FIELDS.map(renderField)}
        </div>
      </AdminCard>

      <AdminCard
        title="Banner principal de la portada"
        description="Carrusel de hasta 3 imágenes que pasan solas. Debajo del título queda un único botón «Ver todo»."
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {HERO_FIELDS.map(renderField)}
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {Array.from({ length: HERO_SLOTS }).map((_, slot) => (
            <SingleImageDropzone
              key={slot}
              label={`Imagen ${slot + 1}${slot === 0 ? " (obligatoria)" : ""}`}
              helperText="Horizontal, de 1920 px de ancho o más"
              subfolder="hero"
              value={values.heroImageUrls[slot] ?? ""}
              onChange={(url) => {
                const next = Array.from({ length: HERO_SLOTS }, (_, i) => values.heroImageUrls[i] ?? "");
                next[slot] = url;
                update("heroImageUrls", next.filter(Boolean));
              }}
            />
          ))}
        </div>
      </AdminCard>

      <AdminCard
        title="Imágenes de la sección de temporada"
        description="Las tarjetas con el nombre de la colección. Elegí qué fotos aparecen y en qué orden."
      >
        <FeaturedPicksField
          products={productImages}
          value={values.featuredImageIds}
          onChange={(ids) => update("featuredImageIds", ids)}
        />
      </AdminCard>

      <AdminCard
        title="Campaña (video)"
        description="Un video a pantalla completa que se repite en loop, con el título encima. Podés subir uno horizontal para escritorio y otro vertical para celulares; si falta uno, se usa el otro."
      >
        <label className="mb-5 inline-flex items-center gap-2 text-sm text-stone-700">
          <input
            type="checkbox"
            checked={values.campaignEnabled}
            onChange={(e) => update("campaignEnabled", e.target.checked)}
            className="h-4 w-4 rounded border-stone-300"
          />
          Mostrar la campaña en la portada
        </label>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {CAMPAIGN_FIELDS.map(renderField)}
        </div>
        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
          <HeroVideoUpload
            label="Video de escritorio (horizontal, 16:9)"
            value={values.campaignVideoUrl}
            onChange={(url) => update("campaignVideoUrl", url)}
          />
          <HeroVideoUpload
            label="Video de celular (vertical, 9:16)"
            value={values.campaignMobileVideoUrl}
            onChange={(url) => update("campaignMobileVideoUrl", url)}
          />
          <SingleImageDropzone
            label="Imagen de portada (opcional)"
            helperText="Se ve mientras el video carga o si el dispositivo no lo reproduce"
            subfolder="hero"
            value={values.campaignImageUrl ?? ""}
            onChange={(url) => update("campaignImageUrl", url || null)}
          />
        </div>
      </AdminCard>

      <AdminCard
        title="Banner de newsletter"
        description="La sección oscura al final de la portada. Las suscriptoras se ven en Newsletter."
      >
        <label className="mb-5 inline-flex items-center gap-2 text-sm text-stone-700">
          <input
            type="checkbox"
            checked={values.newsletterEnabled}
            onChange={(e) => update("newsletterEnabled", e.target.checked)}
            className="h-4 w-4 rounded border-stone-300"
          />
          Mostrar el banner en la portada
        </label>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {NEWSLETTER_FIELDS.map(renderField)}
        </div>
      </AdminCard>

      <AdminCard
        title="Barra de anuncios"
        description="La franja arriba del menú: los mensajes pasan en carrusel continuo. Se editan más abajo."
      >
        <div className="flex flex-wrap items-center gap-6">
          <label className="inline-flex items-center gap-2 text-sm text-stone-700">
            <input
              type="checkbox"
              checked={values.announcementEnabled}
              onChange={(e) => update("announcementEnabled", e.target.checked)}
              className="h-4 w-4 rounded border-stone-300"
            />
            Mostrar la barra en la tienda
          </label>
          <div className="flex items-center gap-2">
            <label htmlFor="rotate" className={adminLabelClass}>
              Tiempo por mensaje
            </label>
            <input
              id="rotate"
              type="number"
              min={2}
              max={30}
              value={values.announcementRotateSeconds}
              onChange={(e) =>
                update("announcementRotateSeconds", Number(e.target.value) || 5)
              }
              className={`w-20 ${adminInputClass}`}
            />
            <span className="text-xs text-stone-500">segundos</span>
          </div>
        </div>
      </AdminCard>

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className={adminPrimaryButtonClass}
        >
          {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          Publicar cambios
        </button>
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs text-stone-500 hover:text-stone-900"
        >
          Ver la tienda <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>
    </div>
  );
}
