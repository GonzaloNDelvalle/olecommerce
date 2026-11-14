import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "OL. Indumenti",
    short_name: "OL.",
    description: "Indumentaria atemporal en tonos tierra. Envíos a todo el país.",
    start_url: "/",
    display: "standalone",
    background_color: "#FAF7F2",
    theme_color: "#2C2119",
    lang: "es-AR",
    icons: [
      { src: "/icon", sizes: "64x64", type: "image/png" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
