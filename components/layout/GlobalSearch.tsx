"use client";

import { LoaderCircle, Search, X } from "lucide-react";
import { useEffect, useId, useRef, useState, type RefObject, type KeyboardEvent as ReactKeyboardEvent } from "react";

import type { SearchResult } from "@/hooks/useWorkspaceApi";

type GlobalSearchProps = {
  inputRef: RefObject<HTMLInputElement | null>;
  query: string;
  results: SearchResult[];
  loading: boolean;
  error?: string;
  open: boolean;
  onQueryChange: (query: string) => void;
  onOpenChange: (open: boolean) => void;
  onSelect: (result: SearchResult) => void;
};

export function GlobalSearch({
  inputRef, query, results, loading, error, open,
  onQueryChange, onOpenChange, onSelect,
}: GlobalSearchProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const [activeIndex, setActiveIndex] = useState(0);
  const hasQuery = Boolean(query.trim());
  const showing = open && hasQuery;
  const highlighted = Math.min(activeIndex, Math.max(0, results.length - 1));

  useEffect(() => { setActiveIndex(0); }, [query]);

  useEffect(() => {
    if (!open) return;
    function dismiss(event: PointerEvent) {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target)) {
        onOpenChange(false);
      }
    }
    document.addEventListener("pointerdown", dismiss);
    return () => document.removeEventListener("pointerdown", dismiss);
  }, [onOpenChange, open]);

  function handleKeyDown(event: ReactKeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      onOpenChange(false);
      inputRef.current?.blur();
      return;
    }
    if (!showing || loading || results.length === 0) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => (index + 1) % results.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => (index - 1 + results.length) % results.length);
    } else if (event.key === "Enter") {
      event.preventDefault();
      onSelect(results[highlighted]);
    }
  }

  return (
    <div ref={rootRef} className="relative order-last w-full flex-1 md:order-none md:min-w-[210px]">
      <div className="relative">
        <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-2.5 size-4 text-muted-foreground" />
        <input
          ref={inputRef}
          type="search"
          role="combobox"
          aria-label="Busca global"
          aria-autocomplete="list"
          aria-expanded={showing}
          aria-controls={showing ? listId : undefined}
          aria-activedescendant={showing && !loading && results.length > 0 ? `${listId}-option-${highlighted}` : undefined}
          value={query}
          onFocus={() => onOpenChange(true)}
          onChange={(event) => onQueryChange(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Buscar regras, fichas e mundo...  Ctrl+K"
          className="h-9 w-full min-w-0 rounded-lg border border-border bg-background py-2 pl-9 pr-9 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20"
        />
        {query ? (
          <button
            type="button"
            aria-label="Limpar busca"
            onClick={() => { onQueryChange(""); inputRef.current?.focus(); }}
            className="absolute right-2 top-1.5 rounded-md p-1 text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
          ><X aria-hidden="true" className="size-4" /></button>
        ) : null}
      </div>

      {showing && (
        <div className="absolute left-0 right-0 top-11 z-50 max-h-[min(60vh,360px)] overflow-y-auto rounded-xl border border-border bg-popover p-2 shadow-[var(--mdm-shadow-dialog)]">
          {loading ? (
            <div className="flex items-center gap-2 px-3 py-4 text-sm text-muted-foreground" role="status">
              <LoaderCircle aria-hidden="true" className="size-4 animate-spin" /> Buscando...
            </div>
          ) : error ? (
            <p role="alert" className="px-3 py-4 text-sm text-destructive">{error}</p>
          ) : results.length === 0 ? (
            <p role="status" className="px-3 py-4 text-sm text-muted-foreground">Nenhum resultado encontrado.</p>
          ) : (
            <div id={listId} role="listbox" aria-label="Resultados da busca">
              {results.map((result, index) => (
                <button
                  key={`${result.type}:${result.id}`}
                  id={`${listId}-option-${index}`}
                  type="button"
                  role="option"
                  aria-selected={index === highlighted}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => onSelect(result)}
                  className={`block w-full rounded-lg p-3 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring ${index === highlighted ? "bg-accent" : "hover:bg-accent"}`}
                >
                  <span className="text-xs font-semibold uppercase tracking-wide text-primary">{result.type}</span>
                  <span className="mt-1 block truncate text-sm font-medium text-foreground">{result.name}</span>
                  <span className="block truncate text-xs text-muted-foreground">{result.description}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
