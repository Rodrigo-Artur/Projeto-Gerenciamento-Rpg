import Database from "better-sqlite3";
import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";

import {
  createAutomaticBackup,
  upsertNote,
  upsertNpc,
  upsertPlayer,
  upsertRule,
  upsertSession,
} from "@/lib/server/advancedDatabase";
import type { NpcSheet, PlayerSheet, RuleArticle, SessionPlan, TableNote } from "@/types/rulebook";

const DB_DIRECTORY = path.join(process.cwd(), ".local");
const DB_PATH = path.join(DB_DIRECTORY, "mesa-do-mestre.sqlite");

function parseJson<T>(value: unknown, fallback: T): T {
  if (typeof value !== "string") return fallback;
  try { return JSON.parse(value) as T; } catch { return fallback; }
}

export function restoreContentVersion(input: {
  versionId: string;
  contentType: string;
  contentId: string;
  tableId: string;
  systemId: string;
}) {
  if (!existsSync(DB_DIRECTORY)) mkdirSync(DB_DIRECTORY, { recursive: true });
  const db = new Database(DB_PATH);
  try {
    const row = db.prepare(`
      SELECT content_type, content_id, snapshot_json
      FROM content_versions
      WHERE id = ? AND content_type = ? AND content_id = ?
    `).get(input.versionId, input.contentType, input.contentId) as { content_type: string; content_id: string; snapshot_json: string } | undefined;
    if (!row) throw new Error("Versão não encontrada.");
    const snapshot = JSON.parse(row.snapshot_json) as Record<string, unknown>;
    createAutomaticBackup(input.tableId, "Antes de restaurar uma versão de conteúdo");

    if (input.contentType === "rule") {
      const rule: RuleArticle = {
        id: String(snapshot.id ?? input.contentId),
        category: String(snapshot.category ?? "regras-da-casa") as RuleArticle["category"],
        title: String(snapshot.title ?? "Regra"),
        summary: String(snapshot.summary ?? ""),
        content: String(snapshot.content ?? ""),
        tags: parseJson<string[]>(snapshot.tags_json, []),
        meta: parseJson(snapshot.metadata_json, {}),
      };
      return upsertRule(input.systemId, rule);
    }

    if (input.contentType === "npc") {
      const npc: NpcSheet = {
        id: String(snapshot.id ?? input.contentId),
        category: String(snapshot.category ?? "custom") as NpcSheet["category"],
        name: String(snapshot.name ?? "NPC"),
        role: String(snapshot.role ?? ""),
        description: String(snapshot.description ?? ""),
        stats: parseJson(snapshot.stats_json, []),
        notes: parseJson(snapshot.notes_json, []),
        abilities: parseJson(snapshot.abilities_v2_json, []),
        meta: parseJson(snapshot.metadata_json, {}),
      };
      return upsertNpc(input.tableId, npc);
    }

    if (input.contentType === "player") {
      const player: PlayerSheet = {
        id: String(snapshot.id ?? input.contentId),
        characterName: String(snapshot.character_name ?? "Personagem"),
        playerName: String(snapshot.player_name ?? "Jogador"),
        role: String(snapshot.role ?? ""),
        tier: String(snapshot.tier ?? ""),
        concept: String(snapshot.concept ?? ""),
        status: parseJson(snapshot.status_json, []),
        attributes: parseJson(snapshot.attributes_json, []),
        resources: parseJson(snapshot.resources_json, []),
        abilities: parseJson(snapshot.abilities_json, []),
        structuredAbilities: parseJson(snapshot.structured_abilities_json, []),
        notes: parseJson(snapshot.notes_json, []),
        meta: parseJson(snapshot.metadata_json, {}),
      };
      return upsertPlayer(input.tableId, player);
    }

    if (input.contentType === "note") {
      return upsertNote(input.tableId, snapshot as unknown as TableNote);
    }

    if (input.contentType === "session") {
      return upsertSession(input.tableId, snapshot as unknown as SessionPlan);
    }

    throw new Error("Tipo de conteúdo não suportado para restauração.");
  } finally {
    db.close();
  }
}
