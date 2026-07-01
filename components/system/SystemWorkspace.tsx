"use client";

import {
  BookOpen,
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
import type { CSSProperties, ElementType, PointerEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";

import { initialNpcSheets, initialRuleArticles } from "@/data/systemRules";
import type { NpcSheet, OpenPanel, RuleArticle, RuleCategory } from "@/types/rulebook";

type StoredRulebook = {
  rules: RuleArticle[];
  npcs: NpcSheet[];
};

type MenuItem = {
  id: RuleCategory;
  label: string;
  description: string;
  icon: ElementType;
};

const STORAGE_KEY = "mesa-do-mestre:rulebook:v1";
const PANEL_MIN_WIDTH = 320;
const MAX_OPEN_PANELS = 4;

const menuItems: MenuItem[] = [
  {
    id: "combate",
    label: "Combate",
    description: "Rodadas, ações e resolução de ataques",
    icon: Swords,
  },
  {
    id: "testes",
    label: "Testes",
    description: "Atributos, perícias e dificuldades",
    icon: ScrollText,
  },
  {
    id: "condicoes",
    label: "Condições",
    description: "Estados, efeitos e duração",
    icon: ShieldAlert,
  },
  {
    id: "personagem",
    label: "Personagem",
    description: "Criação e evolução de fichas",
    icon: UserRound,
  },
  {
    id: "equipamentos",
    label: "Equipamentos",
    description: "Itens, inventário e recompensas",
    icon: FileText,
  },
  {
    id: "magias",
    label: "Magias / Poderes",
    description: "Custos, efeitos e limitações",
    icon: WandSparkles,
  },
  {
    id: "regras-da-casa",
    label: "Regras da Casa",
    description: "Ajustes próprios da mesa",
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

function listToEditableText(values: string[]) {
  return values.join("\n");
}

export function SystemWorkspace() {
  const workspaceRef = useRef<HTMLDivElement | null>(null);
  const [rules, setRules] = useState<RuleArticle[]>(initialRuleArticles);
  const [npcs, setNpcs] = useState<NpcSheet[]>(initialNpcSheets);
  const [hasLoadedStorage, setHasLoadedStorage] = useState(false);
  const [openPanels, setOpenPanels] = useState<OpenPanel[]>([
    {
      id: "rule:combate",
      type: "rule",
      refId: "combate",
      title: "Como funciona o combate",
    },
  ]);
  const [panelSizes, setPanelSizes] = useState<number[]>([100]);

  useEffect(() => {
    const rawData = window.localStorage.getItem(STORAGE_KEY);

    if (rawData) {
      try {
        const parsedData = JSON.parse(rawData) as StoredRulebook;

        if (Array.isArray(parsedData.rules)) {
          setRules(parsedData.rules);
        }

        if (Array.isArray(parsedData.npcs)) {
          setNpcs(parsedData.npcs);
        }
      } catch {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    }

    setHasLoadedStorage(true);
  }, []);

  useEffect(() => {
    if (!hasLoadedStorage) {
      return;
    }

    const dataToStore: StoredRulebook = {
      rules,
      npcs,
    };

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToStore));
  }, [hasLoadedStorage, rules, npcs]);

  const openedPanelIds = useMemo(() => new Set(openPanels.map((panel) => panel.id)), [openPanels]);

  function openRuleByCategory(category: RuleCategory) {
    const article = rules.find((item) => item.category === category);

    if (!article) {
      return;
    }

    openRule(article.id);
  }

  function openRule(articleId: string) {
    const article = rules.find((item) => item.id === articleId);

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

  function openNpc(npcId: string) {
    const npc = npcs.find((item) => item.id === npcId);

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
    setRules((currentRules) =>
      currentRules.map((rule) => (rule.id === updatedRule.id ? updatedRule : rule))
    );

    setOpenPanels((currentPanels) =>
      currentPanels.map((panel) =>
        panel.type === "rule" && panel.refId === updatedRule.id
          ? { ...panel, title: updatedRule.title }
          : panel
      )
    );
  }

  function updateNpc(updatedNpc: NpcSheet) {
    setNpcs((currentNpcs) =>
      currentNpcs.map((npc) => (npc.id === updatedNpc.id ? updatedNpc : npc))
    );

    setOpenPanels((currentPanels) =>
      currentPanels.map((panel) =>
        panel.type === "npc" && panel.refId === updatedNpc.id
          ? { ...panel, title: updatedNpc.name }
          : panel
      )
    );
  }

  function resetAllContent() {
    const confirmed = window.confirm(
      "Deseja restaurar o conteúdo inicial? Suas edições salvas neste navegador serão perdidas."
    );

    if (!confirmed) {
      return;
    }

    setRules(initialRuleArticles);
    setNpcs(initialNpcSheets);
    window.localStorage.removeItem(STORAGE_KEY);
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
            Biblioteca editável do sistema, regras e fichas rápidas
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="rounded-full border border-amber-500/40 px-3 py-1 text-xs font-medium text-amber-300">
            Sistema próprio
          </span>
          <button
            onClick={resetAllContent}
            className="inline-flex items-center gap-2 rounded-md border border-zinc-700 px-3 py-2 text-xs text-zinc-300 transition hover:border-red-500/60 hover:text-red-300"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Restaurar
          </button>
        </div>
      </header>

      <div className="grid h-[calc(100vh-4rem)] grid-cols-[300px_1fr]">
        <aside className="border-r border-zinc-800 bg-zinc-900/70 p-4">
          <div className="mb-6 flex items-center gap-2 text-sm font-semibold text-zinc-300">
            <Home className="h-4 w-4 text-amber-400" />
            Biblioteca do Sistema
          </div>

          <nav className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const article = rules.find((rule) => rule.category === item.id);
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
              Fichas rápidas de NPC
            </p>

            {npcs.map((npc) => {
              const isOpen = openedPanelIds.has(`npc:${npc.id}`);

              return (
                <button
                  key={npc.id}
                  onClick={() => openNpc(npc.id)}
                  className={`mb-2 w-full rounded-md border p-3 text-left text-sm transition ${
                    isOpen
                      ? "border-amber-500/50 bg-amber-500/10"
                      : "border-zinc-800 bg-zinc-950 hover:border-amber-500/40"
                  }`}
                >
                  <p className="font-medium text-zinc-200">{npc.name}</p>
                  <p className="text-xs text-zinc-500">{npc.role}</p>
                </button>
              );
            })}
          </div>

          <div className="mt-8 rounded-md border border-zinc-800 bg-zinc-950 p-3 text-xs text-zinc-400">
            <p className="font-semibold text-amber-300">Como usar</p>
            <p className="mt-1">
              Abra uma regra e uma ficha de NPC ao mesmo tempo. Arraste o divisor entre as telas para ajustar o tamanho.
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
                    rules={rules}
                    npcs={npcs}
                    canClose={openPanels.length > 1}
                    onClose={() => closePanel(panel.id)}
                    onOpenRule={openRule}
                    onUpdateRule={updateRule}
                    onUpdateNpc={updateNpc}
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
  canClose,
  onClose,
  onOpenRule,
  onUpdateRule,
  onUpdateNpc,
}: {
  panel: OpenPanel;
  rules: RuleArticle[];
  npcs: NpcSheet[];
  canClose: boolean;
  onClose: () => void;
  onOpenRule: (articleId: string) => void;
  onUpdateRule: (rule: RuleArticle) => void;
  onUpdateNpc: (npc: NpcSheet) => void;
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
  const [draftStats, setDraftStats] = useState(npc.stats.map((stat) => `${stat.label}: ${stat.value}`).join("\n"));
  const [draftNotes, setDraftNotes] = useState(listToEditableText(npc.notes));

  useEffect(() => {
    setDraftName(npc.name);
    setDraftRole(npc.role);
    setDraftDescription(npc.description);
    setDraftStats(npc.stats.map((stat) => `${stat.label}: ${stat.value}`).join("\n"));
    setDraftNotes(listToEditableText(npc.notes));
    setIsEditing(false);
  }, [npc]);

  function saveChanges() {
    const parsedStats = splitTextIntoList(draftStats).map((line) => {
      const [label, ...valueParts] = line.split(":");

      return {
        label: label?.trim() || "Campo",
        value: valueParts.join(":").trim() || "-",
      };
    });

    onUpdateNpc({
      ...npc,
      name: draftName.trim() || npc.name,
      role: draftRole.trim(),
      description: draftDescription.trim(),
      stats: parsedStats,
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
              <h2 className="truncate text-lg font-semibold text-amber-300">{npc.name}</h2>
            )}

            {isEditing ? (
              <input
                value={draftRole}
                onChange={(event) => setDraftRole(event.target.value)}
                className="mt-2 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-300 outline-none focus:border-amber-500"
              />
            ) : (
              <p className="mt-1 text-sm text-zinc-400">{npc.role}</p>
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
            <label className="block text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Descrição
              <textarea
                value={draftDescription}
                onChange={(event) => setDraftDescription(event.target.value)}
                rows={5}
                className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-950 p-4 text-sm normal-case leading-7 text-zinc-200 outline-none focus:border-amber-500"
              />
            </label>

            <label className="block text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Status, um por linha no formato Nome: Valor
              <textarea
                value={draftStats}
                onChange={(event) => setDraftStats(event.target.value)}
                rows={6}
                className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-950 p-4 text-sm normal-case leading-7 text-zinc-200 outline-none focus:border-amber-500"
              />
            </label>

            <label className="block text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Notas do mestre, uma por linha
              <textarea
                value={draftNotes}
                onChange={(event) => setDraftNotes(event.target.value)}
                rows={6}
                className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-950 p-4 text-sm normal-case leading-7 text-zinc-200 outline-none focus:border-amber-500"
              />
            </label>
          </div>
        ) : (
          <>
            <p className="mb-5 text-sm leading-7 text-zinc-300">{npc.description}</p>

            <div className="grid grid-cols-2 gap-3">
              {npc.stats.map((stat) => (
                <div key={stat.label} className="rounded-md border border-zinc-800 bg-zinc-950 p-3">
                  <p className="text-xs uppercase text-zinc-500">{stat.label}</p>
                  <p className="text-lg font-semibold text-zinc-100">{stat.value}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-md border border-zinc-800 bg-zinc-950 p-4">
              <p className="mb-3 text-sm font-semibold text-amber-300">Notas do mestre</p>
              <ul className="space-y-2 text-sm text-zinc-300">
                {npc.notes.map((note) => (
                  <li key={note}>• {note}</li>
                ))}
              </ul>
            </div>
          </>
        )}
      </div>
    </article>
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

export function panelStyle(size: number): CSSProperties {
  return {
    flexBasis: `${size}%`,
    minWidth: PANEL_MIN_WIDTH,
  };
}
