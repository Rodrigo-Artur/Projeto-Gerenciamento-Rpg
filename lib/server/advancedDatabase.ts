import Database from "better-sqlite3";
import { randomUUID } from "node:crypto";
import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";

import type {
  ActivityEntry,
  BackupSummary,
  CombatState,
  ContentMeta,
  ImportConflict,
  ImportPreview,
  MesaImportPackage,
  NpcSheet,
  PlayerSheet,
  RpgSystem,
  RpgTable,
  RuleArticle,
  RulebookData,
  SessionPlan,
  SheetTemplate,
  StructuredAbility,
  TableNote,
  WorldEntity,
} from "@/types/rulebook";

const DB_DIRECTORY = path.join(process.cwd(), ".local");
const DB_PATH = path.join(DB_DIRECTORY, "mesa-do-mestre.sqlite");
const DEFAULT_SYSTEM_ID = "kaiju-rpg";
const DEFAULT_TABLE_ID = "mesa-principal";

declare global {
  // eslint-disable-next-line no-var
  var mesaDoMestreAdvancedDatabase: Database.Database | undefined;
}

function parseJson<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

function nowIso() {
  return new Date().toISOString();
}

function getDb() {
  if (!existsSync(DB_DIRECTORY)) mkdirSync(DB_DIRECTORY, { recursive: true });
  if (!globalThis.mesaDoMestreAdvancedDatabase) {
    globalThis.mesaDoMestreAdvancedDatabase = new Database(DB_PATH);
    globalThis.mesaDoMestreAdvancedDatabase.pragma("journal_mode = WAL");
    globalThis.mesaDoMestreAdvancedDatabase.pragma("foreign_keys = ON");
    ensureAdvancedSchema(globalThis.mesaDoMestreAdvancedDatabase);
  }
  return globalThis.mesaDoMestreAdvancedDatabase;
}

function hasColumn(db: Database.Database, tableName: string, columnName: string) {
  const columns = db.prepare(`PRAGMA table_info(${tableName})`).all() as { name: string }[];
  return columns.some((column) => column.name === columnName);
}

function ensureAdvancedSchema(db: Database.Database) {
  if (!hasColumn(db, "rule_articles", "metadata_json")) {
    db.exec("ALTER TABLE rule_articles ADD COLUMN metadata_json TEXT NOT NULL DEFAULT '{}'");
  }
  if (!hasColumn(db, "npc_sheets", "metadata_json")) {
    db.exec("ALTER TABLE npc_sheets ADD COLUMN metadata_json TEXT NOT NULL DEFAULT '{}'");
  }
  if (!hasColumn(db, "npc_sheets", "abilities_v2_json")) {
    db.exec("ALTER TABLE npc_sheets ADD COLUMN abilities_v2_json TEXT NOT NULL DEFAULT '[]'");
  }
  if (!hasColumn(db, "player_sheets", "metadata_json")) {
    db.exec("ALTER TABLE player_sheets ADD COLUMN metadata_json TEXT NOT NULL DEFAULT '{}'");
  }
  if (!hasColumn(db, "player_sheets", "structured_abilities_json")) {
    db.exec("ALTER TABLE player_sheets ADD COLUMN structured_abilities_json TEXT NOT NULL DEFAULT '[]'");
  }

  db.exec(`
    CREATE TABLE IF NOT EXISTS sheet_templates (
      id TEXT PRIMARY KEY,
      system_id TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      kind TEXT NOT NULL,
      default_category TEXT,
      fields_json TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS workspace_entities (
      id TEXT PRIMARY KEY,
      table_id TEXT NOT NULL,
      type TEXT NOT NULL,
      name TEXT NOT NULL,
      summary TEXT NOT NULL DEFAULT '',
      content TEXT NOT NULL DEFAULT '',
      tags_json TEXT NOT NULL DEFAULT '[]',
      visibility TEXT NOT NULL DEFAULT 'master',
      favorite INTEGER NOT NULL DEFAULT 0,
      archived INTEGER NOT NULL DEFAULT 0,
      data_json TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS combat_states (
      id TEXT PRIMARY KEY,
      table_id TEXT NOT NULL,
      name TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'prepared',
      state_json TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS content_versions (
      id TEXT PRIMARY KEY,
      owner_type TEXT NOT NULL,
      owner_id TEXT NOT NULL,
      content_type TEXT NOT NULL,
      content_id TEXT NOT NULL,
      content_name TEXT NOT NULL,
      snapshot_json TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS automatic_backups (
      id TEXT PRIMARY KEY,
      table_id TEXT NOT NULL,
      reason TEXT NOT NULL,
      snapshot_json TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS recent_content (
      id TEXT PRIMARY KEY,
      table_id TEXT NOT NULL,
      content_type TEXT NOT NULL,
      content_id TEXT NOT NULL,
      content_name TEXT NOT NULL,
      opened_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_templates_system ON sheet_templates(system_id);
    CREATE INDEX IF NOT EXISTS idx_entities_table ON workspace_entities(table_id);
    CREATE INDEX IF NOT EXISTS idx_combat_table ON combat_states(table_id);
    CREATE INDEX IF NOT EXISTS idx_versions_content ON content_versions(content_type, content_id);
    CREATE INDEX IF NOT EXISTS idx_backups_table ON automatic_backups(table_id);
    CREATE INDEX IF NOT EXISTS idx_recent_table ON recent_content(table_id, opened_at);
  `);

  seedDefaultTemplates(db);
}

function seedDefaultTemplates(db: Database.Database) {
  const count = db.prepare("SELECT COUNT(*) AS total FROM sheet_templates WHERE system_id = ?").get(DEFAULT_SYSTEM_ID) as { total: number };
  if (count.total > 0) return;

  const templates: SheetTemplate[] = [
    {
      id: "kaiju-player-base",
      systemId: DEFAULT_SYSTEM_ID,
      name: "Player Kaiju RPG",
      description: "Modelo base de personagem jogador.",
      kind: "player",
      fields: [
        { id: "name", label: "Nome", type: "text", required: true, section: "Identidade" },
        { id: "tier", label: "Tier", type: "text", defaultValue: "Tier 1", section: "Identidade" },
        { id: "status", label: "Status", type: "stats", section: "Combate" },
        { id: "attributes", label: "Atributos", type: "stats", section: "Atributos" },
        { id: "resources", label: "Recursos", type: "stats", section: "Recursos" },
        { id: "abilities", label: "Habilidades", type: "abilities", section: "Habilidades" },
      ],
    },
    {
      id: "kaiju-boss-tier4",
      systemId: DEFAULT_SYSTEM_ID,
      name: "Boss Tier 4 — Kaiju RPG",
      description: "Modelo para chefes de alto nível com habilidades estruturadas.",
      kind: "boss",
      defaultCategory: "bosses",
      fields: [
        { id: "name", label: "Nome", type: "text", required: true, section: "Identidade" },
        { id: "tier", label: "Tier", type: "text", defaultValue: "Tier 4", section: "Identidade" },
        { id: "hp", label: "HP", type: "number", section: "Combate" },
        { id: "movement", label: "Movimento", type: "text", section: "Combate" },
        { id: "attributes", label: "Atributos", type: "stats", section: "Atributos" },
        { id: "abilities", label: "Habilidades", type: "abilities", section: "Habilidades" },
        { id: "weakness", label: "Fraquezas", type: "list", section: "Contrajogo" },
        { id: "drops", label: "Drops", type: "list", section: "Recompensas" },
      ],
    },
  ];

  const insert = db.prepare(`
    INSERT OR IGNORE INTO sheet_templates (id, system_id, name, description, kind, default_category, fields_json)
    VALUES (@id, @systemId, @name, @description, @kind, @defaultCategory, @fieldsJson)
  `);
  const tx = db.transaction(() => {
    for (const template of templates) {
      insert.run({
        id: template.id,
        systemId: template.systemId,
        name: template.name,
        description: template.description,
        kind: template.kind,
        defaultCategory: template.defaultCategory ?? null,
        fieldsJson: JSON.stringify(template.fields),
      });
    }
  });
  tx();
}

function getTable(db: Database.Database, tableId?: string): RpgTable {
  const row = tableId
    ? (db.prepare("SELECT id, system_id, name, description FROM rpg_tables WHERE id = ?").get(tableId) as { id: string; system_id: string; name: string; description: string } | undefined)
    : (db.prepare("SELECT id, system_id, name, description FROM rpg_tables ORDER BY created_at ASC LIMIT 1").get() as { id: string; system_id: string; name: string; description: string } | undefined);
  return row
    ? { id: row.id, systemId: row.system_id ?? DEFAULT_SYSTEM_ID, name: row.name, description: row.description }
    : { id: DEFAULT_TABLE_ID, systemId: DEFAULT_SYSTEM_ID, name: "Mesa Principal", description: "Mesa principal" };
}

function getSystem(db: Database.Database, systemId?: string): RpgSystem {
  const row = systemId
    ? (db.prepare("SELECT id, name, description FROM rpg_systems WHERE id = ?").get(systemId) as RpgSystem | undefined)
    : (db.prepare("SELECT id, name, description FROM rpg_systems ORDER BY created_at ASC LIMIT 1").get() as RpgSystem | undefined);
  return row ?? { id: DEFAULT_SYSTEM_ID, name: "Kaiju RPG", description: "Sistema base" };
}

function snapshotVersion(
  db: Database.Database,
  ownerType: "table" | "system",
  ownerId: string,
  contentType: string,
  contentId: string,
  contentName: string,
  snapshot: unknown
) {
  const id = randomUUID();
  db.prepare(`
    INSERT INTO content_versions (id, owner_type, owner_id, content_type, content_id, content_name, snapshot_json)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, ownerType, ownerId, contentType, contentId, contentName, JSON.stringify(snapshot));
  return id;
}

function addHistory(
  db: Database.Database,
  tableId: string | undefined,
  systemId: string | undefined,
  action: string,
  targetType: string,
  targetName: string,
  targetId?: string,
  snapshotId?: string,
  details?: string
) {
  const id = randomUUID();
  db.prepare(`
    INSERT INTO activity_history (id, table_id, system_id, scope, action, target_type, target_name)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, tableId ?? null, systemId ?? null, tableId ? "table" : "system", action, targetType, targetName);
  return { id, targetId, snapshotId, details };
}

function parseMeta(value: string | null | undefined): ContentMeta {
  return parseJson<ContentMeta>(value, {});
}

function scopedId(db: Database.Database, tableName: string, ownerColumn: string, ownerId: string, requestedId: string) {
  const row = db.prepare(`SELECT ${ownerColumn} AS owner_id FROM ${tableName} WHERE id = ?`).get(requestedId) as { owner_id: string } | undefined;
  if (!row || row.owner_id === ownerId) return requestedId;
  const base = `${ownerId}--${requestedId}`;
  let candidate = base;
  let suffix = 2;
  while (db.prepare(`SELECT 1 FROM ${tableName} WHERE id = ?`).get(candidate)) {
    candidate = `${base}-${suffix++}`;
  }
  return candidate;
}

export function getAdvancedExtras(tableId?: string) {
  const db = getDb();
  const table = getTable(db, tableId);
  const templates = (db.prepare("SELECT id, system_id, name, description, kind, default_category, fields_json FROM sheet_templates WHERE system_id = ? ORDER BY created_at ASC").all(table.systemId) as Array<{ id: string; system_id: string; name: string; description: string; kind: SheetTemplate["kind"]; default_category: SheetTemplate["defaultCategory"] | null; fields_json: string }>).map((row) => ({
    id: row.id,
    systemId: row.system_id,
    name: row.name,
    description: row.description,
    kind: row.kind,
    defaultCategory: row.default_category ?? undefined,
    fields: parseJson(row.fields_json, []),
  }));

  const entities = (db.prepare("SELECT id, table_id, type, name, summary, content, tags_json, visibility, favorite, archived, data_json FROM workspace_entities WHERE table_id = ? ORDER BY favorite DESC, updated_at DESC").all(table.id) as Array<{ id: string; table_id: string; type: WorldEntity["type"]; name: string; summary: string; content: string; tags_json: string; visibility: WorldEntity["visibility"]; favorite: number; archived: number; data_json: string }>).map((row) => ({
    id: row.id,
    tableId: row.table_id,
    type: row.type,
    name: row.name,
    summary: row.summary,
    content: row.content,
    tags: parseJson(row.tags_json, []),
    visibility: row.visibility,
    favorite: Boolean(row.favorite),
    archived: Boolean(row.archived),
    data: parseJson(row.data_json, {}),
  }));

  const combats = (db.prepare("SELECT id, table_id, name, status, state_json, updated_at FROM combat_states WHERE table_id = ? ORDER BY updated_at DESC").all(table.id) as Array<{ id: string; table_id: string; name: string; status: CombatState["status"]; state_json: string; updated_at: string }>).map((row) => ({
    ...parseJson<CombatState>(row.state_json, {
      id: row.id,
      tableId: row.table_id,
      name: row.name,
      round: 1,
      turnIndex: 0,
      status: row.status,
      participants: [],
      notes: [],
    }),
    id: row.id,
    tableId: row.table_id,
    name: row.name,
    status: row.status,
    updatedAt: row.updated_at,
  }));

  const backups = (db.prepare("SELECT id, table_id, reason, created_at FROM automatic_backups WHERE table_id = ? ORDER BY created_at DESC LIMIT 10").all(table.id) as Array<{ id: string; table_id: string; reason: string; created_at: string }>).map((row) => ({
    id: row.id,
    tableId: row.table_id,
    reason: row.reason,
    createdAt: row.created_at,
  })) satisfies BackupSummary[];

  return { templates, entities, combats, backups };
}

export function enrichCoreData(data: RulebookData): RulebookData {
  const db = getDb();
  const table = getTable(db, data.activeTableId);
  const extras = getAdvancedExtras(table.id);

  const rules = data.rules.map((rule) => {
    const row = db.prepare("SELECT metadata_json FROM rule_articles WHERE id = ? AND system_id = ?").get(rule.id, table.systemId) as { metadata_json: string } | undefined;
    return { ...rule, meta: parseMeta(row?.metadata_json) };
  });
  const npcs = data.npcs.map((npc) => {
    const row = db.prepare("SELECT metadata_json, abilities_v2_json FROM npc_sheets WHERE id = ? AND table_id = ?").get(npc.id, table.id) as { metadata_json: string; abilities_v2_json: string } | undefined;
    return { ...npc, meta: parseMeta(row?.metadata_json), abilities: parseJson<StructuredAbility[]>(row?.abilities_v2_json, npc.abilities ?? []) };
  });
  const players = data.players.map((player) => {
    const row = db.prepare("SELECT metadata_json, structured_abilities_json FROM player_sheets WHERE id = ? AND table_id = ?").get(player.id, table.id) as { metadata_json: string; structured_abilities_json: string } | undefined;
    return { ...player, meta: parseMeta(row?.metadata_json), structuredAbilities: parseJson<StructuredAbility[]>(row?.structured_abilities_json, player.structuredAbilities ?? []) };
  });

  return { ...data, rules, npcs, players, ...extras };
}

export function createSystemAdvanced(input: { name: string; description: string; mode?: "blank" | "clone"; sourceSystemId?: string }) {
  const db = getDb();
  const id = `${slugify(input.name) || "sistema"}-${Date.now()}`;
  db.prepare("INSERT INTO rpg_systems (id, name, description) VALUES (?, ?, ?)").run(id, input.name, input.description);

  if (input.mode === "clone" && input.sourceSystemId) {
    const rules = db.prepare("SELECT id, category, title, summary, content, tags_json, metadata_json FROM rule_articles WHERE system_id = ? ORDER BY rowid ASC").all(input.sourceSystemId) as Array<{ id: string; category: string; title: string; summary: string; content: string; tags_json: string; metadata_json: string }>;
    const insertRule = db.prepare("INSERT INTO rule_articles (id, system_id, table_id, category, title, summary, content, tags_json, metadata_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
    for (const rule of rules) {
      insertRule.run(`${id}--${rule.id}`, id, DEFAULT_TABLE_ID, rule.category, rule.title, rule.summary, rule.content, rule.tags_json, rule.metadata_json ?? "{}");
    }
    const templates = db.prepare("SELECT id, name, description, kind, default_category, fields_json FROM sheet_templates WHERE system_id = ?").all(input.sourceSystemId) as Array<{ id: string; name: string; description: string; kind: string; default_category: string | null; fields_json: string }>;
    const insertTemplate = db.prepare("INSERT INTO sheet_templates (id, system_id, name, description, kind, default_category, fields_json) VALUES (?, ?, ?, ?, ?, ?, ?)");
    for (const template of templates) insertTemplate.run(`${id}--${template.id}`, id, template.name, template.description, template.kind, template.default_category, template.fields_json);
  }

  addHistory(db, undefined, id, "criou sistema", "sistema", input.name, id);
  return { id, name: input.name, description: input.description } satisfies RpgSystem;
}

export function createTableAdvanced(input: { name: string; description: string; systemId: string }) {
  const db = getDb();
  const system = getSystem(db, input.systemId);
  const id = `${slugify(input.name) || "mesa"}-${Date.now()}`;
  db.prepare("INSERT INTO rpg_tables (id, system_id, name, description) VALUES (?, ?, ?, ?)").run(id, system.id, input.name, input.description);
  addHistory(db, id, system.id, "criou mesa", "mesa", input.name, id);
  return { id, systemId: system.id, name: input.name, description: input.description } satisfies RpgTable;
}

export function upsertRule(systemId: string, rule: RuleArticle) {
  const db = getDb();
  const existing = db.prepare("SELECT id, category, title, summary, content, tags_json, metadata_json FROM rule_articles WHERE id = ? AND system_id = ?").get(rule.id, systemId) as Record<string, unknown> | undefined;
  let snapshotId: string | undefined;
  if (existing) snapshotId = snapshotVersion(db, "system", systemId, "rule", rule.id, String(existing.title), existing);
  const id = scopedId(db, "rule_articles", "system_id", systemId, rule.id || randomUUID());
  db.prepare(`
    INSERT INTO rule_articles (id, system_id, table_id, category, title, summary, content, tags_json, metadata_json, updated_at)
    VALUES (@id, @systemId, @tableId, @category, @title, @summary, @content, @tagsJson, @metadataJson, CURRENT_TIMESTAMP)
    ON CONFLICT(id) DO UPDATE SET category=excluded.category, title=excluded.title, summary=excluded.summary, content=excluded.content, tags_json=excluded.tags_json, metadata_json=excluded.metadata_json, updated_at=CURRENT_TIMESTAMP
  `).run({ id, systemId, tableId: DEFAULT_TABLE_ID, category: rule.category, title: rule.title, summary: rule.summary, content: rule.content, tagsJson: JSON.stringify(rule.tags ?? []), metadataJson: JSON.stringify(rule.meta ?? {}) });
  addHistory(db, undefined, systemId, existing ? "editou regra" : "criou regra", "regra", rule.title, id, snapshotId);
  return { ...rule, id };
}

export function upsertNpc(tableId: string, npc: NpcSheet) {
  const db = getDb();
  const table = getTable(db, tableId);
  const existing = db.prepare("SELECT * FROM npc_sheets WHERE id = ? AND table_id = ?").get(npc.id, table.id) as Record<string, unknown> | undefined;
  let snapshotId: string | undefined;
  if (existing) snapshotId = snapshotVersion(db, "table", table.id, "npc", npc.id, String(existing.name), existing);
  const id = scopedId(db, "npc_sheets", "table_id", table.id, npc.id || randomUUID());
  db.prepare(`
    INSERT INTO npc_sheets (id, table_id, category, name, role, description, stats_json, notes_json, metadata_json, abilities_v2_json, updated_at)
    VALUES (@id, @tableId, @category, @name, @role, @description, @statsJson, @notesJson, @metadataJson, @abilitiesJson, CURRENT_TIMESTAMP)
    ON CONFLICT(id) DO UPDATE SET category=excluded.category, name=excluded.name, role=excluded.role, description=excluded.description, stats_json=excluded.stats_json, notes_json=excluded.notes_json, metadata_json=excluded.metadata_json, abilities_v2_json=excluded.abilities_v2_json, updated_at=CURRENT_TIMESTAMP
  `).run({ id, tableId: table.id, category: npc.category, name: npc.name, role: npc.role, description: npc.description, statsJson: JSON.stringify(npc.stats ?? []), notesJson: JSON.stringify(npc.notes ?? []), metadataJson: JSON.stringify(npc.meta ?? {}), abilitiesJson: JSON.stringify(npc.abilities ?? []) });
  addHistory(db, table.id, table.systemId, existing ? "editou NPC" : "criou NPC", "npc", npc.name, id, snapshotId);
  return { ...npc, id };
}

export function upsertPlayer(tableId: string, player: PlayerSheet) {
  const db = getDb();
  const table = getTable(db, tableId);
  const existing = db.prepare("SELECT * FROM player_sheets WHERE id = ? AND table_id = ?").get(player.id, table.id) as Record<string, unknown> | undefined;
  let snapshotId: string | undefined;
  if (existing) snapshotId = snapshotVersion(db, "table", table.id, "player", player.id, String(existing.character_name), existing);
  const id = scopedId(db, "player_sheets", "table_id", table.id, player.id || randomUUID());
  db.prepare(`
    INSERT INTO player_sheets (id, table_id, character_name, player_name, role, tier, concept, status_json, attributes_json, resources_json, abilities_json, notes_json, metadata_json, structured_abilities_json, updated_at)
    VALUES (@id, @tableId, @characterName, @playerName, @role, @tier, @concept, @statusJson, @attributesJson, @resourcesJson, @abilitiesJson, @notesJson, @metadataJson, @structuredAbilitiesJson, CURRENT_TIMESTAMP)
    ON CONFLICT(id) DO UPDATE SET character_name=excluded.character_name, player_name=excluded.player_name, role=excluded.role, tier=excluded.tier, concept=excluded.concept, status_json=excluded.status_json, attributes_json=excluded.attributes_json, resources_json=excluded.resources_json, abilities_json=excluded.abilities_json, notes_json=excluded.notes_json, metadata_json=excluded.metadata_json, structured_abilities_json=excluded.structured_abilities_json, updated_at=CURRENT_TIMESTAMP
  `).run({ id, tableId: table.id, characterName: player.characterName, playerName: player.playerName, role: player.role, tier: player.tier, concept: player.concept, statusJson: JSON.stringify(player.status ?? []), attributesJson: JSON.stringify(player.attributes ?? []), resourcesJson: JSON.stringify(player.resources ?? []), abilitiesJson: JSON.stringify(player.abilities ?? []), notesJson: JSON.stringify(player.notes ?? []), metadataJson: JSON.stringify(player.meta ?? {}), structuredAbilitiesJson: JSON.stringify(player.structuredAbilities ?? []) });
  addHistory(db, table.id, table.systemId, existing ? "editou player" : "criou player", "player", player.characterName, id, snapshotId);
  return { ...player, id };
}

export function deleteCoreContent(input: { type: "rule" | "npc" | "player"; id: string; tableId?: string; systemId?: string }) {
  const db = getDb();
  if (input.type === "rule") {
    const systemId = input.systemId ?? DEFAULT_SYSTEM_ID;
    const row = db.prepare("SELECT * FROM rule_articles WHERE id = ? AND system_id = ?").get(input.id, systemId) as Record<string, unknown> | undefined;
    if (!row) return false;
    const snapshotId = snapshotVersion(db, "system", systemId, "rule", input.id, String(row.title), row);
    db.prepare("DELETE FROM rule_articles WHERE id = ? AND system_id = ?").run(input.id, systemId);
    addHistory(db, undefined, systemId, "excluiu regra", "regra", String(row.title), input.id, snapshotId);
    return true;
  }
  const table = getTable(db, input.tableId);
  const tableName = input.type === "npc" ? "npc_sheets" : "player_sheets";
  const nameColumn = input.type === "npc" ? "name" : "character_name";
  const row = db.prepare(`SELECT * FROM ${tableName} WHERE id = ? AND table_id = ?`).get(input.id, table.id) as Record<string, unknown> | undefined;
  if (!row) return false;
  const snapshotId = snapshotVersion(db, "table", table.id, input.type, input.id, String(row[nameColumn]), row);
  db.prepare(`DELETE FROM ${tableName} WHERE id = ? AND table_id = ?`).run(input.id, table.id);
  addHistory(db, table.id, table.systemId, `excluiu ${input.type}`, input.type, String(row[nameColumn]), input.id, snapshotId);
  return true;
}

function getNotesSessions(db: Database.Database, tableId: string) {
  const row = db.prepare("SELECT notes_json, sessions_json FROM rpg_tables WHERE id = ?").get(tableId) as { notes_json: string; sessions_json: string } | undefined;
  return { notes: parseJson<TableNote[]>(row?.notes_json, []), sessions: parseJson<SessionPlan[]>(row?.sessions_json, []) };
}

export function upsertNote(tableId: string, note: TableNote) {
  const db = getDb();
  const table = getTable(db, tableId);
  const extras = getNotesSessions(db, table.id);
  const existing = extras.notes.find((item) => item.id === note.id);
  if (existing) snapshotVersion(db, "table", table.id, "note", note.id, note.title, existing);
  const id = note.id || randomUUID();
  const notes = existing ? extras.notes.map((item) => item.id === note.id ? { ...note, id } : item) : [...extras.notes, { ...note, id }];
  db.prepare("UPDATE rpg_tables SET notes_json = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(JSON.stringify(notes), table.id);
  addHistory(db, table.id, table.systemId, existing ? "editou anotação" : "criou anotação", "nota", note.title, id);
  return { ...note, id };
}

export function upsertSession(tableId: string, session: SessionPlan) {
  const db = getDb();
  const table = getTable(db, tableId);
  const extras = getNotesSessions(db, table.id);
  const existing = extras.sessions.find((item) => item.id === session.id);
  if (existing) snapshotVersion(db, "table", table.id, "session", session.id, session.title, existing);
  const id = session.id || randomUUID();
  const sessions = existing ? extras.sessions.map((item) => item.id === session.id ? { ...session, id } : item) : [...extras.sessions, { ...session, id }];
  db.prepare("UPDATE rpg_tables SET sessions_json = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(JSON.stringify(sessions), table.id);
  addHistory(db, table.id, table.systemId, existing ? "editou sessão" : "criou sessão", "sessão", session.title, id);
  return { ...session, id };
}

export function deleteExtra(tableId: string, type: "note" | "session", id: string) {
  const db = getDb();
  const table = getTable(db, tableId);
  const extras = getNotesSessions(db, table.id);
  if (type === "note") {
    const existing = extras.notes.find((item) => item.id === id);
    if (!existing) return false;
    const snapshotId = snapshotVersion(db, "table", table.id, "note", id, existing.title, existing);
    db.prepare("UPDATE rpg_tables SET notes_json = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(JSON.stringify(extras.notes.filter((item) => item.id !== id)), table.id);
    addHistory(db, table.id, table.systemId, "excluiu anotação", "nota", existing.title, id, snapshotId);
    return true;
  }
  const existing = extras.sessions.find((item) => item.id === id);
  if (!existing) return false;
  const snapshotId = snapshotVersion(db, "table", table.id, "session", id, existing.title, existing);
  db.prepare("UPDATE rpg_tables SET sessions_json = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(JSON.stringify(extras.sessions.filter((item) => item.id !== id)), table.id);
  addHistory(db, table.id, table.systemId, "excluiu sessão", "sessão", existing.title, id, snapshotId);
  return true;
}

export function upsertTemplate(template: SheetTemplate) {
  const db = getDb();
  const id = scopedId(db, "sheet_templates", "system_id", template.systemId, template.id || randomUUID());
  db.prepare(`
    INSERT INTO sheet_templates (id, system_id, name, description, kind, default_category, fields_json, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(id) DO UPDATE SET name=excluded.name, description=excluded.description, kind=excluded.kind, default_category=excluded.default_category, fields_json=excluded.fields_json, updated_at=CURRENT_TIMESTAMP
  `).run(id, template.systemId, template.name, template.description, template.kind, template.defaultCategory ?? null, JSON.stringify(template.fields ?? []));
  addHistory(db, undefined, template.systemId, "salvou template", "template", template.name, id);
  return { ...template, id };
}

export function deleteTemplate(systemId: string, id: string) {
  const db = getDb();
  const row = db.prepare("SELECT name FROM sheet_templates WHERE id = ? AND system_id = ?").get(id, systemId) as { name: string } | undefined;
  if (!row) return false;
  db.prepare("DELETE FROM sheet_templates WHERE id = ? AND system_id = ?").run(id, systemId);
  addHistory(db, undefined, systemId, "excluiu template", "template", row.name, id);
  return true;
}

export function upsertEntity(entity: WorldEntity) {
  const db = getDb();
  const table = getTable(db, entity.tableId);
  const id = scopedId(db, "workspace_entities", "table_id", table.id, entity.id || randomUUID());
  db.prepare(`
    INSERT INTO workspace_entities (id, table_id, type, name, summary, content, tags_json, visibility, favorite, archived, data_json, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(id) DO UPDATE SET type=excluded.type, name=excluded.name, summary=excluded.summary, content=excluded.content, tags_json=excluded.tags_json, visibility=excluded.visibility, favorite=excluded.favorite, archived=excluded.archived, data_json=excluded.data_json, updated_at=CURRENT_TIMESTAMP
  `).run(id, table.id, entity.type, entity.name, entity.summary, entity.content, JSON.stringify(entity.tags ?? []), entity.visibility ?? "master", entity.favorite ? 1 : 0, entity.archived ? 1 : 0, JSON.stringify(entity.data ?? {}));
  addHistory(db, table.id, table.systemId, "salvou entidade", entity.type, entity.name, id);
  return { ...entity, id, tableId: table.id };
}

export function deleteEntity(tableId: string, id: string) {
  const db = getDb();
  const table = getTable(db, tableId);
  const row = db.prepare("SELECT type, name FROM workspace_entities WHERE id = ? AND table_id = ?").get(id, table.id) as { type: string; name: string } | undefined;
  if (!row) return false;
  db.prepare("DELETE FROM workspace_entities WHERE id = ? AND table_id = ?").run(id, table.id);
  addHistory(db, table.id, table.systemId, "excluiu entidade", row.type, row.name, id);
  return true;
}

export function saveCombat(combat: CombatState) {
  const db = getDb();
  const table = getTable(db, combat.tableId);
  const id = combat.id || randomUUID();
  const normalized = { ...combat, id, tableId: table.id, updatedAt: nowIso() };
  db.prepare(`
    INSERT INTO combat_states (id, table_id, name, status, state_json, updated_at)
    VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(id) DO UPDATE SET name=excluded.name, status=excluded.status, state_json=excluded.state_json, updated_at=CURRENT_TIMESTAMP
  `).run(id, table.id, normalized.name, normalized.status, JSON.stringify(normalized));
  addHistory(db, table.id, table.systemId, "atualizou combate", "combate", normalized.name, id);
  return normalized;
}

export function deleteCombat(tableId: string, id: string) {
  const db = getDb();
  const table = getTable(db, tableId);
  const row = db.prepare("SELECT name FROM combat_states WHERE id = ? AND table_id = ?").get(id, table.id) as { name: string } | undefined;
  if (!row) return false;
  db.prepare("DELETE FROM combat_states WHERE id = ? AND table_id = ?").run(id, table.id);
  addHistory(db, table.id, table.systemId, "excluiu combate", "combate", row.name, id);
  return true;
}

function currentCorePackage(db: Database.Database, tableId: string): MesaImportPackage {
  const table = getTable(db, tableId);
  const system = getSystem(db, table.systemId);
  const rules = (db.prepare("SELECT id, category, title, summary, content, tags_json, metadata_json FROM rule_articles WHERE system_id = ? ORDER BY rowid ASC").all(system.id) as Array<{ id: string; category: RuleArticle["category"]; title: string; summary: string; content: string; tags_json: string; metadata_json: string }>).map((row) => ({ id: row.id, category: row.category, title: row.title, summary: row.summary, content: row.content, tags: parseJson(row.tags_json, []), meta: parseMeta(row.metadata_json) }));
  const npcs = (db.prepare("SELECT id, category, name, role, description, stats_json, notes_json, metadata_json, abilities_v2_json FROM npc_sheets WHERE table_id = ? ORDER BY rowid ASC").all(table.id) as Array<{ id: string; category: NpcSheet["category"]; name: string; role: string; description: string; stats_json: string; notes_json: string; metadata_json: string; abilities_v2_json: string }>).map((row) => ({ id: row.id, category: row.category, name: row.name, role: row.role, description: row.description, stats: parseJson(row.stats_json, []), notes: parseJson(row.notes_json, []), meta: parseMeta(row.metadata_json), abilities: parseJson(row.abilities_v2_json, []) }));
  const players = (db.prepare("SELECT id, character_name, player_name, role, tier, concept, status_json, attributes_json, resources_json, abilities_json, notes_json, metadata_json, structured_abilities_json FROM player_sheets WHERE table_id = ? ORDER BY rowid ASC").all(table.id) as Array<{ id: string; character_name: string; player_name: string; role: string; tier: string; concept: string; status_json: string; attributes_json: string; resources_json: string; abilities_json: string; notes_json: string; metadata_json: string; structured_abilities_json: string }>).map((row) => ({ id: row.id, characterName: row.character_name, playerName: row.player_name, role: row.role, tier: row.tier, concept: row.concept, status: parseJson(row.status_json, []), attributes: parseJson(row.attributes_json, []), resources: parseJson(row.resources_json, []), abilities: parseJson(row.abilities_json, []), notes: parseJson(row.notes_json, []), meta: parseMeta(row.metadata_json), structuredAbilities: parseJson(row.structured_abilities_json, []) }));
  const extras = getNotesSessions(db, table.id);
  const advanced = getAdvancedExtras(table.id);
  return {
    format: "mesa-do-mestre",
    version: 2,
    packageType: "system+table-content",
    exportedAt: nowIso(),
    system,
    table,
    data: { rules, npcs, players, notes: extras.notes, sessions: extras.sessions, templates: advanced.templates, entities: advanced.entities },
  };
}

export function createAutomaticBackup(tableId: string, reason: string) {
  const db = getDb();
  const table = getTable(db, tableId);
  const id = randomUUID();
  const snapshot = currentCorePackage(db, table.id);
  db.prepare("INSERT INTO automatic_backups (id, table_id, reason, snapshot_json) VALUES (?, ?, ?, ?)").run(id, table.id, reason, JSON.stringify(snapshot));
  const old = db.prepare("SELECT id FROM automatic_backups WHERE table_id = ? ORDER BY created_at DESC LIMIT -1 OFFSET 10").all(table.id) as { id: string }[];
  for (const item of old) db.prepare("DELETE FROM automatic_backups WHERE id = ?").run(item.id);
  return { id, tableId: table.id, reason, createdAt: nowIso() } satisfies BackupSummary;
}

export function exportPackage(tableId: string) {
  const db = getDb();
  return currentCorePackage(db, getTable(db, tableId).id);
}

function normalizeImportPackage(input: unknown): MesaImportPackage {
  const raw = input as Record<string, unknown>;
  const wrapped = raw && typeof raw === "object" && raw.data && typeof raw.data === "object" ? raw : { data: raw };
  const data = (wrapped.data ?? {}) as Record<string, unknown>;
  return {
    format: (wrapped.format === "mesa-do-mestre" || wrapped.format === "mesa-do-mestre-import-json" ? wrapped.format : "mesa-do-mestre-import-json") as MesaImportPackage["format"],
    version: typeof wrapped.version === "number" ? wrapped.version : 1,
    packageType: (typeof wrapped.packageType === "string" ? wrapped.packageType : "content") as MesaImportPackage["packageType"],
    exportedAt: typeof wrapped.exportedAt === "string" ? wrapped.exportedAt : undefined,
    system: (wrapped.system ?? undefined) as MesaImportPackage["system"],
    table: (wrapped.table ?? undefined) as MesaImportPackage["table"],
    data: {
      rules: Array.isArray(data.rules) ? data.rules as RuleArticle[] : [],
      npcs: Array.isArray(data.npcs) ? data.npcs as NpcSheet[] : [],
      players: Array.isArray(data.players) ? data.players as PlayerSheet[] : [],
      notes: Array.isArray(data.notes) ? data.notes as TableNote[] : [],
      sessions: Array.isArray(data.sessions) ? data.sessions as SessionPlan[] : [],
      templates: Array.isArray(data.templates) ? data.templates as SheetTemplate[] : [],
      entities: Array.isArray(data.entities) ? data.entities as WorldEntity[] : [],
    },
  };
}

export function previewImport(tableId: string, input: unknown): ImportPreview {
  const db = getDb();
  const table = getTable(db, tableId);
  const pkg = normalizeImportPackage(input);
  const conflicts: ImportConflict[] = [];
  const check = (section: ImportConflict["section"], items: Array<{ id: string; name?: string; title?: string; characterName?: string }>, exists: (id: string) => boolean) => {
    for (const item of items) if (exists(item.id)) conflicts.push({ section, id: item.id, name: item.name ?? item.title ?? item.characterName ?? item.id });
  };
  check("rules", pkg.data.rules ?? [], (id) => Boolean(db.prepare("SELECT 1 FROM rule_articles WHERE id = ? AND system_id = ?").get(id, table.systemId)));
  check("npcs", pkg.data.npcs ?? [], (id) => Boolean(db.prepare("SELECT 1 FROM npc_sheets WHERE id = ? AND table_id = ?").get(id, table.id)));
  check("players", pkg.data.players ?? [], (id) => Boolean(db.prepare("SELECT 1 FROM player_sheets WHERE id = ? AND table_id = ?").get(id, table.id)));
  const extras = getNotesSessions(db, table.id);
  check("notes", pkg.data.notes ?? [], (id) => extras.notes.some((item) => item.id === id));
  check("sessions", pkg.data.sessions ?? [], (id) => extras.sessions.some((item) => item.id === id));
  check("templates", pkg.data.templates ?? [], (id) => Boolean(db.prepare("SELECT 1 FROM sheet_templates WHERE id = ? AND system_id = ?").get(id, table.systemId)));
  check("entities", pkg.data.entities ?? [], (id) => Boolean(db.prepare("SELECT 1 FROM workspace_entities WHERE id = ? AND table_id = ?").get(id, table.id)));
  return {
    counts: {
      rules: pkg.data.rules?.length ?? 0,
      npcs: pkg.data.npcs?.length ?? 0,
      players: pkg.data.players?.length ?? 0,
      notes: pkg.data.notes?.length ?? 0,
      sessions: pkg.data.sessions?.length ?? 0,
      templates: pkg.data.templates?.length ?? 0,
      entities: pkg.data.entities?.length ?? 0,
    },
    conflicts,
    formatVersion: pkg.version,
    packageType: pkg.packageType,
  };
}

export function importPackage(input: {
  tableId: string;
  payload: unknown;
  mode?: "merge" | "replace";
  conflict?: "skip" | "replace" | "copy";
  sections?: Array<"rules" | "npcs" | "players" | "notes" | "sessions" | "templates" | "entities">;
}) {
  const db = getDb();
  const table = getTable(db, input.tableId);
  const pkg = normalizeImportPackage(input.payload);
  const sections = new Set(input.sections ?? ["rules", "npcs", "players", "notes", "sessions", "templates", "entities"]);
  const conflict = input.conflict ?? "skip";
  createAutomaticBackup(table.id, "Antes de importar arquivo");

  const tx = db.transaction(() => {
    if (input.mode === "replace") {
      if (sections.has("rules")) db.prepare("DELETE FROM rule_articles WHERE system_id = ?").run(table.systemId);
      if (sections.has("npcs")) db.prepare("DELETE FROM npc_sheets WHERE table_id = ?").run(table.id);
      if (sections.has("players")) db.prepare("DELETE FROM player_sheets WHERE table_id = ?").run(table.id);
      if (sections.has("templates")) db.prepare("DELETE FROM sheet_templates WHERE system_id = ?").run(table.systemId);
      if (sections.has("entities")) db.prepare("DELETE FROM workspace_entities WHERE table_id = ?").run(table.id);
      const extras = getNotesSessions(db, table.id);
      db.prepare("UPDATE rpg_tables SET notes_json = ?, sessions_json = ? WHERE id = ?").run(
        JSON.stringify(sections.has("notes") ? [] : extras.notes),
        JSON.stringify(sections.has("sessions") ? [] : extras.sessions),
        table.id
      );
    }

    const resolveConflictId = (section: string, id: string, exists: () => boolean) => {
      if (!exists()) return id;
      if (conflict === "skip") return null;
      if (conflict === "replace") return id;
      return `${id}-copy-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    };

    if (sections.has("rules")) for (const rule of pkg.data.rules ?? []) {
      const id = resolveConflictId("rules", rule.id, () => Boolean(db.prepare("SELECT 1 FROM rule_articles WHERE id = ? AND system_id = ?").get(rule.id, table.systemId)));
      if (id) upsertRule(table.systemId, { ...rule, id });
    }
    if (sections.has("npcs")) for (const npc of pkg.data.npcs ?? []) {
      const id = resolveConflictId("npcs", npc.id, () => Boolean(db.prepare("SELECT 1 FROM npc_sheets WHERE id = ? AND table_id = ?").get(npc.id, table.id)));
      if (id) upsertNpc(table.id, { ...npc, id });
    }
    if (sections.has("players")) for (const player of pkg.data.players ?? []) {
      const id = resolveConflictId("players", player.id, () => Boolean(db.prepare("SELECT 1 FROM player_sheets WHERE id = ? AND table_id = ?").get(player.id, table.id)));
      if (id) upsertPlayer(table.id, { ...player, id });
    }
    if (sections.has("notes")) for (const note of pkg.data.notes ?? []) {
      const extras = getNotesSessions(db, table.id);
      const id = resolveConflictId("notes", note.id, () => extras.notes.some((item) => item.id === note.id));
      if (id) upsertNote(table.id, { ...note, id });
    }
    if (sections.has("sessions")) for (const session of pkg.data.sessions ?? []) {
      const extras = getNotesSessions(db, table.id);
      const id = resolveConflictId("sessions", session.id, () => extras.sessions.some((item) => item.id === session.id));
      if (id) upsertSession(table.id, { ...session, id });
    }
    if (sections.has("templates")) for (const template of pkg.data.templates ?? []) {
      const id = resolveConflictId("templates", template.id, () => Boolean(db.prepare("SELECT 1 FROM sheet_templates WHERE id = ? AND system_id = ?").get(template.id, table.systemId)));
      if (id) upsertTemplate({ ...template, id, systemId: table.systemId });
    }
    if (sections.has("entities")) for (const entity of pkg.data.entities ?? []) {
      const id = resolveConflictId("entities", entity.id, () => Boolean(db.prepare("SELECT 1 FROM workspace_entities WHERE id = ? AND table_id = ?").get(entity.id, table.id)));
      if (id) upsertEntity({ ...entity, id, tableId: table.id });
    }
  });
  tx();
  addHistory(db, table.id, table.systemId, "importou pacote", "importação", `Pacote v${pkg.version}`);
  return previewImport(table.id, pkg);
}

export function restoreBackup(tableId: string, backupId: string) {
  const db = getDb();
  const table = getTable(db, tableId);
  const row = db.prepare("SELECT snapshot_json FROM automatic_backups WHERE id = ? AND table_id = ?").get(backupId, table.id) as { snapshot_json: string } | undefined;
  if (!row) return false;
  createAutomaticBackup(table.id, "Antes de restaurar backup");
  importPackage({ tableId: table.id, payload: parseJson(row.snapshot_json, {}), mode: "replace", conflict: "replace" });
  addHistory(db, table.id, table.systemId, "restaurou backup", "backup", backupId, backupId);
  return true;
}

export function recordRecent(tableId: string, contentType: string, contentId: string, contentName: string) {
  const db = getDb();
  const table = getTable(db, tableId);
  db.prepare("DELETE FROM recent_content WHERE table_id = ? AND content_type = ? AND content_id = ?").run(table.id, contentType, contentId);
  db.prepare("INSERT INTO recent_content (id, table_id, content_type, content_id, content_name) VALUES (?, ?, ?, ?, ?)").run(randomUUID(), table.id, contentType, contentId, contentName);
  const old = db.prepare("SELECT id FROM recent_content WHERE table_id = ? ORDER BY opened_at DESC LIMIT -1 OFFSET 20").all(table.id) as { id: string }[];
  for (const item of old) db.prepare("DELETE FROM recent_content WHERE id = ?").run(item.id);
}

export function getRecent(tableId: string) {
  const db = getDb();
  const table = getTable(db, tableId);
  return db.prepare("SELECT content_type AS type, content_id AS id, content_name AS name, opened_at AS openedAt FROM recent_content WHERE table_id = ? ORDER BY opened_at DESC LIMIT 12").all(table.id) as Array<{ type: string; id: string; name: string; openedAt: string }>;
}

export function globalSearch(tableId: string, query: string, playerView = false) {
  const db = getDb();
  const table = getTable(db, tableId);
  const q = `%${query.trim()}%`;
  if (!query.trim()) return [];
  const results: Array<{ type: string; id: string; name: string; description: string }> = [];
  const ruleRows = db.prepare("SELECT id, title, summary, metadata_json FROM rule_articles WHERE system_id = ? AND (title LIKE ? OR summary LIKE ? OR content LIKE ?) LIMIT 20").all(table.systemId, q, q, q) as Array<{ id: string; title: string; summary: string; metadata_json: string }>;
  for (const row of ruleRows) if (!playerView || parseMeta(row.metadata_json).visibility === "players") results.push({ type: "rule", id: row.id, name: row.title, description: row.summary });
  const npcRows = db.prepare("SELECT id, name, role, metadata_json FROM npc_sheets WHERE table_id = ? AND (name LIKE ? OR role LIKE ? OR description LIKE ? OR notes_json LIKE ?) LIMIT 20").all(table.id, q, q, q, q) as Array<{ id: string; name: string; role: string; metadata_json: string }>;
  for (const row of npcRows) if (!playerView || parseMeta(row.metadata_json).visibility === "players") results.push({ type: "npc", id: row.id, name: row.name, description: row.role });
  const playerRows = db.prepare("SELECT id, character_name, role, metadata_json FROM player_sheets WHERE table_id = ? AND (character_name LIKE ? OR player_name LIKE ? OR role LIKE ? OR concept LIKE ?) LIMIT 20").all(table.id, q, q, q, q) as Array<{ id: string; character_name: string; role: string; metadata_json: string }>;
  for (const row of playerRows) if (!playerView || parseMeta(row.metadata_json).visibility === "players") results.push({ type: "player", id: row.id, name: row.character_name, description: row.role });
  const entityRows = db.prepare("SELECT id, type, name, summary, visibility FROM workspace_entities WHERE table_id = ? AND archived = 0 AND (name LIKE ? OR summary LIKE ? OR content LIKE ? OR tags_json LIKE ?) LIMIT 30").all(table.id, q, q, q, q) as Array<{ id: string; type: string; name: string; summary: string; visibility: string }>;
  for (const row of entityRows) if (!playerView || row.visibility === "players") results.push({ type: row.type, id: row.id, name: row.name, description: row.summary });
  return results;
}

export function getVersions(contentType: string, contentId: string) {
  const db = getDb();
  return db.prepare("SELECT id, content_name AS contentName, snapshot_json AS snapshotJson, created_at AS createdAt FROM content_versions WHERE content_type = ? AND content_id = ? ORDER BY created_at DESC LIMIT 20").all(contentType, contentId) as Array<{ id: string; contentName: string; snapshotJson: string; createdAt: string }>;
}
