/**
 * Sync local SQLite data → remote Turso database
 * Usage: npx tsx scripts/sync-to-remote.ts
 */
import { createClient } from '@libsql/client';

const REMOTE_URL = process.env.TURSO_DATABASE_URL!;
const REMOTE_TOKEN = process.env.TURSO_AUTH_TOKEN!;

if (!REMOTE_URL || REMOTE_URL === 'file:local.db') {
  console.error('❌ TURSO_DATABASE_URL must point to a remote Turso DB');
  process.exit(1);
}
if (!REMOTE_TOKEN) {
  console.error('❌ TURSO_AUTH_TOKEN is required');
  process.exit(1);
}

const local = createClient({ url: 'file:local.db' });
const remote = createClient({ url: REMOTE_URL, authToken: REMOTE_TOKEN });

async function syncTable(table: string, columns: string[], hasVector = false) {
  const result = await local.execute(`SELECT ${columns.join(', ')} FROM ${table}`);
  const rows = result.rows;

  if (rows.length === 0) {
    console.log(`  ${table}: 0 rows — skipped`);
    return;
  }

  // Insert in batches of 20
  const batchSize = 20;
  let inserted = 0;

  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    const statements = batch.map((row) => {
      const values = columns.map((col, idx) => row[idx]);

      if (hasVector) {
        const placeholders = columns.map((col) =>
          col === 'embedding' ? 'vector32(?)' : '?'
        ).join(', ');
        return {
          sql: `INSERT OR REPLACE INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`,
          args: values as any[],
        };
      }

      const placeholders = columns.map(() => '?').join(', ');
      return {
        sql: `INSERT OR REPLACE INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`,
        args: values as any[],
      };
    });

    await remote.batch(statements, 'write');
    inserted += batch.length;
    process.stdout.write(`\r  ${table}: ${inserted}/${rows.length}...`);
  }

  console.log(`\r  ${table}: ${inserted} rows synced ✓       `);
}

async function main() {
  console.log(`\nSyncing local.db → ${REMOTE_URL}\n`);

  // Disable FK constraints for clean delete + re-insert
  await remote.execute('PRAGMA foreign_keys = OFF');

  // Clear tables in reverse dependency order
  await remote.execute('DELETE FROM dashboard_snapshots');
  await remote.execute('DELETE FROM conversations');
  await remote.execute('DELETE FROM prospects');
  await remote.execute('DELETE FROM content_chunks');
  await remote.execute('DELETE FROM scrape_log');
  console.log('  Cleared remote tables ✓\n');

  await syncTable('prospects', [
    'id', 'code', 'created_at', 'updated_at', 'consent_given', 'consent_at',
  ]);

  await syncTable('conversations', [
    'id', 'prospect_id', 'messages', 'created_at', 'updated_at',
  ]);

  await syncTable('dashboard_snapshots', [
    'id', 'prospect_id', 'data', 'created_at',
  ]);

  await syncTable('content_chunks', [
    'id', 'content', 'source_url', 'title', 'product_type',
    'tns_relevance', 'guarantees', 'chunk_type', 'token_estimate',
    'embedding', 'created_at',
  ], true);

  await syncTable('scrape_log', [
    'id', 'url', 'title', 'status_code', 'chunk_count', 'scraped_at',
  ]);

  await remote.execute('PRAGMA foreign_keys = ON');
  console.log('\n✅ Sync complete!\n');
  process.exit(0);
}

main().catch((err) => {
  console.error('Sync failed:', err);
  process.exit(1);
});
