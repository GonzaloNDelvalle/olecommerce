"use client";

import { useRef, useState } from "react";
import { UploadCloud, X, Image as ImageIcon, RefreshCw } from "lucide-react";

const ACCEPTED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
];
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB por imagen

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!ACCEPTED_MIME_TYPES.includes(file.type)) {
      reject(
        new Error(
          `El archivo "${file.name}" no tiene un formato soportado (usá JPG, PNG, WEBP o AVIF).`
        )
      );
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      reject(
        new Error(
          `El archivo "${file.name}" supera el tamaño máximo permitido de 10 MB.`
        )
      );
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("No se pudo leer el archivo seleccionado."));
      }
    };
    reader.onerror = () =>
      reject(new Error("Error al procesar el archivo de imagen."));
    reader.readAsDataURL(file);
  });
}

interface SingleImageDropzoneProps {
  value?: string;
  onChange: (nextDataUrlOrEmpty: string) => void;
  label?: string;
  helperText?: string;
  compact?: boolean;
  badgeText?: string;
}

/**
 * Componente Drag & Drop individual para una foto (usado tanto en cada ítem de la galería
 * como en la foto específica de cada variante de Talle/Color).
 */
export function SingleImageDropzone({
  value,
  onChange,
  label,
  helperText = "Arrastrá una imagen aquí o hacé clic para seleccionar (JPG, PNG, WEBP)",
  compact = false,
  badgeText,
}: SingleImageDropzoneProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  async function processFile(file: File | undefined) {
    if (!file) return;
    setLocalError(null);
    try {
      const dataUrl = await readFileAsDataUrl(file);
      onChange(dataUrl);
    } catch (err) {
      setLocalError(
        err instanceof Error ? err.message : "Archivo de imagen inválido."
      );
    }
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    void processFile(file);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    void processFile(file);
    e.target.value = "";
  }

  const hasImage = Boolean(value && value.trim().length > 0);
  const isNewUpload = Boolean(value?.startsWith("data:image/"));

  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-[11px] font-semibold tracking-wider text-stone-600 uppercase">
          {label}
        </label>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_MIME_TYPES.join(",")}
        onChange={handleFileChange}
        className="hidden"
      />

      {hasImage ? (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`flex items-center justify-between gap-3 rounded-xl border bg-white p-2.5 transition-colors ${
            isDragging
              ? "border-stone-900 bg-stone-50"
              : "border-stone-200 hover:border-stone-300"
          }`}
        >
          <div className="flex min-w-0 items-center gap-3">
            <div
              className={`relative shrink-0 overflow-hidden rounded-lg border border-stone-200 bg-stone-100 ${
                compact ? "h-12 w-10" : "h-16 w-13"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={value}
                alt="Vista previa"
                className="h-full w-full object-cover"
              />
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5">
                {badgeText && (
                  <span className="rounded bg-stone-900 px-2 py-0.5 text-[10px] font-semibold tracking-wider text-white uppercase">
                    {badgeText}
                  </span>
                )}
                <span
                  className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-semibold uppercase ${
                    isNewUpload
                      ? "bg-amber-50 text-amber-800"
                      : "bg-emerald-50 text-emerald-800"
                  }`}
                >
                  <ImageIcon className="h-3 w-3" />
                  {isNewUpload
                    ? "Lista para subir a Cloudinary"
                    : "Almacenada en la nube"}
                </span>
              </div>
              <p className="mt-1 truncate text-xs text-stone-500">
                {isNewUpload
                  ? "Se subirá automáticamente a Cloudinary al guardar el producto"
                  : value}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="inline-flex items-center gap-1 rounded-lg border border-stone-200 bg-stone-50 px-2.5 py-1.5 text-xs font-medium text-stone-700 transition-colors hover:border-stone-900 hover:bg-white hover:text-stone-900"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Reemplazar
            </button>
            <button
              type="button"
              onClick={() => onChange("")}
              title="Quitar imagen"
              aria-label="Quitar imagen"
              className="rounded-lg p-1.5 text-stone-400 transition-colors hover:bg-red-50 hover:text-red-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : (
        <div
          role="button"
          tabIndex={0}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              inputRef.current?.click();
            }
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed text-center transition-colors ${
            compact ? "px-4 py-3.5" : "px-6 py-6"
          } ${
            isDragging
              ? "border-stone-900 bg-stone-100"
              : "border-stone-300 bg-white hover:border-stone-900 hover:bg-stone-50/70"
          }`}
        >
          <UploadCloud className="h-5 w-5 text-stone-500" />
          <p className="mt-1.5 text-xs font-medium text-stone-700">
            {helperText}
          </p>
          <p className="mt-0.5 text-[11px] text-stone-400">
            Formatos JPG, PNG, WEBP o AVIF (máx. 10 MB)
          </p>
        </div>
      )}

      {localError && (
        <p className="text-xs font-medium text-red-600">{localError}</p>
      )}
    </div>
  );
}

interface GalleryMultiDropzoneProps {
  onFilesAdded: (dataUrls: string[]) => void;
}

/**
 * Zona Drag & Drop múltiple para arrastrar varias fotos a la galería de una sola vez.
 */
export function GalleryMultiDropzone({
  onFilesAdded,
}: GalleryMultiDropzoneProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  async function processFileList(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    setLocalError(null);

    const files = Array.from(fileList);
    try {
      const dataUrls = await Promise.all(files.map(readFileAsDataUrl));
      onFilesAdded(dataUrls);
    } catch (err) {
      setLocalError(
        err instanceof Error
          ? err.message
          : "Uno de los archivos seleccionados no es válido."
      );
    }
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    void processFileList(e.dataTransfer.files);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    void processFileList(e.target.files);
    e.target.value = "";
  }

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={ACCEPTED_MIME_TYPES.join(",")}
        onChange={handleFileChange}
        className="hidden"
      />

      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-7 text-center transition-colors ${
          isDragging
            ? "border-stone-900 bg-stone-100"
            : "border-stone-300 bg-stone-50/70 hover:border-stone-900 hover:bg-stone-50"
        }`}
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-stone-700 shadow-2xs">
          <UploadCloud className="h-5 w-5" />
        </div>
        <p className="mt-2.5 text-xs font-semibold text-stone-900">
          Arrastrá y soltá una o varias fotos para la galería, o hacé clic para
          buscar archivos
        </p>
        <p className="mt-1 text-[11px] text-stone-500">
          La primera imagen será la portada principal del producto. Se subirán a
          Cloudinary automáticamente al guardar.
        </p>
      </div>

      {localError && (
        <p className="text-xs font-medium text-red-600">{localError}</p>
      )}
    </div>
  );
}
