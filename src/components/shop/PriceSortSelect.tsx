"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ArrowUpDown } from "lucide-react";

interface PriceSortSelectProps {
  activeSort?: string;
}

export function PriceSortSelect({ activeSort }: PriceSortSelectProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentSort = activeSort ?? searchParams.get("orden") ?? "recientes";

  function handleSortChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const nextSort = e.target.value;
    const params = new URLSearchParams(searchParams.toString());

    if (nextSort && nextSort !== "recientes") {
      params.set("orden", nextSort);
    } else {
      params.delete("orden");
    }

    const qs = params.toString();
    router.push(qs ? `/?${qs}` : "/");
  }

  return (
    <div>
      <label
        htmlFor="catalog-sort-select"
        className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wider text-stone-900 uppercase"
      >
        <ArrowUpDown className="h-3.5 w-3.5 text-stone-500" />
        Ordenar por
      </label>

      <select
        id="catalog-sort-select"
        value={currentSort}
        onChange={handleSortChange}
        className="mt-2.5 w-full rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-xs font-medium text-stone-800 transition-colors focus:border-stone-900 focus:bg-white focus:outline-none"
      >
        <option value="recientes">Destacados y Más Recientes</option>
        <option value="precio_asc">Precio: Menor a Mayor</option>
        <option value="precio_desc">Precio: Mayor a Menor</option>
      </select>
    </div>
  );
}
