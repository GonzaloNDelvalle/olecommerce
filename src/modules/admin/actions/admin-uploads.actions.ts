"use server";

import { v2 as cloudinary } from "cloudinary";
import { requireAdmin } from "@/lib/auth-guards";

export type UploadSubfolder = "gallery" | "variants" | "hero";

const UPLOAD_FOLDERS: Record<UploadSubfolder, string> = {
  gallery: "products/gallery",
  variants: "products/variants",
  hero: "site/hero",
};

export interface CloudinaryUploadSignature {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  folder: string;
}

const ROOT_FOLDER = (process.env.CLOUDINARY_FOLDER?.trim() || "olecommerce")
  .replace(/^\/+|\/+$/g, "");

/**
 * Firma una subida directa navegador → Cloudinary.
 *
 * Las imágenes ya no pasan por nuestro servidor (antes viajaban en base64
 * dentro de la Server Action y chocaban con el límite de 4,5 MB de Vercel).
 * La firma solo es válida para la carpeta indicada y por unos minutos.
 */
export async function getCloudinaryUploadSignature(
  subfolder: UploadSubfolder
): Promise<CloudinaryUploadSignature> {
  await requireAdmin();

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
  const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();
  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error(
      "Faltan las credenciales de Cloudinary (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET)."
    );
  }

  const folder = `${ROOT_FOLDER}/${UPLOAD_FOLDERS[subfolder] ?? UPLOAD_FOLDERS.gallery}`;
  const timestamp = Math.round(Date.now() / 1000);
  const signature = cloudinary.utils.api_sign_request(
    { folder, timestamp },
    apiSecret
  );

  return { cloudName, apiKey, timestamp, signature, folder };
}
