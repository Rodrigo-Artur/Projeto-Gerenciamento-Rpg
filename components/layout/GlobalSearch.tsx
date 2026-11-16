"use client";

import {
  BookOpen, Command, CornerDownLeft, FileText, FolderOpen, Heart, History,
  Keyboard, LoaderCircle, Map as MapIcon, Search, UserRound, Users,
  type LucideIcon,
} from "lucide-react";
import { useId, useState, type KeyboardEvent, type RefObject } from "react";

import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import type { HomeFavorite } from "@/components/dashboard/home-data";
import type { RecentContent, SearchResult } from "@/hooks/useWorkspaceApi";

export type PaletteCommand = {
  id: string;
  title: string;
  description: string;
  group: "Navegação" | "Mesas" | "Ferramentas";
  icon: LucideIcon;
  keywords?: string;
  onSelect: () => void;
};

type PaletteEntry = {
  id: string;
  label: string;
  detail: string;
  icon: LucideIcon;
  onSelect: () => void;
  tag?: string;
};

type PaletteSection = { title: string; entries: PaletteEntry[] };

type GlobalSearchProps = {
  inputRef: RefObject<HTMLInputElement | null>;
  query: string;
  results: SearchResult[];
  recent: RecentContent[];
  favorites: HomeFavorite[];
  commands: PaletteCommand[];
  loading: boolean;
  error?: string;
  open: boolean;
  onQueryChange: (query: string) => void;
  onOpenChange: (open: boolean) => void;
  onSelect: (result: SearchResult) => void;
  onOpenRecent: (item: RecentContent) => void;
  onOpenFavorite: (item: HomeFavorite) => void;
};

const searchTypeIcons: Record<string, LucideIcon> = {
  npc: UserRound, player: Users, rule: BookOpen, note: FileText,
  session: History, entity: MapIcon, item: FolderOpen, location: MapIcon,
  faction: Users, quest: FileText, timeline: History, handout: FileText,
};

const searchTypeNames: Record<string, string> = {
  npc: "NPCs", player: "Personagens", rule: "Regras",
  note: "Notas", session: "Sessões", entity: "Mundo",
  item: "Itens", location: "Locais", faction: "Facções",
  quest: "Missões", timeline: "Linha do tempo", handout: "Handouts",
};

function normalizeTerm(text: string) {
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR");
}

function commandEntry(command: PaletteCommand): PaletteEntry {
  return {
    id: `command:${command.id}`,
    label: command.title,
    detail: command.description,
    icon: command.icon,
    onSelect: command.onSelect,
  };
}

export function GlobalSearch({
  inputRef, query, results, recent, favorites, commands, loading, error, open,
  onQueryChange, onOpenChange, onSelect, onOpenRecent, onOpenFavorite,
}: GlobalSearchProps) {
  const listId = useId();
  const [activeIndex, setActiveIndex] = useState(0);
  const rawQuery = query.trim();
  const commandOnly = rawQuery.startsWith(">");
  const term = commandOnly ? rawQuery.slice(1).trim() : rawQuery;
  const normalized = normalizeTerm(term);

  function prepareSections(): PaletteSection[] {
    const sections: PaletteSection[] = [];
    const matchingCommands = commands.filter((item) =>
      !normalized || normalizeTerm(`${item.title} ${item.description} ${item.group} ${item.keywords ?? ""}`).includes(normalized)
    );

    if (!rawQuery) {
      const quickIds = new Set(["view:home", "view:session-mode", "view:sheets", "view:combat"]);
      sections.push({
        title: "Acessos rápidos",
        entries: commands.filter((item) => quickIds.has(item.id)).map(commandEntry),
      });
      sections.push({
        title: "Favoritos",
        entries: favorites.slice(0, 5).map((item) => ({
          id: `favorite:${item.type}:${item.id}`,
          label: item.name,
          detail: item.detail,
          icon: searchTypeIcons[item.type] ?? Heart,
          onSelect: () => onOpenFavorite(item),
        })),
      });
      const favoriteKeys = new Set(favorites.map((item) => `${item.type}:${item.id}`));
      sections.push({
        title: "Recentes",
        entries: recent.filter((item) => !favoriteKeys.has(`${item.type}:${item.id}`)).slice(0, 5).map((item) => ({
          id: `recent:${item.type}:${item.id}`,
          label: item.name,
          detail: searchTypeNames[item.type] ?? item.type,
          icon: searchTypeIcons[item.type] ?? FileText,
          onSelect: () => onOpenRecent(item),
        })),
      });
      sections.push({
        title: "Navegação",
        entries: commands.filter((item) => item.group === "Navegação" && !quickIds.has(item.id)).map(commandEntry),
      });
      sections.push({
        title: "Ferramentas",
        entries: commands.filter((item) => item.group === "Ferramentas").map(commandEntry),
      });
      sections.push({
        title: "Mesas",
        entries: commands.filter((item) => item.group === "Mesas").slice(0, 6).map(commandEntry),
      });
    } else {
      sections.push({
        title: commandOnly ? "Comandos" : "Comandos e navegação",
        entries: matchingCommands.map(commandEntry),
      });
      if (!commandOnly) {
        const groups = new Map<string, PaletteEntry[]>();
        for (const result of results) {
          const title = searchTypeNames[result.type] ?? "Outros conteúdos";
          const current = groups.get(title) ?? [];
          current.push({
            id: `result:${result.type}:${result.id}`,
            label: result.name,
            detail: result.description || result.type,
            icon: searchTypeIcons[result.type] ?? FolderOpen,
            tag: result.type,
            onSelect: () => onSelect(result),
          });
          groups.set(title, current);
        }
        for (const [title, entries] of groups) sections.push({ title, entries });
      }
    }
    return sections.filter((section) => section.entries.length);
  }

  const sections = prepareSections();
  const allEntries = sections.flatMap((section) => section.entries);
  const highlighted = Math.min(activeIndex, Math.max(0, allEntries.length - 1));

  function close() {
    onOpenChange(false);
    setActiveIndex(0);
  }

  function choose(entry: PaletteEntry) {
    close();
    entry.onSelect();
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      close();
      return;
    }
    if (!allEntries.length) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => (index + 1) % allEntries.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => (index - 1 + allEntries.length) % allEntries.length);
    } else if (event.key === "Enter") {
      event.preventDefault();
      choose(allEntries[highlighted]);
    }
  }

  return (
    <div className="order-last w-full flex-1 md:order-none md:min-w-[210px]">
      <Dialog open={open} onOpenChange={(next) => { onOpenChange(next); setActiveIndex(0); }}>
        <DialogTrigger asChild>
          <button
            type="button"
            aria-label="Abrir busca global e comandos"
            title="Abrir central de comandos (Ctrl+K)"
            className="flex h-9 w-full min-w-0 items-center gap-2 rounded-lg border border-border bg-background px-3 text-left text-sm text-muted-foreground outline-none transition-colors hover:border-primary/40 hover:bg-accent/40 focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Search aria-hidden="true" className="size-4 shrink-0" />
            <span className="min-w-0 flex-1 truncate">Buscar conteúdo ou executar comando...</span>
            <kbd className="hidden shrink-0 rounded border border-border bg-secondary px-1.5 py-0.5 font-mono text-[10px] sm:inline">Ctrl K</kbd>
          </button>
        </DialogTrigger>
        <DialogContent
          className="top-[42%] w-[calc(100%-1.5rem)] max-w-2xl gap-0 overflow-hidden p-0 sm:top-[38%]"
          showCloseButton={false}
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            inputRef.current?.focus();
          }}
        >
          <DialogHeader className="sr-only">
            <DialogTitle>Central de comandos</DialogTitle>
            <DialogDescription>Pesquise conteúdos, navegue entre seções ou utilize comandos seguros.</DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-3 border-b border-border px-4 py-3">
            <Search aria-hidden="true" className="size-5 shrink-0 text-primary" />
            <input
              ref={inputRef}
              autoComplete="off"
              type="search"
              role="combobox"
              aria-label="Pesquisar conteúdo ou comando"
              aria-autocomplete="list"
              aria-expanded={true}
              aria-controls={listId}
              aria-activedescendant={allEntries.length ? `${listId}-option-${highlighted}` : undefined}
              value={query}
              onChange={(event) => { onQueryChange(event.target.value); setActiveIndex(0); }}
              onKeyDown={onKeyDown}
              placeholder="Buscar fichas, regras ou digitar > para comandos..."
              className="h-10 min-w-0 flex-1 bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground"
            />
            <kbd className="shrink-0 rounded-md border border-border bg-secondary px-2 py-1 font-mono text-[10px] text-muted-foreground">ESC</kbd>
          </div>

          <div
            id={listId}
            role="listbox"
            aria-label="Sugestões da central de comandos"
            aria-busy={Boolean(rawQuery && !commandOnly && loading)}
            className="max-h-[min(60dvh,475px)] overflow-y-auto overscroll-contain p-2"
          >
            {(() => {
              let offset = 0;
              return sections.map((section) => {
                const start = offset;
                offset += section.entries.length;
                return (
                  <div key={section.title} role="group" aria-label={section.title} className="mb-2">
                    <p role="presentation" className="px-3 py-2 text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">{section.title}</p>
                    {section.entries.map((entry, itemIndex) => {
                      const index = start + itemIndex;
                      const Icon = entry.icon;
                      return (
                        <button
                          key={entry.id}
                          id={`${listId}-option-${index}`}
                          type="button"
                          role="option"
                          aria-selected={index === highlighted}
                          onMouseEnter={() => setActiveIndex(index)}
                          onClick={() => choose(entry)}
                          className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring ${index === highlighted ? "bg-primary/12 text-foreground" : "text-muted-foreground hover:bg-accent"}`}
                        >
                          <span aria-hidden="true" className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-border bg-secondary text-primary">
                            <Icon className="size-4" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-medium text-foreground">{entry.label}</span>
                            <span className="mt-0.5 block truncate text-xs text-muted-foreground">{entry.detail}</span>
                          </span>
                          {index === highlighted && <CornerDownLeft aria-hidden="true" className="size-4 shrink-0 text-primary" />}
                        </button>
                      );
                    })}
                  </div>
                );
              });
            })()}
            {rawQuery && !commandOnly && loading && (
              <p role="status" className="flex items-center gap-2 px-3 py-3 text-xs text-muted-foreground">
                <LoaderCircle aria-hidden="true" className="size-4 animate-spin motion-reduce:animate-none" /> Buscando conteúdos...
              </p>
            )}
            {rawQuery && !commandOnly && error && (
              <p role="alert" className="px-3 py-3 text-xs text-destructive">{error}</p>
            )}
            {!sections.length && !(rawQuery && !commandOnly && loading) && !error && (
              <p role="status" className="px-3 py-8 text-center text-sm text-muted-foreground">
                {commandOnly ? "Nenhum comando encontrado." : "Nenhum resultado encontrado. Tente outro termo."}
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-border bg-secondary/45 px-4 py-2.5 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1"><Keyboard aria-hidden="true" className="size-3.5" />↑ ↓ navegar</span>
            <span className="flex items-center gap-1"><CornerDownLeft aria-hidden="true" className="size-3.5" />Enter abrir</span>
            <span className="flex items-center gap-1"><Command aria-hidden="true" className="size-3.5" />&gt; somente comandos</span>
            <span>Esc fechar</span>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
