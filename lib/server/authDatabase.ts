import Database from "better-sqlite3";
import { createHash, randomBytes, randomUUID, scryptSync, timingSafeEqual } from "node:crypto";
import { mkdirSync } from "node:fs";
import path from "node:path";

export type UserPreference = "gm" | "player" | "both";
export type AppUser = {
  id: string;
  email: string;
  name: string;
  preference: UserPreference;
  isLegacyOwner: boolean;
};

type UserRow = { id: string; email: string; display_name: string; preference: UserPreference; legacy_owner: number; password_hash: string | null };

const dbPath = path.join(process.cwd(), ".local", "mesa-do-mestre.sqlite");
declare global {
  var mesaAuthDb: Database.Database | undefined;
}

export function authDb() {
  if (!globalThis.mesaAuthDb) {
    mkdirSync(path.dirname(dbPath), { recursive: true });
    const db = new Database(dbPath);
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");
    db.exec([
      "CREATE TABLE IF NOT EXISTS auth_users (id TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE, display_name TEXT NOT NULL, password_hash TEXT, preference TEXT NOT NULL DEFAULT 'both' CHECK(preference IN ('gm','player','both')), legacy_owner INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)",
      "CREATE TABLE IF NOT EXISTS auth_accounts (provider TEXT NOT NULL, provider_subject TEXT NOT NULL, user_id TEXT NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY(provider,provider_subject))",
      "CREATE TABLE IF NOT EXISTS campaign_members (user_id TEXT NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE, table_id TEXT NOT NULL, role TEXT NOT NULL CHECK(role IN ('owner','gm','player','spectator')), created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY(user_id,table_id))",
      "CREATE INDEX IF NOT EXISTS idx_campaign_members_table ON campaign_members(table_id)",
      "CREATE TABLE IF NOT EXISTS user_release_reads (user_id TEXT NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE, version TEXT NOT NULL, read_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY(user_id,version))",
      "CREATE TABLE IF NOT EXISTS auth_login_attempts (key TEXT PRIMARY KEY, failures INTEGER NOT NULL DEFAULT 0, blocked_until INTEGER NOT NULL DEFAULT 0, last_attempt INTEGER NOT NULL DEFAULT 0)"
    ].join(";\n") + ";");
    globalThis.mesaAuthDb = db;
  }
  return globalThis.mesaAuthDb;
}

function asUser(row?: UserRow): AppUser | null {
  if (!row) return null;
  return {
    id: row.id, email: row.email, name: row.display_name,
    preference: row.preference, isLegacyOwner: row.legacy_owner === 1,
  };
}

function rowByEmail(email: string): UserRow | undefined {
  return authDb().prepare("SELECT * FROM auth_users WHERE email = ?").get(email.toLowerCase().trim()) as UserRow | undefined;
}

export function userById(id: string): AppUser | null {
  return asUser(authDb().prepare("SELECT * FROM auth_users WHERE id = ?").get(id) as UserRow | undefined);
}

export function userByEmail(email: string): AppUser | null {
  return asUser(rowByEmail(email));
}

export function emailValid(value: string) {
  return value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function hashPassword(password: string) {
  const salt = randomBytes(24).toString("base64url");
  const digest = scryptSync(password, salt, 64, { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 }).toString("base64url");
  return "scrypt$" + salt + "$" + digest;
}

function validPassword(password: string, hash: string | null) {
  if (!hash) return false;
  const [algorithm, salt, stored] = hash.split("$");
  if (algorithm !== "scrypt" || !salt || !stored) return false;
  try {
    const original = Buffer.from(stored, "base64url");
    const candidate = scryptSync(password, salt, original.length, { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 });
    return original.length === candidate.length && timingSafeEqual(original, candidate);
  } catch {
    return false;
  }
}

export function registerPasswordAccount(input: { email: string; name: string; password: string; preference: UserPreference }): AppUser {
  const email = input.email.toLowerCase().trim();
  const name = input.name.trim();
  if (!emailValid(email) || name.length < 2 || name.length > 80 ||
      input.password.length < 12 || input.password.length > 128 ||
      !["gm","player","both"].includes(input.preference)) {
    throw new Error("Dados inválidos. Use um nome e uma senha com pelo menos 12 caracteres.");
  }
  const id = randomUUID();
  const passwordHash = hashPassword(input.password);
  try {
    authDb().prepare("INSERT INTO auth_users (id, email, display_name, password_hash, preference) VALUES (?, ?, ?, ?, ?)")
      .run(id, email, name, passwordHash, input.preference);
  } catch (error) {
    if (error instanceof Error && error.message.includes("UNIQUE")) {
      throw new Error("Este e-mail já possui uma conta.");
    }
    throw error;
  }
  const created = userById(id);
  if (!created) throw new Error("Não foi possível criar a conta.");
  return created;
}

export function authenticatePassword(email: string, password: string): AppUser | null {
  if (!emailValid(email) || typeof password !== "string" || password.length > 128) return null;
  const row = rowByEmail(email);
  if (!validPassword(password, row?.password_hash ?? null)) return null;
  return asUser(row);
}

/** Google subject is canonical. Never automatically merge with a password account via email. */
export function googleAccount(subject: string, email: string, name: string): AppUser | null {
  if (!subject || subject.length > 255 || !emailValid(email)) return null;
  const db = authDb();
  const existing = db.prepare(
    "SELECT u.* FROM auth_users u JOIN auth_accounts a ON a.user_id = u.id WHERE a.provider = 'google' AND a.provider_subject = ?"
  ).get(subject) as UserRow | undefined;
  if (existing) return asUser(existing);
  // Explicit account linking is a separate, authenticated future workflow.
  if (rowByEmail(email)) return null;
  const id = randomUUID();
  const created = db.transaction(() => {
    db.prepare("INSERT INTO auth_users (id,email,display_name,preference) VALUES (?,?,?,'both')")
      .run(id, email.toLowerCase().trim(), name.trim().slice(0, 80) || "Jogador");
    db.prepare("INSERT INTO auth_accounts (provider,provider_subject,user_id) VALUES ('google',?,?)")
      .run(subject, id);
  });
  try { created(); } catch { return null; }
  return userById(id);
}

export function releaseReads(userId: string): string[] {
  return (authDb().prepare("SELECT version FROM user_release_reads WHERE user_id = ?").all(userId) as {version:string}[])
    .map((item) => item.version);
}

export function markReleaseRead(userId: string, version: string) {
  authDb().prepare("INSERT OR IGNORE INTO user_release_reads (user_id,version) VALUES (?,?)").run(userId, version);
}


/** Persistent coarse throttle for single-node deployment; hashes IP identifiers. */
export function rateAllowed(category: "register" | "login", clientHint: string, limit: number, windowSeconds: number) {
  const key = category + ":" + createHash("sha256").update(clientHint.slice(0, 255)).digest("hex");
  const db = authDb();
  const now = Math.floor(Date.now() / 1000);
  const row = db.prepare("SELECT failures, blocked_until, last_attempt FROM auth_login_attempts WHERE key=?")
    .get(key) as {failures:number;blocked_until:number;last_attempt:number}|undefined;
  if (row && row.blocked_until > now) return false;
  const count = !row || now - row.last_attempt > windowSeconds ? 1 : row.failures + 1;
  const blocked = count > limit ? now + windowSeconds : 0;
  db.prepare("INSERT INTO auth_login_attempts (key,failures,blocked_until,last_attempt) VALUES (?,?,?,?) ON CONFLICT(key) DO UPDATE SET failures=excluded.failures,blocked_until=excluded.blocked_until,last_attempt=excluded.last_attempt")
    .run(key, count, blocked, now);
  return count <= limit;
}
