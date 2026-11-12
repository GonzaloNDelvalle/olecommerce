"use client";

import { useRef, useState } from "react";
import { Film, Loader2, X } from "lucide-react";
import { getCloudinaryUploadSignature } from "@/modules/admin/actions/admin-uploads.actions";
import { adminLabelClass, adminSecondaryButtonClass } from "@/modules/admin/components/AdminUi";

const ACCEPTED_VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];
const MAX_VIDEO_BYTES = 80 * 1024 * 1024; // 80 MB

async function uploadVideoToCloudinary(file: File): Promise<string> {
  if (!ACCEPTED_VIDEO_TYPES.includes(file.type)) {
    throw new Error("Subí un video MP4, WEBM o MOV.");
  }
  if (file.size > MAX_VIDEO_BYTES) {
    throw new Error("El video supera los 80 MB. Exportalo más liviano (1080p, 15–30 segundos).");
  }

  const { cloudName, apiKey, timestamp, signature, folder } =
    await getCloudinaryUploadSignature("hero");

  const body = new FormData();
  body.append("file", file);
  body.append("api_key", apiKey);
  body.append("timestamp", String(timestamp));
  body.append("signature", signature);
  body.append("folder", folder);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/video/upload`,
    { method: "POST", body }
  );
  const result = (await response.json().catch(() => null)) as {
    secure_url?: string;
    error?: { message?: string };
  } | null;

  if (!response.ok || !result?.secure_url) {
    throw new Error(
      `No se pudo subir el video${result?.error?.message ? `: ${result.error.message}` : "."}`
    );
  }
  return result.secure_url;
}

/** Carga del video de fondo del banner (opcional; si no hay, se usa la imagen). */
export function HeroVideoUpload({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (url: string | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    setIsUploading(true);
    try {
      onChange(await uploadVideoToCloudinary(file));
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo subir el video.");
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="space-y-2">
      <span className={adminLabelClass}>Video de fondo (opcional)</span>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_VIDEO_TYPES.join(",")}
        className="hidden"
        onChange={(e) => {
          void handleFile(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      {value ? (
        <div className="flex items-center gap-3 rounded-lg border border-stone-200 p-2.5">
          <video
            src={value}
            muted
            playsInline
            className="h-14 w-24 rounded-md bg-stone-100 object-cover"
          />
          <p className="min-w-0 flex-1 truncate text-xs text-stone-500">{value}</p>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={isUploading}
            className={adminSecondaryButtonClass}
          >
            {isUploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Reemplazar"}
          </button>
          <button
            type="button"
            onClick={() => onChange(null)}
            aria-label="Quitar video"
            className="rounded-lg p-1.5 text-stone-400 hover:bg-red-50 hover:text-red-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-stone-300 px-4 py-5 text-xs text-stone-600 hover:border-stone-900"
        >
          {isUploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Film className="h-4 w-4" />
          )}
          {isUploading ? "Subiendo video..." : "Subir video (MP4, hasta 80 MB)"}
        </button>
      )}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
