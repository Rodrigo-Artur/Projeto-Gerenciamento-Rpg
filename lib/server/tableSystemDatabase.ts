import Database from "better-sqlite3";
import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";

import { extraNpcSheets } from "@/data/extraNpcSeeds";
import {
  initialNpcSheets,
  initialPlayerSheets,
  initialRuleArticles,
} from "@/data/systemRules";
import type {
  NpcSheet,
  PlayerSheet,
  RpgSystem,
  RpgTable,
  RuleArticle,
  RulebookContent,
  RulebookData,
  SheetCategory,
} from "@/types/rulebook";

type SystemRow = {
  id: string;
  name: string;
  description: string;
};

type TableRow = {
  id: string;
  system_id: string | null;
  name: string;
  description: string;
};

type RuleRow = {
  id: string;
  category: RuleArticle["category"];
  title: string;
  summary: string;
  content: string;
  tags_json: string;
};

type NpcRow = {
  id: string;
  category: SheetCategory | null;
  name: string;
  role: string;
  description: string;
  stats_json: string;
  notes_json: string;
};

type PlayerRow = {
  id: string;
  character_name: string;
  player_name: string;
  role: string;
  tier: string;
  concept: string;
  status_json: string;
  attributes_json: string;
  resources_json: string;
  abilities_json: string;
  notes_json: string;
};

const DB_DIRECTORY = path.join(process.cwd(), ".local");
const DB_PATH = path.join(DB_DIRECTORY, "mesa-do-mestre.sqlite");
const DEFAULT_SYSTEM_ID = "kaiju-rpg";
const DEFAULT_TABLE_ID = "mesa-principal";
const allInitialNpcSheets = [...initialNpcSheets, ...extraNpcSheets];

declare global {
  // eslint-disable-next-line no-var
  var mesaDoMestreV2Database: Database.Database | undefined;
}

function parseJson<T>(value: string, fallback: T): T {
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

function getDatabase() {
  if (!existsSync(DB_DIRECTORY)) {
    mkdirSync(DB_DIRECTORY, { recursive: true });
  }

  if (!globalThis.mesaDoMestreV2Database) {
    globalThis.mesaDoMestreV2Database = new Database(DB_PATH);
    globalThis.mesaDoMestreV2Database.pragma("journal_mode = WAL");
    globalThis.mesaDoMestreV2Database.pragma("foreign_keys = ON");
    createSchema(globalThis.mesaDoMestreV2Database);
    runMigrations(globalThis.mesaDoMestreV2Database);
    seedInitialData(globalThis.mesaDoMestreV2Database);
  }

  return globalThis.mesaDoMestreV2Database;
}

function createSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS rpg_systems (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS rpg_tables (
      id TEXT PRIMARY KEY,
      system_id TEXT NOT NULL DEFAULT '${DEFAULT_SYSTEM_ID}',
      name TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS rule_articles (
      id TEXT PRIMARY KEY,
      system_id TEXT NOT NULL DEFAULT '${DEFAULT_SYSTEM_ID}',
      table_id TEXT NOT NULL DEFAULT '${DEFAULT_TABLE_ID}',
      category TEXT NOT NULL,
      title TEXT NOT NULL,
      summary TEXT NOT NULL,
      content TEXT NOT NULL,
      tags_json TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS npc_sheets (
      id TEXT PRIMARY KEY,
      table_id TEXT NOT NULL DEFAULT '${DEFAULT_TABLE_ID}',
      category TEXT NOT NULL DEFAULT 'criminosos',
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      description TEXT NOT NULL,
      stats_json TEXT NOT NULL DEFAULT '[]',
      notes_json TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS player_sheets (
      id TEXT PRIMARY KEY,
      table_id TEXT NOT NULL DEFAULT '${DEFAULT_TABLE_ID}',
      character_name TEXT NOT NULL,
      player_name TEXT NOT NULL,
      role TEXT NOT NULL,
      tier TEXT NOT NULL,
      concept TEXT NOT NULL,
      status_json TEXT NOT NULL DEFAULT '[]',
      attributes_json TEXT NOT NULL DEFAULT '[]',
      resources_json TEXT NOT NULL DEFAULT '[]',
      abilities_json TEXT NOT NULL DEFAULT '[]',
      notes_json TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

function hasColumn(db: Database.Database, tableName: string, columnName: string) {
  const columns = db.prepare(`PRAGMA table_info(${tableName})`).all() as { name: string }[];
  return columns.some((column) => column.name === columnName);
}

function runMigrations(db: Database.Database) {
  if (!hasColumn(db, "rpg_tables", "system_id")) {
    db.exec(`ALTER TABLE rpg_tables ADD COLUMN system_id TEXT NOT NULL DEFAULT '${DEFAULT_SYSTEM_ID}'`);
  }

  if (!hasColumn(db, "rule_articles", "system_id")) {
    db.exec(`ALTER TABLE rule_articles ADD COLUMN system_id TEXT NOT NULL DEFAULT '${DEFAULT_SYSTEM_ID}'`);
  }

  if (!hasColumn(db, "rule_articles", "table_id")) {
    db.exec(`ALTER TABLE rule_articles ADD COLUMN table_id TEXT NOT NULL DEFAULT '${DEFAULT_TABLE_ID}'`);
  }

  if (!hasColumn(db, "npc_sheets", "table_id")) {
    db.exec(`ALTER TABLE npc_sheets ADD COLUMN table_id TEXT NOT NULL DEFAULT '${DEFAULT_TABLE_ID}'`);
  }

  if (!hasColumn(db, "npc_sheets", "category")) {
    db.exec("ALTER TABLE npc_sheets ADD COLUMN category TEXT NOT NULL DEFAULT 'criminosos'");
  }

  if (!hasColumn(db, "player_sheets", "table_id")) {
    db.exec(`ALTER TABLE player_sheets ADD COLUMN table_id TEXT NOT NULL DEFAULT '${DEFAULT_TABLE_ID}'`);
  }

  db.prepare(
    `INSERT OR IGNORE INTO rpg_systems (id, name, description)
     VALUES (?, ?, ?)`
  ).run(
    DEFAULT_SYSTEM_ID,
    "Kaiju RPG",
    "Sistema base do projeto, com regras, fichas e referências do Kaiju RPG."
  );

  db.prepare(
    `INSERT OR IGNORE INTO rpg_tables (id, system_id, name, description)
     VALUES (?, ?, ?, ?)`
  ).run(
    DEFAULT_TABLE_ID,
    DEFAULT_SYSTEM_ID,
    "Mesa Principal",
    "Mesa criada automaticamente com os dados que já existiam antes do suporte a múltiplas mesas."
  );
}

function seedInitialData(db: Database.Database) {
  const existingRules = db
    .prepare("SELECT COUNT(*) AS total FROM rule_articles WHERE system_id = ?")
    .get(DEFAULT_SYSTEM_ID) as { total: number };
  const existingPlayers = db
    .prepare("SELECT COUNT(*) AS total FROM player_sheets WHERE table_id = ?")
    .get(DEFAULT_TABLE_ID) as { total: number };

  if (existingRules.total === 0) {
    insertRules(db, DEFAULT_SYSTEM_ID, initialRuleArticles);
  }

  if (existingPlayers.total === 0) {
    insertPlayers(db, DEFAULT_TABLE_ID, initialPlayerSheets);
  }

  insertNpcs(db, DEFAULT_TABLE_ID, allInitialNpcSheets);
}

function prefixId(ownerId: string, id: string) {
  return ownerId === DEFAULT_SYSTEM_ID || ownerId === DEFAULT_TABLE_ID ? id : `${ownerId}--${id}`;
}

function cloneRulesForSystem(systemId: string): RuleArticle[] {
  return initialRuleArticles.map((rule) => ({
    ...rule,
    id: prefixId(systemId, rule.id),
  }));
}

function cloneSheetsForTable(tableId: string) {
  return {
    npcs: tableId === DEFAULT_TABLE_ID ? allInitialNpcSheets : [],
    players: tableId === DEFAULT_TABLE_ID ? initialPlayerSheets : [],
  };
}

function insertRules(db: Database.Database, systemId: string, rules: RuleArticle[]) {
  const insertRule = db.prepare(`
    INSERT OR IGNORE INTO rule_articles (id, system_id, table_id, category, title, summary, content, tags_json)
    VALUES (@id, @systemId, @tableId, @category, @title, @summary, @content, @tagsJson)
  `);

  const transaction = db.transaction((items: RuleArticle[]) => {
    for (const rule of items) {
      insertRule.run({
        id: rule.id,
        systemId,
        tableId: DEFAULT_TABLE_ID,
        category: rule.category,
        title: rule.title,
        summary: rule.summary,
        content: rule.content,
        tagsJson: JSON.stringify(rule.tags),
      });
    }
  });

  transaction(rules);
}

function insertNpcs(db: Database.Database, tableId: string, npcs: NpcSheet[]) {
  const insertNpc = db.prepare(`
    INSERT OR IGNORE INTO npc_sheets (id, table_id, category, name, role, description, stats_json, notes_json)
    VALUES (@id, @tableId, @category, @name, @role, @description, @statsJson, @notesJson)
  `);

  const transaction = db.transaction((items: NpcSheet[]) => {
    for (const npc of items) {
      insertNpc.run({
        id: prefixId(tableId, npc.id),
        tableId,
        category: npc.category,
        name: npc.name,
        role: npc.role,
        description: npc.description,
        statsJson: JSON.stringify(npc.stats),
        notesJson: JSON.stringify(npc.notes),
      });
    }
  });

  transaction(npcs);
}

function insertPlayers(db: Database.Database, tableId: string, players: PlayerSheet[]) {
  const insertPlayer = db.prepare(`
    INSERT OR IGNORE INTO player_sheets (
      id,
      table_id,
      character_name,
      player_name,
      role,
      tier,
      concept,
      status_json,
      attributes_json,
      resources_json,
      abilities_json,
      notes_json
    ) VALUES (
      @id,
      @tableId,
      @characterName,
      @playerName,
      @role,
      @tier,
      @concept,
      @statusJson,
      @attributesJson,
      @resourcesJson,
      @abilitiesJson,
      @notesJson
    )
  `);

  const transaction = db.transaction((items: PlayerSheet[]) => {
    for (const player of items) {
      insertPlayer.run({
        id: prefixId(tableId, player.id),
        tableId,
        characterName: player.characterName,
        playerName: player.playerName,
        role: player.role,
        tier: player.tier,
        concept: player.concept,
        statusJson: JSON.stringify(player.status),
        attributesJson: JSON.stringify(player.attributes),
        resourcesJson: JSON.stringify(player.resources),
        abilitiesJson: JSON.stringify(player.abilities),
        notesJson: JSON.stringify(player.notes),
      });
    }
  });

  transaction(players);
}

function getSystems(db: Database.Database): RpgSystem[] {
  const rows = db
    .prepare("SELECT id, name, description FROM rpg_systems ORDER BY created_at ASC, rowid ASC")
    .all() as SystemRow[];

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    description: row.description,
  }));
}

function getTables(db: Database.Database): RpgTable[] {
  const rows = db
    .prepare("SELECT id, system_id, name, description FROM rpg_tables ORDER BY created_at ASC, rowid ASC")
    .all() as TableRow[];

  return rows.map((row) => ({
    id: row.id,
    systemId: row.system_id ?? DEFAULT_SYSTEM_ID,
    name: row.name,
    description: row.description,
  }));
}

function resolveTable(db: Database.Database, tableId?: string) {
  const tables = getTables(db);

  if (tableId) {
    const table = tables.find((item) => item.id === tableId);
    if (table) return table;
  }

  return tables[0] ?? {
    id: DEFAULT_TABLE_ID,
    systemId: DEFAULT_SYSTEM_ID,
    name: "Mesa Principal",
    description: "Mesa principal.",
  };
}

function resolveSystemId(db: Database.Database, systemId?: string) {
  const systems = getSystems(db);

  if (systemId && systems.some((system) => system.id === systemId)) {
    return systemId;
  }

  return systems[0]?.id ?? DEFAULT_SYSTEM_ID;
}

export function getLocalDatabasePath() {
  return DB_PATH;
}

export function createRpgSystem({
  name,
  description,
}: {
  name: string;
  description: string;
}): RpgSystem {
  const db = getDatabase();
  const baseId = slugify(name) || "sistema";
  const systemId = `${baseId}-${Date.now()}`;

  const system: RpgSystem = { id: systemId, name, description };

  db.prepare(
    `INSERT INTO rpg_systems (id, name, description)
     VALUES (@id, @name, @description)`
  ).run(system);

  insertRules(db, systemId, cloneRulesForSystem(systemId));

  return system;
}

export function createRpgTable({
  name,
  description,
  systemId,
}: {
  name: string;
  description: string;
  systemId?: string;
}): RpgTable {
  const db = getDatabase();
  const resolvedSystemId = resolveSystemId(db, systemId);
  const baseId = slugify(name) || "mesa";
  const tableId = `${baseId}-${Date.now()}`;
  const table: RpgTable = { id: tableId, systemId: resolvedSystemId, name, description };

  db.prepare(
    `INSERT INTO rpg_tables (id, system_id, name, description)
     VALUES (@id, @systemId, @name, @description)`
  ).run(table);

  return table;
}

export function getRulebookData(tableId?: string): RulebookData {
  const db = getDatabase();
  const activeTable = resolveTable(db, tableId);
  const systems = getSystems(db);
  const tables = getTables(db);
  const activeSystemId = activeTable.systemId;
  const ruleRows = db
    .prepare("SELECT id, category, title, summary, content, tags_json FROM rule_articles WHERE system_id = ? ORDER BY rowid ASC")
    .all(activeSystemId) as RuleRow[];
  const npcRows = db
    .prepare("SELECT id, category, name, role, description, stats_json, notes_json FROM npc_sheets WHERE table_id = ? ORDER BY category ASC, rowid ASC")
    .all(activeTable.id) as NpcRow[];
  const playerRows = db
    .prepare(`
      SELECT
        id,
        character_name,
        player_name,
        role,
        tier,
        concept,
        status_json,
        attributes_json,
        resources_json,
        abilities_json,
        notes_json
      FROM player_sheets
      WHERE table_id = ?
      ORDER BY rowid ASC
    `)
    .all(activeTable.id) as PlayerRow[];

  return {
    systems,
    tables,
    activeTableId: activeTable.id,
    activeSystemId,
    rules: ruleRows.map((row) => ({
      id: row.id,
      category: row.category,
      title: row.title,
      summary: row.summary,
      content: row.content,
      tags: parseJson<string[]>(row.tags_json, []),
    })),
    npcs: npcRows.map((row) => ({
      id: row.id,
      category: row.category ?? "criminosos",
      name: row.name,
      role: row.role,
      description: row.description,
      stats: parseJson(row.stats_json, []),
      notes: parseJson(row.notes_json, []),
    })),
    players: playerRows.map((row) => ({
      id: row.id,
      characterName: row.character_name,
      playerName: row.player_name,
      role: row.role,
      tier: row.tier,
      concept: row.concept,
      status: parseJson(row.status_json, []),
      attributes: parseJson(row.attributes_json, []),
      resources: parseJson(row.resources_json, []),
      abilities: parseJson(row.abilities_json, []),
      notes: parseJson(row.notes_json, []),
    })),
  };
}

export function saveRulebookData(
  data: RulebookContent,
  tableId = DEFAULT_TABLE_ID,
  systemId = DEFAULT_SYSTEM_ID
) {
  const db = getDatabase();
  const activeTable = resolveTable(db, tableId);
  const activeSystemId = resolveSystemId(db, systemId || activeTable.systemId);
  const saveRule = db.prepare(`
    INSERT INTO rule_articles (id, system_id, table_id, category, title, summary, content, tags_json, updated_at)
    VALUES (@id, @systemId, @tableId, @category, @title, @summary, @content, @tagsJson, CURRENT_TIMESTAMP)
    ON CONFLICT(id) DO UPDATE SET
      system_id = excluded.system_id,
      category = excluded.category,
      title = excluded.title,
      summary = excluded.summary,
      content = excluded.content,
      tags_json = excluded.tags_json,
      updated_at = CURRENT_TIMESTAMP
  `);
  const saveNpc = db.prepare(`
    INSERT INTO npc_sheets (id, table_id, category, name, role, description, stats_json, notes_json, updated_at)
    VALUES (@id, @tableId, @category, @name, @role, @description, @statsJson, @notesJson, CURRENT_TIMESTAMP)
    ON CONFLICT(id) DO UPDATE SET
      table_id = excluded.table_id,
      category = excluded.category,
      name = excluded.name,
      role = excluded.role,
      description = excluded.description,
      stats_json = excluded.stats_json,
      notes_json = excluded.notes_json,
      updated_at = CURRENT_TIMESTAMP
  `);
  const savePlayer = db.prepare(`
    INSERT INTO player_sheets (
      id,
      table_id,
      character_name,
      player_name,
      role,
      tier,
      concept,
      status_json,
      attributes_json,
      resources_json,
      abilities_json,
      notes_json,
      updated_at
    ) VALUES (
      @id,
      @tableId,
      @characterName,
      @playerName,
      @role,
      @tier,
      @concept,
      @statusJson,
      @attributesJson,
      @resourcesJson,
      @abilitiesJson,
      @notesJson,
      CURRENT_TIMESTAMP
    )
    ON CONFLICT(id) DO UPDATE SET
      table_id = excluded.table_id,
      character_name = excluded.character_name,
      player_name = excluded.player_name,
      role = excluded.role,
      tier = excluded.tier,
      concept = excluded.concept,
      status_json = excluded.status_json,
      attributes_json = excluded.attributes_json,
      resources_json = excluded.resources_json,
      abilities_json = excluded.abilities_json,
      notes_json = excluded.notes_json,
      updated_at = CURRENT_TIMESTAMP
  `);

  const transaction = db.transaction((rulebook: RulebookContent) => {
    for (const rule of rulebook.rules) {
      saveRule.run({
        id: rule.id,
        systemId: activeSystemId,
        tableId: activeTable.id,
        category: rule.category,
        title: rule.title,
        summary: rule.summary,
        content: rule.content,
        tagsJson: JSON.stringify(rule.tags),
      });
    }

    for (const npc of rulebook.npcs) {
      saveNpc.run({
        id: npc.id,
        tableId: activeTable.id,
        category: npc.category,
        name: npc.name,
        role: npc.role,
        description: npc.description,
        statsJson: JSON.stringify(npc.stats),
        notesJson: JSON.stringify(npc.notes),
      });
    }

    for (const player of rulebook.players) {
      savePlayer.run({
        id: player.id,
        tableId: activeTable.id,
        characterName: player.characterName,
        playerName: player.playerName,
        role: player.role,
        tier: player.tier,
        concept: player.concept,
        statusJson: JSON.stringify(player.status),
        attributesJson: JSON.stringify(player.attributes),
        resourcesJson: JSON.stringify(player.resources),
        abilitiesJson: JSON.stringify(player.abilities),
        notesJson: JSON.stringify(player.notes),
      });
    }
  });

  transaction(data);
}

export function resetDatabaseToInitialSeed(tableId = DEFAULT_TABLE_ID) {
  const db = getDatabase();
  const activeTable = resolveTable(db, tableId);
  const sheets = cloneSheetsForTable(activeTable.id);
  const transaction = db.transaction(() => {
    db.prepare("DELETE FROM npc_sheets WHERE table_id = ?").run(activeTable.id);
    db.prepare("DELETE FROM player_sheets WHERE table_id = ?").run(activeTable.id);
  });

  transaction();
  insertNpcs(db, activeTable.id, sheets.npcs);
  insertPlayers(db, activeTable.id, sheets.players);
}
