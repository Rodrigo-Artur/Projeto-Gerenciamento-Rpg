"use client";

import {
  BookOpen,
  CalendarDays,
  Database,
  Download,
  Eye,
  History,
  LayoutDashboard,
  Map,
  Search,
  Settings2,
  Swords,
  Upload,
  Users,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { CombatView } from "@/components/system/CombatView";
import { DashboardView } from "@/components/system/DashboardView";
import { HistoryView } from "@/components/system/HistoryView";
import { ImportDialog } from "@/components/system/ImportDialog";
import { RulesView } from "@/components/system/RulesView";
import { SessionsView } from "@/components/system/SessionsView";
import { SheetsView } from "@/components/system/SheetsView";
import { TemplatesView } from "@/components/system/TemplatesView";
import { WorldView } from "@/components/system/WorldView";
import { useWorkspaceApi, type RecentContent, type SearchResult } from "@/hooks/useWorkspaceApi";

type ViewId = "dashboard" | "rules" | "sheets" | "templates" | "world" | "sessions" | "combat" | "history";

const navigation: Array<{ id: ViewId; label: string; icon: typeof LayoutDashboard }> = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "rules", label: "Sistema", icon: BookOpen },
  { id: "sheets", label: "Fichas", icon: Users },
  { id: "templates", label: "Templates", icon: Settings2 },
  { id: "world", label: "Mundo", icon: Map },
  { id: "sessions", label: "Sessões", icon: CalendarDays },
  { id: "combat", label: "Combate", icon: Swords },
  { id: "history", label: "Histórico", icon: History },
];

export function SystemWorkspace() {
  const { data, recent, status, loading, load, action, search, previewImport, recordRecent } = useWorkspaceApi(false);
  const [view, setView] = useState<ViewId>("dashboard");
  const [importOpen, setImportOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement | null>(null);

  const currentTable = data.tables.find((item) => item.id === data.activeTableId);
  const currentSystem = data.systems.find((item) => item.id === data.activeSystemId) ?? data.systems.find((item) => item.id === currentTable?.systemId);

  useEffect(() => {
    function handleShortcut(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchRef.current?.focus();
        setSearchOpen(true);
      }
    }
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, []);

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

  function navigateToType(type: string) {
    if (type === "rule") return setView("rules");
    if (type === "player" || type === "npc") return setView("sheets");
    if (type === "note" || type === "session") return setView("sessions");
    if (["item", "location", "faction", "quest", "timeline", "entity"].includes(type)) return setView("world");
  }

  function openSearchResult(result: SearchResult) {
    navigateToType(result.type);
    setSearchQuery("");
    setSearchOpen(false);
    void recordRecent(result.type, result.id, result.name);
  }

  function openRecent(item: RecentContent) {
    navigateToType(item.type);
    void recordRecent(item.type, item.id, item.name);
  }

  function opened(type: string, id: string, name: string) {
    void recordRecent(type, id, name);
  }

  async function exportCurrent() {
    const response = await fetch(`/api/rulebook?tableId=${encodeURIComponent(data.activeTableId)}&export=1`, { cache: "no-store" });
    if (!response.ok) return;
    const json = await response.json();
    const blob = new Blob([JSON.stringify(json, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${(currentTable?.name ?? "mesa").replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-mesa-do-mestre-v2.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function openPlayerView() {
    window.open(`/player?tableId=${encodeURIComponent(data.activeTableId)}`, "mesa-do-mestre-player-view");
  }

  return (
    <main className="flex min-h-screen flex-col bg-zinc-950 text-zinc-100">
      <header className="relative z-40 border-b border-zinc-800 bg-zinc-950/95 px-4 py-3 backdrop-blur">
        <div className="flex flex-wrap items-center gap-3">
          <button onClick={() => setView("dashboard")} className="mr-2 text-left">
            <p className="text-lg font-bold text-amber-400">Mesa do Mestre</p>
            <p className="text-[11px] text-zinc-600">{currentTable?.name ?? "Mesa"} • {currentSystem?.name ?? "Sistema"}</p>
          </button>

          <select
            value={data.activeTableId}
            onChange={(event) => void load(event.target.value)}
            className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-300 outline-none hover:border-amber-500/50"
          >
            {data.tables.map((table) => <option key={table.id} value={table.id}>{table.name}</option>)}
          </select>

          <div className="relative min-w-[220px] flex-1 max-w-xl">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
            <input
              ref={searchRef}
              value={searchQuery}
              onFocus={() => setSearchOpen(true)}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Buscar em regras, fichas e mundo...  Ctrl+K"
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900 py-2 pl-9 pr-3 text-sm text-zinc-200 outline-none focus:border-amber-500/60"
            />
            {searchOpen && searchQuery.trim() && (
              <div className="absolute left-0 right-0 top-11 max-h-80 overflow-y-auto rounded-xl border border-zinc-700 bg-zinc-950 p-2 shadow-2xl">
                {searchResults.length === 0 ? <p className="p-3 text-sm text-zinc-500">Nenhum resultado.</p> : searchResults.map((result) => (
                  <button key={`${result.type}-${result.id}`} onClick={() => openSearchResult(result)} className="block w-full rounded-lg p-3 text-left hover:bg-zinc-900">
                    <p className="text-xs uppercase text-amber-400">{result.type}</p>
                    <p className="font-medium text-zinc-200">{result.name}</p>
                    <p className="line-clamp-1 text-xs text-zinc-500">{result.description}</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          <button onClick={() => setImportOpen(true)} className="top-action-button"><Upload className="h-4 w-4" />Importar</button>
          <button onClick={() => void exportCurrent()} className="top-action-button"><Download className="h-4 w-4" />Exportar</button>
          <button onClick={openPlayerView} className="top-action-button"><Eye className="h-4 w-4" />Tela jogador</button>
          <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs ${status.toLowerCase().includes("erro") || status.toLowerCase().includes("falha") ? "border-red-500/40 text-red-300" : "border-emerald-500/30 text-emerald-300"}`}>
            <Database className="h-3.5 w-3.5" />{loading ? "Carregando..." : status}
          </span>
        </div>

        <nav className="mt-3 flex gap-1 overflow-x-auto">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <button key={item.id} onClick={() => setView(item.id)} className={`inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition ${view === item.id ? "bg-amber-500 text-zinc-950" : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100"}`}>
                <Icon className="h-4 w-4" />{item.label}
              </button>
            );
          })}
        </nav>
      </header>

      <section className="min-h-0 flex-1 overflow-hidden">
        {view === "dashboard" && <div className="h-[calc(100vh-118px)] overflow-y-auto"><DashboardView data={data} recent={recent} action={runAction} onOpenTable={(tableId) => void load(tableId)} onOpenRecent={openRecent} /></div>}
        {view === "rules" && <div className="h-[calc(100vh-118px)]"><RulesView data={data} action={runAction} onOpened={opened} /></div>}
        {view === "sheets" && <div className="h-[calc(100vh-118px)]"><SheetsView data={data} action={runAction} onOpened={opened} /></div>}
        {view === "templates" && <div className="h-[calc(100vh-118px)]"><TemplatesView data={data} action={runAction} /></div>}
        {view === "world" && <div className="h-[calc(100vh-118px)]"><WorldView data={data} action={runAction} onOpened={opened} /></div>}
        {view === "sessions" && <div className="h-[calc(100vh-118px)]"><SessionsView data={data} action={runAction} onOpened={opened} /></div>}
        {view === "combat" && <div className="h-[calc(100vh-118px)]"><CombatView data={data} action={runAction} /></div>}
        {view === "history" && <div className="h-[calc(100vh-118px)] overflow-y-auto"><HistoryView data={data} action={runAction} /></div>}
      </section>

      {importOpen && (
        <ImportDialog
          data={data}
          action={runAction}
          previewImport={previewImport}
          onClose={() => setImportOpen(false)}
          onFinish={(tableId) => void load(tableId)}
        />
      )}
    </main>
  );
}
