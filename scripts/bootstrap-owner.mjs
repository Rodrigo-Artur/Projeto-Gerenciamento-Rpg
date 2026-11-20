#!/usr/bin/env node
/**
 * Creates one pending initial owner claim in the SQLite mounted at /app/.local.
 * No password is generated or persisted; the owner chooses one via the single-use link.
 * Deliberately refuses a second owner or an already registered password account.
 */
import Database from "better-sqlite3";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import path from "node:path";

const args = process.argv.slice(2);
const index = args.indexOf("--email");
const email = index >= 0 ? args[index + 1]?.toLowerCase().trim() : "";
if (!args.includes("--confirm") || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  console.error("Uso: node scripts/bootstrap-owner.mjs --email email@exemplo.com --confirm");
  process.exit(2);
}
const db = new Database(path.join(process.cwd(), ".local", "mesa-do-mestre.sqlite"), { fileMustExist: true });
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");
try {
  db.exec([
    "CREATE TABLE IF NOT EXISTS auth_users (id TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE, display_name TEXT NOT NULL, password_hash TEXT, preference TEXT NOT NULL DEFAULT 'both' CHECK(preference IN ('gm','player','both')), legacy_owner INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)",
    "CREATE TABLE IF NOT EXISTS campaign_members (user_id TEXT NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE, table_id TEXT NOT NULL, role TEXT NOT NULL CHECK(role IN ('owner','gm','player','spectator')), created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY(user_id,table_id))",
    "CREATE TABLE IF NOT EXISTS auth_owner_activations (user_id TEXT PRIMARY KEY REFERENCES auth_users(id) ON DELETE CASCADE, token_hash TEXT UNIQUE NOT NULL, expires_at INTEGER NOT NULL)"
  ].join(";\n") + ";");
  const other = db.prepare("SELECT email FROM auth_users WHERE legacy_owner = 1 LIMIT 1").get();
  if (other) throw new Error("Já existe proprietário. Não é possível iniciar uma segunda ativação.");
  const existing = db.prepare("SELECT id, password_hash, legacy_owner FROM auth_users WHERE email = ?").get(email);
  if (existing?.password_hash || existing?.legacy_owner) throw new Error("Esta conta já está registrada. Pare e revise o procedimento.");
  const token = randomBytes(32).toString("base64url");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const expiresAt = Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60);
  const id = existing?.id ?? randomUUID();
  db.transaction(() => {
    if (!existing) {
      db.prepare("INSERT INTO auth_users (id,email,display_name,preference,legacy_owner) VALUES (?,?,?,'gm',0)")
        .run(id, email, "Mestre");
    }
    db.prepare("INSERT INTO auth_owner_activations (user_id,token_hash,expires_at) VALUES (?,?,?) ON CONFLICT(user_id) DO UPDATE SET token_hash=excluded.token_hash,expires_at=excluded.expires_at")
      .run(id, tokenHash, expiresAt);
  })();
  // Only displayed once on the administrator's terminal, never persisted in plaintext.
  process.stdout.write("Ativação para " + email + "\n");
  process.stdout.write("https://mesa.rodrigoartur.com.br/activate#token=" + token + "\n");
  process.stdout.write("Validade: 7 dias. Guarde a URL privada e use-a somente uma vez.\n");
} catch (error) {
  console.error(error instanceof Error ? error.message : "Falha ao preparar ativação");
  process.exitCode = 1;
} finally {
  db.close();
}

