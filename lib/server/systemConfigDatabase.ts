import Database from "better-sqlite3";
import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";

export type RpgSystemConfig = {
  attributes: string[];
  resources: string[];
  sheetCategories: string[];
  ruleCategories: string[];
  conditions: string[];
};

const DB_DIRECTORY = path.join(process.cwd(), ".local");
const DB_PATH = path.join(DB_DIRECTORY, "mesa-do-mestre.sqlite");

const defaultConfig: RpgSystemConfig = {
  attributes: ["Força", "Constituição", "Destreza", "Inteligência", "Sabedoria", "Carisma"],
  resources: ["HP", "Energia", "Redução", "Regeneração"],
  sheetCategories: ["players", "criminosos", "policia-umck", "ameacas-pesadas", "simbiontes", "bosses", "aliados", "monstros", "custom"],
  ruleCategories: ["combate", "testes", "atributos", "defesa-dano", "personagem", "progressao", "habilidades", "armaduras", "equipamentos", "npcs", "regras-da-casa"],
  conditions: ["Agarrado", "Amedrontado", "Atordoado", "Caído", "Exposto", "Sangrando", "Envenenado", "Paralisado"],
};

function getDb() {
  if (!existsSync(DB_DIRECTORY)) mkdirSync(DB_DIRECTORY, { recursive: true });
  const db = new Database(DB_PATH);
  const columns = db.prepare("PRAGMA table_info(rpg_systems)").all() as { name: string }[];
  if (!columns.some((column) => column.name === "config_json")) {
    db.exec("ALTER TABLE rpg_systems ADD COLUMN config_json TEXT NOT NULL DEFAULT '{}'");
  }
  return db;
}

function parse(value: string | null | undefined) {
  if (!value) return defaultConfig;
  try {
    const raw = JSON.parse(value) as Partial<RpgSystemConfig>;
    return {
      attributes: raw.attributes ?? defaultConfig.attributes,
      resources: raw.resources ?? defaultConfig.resources,
      sheetCategories: raw.sheetCategories ?? defaultConfig.sheetCategories,
      ruleCategories: raw.ruleCategories ?? defaultConfig.ruleCategories,
      conditions: raw.conditions ?? defaultConfig.conditions,
    } satisfies RpgSystemConfig;
  } catch {
    return defaultConfig;
  }
}

export function getSystemConfig(systemId: string): RpgSystemConfig {
  const db = getDb();
  try {
    const row = db.prepare("SELECT config_json FROM rpg_systems WHERE id = ?").get(systemId) as { config_json: string } | undefined;
    return parse(row?.config_json);
  } finally {
    db.close();
  }
}

export function saveSystemConfig(systemId: string, config: Partial<RpgSystemConfig>): RpgSystemConfig {
  const db = getDb();
  try {
    const current = getSystemConfigWithDb(db, systemId);
    const next: RpgSystemConfig = {
      attributes: config.attributes ?? current.attributes,
      resources: config.resources ?? current.resources,
      sheetCategories: config.sheetCategories ?? current.sheetCategories,
      ruleCategories: config.ruleCategories ?? current.ruleCategories,
      conditions: config.conditions ?? current.conditions,
    };
    db.prepare("UPDATE rpg_systems SET config_json = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(JSON.stringify(next), systemId);
    return next;
  } finally {
    db.close();
  }
}

function getSystemConfigWithDb(db: Database.Database, systemId: string): RpgSystemConfig {
  const row = db.prepare("SELECT config_json FROM rpg_systems WHERE id = ?").get(systemId) as { config_json: string } | undefined;
  return parse(row?.config_json);
}
