import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { cn } from "@/lib/cn";

interface CatalogPaginationProps {
  basePath: string;
  page: number;
  pageCount: number;
  pageSize: number;
  total: number;
  searchParams: Record<string, string | undefined>;
}

function pageHref(basePath: string, searchParams: Record<string, string | undefined>, page: number): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (value && key !== "pagina") params.set(key, value);
  }
  if (page > 1) params.set("pagina", String(page));
  const query = params.toString();
  return query ? `${basePath}?${query}` : basePath;
}

/** Páginas visibles: primera, última y vecinas de la actual. */
function visiblePages(page: number, pageCount: number): (number | "…")[] {
  const set = new Set([1, pageCount, page - 1, page, page + 1].filter((n) => n >= 1 && n <= pageCount));
  const sorted = [...set].sort((a, b) => a - b);
  const out: (number | "…")[] = [];
  sorted.forEach((n, i) => {
    if (i > 0 && n - sorted[i - 1] > 1) out.push("…");
    out.push(n);
  });
  return out;
}

/**
 * Paginación con `?pagina=N` (links rastreables por Google) y progreso de
 * cuántas prendas se vieron.
 */
export function CatalogPagination({ basePath, page, pageCount, pageSize, total, searchParams }: CatalogPaginationProps) {
  if (total === 0) return null;
  const seen = Math.min(page * pageSize, total);
  const progress = Math.round((seen / total) * 100);

  return (
    <div className="flex flex-col items-center gap-5 pt-16 pb-8">
      <p className="text-sm text-stone-600">
        Viendo <span className="tabular font-semibold text-ink">{seen}</span> de{" "}
        <span className="tabular font-semibold text-ink">{total}</span>
      </p>
      <div className="h-0.5 w-60 bg-stone-200" aria-hidden="true">
        <div className="h-0.5 bg-ink" style={{ width: `${progress}%` }} />
      </div>

      {pageCount > 1 && (
        <nav aria-label="Paginación" className="flex flex-wrap items-center justify-center gap-1.5">
          {page > 1 && (
            <Link
              href={pageHref(basePath, searchParams, page - 1)}
              rel="prev"
              aria-label="Página anterior"
              className="pressable inline-flex size-11 items-center justify-center rounded-full border border-stone-300 hover:border-ink"
            >
              <ArrowLeft className="size-4" strokeWidth={1.8} />
            </Link>
          )}
          {visiblePages(page, pageCount).map((n, i) =>
            n === "…" ? (
              <span key={`gap-${i}`} className="px-1 text-stone-500" aria-hidden="true">
                …
              </span>
            ) : (
              <Link
                key={n}
                href={pageHref(basePath, searchParams, n)}
                aria-current={n === page ? "page" : undefined}
                aria-label={`Página ${n}`}
                className={cn(
                  "pressable tabular inline-flex size-11 items-center justify-center rounded-full text-sm font-semibold",
                  n === page ? "bg-ink text-paper" : "text-ink hover:bg-ink/5",
                )}
              >
                {n}
              </Link>
            ),
          )}
          {page < pageCount && (
            <Link
              href={pageHref(basePath, searchParams, page + 1)}
              rel="next"
              className="pressable ml-2 inline-flex h-11 items-center gap-2 rounded-full border border-ink px-5 text-sm font-semibold hover:bg-ink hover:text-paper"
            >
              Siguiente
              <ArrowRight className="size-4" strokeWidth={1.8} aria-hidden="true" />
            </Link>
          )}
        </nav>
      )}
    </div>
  );
}
