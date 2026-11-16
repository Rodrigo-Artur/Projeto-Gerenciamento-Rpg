"use client";

import { ExternalLink, X } from "lucide-react";
import {
  type ClipboardEvent as ReactClipboardEvent,
  type DragEvent as ReactDragEvent,
  type FormEvent as ReactFormEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { AppShell } from "@/components/layout/AppShell";
import { AppSidebar, type ViewId } from "@/components/layout/AppSidebar";
import { PageHeader } from "@/components/layout/PageHeader";
import { Topbar } from "@/components/layout/Topbar";
import { CampaignToolsView } from "@/components/system/CampaignToolsView";
import { CombatView } from "@/components/system/CombatView";
import { DashboardView } from "@/components/system/DashboardView";
import { HistoryView } from "@/components/system/HistoryView";
import { HomeView } from "@/components/system/HomeView";
import { ImportDialog } from "@/components/system/ImportDialog";
import { LibraryView } from "@/components/system/LibraryView";
import { RulesView } from "@/components/system/RulesView";
import { SessionCockpitView } from "@/components/system/SessionCockpitView";
import { SessionsView } from "@/components/system/SessionsView";
import { SheetsView } from "@/components/system/SheetsView";
import { TemplatesView } from "@/components/system/TemplatesView";
import { WorldView } from "@/components/system/WorldView";
import { useWorkspaceApi, type RecentContent, type SearchResult } from "@/hooks/useWorkspaceApi";
import type { RulebookData, WorkspaceTab } from "@/types/rulebook";

function protectedFieldFromTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return null;
  const field = target.closest("input, textarea, select");
  if (!(field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement || field instanceof HTMLSelectElement)) return null;
  if (field instanceof HTMLInputElement && (field.placeholder.toLowerCase().includes("filtrar") || field.placeholder.toLowerCase().includes("buscar") || field.placeholder.toLowerCase().includes("pesquisar"))) return null;
  return field;
}

function viewForType(type: string): ViewId {
  if (type === "rule") return "rules";
  if (type === "player" || type === "npc") return "sheets";
  if (type === "note" || type === "session" || type === "handout") return "sessions";
  if (["item", "location", "faction", "quest", "timeline", "entity"].includes(type)) return "world";
  return "home";
}

function dataWithFocusedSheet(data: RulebookData, tab?: WorkspaceTab): RulebookData {
  if (!tab?.refId) return data;
  if (tab.type === "player") {
    const selected = data.players.find((item) => item.id === tab.refId);
    if (selected) return { ...data, players: [selected, ...data.players.filter((item) => item.id !== selected.id)] };
  }
  if (tab.type === "npc") {
    const selected = data.npcs.find((item) => item.id === tab.refId);
    if (selected) return { ...data, npcs: [selected, ...data.npcs.filter((item) => item.id !== selected.id)] };
  }
  return data;
}

export function SystemWorkspace() {
  const { data, recent, status, loading, load, action, search, previewImport, recordRecent } = useWorkspaceApi(false);
  const [view, setView] = useState<ViewId>("home");
  const [importOpen, setImportOpen] = useState(false);
  const [dropFile, setDropFile] = useState<File>();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string>();
  const [compact, setCompact] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [itemEditMode, setItemEditMode] = useState(false);
  const [editTimeoutMinutes, setEditTimeoutMinutes] = useState(5);
  const [editActivity, setEditActivity] = useState(Date.now());
  const [tabs, setTabs] = useState<WorkspaceTab[]>([]);
  const [activeTabId, setActiveTabId] = useState("");
  const searchRef = useRef<HTMLInputElement | null>(null);

  const currentTable = data.tables.find((item) => item.id === data.activeTableId);
  const currentSystem = data.systems.find((item) => item.id === data.activeSystemId) ?? data.systems.find((item) => item.id === currentTable?.systemId);
  const activeTab = useMemo(() => tabs.find((item) => item.id === activeTabId), [activeTabId, tabs]);
  const activeEditableTab = activeTab?.view === view ? activeTab : undefined;
  const sheetData = useMemo(() => dataWithFocusedSheet(data, activeEditableTab), [activeEditableTab, data]);
  const effectiveEdit = editMode || itemEditMode;

  useEffect(() => {
    setCompact(window.localStorage.getItem("mesa-do-mestre-compact") === "1");
    setSidebarCollapsed(window.localStorage.getItem("mesa-do-mestre-sidebar-collapsed") === "1");
    const savedTimeout = Number(window.localStorage.getItem("mesa-do-mestre-edit-timeout") ?? 5);
    setEditTimeoutMinutes([0, 1, 5, 15].includes(savedTimeout) ? savedTimeout : 5);
    const onFullscreen = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onFullscreen);
    return () => document.removeEventListener("fullscreenchange", onFullscreen);
  }, []);

  useEffect(() => {
    if (!data.activeTableId) return;
    try {
      const saved = JSON.parse(window.localStorage.getItem(`mesa-tabs-${data.activeTableId}`) ?? "[]") as WorkspaceTab[];
      setTabs(Array.isArray(saved) ? saved.slice(0, 12) : []);
      setActiveTabId(saved[0]?.id ?? "");
    } catch {
      setTabs([]);
      setActiveTabId("");
    }
    setItemEditMode(false);
  }, [data.activeTableId]);

  useEffect(() => {
    if (!data.activeTableId) return;
    window.localStorage.setItem(`mesa-tabs-${data.activeTableId}`, JSON.stringify(tabs));
  }, [data.activeTableId, tabs]);

  useEffect(() => {
    if (!effectiveEdit || editTimeoutMinutes === 0) return;
    const delay = Math.max(1000, editTimeoutMinutes * 60_000 - (Date.now() - editActivity));
    const timer = window.setTimeout(() => {
      setEditMode(false);
      setItemEditMode(false);
    }, delay);
    return () => window.clearTimeout(timer);
  }, [editActivity, editMode, editTimeoutMinutes, effectiveEdit, itemEditMode]);

  useEffect(() => {
    function handleShortcut(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const insideEditableField = Boolean(target?.closest("input, textarea, select, [contenteditable='true']"));
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchRef.current?.focus();
        setSearchOpen(true);
      }
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === "p") {
        event.preventDefault();
        openPlayerView();
      }
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === "c") {
        event.preventDefault();
        toggleCompact();
      }
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === "e") {
        event.preventDefault();
        setItemEditMode(false);
        setEditMode((current) => !current);
        setEditActivity(Date.now());
      }
      if (editMode && (event.ctrlKey || event.metaKey) && !event.shiftKey && event.key.toLowerCase() === "z" && !insideEditableField) {
        event.preventDefault();
        void runAction({ action: "undo-last", tableId: data.activeTableId });
      }
    }
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  });

  useEffect(() => {
    const query = searchQuery.trim();
    if (!query) {
      setSearchResults([]);
      setSearchError(undefined);
      setSearchLoading(false);
      return;
    }

    const controller = new AbortController();
    setSearchLoading(true);
    setSearchError(undefined);
    setSearchResults([]);

    const timer = window.setTimeout(() => {
      void search(query, data.activeTableId, controller.signal)
        .then((results) => {
          if (!controller.signal.aborted) setSearchResults(results);
        })
        .catch((error: unknown) => {
          if (controller.signal.aborted) return;
          setSearchError(error instanceof Error ? error.message : "Erro ao pesquisar.");
        })
        .finally(() => {
          if (!controller.signal.aborted) setSearchLoading(false);
        });
    }, 250);

    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [search, searchQuery, data.activeTableId]);

  async function runAction(payload: Record<string, unknown>, options?: { silent?: boolean; reloadTableId?: string }) {
    return action(payload, options) as Promise<Record<string, unknown>>;
  }

  function switchTable(tableId: string) {
    if (!tableId || tableId === data.activeTableId) return;
    // Mesa diferente: pesquisa, permissões temporárias e foco anterior são descartados.
    setSearchQuery("");
    setSearchResults([]);
    setSearchError(undefined);
    setSearchOpen(false);
    setEditMode(false);
    setItemEditMode(false);
    setActiveTabId("");
    void load(tableId);
  }

  function addTab(type: string, id: string, name: string) {
    const tab: WorkspaceTab = { id: `${type}:${id}`, type, refId: id, title: name, view: viewForType(type) };
    setTabs((current) => current.some((item) => item.id === tab.id) ? current : [...current, tab].slice(-12));
    setActiveTabId(tab.id);
    setItemEditMode(false);
  }

  function openContent(type: string, id: string, name: string) {
    setView(viewForType(type));
    addTab(type, id, name);
    void recordRecent(type, id, name);
  }

  function openSearchResult(result: SearchResult) {
    openContent(result.type, result.id, result.name);
    setSearchQuery("");
    setSearchOpen(false);
  }

  function openRecent(item: RecentContent) {
    openContent(item.type, item.id, item.name);
  }

  function opened(type: string, id: string, name: string) {
    addTab(type, id, name);
    void recordRecent(type, id, name);
  }

  function openTab(tab: WorkspaceTab) {
    setActiveTabId(tab.id);
    setView(tab.view as ViewId);
    setItemEditMode(false);
    void recordRecent(tab.type, tab.refId ?? tab.id, tab.title);
  }

  function closeTab(id: string) {
    const remaining = tabs.filter((item) => item.id !== id);
    setTabs(remaining);
    if (activeTabId === id) {
      setActiveTabId(remaining.at(-1)?.id ?? "");
      setItemEditMode(false);
    }
  }

  function detachTab(tab: WorkspaceTab) {
    window.open(
      `/focus?tableId=${encodeURIComponent(data.activeTableId)}&type=${encodeURIComponent(tab.type)}&id=${encodeURIComponent(tab.refId ?? "")}`,
      `mesa-focus-${tab.id.replaceAll(":", "-")}`,
      "width=700,height=900,resizable=yes,scrollbars=yes"
    );
  }

  async function exportCurrent() {
    const response = await fetch(`/api/rulebook?tableId=${encodeURIComponent(data.activeTableId)}&export=1`, { cache: "no-store" });
    if (!response.ok) return;
    const json = await response.json();
    const blob = new Blob([JSON.stringify(json, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${(currentTable?.name ?? "mesa").replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-mesa-do-mestre-v4.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function openPlayerView() {
    window.open(`/player?tableId=${encodeURIComponent(data.activeTableId)}`, "mesa-do-mestre-player-view");
  }

  function toggleCompact() {
    setCompact((current) => {
      const next = !current;
      window.localStorage.setItem("mesa-do-mestre-compact", next ? "1" : "0");
      return next;
    });
  }

  async function toggleFullscreen() {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await document.documentElement.requestFullscreen();
  }

  function canEditTarget(target: EventTarget | null) {
    if (editMode) return true;
    return itemEditMode && target instanceof HTMLElement && Boolean(target.closest(".item-editor-scope"));
  }

  function touchEdit() {
    if (effectiveEdit) setEditActivity(Date.now());
  }

  function protectReadModeFormEvent(event: ReactFormEvent<HTMLElement>) {
    if (canEditTarget(event.target) || !protectedFieldFromTarget(event.target)) return;
    event.preventDefault();
    event.stopPropagation();
  }

  function protectReadModeClipboard(event: ReactClipboardEvent<HTMLElement>) {
    if (canEditTarget(event.target) || !protectedFieldFromTarget(event.target)) return;
    event.preventDefault();
    event.stopPropagation();
  }

  function protectReadModeKeyDown(event: ReactKeyboardEvent<HTMLElement>) {
    if (canEditTarget(event.target)) return;
    const field = protectedFieldFromTarget(event.target);
    if (!field) return;
    const key = event.key.toLowerCase();
    const command = event.ctrlKey || event.metaKey;
    if (command && (key === "c" || key === "a")) return;
    if (key === "tab") return;
    if (!(field instanceof HTMLSelectElement) && ["arrowleft", "arrowright", "arrowup", "arrowdown", "home", "end", "pageup", "pagedown"].includes(key)) return;
    event.preventDefault();
    event.stopPropagation();
  }

  function handleDrop(event: ReactDragEvent<HTMLElement>) {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (!file || !file.name.toLowerCase().endsWith(".json")) return;
    if (!editMode) {
      alert("Ative o Modo Edição antes de importar um arquivo.");
      return;
    }
    setDropFile(file);
    setImportOpen(true);
  }

  const contentHeight = "h-full";
  const focusId = activeEditableTab?.refId;

  return <AppShell
    compact={compact}
    onDragOver={(event) => event.preventDefault()}
    onDrop={handleDrop}
    sidebar={<AppSidebar
      activeView={view}
      onNavigate={(nextView) => { setView(nextView); setItemEditMode(false); setSearchOpen(false); }}
      tableName={currentTable?.name ?? "Mesa"}
      systemName={currentSystem?.name ?? "Sistema"}
      sessionActive={Boolean(data.runtime?.activeSessionId)}
      collapsed={sidebarCollapsed}
      onToggleCollapsed={() => setSidebarCollapsed((current) => {
        const next = !current;
        window.localStorage.setItem("mesa-do-mestre-sidebar-collapsed", next ? "1" : "0");
        return next;
      })}
      mobileOpen={mobileMenuOpen}
      onCloseMobile={() => setMobileMenuOpen(false)}
    />}
    topbar={<Topbar
      tables={data.tables}
      activeTableId={data.activeTableId}
      activeSystemName={currentSystem?.name ?? "Sistema"}
      sessionActive={Boolean(data.runtime?.activeSessionId)}
      onTableChange={switchTable}
      onOpenSidebar={() => setMobileMenuOpen(true)}
      searchRef={searchRef}
      searchQuery={searchQuery}
      searchResults={searchResults}
      searchOpen={searchOpen}
      searchLoading={searchLoading}
      searchError={searchError}
      onSearchChange={setSearchQuery}
      onSearchOpen={setSearchOpen}
      onSearchResult={openSearchResult}
      editMode={editMode}
      itemEditMode={itemEditMode}
      canEditItem={Boolean(activeEditableTab)}
      editTimeoutMinutes={editTimeoutMinutes}
      onReadMode={() => { setEditMode(false); setItemEditMode(false); }}
      onEditMode={() => { setItemEditMode(false); setEditMode(true); setEditActivity(Date.now()); }}
      onItemEditMode={() => { setItemEditMode((current) => !current); setEditActivity(Date.now()); }}
      onEditTimeoutChange={(minutes) => {
        setEditTimeoutMinutes(minutes);
        window.localStorage.setItem("mesa-do-mestre-edit-timeout", String(minutes));
        setEditActivity(Date.now());
      }}
      onUndo={() => { if (editMode) void runAction({ action: "undo-last", tableId: data.activeTableId }); }}
      onImport={() => { if (!editMode) return; setDropFile(undefined); setImportOpen(true); }}
      onExport={() => void exportCurrent()}
      onPlayerView={openPlayerView}
      onToggleCompact={toggleCompact}
      onToggleFullscreen={() => void toggleFullscreen()}
      compact={compact}
      fullscreen={fullscreen}
      loading={loading}
      status={status}
    />}
    pageHeader={<PageHeader
      view={view}
      systemName={currentSystem?.name ?? "Sistema"}
      activeTabTitle={activeEditableTab?.title}
      editMode={editMode}
      itemEditMode={itemEditMode}
      editTimeoutMinutes={editTimeoutMinutes}
      compact={compact}
    />}
    tabStrip={tabs.length > 0 ? (
      <div className="flex shrink-0 gap-1 overflow-x-auto border-b border-border/60 bg-card/60 px-3 py-2 lg:px-5" aria-label="Conteúdos abertos">
        {tabs.map((tab) => (
          <div key={tab.id} className={`flex shrink-0 items-center rounded-lg border ${activeTabId === tab.id ? "border-primary/45 bg-primary/10" : "border-border bg-secondary/60"}`}>
            <button
              type="button"
              aria-current={activeTabId === tab.id ? "page" : undefined}
              onClick={() => openTab(tab)}
              className="max-w-52 truncate px-3 py-1.5 text-xs text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
              title={tab.title}
            >{tab.title}</button>
            <button type="button" aria-label={`Destacar ${tab.title} em outra janela`} onClick={() => detachTab(tab)} className="rounded-md px-1.5 py-1.5 text-muted-foreground hover:text-primary focus-visible:outline-2 focus-visible:outline-ring" title="Destacar em outra janela"><ExternalLink aria-hidden="true" className="size-3.5" /></button>
            <button type="button" aria-label={`Fechar ${tab.title}`} onClick={() => closeTab(tab.id)} className="rounded-md py-1.5 pl-1.5 pr-2 text-muted-foreground hover:text-destructive focus-visible:outline-2 focus-visible:outline-ring"><X aria-hidden="true" className="size-3.5" /></button>
          </div>
        ))}
      </div>
    ) : undefined}
  >
    <section className={`workspace-content min-h-0 flex-1 overflow-hidden ${editMode ? "workspace-editing" : itemEditMode ? "workspace-readonly workspace-item-edit" : "workspace-readonly"}`} onBeforeInputCapture={protectReadModeFormEvent} onPasteCapture={protectReadModeClipboard} onCutCapture={protectReadModeClipboard} onKeyDownCapture={protectReadModeKeyDown} onInputCapture={touchEdit} onPointerDownCapture={touchEdit}>
      {view === "home" && <div className={`${contentHeight} overflow-y-auto`}><HomeView data={data} recent={recent} loading={loading} onContinue={() => setView("session-mode")} onSession={() => setView("session-mode")} onCombat={() => setView("combat")} onLibrary={() => setView("library")} onOpenTable={switchTable} onOpenRecent={openRecent} onOpenContent={openContent} onNavigate={(nextView) => { setView(nextView); setItemEditMode(false); }} /></div>}
      {view === "session-mode" && <div className={contentHeight}><SessionCockpitView data={data} action={runAction} onOpenCombat={() => setView("combat")} onOpenContent={openContent} /></div>}
      {view === "dashboard" && <div className={`${contentHeight} overflow-y-auto`}><DashboardView data={data} recent={recent} action={runAction} onOpenTable={(tableId) => void load(tableId)} onOpenRecent={openRecent} /></div>}
      {view === "rules" && <div className={contentHeight}><RulesView data={data} action={runAction} onOpened={opened} focusId={activeEditableTab?.type === "rule" ? focusId : undefined} /></div>}
      {view === "sheets" && <div className={contentHeight}><SheetsView key={`sheets:${activeEditableTab?.id ?? "base"}`} data={sheetData} action={runAction} onOpened={opened} /></div>}
      {view === "templates" && <div className={contentHeight}><TemplatesView data={data} action={runAction} /></div>}
      {view === "world" && <div className={contentHeight}><WorldView data={data} action={runAction} onOpened={opened} focusId={activeEditableTab && ["item", "location", "faction", "quest", "timeline", "entity"].includes(activeEditableTab.type) ? focusId : undefined} /></div>}
      {view === "campaign" && <div className={contentHeight}><CampaignToolsView data={data} action={runAction} /></div>}
      {view === "sessions" && <div className={contentHeight}><SessionsView data={data} action={runAction} onOpened={opened} focusId={activeEditableTab && ["session", "note"].includes(activeEditableTab.type) ? focusId : undefined} /></div>}
      {view === "combat" && <div className={contentHeight}><CombatView data={data} action={runAction} /></div>}
      {view === "library" && <div className={contentHeight}><LibraryView data={data} action={runAction} /></div>}
      {view === "history" && <div className={`${contentHeight} overflow-y-auto`}><HistoryView data={data} action={runAction} /></div>}
    </section>

    {importOpen && <ImportDialog data={data} action={runAction} previewImport={previewImport} initialFile={dropFile} onClose={() => { setImportOpen(false); setDropFile(undefined); }} onFinish={(tableId) => void load(tableId)} />}
  </AppShell>;
}
