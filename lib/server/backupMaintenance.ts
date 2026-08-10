import Database from "better-sqlite3";
import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";

import { createAutomaticBackup } from "@/lib/server/advancedDatabase";

const DB_DIRECTORY = path.join(process.cwd(), ".local");
const DB_PATH = path.join(DB_DIRECTORY, "mesa-do-mestre.sqlite");

export function ensureDailyBackup(tableId: string) {
  if (!existsSync(DB_DIRECTORY)) mkdirSync(DB_DIRECTORY, { recursive: true });
  const db = new Database(DB_PATH);
  try {
    const row = db.prepare(`
      SELECT created_at
      FROM automatic_backups
      WHERE table_id = ? AND reason = 'Backup diário automático'
      ORDER BY created_at DESC
      LIMIT 1
    `).get(tableId) as { created_at: string } | undefined;

    if (!row) {
      createAutomaticBackup(tableId, "Backup diário automático");
      return;
    }

    const last = new Date(`${row.created_at.replace(" ", "T")}Z`).getTime();
    if (!Number.isFinite(last) || Date.now() - last >= 24 * 60 * 60 * 1000) {
      createAutomaticBackup(tableId, "Backup diário automático");
    }
  } finally {
    db.close();
  }
}
