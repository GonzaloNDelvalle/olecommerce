import type { MetadataRoute } from "next";
import { getAppUrl } from "@/lib/app-url";

export default function robots(): MetadataRoute.Robots {
  const appUrl = getAppUrl();
  const isProduction = process.env.VERCEL_ENV
    ? process.env.VERCEL_ENV === "production"
    : process.env.NODE_ENV === "production";

  // Los deploys de preview no se indexan
  if (!isProduction) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin",
        "/api/",
        "/checkout",
        "/mi-cuenta",
        "/login",
        "/registro",
        "/verificar-email",
        "/recuperar-contrasena",
        "/restablecer-contrasena",
      ],
    },
    sitemap: `${appUrl}/sitemap.xml`,
  };
}
