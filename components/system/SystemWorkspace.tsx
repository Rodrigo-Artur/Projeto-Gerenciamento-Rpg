"use client";

import {
  BookOpen,
  Database,
  Edit3,
  FileText,
  Home,
  RotateCcw,
  Save,
  ScrollText,
  ShieldAlert,
  Swords,
  UserRound,
  WandSparkles,
  X,
} from "lucide-react";
import type { ElementType, PointerEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";

import {
  initialNpcSheets,
  initialPlayerSheets,
  initialRuleArticles,
} from "@/data/systemRules";
import type {
  LabeledValue,
  NpcSheet,
  OpenPanel,
  PlayerAbility,
  PlayerSheet,
  RuleArticle,
  RuleCategory,
  RulebookData,
} from "@/types/rulebook";

type MenuItem = {
  id: RuleCategory;
  label: string;
  description: string;
  icon: ElementType;
};

const PANEL_MIN_WIDTH = 320;
const MAX_OPEN_PANELS = 4;

const initialData: RulebookData = {
  rules: initialRuleArticles,
  npcs: initialNpcSheets,
  players: initialPlayerSheets,
};

const menuItems: MenuItem[] = [
  {
    id: "combate",
    label: "Combate",
    description: "Rodadas, iniciativa e turno",
    icon: Swords,
  },
  {
    id: "testes",
    label: "Testes",
    description: "D20, dificuldade, vantagem e crítico",
    icon: ScrollText,
  },
  {
    id: "atributos",
    label: "Atributos",
    description: "Escala e usos dos atributos",
    icon: ShieldAlert,
  },
  {
    id: "defesa-dano",
    label: "Defesa e Dano",
    description: "Ataques, redução e contrajogo",
    icon: ShieldAlert,
  },
  {
    id: "personagem",
    label: "Personagem",
    description: "Criação e raças jogáveis",
    icon: UserRound,
  },
  {
    id: "progressao",
    label: "Progressão",
    description: "Evolução por raça e recursos",
    icon: BookOpen,
  },
  {
    id: "habilidades",
    label: "Habilidades",
    description: "Escalas, custos e balanceamento",
    icon: WandSparkles,
  },
  {
    id: "armaduras",
    label: "Armaduras",
    description: "Armaduras Kaiju e módulos",
    icon: FileText,
  },
  {
    id: "regras-da-casa",
    label: "Regras da Casa",
    description: "Decisões próprias da mesa",
    icon: BookOpen,
  },
];

function normalizePanelSizes(amount: number) {
  if (amount <= 0) {
    return [];
  }

  return Array.from({ length: amount }, () => 100 / amount);
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

export function SystemWorkspace() {
  const workspaceRef = useRef<HTMLDivElement | null>(null);
  const [rulebookData, setRulebookData] = useState<RulebookData>(initialData);
  const [isLoading, setIsLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState("Carregando banco local...");
  const [openPanels, setOpenPanels] = useState<OpenPanel[]>([
    {
      id: "rule:combate-rodadas",
      type: "rule",
      refId: "combate-rodadas",
      title: "Combate: rodadas, iniciativa e turno",
    },
  ]);
  const [panelSizes, setPanelSizes] = useState<number[]>([100]);

  useEffect(() => {
    let isMounted = true;

    async function loadDatabase() {
      try {
        const response = await fetch("/api/rulebook", {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Falha ao carregar o banco local.");
        }

        const data = (await response.json()) as RulebookData;

        if (isMounted) {
          setRulebookData({
            rules: data.rules ?? [],
            npcs: data.npcs ?? [],
            players: data.players ?? [],
          });
          setSaveStatus("Banco local conectado");
        }
      } catch {
        if (isMounted) {
          setSaveStatus("Usando dados iniciais; verifique o servidor/API local");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadDatabase();

    return () => {
      isMounted = false;
    };
  }, []);

  const openedPanelIds = useMemo(
    () => new Set(openPanels.map((panel) => panel.id)),
    [openPanels]
  );

  async function persistData(nextData: RulebookData) {
    setRulebookData(nextData);
    setSaveStatus("Salvando no SQLite local...");

    try {
      const response = await fetch("/api/rulebook", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(nextData),
      });

      if (!response.ok) {
        throw new Error("Não foi possível salvar no banco local.");
      }

      const savedData = (await response.json()) as RulebookData;
      setRulebookData({
        rules: savedData.rules ?? nextData.rules,
        npcs: savedData.npcs ?? nextData.npcs,
        players: savedData.players ?? nextData.players,
      });
      setSaveStatus("Salvo no banco local");
    } catch {
      setSaveStatus("Erro ao salvar no banco local");
    }
  }

  function openRuleByCategory(category: RuleCategory) {
    const article = rulebookData.rules.find((item) => item.category === category);

    if (!article) {
      return;
    }

    openRule(article.id);
  }

  function openRule(articleId: string) {
    const article = rulebookData.rules.find((item) => item.id === articleId);

    if (!article) {
      return;
    }

    addPanel({
      id: `rule:${article.id}`,
      type: "rule",
      refId: article.id,
      title: article.title,
    });
  }

  function openPlayer(playerId: string) {
    const player = rulebookData.players.find((item) => item.id === playerId);

    if (!player) {
      return;
    }

    addPanel({
      id: `player:${player.id}`,
      type: "player",
      refId: player.id,
      title: player.characterName,
    });
  }

  function openNpc(npcId: string) {
    const npc = rulebookData.npcs.find((item) => item.id === npcId);

    if (!npc) {
      return;
    }

    addPanel({
      id: `npc:${npc.id}`,
      type: "npc",
      refId: npc.id,
      title: npc.name,
    });
  }

  function addPanel(panelToOpen: OpenPanel) {
    setOpenPanels((currentPanels) => {
      if (currentPanels.some((panel) => panel.id === panelToOpen.id)) {
        return currentPanels;
      }

      const nextPanels = [...currentPanels, panelToOpen].slice(-MAX_OPEN_PANELS);
      setPanelSizes(normalizePanelSizes(nextPanels.length));
      return nextPanels;
    });
  }

  function closePanel(panelId: string) {
    setOpenPanels((currentPanels) => {
      if (currentPanels.length === 1) {
        return currentPanels;
      }

      const nextPanels = currentPanels.filter((panel) => panel.id !== panelId);
      setPanelSizes(normalizePanelSizes(nextPanels.length));
      return nextPanels;
    });
  }

  function updateRule(updatedRule: RuleArticle) {
    const nextData = {
      ...rulebookData,
      rules: rulebookData.rules.map((rule) =>
        rule.id === updatedRule.id ? updatedRule : rule
      ),
    };

    setOpenPanels((currentPanels) =>
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
      npcs: rulebookData.npcs.map((npc) =>
        npc.id === updatedNpc.id ? updatedNpc : npc
      ),
    };

    setOpenPanels((currentPanels) =>
      currentPanels.map((panel) =>
        panel.type === "npc" && panel.refId === updatedNpc.id
          ? { ...panel, title: updatedNpc.name }
          : panel
      )
    );

    persistData(nextData);
  }

  function updatePlayer(updatedPlayer: PlayerSheet) {
    const nextData = {
      ...rulebookData,
      players: rulebookData.players.map((player) =>
        player.id === updatedPlayer.id ? updatedPlayer : player
      ),
    };

    setOpenPanels((currentPanels) =>
      currentPanels.map((panel) =>
        panel.type === "player" && panel.refId === updatedPlayer.id
          ? { ...panel, title: updatedPlayer.characterName }
          : panel
      )
    );

    persistData(nextData);
  }

  async function resetAllContent() {
    const confirmed = window.confirm(
      "Deseja restaurar os inserts iniciais do Kaiju RPG? Suas edições atuais no banco local serão substituídas."
    );

    if (!confirmed) {
      return;
    }

    setSaveStatus("Restaurando inserts iniciais...");

    try {
      const response = await fetch("/api/rulebook", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "reset-seed" }),
      });

      if (!response.ok) {
        throw new Error("Erro ao restaurar seed.");
      }

      const data = (await response.json()) as RulebookData;
      setRulebookData({
        rules: data.rules ?? [],
        npcs: data.npcs ?? [],
        players: data.players ?? [],
      });
      setOpenPanels([
        {
          id: "rule:combate-rodadas",
          type: "rule",
          refId: "combate-rodadas",
          title: "Combate: rodadas, iniciativa e turno",
        },
      ]);
      setPanelSizes([100]);
      setSaveStatus("Inserts iniciais restaurados");
    } catch {
      setSaveStatus("Erro ao restaurar inserts iniciais");
    }
  }

  function startResize(event: PointerEvent<HTMLDivElement>, dividerIndex: number) {
    event.preventDefault();

    const container = workspaceRef.current;

    if (!container) {
      return;
    }

    const startX = event.clientX;
    const startSizes = [...panelSizes];
    const containerWidth = container.getBoundingClientRect().width;
    const minPercent = Math.min(40, (PANEL_MIN_WIDTH / containerWidth) * 100);

    function handlePointerMove(pointerEvent: globalThis.PointerEvent) {
      const deltaX = pointerEvent.clientX - startX;
      const deltaPercent = (deltaX / containerWidth) * 100;
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

      setPanelSizes((currentSizes) => {
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
      <header className="flex h-16 items-center justify-between border-b border-zinc-800 bg-zinc-950 px-6">
        <div>
          <h1 className="text-xl font-bold text-amber-400">Mesa do Mestre</h1>
          <p className="text-xs text-zinc-500">
            Biblioteca editável do Kaiju RPG com banco SQLite local
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/40 px-3 py-1 text-xs font-medium text-emerald-300">
            <Database className="h-3.5 w-3.5" />
            {isLoading ? "Carregando..." : saveStatus}
          </span>
          <button
            onClick={resetAllContent}
            className="inline-flex items-center gap-2 rounded-md border border-zinc-700 px-3 py-2 text-xs text-zinc-300 transition hover:border-red-500/60 hover:text-red-300"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Restaurar inserts
          </button>
        </div>
      </header>

      <div className="grid h-[calc(100vh-4rem)] grid-cols-[320px_1fr]">
        <aside className="border-r border-zinc-800 bg-zinc-900/70 p-4">
          <div className="mb-6 flex items-center gap-2 text-sm font-semibold text-zinc-300">
            <Home className="h-4 w-4 text-amber-400" />
            Biblioteca do Sistema
          </div>

          <nav className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const article = rulebookData.rules.find((rule) => rule.category === item.id);
              const isOpen = article ? openedPanelIds.has(`rule:${article.id}`) : false;

              return (
                <button
                  key={item.id}
                  onClick={() => openRuleByCategory(item.id)}
                  className={`w-full rounded-lg border px-3 py-3 text-left transition ${
                    isOpen
                      ? "border-amber-500/50 bg-amber-500/10 text-amber-200"
                      : "border-transparent text-zinc-300 hover:border-zinc-700 hover:bg-zinc-800/80 hover:text-amber-300"
                  }`}
                >
                  <span className="flex items-center gap-3 text-sm font-medium">
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </span>
                  <span className="mt-1 block pl-7 text-xs text-zinc-500">{item.description}</span>
                </button>
              );
            })}
          </nav>

          <div className="mt-8">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Fichas de players
            </p>

            {rulebookData.players.map((player) => {
              const isOpen = openedPanelIds.has(`player:${player.id}`);

              return (
                <button
                  key={player.id}
                  onClick={() => openPlayer(player.id)}
                  className={`mb-2 w-full rounded-md border p-3 text-left text-sm transition ${
                    isOpen
                      ? "border-amber-500/50 bg-amber-500/10"
                      : "border-zinc-800 bg-zinc-950 hover:border-amber-500/40"
                  }`}
                >
                  <p className="font-medium text-zinc-200">{player.characterName}</p>
                  <p className="text-xs text-zinc-500">{player.role}</p>
                </button>
              );
            })}
          </div>

          {rulebookData.npcs.length > 0 && (
            <div className="mt-8">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Fichas rápidas de NPC
              </p>

              {rulebookData.npcs.map((npc) => (
                <button
                  key={npc.id}
                  onClick={() => openNpc(npc.id)}
                  className="mb-2 w-full rounded-md border border-zinc-800 bg-zinc-950 p-3 text-left text-sm transition hover:border-amber-500/40"
                >
                  <p className="font-medium text-zinc-200">{npc.name}</p>
                  <p className="text-xs text-zinc-500">{npc.role}</p>
                </button>
              ))}
            </div>
          )}

          <div className="mt-8 rounded-md border border-zinc-800 bg-zinc-950 p-3 text-xs text-zinc-400">
            <p className="font-semibold text-amber-300">Como usar</p>
            <p className="mt-1">
              Abra uma regra e a ficha de Erick ao mesmo tempo. Arraste o divisor para ajustar o tamanho e use Editar para salvar no banco local.
            </p>
          </div>
        </aside>

        <section className="overflow-hidden bg-zinc-950 p-4">
          <div ref={workspaceRef} className="flex h-full w-full overflow-x-auto">
            {openPanels.map((panel, index) => (
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
                  <div
                    role="separator"
                    aria-orientation="vertical"
                    onPointerDown={(event) => startResize(event, index)}
                    className="mx-2 h-full w-1 shrink-0 cursor-col-resize rounded-full bg-zinc-800 transition hover:bg-amber-500"
                  />
                )}
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

function WorkspacePanel({
  panel,
  rules,
  npcs,
  players,
  canClose,
  onClose,
  onOpenRule,
  onUpdateRule,
  onUpdateNpc,
  onUpdatePlayer,
}: {
  panel: OpenPanel;
  rules: RuleArticle[];
  npcs: NpcSheet[];
  players: PlayerSheet[];
  canClose: boolean;
  onClose: () => void;
  onOpenRule: (articleId: string) => void;
  onUpdateRule: (rule: RuleArticle) => void;
  onUpdateNpc: (npc: NpcSheet) => void;
  onUpdatePlayer: (player: PlayerSheet) => void;
}) {
  if (panel.type === "rule") {
    const article = rules.find((item) => item.id === panel.refId);

    if (!article) {
      return null;
    }

    return (
      <RulePanel
        article={article}
        relatedRules={rules.filter((item) => item.id !== article.id).slice(0, 4)}
        canClose={canClose}
        onClose={onClose}
        onOpenRule={onOpenRule}
        onUpdateRule={onUpdateRule}
      />
    );
  }

  if (panel.type === "player") {
    const player = players.find((item) => item.id === panel.refId);

    if (!player) {
      return null;
    }

    return (
      <PlayerPanel
        player={player}
        canClose={canClose}
        onClose={onClose}
        onUpdatePlayer={onUpdatePlayer}
      />
    );
  }

  const npc = npcs.find((item) => item.id === panel.refId);

  if (!npc) {
    return null;
  }

  return <NpcPanel npc={npc} canClose={canClose} onClose={onClose} onUpdateNpc={onUpdateNpc} />;
}

function RulePanel({
  article,
  relatedRules,
  canClose,
  onClose,
  onOpenRule,
  onUpdateRule,
}: {
  article: RuleArticle;
  relatedRules: RuleArticle[];
  canClose: boolean;
  onClose: () => void;
  onOpenRule: (articleId: string) => void;
  onUpdateRule: (rule: RuleArticle) => void;
}) {
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
      tags: draftTags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
    });

    setIsEditing(false);
  }

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-100 shadow-2xl shadow-black/20">
      <header className="border-b border-zinc-800 p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            {isEditing ? (
              <input
                value={draftTitle}
                onChange={(event) => setDraftTitle(event.target.value)}
                className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-lg font-semibold text-amber-300 outline-none focus:border-amber-500"
              />
            ) : (
              <h2 className="truncate text-lg font-semibold text-amber-300">{article.title}</h2>
            )}

            {isEditing ? (
              <textarea
                value={draftSummary}
                onChange={(event) => setDraftSummary(event.target.value)}
                rows={2}
                className="mt-2 w-full resize-none rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-300 outline-none focus:border-amber-500"
              />
            ) : (
              <p className="mt-1 text-sm text-zinc-400">{article.summary}</p>
            )}
          </div>

          <PanelActions
            isEditing={isEditing}
            canClose={canClose}
            onEdit={() => setIsEditing(true)}
            onSave={saveChanges}
            onCancel={() => setIsEditing(false)}
            onClose={onClose}
          />
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {isEditing ? (
            <input
              value={draftTags}
              onChange={(event) => setDraftTags(event.target.value)}
              placeholder="tags separadas por vírgula"
              className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs text-zinc-300 outline-none focus:border-amber-500"
            />
          ) : (
            article.tags.map((tag) => (
              <span key={tag} className="rounded-full bg-zinc-800 px-2.5 py-1 text-xs text-zinc-300">
                {tag}
              </span>
            ))
          )}
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto p-5">
        {isEditing ? (
          <textarea
            value={draftContent}
            onChange={(event) => setDraftContent(event.target.value)}
            className="min-h-[420px] w-full resize-y rounded-lg border border-zinc-700 bg-zinc-950 p-4 text-sm leading-7 text-zinc-200 outline-none focus:border-amber-500"
          />
        ) : (
          <div className="space-y-4 text-sm leading-7 text-zinc-300">
            {article.content.split("\n\n").map((paragraph, index) => (
              <p key={`${article.id}-${index}`}>{paragraph}</p>
            ))}
          </div>
        )}

        {!isEditing && relatedRules.length > 0 && (
          <div className="mt-8 rounded-lg border border-zinc-800 bg-zinc-950 p-4">
            <p className="mb-3 text-sm font-semibold text-amber-300">Regras relacionadas</p>
            <div className="flex flex-wrap gap-2">
              {relatedRules.map((related) => (
                <button
                  key={related.id}
                  onClick={() => onOpenRule(related.id)}
                  className="rounded-md border border-zinc-700 px-3 py-2 text-xs text-zinc-300 transition hover:border-amber-500/60 hover:text-amber-300"
                >
                  {related.title}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </article>
  );
}

function PlayerPanel({
  player,
  canClose,
  onClose,
  onUpdatePlayer,
}: {
  player: PlayerSheet;
  canClose: boolean;
  onClose: () => void;
  onUpdatePlayer: (player: PlayerSheet) => void;
}) {
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
    <article className="flex h-full flex-col overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-100 shadow-2xl shadow-black/20">
      <header className="border-b border-zinc-800 p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            {isEditing ? (
              <input
                value={draftName}
                onChange={(event) => setDraftName(event.target.value)}
                className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-lg font-semibold text-amber-300 outline-none focus:border-amber-500"
              />
            ) : (
              <h2 className="truncate text-lg font-semibold text-amber-300">{player.characterName}</h2>
            )}

            {isEditing ? (
              <input
                value={draftRole}
                onChange={(event) => setDraftRole(event.target.value)}
                className="mt-2 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-300 outline-none focus:border-amber-500"
              />
            ) : (
              <p className="mt-1 text-sm text-zinc-400">{player.role}</p>
            )}
          </div>

          <PanelActions
            isEditing={isEditing}
            canClose={canClose}
            onEdit={() => setIsEditing(true)}
            onSave={saveChanges}
            onCancel={() => setIsEditing(false)}
            onClose={onClose}
          />
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto p-5">
        {isEditing ? (
          <div className="space-y-4">
            <EditableInput label="Nome do jogador" value={draftPlayerName} onChange={setDraftPlayerName} />
            <EditableInput label="Tier" value={draftTier} onChange={setDraftTier} />
            <EditableTextarea label="Conceito" value={draftConcept} onChange={setDraftConcept} rows={5} />
            <EditableTextarea label="Status, um por linha no formato Nome: Valor" value={draftStatus} onChange={setDraftStatus} rows={8} />
            <EditableTextarea label="Atributos, um por linha no formato Nome: Valor" value={draftAttributes} onChange={setDraftAttributes} rows={8} />
            <EditableTextarea label="Recursos, um por linha no formato Nome: Valor" value={draftResources} onChange={setDraftResources} rows={7} />
            <EditableTextarea
              label="Habilidades, uma por linha no formato Nome | Tipo | Escala | Custo | Teste | Efeito | Limite"
              value={draftAbilities}
              onChange={setDraftAbilities}
              rows={12}
            />
            <EditableTextarea label="Notas do mestre, uma por linha" value={draftNotes} onChange={setDraftNotes} rows={7} />
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <p className="text-xs uppercase tracking-wide text-zinc-500">Player</p>
              <p className="text-sm text-zinc-300">{player.playerName}</p>
              <p className="mt-3 text-xs uppercase tracking-wide text-zinc-500">Tier</p>
              <p className="text-sm text-zinc-300">{player.tier}</p>
            </div>

            <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4">
              <p className="mb-2 text-sm font-semibold text-amber-300">Conceito</p>
              <p className="text-sm leading-7 text-zinc-300">{player.concept}</p>
            </div>

            <LabeledGrid title="Status" items={player.status} />
            <LabeledGrid title="Atributos" items={player.attributes} />
            <LabeledGrid title="Recursos do mestre" items={player.resources} />

            <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4">
              <p className="mb-3 text-sm font-semibold text-amber-300">Habilidades</p>
              <div className="space-y-4">
                {player.abilities.map((ability) => (
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

            <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4">
              <p className="mb-3 text-sm font-semibold text-amber-300">Notas do mestre</p>
              <ul className="space-y-2 text-sm text-zinc-300">
                {player.notes.map((note) => (
                  <li key={note}>• {note}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </article>
  );
}

function NpcPanel({
  npc,
  canClose,
  onClose,
  onUpdateNpc,
}: {
  npc: NpcSheet;
  canClose: boolean;
  onClose: () => void;
  onUpdateNpc: (npc: NpcSheet) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [draftName, setDraftName] = useState(npc.name);
  const [draftRole, setDraftRole] = useState(npc.role);
  const [draftDescription, setDraftDescription] = useState(npc.description);
  const [draftStats, setDraftStats] = useState(labeledValuesToText(npc.stats));
  const [draftNotes, setDraftNotes] = useState(npc.notes.join("\n"));

  function saveChanges() {
    onUpdateNpc({
      ...npc,
      name: draftName.trim() || npc.name,
      role: draftRole.trim(),
      description: draftDescription.trim(),
      stats: parseLabeledValues(draftStats),
      notes: splitTextIntoList(draftNotes),
    });

    setIsEditing(false);
  }

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-100">
      <header className="border-b border-zinc-800 p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-lg font-semibold text-amber-300">{npc.name}</h2>
            <p className="mt-1 text-sm text-zinc-400">{npc.role}</p>
          </div>
          <PanelActions
            isEditing={isEditing}
            canClose={canClose}
            onEdit={() => setIsEditing(true)}
            onSave={saveChanges}
            onCancel={() => setIsEditing(false)}
            onClose={onClose}
          />
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto p-5">
        {isEditing ? (
          <div className="space-y-4">
            <EditableInput label="Nome" value={draftName} onChange={setDraftName} />
            <EditableInput label="Função" value={draftRole} onChange={setDraftRole} />
            <EditableTextarea label="Descrição" value={draftDescription} onChange={setDraftDescription} rows={5} />
            <EditableTextarea label="Status" value={draftStats} onChange={setDraftStats} rows={6} />
            <EditableTextarea label="Notas" value={draftNotes} onChange={setDraftNotes} rows={6} />
          </div>
        ) : (
          <div className="space-y-5">
            <p className="text-sm leading-7 text-zinc-300">{npc.description}</p>
            <LabeledGrid title="Status" items={npc.stats} />
          </div>
        )}
      </div>
    </article>
  );
}

function LabeledGrid({ title, items }: { title: string; items: LabeledValue[] }) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4">
      <p className="mb-3 text-sm font-semibold text-amber-300">{title}</p>
      <div className="grid grid-cols-2 gap-3">
        {items.map((item) => (
          <div key={`${title}-${item.label}`} className="rounded-md border border-zinc-800 bg-zinc-900/70 p-3">
            <p className="text-xs uppercase text-zinc-500">{item.label}</p>
            <p className="mt-1 text-sm font-semibold text-zinc-100">{item.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function EditableInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block text-xs font-semibold uppercase tracking-wide text-zinc-500">
      {label}
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-950 p-3 text-sm normal-case text-zinc-200 outline-none focus:border-amber-500"
      />
    </label>
  );
}

function EditableTextarea({
  label,
  value,
  onChange,
  rows,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows: number;
}) {
  return (
    <label className="block text-xs font-semibold uppercase tracking-wide text-zinc-500">
      {label}
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={rows}
        className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-950 p-4 text-sm normal-case leading-7 text-zinc-200 outline-none focus:border-amber-500"
      />
    </label>
  );
}

function PanelActions({
  isEditing,
  canClose,
  onEdit,
  onSave,
  onCancel,
  onClose,
}: {
  isEditing: boolean;
  canClose: boolean;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  onClose: () => void;
}) {
  return (
    <div className="flex shrink-0 items-center gap-2">
      {isEditing ? (
        <>
          <button
            onClick={onSave}
            className="inline-flex items-center gap-2 rounded-md bg-amber-500 px-3 py-2 text-xs font-semibold text-zinc-950 transition hover:bg-amber-400"
          >
            <Save className="h-3.5 w-3.5" />
            Salvar
          </button>
          <button
            onClick={onCancel}
            className="rounded-md border border-zinc-700 px-3 py-2 text-xs text-zinc-300 transition hover:border-zinc-500"
          >
            Cancelar
          </button>
        </>
      ) : (
        <button
          onClick={onEdit}
          className="inline-flex items-center gap-2 rounded-md border border-zinc-700 px-3 py-2 text-xs text-zinc-300 transition hover:border-amber-500/60 hover:text-amber-300"
        >
          <Edit3 className="h-3.5 w-3.5" />
          Editar
        </button>
      )}

      <button
        onClick={onClose}
        disabled={!canClose}
        title={canClose ? "Fechar painel" : "Mantenha pelo menos um painel aberto"}
        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-zinc-400 transition hover:bg-zinc-800 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-zinc-400"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
