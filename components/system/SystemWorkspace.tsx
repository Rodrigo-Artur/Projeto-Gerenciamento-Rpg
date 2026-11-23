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
  useSyncExternalStore,
} from "react";

import { AppShell } from "@/components/layout/AppShell";
import { homeFavorites } from "@/components/dashboard/home-data";
import { AppSidebar, type ViewId } from "@/components/layout/AppSidebar";
import { PageHeader } from "@/components/layout/PageHeader";
import { Topbar } from "@/components/layout/Topbar";
import { WorkspaceLoadError, WorkspaceLoading, WorkspaceSaveError } from "@/components/ui/workspace-feedback";
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
import type { WorkspaceTab } from "@/types/rulebook";
import { createWorkspaceTab, readWorkspaceTabs, resolveWorkspaceContent, validateWorkspaceTabs } from "@/lib/workspace-navigation";

// Garante a mesma árvore no SSR e no primeiro render de hidratação.
// O workspace completo depende de estado do navegador e da seleção de mesa.
const subscribeToClientReady = () => () => {};
function useClientReady() {
  return useSyncExternalStore(subscribeToClientReady, () => true, () => false);
}

function protectedFieldFromTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return null;
  const field = target.closest("input, textarea, select");
  if (!(field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement || field instanceof HTMLSelectElement)) return null;
  if (field instanceof HTMLInputElement && (field.placeholder.toLowerCase().includes("filtrar") || field.placeholder.toLowerCase().includes("buscar") || field.placeholder.toLowerCase().includes("pesquisar"))) return null;
  return field;
}

export function SystemWorkspace() {
  const { data, recent, status, statusKind, loading, loadError, saveError, clearSaveError, load, retryLoad, action, search, previewImport, recordRecent } = useWorkspaceApi(false);
  const clientReady = useClientReady();
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
  const [editActivity, setEditActivity] = useState(0);
  const [tabs, setTabs] = useState<WorkspaceTab[]>([]);
  const [tabsOwner, setTabsOwner] = useState("");
  const [navigationNotice, setNavigationNotice] = useState("");
  const [pendingOpened, setPendingOpened] = useState<{ tableId: string; type: string; id: string; name: string }>();
  const [activeTabId, setActiveTabId] = useState("");
  const searchRef = useRef<HTMLInputElement | null>(null);

  const currentTable = data.tables.find((item) => item.id === data.activeTableId);
  const currentSystem = data.systems.find((item) => item.id === data.activeSystemId) ?? data.systems.find((item) => item.id === currentTable?.systemId);
  const visibleTabs = tabsOwner === data.activeTableId ? tabs : [];
  const activeTab = visibleTabs.find((item) => item.id === activeTabId);
  const activeEditableTab = activeTab?.view === view ? activeTab : undefined;
  const paletteFavorites = useMemo(() => homeFavorites(data), [data]);
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

  // Restaurar somente depois da resposta da mesa; validar refs antes de exibir.
  // A escrita é autorizada apenas se tabsOwner pertencer à mesa carregada,
  // evitando que abas antigas sobrescrevam a configuração de outra mesa.
  useEffect(() => {
    if (loading || !data.tables.some((item) => item.id === data.activeTableId)) return;
    if (tabsOwner !== data.activeTableId) {
      const restored = readWorkspaceTabs(
        data, window.localStorage.getItem(`mesa-tabs-${data.activeTableId}`)
      );
      setTabs(restored.tabs);
      setActiveTabId(restored.activeTabId);
      setTabsOwner(data.activeTableId);
      setItemEditMode(false);
      return;
    }
    setTabs((current) => {
      const cleaned = validateWorkspaceTabs(data, current);
      const unchanged = cleaned.length === current.length && cleaned.every(
        (item, index) =>
          item.id === current[index]?.id &&
          item.title === current[index]?.title &&
          item.view === current[index]?.view &&
          item.pinned === current[index]?.pinned
      );
      return unchanged ? current : cleaned;
    });
  }, [data, loading, tabsOwner]);

  useEffect(() => {
    if (tabsOwner !== data.activeTableId || loading) return;
    const validIds = new Set(tabs.map((item) => item.id));
    if (activeTabId && !validIds.has(activeTabId)) {
      setActiveTabId(tabs[0]?.id ?? "");
      setItemEditMode(false);
    }
    window.localStorage.setItem(
      `mesa-tabs-${tabsOwner}`,
      JSON.stringify({ version: 2, tabs, activeTabId: validIds.has(activeTabId) ? activeTabId : tabs[0]?.id ?? "" })
    );
  }, [data.activeTableId, loading, tabs, tabsOwner, activeTabId]);

  // O editor pode concluir uma criação antes de React aplicar a resposta
  // de POST. Só abrir a nova aba quando o registro existir no payload da mesa.
  useEffect(() => {
    if (!pendingOpened || loading) return;
    if (pendingOpened.tableId !== data.activeTableId) {
      setPendingOpened(undefined);
      return;
    }
    const resolved = resolveWorkspaceContent(data, pendingOpened.type, pendingOpened.id);
    if (!resolved) return;
    setPendingOpened(undefined);
    addTab(resolved.type, resolved.refId, resolved.title);
    void recordRecent(resolved.type, resolved.refId, resolved.title);
  }, [data, loading, pendingOpened, recordRecent]);

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
    if (!query || query.startsWith(">")) {
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
    // Mesmo que a mesa atual ainda apareça selecionada enquanto outra carrega,
    // permitir a troca para ela novamente: isso invalida a resposta pendente.
    if (!tableId || (tableId === data.activeTableId && !loading)) return;
    // Mesa diferente: pesquisa, permissões temporárias e foco anterior são descartados.
    setSearchQuery("");
    setSearchResults([]);
    setSearchError(undefined);
    setSearchOpen(false);
    setEditMode(false);
    setItemEditMode(false);
    setNavigationNotice("");
    setPendingOpened(undefined);
    setView("home");
    void load(tableId);
  }

  function addTab(type: string, id: string, name: string) {
    const content = resolveWorkspaceContent(data, type, id);
    if (!content || loading) {
      setNavigationNotice(`Não foi possível abrir “${name}”: conteúdo não encontrado na mesa atual.`);
      return;
    }
    const tab = createWorkspaceTab(data.activeTableId, content);
    setNavigationNotice("");
    setTabs((current) => {
      const existing = tabsOwner === data.activeTableId ? current : [];
      if (existing.some((item) => item.id === tab.id)) return existing;
      return [...existing, tab].slice(-12);
    });
    setTabsOwner(data.activeTableId);
    setActiveTabId(tab.id);
    setItemEditMode(false);
  }

  function openContent(type: string, id: string, name: string) {
    const content = resolveWorkspaceContent(data, type, id);
    if (!content || loading) {
      setNavigationNotice(`O conteúdo “${name}” não existe mais nesta mesa.`);
      return;
    }
    setView(content.view);
    addTab(content.type, content.refId, content.title);
    void recordRecent(content.type, content.refId, content.title);
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
    const resolved = resolveWorkspaceContent(data, type, id);
    if (resolved) {
      addTab(resolved.type, resolved.refId, resolved.title);
      void recordRecent(resolved.type, resolved.refId, resolved.title);
      return;
    }
    // Registros criados via autosave/POST podem ainda não existir no snapshot
    // capturado pelo editor. Aguarda o payload novo, sem inventar uma referência.
    setPendingOpened({ tableId: data.activeTableId, type, id, name });
  }

  function openTab(tab: WorkspaceTab) {
    if (tabsOwner !== data.activeTableId || tab.tableId !== data.activeTableId) return;
    const content = resolveWorkspaceContent(data, tab.type, tab.refId ?? "");
    if (!content) {
      setNavigationNotice(`A aba “${tab.title}” não existe mais nesta mesa.`);
      setTabs((current) => current.filter((item) => item.id !== tab.id));
      return;
    }
    setNavigationNotice("");
    setActiveTabId(tab.id);
    setView(content.view);
    setItemEditMode(false);
    void recordRecent(content.type, content.refId, content.title);
  }

  function closeTab(id: string) {
    if (tabsOwner !== data.activeTableId) return;
    const remaining = tabs.filter((item) => item.id !== id);
    setTabs(remaining);
    if (activeTabId === id) {
      const next = remaining.at(-1);
      setActiveTabId(next?.id ?? "");
      if (next) setView(next.view as ViewId);
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

  // SSR e a primeira renderização no navegador exibem o mesmo fallback.
  // Evita diferenças de atributos (ex.: select disabled) durante a hidratação.
  if (!clientReady) {
    return (
      <main
        role="status"
        aria-live="polite"
        className="flex min-h-dvh w-full items-center justify-center bg-background p-6 text-foreground"
      >
        <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-5 py-4 text-sm text-muted-foreground">
          <span aria-hidden="true" className="size-3 animate-pulse rounded-full bg-primary motion-reduce:animate-none" />
          Carregando Mesa do Mestre...
        </div>
      </main>
    );
  }

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
      recent={recent}
      favorites={paletteFavorites}
      searchOpen={searchOpen}
      searchLoading={searchLoading}
      searchError={searchError}
      onSearchChange={setSearchQuery}
      onSearchOpen={(open) => { setSearchOpen(open); if (!open) setSearchQuery(""); }}
      onSearchResult={openSearchResult}
      onOpenRecent={openRecent}
      onOpenFavorite={(item) => openContent(item.type, item.id, item.name)}
      onNavigate={(nextView) => { setView(nextView); setItemEditMode(false); }}
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
      statusKind={statusKind}
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
    tabStrip={navigationNotice || (!loading && visibleTabs.length > 0) ? (
      <div className="border-b border-border/60 bg-card/60">
        {navigationNotice && <p role="alert" className="px-4 py-2 text-xs text-warning">{navigationNotice}</p>}
        {visibleTabs.length > 0 && <div className="flex gap-1 overflow-x-auto px-3 py-2 lg:px-5" aria-label="Conteúdos abertos">
        {visibleTabs.map((tab) => (
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
        </div>}
      </div>
    ) : undefined}
  >
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      {loadError && data.tables.length > 0 && (
        <WorkspaceLoadError
          compact
          message={loadError}
          onRetry={() => void retryLoad()}
        />
      )}
      {saveError && <WorkspaceSaveError message={saveError} onDismiss={clearSaveError} />}
    <section className={`workspace-content min-h-0 flex-1 overflow-hidden ${editMode ? "workspace-editing" : itemEditMode ? "workspace-readonly workspace-item-edit" : "workspace-readonly"}`} onBeforeInputCapture={protectReadModeFormEvent} onPasteCapture={protectReadModeClipboard} onCutCapture={protectReadModeClipboard} onKeyDownCapture={protectReadModeKeyDown} onInputCapture={touchEdit} onPointerDownCapture={touchEdit}>
      {loading ? (
        <WorkspaceLoading label="Carregando a mesa selecionada..." />
      ) : loadError && data.tables.length === 0 ? (
        <WorkspaceLoadError message={loadError} onRetry={() => void retryLoad()} />
      ) : (
        <>
      {view === "home" && <div className={`${contentHeight} overflow-y-auto`}><HomeView data={data} recent={recent} loading={loading} onContinue={() => setView("session-mode")} onSession={() => setView("session-mode")} onCombat={() => setView("combat")} onLibrary={() => setView("library")} onOpenTable={switchTable} onOpenRecent={openRecent} onOpenContent={openContent} onNavigate={(nextView) => { setView(nextView); setItemEditMode(false); }} /></div>}
      {view === "session-mode" && <div className={contentHeight}><SessionCockpitView data={data} action={runAction} onOpenCombat={() => setView("combat")} onOpenContent={openContent} focusHandoutId={activeEditableTab?.type === "handout" ? focusId : undefined} /></div>}
      {view === "dashboard" && <div className={`${contentHeight} overflow-y-auto`}><DashboardView data={data} recent={recent} action={runAction} onOpenTable={switchTable} onOpenRecent={openRecent} /></div>}
      {view === "rules" && <div className={contentHeight}><RulesView data={data} action={runAction} onOpened={opened} focusId={activeEditableTab?.type === "rule" ? focusId : undefined} /></div>}
      {view === "sheets" && <div className={contentHeight}><SheetsView key={`sheets:${data.activeTableId}:${activeEditableTab?.id ?? "base"}`} data={data} action={runAction} onOpened={opened} focusType={activeEditableTab?.type === "player" || activeEditableTab?.type === "npc" ? activeEditableTab.type : undefined} focusId={activeEditableTab?.type === "player" || activeEditableTab?.type === "npc" ? focusId : undefined} /></div>}
      {view === "templates" && <div className={contentHeight}><TemplatesView data={data} action={runAction} /></div>}
      {view === "world" && <div className={contentHeight}><WorldView data={data} action={runAction} onOpened={opened} focusId={activeEditableTab && ["item", "location", "faction", "quest", "timeline", "entity"].includes(activeEditableTab.type) ? focusId : undefined} /></div>}
      {view === "campaign" && <div className={contentHeight}><CampaignToolsView data={data} action={runAction} /></div>}
      {view === "sessions" && <div className={contentHeight}><SessionsView data={data} action={runAction} onOpened={opened} canEdit={editMode} focusId={activeEditableTab && ["session", "note"].includes(activeEditableTab.type) ? focusId : undefined} focusType={activeEditableTab?.type === "session" || activeEditableTab?.type === "note" ? activeEditableTab.type : undefined} /></div>}
      {view === "combat" && <div className={contentHeight}><CombatView data={data} action={runAction} /></div>}
      {view === "library" && <div className={contentHeight}><LibraryView data={data} action={runAction} focusId={activeEditableTab?.type === "library" ? focusId : undefined} /></div>}
      {view === "history" && <div className={`${contentHeight} overflow-y-auto`}><HistoryView data={data} action={runAction} /></div>}
        </>
      )}
    </section>
    </div>

    {importOpen && <ImportDialog data={data} action={runAction} previewImport={previewImport} initialFile={dropFile} onClose={() => { setImportOpen(false); setDropFile(undefined); }} onFinish={(tableId) => void load(tableId)} />}
  </AppShell>;
}
