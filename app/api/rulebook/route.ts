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
import {
  deleteSystem,
  deleteTable,
  duplicateTable,
  updateSystem,
  updateTable,
} from "@/lib/server/managementDatabase";
import { getRulebookData } from "@/lib/server/tableSystemDatabase";
import { restoreContentVersion } from "@/lib/server/versionRestore";
import type {
  CombatState,
  NpcSheet,
  PlayerSheet,
  RuleArticle,
  RulebookData,
  SessionPlan,
  SheetTemplate,
  TableNote,
  WorldEntity,
} from "@/types/rulebook";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function queryValue(request: Request, key: string) {
  return new URL(request.url).searchParams.get(key) ?? undefined;
}

function fullData(tableId?: string) {
  return enrichCoreData(getRulebookData(tableId));
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
    history: [],
    backups: [],
  };
}

export async function GET(request: Request) {
  const tableId = queryValue(request, "tableId");
  const search = queryValue(request, "search");
  const view = queryValue(request, "view");
  const exportMode = queryValue(request, "export");
  const versionsType = queryValue(request, "versionsType");
  const versionsId = queryValue(request, "versionsId");

  if (search) {
    return NextResponse.json({
      results: globalSearch(tableId ?? "mesa-principal", search, view === "players"),
    });
  }

  if (exportMode === "1") {
    return NextResponse.json(exportPackage(tableId ?? "mesa-principal"));
  }

  if (versionsType && versionsId) {
    return NextResponse.json({ versions: getVersions(versionsType, versionsId) });
  }

  ensureDailyBackup(tableId ?? "mesa-principal");
  const data = fullData(tableId);
  return NextResponse.json({
    ...(view === "players" ? playerView(data) : data),
    recent: getRecent(data.activeTableId),
    databaseMode: "sqlite-local-v3",
  });
}

export async function PUT(request: Request) {
  const data = (await request.json()) as RulebookData;
  const tableId = data.activeTableId || queryValue(request, "tableId") || "mesa-principal";
  const systemId = data.activeSystemId || "kaiju-rpg";

  // Compatibilidade: PUT apenas cria/atualiza. Ausência no payload nunca significa exclusão.
  for (const rule of data.rules ?? []) upsertRule(systemId, rule);
  for (const npc of data.npcs ?? []) upsertNpc(tableId, npc);
  for (const player of data.players ?? []) upsertPlayer(tableId, player);
  for (const note of data.notes ?? []) upsertNote(tableId, note);
  for (const session of data.sessions ?? []) upsertSession(tableId, session);
  for (const template of data.templates ?? []) upsertTemplate({ ...template, systemId });
  for (const entity of data.entities ?? []) upsertEntity({ ...entity, tableId });
  for (const combat of data.combats ?? []) saveCombat({ ...combat, tableId });

  return NextResponse.json({ ...fullData(tableId), databaseMode: "sqlite-local-v3" });
}

export async function POST(request: Request) {
  const body = (await request.json()) as Record<string, unknown> & {
    action?: string;
    tableId?: string;
    systemId?: string;
  };
  const tableId = body.tableId || "mesa-principal";
  const systemId = body.systemId || "kaiju-rpg";

  try {
    switch (body.action) {
      case "create-system": {
        const system = createSystemAdvanced({
          name: String(body.name || "Novo sistema").trim(),
          description: String(body.description || "Sistema criado pelo Mesa do Mestre.").trim(),
          mode: body.mode === "clone" ? "clone" : "blank",
          sourceSystemId: typeof body.sourceSystemId === "string" ? body.sourceSystemId : undefined,
        });
        return NextResponse.json({ ...fullData(tableId), createdSystemId: system.id, databaseMode: "sqlite-local-v3" });
      }

      case "update-system":
        updateSystem({ id: systemId, name: typeof body.name === "string" ? body.name : undefined, description: typeof body.description === "string" ? body.description : undefined });
        break;
      case "delete-system":
        deleteSystem(systemId);
        break;

      case "create-table": {
        const table = createTableAdvanced({
          name: String(body.name || "Nova mesa").trim(),
          description: String(body.description || "Nova campanha.").trim(),
          systemId,
        });
        return NextResponse.json({ ...fullData(table.id), databaseMode: "sqlite-local-v3" });
      }
      case "update-table":
        updateTable({
          id: tableId,
          name: typeof body.name === "string" ? body.name : undefined,
          description: typeof body.description === "string" ? body.description : undefined,
          systemId: typeof body.newSystemId === "string" ? body.newSystemId : undefined,
        });
        break;
      case "duplicate-table": {
        const table = duplicateTable(tableId, typeof body.name === "string" ? body.name : undefined);
        return NextResponse.json({ ...fullData(table.id), databaseMode: "sqlite-local-v3" });
      }
      case "delete-table":
        deleteTable(tableId);
        return NextResponse.json({ ...fullData("mesa-principal"), databaseMode: "sqlite-local-v3" });

      case "upsert-rule":
        upsertRule(systemId, body.item as RuleArticle);
        break;
      case "upsert-npc":
        upsertNpc(tableId, body.item as NpcSheet);
        break;
      case "upsert-player":
        upsertPlayer(tableId, body.item as PlayerSheet);
        break;
      case "upsert-note":
        upsertNote(tableId, body.item as TableNote);
        break;
      case "upsert-session":
        upsertSession(tableId, body.item as SessionPlan);
        break;
      case "upsert-template":
        upsertTemplate({ ...(body.item as SheetTemplate), systemId });
        break;
      case "upsert-entity":
        upsertEntity({ ...(body.item as WorldEntity), tableId });
        break;
      case "save-combat":
        saveCombat({ ...(body.item as CombatState), tableId });
        break;

      case "delete-rule":
        deleteCoreContent({ type: "rule", id: String(body.id), systemId });
        break;
      case "delete-npc":
        deleteCoreContent({ type: "npc", id: String(body.id), tableId });
        break;
      case "delete-player":
        deleteCoreContent({ type: "player", id: String(body.id), tableId });
        break;
      case "delete-note":
        deleteExtra(tableId, "note", String(body.id));
        break;
      case "delete-session":
        deleteExtra(tableId, "session", String(body.id));
        break;
      case "delete-template":
        deleteTemplate(systemId, String(body.id));
        break;
      case "delete-entity":
        deleteEntity(tableId, String(body.id));
        break;
      case "delete-combat":
        deleteCombat(tableId, String(body.id));
        break;

      case "record-recent":
        recordRecent(tableId, String(body.contentType), String(body.contentId), String(body.contentName));
        return NextResponse.json({ ok: true });

      case "backup":
        createAutomaticBackup(tableId, String(body.reason || "Backup manual"));
        break;

      case "restore-backup":
        restoreBackup(tableId, String(body.backupId));
        break;

      case "restore-version":
        restoreContentVersion({
          versionId: String(body.versionId),
          contentType: String(body.contentType),
          contentId: String(body.contentId),
          tableId,
          systemId,
        });
        break;

      case "import-preview":
        return NextResponse.json(previewImport(tableId, body.payload));

      case "import-package":
        importPackage({
          tableId,
          payload: body.payload,
          mode: body.mode === "replace" ? "replace" : "merge",
          conflict: body.conflict === "replace" || body.conflict === "copy" ? body.conflict : "skip",
          sections: Array.isArray(body.sections) ? body.sections as Array<"rules" | "npcs" | "players" | "notes" | "sessions" | "templates" | "entities"> : undefined,
        });
        break;

      default:
        return NextResponse.json({ ...fullData(tableId), databaseMode: "sqlite-local-v3" });
    }

    return NextResponse.json({ ...fullData(tableId), databaseMode: "sqlite-local-v3" });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Falha ao executar operação." },
      { status: 400 }
    );
  }
}
