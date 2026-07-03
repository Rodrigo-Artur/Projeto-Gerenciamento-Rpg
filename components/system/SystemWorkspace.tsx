"use client";

import {
  BookOpen,
  Database,
  Download,
  Edit3,
  FileText,
  History,
  NotebookPen,
  Plus,
  RotateCcw,
  Save,
  Search,
  Trash2,
  Upload,
  UserRound,
  Users,
  X,
} from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";

import type {
  LabeledValue,
  NpcSheet,
  OpenPanel,
  PlayerAbility,
  PlayerSheet,
  RpgSystem,
  RpgTable,
  RuleArticle,
  RuleCategory,
  RulebookData,
  SessionPlan,
  SheetCategory,
  TableNote,
} from "@/types/rulebook";

type Tab = "system" | "sheets";
type AnyItem = RuleArticle | PlayerSheet | NpcSheet | TableNote | SessionPlan;

const defaultSystem: RpgSystem = { id: "kaiju-rpg", name: "Kaiju RPG", description: "Sistema base." };
const defaultTable: RpgTable = {
  id: "mesa-principal",
  systemId: defaultSystem.id,
  name: "Mesa Principal",
  description: "Dados preservados.",
};
const blankData: RulebookData = {
  systems: [defaultSystem],
  tables: [defaultTable],
  activeTableId: defaultTable.id,
  activeSystemId: defaultSystem.id,
  rules: [],
  npcs: [],
  players: [],
  notes: [],
  sessions: [],
  history: [],
};

const ruleCategories: RuleCategory[] = [
  "combate",
  "testes",
  "atributos",
  "defesa-dano",
  "personagem",
  "progressao",
  "habilidades",
  "armaduras",
  "regras-da-casa",
];
const npcCategories: SheetCategory[] = ["criminosos", "policia-umck", "ameacas-pesadas", "simbiontes"];

function makeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function normalize(data: Partial<RulebookData>, fallbackTableId?: string): RulebookData {
  const systems = data.systems?.length ? data.systems : [defaultSystem];
  const tables = data.tables?.length ? data.tables : [defaultTable];
  const table = tables.find((item) => item.id === (data.activeTableId || fallbackTableId)) ?? tables[0] ?? defaultTable;

  return {
    systems,
    tables,
    activeTableId: table.id,
    activeSystemId: data.activeSystemId || table.systemId || systems[0]?.id || defaultSystem.id,
    rules: data.rules ?? [],
    npcs: data.npcs ?? [],
    players: data.players ?? [],
    notes: data.notes ?? [],
    sessions: data.sessions ?? [],
    history: data.history ?? [],
  };
}

function titleOf(panel: OpenPanel, data: RulebookData) {
  if (panel.type === "rule") return data.rules.find((item) => item.id === panel.refId)?.title ?? panel.title;
  if (panel.type === "player") return data.players.find((item) => item.id === panel.refId)?.characterName ?? panel.title;
  if (panel.type === "npc") return data.npcs.find((item) => item.id === panel.refId)?.name ?? panel.title;
  if (panel.type === "note") return data.notes.find((item) => item.id === panel.refId)?.title ?? panel.title;
  return data.sessions.find((item) => item.id === panel.refId)?.title ?? panel.title;
}

function listToText(items: string[]) {
  return items.join("\n");
}

function textToList(text: string) {
  return text
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function labeledToText(items: LabeledValue[]) {
  return items.map((item) => `${item.label}: ${item.value}`).join("\n");
}

function textToLabeled(text: string): LabeledValue[] {
  return textToList(text).map((line) => {
    const [label, ...rest] = line.split(":");
    return { label: label?.trim() || "Campo", value: rest.join(":").trim() || "-" };
  });
}

function abilitiesToText(items: PlayerAbility[]) {
  return items
    .map((item) => [item.name, item.type, item.scale, item.cost, item.test, item.effect, item.limit ?? ""].join(" | "))
    .join("\n");
}

function textToAbilities(text: string): PlayerAbility[] {
  return textToList(text).map((line) => {
    const [name, type, scale, cost, test, effect, limit] = line.split("|").map((part) => part.trim());
    return {
      name: name || "Habilidade",
      type: type || "—",
      scale: scale || "—",
      cost: cost || "—",
      test: test || "—",
      effect: effect || "—",
      limit: limit || undefined,
    };
  });
}

function getItem(panel: OpenPanel, data: RulebookData): AnyItem | undefined {
  if (panel.type === "rule") return data.rules.find((item) => item.id === panel.refId);
  if (panel.type === "player") return data.players.find((item) => item.id === panel.refId);
  if (panel.type === "npc") return data.npcs.find((item) => item.id === panel.refId);
  if (panel.type === "note") return data.notes.find((item) => item.id === panel.refId);
  return data.sessions.find((item) => item.id === panel.refId);
}

export function SystemWorkspace() {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [data, setData] = useState<RulebookData>(blankData);
  const [tab, setTab] = useState<Tab>("system");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("Carregando...");
  const [systemPanels, setSystemPanels] = useState<OpenPanel[]>([]);
  const [sheetPanels, setSheetPanels] = useState<OpenPanel[]>([]);

  const panels = tab === "system" ? systemPanels : sheetPanels;
  const activeTable = data.tables.find((item) => item.id === data.activeTableId) ?? data.tables[0] ?? defaultTable;
  const activeSystem =
    data.systems.find((item) => item.id === data.activeSystemId) ??
    data.systems.find((item) => item.id === activeTable.systemId) ??
    data.systems[0] ??
    defaultSystem;

  useEffect(() => {
    void loadTable();
  }, []);

  const normalizedQuery = query.toLowerCase();
  const filteredRules = useMemo(
    () => data.rules.filter((item) => !normalizedQuery || `${item.title} ${item.summary} ${item.content} ${item.tags.join(" ")}`.toLowerCase().includes(normalizedQuery)),
    [data.rules, normalizedQuery]
  );
  const filteredPlayers = useMemo(
    () => data.players.filter((item) => !normalizedQuery || `${item.characterName} ${item.playerName} ${item.role} ${item.concept}`.toLowerCase().includes(normalizedQuery)),
    [data.players, normalizedQuery]
  );
  const filteredNpcs = useMemo(
    () => data.npcs.filter((item) => !normalizedQuery || `${item.name} ${item.role} ${item.description} ${item.notes.join(" ")}`.toLowerCase().includes(normalizedQuery)),
    [data.npcs, normalizedQuery]
  );
  const filteredNotes = useMemo(
    () => data.notes.filter((item) => !normalizedQuery || `${item.title} ${item.content}`.toLowerCase().includes(normalizedQuery)),
    [data.notes, normalizedQuery]
  );
  const filteredSessions = useMemo(
    () => data.sessions.filter((item) => !normalizedQuery || `${item.title} ${item.summary} ${item.scenes.join(" ")} ${item.notes.join(" ")}`.toLowerCase().includes(normalizedQuery)),
    [data.sessions, normalizedQuery]
  );

  async function loadTable(tableId?: string) {
    setStatus("Carregando mesa...");
    try {
      const response = await fetch(`/api/rulebook${tableId ? `?tableId=${encodeURIComponent(tableId)}` : ""}`, { cache: "no-store" });
      if (!response.ok) throw new Error("load failed");

      const next = normalize((await response.json()) as RulebookData, tableId);
      setData(next);
      setSystemPanels(next.rules[0] ? [{ id: `rule:${next.rules[0].id}`, type: "rule", refId: next.rules[0].id, title: next.rules[0].title }] : []);
      if (next.players[0]) {
        setSheetPanels([{ id: `player:${next.players[0].id}`, type: "player", refId: next.players[0].id, title: next.players[0].characterName }]);
      } else if (next.npcs[0]) {
        setSheetPanels([{ id: `npc:${next.npcs[0].id}`, type: "npc", refId: next.npcs[0].id, title: next.npcs[0].name }]);
      } else {
        setSheetPanels([]);
      }
      setStatus("Banco local conectado");
    } catch {
      setStatus("Erro ao carregar");
    }
  }

  async function save(next: RulebookData) {
    setData(next);
    setStatus("Salvando...");
    try {
      const response = await fetch("/api/rulebook", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next),
      });
      if (!response.ok) throw new Error("save failed");
      setData(normalize((await response.json()) as RulebookData, next.activeTableId));
      setStatus("Salvo");
    } catch {
      setStatus("Erro ao salvar");
    }
  }

  function open(panel: OpenPanel) {
    if (panel.type === "rule") {
      setTab("system");
      setSystemPanels((current) => (current.some((item) => item.id === panel.id) ? current : [...current, panel].slice(-4)));
      return;
    }
    setTab("sheets");
    setSheetPanels((current) => (current.some((item) => item.id === panel.id) ? current : [...current, panel].slice(-4)));
  }

  function close(panelId: string) {
    if (tab === "system") {
      setSystemPanels((current) => (current.length <= 1 ? current : current.filter((item) => item.id !== panelId)));
      return;
    }
    setSheetPanels((current) => (current.length <= 1 ? current : current.filter((item) => item.id !== panelId)));
  }

  function chooseSystemId() {
    const options = data.systems.map((system, index) => `${index + 1} - ${system.name}`).join("\n");
    const selectedIndex = Number(prompt(`Sistema da mesa:\n\n${options}`, "1")) - 1;
    return data.systems[selectedIndex]?.id ?? data.systems[0]?.id ?? defaultSystem.id;
  }

  async function createTable() {
    const name = prompt("Nome da nova mesa:", "Nova mesa");
    if (!name) return;
    const systemId = chooseSystemId();
    const description = prompt("Descrição:", "Mesa vazia para nova campanha.") ?? "";
    const response = await fetch("/api/rulebook", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "create-table", name, description, systemId }),
    });
    const next = normalize((await response.json()) as RulebookData);
    setTab("system");
    setData(next);
    setSystemPanels(next.rules[0] ? [{ id: `rule:${next.rules[0].id}`, type: "rule", refId: next.rules[0].id, title: next.rules[0].title }] : []);
    setSheetPanels([]);
  }

  async function createSystem() {
    const name = prompt("Nome do novo sistema:", "Novo sistema");
    if (!name) return;
    const description = prompt("Descrição:", "Sistema customizado.") ?? "";
    const response = await fetch("/api/rulebook", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "create-system", name, description, tableId: data.activeTableId }),
    });
    setData(normalize((await response.json()) as RulebookData, data.activeTableId));
  }

  function createRule() {
    const title = prompt("Título da regra:", "Nova regra");
    if (!title) return;
    const category = (prompt(`Categoria:\n${ruleCategories.join("\n")}`, "regras-da-casa") || "regras-da-casa") as RuleCategory;
    const item: RuleArticle = {
      id: makeId(`${data.activeSystemId}-rule`),
      category,
      title,
      summary: "Resumo da regra.",
      content: "Escreva a regra aqui.",
      tags: ["customizado"],
    };
    const next = { ...data, rules: [...data.rules, item] };
    void save(next);
    open({ id: `rule:${item.id}`, type: "rule", refId: item.id, title: item.title });
  }

  function createPlayer() {
    const name = prompt("Nome do personagem:", "Novo Player");
    if (!name) return;
    const item: PlayerSheet = {
      id: makeId(`${data.activeTableId}-player`),
      characterName: name,
      playerName: "Jogador",
      role: "Função",
      tier: "Tier 1",
      concept: "Conceito do personagem.",
      status: [{ label: "HP", value: "0" }],
      attributes: [{ label: "Atributo", value: "0" }],
      resources: [],
      abilities: [],
      notes: [],
    };
    const next = { ...data, players: [...data.players, item] };
    void save(next);
    open({ id: `player:${item.id}`, type: "player", refId: item.id, title: item.characterName });
  }

  function createNpc() {
    const name = prompt("Nome do NPC:", "Novo NPC");
    if (!name) return;
    const category = (prompt(`Categoria:\n${npcCategories.join("\n")}`, "criminosos") || "criminosos") as SheetCategory;
    const item: NpcSheet = {
      id: makeId(`${data.activeTableId}-npc`),
      category,
      name,
      role: "Função do NPC",
      description: "Descrição do NPC.",
      stats: [
        { label: "Tier", value: "Tier 1" },
        { label: "HP", value: "0" },
      ],
      notes: [],
    };
    const next = { ...data, npcs: [...data.npcs, item] };
    void save(next);
    open({ id: `npc:${item.id}`, type: "npc", refId: item.id, title: item.name });
  }

  function createNote() {
    const title = prompt("Título da anotação:", "Nova anotação");
    if (!title) return;
    const item: TableNote = { id: makeId(`${data.activeTableId}-note`), title, content: "Anote pistas, segredos e pendências.", isPrivate: true };
    const next = { ...data, notes: [...data.notes, item] };
    void save(next);
    open({ id: `note:${item.id}`, type: "note", refId: item.id, title: item.title });
  }

  function createSession() {
    const title = prompt("Título da sessão:", "Próxima sessão");
    if (!title) return;
    const item: SessionPlan = {
      id: makeId(`${data.activeTableId}-session`),
      title,
      summary: "Objetivo da sessão.",
      scenes: ["Cena 1"],
      linkedRefs: [],
      notes: ["Gancho final"],
    };
    const next = { ...data, sessions: [...data.sessions, item] };
    void save(next);
    open({ id: `session:${item.id}`, type: "session", refId: item.id, title: item.title });
  }

  function updateItem(panel: OpenPanel, item: AnyItem) {
    const next: RulebookData = {
      ...data,
      rules: panel.type === "rule" ? data.rules.map((current) => (current.id === panel.refId ? (item as RuleArticle) : current)) : data.rules,
      players: panel.type === "player" ? data.players.map((current) => (current.id === panel.refId ? (item as PlayerSheet) : current)) : data.players,
      npcs: panel.type === "npc" ? data.npcs.map((current) => (current.id === panel.refId ? (item as NpcSheet) : current)) : data.npcs,
      notes: panel.type === "note" ? data.notes.map((current) => (current.id === panel.refId ? (item as TableNote) : current)) : data.notes,
      sessions: panel.type === "session" ? data.sessions.map((current) => (current.id === panel.refId ? (item as SessionPlan) : current)) : data.sessions,
    };
    void save(next);
  }

  function remove(panel: OpenPanel) {
    if (!confirm(`Excluir "${titleOf(panel, data)}"?`)) return;
    const next = {
      ...data,
      rules: panel.type === "rule" ? data.rules.filter((item) => item.id !== panel.refId) : data.rules,
      players: panel.type === "player" ? data.players.filter((item) => item.id !== panel.refId) : data.players,
      npcs: panel.type === "npc" ? data.npcs.filter((item) => item.id !== panel.refId) : data.npcs,
      notes: panel.type === "note" ? data.notes.filter((item) => item.id !== panel.refId) : data.notes,
      sessions: panel.type === "session" ? data.sessions.filter((item) => item.id !== panel.refId) : data.sessions,
    };
    setSystemPanels((current) => current.filter((item) => item.refId !== panel.refId));
    setSheetPanels((current) => current.filter((item) => item.refId !== panel.refId));
    void save(next);
  }

  async function resetTable() {
    if (!confirm(`Restaurar fichas/anotações/sessões da mesa ${activeTable.name}?`)) return;
    const response = await fetch("/api/rulebook", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "reset-seed", tableId: data.activeTableId }),
    });
    const next = normalize((await response.json()) as RulebookData, data.activeTableId);
    setData(next);
    setSheetPanels([]);
  }

  function exportBackup() {
    const blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), data }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${activeTable.name.replace(/[^a-z0-9]+/gi, "-")}-backup.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function importBackup(file: File) {
    const parsed = JSON.parse(await file.text()) as { data?: Partial<RulebookData> } | Partial<RulebookData>;
    const incoming = "data" in parsed && parsed.data ? parsed.data : parsed;
    await save({
      ...data,
      rules: incoming.rules ?? data.rules,
      npcs: incoming.npcs ?? data.npcs,
      players: incoming.players ?? data.players,
      notes: incoming.notes ?? data.notes,
      sessions: incoming.sessions ?? data.sessions,
    });
    if (fileRef.current) fileRef.current.value = "";
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="grid min-h-16 grid-cols-[1fr_auto_1fr] items-center gap-4 border-b border-zinc-800 px-6 py-3">
        <div>
          <h1 className="text-xl font-bold text-amber-400">Mesa do Mestre</h1>
          <p className="text-xs text-zinc-500">Mesa: {activeTable.name}</p>
          <p className="text-xs text-zinc-600">Sistema: {activeSystem.name}</p>
        </div>

        <div className="flex rounded-xl border border-zinc-800 bg-zinc-900 p-1">
          <TabButton active={tab === "system"} onClick={() => setTab("system")} icon={<BookOpen className="h-4 w-4" />} label="Sistema" />
          <TabButton active={tab === "sheets"} onClick={() => setTab("sheets")} icon={<Users className="h-4 w-4" />} label="Fichas" />
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          <select value={data.activeTableId} onChange={(event) => void loadTable(event.target.value)} className="max-w-48 rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs text-zinc-200">
            {data.tables.map((table) => (
              <option key={table.id} value={table.id}>{table.name}</option>
            ))}
          </select>
          <TopButton onClick={createTable} icon={<Plus className="h-3.5 w-3.5" />} label="Nova mesa" />
          <TopButton onClick={createSystem} icon={<BookOpen className="h-3.5 w-3.5" />} label="Novo sistema" />
          <TopButton onClick={exportBackup} icon={<Download className="h-3.5 w-3.5" />} label="Exportar" />
          <TopButton onClick={() => fileRef.current?.click()} icon={<Upload className="h-3.5 w-3.5" />} label="Importar" />
          <input ref={fileRef} type="file" accept="application/json" className="hidden" onChange={(event) => event.target.files?.[0] && void importBackup(event.target.files[0])} />
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/40 px-3 py-1 text-xs text-emerald-300"><Database className="h-3.5 w-3.5" />{status}</span>
          <button onClick={() => void resetTable()} className="inline-flex items-center gap-2 rounded-md border border-zinc-700 px-3 py-2 text-xs text-zinc-300 hover:border-red-500/60 hover:text-red-300"><RotateCcw className="h-3.5 w-3.5" />Restaurar mesa</button>
        </div>
      </header>

      <div className="grid h-[calc(100vh-4rem)] grid-cols-[340px_1fr]">
        <aside className="overflow-y-auto border-r border-zinc-800 bg-zinc-900/70 p-4">
          <label className="mb-4 flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-400">
            <Search className="h-4 w-4" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar..." className="w-full bg-transparent text-zinc-200 outline-none" />
          </label>

          {tab === "system" ? (
            <SystemList rules={filteredRules} open={open} createRule={createRule} />
          ) : (
            <SheetList
              players={filteredPlayers}
              npcs={filteredNpcs}
              notes={filteredNotes}
              sessions={filteredSessions}
              history={data.history}
              open={open}
              createPlayer={createPlayer}
              createNpc={createNpc}
              createNote={createNote}
              createSession={createSession}
            />
          )}
        </aside>

        <section className="overflow-hidden p-4">
          <div className="flex h-full gap-3 overflow-x-auto">
            {panels.length === 0 ? (
              <div className="flex h-full w-full items-center justify-center rounded-xl border border-dashed border-zinc-800 text-sm text-zinc-500">
                {tab === "system" ? "Nenhuma regra aberta." : "Nenhuma ficha/anotação/sessão aberta."}
              </div>
            ) : (
              panels.map((panel) => (
                <ContentPanel key={panel.id} panel={panel} data={data} onClose={() => close(panel.id)} onDelete={() => remove(panel)} onSave={(item) => updateItem(panel, item)} />
              ))
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function TabButton({ active, icon, label, onClick }: { active: boolean; icon: ReactNode; label: string; onClick: () => void }) {
  return <button onClick={onClick} className={`inline-flex items-center gap-2 rounded-lg px-5 py-2 text-sm font-medium ${active ? "bg-amber-500 text-zinc-950" : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"}`}>{icon}{label}</button>;
}

function TopButton({ icon, label, onClick }: { icon: ReactNode; label: string; onClick: () => void }) {
  return <button onClick={onClick} className="top-action-button">{icon}{label}</button>;
}

function SidebarButton({ title, description, onClick }: { title: string; description: string; onClick: () => void }) {
  return <button onClick={onClick} className="w-full rounded-md border border-zinc-800 bg-zinc-950 p-3 text-left text-sm hover:border-amber-500/50"><p className="font-medium text-zinc-200">{title}</p><p className="mt-1 line-clamp-2 text-xs text-zinc-500">{description}</p></button>;
}

function SidebarHeader({ icon, title, label, onClick }: { icon: ReactNode; title: string; label: string; onClick: () => void }) {
  return <div className="mb-4 flex items-center justify-between"><p className="flex items-center gap-2 text-sm font-semibold text-zinc-300">{icon}{title}</p><button onClick={onClick} className="rounded-md border border-zinc-700 px-2 py-1 text-xs text-zinc-300 hover:border-amber-500/60">+ {label}</button></div>;
}

function SystemList({ rules, open, createRule }: { rules: RuleArticle[]; open: (panel: OpenPanel) => void; createRule: () => void }) {
  return <><SidebarHeader icon={<BookOpen className="h-4 w-4" />} title="Regras" label="Nova regra" onClick={createRule} /><div className="space-y-2">{rules.map((rule) => <SidebarButton key={rule.id} title={rule.title} description={rule.category} onClick={() => open({ id: `rule:${rule.id}`, type: "rule", refId: rule.id, title: rule.title })} />)}</div></>;
}

function SheetList({ players, npcs, notes, sessions, history, open, createPlayer, createNpc, createNote, createSession }: { players: PlayerSheet[]; npcs: NpcSheet[]; notes: TableNote[]; sessions: SessionPlan[]; history: RulebookData["history"]; open: (panel: OpenPanel) => void; createPlayer: () => void; createNpc: () => void; createNote: () => void; createSession: () => void }) {
  return <><SidebarHeader icon={<Users className="h-4 w-4" />} title="Fichas da mesa" label="Novo player" onClick={createPlayer} /><div className="mb-4 grid grid-cols-3 gap-2"><MiniButton label="NPC" onClick={createNpc} /><MiniButton label="Nota" onClick={createNote} /><MiniButton label="Sessão" onClick={createSession} /></div><Group title="Players">{players.length ? players.map((player) => <SidebarButton key={player.id} title={player.characterName} description={player.role} onClick={() => open({ id: `player:${player.id}`, type: "player", refId: player.id, title: player.characterName })} />) : <Empty />}</Group><Group title="NPCs">{npcs.length ? npcs.map((npc) => <SidebarButton key={npc.id} title={npc.name} description={npc.role} onClick={() => open({ id: `npc:${npc.id}`, type: "npc", refId: npc.id, title: npc.name })} />) : <Empty />}</Group><Group title="Anotações">{notes.length ? notes.map((note) => <SidebarButton key={note.id} title={note.title} description={note.isPrivate ? "Privada" : "Visível"} onClick={() => open({ id: `note:${note.id}`, type: "note", refId: note.id, title: note.title })} />) : <Empty />}</Group><Group title="Preparação de Sessão">{sessions.length ? sessions.map((session) => <SidebarButton key={session.id} title={session.title} description={session.summary} onClick={() => open({ id: `session:${session.id}`, type: "session", refId: session.id, title: session.title })} />) : <Empty />}</Group><div className="mt-6 rounded-md border border-zinc-800 bg-zinc-950 p-3"><p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase text-zinc-500"><History className="h-3.5 w-3.5" />Histórico</p>{history.length ? history.slice(0, 8).map((item) => <p key={item.id} className="text-xs text-zinc-400"><span className="text-amber-300">{item.action}</span> {item.targetName}</p>) : <p className="text-xs text-zinc-600">Sem histórico.</p>}</div></>;
}

function MiniButton({ label, onClick }: { label: string; onClick: () => void }) {
  return <button onClick={onClick} className="rounded-md border border-zinc-800 bg-zinc-950 px-2 py-2 text-xs text-zinc-300 hover:border-amber-500/60">+ {label}</button>;
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return <section className="mb-6"><p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">{title}</p><div className="space-y-2">{children}</div></section>;
}

function Empty() {
  return <p className="rounded-md border border-zinc-800 bg-zinc-950 p-3 text-xs text-zinc-500">Nada aqui.</p>;
}

function ContentPanel({ panel, data, onClose, onDelete, onSave }: { panel: OpenPanel; data: RulebookData; onClose: () => void; onDelete: () => void; onSave: (item: AnyItem) => void }) {
  const item = getItem(panel, data);
  const [editing, setEditing] = useState(false);
  if (!item) return null;

  return <article className="flex h-full min-w-[420px] flex-1 flex-col overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900"><header className="flex items-center justify-between gap-3 border-b border-zinc-800 p-4"><div className="min-w-0"><h2 className="truncate text-lg font-semibold text-amber-300">{titleOf(panel, data)}</h2><p className="text-xs text-zinc-500">{editing ? "Editando conteúdo" : "Visualização organizada"}</p></div><div className="flex gap-2">{editing ? null : <button onClick={() => setEditing(true)} className="rounded-md border border-zinc-700 px-3 py-2 text-xs text-zinc-300 hover:border-amber-500/60"><Edit3 className="h-4 w-4" /></button>}<button onClick={onDelete} className="rounded-md border border-zinc-700 px-3 py-2 text-xs text-red-300"><Trash2 className="h-4 w-4" /></button><button onClick={onClose} className="rounded-md border border-zinc-700 px-3 py-2 text-xs text-zinc-300"><X className="h-4 w-4" /></button></div></header><div className="min-h-0 flex-1 overflow-y-auto p-5">{panel.type === "rule" && <RulePanel rule={item as RuleArticle} editing={editing} onCancel={() => setEditing(false)} onSave={(next) => { onSave(next); setEditing(false); }} />}{panel.type === "player" && <PlayerPanel player={item as PlayerSheet} editing={editing} onCancel={() => setEditing(false)} onSave={(next) => { onSave(next); setEditing(false); }} />}{panel.type === "npc" && <NpcPanel npc={item as NpcSheet} editing={editing} onCancel={() => setEditing(false)} onSave={(next) => { onSave(next); setEditing(false); }} />}{panel.type === "note" && <NotePanel note={item as TableNote} editing={editing} onCancel={() => setEditing(false)} onSave={(next) => { onSave(next); setEditing(false); }} />}{panel.type === "session" && <SessionPanel session={item as SessionPlan} editing={editing} onCancel={() => setEditing(false)} onSave={(next) => { onSave(next); setEditing(false); }} />}</div></article>;
}

function RulePanel({ rule, editing, onCancel, onSave }: { rule: RuleArticle; editing: boolean; onCancel: () => void; onSave: (rule: RuleArticle) => void }) {
  const [title, setTitle] = useState(rule.title);
  const [summary, setSummary] = useState(rule.summary);
  const [category, setCategory] = useState(rule.category);
  const [tags, setTags] = useState(rule.tags.join(", "));
  const [content, setContent] = useState(rule.content);
  useEffect(() => { setTitle(rule.title); setSummary(rule.summary); setCategory(rule.category); setTags(rule.tags.join(", ")); setContent(rule.content); }, [rule]);
  if (editing) return <EditStack><Input label="Título" value={title} onChange={setTitle} /><Select label="Categoria" value={category} options={ruleCategories} onChange={(value) => setCategory(value as RuleCategory)} /><Input label="Resumo" value={summary} onChange={setSummary} /><Input label="Tags" value={tags} onChange={setTags} /><Area label="Texto" value={content} onChange={setContent} rows={16} /><Actions onCancel={onCancel} onSave={() => onSave({ ...rule, title, summary, category, tags: tags.split(",").map((tag) => tag.trim()).filter(Boolean), content })} /></EditStack>;
  return <ReadStack><Badge>{category}</Badge><p className="text-sm text-zinc-400">{summary}</p><Prose text={content} />{rule.tags.length > 0 && <div className="flex flex-wrap gap-2">{rule.tags.map((tag) => <Badge key={tag}>{tag}</Badge>)}</div>}</ReadStack>;
}

function PlayerPanel({ player, editing, onCancel, onSave }: { player: PlayerSheet; editing: boolean; onCancel: () => void; onSave: (player: PlayerSheet) => void }) {
  const [name, setName] = useState(player.characterName);
  const [playerName, setPlayerName] = useState(player.playerName);
  const [role, setRole] = useState(player.role);
  const [tier, setTier] = useState(player.tier);
  const [concept, setConcept] = useState(player.concept);
  const [status, setStatus] = useState(labeledToText(player.status));
  const [attributes, setAttributes] = useState(labeledToText(player.attributes));
  const [resources, setResources] = useState(labeledToText(player.resources));
  const [abilities, setAbilities] = useState(abilitiesToText(player.abilities));
  const [notes, setNotes] = useState(listToText(player.notes));
  useEffect(() => { setName(player.characterName); setPlayerName(player.playerName); setRole(player.role); setTier(player.tier); setConcept(player.concept); setStatus(labeledToText(player.status)); setAttributes(labeledToText(player.attributes)); setResources(labeledToText(player.resources)); setAbilities(abilitiesToText(player.abilities)); setNotes(listToText(player.notes)); }, [player]);
  if (editing) return <EditStack><Input label="Nome do personagem" value={name} onChange={setName} /><Input label="Jogador" value={playerName} onChange={setPlayerName} /><Input label="Função" value={role} onChange={setRole} /><Input label="Tier" value={tier} onChange={setTier} /><Area label="Conceito" value={concept} onChange={setConcept} rows={4} /><Area label="Status: Nome: Valor" value={status} onChange={setStatus} rows={6} /><Area label="Atributos: Nome: Valor" value={attributes} onChange={setAttributes} rows={6} /><Area label="Recursos: Nome: Valor" value={resources} onChange={setResources} rows={5} /><Area label="Habilidades: Nome | Tipo | Escala | Custo | Teste | Efeito | Limite" value={abilities} onChange={setAbilities} rows={8} /><Area label="Notas, uma por linha" value={notes} onChange={setNotes} rows={5} /><Actions onCancel={onCancel} onSave={() => onSave({ ...player, characterName: name, playerName, role, tier, concept, status: textToLabeled(status), attributes: textToLabeled(attributes), resources: textToLabeled(resources), abilities: textToAbilities(abilities), notes: textToList(notes) })} /></EditStack>;
  return <ReadStack><Info label="Jogador" value={player.playerName} /><Info label="Função" value={player.role} /><Info label="Tier" value={player.tier} /><Card title="Conceito"><p>{player.concept}</p></Card><Grid title="Status" items={player.status} /><Grid title="Atributos" items={player.attributes} /><Grid title="Recursos" items={player.resources} /><Abilities abilities={player.abilities} /><List title="Notas" items={player.notes} /></ReadStack>;
}

function NpcPanel({ npc, editing, onCancel, onSave }: { npc: NpcSheet; editing: boolean; onCancel: () => void; onSave: (npc: NpcSheet) => void }) {
  const [name, setName] = useState(npc.name);
  const [role, setRole] = useState(npc.role);
  const [category, setCategory] = useState(npc.category);
  const [description, setDescription] = useState(npc.description);
  const [stats, setStats] = useState(labeledToText(npc.stats));
  const [notes, setNotes] = useState(listToText(npc.notes));
  useEffect(() => { setName(npc.name); setRole(npc.role); setCategory(npc.category); setDescription(npc.description); setStats(labeledToText(npc.stats)); setNotes(listToText(npc.notes)); }, [npc]);
  if (editing) return <EditStack><Input label="Nome" value={name} onChange={setName} /><Input label="Função" value={role} onChange={setRole} /><Select label="Categoria" value={category} options={npcCategories} onChange={(value) => setCategory(value as SheetCategory)} /><Area label="Descrição" value={description} onChange={setDescription} rows={5} /><Area label="Status: Nome: Valor" value={stats} onChange={setStats} rows={8} /><Area label="Notas, uma por linha" value={notes} onChange={setNotes} rows={8} /><Actions onCancel={onCancel} onSave={() => onSave({ ...npc, name, role, category, description, stats: textToLabeled(stats), notes: textToList(notes) })} /></EditStack>;
  return <ReadStack><Info label="Categoria" value={npc.category} /><Info label="Função" value={npc.role} /><Card title="Descrição"><p>{npc.description}</p></Card><Grid title="Status" items={npc.stats} /><List title="Notas e habilidades" items={npc.notes} /></ReadStack>;
}

function NotePanel({ note, editing, onCancel, onSave }: { note: TableNote; editing: boolean; onCancel: () => void; onSave: (note: TableNote) => void }) {
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);
  const [isPrivate, setIsPrivate] = useState(note.isPrivate);
  useEffect(() => { setTitle(note.title); setContent(note.content); setIsPrivate(note.isPrivate); }, [note]);
  if (editing) return <EditStack><Input label="Título" value={title} onChange={setTitle} /><label className="flex items-center gap-2 text-sm text-zinc-300"><input type="checkbox" checked={isPrivate} onChange={(event) => setIsPrivate(event.target.checked)} />Privada</label><Area label="Texto" value={content} onChange={setContent} rows={16} /><Actions onCancel={onCancel} onSave={() => onSave({ ...note, title, content, isPrivate })} /></EditStack>;
  return <ReadStack><Badge>{note.isPrivate ? "Privada" : "Visível"}</Badge><Prose text={note.content} /></ReadStack>;
}

function SessionPanel({ session, editing, onCancel, onSave }: { session: SessionPlan; editing: boolean; onCancel: () => void; onSave: (session: SessionPlan) => void }) {
  const [title, setTitle] = useState(session.title);
  const [summary, setSummary] = useState(session.summary);
  const [scenes, setScenes] = useState(listToText(session.scenes));
  const [refs, setRefs] = useState(listToText(session.linkedRefs));
  const [notes, setNotes] = useState(listToText(session.notes));
  useEffect(() => { setTitle(session.title); setSummary(session.summary); setScenes(listToText(session.scenes)); setRefs(listToText(session.linkedRefs)); setNotes(listToText(session.notes)); }, [session]);
  if (editing) return <EditStack><Input label="Título" value={title} onChange={setTitle} /><Area label="Resumo" value={summary} onChange={setSummary} rows={3} /><Area label="Cenas, uma por linha" value={scenes} onChange={setScenes} rows={7} /><Area label="Fichas/regras ligadas, uma por linha" value={refs} onChange={setRefs} rows={5} /><Area label="Notas e ganchos, uma por linha" value={notes} onChange={setNotes} rows={6} /><Actions onCancel={onCancel} onSave={() => onSave({ ...session, title, summary, scenes: textToList(scenes), linkedRefs: textToList(refs), notes: textToList(notes) })} /></EditStack>;
  return <ReadStack><Card title="Resumo"><p>{session.summary}</p></Card><List title="Cenas" items={session.scenes} /><List title="Fichas e regras ligadas" items={session.linkedRefs} /><List title="Notas e ganchos" items={session.notes} /></ReadStack>;
}

function ReadStack({ children }: { children: ReactNode }) {
  return <div className="space-y-5 text-sm leading-7 text-zinc-300">{children}</div>;
}

function EditStack({ children }: { children: ReactNode }) {
  return <div className="space-y-4">{children}</div>;
}

function Actions({ onCancel, onSave }: { onCancel: () => void; onSave: () => void }) {
  return <div className="flex gap-2 pt-2"><button onClick={onSave} className="inline-flex items-center gap-2 rounded-md bg-amber-500 px-4 py-2 text-sm font-semibold text-zinc-950"><Save className="h-4 w-4" />Salvar</button><button onClick={onCancel} className="rounded-md border border-zinc-700 px-4 py-2 text-sm text-zinc-300">Cancelar</button></div>;
}

function Input({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label className="block text-xs font-semibold uppercase tracking-wide text-zinc-500">{label}<input value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-950 p-3 text-sm normal-case text-zinc-200 outline-none focus:border-amber-500" /></label>;
}

function Select({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return <label className="block text-xs font-semibold uppercase tracking-wide text-zinc-500">{label}<select value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-950 p-3 text-sm normal-case text-zinc-200 outline-none focus:border-amber-500">{options.map((option) => <option key={option} value={option}>{option}</option>)}</select></label>;
}

function Area({ label, value, onChange, rows }: { label: string; value: string; onChange: (value: string) => void; rows: number }) {
  return <label className="block text-xs font-semibold uppercase tracking-wide text-zinc-500">{label}<textarea value={value} onChange={(event) => onChange(event.target.value)} rows={rows} className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-950 p-4 text-sm normal-case leading-7 text-zinc-200 outline-none focus:border-amber-500" /></label>;
}

function Badge({ children }: { children: ReactNode }) {
  return <span className="inline-flex w-fit rounded-full bg-zinc-800 px-2.5 py-1 text-xs text-zinc-300">{children}</span>;
}

function Info({ label, value }: { label: string; value: string }) {
  return <div><p className="text-xs uppercase tracking-wide text-zinc-500">{label}</p><p className="text-zinc-200">{value}</p></div>;
}

function Card({ title, children }: { title: string; children: ReactNode }) {
  return <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4"><p className="mb-2 text-sm font-semibold text-amber-300">{title}</p>{children}</div>;
}

function Prose({ text }: { text: string }) {
  return <div className="space-y-4">{text.split("\n\n").map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div>;
}

function Grid({ title, items }: { title: string; items: LabeledValue[] }) {
  if (items.length === 0) return null;
  return <Card title={title}><div className="grid grid-cols-2 gap-3">{items.map((item, index) => <div key={`${item.label}-${index}`} className="rounded-md border border-zinc-800 bg-zinc-900/70 p-3"><p className="text-xs uppercase text-zinc-500">{item.label}</p><p className="font-semibold text-zinc-100">{item.value}</p></div>)}</div></Card>;
}

function List({ title, items }: { title: string; items: string[] }) {
  return <Card title={title}>{items.length ? <ul className="space-y-2">{items.map((item, index) => <li key={index}>• {item}</li>)}</ul> : <p className="text-zinc-500">Nenhum item registrado.</p>}</Card>;
}

function Abilities({ abilities }: { abilities: PlayerAbility[] }) {
  if (abilities.length === 0) return null;
  return <Card title="Habilidades"><div className="space-y-3">{abilities.map((ability, index) => <div key={`${ability.name}-${index}`} className="rounded-md border border-zinc-800 bg-zinc-900/70 p-3"><p className="font-semibold text-zinc-100">{ability.name}</p><p className="text-xs text-zinc-500">{ability.type} • {ability.scale} • Custo: {ability.cost}</p><p className="text-xs text-zinc-500">Teste: {ability.test}</p><p className="mt-2 text-zinc-300">{ability.effect}</p>{ability.limit && <p className="mt-2 text-xs text-red-300">Limite: {ability.limit}</p>}</div>)}</div></Card>;
}
