import Database from "better-sqlite3";
import { randomUUID } from "node:crypto";
import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";

import type {
  CampaignRelation,
  ContentPack,
  Handout,
  LibraryItem,
  LibraryItemType,
  RulebookData,
  SessionLogEntry,
  SessionSnapshot,
  SnapshotComparison,
  WorkspaceRuntime,
  WorldCalendar,
} from "@/types/rulebook";

const DB_DIRECTORY = path.join(process.cwd(), ".local");
const DB_PATH = path.join(DB_DIRECTORY, "mesa-do-mestre.sqlite");

const defaultCalendar: WorldCalendar = {
  day: 1,
  month: 1,
  year: 1,
  calendarName: "Calendário da campanha",
  monthName: "Mês 1",
  events: [],
};

declare global {
  // eslint-disable-next-line no-var
  var mesaDoMestreV4Database: Database.Database | undefined;
}

function parseJson<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function nowIso() {
  return new Date().toISOString();
}

function getDb() {
  if (!existsSync(DB_DIRECTORY)) mkdirSync(DB_DIRECTORY, { recursive: true });
  if (!globalThis.mesaDoMestreV4Database) {
    globalThis.mesaDoMestreV4Database = new Database(DB_PATH);
    globalThis.mesaDoMestreV4Database.pragma("journal_mode = WAL");
    ensureSchema(globalThis.mesaDoMestreV4Database);
  }
  return globalThis.mesaDoMestreV4Database;
}

function ensureSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS workspace_runtime (
      table_id TEXT PRIMARY KEY,
      active_session_id TEXT,
      quick_notes_json TEXT NOT NULL DEFAULT '[]',
      calendar_json TEXT NOT NULL DEFAULT '{}',
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS session_log (
      id TEXT PRIMARY KEY,
      table_id TEXT NOT NULL,
      session_id TEXT,
      kind TEXT NOT NULL,
      message TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS session_snapshots (
      id TEXT PRIMARY KEY,
      table_id TEXT NOT NULL,
      session_id TEXT,
      label TEXT NOT NULL,
      snapshot_json TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS undo_stack (
      id TEXT PRIMARY KEY,
      table_id TEXT NOT NULL,
      label TEXT NOT NULL,
      snapshot_json TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS library_items (
      id TEXT PRIMARY KEY,
      system_id TEXT,
      type TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      tags_json TEXT NOT NULL DEFAULT '[]',
      image_url TEXT,
      payload_json TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS content_packs (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      item_ids_json TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS campaign_relations (
      id TEXT PRIMARY KEY,
      table_id TEXT NOT NULL,
      source_type TEXT NOT NULL,
      source_id TEXT NOT NULL,
      source_name TEXT NOT NULL,
      target_type TEXT NOT NULL,
      target_id TEXT NOT NULL,
      target_name TEXT NOT NULL,
      relation TEXT NOT NULL,
      note TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS handouts (
      id TEXT PRIMARY KEY,
      table_id TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL DEFAULT '',
      image_url TEXT,
      visibility TEXT NOT NULL DEFAULT 'master',
      revealed_at TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_session_log_table ON session_log(table_id, created_at);
    CREATE INDEX IF NOT EXISTS idx_session_snapshots_table ON session_snapshots(table_id, created_at);
    CREATE INDEX IF NOT EXISTS idx_undo_table ON undo_stack(table_id, created_at);
    CREATE INDEX IF NOT EXISTS idx_library_type ON library_items(type, updated_at);
    CREATE INDEX IF NOT EXISTS idx_relations_table ON campaign_relations(table_id);
    CREATE INDEX IF NOT EXISTS idx_handouts_table ON handouts(table_id, updated_at);
  `);
}

function ensureRuntime(tableId: string) {
  const db = getDb();
  db.prepare(`
    INSERT OR IGNORE INTO workspace_runtime (table_id, active_session_id, quick_notes_json, calendar_json)
    VALUES (?, NULL, '[]', ?)
  `).run(tableId, JSON.stringify(defaultCalendar));
}

export function getV4Extras(tableId: string) {
  const db = getDb();
  ensureRuntime(tableId);
  const runtimeRow = db.prepare("SELECT active_session_id, quick_notes_json, calendar_json FROM workspace_runtime WHERE table_id = ?").get(tableId) as { active_session_id: string | null; quick_notes_json: string; calendar_json: string };
  const runtime: WorkspaceRuntime = {
    activeSessionId: runtimeRow.active_session_id ?? undefined,
    quickNotes: parseJson(runtimeRow.quick_notes_json, []),
    calendar: parseJson(runtimeRow.calendar_json, defaultCalendar),
  };

  const library = (db.prepare("SELECT * FROM library_items ORDER BY updated_at DESC").all() as Array<Record<string, unknown>>).map((row) => ({
    id: String(row.id),
    systemId: row.system_id ? String(row.system_id) : undefined,
    type: String(row.type) as LibraryItemType,
    name: String(row.name),
    description: String(row.description ?? ""),
    tags: parseJson(String(row.tags_json ?? "[]"), []),
    imageUrl: row.image_url ? String(row.image_url) : undefined,
    payload: parseJson(String(row.payload_json ?? "{}"), {}),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  })) satisfies LibraryItem[];

  const packs = (db.prepare("SELECT * FROM content_packs ORDER BY updated_at DESC").all() as Array<Record<string, unknown>>).map((row) => ({
    id: String(row.id),
    name: String(row.name),
    description: String(row.description ?? ""),
    libraryItemIds: parseJson(String(row.item_ids_json ?? "[]"), []),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  })) satisfies ContentPack[];

  const relations = (db.prepare("SELECT * FROM campaign_relations WHERE table_id = ? ORDER BY updated_at DESC").all(tableId) as Array<Record<string, unknown>>).map((row) => ({
    id: String(row.id),
    tableId: String(row.table_id),
    sourceType: String(row.source_type) as CampaignRelation["sourceType"],
    sourceId: String(row.source_id),
    sourceName: String(row.source_name),
    targetType: String(row.target_type) as CampaignRelation["targetType"],
    targetId: String(row.target_id),
    targetName: String(row.target_name),
    relation: String(row.relation),
    note: String(row.note ?? ""),
  })) satisfies CampaignRelation[];

  const sessionLog = (db.prepare("SELECT * FROM session_log WHERE table_id = ? ORDER BY created_at DESC LIMIT 200").all(tableId) as Array<Record<string, unknown>>).map((row) => ({
    id: String(row.id),
    tableId: String(row.table_id),
    sessionId: row.session_id ? String(row.session_id) : undefined,
    kind: String(row.kind) as SessionLogEntry["kind"],
    message: String(row.message),
    createdAt: String(row.created_at),
  })) satisfies SessionLogEntry[];

  const sessionSnapshots = (db.prepare("SELECT id, table_id, session_id, label, created_at FROM session_snapshots WHERE table_id = ? ORDER BY created_at DESC LIMIT 50").all(tableId) as Array<Record<string, unknown>>).map((row) => ({
    id: String(row.id),
    tableId: String(row.table_id),
    sessionId: row.session_id ? String(row.session_id) : undefined,
    label: String(row.label),
    createdAt: String(row.created_at),
  })) satisfies SessionSnapshot[];

  const handouts = (db.prepare("SELECT * FROM handouts WHERE table_id = ? ORDER BY updated_at DESC").all(tableId) as Array<Record<string, unknown>>).map((row) => ({
    id: String(row.id),
    tableId: String(row.table_id),
    title: String(row.title),
    content: String(row.content ?? ""),
    imageUrl: row.image_url ? String(row.image_url) : undefined,
    visibility: String(row.visibility) as Handout["visibility"],
    revealedAt: row.revealed_at ? String(row.revealed_at) : undefined,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  })) satisfies Handout[];

  return { runtime, library, packs, relations, sessionLog, sessionSnapshots, handouts };
}

export function saveQuickNotes(tableId: string, notes: string[]) {
  ensureRuntime(tableId);
  getDb().prepare("UPDATE workspace_runtime SET quick_notes_json = ?, updated_at = CURRENT_TIMESTAMP WHERE table_id = ?").run(JSON.stringify(notes), tableId);
}

export function saveCalendar(tableId: string, calendar: WorldCalendar) {
  ensureRuntime(tableId);
  getDb().prepare("UPDATE workspace_runtime SET calendar_json = ?, updated_at = CURRENT_TIMESTAMP WHERE table_id = ?").run(JSON.stringify(calendar), tableId);
  appendSessionLog(tableId, "system", `Calendário avançou para ${calendar.day}/${calendar.month}/${calendar.year}.`);
}

export function setActiveSession(tableId: string, sessionId?: string) {
  ensureRuntime(tableId);
  getDb().prepare("UPDATE workspace_runtime SET active_session_id = ?, updated_at = CURRENT_TIMESTAMP WHERE table_id = ?").run(sessionId ?? null, tableId);
}

export function appendSessionLog(tableId: string, kind: SessionLogEntry["kind"], message: string, sessionId?: string) {
  const db = getDb();
  ensureRuntime(tableId);
  const runtime = db.prepare("SELECT active_session_id FROM workspace_runtime WHERE table_id = ?").get(tableId) as { active_session_id: string | null };
  const id = randomUUID();
  db.prepare("INSERT INTO session_log (id, table_id, session_id, kind, message) VALUES (?, ?, ?, ?, ?)").run(id, tableId, sessionId ?? runtime.active_session_id ?? null, kind, message);
  return id;
}

export function clearSessionLog(tableId: string, sessionId?: string) {
  if (sessionId) getDb().prepare("DELETE FROM session_log WHERE table_id = ? AND session_id = ?").run(tableId, sessionId);
  else getDb().prepare("DELETE FROM session_log WHERE table_id = ?").run(tableId);
}

export function generateSessionSummary(tableId: string, sessionId?: string) {
  const db = getDb();
  const rows = sessionId
    ? db.prepare("SELECT kind, message, created_at FROM session_log WHERE table_id = ? AND session_id = ? ORDER BY created_at ASC").all(tableId, sessionId)
    : db.prepare("SELECT kind, message, created_at FROM session_log WHERE table_id = ? ORDER BY created_at ASC LIMIT 200").all(tableId);
  const entries = rows as Array<{ kind: string; message: string; created_at: string }>;
  if (entries.length === 0) return "Nenhum evento foi registrado nesta sessão.";
  const important = entries.filter((entry) => !entry.message.toLowerCase().includes("salvou automaticamente"));
  return [
    `Resumo gerado a partir de ${important.length} eventos registrados:`,
    "",
    ...important.map((entry) => `• ${entry.message}`),
  ].join("\n");
}

function snapshotIndex(data: RulebookData) {
  const rows = [
    ...data.rules.map((item) => [`rule:${item.id}`, item.title, JSON.stringify(item)] as const),
    ...data.npcs.map((item) => [`npc:${item.id}`, item.name, JSON.stringify(item)] as const),
    ...data.players.map((item) => [`player:${item.id}`, item.characterName, JSON.stringify(item)] as const),
    ...data.notes.map((item) => [`note:${item.id}`, item.title, JSON.stringify(item)] as const),
    ...data.sessions.map((item) => [`session:${item.id}`, item.title, JSON.stringify(item)] as const),
    ...(data.entities ?? []).map((item) => [`entity:${item.id}`, item.name, JSON.stringify(item)] as const),
    ...(data.handouts ?? []).map((item) => [`handout:${item.id}`, item.title, JSON.stringify(item)] as const),
  ];
  return new Map(rows.map(([id, name, json]) => [id, { name, json }]));
}

export function createSessionSnapshot(tableId: string, label: string, data: RulebookData, sessionId?: string) {
  const id = randomUUID();
  getDb().prepare("INSERT INTO session_snapshots (id, table_id, session_id, label, snapshot_json) VALUES (?, ?, ?, ?, ?)").run(id, tableId, sessionId ?? null, label, JSON.stringify(data));
  appendSessionLog(tableId, "snapshot", `Snapshot criado: ${label}.`, sessionId);
  return id;
}

export function compareSessionSnapshots(tableId: string, fromId: string, toId: string): SnapshotComparison {
  const db = getDb();
  const from = db.prepare("SELECT snapshot_json FROM session_snapshots WHERE id = ? AND table_id = ?").get(fromId, tableId) as { snapshot_json: string } | undefined;
  const to = db.prepare("SELECT snapshot_json FROM session_snapshots WHERE id = ? AND table_id = ?").get(toId, tableId) as { snapshot_json: string } | undefined;
  if (!from || !to) throw new Error("Snapshot não encontrado.");
  const a = snapshotIndex(parseJson<RulebookData>(from.snapshot_json, {} as RulebookData));
  const b = snapshotIndex(parseJson<RulebookData>(to.snapshot_json, {} as RulebookData));
  const added: string[] = [];
  const removed: string[] = [];
  const changed: string[] = [];
  for (const [id, value] of b) {
    if (!a.has(id)) added.push(value.name);
    else if (a.get(id)?.json !== value.json) changed.push(value.name);
  }
  for (const [id, value] of a) if (!b.has(id)) removed.push(value.name);
  const summary = `${added.length} adicionados, ${removed.length} removidos e ${changed.length} alterados.`;
  return { fromId, toId, added, removed, changed, summary };
}

export function getSessionSnapshotPayload(tableId: string, snapshotId: string) {
  const row = getDb().prepare("SELECT snapshot_json FROM session_snapshots WHERE id = ? AND table_id = ?").get(snapshotId, tableId) as { snapshot_json: string } | undefined;
  return row ? parseJson<RulebookData>(row.snapshot_json, {} as RulebookData) : undefined;
}

export function pushUndoSnapshot(tableId: string, label: string, data: RulebookData) {
  const db = getDb();
  db.prepare("INSERT INTO undo_stack (id, table_id, label, snapshot_json) VALUES (?, ?, ?, ?)").run(randomUUID(), tableId, label, JSON.stringify(data));
  const overflow = db.prepare("SELECT id FROM undo_stack WHERE table_id = ? ORDER BY created_at DESC LIMIT -1 OFFSET 25").all(tableId) as Array<{ id: string }>;
  for (const row of overflow) db.prepare("DELETE FROM undo_stack WHERE id = ?").run(row.id);
}

export function popUndoSnapshot(tableId: string) {
  const db = getDb();
  const row = db.prepare("SELECT id, label, snapshot_json FROM undo_stack WHERE table_id = ? ORDER BY created_at DESC LIMIT 1").get(tableId) as { id: string; label: string; snapshot_json: string } | undefined;
  if (!row) return undefined;
  db.prepare("DELETE FROM undo_stack WHERE id = ?").run(row.id);
  return { label: row.label, data: parseJson<RulebookData>(row.snapshot_json, {} as RulebookData) };
}

export function upsertLibraryItem(item: Partial<LibraryItem> & { type: LibraryItemType; name: string; payload: Record<string, unknown> }) {
  const db = getDb();
  const id = item.id || randomUUID();
  db.prepare(`
    INSERT INTO library_items (id, system_id, type, name, description, tags_json, image_url, payload_json, updated_at)
    VALUES (@id, @systemId, @type, @name, @description, @tags, @imageUrl, @payload, CURRENT_TIMESTAMP)
    ON CONFLICT(id) DO UPDATE SET system_id=excluded.system_id, type=excluded.type, name=excluded.name, description=excluded.description, tags_json=excluded.tags_json, image_url=excluded.image_url, payload_json=excluded.payload_json, updated_at=CURRENT_TIMESTAMP
  `).run({ id, systemId: item.systemId ?? null, type: item.type, name: item.name, description: item.description ?? "", tags: JSON.stringify(item.tags ?? []), imageUrl: item.imageUrl ?? null, payload: JSON.stringify(item.payload) });
  return id;
}

export function deleteLibraryItem(id: string) {
  getDb().prepare("DELETE FROM library_items WHERE id = ?").run(id);
}

export function getLibraryItem(id: string) {
  const row = getDb().prepare("SELECT * FROM library_items WHERE id = ?").get(id) as Record<string, unknown> | undefined;
  if (!row) return undefined;
  return {
    id: String(row.id),
    systemId: row.system_id ? String(row.system_id) : undefined,
    type: String(row.type) as LibraryItemType,
    name: String(row.name),
    description: String(row.description ?? ""),
    tags: parseJson(String(row.tags_json ?? "[]"), []),
    imageUrl: row.image_url ? String(row.image_url) : undefined,
    payload: parseJson<Record<string, unknown>>(String(row.payload_json ?? "{}"), {}),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  } satisfies LibraryItem;
}

export function upsertPack(pack: Partial<ContentPack> & { name: string; libraryItemIds: string[] }) {
  const id = pack.id || randomUUID();
  getDb().prepare(`
    INSERT INTO content_packs (id, name, description, item_ids_json, updated_at)
    VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(id) DO UPDATE SET name=excluded.name, description=excluded.description, item_ids_json=excluded.item_ids_json, updated_at=CURRENT_TIMESTAMP
  `).run(id, pack.name, pack.description ?? "", JSON.stringify(pack.libraryItemIds));
  return id;
}

export function deletePack(id: string) {
  getDb().prepare("DELETE FROM content_packs WHERE id = ?").run(id);
}

export function upsertRelation(relation: Omit<CampaignRelation, "id"> & { id?: string }) {
  const id = relation.id || randomUUID();
  getDb().prepare(`
    INSERT INTO campaign_relations (id, table_id, source_type, source_id, source_name, target_type, target_id, target_name, relation, note, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(id) DO UPDATE SET source_type=excluded.source_type, source_id=excluded.source_id, source_name=excluded.source_name, target_type=excluded.target_type, target_id=excluded.target_id, target_name=excluded.target_name, relation=excluded.relation, note=excluded.note, updated_at=CURRENT_TIMESTAMP
  `).run(id, relation.tableId, relation.sourceType, relation.sourceId, relation.sourceName, relation.targetType, relation.targetId, relation.targetName, relation.relation, relation.note ?? "");
  return id;
}

export function deleteRelation(tableId: string, id: string) {
  getDb().prepare("DELETE FROM campaign_relations WHERE id = ? AND table_id = ?").run(id, tableId);
}

export function upsertHandout(handout: Partial<Handout> & { tableId: string; title: string }) {
  const id = handout.id || randomUUID();
  const visibility = handout.visibility ?? "master";
  const revealedAt = visibility === "players" ? handout.revealedAt ?? nowIso() : null;
  getDb().prepare(`
    INSERT INTO handouts (id, table_id, title, content, image_url, visibility, revealed_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(id) DO UPDATE SET title=excluded.title, content=excluded.content, image_url=excluded.image_url, visibility=excluded.visibility, revealed_at=excluded.revealed_at, updated_at=CURRENT_TIMESTAMP
  `).run(id, handout.tableId, handout.title, handout.content ?? "", handout.imageUrl ?? null, visibility, revealedAt);
  return id;
}

export function deleteHandout(tableId: string, id: string) {
  getDb().prepare("DELETE FROM handouts WHERE id = ? AND table_id = ?").run(id, tableId);
}
