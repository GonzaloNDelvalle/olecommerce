"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/cn";

interface SearchBarProps {
  onAfterSubmit?: () => void;
  autoFocus?: boolean;
  className?: string;
}

function SearchBarInner({ onAfterSubmit, autoFocus, className }: SearchBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentQuery = searchParams.get("q") ?? "";

  const [query, setQuery] = useState(currentQuery);

  // Re-sincronizar el input cuando cambia ?q= en la URL
  const [syncedQuery, setSyncedQuery] = useState(currentQuery);
  if (currentQuery !== syncedQuery) {
    setSyncedQuery(currentQuery);
    setQuery(currentQuery);
  }

  function targetUrl(nextQuery: string) {
    const trimmed = nextQuery.trim();
    return trimmed ? `/productos?q=${encodeURIComponent(trimmed)}` : "/productos";
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    router.push(targetUrl(query));
    onAfterSubmit?.();
  }

  return (
    <form onSubmit={handleSubmit} role="search" className={cn("relative flex w-full items-center", className)}>
      <Search
        strokeWidth={1.6}
        aria-hidden="true"
        className="pointer-events-none absolute left-5 size-5 text-stone-500"
      />
      <input
        type="search"
        value={query}
        autoFocus={autoFocus}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Buscá abrigos, tejidos, pantalones…"
        aria-label="Buscar en la tienda"
        enterKeyHint="search"
        className="h-14 w-full rounded-full border border-stone-300 bg-white pr-14 pl-14 text-base text-ink placeholder:text-stone-500 focus:border-ink focus:outline-none"
      />
      {query && (
        <button
          type="button"
          onClick={() => setQuery("")}
          aria-label="Borrar búsqueda"
          className="absolute right-2 inline-flex size-11 items-center justify-center rounded-full text-stone-500 hover:text-ink"
        >
          <X className="size-4" strokeWidth={1.8} />
        </button>
      )}
    </form>
  );
}

export function SearchBar(props: SearchBarProps) {
  return (
    <Suspense fallback={<div className="h-14 w-full rounded-full border border-stone-200 bg-white" />}>
      <SearchBarInner {...props} />
    </Suspense>
  );
}
