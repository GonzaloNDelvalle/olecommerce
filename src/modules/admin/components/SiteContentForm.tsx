"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink, Loader2 } from "lucide-react";
import {
  updateAdminSiteContent,
  type SiteContentInput,
} from "@/modules/admin/actions/admin-content.actions";
import type { SiteContentDTO } from "@/modules/content/site-content";
import { SingleImageDropzone } from "@/modules/admin/components/ImageDropzone";
import { HeroVideoUpload } from "@/modules/admin/components/HeroVideoUpload";
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
  { name: "heroCtaLabel", label: "Texto del botón", placeholder: "Explorar", maxLength: 40 },
  { name: "heroCtaHref", label: "Link del botón", placeholder: "/productos", maxLength: 255, hint: "Una página de la tienda, ej: /productos?categoria=denim" },
];

const NEWSLETTER_FIELDS: TextField[] = [
  { name: "newsletterEyebrow", label: "Volanta", placeholder: "Manifiesto OL.", maxLength: 120, wide: true },
  { name: "newsletterTitle", label: "Frase principal", placeholder: "“Prendas versátiles. Estado de calma y equilibrio.”", maxLength: 160, wide: true },
  { name: "newsletterText", label: "Texto de invitación (opcional)", maxLength: 400, wide: true },
  { name: "newsletterButtonLabel", label: "Texto del botón", placeholder: "Suscribirme", maxLength: 40 },
];

export function SiteContentForm({ initial }: { initial: SiteContentDTO }) {
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
      heroImageUrl: values.heroImageUrl ?? "",
      heroVideoUrl: values.heroVideoUrl ?? "",
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

      <AdminCard title="Banner principal de la portada">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {HERO_FIELDS.map(renderField)}
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
          <SingleImageDropzone
            label="Imagen de fondo"
            helperText="Se usa si no hay video, y como portada mientras el video carga"
            subfolder="hero"
            value={values.heroImageUrl ?? ""}
            onChange={(url) => update("heroImageUrl", url || null)}
          />
          <HeroVideoUpload
            value={values.heroVideoUrl}
            onChange={(url) => update("heroVideoUrl", url)}
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
        description="La franja negra arriba del menú. Los mensajes se editan más abajo."
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
              Cambiar mensaje cada
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
