/** URLs públicas del catálogo. Un solo lugar para cambiarlas. */

export function categoryHref(slug: string): string {
  return `/categoria/${encodeURIComponent(slug)}`;
}

export function productHref(slugOrId: string): string {
  return `/productos/${encodeURIComponent(slugOrId)}`;
}
