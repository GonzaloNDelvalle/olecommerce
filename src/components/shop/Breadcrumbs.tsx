import Link from "next/link";
import { JsonLd, breadcrumbJsonLd, type Crumb } from "@/modules/seo/json-ld";

/** Migas visibles + BreadcrumbList para Google, desde la misma fuente. */
export function Breadcrumbs({ crumbs }: { crumbs: Crumb[] }) {
  return (
    <>
      <nav aria-label="Migas de pan" className="text-[13px] text-stone-600">
        <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
          {crumbs.map((crumb, i) => {
            const last = i === crumbs.length - 1;
            return (
              <li key={`${crumb.name}-${i}`} className="flex items-center gap-2">
                {crumb.path && !last ? (
                  <Link href={crumb.path} className="hover:text-ink hover:underline">
                    {crumb.name}
                  </Link>
                ) : (
                  <span aria-current={last ? "page" : undefined} className={last ? "text-ink" : undefined}>
                    {crumb.name}
                  </span>
                )}
                {!last && <span aria-hidden="true">/</span>}
              </li>
            );
          })}
        </ol>
      </nav>
      <JsonLd data={breadcrumbJsonLd(crumbs)} />
    </>
  );
}
