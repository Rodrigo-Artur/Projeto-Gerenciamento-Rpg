#!/usr/bin/env node
import Database from "better-sqlite3";
import path from "node:path";

const args = process.argv.slice(2);
const position = args.indexOf("--email");
const email = position >= 0 ? args[position + 1]?.toLowerCase().trim() : undefined;
if (!email || !args.includes("--confirm")) {
  console.error("Uso: node scripts/grant-legacy-owner.mjs --email pessoa@dominio.com --confirm");
  process.exit(2);
}

const dbPath = path.join(process.cwd(), ".local", "mesa-do-mestre.sqlite");
const db = new Database(dbPath, { fileMustExist: true });
try {
  const user = db.prepare("SELECT id, email, legacy_owner FROM auth_users WHERE email = ?").get(email);
  if (!user) throw new Error("Conta não encontrada. Cadastre-se antes de executar esta etapa.");
  const alreadyOwner = db.prepare("SELECT email FROM auth_users WHERE legacy_owner = 1 AND id != ?").get(user.id);
  if (alreadyOwner) throw new Error("Já existe outro proprietário. A transferência exige procedimento administrativo separado.");
  const tx = db.transaction(() => {
    db.prepare("UPDATE auth_users SET legacy_owner = 1 WHERE id = ?").run(user.id);
    const known = db.prepare("SELECT 1 AS ok FROM sqlite_master WHERE type='table' AND name='rpg_tables'").get();
    if (known) {
      const tables = db.prepare("SELECT id FROM rpg_tables").all();
      const insert = db.prepare("INSERT OR IGNORE INTO campaign_members (user_id,table_id,role) VALUES (?,?,'owner')");
      for (const table of tables) insert.run(user.id, table.id);
    }
  });
  tx();
  console.log("Proprietário das campanhas legadas configurado para " + user.email);
} catch (error) {
  console.error(error instanceof Error ? error.message : "Falha.");
  process.exitCode = 1;
} finally {
  db.close();
}

