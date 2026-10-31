import { v2 as cloudinary } from "cloudinary";

function ensureCloudinaryConfigured() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
  const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error(
      "Faltan las credenciales de Cloudinary en el archivo .env (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY y CLOUDINARY_API_SECRET)."
    );
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });
}

/**
 * Sube una imagen codificada en Data URI (`data:image/...;base64,...`) a Cloudinary
 * o devuelve la URL tal cual si ya es una URL remota (`https://...`).
 */
export async function resolveProductImageUrl(
  imageSource: string | undefined | null,
  folder = "olecommerce/products"
): Promise<string> {
  const trimmed = imageSource?.trim() ?? "";
  if (!trimmed) return "";

  // Si ya es una URL remota (ej. imagen existente de Cloudinary o Unsplash al editar), se conserva
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }

  if (!trimmed.startsWith("data:image/")) {
    throw new Error(
      "El formato del archivo de imagen no es válido. Subí una imagen JPG, PNG, WEBP o AVIF."
    );
  }

  ensureCloudinaryConfigured();

  const uploadResult = await cloudinary.uploader.upload(trimmed, {
    folder,
    resource_type: "image",
    transformation: [{ quality: "auto", fetch_format: "auto" }],
  });

  return uploadResult.secure_url;
}
