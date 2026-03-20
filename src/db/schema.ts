import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import { customType } from 'drizzle-orm/sqlite-core';

// Custom F32_BLOB vector column type for Turso native vector search
const float32Vector = customType<{
  data: number[];
  config: { dimensions: number };
  configRequired: true;
  driverData: Buffer;
}>({
  dataType(config) {
    return `F32_BLOB(${config.dimensions})`;
  },
  fromDriver(value: Buffer) {
    return Array.from(new Float32Array(value.buffer));
  },
  toDriver(value: number[]) {
    return sql`vector32(${JSON.stringify(value)})`;
  },
});

// Content Chunks Table -- core RAG storage
export const contentChunks = sqliteTable('content_chunks', {
  id: text('id').primaryKey(),
  content: text('content').notNull(),
  sourceUrl: text('source_url').notNull(),
  title: text('title').notNull(),
  productType: text('product_type').notNull(),
  tnsRelevance: text('tns_relevance').notNull(),
  guarantees: text('guarantees', { mode: 'json' })
    .notNull()
    .$type<string[]>(),
  chunkType: text('chunk_type').notNull(),
  tokenEstimate: integer('token_estimate').notNull(),
  embedding: float32Vector('embedding', { dimensions: 1024 }),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
});

// Scrape Metadata Table -- tracks scraping provenance
export const scrapeLog = sqliteTable('scrape_log', {
  id: text('id').primaryKey(),
  url: text('url').notNull().unique(),
  title: text('title'),
  statusCode: integer('status_code'),
  chunkCount: integer('chunk_count'),
  scrapedAt: integer('scraped_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
});

// Prospect Persistence Tables (Phase 5)

export const prospects = sqliteTable('prospects', {
  id: text('id').primaryKey(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  consentGiven: integer('consent_given').notNull().default(0),
  consentAt: integer('consent_at', { mode: 'timestamp' }),
});

export const conversations = sqliteTable('conversations', {
  id: text('id').primaryKey(),
  prospectId: text('prospect_id').notNull().references(() => prospects.id),
  messages: text('messages', { mode: 'json' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

export const dashboardSnapshots = sqliteTable('dashboard_snapshots', {
  id: text('id').primaryKey(),
  prospectId: text('prospect_id').notNull().references(() => prospects.id),
  data: text('data', { mode: 'json' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});
