"use client";

import {
  BookOpen,
  CalendarDays,
  Clock3,
  Database,
  Download,
  ExternalLink,
  Eye,
  History,
  Home,
  LayoutDashboard,
  Library,
  Link2,
  Lock,
  Map,
  Maximize2,
  Minimize2,
  Pencil,
  Rows3,
  Search,
  Settings2,
  Swords,
  Undo2,
  Upload,
  Users,
  X,
} from "lucide-react";
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

type ViewId = "home" | "session-mode" | "dashboard" | "rules" | "sheets" | "templates" | "world" | "campaign" | "sessions" | "combat" | "library" | "history";

const navigation: Array<{ id: ViewId; label: string; icon: typeof Home }> = [
  { id: "home", label: "Início", icon: Home },
  { id: "session-mode", label: "Modo Sessão", icon: CalendarDays },
  { id: "rules", label: "Sistema", icon: BookOpen },
  { id: "sheets", label: "Fichas", icon: Users },
  { id: "combat", label: "Combate", icon: Swords },
  { id: "world", label: "Mundo", icon: Map },
  { id: "campaign", label: "Campanha", icon: Link2 },
  { id: "sessions", label: "Sessões", icon: CalendarDays },
  { id: "library", label: "Biblioteca", icon: Library },
  { id: "templates", label: "Templates", icon: Settings2 },
  { id: "dashboard", label: "Gerenciar", icon: LayoutDashboard },
  { id: "history", label: "Histórico", icon: History },
];

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
  const [compact, setCompact] = useState(false);
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
      if ((event.ctrlKey || event.metaKey) && !event.shiftKey && event.key.toLowerCase() === "z" && !insideEditableField) {
        event.preventDefault();
        void runAction({ action: "undo-last", tableId: data.activeTableId });
      }
    }
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  });

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (!searchQuery.trim()) {
        setSearchResults([]);
        return;
      }
      void search(searchQuery).then((results) => {
        setSearchResults(results);
        setSearchOpen(true);
      });
    }, 250);
    return () => window.clearTimeout(timer);
  }, [search, searchQuery]);

  async function runAction(payload: Record<string, unknown>, options?: { silent?: boolean; reloadTableId?: string }) {
    return action(payload, options) as Promise<Record<string, unknown>>;
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

  const contentHeight = "h-[calc(100vh-166px)]";
  const focusId = activeEditableTab?.refId;

  return <main onDragOver={(event) => event.preventDefault()} onDrop={handleDrop} className={`flex min-h-screen flex-col bg-zinc-950 text-zinc-100 ${compact ? "compact-workspace" : ""}`}>
    <header className={`relative z-40 border-b px-4 py-3 backdrop-blur ${editMode ? "border-amber-500/50 bg-amber-950/15" : itemEditMode ? "border-blue-500/50 bg-blue-950/15" : "border-emerald-500/20 bg-zinc-950/95"}`}>
      <div className="flex flex-wrap items-center gap-3">
        <button onClick={() => setView("home")} className="mr-2 text-left"><p className="text-lg font-bold text-amber-400">Mesa do Mestre</p><p className="text-[11px] text-zinc-600">{currentTable?.name ?? "Mesa"} • {currentSystem?.name ?? "Sistema"}</p></button>
        <select value={data.activeTableId} onChange={(event) => void load(event.target.value)} className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-300 outline-none hover:border-amber-500/50">{data.tables.map((table) => <option key={table.id} value={table.id}>{table.name}</option>)}</select>
        <div className="relative min-w-[220px] flex-1 max-w-xl"><Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-zinc-500" /><input ref={searchRef} value={searchQuery} onFocus={() => setSearchOpen(true)} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Buscar em regras, fichas e mundo...  Ctrl+K" className="w-full rounded-lg border border-zinc-800 bg-zinc-900 py-2 pl-9 pr-3 text-sm text-zinc-200 outline-none focus:border-amber-500/60" />{searchOpen && searchQuery.trim() && <div className="absolute left-0 right-0 top-11 max-h-80 overflow-y-auto rounded-xl border border-zinc-700 bg-zinc-950 p-2 shadow-2xl">{searchResults.length === 0 ? <p className="p-3 text-sm text-zinc-500">Nenhum resultado.</p> : searchResults.map((result) => <button key={`${result.type}-${result.id}`} onClick={() => openSearchResult(result)} className="block w-full rounded-lg p-3 text-left hover:bg-zinc-900"><p className="text-xs uppercase text-amber-400">{result.type}</p><p className="font-medium text-zinc-200">{result.name}</p><p className="line-clamp-1 text-xs text-zinc-500">{result.description}</p></button>)}</div>}</div>

        <div className="inline-flex rounded-lg border border-zinc-700 bg-zinc-900 p-1"><button onClick={() => { setEditMode(false); setItemEditMode(false); }} className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold ${!effectiveEdit ? "bg-emerald-500/15 text-emerald-300" : "text-zinc-500"}`}><Lock className="h-3.5 w-3.5" />Leitura</button><button onClick={() => { setItemEditMode(false); setEditMode(true); setEditActivity(Date.now()); }} className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold ${editMode ? "bg-amber-500 text-zinc-950" : "text-zinc-500"}`} title="Ctrl+Shift+E"><Pencil className="h-3.5 w-3.5" />Edição</button>{activeEditableTab && !editMode && <button onClick={() => { setItemEditMode((current) => !current); setEditActivity(Date.now()); }} className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold ${itemEditMode ? "bg-blue-500 text-white" : "text-zinc-500"}`} title="Editar somente o item aberto"><Pencil className="h-3.5 w-3.5" />Item</button>}</div>

        <label className="flex items-center gap-1 text-[10px] text-zinc-500"><Clock3 className="h-3.5 w-3.5" />bloquear<select value={editTimeoutMinutes} onChange={(event) => { const value = Number(event.target.value); setEditTimeoutMinutes(value); window.localStorage.setItem("mesa-do-mestre-edit-timeout", String(value)); setEditActivity(Date.now()); }} className="rounded border border-zinc-800 bg-zinc-900 px-1 py-1 text-xs"><option value={1}>1m</option><option value={5}>5m</option><option value={15}>15m</option><option value={0}>nunca</option></select></label>
        <button onClick={() => void runAction({ action: "undo-last", tableId: data.activeTableId })} className="icon-button" title="Desfazer última mudança — Ctrl+Z"><Undo2 className="h-4 w-4" /></button>
        <button disabled={!editMode} onClick={() => { setDropFile(undefined); setImportOpen(true); }} className="top-action-button" title={editMode ? "Importar ou arrastar JSON para a janela" : "Ative edição para importar"}><Upload className="h-4 w-4" />Importar</button>
        <button onClick={() => void exportCurrent()} className="top-action-button"><Download className="h-4 w-4" />Exportar</button><button onClick={openPlayerView} className="top-action-button"><Eye className="h-4 w-4" />Tela jogador</button><button onClick={toggleCompact} className="icon-button"><Rows3 className="h-4 w-4" /></button><button onClick={() => void toggleFullscreen()} className="icon-button">{fullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}</button><span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs ${status.toLowerCase().includes("erro") || status.toLowerCase().includes("falha") ? "border-red-500/40 text-red-300" : "border-emerald-500/30 text-emerald-300"}`}><Database className="h-3.5 w-3.5" />{loading ? "Carregando..." : status}</span>
      </div>
      <div className={`mt-2 flex items-center justify-between gap-3 rounded-lg border px-3 py-1.5 text-xs font-semibold ${editMode ? "border-amber-500/30 bg-amber-500/10 text-amber-300" : itemEditMode ? "border-blue-500/30 bg-blue-500/10 text-blue-300" : "border-emerald-500/20 bg-emerald-500/5 text-emerald-300"}`}><span>{editMode ? "✎ MODO EDIÇÃO GLOBAL — alterações estão liberadas" : itemEditMode ? `✎ EDIÇÃO DO ITEM — ${activeEditableTab?.title ?? "conteúdo atual"}` : "🔒 MODO LEITURA — campos protegidos contra alterações"}</span>{effectiveEdit && editTimeoutMinutes > 0 && <span className="font-normal opacity-70">bloqueio automático em {editTimeoutMinutes} min</span>}</div>
      <nav className="mt-2 flex gap-1 overflow-x-auto">{navigation.map((item) => { const Icon = item.icon; return <button key={item.id} onClick={() => { setView(item.id); setItemEditMode(false); }} className={`inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium ${view === item.id ? "bg-amber-500 text-zinc-950" : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100"}`}><Icon className="h-4 w-4" />{item.label}</button>; })}</nav>
      {tabs.length > 0 && <div className="mt-2 flex gap-1 overflow-x-auto border-t border-zinc-800/70 pt-2">{tabs.map((tab) => <div key={tab.id} className={`flex shrink-0 items-center rounded-lg border ${activeTabId === tab.id ? "border-amber-500/50 bg-amber-500/10" : "border-zinc-800 bg-zinc-900"}`}><button onClick={() => openTab(tab)} className="max-w-52 truncate px-3 py-1.5 text-xs text-zinc-300">{tab.title}</button><button onClick={() => detachTab(tab)} className="px-1.5 text-zinc-500 hover:text-amber-300" title="Destacar em outra janela"><ExternalLink className="h-3.5 w-3.5" /></button><button onClick={() => closeTab(tab.id)} className="px-1.5 pr-2 text-zinc-600 hover:text-red-300"><X className="h-3.5 w-3.5" /></button></div>)}</div>}
    </header>

    <section className={`workspace-content min-h-0 flex-1 overflow-hidden ${editMode ? "workspace-editing" : itemEditMode ? "workspace-readonly workspace-item-edit" : "workspace-readonly"}`} onBeforeInputCapture={protectReadModeFormEvent} onPasteCapture={protectReadModeClipboard} onCutCapture={protectReadModeClipboard} onKeyDownCapture={protectReadModeKeyDown} onInputCapture={touchEdit} onPointerDownCapture={touchEdit}>
      {view === "home" && <div className={`${contentHeight} overflow-y-auto`}><HomeView data={data} recent={recent} onContinue={() => setView(data.runtime?.activeSessionId ? "session-mode" : "sheets")} onSession={() => setView("session-mode")} onCombat={() => setView("combat")} onLibrary={() => setView("library")} onOpenTable={(tableId) => void load(tableId)} onOpenRecent={openRecent} /></div>}
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
  </main>;
}
