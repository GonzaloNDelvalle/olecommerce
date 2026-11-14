import { getAppUrl } from "@/lib/app-url";

/** Inserta datos estructurados. Neutraliza "<" para que no se cierre el <script>. */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}

export interface Crumb {
  name: string;
  /** Ruta relativa ("/categoria/abrigos"). La última miga puede no tener link. */
  path?: string;
}

export function breadcrumbJsonLd(crumbs: Crumb[]): Record<string, unknown> {
  const base = getAppUrl();
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((crumb, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: crumb.name,
      ...(crumb.path ? { item: `${base}${crumb.path}` } : {}),
    })),
  };
}
