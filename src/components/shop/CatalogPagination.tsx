import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface CatalogPaginationProps {
  page: number;
  pageCount: number;
  searchParams: Record<string, string | undefined>;
}

function pageHref(
  searchParams: Record<string, string | undefined>,
  page: number
): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (value && key !== "pagina") params.set(key, value);
  }
  if (page > 1) params.set("pagina", String(page));
  const query = params.toString();
  return query ? `/productos?${query}` : "/productos";
}

/** Paginación del catálogo mediante `?pagina=N` (enlaces rastreables por Google). */
export function CatalogPagination({
  page,
  pageCount,
  searchParams,
}: CatalogPaginationProps) {
  if (pageCount <= 1) return null;

  const linkClass =
    "inline-flex h-10 min-w-10 items-center justify-center border px-3 text-[11px] tracking-[0.18em] uppercase transition-colors";

  return (
    <nav
      aria-label="Paginación del catálogo"
      className="mt-16 flex flex-wrap items-center justify-center gap-2"
    >
      {page > 1 && (
        <Link
          href={pageHref(searchParams, page - 1)}
          rel="prev"
          className={`${linkClass} border-stone-200 text-stone-700 hover:border-stone-900`}
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          <span className="sr-only">Página anterior</span>
        </Link>
      )}

      {Array.from({ length: pageCount }, (_, i) => i + 1).map((n) => (
        <Link
          key={n}
          href={pageHref(searchParams, n)}
          aria-current={n === page ? "page" : undefined}
          className={`${linkClass} ${
            n === page
              ? "border-stone-900 bg-stone-900 text-white"
              : "border-stone-200 text-stone-700 hover:border-stone-900"
          }`}
        >
          {n}
        </Link>
      ))}

      {page < pageCount && (
        <Link
          href={pageHref(searchParams, page + 1)}
          rel="next"
          className={`${linkClass} border-stone-200 text-stone-700 hover:border-stone-900`}
        >
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="sr-only">Página siguiente</span>
        </Link>
      )}
    </nav>
  );
}
