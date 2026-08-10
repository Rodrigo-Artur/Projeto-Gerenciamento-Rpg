import Database from "better-sqlite3";
import { randomUUID } from "node:crypto";
import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";

import { createAutomaticBackup, exportPackage, importPackage } from "@/lib/server/advancedDatabase";
import type { RpgSystem, RpgTable } from "@/types/rulebook";

const DB_DIRECTORY = path.join(process.cwd(), ".local");
const DB_PATH = path.join(DB_DIRECTORY, "mesa-do-mestre.sqlite");
const DEFAULT_SYSTEM_ID = "kaiju-rpg";
const DEFAULT_TABLE_ID = "mesa-principal";

declare global {
  // eslint-disable-next-line no-var
  var mesaDoMestreManagementDatabase: Database.Database | undefined;
}

function getDb() {
  if (!existsSync(DB_DIRECTORY)) mkdirSync(DB_DIRECTORY, { recursive: true });
  if (!globalThis.mesaDoMestreManagementDatabase) {
    globalThis.mesaDoMestreManagementDatabase = new Database(DB_PATH);
    globalThis.mesaDoMestreManagementDatabase.pragma("journal_mode = WAL");
  }
  return globalThis.mesaDoMestreManagementDatabase;
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

function history(db: Database.Database, tableId: string | null, systemId: string | null, action: string, targetType: string, targetName: string) {
  db.prepare(`
    INSERT INTO activity_history (id, table_id, system_id, scope, action, target_type, target_name)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(randomUUID(), tableId, systemId, tableId ? "table" : "system", action, targetType, targetName);
}

export function updateTable(input: { id: string; name?: string; description?: string; systemId?: string }) {
  const db = getDb();
  const current = db.prepare("SELECT id, system_id, name, description FROM rpg_tables WHERE id = ?").get(input.id) as { id: string; system_id: string; name: string; description: string } | undefined;
  if (!current) throw new Error("Mesa não encontrada.");
  if (input.systemId && input.systemId !== current.system_id) {
    const exists = db.prepare("SELECT 1 FROM rpg_systems WHERE id = ?").get(input.systemId);
    if (!exists) throw new Error("Sistema de destino não encontrado.");
    createAutomaticBackup(current.id, "Antes de trocar o sistema da mesa");
  }
  const next = {
    id: current.id,
    systemId: input.systemId ?? current.system_id,
    name: input.name?.trim() || current.name,
    description: input.description ?? current.description,
  };
  db.prepare("UPDATE rpg_tables SET system_id = ?, name = ?, description = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(next.systemId, next.name, next.description, next.id);
  history(db, next.id, next.systemId, "editou mesa", "mesa", next.name);
  return next satisfies RpgTable;
}

export function duplicateTable(sourceTableId: string, name?: string) {
  const db = getDb();
  const source = db.prepare("SELECT id, system_id, name, description FROM rpg_tables WHERE id = ?").get(sourceTableId) as { id: string; system_id: string; name: string; description: string } | undefined;
  if (!source) throw new Error("Mesa de origem não encontrada.");
  const id = `${slugify(name || `${source.name} copia`) || "mesa"}-${Date.now()}`;
  const newName = name?.trim() || `${source.name} — Cópia`;
  db.prepare("INSERT INTO rpg_tables (id, system_id, name, description) VALUES (?, ?, ?, ?)").run(id, source.system_id, newName, source.description);

  const pkg = exportPackage(source.id);
  importPackage({
    tableId: id,
    payload: pkg,
    mode: "merge",
    conflict: "copy",
    sections: ["npcs", "players", "notes", "sessions", "entities"],
  });
  history(db, id, source.system_id, "duplicou mesa", "mesa", newName);
  return { id, systemId: source.system_id, name: newName, description: source.description } satisfies RpgTable;
}

export function deleteTable(tableId: string) {
  if (tableId === DEFAULT_TABLE_ID) throw new Error("A Mesa Principal não pode ser excluída.");
  const db = getDb();
  const current = db.prepare("SELECT id, system_id, name FROM rpg_tables WHERE id = ?").get(tableId) as { id: string; system_id: string; name: string } | undefined;
  if (!current) return false;
  createAutomaticBackup(tableId, "Backup antes de excluir mesa");
  const tx = db.transaction(() => {
    db.prepare("DELETE FROM npc_sheets WHERE table_id = ?").run(tableId);
    db.prepare("DELETE FROM player_sheets WHERE table_id = ?").run(tableId);
    db.prepare("DELETE FROM workspace_entities WHERE table_id = ?").run(tableId);
    db.prepare("DELETE FROM combat_states WHERE table_id = ?").run(tableId);
    db.prepare("DELETE FROM recent_content WHERE table_id = ?").run(tableId);
    db.prepare("DELETE FROM rpg_tables WHERE id = ?").run(tableId);
  });
  tx();
  history(db, null, current.system_id, "excluiu mesa", "mesa", current.name);
  return true;
}

export function updateSystem(input: { id: string; name?: string; description?: string }) {
  const db = getDb();
  const current = db.prepare("SELECT id, name, description FROM rpg_systems WHERE id = ?").get(input.id) as RpgSystem | undefined;
  if (!current) throw new Error("Sistema não encontrado.");
  const next = { id: current.id, name: input.name?.trim() || current.name, description: input.description ?? current.description };
  db.prepare("UPDATE rpg_systems SET name = ?, description = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(next.name, next.description, next.id);
  history(db, null, next.id, "editou sistema", "sistema", next.name);
  return next;
}

export function deleteSystem(systemId: string) {
  if (systemId === DEFAULT_SYSTEM_ID) throw new Error("O sistema Kaiju RPG base não pode ser excluído.");
  const db = getDb();
  const system = db.prepare("SELECT id, name FROM rpg_systems WHERE id = ?").get(systemId) as { id: string; name: string } | undefined;
  if (!system) return false;
  const tableCount = db.prepare("SELECT COUNT(*) AS total FROM rpg_tables WHERE system_id = ?").get(systemId) as { total: number };
  if (tableCount.total > 0) throw new Error("Mova ou exclua as mesas que usam este sistema antes de excluí-lo.");
  const tx = db.transaction(() => {
    db.prepare("DELETE FROM rule_articles WHERE system_id = ?").run(systemId);
    db.prepare("DELETE FROM sheet_templates WHERE system_id = ?").run(systemId);
    db.prepare("DELETE FROM rpg_systems WHERE id = ?").run(systemId);
  });
  tx();
  history(db, null, systemId, "excluiu sistema", "sistema", system.name);
  return true;
}
