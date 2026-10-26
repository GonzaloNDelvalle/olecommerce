"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";

function SearchBarInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentQuery = searchParams.get("q") ?? "";

  const [query, setQuery] = useState(currentQuery);

  useEffect(() => {
    setQuery(currentQuery);
  }, [currentQuery]);

  function buildTargetUrl(nextQuery: string) {
    const params = new URLSearchParams(searchParams.toString());
    const trimmed = nextQuery.trim();

    if (trimmed) {
      params.set("q", trimmed);
    } else {
      params.delete("q");
    }

    const queryString = params.toString();
    return queryString ? `/?${queryString}` : "/";
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    router.push(buildTargetUrl(query));
  }

  function handleClear() {
    setQuery("");
    router.push(buildTargetUrl(""));
  }

  return (
    <form
      onSubmit={handleSubmit}
      role="search"
      className="relative flex w-full max-w-md items-center"
    >
      <Search className="pointer-events-none absolute left-3.5 h-3.5 w-3.5 text-stone-400" />
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Buscar prenda por nombre..."
        aria-label="Buscar prendas en el catálogo"
        className="w-full rounded-lg border border-stone-200 bg-stone-50 py-2 pr-9 pl-9 text-xs text-stone-900 placeholder:text-stone-400 transition-colors focus:border-stone-900 focus:bg-white focus:outline-none"
      />
      {query && (
        <button
          type="button"
          onClick={handleClear}
          aria-label="Limpiar búsqueda"
          className="absolute right-2.5 rounded p-0.5 text-stone-400 transition-colors hover:text-stone-900"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </form>
  );
}

export function SearchBar() {
  return (
    <Suspense
      fallback={
        <div className="h-9 w-full max-w-md animate-pulse rounded-lg border border-stone-200 bg-stone-50" />
      }
    >
      <SearchBarInner />
    </Suspense>
  );
}
