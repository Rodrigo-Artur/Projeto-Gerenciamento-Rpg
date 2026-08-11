import { NextResponse } from "next/server";

import {
  createAutomaticBackup,
  createSystemAdvanced,
  createTableAdvanced,
  deleteCombat,
  deleteCoreContent,
  deleteEntity,
  deleteExtra,
  deleteTemplate,
  enrichCoreData,
  exportPackage,
  getRecent,
  getVersions,
  globalSearch,
  importPackage,
  previewImport,
  recordRecent,
  restoreBackup,
  saveCombat,
  upsertEntity,
  upsertNote,
  upsertNpc,
  upsertPlayer,
  upsertRule,
  upsertSession,
  upsertTemplate,
} from "@/lib/server/advancedDatabase";
import { ensureDailyBackup } from "@/lib/server/backupMaintenance";
import { deleteSystem, deleteTable, duplicateTable, updateSystem, updateTable } from "@/lib/server/managementDatabase";
import { getSystemConfig, saveSystemConfig } from "@/lib/server/systemConfigDatabase";
import { getRulebookData } from "@/lib/server/tableSystemDatabase";
import {
  appendSessionLog,
  clearSessionLog,
  compareSessionSnapshots,
  createSessionSnapshot,
  deleteHandout,
  deleteLibraryItem,
  deletePack,
  deleteRelation,
  generateSessionSummary,
  getLibraryItem,
  getSessionSnapshotPayload,
  getV4Extras,
  popUndoSnapshot,
  pushUndoSnapshot,
  saveCalendar,
  saveQuickNotes,
  setActiveSession,
  upsertHandout,
  upsertLibraryItem,
  upsertPack,
  upsertRelation,
} from "@/lib/server/v4Database";
import { restoreContentVersion } from "@/lib/server/versionRestore";
import type {
  CampaignRelation,
  CombatState,
  ContentPack,
  Handout,
  LibraryItem,
  NpcSheet,
  PlayerSheet,
  RpgSystemConfig,
  RuleArticle,
  RulebookData,
  SessionPlan,
  SheetTemplate,
  TableNote,
  WorldCalendar,
  WorldEntity,
} from "@/types/rulebook";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function queryValue(request: Request, key: string) {
  return new URL(request.url).searchParams.get(key) ?? undefined;
}

function fullData(tableId?: string): RulebookData {
  const data = enrichCoreData(getRulebookData(tableId));
  return {
    ...data,
    systemConfig: getSystemConfig(data.activeSystemId),
    ...getV4Extras(data.activeTableId),
  };
}

function playerView(data: RulebookData): RulebookData {
  return {
    ...data,
    rules: data.rules.filter((item) => item.meta?.visibility === "players"),
    npcs: data.npcs.filter((item) => item.meta?.visibility === "players"),
    players: data.players.filter((item) => item.meta?.visibility === "players"),
    notes: data.notes.filter((item) => !item.isPrivate && item.visibility !== "master"),
    sessions: data.sessions.filter((item) => item.visibility === "players"),
    entities: (data.entities ?? []).filter((item) => item.visibility === "players" && !item.archived),
    combats: (data.combats ?? []).map((combat) => ({
      ...combat,
      participants: combat.participants.filter((participant) => !participant.hidden).map((participant) => ({ ...participant, resources: [], abilities: [] })),
    })),
    handouts: (data.handouts ?? []).filter((item) => item.visibility === "players"),
    runtime: data.runtime ? {
      ...data.runtime,
      quickNotes: [],
      calendar: {
        ...data.runtime.calendar,
        events: data.runtime.calendar.events.filter((event) => event.visibility !== "master"),
      },
    } : undefined,
    templates: [],
    history: [],
    backups: [],
    library: [],
    packs: [],
    relations: [],
    sessionLog: [],
    sessionSnapshots: [],
  };
}

function packageFromData(data: RulebookData) {
  return {
    format: "mesa-do-mestre" as const,
    version: 4,
    packageType: "table" as const,
    data: {
      rules: data.rules,
      npcs: data.npcs,
      players: data.players,
      notes: data.notes,
      sessions: data.sessions,
      templates: data.templates ?? [],
      entities: data.entities ?? [],
    },
  };
}

function restoreCoreSnapshot(tableId: string, snapshot: RulebookData) {
  importPackage({ tableId, payload: packageFromData(snapshot), mode: "replace", conflict: "replace" });
  if (snapshot.runtime) {
    saveQuickNotes(tableId, snapshot.runtime.quickNotes);
    saveCalendar(tableId, snapshot.runtime.calendar);
    setActiveSession(tableId, snapshot.runtime.activeSessionId);
  }
  for (const handout of snapshot.handouts ?? []) upsertHandout({ ...handout, tableId });
}

function mutationLabel(action: string | undefined) {
  const labels: Record<string, string> = {
    "delete-rule": "Excluir regra",
    "delete-npc": "Excluir NPC",
    "delete-player": "Excluir player",
    "delete-note": "Excluir nota",
    "delete-session": "Excluir sessão",
    "delete-template": "Excluir template",
    "delete-entity": "Excluir conteúdo do mundo",
    "delete-combat": "Excluir combate",
    "delete-table": "Excluir mesa",
    "import-package": "Importar pacote",
    "duplicate-npc": "Duplicar NPC",
    "apply-library": "Aplicar item da biblioteca",
    "apply-pack": "Aplicar pacote",
  };
  return action ? labels[action] : undefined;
}

function logMutation(tableId: string, action: string | undefined, body: Record<string, unknown>) {
  const ignored = new Set(["record-recent", "import-preview", "compare-snapshots", "save-quick-notes"]);
  if (!action || ignored.has(action)) return;
  const target = typeof body.name === "string" ? body.name : typeof body.contentName === "string" ? body.contentName : "conteúdo";
  appendSessionLog(tableId, action.includes("combat") ? "combat" : "content", `${action.replaceAll("-", " ")}: ${target}`);
}

export async function GET(request: Request) {
  const tableId = queryValue(request, "tableId");
  const search = queryValue(request, "search");
  const view = queryValue(request, "view");
  const exportMode = queryValue(request, "export");
  const versionsType = queryValue(request, "versionsType");
  const versionsId = queryValue(request, "versionsId");

  if (search) return NextResponse.json({ results: globalSearch(tableId ?? "mesa-principal", search, view === "players") });
  if (exportMode === "1") return NextResponse.json(exportPackage(tableId ?? "mesa-principal"));
  if (versionsType && versionsId) return NextResponse.json({ versions: getVersions(versionsType, versionsId) });

  const initialData = fullData(tableId);
  ensureDailyBackup(initialData.activeTableId);
  const data = fullData(initialData.activeTableId);
  return NextResponse.json({
    ...(view === "players" ? playerView(data) : data),
    recent: view === "players" ? [] : getRecent(data.activeTableId),
    databaseMode: "sqlite-local-v4",
  });
}

export async function PUT(request: Request) {
  const data = (await request.json()) as RulebookData;
  const tableId = data.activeTableId || queryValue(request, "tableId") || "mesa-principal";
  const systemId = data.activeSystemId || "kaiju-rpg";
  for (const rule of data.rules ?? []) upsertRule(systemId, rule);
  for (const npc of data.npcs ?? []) upsertNpc(tableId, npc);
  for (const player of data.players ?? []) upsertPlayer(tableId, player);
  for (const note of data.notes ?? []) upsertNote(tableId, note);
  for (const session of data.sessions ?? []) upsertSession(tableId, session);
  for (const template of data.templates ?? []) upsertTemplate({ ...template, systemId });
  for (const entity of data.entities ?? []) upsertEntity({ ...entity, tableId });
  for (const combat of data.combats ?? []) saveCombat({ ...combat, tableId });
  if (data.systemConfig) saveSystemConfig(systemId, data.systemConfig);
  return NextResponse.json({ ...fullData(tableId), databaseMode: "sqlite-local-v4" });
}

export async function POST(request: Request) {
  const body = (await request.json()) as Record<string, unknown> & { action?: string; tableId?: string; systemId?: string };
  const tableId = body.tableId || "mesa-principal";
  const systemId = body.systemId || "kaiju-rpg";

  try {
    const label = mutationLabel(body.action);
    if (label) pushUndoSnapshot(tableId, label, fullData(tableId));

    switch (body.action) {
      case "create-system": {
        const system = createSystemAdvanced({ name: String(body.name || "Novo sistema").trim(), description: String(body.description || "Sistema criado pelo Mesa do Mestre.").trim(), mode: body.mode === "clone" ? "clone" : "blank", sourceSystemId: typeof body.sourceSystemId === "string" ? body.sourceSystemId : undefined });
        return NextResponse.json({ ...fullData(tableId), createdSystemId: system.id, databaseMode: "sqlite-local-v4" });
      }
      case "update-system": updateSystem({ id: systemId, name: typeof body.name === "string" ? body.name : undefined, description: typeof body.description === "string" ? body.description : undefined }); break;
      case "delete-system": deleteSystem(systemId); break;
      case "save-system-config": saveSystemConfig(systemId, (body.config ?? {}) as Partial<RpgSystemConfig>); break;
      case "create-table": {
        const table = createTableAdvanced({ name: String(body.name || "Nova mesa").trim(), description: String(body.description || "Nova campanha.").trim(), systemId });
        return NextResponse.json({ ...fullData(table.id), databaseMode: "sqlite-local-v4" });
      }
      case "update-table": updateTable({ id: tableId, name: typeof body.name === "string" ? body.name : undefined, description: typeof body.description === "string" ? body.description : undefined, systemId: typeof body.newSystemId === "string" ? body.newSystemId : undefined }); break;
      case "duplicate-table": {
        const table = duplicateTable(tableId, typeof body.name === "string" ? body.name : undefined);
        return NextResponse.json({ ...fullData(table.id), databaseMode: "sqlite-local-v4" });
      }
      case "delete-table": deleteTable(tableId); return NextResponse.json({ ...fullData("mesa-principal"), databaseMode: "sqlite-local-v4" });

      case "upsert-rule": upsertRule(systemId, body.item as RuleArticle); break;
      case "upsert-npc": upsertNpc(tableId, body.item as NpcSheet); break;
      case "upsert-player": upsertPlayer(tableId, body.item as PlayerSheet); break;
      case "upsert-note": upsertNote(tableId, body.item as TableNote); break;
      case "upsert-session": upsertSession(tableId, body.item as SessionPlan); break;
      case "upsert-template": upsertTemplate({ ...(body.item as SheetTemplate), systemId }); break;
      case "upsert-entity": upsertEntity({ ...(body.item as WorldEntity), tableId }); break;
      case "save-combat": saveCombat({ ...(body.item as CombatState), tableId }); break;

      case "delete-rule": deleteCoreContent({ type: "rule", id: String(body.id), systemId }); break;
      case "delete-npc": deleteCoreContent({ type: "npc", id: String(body.id), tableId }); break;
      case "delete-player": deleteCoreContent({ type: "player", id: String(body.id), tableId }); break;
      case "delete-note": deleteExtra(tableId, "note", String(body.id)); break;
      case "delete-session": deleteExtra(tableId, "session", String(body.id)); break;
      case "delete-template": deleteTemplate(systemId, String(body.id)); break;
      case "delete-entity": deleteEntity(tableId, String(body.id)); break;
      case "delete-combat": deleteCombat(tableId, String(body.id)); break;

      case "duplicate-npc": {
        const source = fullData(tableId).npcs.find((item) => item.id === String(body.id));
        if (!source) throw new Error("NPC não encontrado.");
        const copy = { ...source, id: `${source.id}-copy-${Date.now()}`, name: `${source.name} — Cópia`, meta: { ...source.meta, favorite: false } };
        upsertNpc(tableId, copy);
        appendSessionLog(tableId, "content", `NPC duplicado: ${source.name}.`);
        break;
      }

      case "record-recent": recordRecent(tableId, String(body.contentType), String(body.contentId), String(body.contentName)); return NextResponse.json({ ok: true });
      case "backup": createAutomaticBackup(tableId, String(body.reason || "Backup manual")); break;
      case "restore-backup": restoreBackup(tableId, String(body.backupId)); break;
      case "restore-version": restoreContentVersion({ versionId: String(body.versionId), contentType: String(body.contentType), contentId: String(body.contentId), tableId, systemId }); break;
      case "import-preview": return NextResponse.json(previewImport(tableId, body.payload));
      case "import-package": importPackage({ tableId, payload: body.payload, mode: body.mode === "replace" ? "replace" : "merge", conflict: body.conflict === "replace" || body.conflict === "copy" ? body.conflict : "skip", sections: Array.isArray(body.sections) ? body.sections as Array<"rules" | "npcs" | "players" | "notes" | "sessions" | "templates" | "entities"> : undefined }); break;

      case "save-quick-notes": saveQuickNotes(tableId, Array.isArray(body.notes) ? body.notes.map(String) : []); break;
      case "save-calendar": saveCalendar(tableId, body.calendar as WorldCalendar); break;
      case "manual-log": appendSessionLog(tableId, "manual", String(body.message || "Registro manual")); break;
      case "clear-session-log": clearSessionLog(tableId, typeof body.sessionId === "string" ? body.sessionId : undefined); break;
      case "generate-session-summary": return NextResponse.json({ summary: generateSessionSummary(tableId, typeof body.sessionId === "string" ? body.sessionId : undefined) });

      case "start-session": {
        const data = fullData(tableId);
        const sessionId = String(body.sessionId || data.sessions.find((item) => item.status === "planned")?.id || `session-${Date.now()}`);
        createSessionSnapshot(tableId, "Antes da sessão", data, sessionId);
        setActiveSession(tableId, sessionId);
        const session = data.sessions.find((item) => item.id === sessionId);
        if (session) upsertSession(tableId, { ...session, status: "running" });
        appendSessionLog(tableId, "system", `Sessão iniciada: ${session?.title ?? sessionId}.`, sessionId);
        break;
      }
      case "end-session": {
        const data = fullData(tableId);
        const sessionId = typeof body.sessionId === "string" ? body.sessionId : data.runtime?.activeSessionId;
        createSessionSnapshot(tableId, "Depois da sessão", data, sessionId);
        const summary = generateSessionSummary(tableId, sessionId);
        if (sessionId) {
          const session = data.sessions.find((item) => item.id === sessionId);
          if (session) upsertSession(tableId, { ...session, status: "completed", notes: [...session.notes, "", summary] });
        }
        appendSessionLog(tableId, "system", "Sessão encerrada.", sessionId);
        setActiveSession(tableId, undefined);
        return NextResponse.json({ ...fullData(tableId), summary, databaseMode: "sqlite-local-v4" });
      }
      case "create-session-snapshot": createSessionSnapshot(tableId, String(body.label || "Snapshot manual"), fullData(tableId), typeof body.sessionId === "string" ? body.sessionId : undefined); break;
      case "compare-snapshots": return NextResponse.json(compareSessionSnapshots(tableId, String(body.fromId), String(body.toId)));
      case "restore-session-snapshot": {
        const snapshot = getSessionSnapshotPayload(tableId, String(body.snapshotId));
        if (!snapshot) throw new Error("Snapshot não encontrado.");
        pushUndoSnapshot(tableId, "Restaurar snapshot", fullData(tableId));
        restoreCoreSnapshot(tableId, snapshot);
        break;
      }
      case "undo-last": {
        const undo = popUndoSnapshot(tableId);
        if (!undo) return NextResponse.json({ ...fullData(tableId), undo: false, databaseMode: "sqlite-local-v4" });
        restoreCoreSnapshot(tableId, undo.data);
        appendSessionLog(tableId, "system", `Desfeito: ${undo.label}.`);
        return NextResponse.json({ ...fullData(tableId), undo: true, undoLabel: undo.label, databaseMode: "sqlite-local-v4" });
      }

      case "upsert-library": upsertLibraryItem(body.item as Partial<LibraryItem> & { type: LibraryItem["type"]; name: string; payload: Record<string, unknown> }); break;
      case "delete-library": deleteLibraryItem(String(body.id)); break;
      case "apply-library": {
        const item = getLibraryItem(String(body.id));
        if (!item) throw new Error("Item de biblioteca não encontrado.");
        const payload = { ...item.payload, id: `${String(item.payload.id ?? item.id)}-lib-${Date.now()}` };
        if (item.type === "npc") upsertNpc(tableId, payload as unknown as NpcSheet);
        else if (item.type === "player") upsertPlayer(tableId, payload as unknown as PlayerSheet);
        else if (item.type === "rule") upsertRule(systemId, payload as unknown as RuleArticle);
        else if (item.type === "entity") upsertEntity({ ...(payload as unknown as WorldEntity), tableId });
        else if (item.type === "template") upsertTemplate({ ...(payload as unknown as SheetTemplate), id: String(payload.id), systemId });
        else if (item.type === "encounter") saveCombat({ ...(payload as unknown as CombatState), id: String(payload.id), tableId });
        appendSessionLog(tableId, "content", `Biblioteca aplicada: ${item.name}.`);
        break;
      }
      case "upsert-pack": upsertPack(body.item as Partial<ContentPack> & { name: string; libraryItemIds: string[] }); break;
      case "delete-pack": deletePack(String(body.id)); break;
      case "apply-pack": {
        const pack = (fullData(tableId).packs ?? []).find((item) => item.id === String(body.id));
        if (!pack) throw new Error("Pacote não encontrado.");
        for (const itemId of pack.libraryItemIds) {
          const item = getLibraryItem(itemId);
          if (!item) continue;
          const payload = { ...item.payload, id: `${String(item.payload.id ?? item.id)}-pack-${Date.now()}-${Math.random().toString(36).slice(2, 5)}` };
          if (item.type === "npc") upsertNpc(tableId, payload as unknown as NpcSheet);
          else if (item.type === "player") upsertPlayer(tableId, payload as unknown as PlayerSheet);
          else if (item.type === "rule") upsertRule(systemId, payload as unknown as RuleArticle);
          else if (item.type === "entity") upsertEntity({ ...(payload as unknown as WorldEntity), tableId });
          else if (item.type === "template") upsertTemplate({ ...(payload as unknown as SheetTemplate), systemId });
          else if (item.type === "encounter") saveCombat({ ...(payload as unknown as CombatState), tableId });
        }
        appendSessionLog(tableId, "content", `Pacote aplicado: ${pack.name}.`);
        break;
      }

      case "upsert-relation": upsertRelation({ ...(body.item as CampaignRelation), tableId }); break;
      case "delete-relation": deleteRelation(tableId, String(body.id)); break;
      case "upsert-handout": upsertHandout({ ...(body.item as Handout), tableId }); break;
      case "delete-handout": deleteHandout(tableId, String(body.id)); break;

      default: return NextResponse.json({ ...fullData(tableId), databaseMode: "sqlite-local-v4" });
    }

    logMutation(tableId, body.action, body);
    return NextResponse.json({ ...fullData(tableId), databaseMode: "sqlite-local-v4" });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Falha ao executar operação." }, { status: 400 });
  }
}
