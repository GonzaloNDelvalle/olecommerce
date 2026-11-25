import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/cn";

/**
 * Grilla de categorías de 2 filas × 3 columnas con tarjetas de distinto ancho
 * y alto (mosaico irregular). Las filas con menos tarjetas reparten el ancho.
 * Anchos en la grilla de 12 columnas (escritorio); en celular son 2 columnas
 * con la primera tarjeta a lo ancho.
 */
const ROW_SPANS: Record<number, string[][]> = {
  // [fila 1, fila 2] según cuántas tarjetas tiene la fila
  1: [["lg:col-span-12"], ["lg:col-span-12"]],
  2: [
    ["lg:col-span-7", "lg:col-span-5"],
    ["lg:col-span-5", "lg:col-span-7"],
  ],
  3: [
    ["lg:col-span-5", "lg:col-span-4", "lg:col-span-3"],
    ["lg:col-span-3", "lg:col-span-4", "lg:col-span-5"],
  ],
};

const ROW_HEIGHTS = ["lg:h-[82svh] lg:min-h-[560px]", "lg:h-[66svh] lg:min-h-[460px]"];

function mobileSpan(index: number, total: number) {
  // En celular: la primera tarjeta, y la última si quedaría sola, van a lo ancho
  if (index === 0) return "col-span-2";
  if (index === total - 1 && total % 2 === 0) return "col-span-2";
  return "col-span-1";
}

export interface TileItem {
  id: string;
  name: string;
  slug: string;
  coverImageUrl: string | null;
  /** Bajada: aparece al pasar el mouse (en pantallas táctiles, siempre). */
  description: string | null;
}

/** Mosaico de tarjetas a todo el ancho: `hrefFor` arma el link de cada una. */
export function CategoryTiles({ categories, hrefFor }: { categories: TileItem[]; hrefFor: (slug: string) => string }) {
  const tiles = categories.slice(0, 6);
  if (tiles.length === 0) return null;

  const rows = [tiles.slice(0, 3), tiles.slice(3, 6)].filter((row) => row.length > 0);

  return (
    <div className="grid grid-cols-2 gap-0.5 lg:grid-cols-12">
      {rows.flatMap((row, rowIndex) =>
        row.map((category, colIndex) => {
          const index = rowIndex * 3 + colIndex;
          const lgSpan = ROW_SPANS[row.length][rowIndex][colIndex];
          return (
            <Link
              key={category.id}
              href={hrefFor(category.slug)}
              data-reveal-item
              className={cn(
                "group relative isolate flex h-[320px] items-end overflow-hidden bg-cream sm:h-[440px]",
                mobileSpan(index, tiles.length),
                lgSpan,
                ROW_HEIGHTS[rowIndex]
              )}
            >
              {category.coverImageUrl && (
                <Image
                  src={category.coverImageUrl}
                  alt=""
                  fill
                  sizes="(max-width: 1024px) 50vw, 40vw"
                  className="-z-10 object-cover transition-transform duration-700 ease-[var(--ease-out)] group-hover:scale-105"
                />
              )}
              <span
                aria-hidden="true"
                className={cn(
                  "absolute inset-0 -z-10",
                  category.coverImageUrl ? "bg-gradient-to-t from-ink/65 via-ink/10 to-transparent" : "bg-sand/40"
                )}
              />
              <span
                className={cn(
                  "flex w-full flex-col p-4 sm:p-8",
                  category.coverImageUrl ? "text-paper" : "text-ink"
                )}
              >
                <span className="display text-[clamp(26px,4vw,64px)] break-words">{category.name}</span>
                {category.description && (
                  <span className="grid transition-[grid-template-rows,opacity] duration-500 ease-[var(--ease-out)] [@media(hover:hover)]:grid-rows-[0fr] [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:grid-rows-[1fr] [@media(hover:hover)]:group-hover:opacity-100 [@media(hover:hover)]:group-focus-visible:grid-rows-[1fr] [@media(hover:hover)]:group-focus-visible:opacity-100">
                    <span className="overflow-hidden">
                      <span className="line-clamp-2 block max-w-[44ch] pt-2 text-[13px] leading-snug sm:text-[15px]">
                        {category.description}
                      </span>
                    </span>
                  </span>
                )}
              </span>
            </Link>
          );
        })
      )}
    </div>
  );
}
