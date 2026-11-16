import type { RulebookData, WorkspaceTab, WorldEntityType } from "@/types/rulebook";
import type { ViewId } from "@/components/layout/AppSidebar";

export type ResolvedContent = { type: string; refId: string; title: string; view: ViewId };
export type SavedWorkspaceTabs = { version: 2; tabs: WorkspaceTab[]; activeTabId: string };

const WORLD_TYPES: ReadonlyArray<string> = [
  "item", "location", "faction", "quest", "timeline", "calendar-event", "entity",
];

/** Resolve against the CURRENT table's payload, not against stale search/recent titles. */
export function resolveWorkspaceContent(data: RulebookData, type: string, id: string): ResolvedContent | undefined {
  if (!id || !type) return undefined;
  switch (type) {
    case "rule": {
      const item = data.rules.find((row) => row.id === id);
      return item && { type, refId: item.id, title: item.title, view: "rules" };
    }
    case "npc": {
      const item = data.npcs.find((row) => row.id === id);
      return item && { type, refId: item.id, title: item.name, view: "sheets" };
    }
    case "player": {
      const item = data.players.find((row) => row.id === id);
      return item && { type, refId: item.id, title: item.characterName, view: "sheets" };
    }
    case "note": {
      const item = data.notes.find((row) => row.id === id);
      return item && { type, refId: item.id, title: item.title, view: "sessions" };
    }
    case "session": {
      const item = data.sessions.find((row) => row.id === id);
      return item && { type, refId: item.id, title: item.title, view: "sessions" };
    }
    case "handout": {
      const item = (data.handouts ?? []).find((row) => row.id === id);
      return item && { type, refId: item.id, title: item.title, view: "session-mode" };
    }
    case "library": {
      const item = (data.library ?? []).find((row) => row.id === id);
      return item && { type, refId: item.id, title: item.name, view: "library" };
    }
    default: {
      if (!WORLD_TYPES.includes(type)) return undefined;
      const item = (data.entities ?? []).find((row) => row.id === id);
      if (!item) return undefined;
      // "entity" is a legacy alias: the stored entity type is authoritative.
      if (type !== "entity" && type !== item.type) return undefined;
      return { type: item.type as WorldEntityType, refId: item.id, title: item.name, view: "world" };
    }
  }
}

/** A table ID is part of every tab key, even for rules shared by a system. */
export function createWorkspaceTab(tableId: string, content: ResolvedContent, pinned = false): WorkspaceTab {
  return {
    id: `${tableId}:${content.type}:${content.refId}`,
    tableId,
    type: content.type,
    refId: content.refId,
    title: content.title,
    view: content.view,
    pinned,
  };
}

export function validateWorkspaceTabs(data: RulebookData, candidate: unknown): WorkspaceTab[] {
  if (!Array.isArray(candidate)) return [];
  const seen = new Set<string>();
  const validated: WorkspaceTab[] = [];
  for (const value of candidate.slice(0, 100)) {
    if (!value || typeof value !== "object") continue;
    const tab = value as Partial<WorkspaceTab>;
    if (typeof tab.type !== "string" || typeof tab.refId !== "string") continue;
    // Old tabs did not have tableId: those are trusted only from this table's storage key
    // and STILL need a matching row in the current table payload.
    if (tab.tableId && tab.tableId !== data.activeTableId) continue;
    const resolved = resolveWorkspaceContent(data, tab.type, tab.refId);
    if (!resolved) continue;
    const normalized = createWorkspaceTab(data.activeTableId, resolved, Boolean(tab.pinned));
    if (seen.has(normalized.id)) continue;
    seen.add(normalized.id);
    validated.push(normalized);
  }
  return validated.slice(-12);
}

export function readWorkspaceTabs(data: RulebookData, serialized: string | null): SavedWorkspaceTabs {
  let saved: unknown;
  try {
    saved = serialized ? JSON.parse(serialized) as unknown : [];
  } catch {
    saved = [];
  }
  const source = Array.isArray(saved) ? saved : saved && typeof saved === "object" && "tabs" in saved ? (saved as {tabs?: unknown}).tabs : [];
  const tabs = validateWorkspaceTabs(data, source);
  const activeSource = saved && typeof saved === "object" && !Array.isArray(saved) && "activeTabId" in saved
    ? (saved as {activeTabId?: unknown}).activeTabId
    : Array.isArray(saved) ? (saved as Partial<WorkspaceTab>[])[0]?.id : undefined;
  // Legacy IDs were "type:id"; compare by original id or current canonical key.
  const activeSourceTab = Array.isArray(source)
    ? source.find((row) => row && typeof row === "object" && (row as {id?: unknown}).id === activeSource) as Partial<WorkspaceTab> | undefined
    : undefined;
  const matching = tabs.find((tab) =>
    tab.id === activeSource ||
    (activeSourceTab?.type === tab.type && activeSourceTab?.refId === tab.refId)
  );
  return { version: 2, tabs, activeTabId: matching?.id ?? tabs[0]?.id ?? "" };
}
