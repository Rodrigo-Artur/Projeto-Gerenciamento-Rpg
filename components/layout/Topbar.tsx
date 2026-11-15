"use client";

import {
  Database, Download, Eye, Maximize2, Menu, Minimize2,
  Rows3, Undo2, Upload,
} from "lucide-react";
import type { RefObject } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EditModeSwitch } from "@/components/layout/EditModeSwitch";
import { GlobalSearch } from "@/components/layout/GlobalSearch";
import type { SearchResult } from "@/hooks/useWorkspaceApi";
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
  searchOpen: boolean;
  searchLoading: boolean;
  searchError?: string;
  onSearchChange: (query: string) => void;
  onSearchOpen: (open: boolean) => void;
  onSearchResult: (result: SearchResult) => void;
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
};

export function Topbar({
  tables, activeTableId, activeSystemName, sessionActive, onTableChange, onOpenSidebar,
  searchRef, searchQuery, searchResults, searchOpen, searchLoading, searchError, onSearchChange, onSearchOpen, onSearchResult,
  editMode, itemEditMode, canEditItem, editTimeoutMinutes, onReadMode, onEditMode, onItemEditMode, onEditTimeoutChange,
  onUndo, onImport, onExport, onPlayerView, onToggleCompact, onToggleFullscreen, compact, fullscreen, loading, status,
}: TopbarProps) {
  const statusError = /erro|falha/i.test(status);
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
            value={activeTableId}
            disabled={tables.length === 0}
            onChange={(event) => onTableChange(event.target.value)}
            className="h-9 max-w-44 rounded-lg border border-border bg-secondary px-2.5 text-sm font-semibold text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring sm:max-w-56"
          >{tables.map((table) => <option key={table.id} value={table.id}>{table.name}</option>)}</select>
          <span className="hidden max-w-40 truncate text-xs text-muted-foreground xl:block" title={activeSystemName}>{activeSystemName}</span>
        </div>

        <GlobalSearch
          inputRef={searchRef}
          query={searchQuery}
          results={searchResults}
          open={searchOpen}
          loading={searchLoading}
          error={searchError}
          onQueryChange={onSearchChange}
          onOpenChange={onSearchOpen}
          onSelect={onSearchResult}
        />

        {sessionActive && <Badge variant="success" className="hidden shrink-0 xl:inline-flex"><span aria-hidden="true" className="size-2 rounded-full bg-success" />Sessão ativa</Badge>}
        <span role="status" aria-live="polite" className={`inline-flex min-h-8 shrink-0 items-center gap-1.5 rounded-md border px-2 text-xs ${statusError ? "border-destructive/40 text-destructive" : "border-success/25 text-success"}`}>
          <Database aria-hidden="true" className="size-3.5" />{loading ? "Carregando..." : status}
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
          <Button variant="ghost" size="icon-sm" disabled={!editMode} onClick={onUndo} title="Desfazer última alteração — Ctrl+Z" aria-label="Desfazer última alteração"><Undo2 aria-hidden="true" /></Button>
          <Button variant="outline" size="sm" disabled={!editMode} title={editMode ? "Importar arquivo JSON" : "Ative o modo Edição para importar"} onClick={onImport}><Upload aria-hidden="true" />Importar</Button>
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
