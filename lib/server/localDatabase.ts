import Database from "better-sqlite3";
import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";

import {
  initialNpcSheets,
  initialPlayerSheets,
  initialRuleArticles,
} from "@/data/systemRules";
import type { NpcSheet, PlayerSheet, RuleArticle, RulebookData, SheetCategory } from "@/types/rulebook";

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

declare global {
  // eslint-disable-next-line no-var
  var mesaDoMestreDatabase: Database.Database | undefined;
}

function parseJson<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function getDatabase() {
  if (!existsSync(DB_DIRECTORY)) {
    mkdirSync(DB_DIRECTORY, { recursive: true });
  }

  if (!globalThis.mesaDoMestreDatabase) {
    globalThis.mesaDoMestreDatabase = new Database(DB_PATH);
    globalThis.mesaDoMestreDatabase.pragma("journal_mode = WAL");
    globalThis.mesaDoMestreDatabase.pragma("foreign_keys = ON");
    createSchema(globalThis.mesaDoMestreDatabase);
    runMigrations(globalThis.mesaDoMestreDatabase);
    seedInitialData(globalThis.mesaDoMestreDatabase);
  }

  return globalThis.mesaDoMestreDatabase;
}

function createSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS rule_articles (
      id TEXT PRIMARY KEY,
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

function runMigrations(db: Database.Database) {
  const npcColumns = db.prepare("PRAGMA table_info(npc_sheets)").all() as {
    name: string;
  }[];

  const hasNpcCategory = npcColumns.some((column) => column.name === "category");

  if (!hasNpcCategory) {
    db.exec("ALTER TABLE npc_sheets ADD COLUMN category TEXT NOT NULL DEFAULT 'criminosos'");
  }
}

function seedInitialData(db: Database.Database) {
  const existingRules = db.prepare("SELECT COUNT(*) AS total FROM rule_articles").get() as {
    total: number;
  };
  const existingPlayers = db.prepare("SELECT COUNT(*) AS total FROM player_sheets").get() as {
    total: number;
  };

  if (existingRules.total === 0) {
    const insertRule = db.prepare(`
      INSERT INTO rule_articles (id, category, title, summary, content, tags_json)
      VALUES (@id, @category, @title, @summary, @content, @tagsJson)
    `);

    const insertRules = db.transaction((rules: RuleArticle[]) => {
      for (const rule of rules) {
        insertRule.run({
          id: rule.id,
          category: rule.category,
          title: rule.title,
          summary: rule.summary,
          content: rule.content,
          tagsJson: JSON.stringify(rule.tags),
        });
      }
    });

    insertRules(initialRuleArticles);
  }

  if (existingPlayers.total === 0) {
    const insertPlayer = db.prepare(`
      INSERT INTO player_sheets (
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
      ) VALUES (
        @id,
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

    const insertPlayers = db.transaction((players: PlayerSheet[]) => {
      for (const player of players) {
        insertPlayer.run({
          id: player.id,
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

    insertPlayers(initialPlayerSheets);
  }

  const insertNpc = db.prepare(`
    INSERT OR IGNORE INTO npc_sheets (id, category, name, role, description, stats_json, notes_json)
    VALUES (@id, @category, @name, @role, @description, @statsJson, @notesJson)
  `);

  const insertNpcs = db.transaction((npcs: NpcSheet[]) => {
    for (const npc of npcs) {
      insertNpc.run({
        id: npc.id,
        category: npc.category,
        name: npc.name,
        role: npc.role,
        description: npc.description,
        statsJson: JSON.stringify(npc.stats),
        notesJson: JSON.stringify(npc.notes),
      });
    }
  });

  insertNpcs(initialNpcSheets);
}

export function getLocalDatabasePath() {
  return DB_PATH;
}

export function getRulebookData(): RulebookData {
  const db = getDatabase();
  const ruleRows = db
    .prepare("SELECT id, category, title, summary, content, tags_json FROM rule_articles ORDER BY rowid ASC")
    .all() as RuleRow[];
  const npcRows = db
    .prepare("SELECT id, category, name, role, description, stats_json, notes_json FROM npc_sheets ORDER BY category ASC, rowid ASC")
    .all() as NpcRow[];
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
      ORDER BY rowid ASC
    `)
    .all() as PlayerRow[];

  return {
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

export function saveRulebookData(data: RulebookData) {
  const db = getDatabase();

  const saveRule = db.prepare(`
    INSERT INTO rule_articles (id, category, title, summary, content, tags_json, updated_at)
    VALUES (@id, @category, @title, @summary, @content, @tagsJson, CURRENT_TIMESTAMP)
    ON CONFLICT(id) DO UPDATE SET
      category = excluded.category,
      title = excluded.title,
      summary = excluded.summary,
      content = excluded.content,
      tags_json = excluded.tags_json,
      updated_at = CURRENT_TIMESTAMP
  `);

  const saveNpc = db.prepare(`
    INSERT INTO npc_sheets (id, category, name, role, description, stats_json, notes_json, updated_at)
    VALUES (@id, @category, @name, @role, @description, @statsJson, @notesJson, CURRENT_TIMESTAMP)
    ON CONFLICT(id) DO UPDATE SET
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

  const transaction = db.transaction((rulebook: RulebookData) => {
    for (const rule of rulebook.rules) {
      saveRule.run({
        id: rule.id,
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

export function resetDatabaseToInitialSeed() {
  const db = getDatabase();

  const transaction = db.transaction(() => {
    db.prepare("DELETE FROM rule_articles").run();
    db.prepare("DELETE FROM npc_sheets").run();
    db.prepare("DELETE FROM player_sheets").run();
  });

  transaction();

  saveRulebookData({
    rules: initialRuleArticles,
    npcs: initialNpcSheets,
    players: initialPlayerSheets,
  });
}
