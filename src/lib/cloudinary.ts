/**
 * Validación de las URLs de imágenes y videos que llegan de los formularios
 * del admin.
 *
 * Los archivos se suben directo del navegador a Cloudinary (ver
 * `admin-uploads.actions.ts`), así que acá solo se aceptan URLs https de
 * los orígenes permitidos; nunca archivos ni data URIs.
 */
const ALLOWED_MEDIA_HOSTS = new Set([
  "res.cloudinary.com",
  // Imágenes y video de ejemplo del seed
  "images.unsplash.com",
  "media.istockphoto.com",
  "assets.mixkit.co",
]);

export function assertAllowedMediaUrl(source: string): string {
  let url: URL;
  try {
    url = new URL(source.trim());
  } catch {
    throw new Error("Uno de los archivos no tiene una URL válida.");
  }

  if (url.protocol !== "https:" || !ALLOWED_MEDIA_HOSTS.has(url.hostname)) {
    throw new Error(
      "Las imágenes y videos deben subirse desde el formulario (Cloudinary). Volvé a cargar el archivo."
    );
  }

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  if (
    url.hostname === "res.cloudinary.com" &&
    cloudName &&
    !url.pathname.startsWith(`/${cloudName}/`)
  ) {
    throw new Error("El archivo no pertenece a la cuenta de Cloudinary de la tienda.");
  }

  return url.toString();
}

export async function resolveProductImageUrl(
  imageSource: string | undefined | null
): Promise<string> {
  const trimmed = imageSource?.trim() ?? "";
  if (!trimmed) return "";
  return assertAllowedMediaUrl(trimmed);
}
