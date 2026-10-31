"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";

interface SearchBarProps {
  isTransparent?: boolean;
  onAfterSubmit?: () => void;
}

function SearchBarInner({
  isTransparent = false,
  onAfterSubmit,
}: SearchBarProps) {
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
    return queryString ? `/productos?${queryString}` : "/productos";
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    router.push(buildTargetUrl(query));
    onAfterSubmit?.();
  }

  function handleClear() {
    setQuery("");
    router.push(buildTargetUrl(""));
  }

  return (
    <form
      onSubmit={handleSubmit}
      role="search"
      className="relative flex w-full items-center"
    >
      <Search
        strokeWidth={1.4}
        className={`pointer-events-none absolute left-0 h-3.5 w-3.5 transition-colors ${
          isTransparent ? "text-stone-200" : "text-stone-400"
        }`}
      />
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="BUSCAR PRENDA..."
        aria-label="Buscar prendas en el catálogo"
        className={`w-full rounded-none border-0 border-b py-1.5 pr-6 pl-6 text-[11px] font-light tracking-[0.18em] uppercase transition-colors focus:outline-none ${
          isTransparent
            ? "border-white/40 bg-transparent text-white placeholder:text-stone-200/75 focus:border-white"
            : "border-stone-300 bg-transparent text-stone-900 placeholder:text-stone-400 focus:border-stone-900"
        }`}
      />
      {query && (
        <button
          type="button"
          onClick={handleClear}
          aria-label="Limpiar búsqueda"
          className={`absolute right-0 p-0.5 transition-colors ${
            isTransparent
              ? "text-stone-200 hover:text-white"
              : "text-stone-400 hover:text-stone-900"
          }`}
        >
          <X className="h-3.5 w-3.5" strokeWidth={1.5} />
        </button>
      )}
    </form>
  );
}

export function SearchBar({ isTransparent = false, onAfterSubmit }: SearchBarProps) {
  return (
    <Suspense
      fallback={
        <div
          className={`h-7 w-full animate-pulse border-b ${
            isTransparent ? "border-white/25" : "border-stone-200"
          }`}
        />
      }
    >
      <SearchBarInner
        isTransparent={isTransparent}
        onAfterSubmit={onAfterSubmit}
      />
    </Suspense>
  );
}
