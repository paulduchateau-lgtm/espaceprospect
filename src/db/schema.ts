import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

// Prospect Persistence Tables (RAG is now in Sailor-api)

export const prospects = sqliteTable('prospects', {
  id: text('id').primaryKey(),
  code: text('code').notNull().unique(),
  whatsappPhone: text('whatsapp_phone'),
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
