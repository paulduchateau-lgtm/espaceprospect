import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from '@/db/schema';

const client = createClient({
  url: process.env.TURSO_DATABASE_URL || 'file:local.db',
  authToken: process.env.TURSO_AUTH_TOKEN,
});

export const db = drizzle(client, { schema });
export { client };

const CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
function generateCode(): string {
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return code;
}

let _migrated = false;
export async function ensureSchema() {
  if (_migrated) return;
  _migrated = true;
  await client.executeMultiple(`
    CREATE TABLE IF NOT EXISTS prospects (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE,
      whatsapp_phone TEXT,
      created_at INTEGER NOT NULL DEFAULT (unixepoch()),
      updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
      consent_given INTEGER NOT NULL DEFAULT 0,
      consent_at INTEGER
    );
    CREATE TABLE IF NOT EXISTS conversations (
      id TEXT PRIMARY KEY,
      prospect_id TEXT NOT NULL REFERENCES prospects(id),
      messages TEXT NOT NULL,
      created_at INTEGER NOT NULL DEFAULT (unixepoch()),
      updated_at INTEGER NOT NULL DEFAULT (unixepoch())
    );
    CREATE TABLE IF NOT EXISTS dashboard_snapshots (
      id TEXT PRIMARY KEY,
      prospect_id TEXT NOT NULL REFERENCES prospects(id),
      data TEXT NOT NULL,
      created_at INTEGER NOT NULL DEFAULT (unixepoch())
    );
  `);

  // Add columns that may be missing on older databases
  const cols = await client.execute(`PRAGMA table_info(prospects)`);
  const colNames = cols.rows.map(r => r.name as string);
  if (!colNames.includes('code')) {
    await client.execute(`ALTER TABLE prospects ADD COLUMN code TEXT UNIQUE`);
  }
  if (!colNames.includes('whatsapp_phone')) {
    await client.execute(`ALTER TABLE prospects ADD COLUMN whatsapp_phone TEXT`);
  }

  // Backfill missing codes
  const missing = await client.execute(`SELECT id FROM prospects WHERE code IS NULL`);
  for (const row of missing.rows) {
    await client.execute({
      sql: `UPDATE prospects SET code = ? WHERE id = ?`,
      args: [generateCode(), row.id as string],
    });
  }
}
