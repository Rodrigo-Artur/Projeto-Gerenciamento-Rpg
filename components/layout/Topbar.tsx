"use client";

import {
  AlertCircle, CheckCircle2, Download, Eye, LoaderCircle, Maximize2, Menu, Minimize2,
  Rows3, Undo2, Upload, Library, Settings2,
} from "lucide-react";
import type { RefObject } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EditModeSwitch } from "@/components/layout/EditModeSwitch";
import { GlobalSearch, type PaletteCommand } from "@/components/layout/GlobalSearch";
import { navigationGroups, type ViewId } from "@/components/layout/AppSidebar";
import type { HomeFavorite } from "@/components/dashboard/home-data";
import type { RecentContent, SearchResult, WorkspaceStatusKind } from "@/hooks/useWorkspaceApi";
import type { RpgTable } from "@/types/rulebook";

type TopbarProps = {
  tables: RpgTable[];
  activeTableId: string;
  activeSystemName: string;
  sessionActive: boolean;
  onTableChange: (tableId: string) => void;
  onOpenSidebar: () => void;
  searchRef: RefObject<HTMLInputElement | null>;
  searchQuery: string;
  searchResults: SearchResult[];
  recent: RecentContent[];
  favorites: HomeFavorite[];
  searchOpen: boolean;
  searchLoading: boolean;
  searchError?: string;
  onSearchChange: (query: string) => void;
  onSearchOpen: (open: boolean) => void;
  onSearchResult: (result: SearchResult) => void;
  onOpenRecent: (item: RecentContent) => void;
  onOpenFavorite: (item: HomeFavorite) => void;
  onNavigate: (view: ViewId) => void;
  editMode: boolean;
  itemEditMode: boolean;
  canEditItem: boolean;
  editTimeoutMinutes: number;
  onReadMode: () => void;
  onEditMode: () => void;
  onItemEditMode: () => void;
  onEditTimeoutChange: (minutes: number) => void;
  onUndo: () => void;
  onImport: () => void;
  onExport: () => void;
  onPlayerView: () => void;
  onToggleCompact: () => void;
  onToggleFullscreen: () => void;
  compact: boolean;
  fullscreen: boolean;
  loading: boolean;
  status: string;
  statusKind: WorkspaceStatusKind;
};

export function Topbar({
  tables, activeTableId, activeSystemName, sessionActive, onTableChange, onOpenSidebar,
  searchRef, searchQuery, searchResults, recent, favorites, searchOpen, searchLoading, searchError, onSearchChange, onSearchOpen, onSearchResult, onOpenRecent, onOpenFavorite, onNavigate,
  editMode, itemEditMode, canEditItem, editTimeoutMinutes, onReadMode, onEditMode, onItemEditMode, onEditTimeoutChange,
  onUndo, onImport, onExport, onPlayerView, onToggleCompact, onToggleFullscreen, compact, fullscreen, loading, status, statusKind,
}: TopbarProps) {
  const statusError = statusKind === "error";
  const statusSaving = statusKind === "saving";
  const statusLoading = statusKind === "loading";
  // Somente comandos de navegação/visualização: a paleta funciona em Leitura.
  const commands: PaletteCommand[] = [
    ...navigationGroups.flatMap((group) =>
      group.items.map((item) => ({
        id: `view:${item.id}`,
        title: item.label,
        description: `Abrir seção · ${group.title}`,
        group: "Navegação" as const,
        icon: item.icon,
        keywords: `ir para abrir ${group.title}`,
        onSelect: () => onNavigate(item.id),
      }))
    ),
    ...tables.filter((table) => table.id !== activeTableId).map((table) => ({
      id: `table:${table.id}`,
      title: table.name,
      description: "Trocar de mesa",
      group: "Mesas" as const,
      icon: Library,
      keywords: "campanha sistema trocar mesa",
      onSelect: () => onTableChange(table.id),
    })),
    {
      id: "tool:export",
      title: "Exportar mesa",
      description: "Baixar backup JSON da mesa atual",
      group: "Ferramentas",
      icon: Download,
      keywords: "backup json download",
      onSelect: onExport,
    },
    {
      id: "tool:player",
      title: "Abrir Tela Jogador",
      description: "Exibir informações públicas em outra janela",
      group: "Ferramentas",
      icon: Eye,
      keywords: "projetor jogadores publico tela",
      onSelect: onPlayerView,
    },
    {
      id: "tool:compact",
      title: compact ? "Desativar modo compacto" : "Ativar modo compacto",
      description: "Alternar a densidade visual da interface",
      group: "Ferramentas",
      icon: Rows3,
      keywords: "layout densidade visual",
      onSelect: onToggleCompact,
    },
    {
      id: "tool:fullscreen",
      title: fullscreen ? "Sair da tela cheia" : "Entrar em tela cheia",
      description: "Alternar exibição em tela inteira",
      group: "Ferramentas",
      icon: fullscreen ? Minimize2 : Maximize2,
      keywords: "fullscreen apresentação",
      onSelect: onToggleFullscreen,
    },
    {
      id: "tool:settings",
      title: "Gerenciar mesas e sistemas",
      description: "Abrir administração",
      group: "Ferramentas",
      icon: Settings2,
      keywords: "criar editar mesa sistema configurações",
      onSelect: () => onNavigate("dashboard"),
    },
  ];

  return (
    <header className="relative z-40 shrink-0 border-b border-border/70 bg-card/95 px-3 py-3 backdrop-blur lg:px-5">
      <div className="flex flex-wrap items-center gap-2.5">
        <Button size="icon-sm" variant="ghost" className="lg:hidden" aria-label="Abrir menu de navegação" title="Abrir menu" onClick={onOpenSidebar}>
          <Menu aria-hidden="true" />
        </Button>

        <div className="flex min-w-0 items-center gap-2">
          <label htmlFor="mdm-current-table" className="sr-only">Mesa ativa</label>
          <select
            id="mdm-current-table"
            value={tables.some((table) => table.id === activeTableId) ? activeTableId : ""}
            disabled={loading || tables.length === 0}
            onChange={(event) => onTableChange(event.target.value)}
            aria-busy={loading}
            className="h-9 max-w-44 rounded-lg border border-border bg-secondary px-2.5 text-sm font-semibold text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring sm:max-w-56"
          >
            {tables.length === 0 && <option value="">{loading ? "Carregando mesas..." : "Nenhuma mesa"}</option>}
            {tables.map((table) => <option key={table.id} value={table.id}>{table.name}</option>)}
          </select>
          <span className="hidden max-w-40 truncate text-xs text-muted-foreground xl:block" title={activeSystemName}>{activeSystemName}</span>
        </div>

        <GlobalSearch
          inputRef={searchRef}
          query={searchQuery}
          results={searchResults}
          recent={recent}
          favorites={favorites}
          commands={commands}
          open={searchOpen}
          loading={searchLoading}
          error={searchError}
          onQueryChange={onSearchChange}
          onOpenChange={onSearchOpen}
          onSelect={onSearchResult}
          onOpenRecent={onOpenRecent}
          onOpenFavorite={onOpenFavorite}
        />

        {sessionActive && <Badge variant="success" className="hidden shrink-0 xl:inline-flex"><span aria-hidden="true" className="size-2 rounded-full bg-success" />Sessão ativa</Badge>}
        <span
          role="status"
          aria-live="polite"
          aria-label={statusError ? `Erro: ${status}` : status}
          className={`inline-flex min-h-8 shrink-0 items-center gap-1.5 rounded-md border px-2 text-xs ${statusError ? "border-destructive/40 bg-destructive/10 text-destructive" : statusSaving || statusLoading ? "border-primary/30 bg-primary/10 text-primary" : "border-success/25 bg-success/10 text-success"}`}
        >
          {statusError ? <AlertCircle aria-hidden="true" className="size-3.5" /> : statusSaving || statusLoading ? <LoaderCircle aria-hidden="true" className="size-3.5 animate-spin motion-reduce:animate-none" /> : <CheckCircle2 aria-hidden="true" className="size-3.5" />}
          {statusLoading ? "Carregando..." : statusSaving ? "Salvando..." : statusError ? status : "Salvo"}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border/50 pt-3">
        <EditModeSwitch
          editMode={editMode}
          itemEditMode={itemEditMode}
          canEditItem={canEditItem}
          timeoutMinutes={editTimeoutMinutes}
          onRead={onReadMode}
          onEdit={onEditMode}
          onEditItem={onItemEditMode}
          onTimeoutChange={onEditTimeoutChange}
        />
        <div className="flex flex-wrap items-center gap-1.5">
          <Button variant="ghost" size="icon-sm" disabled={!editMode || loading} onClick={onUndo} title="Desfazer última alteração — Ctrl+Z" aria-label="Desfazer última alteração"><Undo2 aria-hidden="true" /></Button>
          <Button variant="outline" size="sm" disabled={!editMode || loading} title={editMode && !loading ? "Importar arquivo JSON" : "Aguarde ou ative o modo Edição para importar"} onClick={onImport}><Upload aria-hidden="true" />Importar</Button>
          <Button variant="outline" size="sm" onClick={onExport}><Download aria-hidden="true" />Exportar</Button>
          <Button variant="outline" size="sm" onClick={onPlayerView}><Eye aria-hidden="true" />Tela jogador</Button>
          <Button variant="ghost" size="icon-sm" onClick={onToggleCompact} aria-pressed={compact} title="Alternar modo compacto" aria-label="Alternar modo compacto"><Rows3 aria-hidden="true" /></Button>
          <Button variant="ghost" size="icon-sm" onClick={onToggleFullscreen} title={fullscreen ? "Sair da tela cheia" : "Tela cheia"} aria-label={fullscreen ? "Sair da tela cheia" : "Tela cheia"}>
            {fullscreen ? <Minimize2 aria-hidden="true" /> : <Maximize2 aria-hidden="true" />}
          </Button>
        </div>
      </div>
    </header>
  );
}
