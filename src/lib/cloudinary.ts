/**
 * Validación de las URLs de imágenes que llegan del formulario de productos.
 *
 * Las fotos se suben directo del navegador a Cloudinary (ver
 * `admin-uploads.actions.ts`), así que acá solo se aceptan URLs https de
 * los orígenes permitidos; nunca archivos ni data URIs.
 */
const ALLOWED_IMAGE_HOSTS = new Set([
  "res.cloudinary.com",
  // Imágenes de ejemplo del seed
  "images.unsplash.com",
  "media.istockphoto.com",
]);

export async function resolveProductImageUrl(
  imageSource: string | undefined | null
): Promise<string> {
  const trimmed = imageSource?.trim() ?? "";
  if (!trimmed) return "";

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    throw new Error("Una de las imágenes no tiene una URL válida.");
  }

  if (url.protocol !== "https:" || !ALLOWED_IMAGE_HOSTS.has(url.hostname)) {
    throw new Error(
      "Las imágenes deben subirse desde el formulario (Cloudinary). Volvé a cargar la foto."
    );
  }

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  if (
    url.hostname === "res.cloudinary.com" &&
    cloudName &&
    !url.pathname.startsWith(`/${cloudName}/`)
  ) {
    throw new Error("La imagen no pertenece a la cuenta de Cloudinary de la tienda.");
  }

  return url.toString();
}
