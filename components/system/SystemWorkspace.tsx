"use client";

import {
  BookOpen,
  Database,
  Edit3,
  FileText,
  Home,
  Plus,
  RotateCcw,
  Save,
  ScrollText,
  ShieldAlert,
  Swords,
  UserRound,
  Users,
  WandSparkles,
  X,
} from "lucide-react";
import type { ElementType, PointerEvent, ReactNode } from "react";
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
  SheetCategory,
} from "@/types/rulebook";

type WorkspaceTab = "system" | "sheets";

type MenuItem = {
  id: RuleCategory;
  label: string;
  description: string;
  icon: ElementType;
};

type SheetCategoryItem = {
  id: SheetCategory;
  label: string;
  description: string;
};

const PANEL_MIN_WIDTH = 320;
const MAX_OPEN_PANELS = 4;

const defaultSystem: RpgSystem = {
  id: "kaiju-rpg",
  name: "Kaiju RPG",
  description: "Sistema base do projeto.",
};

const defaultTable: RpgTable = {
  id: "mesa-principal",
  systemId: defaultSystem.id,
  name: "Mesa Principal",
  description: "Dados antigos preservados automaticamente.",
};

const initialData: RulebookData = {
  systems: [defaultSystem],
  tables: [defaultTable],
  activeTableId: defaultTable.id,
  activeSystemId: defaultSystem.id,
  rules: [],
  npcs: [],
  players: [],
};

const menuItems: MenuItem[] = [
  { id: "combate", label: "Combate", description: "Rodadas, iniciativa e turno", icon: Swords },
  { id: "testes", label: "Testes", description: "D20, dificuldade, vantagem e crítico", icon: ScrollText },
  { id: "atributos", label: "Atributos", description: "Escala e usos dos atributos", icon: ShieldAlert },
  { id: "defesa-dano", label: "Defesa e Dano", description: "Ataques, redução e contrajogo", icon: ShieldAlert },
  { id: "personagem", label: "Personagem", description: "Criação e raças jogáveis", icon: UserRound },
  { id: "progressao", label: "Progressão", description: "Evolução por raça e recursos", icon: BookOpen },
  { id: "habilidades", label: "Habilidades", description: "Escalas, custos e balanceamento", icon: WandSparkles },
  { id: "armaduras", label: "Armaduras", description: "Armaduras Kaiju e módulos", icon: FileText },
  { id: "regras-da-casa", label: "Regras da Casa", description: "Decisões próprias da mesa", icon: BookOpen },
];

const sheetCategories: SheetCategoryItem[] = [
  { id: "players", label: "Players", description: "Fichas dos jogadores" },
  { id: "criminosos", label: "Criminosos", description: "NPCs presos e inimigos simples" },
  { id: "policia-umck", label: "Polícia / UMCK", description: "Guardas, oficiais e agentes" },
  { id: "ameacas-pesadas", label: "Ameaças Pesadas", description: "Tanks, armaduras e mini-bosses" },
  { id: "simbiontes", label: "Simbiontes", description: "Organismos simbiontes e boss" },
];

function normalizePanelSizes(amount: number) {
  return amount <= 0 ? [] : Array.from({ length: amount }, () => 100 / amount);
}

function splitTextIntoList(value: string) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function labeledValuesToText(values: LabeledValue[]) {
  return values.map((item) => `${item.label}: ${item.value}`).join("\n");
}

function parseLabeledValues(value: string): LabeledValue[] {
  return splitTextIntoList(value).map((line) => {
    const [label, ...valueParts] = line.split(":");
    return {
      label: label?.trim() || "Campo",
      value: valueParts.join(":").trim() || "-",
    };
  });
}

function abilitiesToText(abilities: PlayerAbility[]) {
  return abilities
    .map((ability) =>
      [
        ability.name,
        ability.type,
        ability.scale,
        ability.cost,
        ability.test,
        ability.effect,
        ability.limit ?? "",
      ].join(" | ")
    )
    .join("\n");
}

function parseAbilities(value: string): PlayerAbility[] {
  return splitTextIntoList(value).map((line) => {
    const [name, type, scale, cost, test, effect, limit] = line
      .split("|")
      .map((part) => part.trim());

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

function firstRulePanel(rules: RuleArticle[]): OpenPanel[] {
  const firstRule = rules[0];
  return firstRule
    ? [{ id: `rule:${firstRule.id}`, type: "rule", refId: firstRule.id, title: firstRule.title }]
    : [];
}

function firstSheetPanel(players: PlayerSheet[], npcs: NpcSheet[]): OpenPanel[] {
  const firstPlayer = players[0];
  const firstNpc = npcs[0];

  if (firstPlayer) {
    return [
      {
        id: `player:${firstPlayer.id}`,
        type: "player",
        refId: firstPlayer.id,
        title: firstPlayer.characterName,
      },
    ];
  }

  if (firstNpc) {
    return [{ id: `npc:${firstNpc.id}`, type: "npc", refId: firstNpc.id, title: firstNpc.name }];
  }

  return [];
}

function normalizeRulebookData(data: Partial<RulebookData>, fallbackTableId?: string): RulebookData {
  const systems = data.systems?.length ? data.systems : [defaultSystem];
  const tables = data.tables?.length ? data.tables : [defaultTable];
  const activeTableId = data.activeTableId || fallbackTableId || tables[0]?.id || defaultTable.id;
  const activeTable = tables.find((table) => table.id === activeTableId) ?? tables[0] ?? defaultTable;

  return {
    systems,
    tables,
    activeTableId: activeTable.id,
    activeSystemId: data.activeSystemId || activeTable.systemId || systems[0]?.id || defaultSystem.id,
    rules: data.rules ?? [],
    npcs: data.npcs ?? [],
    players: data.players ?? [],
  };
}

export function SystemWorkspace() {
  const workspaceRef = useRef<HTMLDivElement | null>(null);
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("system");
  const [rulebookData, setRulebookData] = useState<RulebookData>(initialData);
  const [isLoading, setIsLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState("Carregando banco local...");
  const [systemPanels, setSystemPanels] = useState<OpenPanel[]>([]);
  const [sheetPanels, setSheetPanels] = useState<OpenPanel[]>([]);
  const [systemPanelSizes, setSystemPanelSizes] = useState<number[]>([]);
  const [sheetPanelSizes, setSheetPanelSizes] = useState<number[]>([]);

  const openPanels = activeTab === "system" ? systemPanels : sheetPanels;
  const panelSizes = activeTab === "system" ? systemPanelSizes : sheetPanelSizes;
  const activeTable =
    rulebookData.tables.find((table) => table.id === rulebookData.activeTableId) ??
    rulebookData.tables[0] ??
    defaultTable;
  const activeSystem =
    rulebookData.systems.find((system) => system.id === rulebookData.activeSystemId) ??
    rulebookData.systems.find((system) => system.id === activeTable.systemId) ??
    rulebookData.systems[0] ??
    defaultSystem;

  useEffect(() => {
    loadTable();
  }, []);

  const openedPanelIds = useMemo(() => new Set(openPanels.map((panel) => panel.id)), [openPanels]);

  function applyLoadedData(data: RulebookData) {
    setRulebookData(data);
    const nextSystemPanels = firstRulePanel(data.rules);
    const nextSheetPanels = firstSheetPanel(data.players, data.npcs);
    setSystemPanels(nextSystemPanels);
    setSheetPanels(nextSheetPanels);
    setSystemPanelSizes(normalizePanelSizes(nextSystemPanels.length));
    setSheetPanelSizes(normalizePanelSizes(nextSheetPanels.length));
  }

  async function loadTable(tableId?: string) {
    setIsLoading(true);
    setSaveStatus("Carregando mesa...");

    try {
      const query = tableId ? `?tableId=${encodeURIComponent(tableId)}` : "";
      const response = await fetch(`/api/rulebook${query}`, { cache: "no-store" });

      if (!response.ok) {
        throw new Error("Falha ao carregar o banco local.");
      }

      const data = normalizeRulebookData((await response.json()) as RulebookData, tableId);
      applyLoadedData(data);
      setSaveStatus("Banco local conectado");
    } catch {
      setSaveStatus("Erro ao carregar banco local");
    } finally {
      setIsLoading(false);
    }
  }

  async function persistData(nextData: RulebookData) {
    setRulebookData(nextData);
    setSaveStatus("Salvando no SQLite local...");

    try {
      const response = await fetch("/api/rulebook", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nextData),
      });

      if (!response.ok) {
        throw new Error("Não foi possível salvar no banco local.");
      }

      const savedData = normalizeRulebookData((await response.json()) as RulebookData, nextData.activeTableId);
      setRulebookData(savedData);
      setSaveStatus("Salvo no banco local");
    } catch {
      setSaveStatus("Erro ao salvar no banco local");
    }
  }

  function chooseSystemIdForNewTable() {
    const systems = rulebookData.systems.length ? rulebookData.systems : [defaultSystem];
    const options = systems.map((system, index) => `${index + 1} - ${system.name}`).join("\n");
    const answer = window.prompt(`Escolha qual sistema esta mesa vai usar:\n\n${options}`, "1");

    if (answer === null) {
      return null;
    }

    const selectedIndex = Number(answer) - 1;
    return systems[selectedIndex]?.id ?? systems[0]?.id ?? defaultSystem.id;
  }

  async function createNewTable() {
    const name = window.prompt("Nome da nova mesa:", "Nova mesa");

    if (!name?.trim()) {
      return;
    }

    const systemId = chooseSystemIdForNewTable();

    if (!systemId) {
      return;
    }

    const description = window.prompt("Descrição curta da mesa:", "Mesa criada para uma nova campanha.") ?? "";
    setSaveStatus("Criando nova mesa...");

    try {
      const response = await fetch("/api/rulebook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create-table", name, description, systemId }),
      });

      if (!response.ok) {
        throw new Error("Erro ao criar mesa.");
      }

      const data = normalizeRulebookData((await response.json()) as RulebookData);
      setActiveTab("system");
      applyLoadedData(data);
      setSaveStatus("Nova mesa criada sem fichas copiadas");
    } catch {
      setSaveStatus("Erro ao criar mesa");
    }
  }

  async function createNewSystem() {
    const name = window.prompt("Nome do novo sistema de RPG:", "Novo sistema");

    if (!name?.trim()) {
      return;
    }

    const description = window.prompt("Descrição curta do sistema:", "Sistema customizado para usar em diferentes mesas.") ?? "";
    setSaveStatus("Criando novo sistema...");

    try {
      const response = await fetch("/api/rulebook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create-system",
          name,
          description,
          tableId: rulebookData.activeTableId,
        }),
      });

      if (!response.ok) {
        throw new Error("Erro ao criar sistema.");
      }

      const data = normalizeRulebookData((await response.json()) as RulebookData, rulebookData.activeTableId);
      setRulebookData(data);
      setSaveStatus("Sistema criado; use Nova mesa para escolher ele");
    } catch {
      setSaveStatus("Erro ao criar sistema");
    }
  }

  function openRuleByCategory(category: RuleCategory) {
    const article = rulebookData.rules.find((item) => item.category === category);
    if (article) openRule(article.id);
  }

  function openRule(articleId: string) {
    const article = rulebookData.rules.find((item) => item.id === articleId);
    if (!article) return;
    addSystemPanel({ id: `rule:${article.id}`, type: "rule", refId: article.id, title: article.title });
  }

  function openPlayer(playerId: string) {
    const player = rulebookData.players.find((item) => item.id === playerId);
    if (!player) return;
    addSheetPanel({ id: `player:${player.id}`, type: "player", refId: player.id, title: player.characterName });
  }

  function openNpc(npcId: string) {
    const npc = rulebookData.npcs.find((item) => item.id === npcId);
    if (!npc) return;
    addSheetPanel({ id: `npc:${npc.id}`, type: "npc", refId: npc.id, title: npc.name });
  }

  function addSystemPanel(panelToOpen: OpenPanel) {
    setActiveTab("system");
    setSystemPanels((currentPanels) => {
      if (currentPanels.some((panel) => panel.id === panelToOpen.id)) return currentPanels;
      const nextPanels = [...currentPanels, panelToOpen].slice(-MAX_OPEN_PANELS);
      setSystemPanelSizes(normalizePanelSizes(nextPanels.length));
      return nextPanels;
    });
  }

  function addSheetPanel(panelToOpen: OpenPanel) {
    setActiveTab("sheets");
    setSheetPanels((currentPanels) => {
      if (currentPanels.some((panel) => panel.id === panelToOpen.id)) return currentPanels;
      const nextPanels = [...currentPanels, panelToOpen].slice(-MAX_OPEN_PANELS);
      setSheetPanelSizes(normalizePanelSizes(nextPanels.length));
      return nextPanels;
    });
  }

  function closePanel(panelId: string) {
    if (activeTab === "system") {
      setSystemPanels((currentPanels) => {
        if (currentPanels.length <= 1) return currentPanels;
        const nextPanels = currentPanels.filter((panel) => panel.id !== panelId);
        setSystemPanelSizes(normalizePanelSizes(nextPanels.length));
        return nextPanels;
      });
      return;
    }

    setSheetPanels((currentPanels) => {
      if (currentPanels.length <= 1) return currentPanels;
      const nextPanels = currentPanels.filter((panel) => panel.id !== panelId);
      setSheetPanelSizes(normalizePanelSizes(nextPanels.length));
      return nextPanels;
    });
  }

  function updateRule(updatedRule: RuleArticle) {
    const nextData = {
      ...rulebookData,
      rules: rulebookData.rules.map((rule) => (rule.id === updatedRule.id ? updatedRule : rule)),
    };

    setSystemPanels((currentPanels) =>
      currentPanels.map((panel) =>
        panel.type === "rule" && panel.refId === updatedRule.id
          ? { ...panel, title: updatedRule.title }
          : panel
      )
    );

    persistData(nextData);
  }

  function updateNpc(updatedNpc: NpcSheet) {
    const nextData = {
      ...rulebookData,
      npcs: rulebookData.npcs.map((npc) => (npc.id === updatedNpc.id ? updatedNpc : npc)),
    };

    setSheetPanels((currentPanels) =>
      currentPanels.map((panel) =>
        panel.type === "npc" && panel.refId === updatedNpc.id ? { ...panel, title: updatedNpc.name } : panel
      )
    );

    persistData(nextData);
  }

  function updatePlayer(updatedPlayer: PlayerSheet) {
    const nextData = {
      ...rulebookData,
      players: rulebookData.players.map((player) => (player.id === updatedPlayer.id ? updatedPlayer : player)),
    };

    setSheetPanels((currentPanels) =>
      currentPanels.map((panel) =>
        panel.type === "player" && panel.refId === updatedPlayer.id
          ? { ...panel, title: updatedPlayer.characterName }
          : panel
      )
    );

    persistData(nextData);
  }

  async function resetTableSheets() {
    const confirmed = window.confirm(
      `Deseja restaurar apenas as fichas da mesa "${activeTable.name}"? As regras do sistema e as outras mesas não serão alteradas.`
    );

    if (!confirmed) return;

    setSaveStatus("Restaurando fichas da mesa atual...");

    try {
      const response = await fetch("/api/rulebook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset-seed", tableId: rulebookData.activeTableId }),
      });

      if (!response.ok) throw new Error("Erro ao restaurar fichas.");

      const data = normalizeRulebookData((await response.json()) as RulebookData, rulebookData.activeTableId);
      applyLoadedData(data);
      setSaveStatus("Fichas da mesa restauradas");
    } catch {
      setSaveStatus("Erro ao restaurar fichas da mesa");
    }
  }

  function startResize(event: PointerEvent<HTMLDivElement>, dividerIndex: number) {
    event.preventDefault();
    const container = workspaceRef.current;
    if (!container) return;

    const startX = event.clientX;
    const startSizes = [...panelSizes];
    const containerWidth = container.getBoundingClientRect().width;
    const minPercent = Math.min(40, (PANEL_MIN_WIDTH / containerWidth) * 100);

    function handlePointerMove(pointerEvent: globalThis.PointerEvent) {
      const deltaPercent = ((pointerEvent.clientX - startX) / containerWidth) * 100;
      const leftStart = startSizes[dividerIndex];
      const rightStart = startSizes[dividerIndex + 1];
      const combinedSize = leftStart + rightStart;
      let nextLeftSize = leftStart + deltaPercent;
      let nextRightSize = rightStart - deltaPercent;

      if (nextLeftSize < minPercent) {
        nextLeftSize = minPercent;
        nextRightSize = combinedSize - minPercent;
      }

      if (nextRightSize < minPercent) {
        nextRightSize = minPercent;
        nextLeftSize = combinedSize - minPercent;
      }

      if (activeTab === "system") {
        setSystemPanelSizes((currentSizes) => {
          const nextSizes = [...currentSizes];
          nextSizes[dividerIndex] = nextLeftSize;
          nextSizes[dividerIndex + 1] = nextRightSize;
          return nextSizes;
        });
        return;
      }

      setSheetPanelSizes((currentSizes) => {
        const nextSizes = [...currentSizes];
        nextSizes[dividerIndex] = nextLeftSize;
        nextSizes[dividerIndex + 1] = nextRightSize;
        return nextSizes;
      });
    }

    function handlePointerUp() {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    }

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="grid min-h-16 grid-cols-[1fr_auto_1fr] items-center gap-4 border-b border-zinc-800 bg-zinc-950 px-6 py-3">
        <div>
          <h1 className="text-xl font-bold text-amber-400">Mesa do Mestre</h1>
          <p className="text-xs text-zinc-500">Mesa: {activeTable.name}</p>
          <p className="text-xs text-zinc-600">Sistema: {activeSystem.name}</p>
        </div>

        <div className="flex rounded-xl border border-zinc-800 bg-zinc-900 p-1">
          <TabButton active={activeTab === "system"} icon={BookOpen} label="Sistema" onClick={() => setActiveTab("system")} />
          <TabButton active={activeTab === "sheets"} icon={Users} label="Fichas" onClick={() => setActiveTab("sheets")} />
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          <select
            value={rulebookData.activeTableId}
            onChange={(event) => loadTable(event.target.value)}
            className="max-w-48 rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs text-zinc-200 outline-none transition hover:border-amber-500/60"
          >
            {rulebookData.tables.map((table) => (
              <option key={table.id} value={table.id}>
                {table.name}
              </option>
            ))}
          </select>

          <button onClick={createNewTable} className="top-action-button">
            <Plus className="h-3.5 w-3.5" />
            Nova mesa
          </button>

          <button onClick={createNewSystem} className="top-action-button">
            <BookOpen className="h-3.5 w-3.5" />
            Novo sistema
          </button>

          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/40 px-3 py-1 text-xs font-medium text-emerald-300">
            <Database className="h-3.5 w-3.5" />
            {isLoading ? "Carregando..." : saveStatus}
          </span>

          <button onClick={resetTableSheets} className="inline-flex items-center gap-2 rounded-md border border-zinc-700 px-3 py-2 text-xs text-zinc-300 transition hover:border-red-500/60 hover:text-red-300">
            <RotateCcw className="h-3.5 w-3.5" />
            Restaurar fichas
          </button>
        </div>
      </header>

      <div className="grid h-[calc(100vh-4rem)] grid-cols-[320px_1fr]">
        <aside className="overflow-y-auto border-r border-zinc-800 bg-zinc-900/70 p-4">
          {activeTab === "system" ? (
            <SystemSidebar rules={rulebookData.rules} openedPanelIds={openedPanelIds} onOpenRuleByCategory={openRuleByCategory} />
          ) : (
            <SheetsSidebar players={rulebookData.players} npcs={rulebookData.npcs} openedPanelIds={openedPanelIds} onOpenPlayer={openPlayer} onOpenNpc={openNpc} />
          )}
        </aside>

        <section className="overflow-hidden bg-zinc-950 p-4">
          <div ref={workspaceRef} className="flex h-full w-full overflow-x-auto">
            {openPanels.length === 0 ? (
              <EmptyPanel activeTab={activeTab} />
            ) : (
              openPanels.map((panel, index) => (
                <div key={panel.id} className="contents">
                  <div
                    className="h-full shrink-0"
                    style={{
                      flexBasis: `${panelSizes[index] ?? 100 / openPanels.length}%`,
                      flexGrow: 0,
                      flexShrink: 0,
                      minWidth: PANEL_MIN_WIDTH,
                    }}
                  >
                    <WorkspacePanel
                      panel={panel}
                      rules={rulebookData.rules}
                      npcs={rulebookData.npcs}
                      players={rulebookData.players}
                      canClose={openPanels.length > 1}
                      onClose={() => closePanel(panel.id)}
                      onOpenRule={openRule}
                      onUpdateRule={updateRule}
                      onUpdateNpc={updateNpc}
                      onUpdatePlayer={updatePlayer}
                    />
                  </div>

                  {index < openPanels.length - 1 && (
                    <div role="separator" aria-orientation="vertical" onPointerDown={(event) => startResize(event, index)} className="mx-2 h-full w-1 shrink-0 cursor-col-resize rounded-full bg-zinc-800 transition hover:bg-amber-500" />
                  )}
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function TabButton({ active, icon: Icon, label, onClick }: { active: boolean; icon: ElementType; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className={`inline-flex items-center gap-2 rounded-lg px-5 py-2 text-sm font-medium transition ${active ? "bg-amber-500 text-zinc-950" : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"}`}>
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}

function SystemSidebar({ rules, openedPanelIds, onOpenRuleByCategory }: { rules: RuleArticle[]; openedPanelIds: Set<string>; onOpenRuleByCategory: (category: RuleCategory) => void }) {
  return (
    <>
      <div className="mb-6 flex items-center gap-2 text-sm font-semibold text-zinc-300">
        <Home className="h-4 w-4 text-amber-400" />
        Sistema
      </div>

      <nav className="space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const article = rules.find((rule) => rule.category === item.id);
          const isOpen = article ? openedPanelIds.has(`rule:${article.id}`) : false;

          return (
            <button key={item.id} onClick={() => onOpenRuleByCategory(item.id)} className={`w-full rounded-lg border px-3 py-3 text-left transition ${isOpen ? "border-amber-500/50 bg-amber-500/10 text-amber-200" : "border-transparent text-zinc-300 hover:border-zinc-700 hover:bg-zinc-800/80 hover:text-amber-300"}`}>
              <span className="flex items-center gap-3 text-sm font-medium">
                <Icon className="h-4 w-4" />
                {item.label}
              </span>
              <span className="mt-1 block pl-7 text-xs text-zinc-500">{item.description}</span>
            </button>
          );
        })}
      </nav>

      <div className="mt-8 rounded-md border border-zinc-800 bg-zinc-950 p-3 text-xs text-zinc-400">
        <p className="font-semibold text-amber-300">Regras do sistema</p>
        <p className="mt-1">As regras pertencem ao sistema de RPG. Várias mesas podem usar o mesmo sistema.</p>
      </div>
    </>
  );
}

function SheetsSidebar({ players, npcs, openedPanelIds, onOpenPlayer, onOpenNpc }: { players: PlayerSheet[]; npcs: NpcSheet[]; openedPanelIds: Set<string>; onOpenPlayer: (playerId: string) => void; onOpenNpc: (npcId: string) => void }) {
  return (
    <>
      <div className="mb-6 flex items-center gap-2 text-sm font-semibold text-zinc-300">
        <Users className="h-4 w-4 text-amber-400" />
        Fichas da mesa
      </div>

      <div className="space-y-6">
        <SheetGroup title="Players" description="Fichas dos jogadores desta mesa">
          {players.length === 0 ? <EmptySidebarText>Nenhum player nesta mesa.</EmptySidebarText> : players.map((player) => (
            <SheetButton key={player.id} isOpen={openedPanelIds.has(`player:${player.id}`)} title={player.characterName} description={player.role} onClick={() => onOpenPlayer(player.id)} />
          ))}
        </SheetGroup>

        {sheetCategories
          .filter((category) => category.id !== "players")
          .map((category) => {
            const categoryNpcs = npcs.filter((npc) => npc.category === category.id);
            if (categoryNpcs.length === 0) return null;

            return (
              <SheetGroup key={category.id} title={category.label} description={category.description}>
                {categoryNpcs.map((npc) => (
                  <SheetButton key={npc.id} isOpen={openedPanelIds.has(`npc:${npc.id}`)} title={npc.name} description={npc.role} onClick={() => onOpenNpc(npc.id)} />
                ))}
              </SheetGroup>
            );
          })}
      </div>

      {players.length === 0 && npcs.length === 0 && (
        <div className="mt-8 rounded-md border border-zinc-800 bg-zinc-950 p-3 text-xs text-zinc-400">
          <p className="font-semibold text-amber-300">Mesa sem fichas</p>
          <p className="mt-1">Isso é esperado em mesas novas. Fichas não são copiadas de outras mesas.</p>
        </div>
      )}
    </>
  );
}

function EmptySidebarText({ children }: { children: ReactNode }) {
  return <p className="rounded-md border border-zinc-800 bg-zinc-950 p-3 text-xs text-zinc-500">{children}</p>;
}

function SheetGroup({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <section>
      <div className="mb-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{title}</p>
        <p className="text-xs text-zinc-600">{description}</p>
      </div>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

function SheetButton({ isOpen, title, description, onClick }: { isOpen: boolean; title: string; description: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className={`w-full rounded-md border p-3 text-left text-sm transition ${isOpen ? "border-amber-500/50 bg-amber-500/10" : "border-zinc-800 bg-zinc-950 hover:border-amber-500/40"}`}>
      <p className="font-medium text-zinc-200">{title}</p>
      <p className="line-clamp-2 text-xs text-zinc-500">{description}</p>
    </button>
  );
}

function EmptyPanel({ activeTab }: { activeTab: WorkspaceTab }) {
  return (
    <div className="flex h-full w-full items-center justify-center rounded-xl border border-dashed border-zinc-800 bg-zinc-900/30 px-6 text-center text-sm text-zinc-500">
      {activeTab === "system" ? "Nenhuma regra aberta neste sistema." : "Nenhuma ficha pertence a esta mesa ainda."}
    </div>
  );
}

function WorkspacePanel({ panel, rules, npcs, players, canClose, onClose, onOpenRule, onUpdateRule, onUpdateNpc, onUpdatePlayer }: { panel: OpenPanel; rules: RuleArticle[]; npcs: NpcSheet[]; players: PlayerSheet[]; canClose: boolean; onClose: () => void; onOpenRule: (articleId: string) => void; onUpdateRule: (rule: RuleArticle) => void; onUpdateNpc: (npc: NpcSheet) => void; onUpdatePlayer: (player: PlayerSheet) => void }) {
  if (panel.type === "rule") {
    const article = rules.find((item) => item.id === panel.refId);
    if (!article) return null;
    return <RulePanel article={article} relatedRules={rules.filter((item) => item.id !== article.id).slice(0, 4)} canClose={canClose} onClose={onClose} onOpenRule={onOpenRule} onUpdateRule={onUpdateRule} />;
  }

  if (panel.type === "player") {
    const player = players.find((item) => item.id === panel.refId);
    if (!player) return null;
    return <PlayerPanel player={player} canClose={canClose} onClose={onClose} onUpdatePlayer={onUpdatePlayer} />;
  }

  const npc = npcs.find((item) => item.id === panel.refId);
  if (!npc) return null;
  return <NpcPanel npc={npc} canClose={canClose} onClose={onClose} onUpdateNpc={onUpdateNpc} />;
}

function RulePanel({ article, relatedRules, canClose, onClose, onOpenRule, onUpdateRule }: { article: RuleArticle; relatedRules: RuleArticle[]; canClose: boolean; onClose: () => void; onOpenRule: (articleId: string) => void; onUpdateRule: (rule: RuleArticle) => void }) {
  const [isEditing, setIsEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState(article.title);
  const [draftSummary, setDraftSummary] = useState(article.summary);
  const [draftContent, setDraftContent] = useState(article.content);
  const [draftTags, setDraftTags] = useState(article.tags.join(", "));

  useEffect(() => {
    setDraftTitle(article.title);
    setDraftSummary(article.summary);
    setDraftContent(article.content);
    setDraftTags(article.tags.join(", "));
    setIsEditing(false);
  }, [article.id, article.title, article.summary, article.content, article.tags]);

  function saveChanges() {
    onUpdateRule({
      ...article,
      title: draftTitle.trim() || article.title,
      summary: draftSummary.trim(),
      content: draftContent.trim(),
      tags: draftTags.split(",").map((tag) => tag.trim()).filter(Boolean),
    });
    setIsEditing(false);
  }

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-100 shadow-2xl shadow-black/20">
      <header className="border-b border-zinc-800 p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            {isEditing ? <input value={draftTitle} onChange={(event) => setDraftTitle(event.target.value)} className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-lg font-semibold text-amber-300 outline-none focus:border-amber-500" /> : <h2 className="truncate text-lg font-semibold text-amber-300">{article.title}</h2>}
            {isEditing ? <textarea value={draftSummary} onChange={(event) => setDraftSummary(event.target.value)} rows={2} className="mt-2 w-full resize-none rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-300 outline-none focus:border-amber-500" /> : <p className="mt-1 text-sm text-zinc-400">{article.summary}</p>}
          </div>
          <PanelActions isEditing={isEditing} canClose={canClose} onEdit={() => setIsEditing(true)} onSave={saveChanges} onCancel={() => setIsEditing(false)} onClose={onClose} />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {isEditing ? <input value={draftTags} onChange={(event) => setDraftTags(event.target.value)} placeholder="tags separadas por vírgula" className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs text-zinc-300 outline-none focus:border-amber-500" /> : article.tags.map((tag) => <span key={tag} className="rounded-full bg-zinc-800 px-2.5 py-1 text-xs text-zinc-300">{tag}</span>)}
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto p-5">
        {isEditing ? <textarea value={draftContent} onChange={(event) => setDraftContent(event.target.value)} className="min-h-[420px] w-full resize-y rounded-lg border border-zinc-700 bg-zinc-950 p-4 text-sm leading-7 text-zinc-200 outline-none focus:border-amber-500" /> : <div className="space-y-4 text-sm leading-7 text-zinc-300">{article.content.split("\n\n").map((paragraph, index) => <p key={`${article.id}-${index}`}>{paragraph}</p>)}</div>}

        {!isEditing && relatedRules.length > 0 && (
          <div className="mt-8 rounded-lg border border-zinc-800 bg-zinc-950 p-4">
            <p className="mb-3 text-sm font-semibold text-amber-300">Regras relacionadas</p>
            <div className="flex flex-wrap gap-2">{relatedRules.map((related) => <button key={related.id} onClick={() => onOpenRule(related.id)} className="rounded-md border border-zinc-700 px-3 py-2 text-xs text-zinc-300 transition hover:border-amber-500/60 hover:text-amber-300">{related.title}</button>)}</div>
          </div>
        )}
      </div>
    </article>
  );
}

function PlayerPanel({ player, canClose, onClose, onUpdatePlayer }: { player: PlayerSheet; canClose: boolean; onClose: () => void; onUpdatePlayer: (player: PlayerSheet) => void }) {
  const [isEditing, setIsEditing] = useState(false);
  const [draftName, setDraftName] = useState(player.characterName);
  const [draftPlayerName, setDraftPlayerName] = useState(player.playerName);
  const [draftRole, setDraftRole] = useState(player.role);
  const [draftTier, setDraftTier] = useState(player.tier);
  const [draftConcept, setDraftConcept] = useState(player.concept);
  const [draftStatus, setDraftStatus] = useState(labeledValuesToText(player.status));
  const [draftAttributes, setDraftAttributes] = useState(labeledValuesToText(player.attributes));
  const [draftResources, setDraftResources] = useState(labeledValuesToText(player.resources));
  const [draftAbilities, setDraftAbilities] = useState(abilitiesToText(player.abilities));
  const [draftNotes, setDraftNotes] = useState(player.notes.join("\n"));

  useEffect(() => {
    setDraftName(player.characterName);
    setDraftPlayerName(player.playerName);
    setDraftRole(player.role);
    setDraftTier(player.tier);
    setDraftConcept(player.concept);
    setDraftStatus(labeledValuesToText(player.status));
    setDraftAttributes(labeledValuesToText(player.attributes));
    setDraftResources(labeledValuesToText(player.resources));
    setDraftAbilities(abilitiesToText(player.abilities));
    setDraftNotes(player.notes.join("\n"));
    setIsEditing(false);
  }, [player]);

  function saveChanges() {
    onUpdatePlayer({
      ...player,
      characterName: draftName.trim() || player.characterName,
      playerName: draftPlayerName.trim() || player.playerName,
      role: draftRole.trim(),
      tier: draftTier.trim(),
      concept: draftConcept.trim(),
      status: parseLabeledValues(draftStatus),
      attributes: parseLabeledValues(draftAttributes),
      resources: parseLabeledValues(draftResources),
      abilities: parseAbilities(draftAbilities),
      notes: splitTextIntoList(draftNotes),
    });
    setIsEditing(false);
  }

  return (
    <SheetPanelFrame title={player.characterName} subtitle={player.role} isEditing={isEditing} canClose={canClose} onEdit={() => setIsEditing(true)} onSave={saveChanges} onCancel={() => setIsEditing(false)} onClose={onClose}>
      {isEditing ? (
        <div className="space-y-4">
          <EditableInput label="Nome do personagem" value={draftName} onChange={setDraftName} />
          <EditableInput label="Nome do jogador" value={draftPlayerName} onChange={setDraftPlayerName} />
          <EditableInput label="Função" value={draftRole} onChange={setDraftRole} />
          <EditableInput label="Tier" value={draftTier} onChange={setDraftTier} />
          <EditableTextarea label="Conceito" value={draftConcept} onChange={setDraftConcept} rows={5} />
          <EditableTextarea label="Status, um por linha no formato Nome: Valor" value={draftStatus} onChange={setDraftStatus} rows={8} />
          <EditableTextarea label="Atributos, um por linha no formato Nome: Valor" value={draftAttributes} onChange={setDraftAttributes} rows={8} />
          <EditableTextarea label="Recursos, um por linha no formato Nome: Valor" value={draftResources} onChange={setDraftResources} rows={7} />
          <EditableTextarea label="Habilidades, uma por linha no formato Nome | Tipo | Escala | Custo | Teste | Efeito | Limite" value={draftAbilities} onChange={setDraftAbilities} rows={12} />
          <EditableTextarea label="Notas do mestre, uma por linha" value={draftNotes} onChange={setDraftNotes} rows={7} />
        </div>
      ) : (
        <SheetReadView typeLabel="Ficha de player" ownerLabel="Player" ownerValue={player.playerName} tier={player.tier} concept={player.concept} status={player.status} attributes={player.attributes} resourcesTitle="Recursos do mestre" resources={player.resources} abilities={player.abilities} notes={player.notes} />
      )}
    </SheetPanelFrame>
  );
}

function NpcPanel({ npc, canClose, onClose, onUpdateNpc }: { npc: NpcSheet; canClose: boolean; onClose: () => void; onUpdateNpc: (npc: NpcSheet) => void }) {
  const [isEditing, setIsEditing] = useState(false);
  const [draftName, setDraftName] = useState(npc.name);
  const [draftRole, setDraftRole] = useState(npc.role);
  const [draftDescription, setDraftDescription] = useState(npc.description);
  const [draftStats, setDraftStats] = useState(labeledValuesToText(npc.stats));
  const [draftNotes, setDraftNotes] = useState(npc.notes.join("\n"));

  useEffect(() => {
    setDraftName(npc.name);
    setDraftRole(npc.role);
    setDraftDescription(npc.description);
    setDraftStats(labeledValuesToText(npc.stats));
    setDraftNotes(npc.notes.join("\n"));
    setIsEditing(false);
  }, [npc]);

  function saveChanges() {
    onUpdateNpc({ ...npc, name: draftName.trim() || npc.name, role: draftRole.trim(), description: draftDescription.trim(), stats: parseLabeledValues(draftStats), notes: splitTextIntoList(draftNotes) });
    setIsEditing(false);
  }

  return (
    <SheetPanelFrame title={npc.name} subtitle={npc.role} isEditing={isEditing} canClose={canClose} onEdit={() => setIsEditing(true)} onSave={saveChanges} onCancel={() => setIsEditing(false)} onClose={onClose}>
      {isEditing ? (
        <div className="space-y-4">
          <EditableInput label="Nome" value={draftName} onChange={setDraftName} />
          <EditableInput label="Função" value={draftRole} onChange={setDraftRole} />
          <EditableTextarea label="Descrição" value={draftDescription} onChange={setDraftDescription} rows={5} />
          <EditableTextarea label="Status, um por linha no formato Nome: Valor" value={draftStats} onChange={setDraftStats} rows={12} />
          <EditableTextarea label="Notas e habilidades, uma por linha" value={draftNotes} onChange={setDraftNotes} rows={10} />
        </div>
      ) : (
        <SheetReadView typeLabel="Ficha de NPC" ownerLabel="Categoria" ownerValue={getSheetCategoryLabel(npc.category)} tier={npc.stats.find((item) => item.label === "Tier")?.value ?? "—"} concept={npc.description} status={npc.stats} attributes={npc.stats.filter((item) => ["For", "Con", "Des", "Int", "Sab", "Car"].includes(item.label))} resourcesTitle="Notas e habilidades" resources={[]} abilities={[]} notes={npc.notes} />
      )}
    </SheetPanelFrame>
  );
}

function getSheetCategoryLabel(category: SheetCategory) {
  return sheetCategories.find((item) => item.id === category)?.label ?? category;
}

function SheetPanelFrame({ title, subtitle, isEditing, canClose, onEdit, onSave, onCancel, onClose, children }: { title: string; subtitle: string; isEditing: boolean; canClose: boolean; onEdit: () => void; onSave: () => void; onCancel: () => void; onClose: () => void; children: ReactNode }) {
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-100 shadow-2xl shadow-black/20">
      <header className="border-b border-zinc-800 p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-lg font-semibold text-amber-300">{title}</h2>
            <p className="mt-1 text-sm text-zinc-400">{subtitle}</p>
          </div>
          <PanelActions isEditing={isEditing} canClose={canClose} onEdit={onEdit} onSave={onSave} onCancel={onCancel} onClose={onClose} />
        </div>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto p-5">{children}</div>
    </article>
  );
}

function SheetReadView({ typeLabel, ownerLabel, ownerValue, tier, concept, status, attributes, resourcesTitle, resources, abilities, notes }: { typeLabel: string; ownerLabel: string; ownerValue: string; tier: string; concept: string; status: LabeledValue[]; attributes: LabeledValue[]; resourcesTitle: string; resources: LabeledValue[]; abilities: PlayerAbility[]; notes: string[] }) {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-wide text-zinc-500">{typeLabel}</p>
        <p className="mt-3 text-xs uppercase tracking-wide text-zinc-500">{ownerLabel}</p>
        <p className="text-sm text-zinc-300">{ownerValue}</p>
        <p className="mt-3 text-xs uppercase tracking-wide text-zinc-500">Tier</p>
        <p className="text-sm text-zinc-300">{tier}</p>
      </div>

      <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4">
        <p className="mb-2 text-sm font-semibold text-amber-300">Conceito / descrição</p>
        <p className="text-sm leading-7 text-zinc-300">{concept}</p>
      </div>

      <LabeledGrid title="Status e combate" items={status} />
      {attributes.length > 0 && <LabeledGrid title="Atributos" items={attributes} />}
      {resources.length > 0 && <LabeledGrid title={resourcesTitle} items={resources} />}

      {abilities.length > 0 && (
        <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4">
          <p className="mb-3 text-sm font-semibold text-amber-300">Habilidades</p>
          <div className="space-y-4">
            {abilities.map((ability) => (
              <div key={ability.name} className="rounded-md border border-zinc-800 bg-zinc-900/70 p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-zinc-100">{ability.name}</p>
                  <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400">{ability.type}</span>
                  <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-xs text-amber-300">{ability.scale}</span>
                </div>
                <p className="mt-2 text-xs text-zinc-500">Custo: {ability.cost}</p>
                <p className="text-xs text-zinc-500">Teste: {ability.test}</p>
                <p className="mt-2 text-sm leading-6 text-zinc-300">{ability.effect}</p>
                {ability.limit && <p className="mt-2 text-xs leading-5 text-red-300/80">Limite: {ability.limit}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4">
        <p className="mb-3 text-sm font-semibold text-amber-300">{resourcesTitle}</p>
        <ul className="space-y-2 text-sm text-zinc-300">{notes.map((note) => <li key={note}>• {note}</li>)}</ul>
      </div>
    </div>
  );
}

function LabeledGrid({ title, items }: { title: string; items: LabeledValue[] }) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4">
      <p className="mb-3 text-sm font-semibold text-amber-300">{title}</p>
      <div className="grid grid-cols-2 gap-3">
        {items.map((item, index) => (
          <div key={`${title}-${item.label}-${index}`} className="rounded-md border border-zinc-800 bg-zinc-900/70 p-3">
            <p className="text-xs uppercase text-zinc-500">{item.label}</p>
            <p className="mt-1 text-sm font-semibold text-zinc-100">{item.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function EditableInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block text-xs font-semibold uppercase tracking-wide text-zinc-500">
      {label}
      <input value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-950 p-3 text-sm normal-case text-zinc-200 outline-none focus:border-amber-500" />
    </label>
  );
}

function EditableTextarea({ label, value, onChange, rows }: { label: string; value: string; onChange: (value: string) => void; rows: number }) {
  return (
    <label className="block text-xs font-semibold uppercase tracking-wide text-zinc-500">
      {label}
      <textarea value={value} onChange={(event) => onChange(event.target.value)} rows={rows} className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-950 p-4 text-sm normal-case leading-7 text-zinc-200 outline-none focus:border-amber-500" />
    </label>
  );
}

function PanelActions({ isEditing, canClose, onEdit, onSave, onCancel, onClose }: { isEditing: boolean; canClose: boolean; onEdit: () => void; onSave: () => void; onCancel: () => void; onClose: () => void }) {
  return (
    <div className="flex shrink-0 items-center gap-2">
      {isEditing ? (
        <>
          <button onClick={onSave} className="inline-flex items-center gap-2 rounded-md bg-amber-500 px-3 py-2 text-xs font-semibold text-zinc-950 transition hover:bg-amber-400"><Save className="h-3.5 w-3.5" />Salvar</button>
          <button onClick={onCancel} className="rounded-md border border-zinc-700 px-3 py-2 text-xs text-zinc-300 transition hover:border-zinc-500">Cancelar</button>
        </>
      ) : (
        <button onClick={onEdit} className="inline-flex items-center gap-2 rounded-md border border-zinc-700 px-3 py-2 text-xs text-zinc-300 transition hover:border-amber-500/60 hover:text-amber-300"><Edit3 className="h-3.5 w-3.5" />Editar</button>
      )}

      <button onClick={onClose} disabled={!canClose} title={canClose ? "Fechar painel" : "Mantenha pelo menos um painel aberto"} className="inline-flex h-8 w-8 items-center justify-center rounded-md text-zinc-400 transition hover:bg-zinc-800 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-zinc-400"><X className="h-4 w-4" /></button>
    </div>
  );
}
