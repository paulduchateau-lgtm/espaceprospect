import { client } from './db';
import type { ChatMessage, DashboardData } from './types';

export async function createProspect(): Promise<string> {
  const id = crypto.randomUUID();
  await client.execute({
    sql: `INSERT INTO prospects (id, created_at, updated_at, consent_given, consent_at)
          VALUES (?, unixepoch(), unixepoch(), 1, unixepoch())`,
    args: [id],
  });
  return id;
}

export async function saveProspectData(
  prospectId: string,
  messages: ChatMessage[],
  dashboardData: DashboardData
): Promise<void> {
  const convId = crypto.randomUUID();
  await client.execute({
    sql: `INSERT OR REPLACE INTO conversations (id, prospect_id, messages, created_at, updated_at)
          VALUES (?, ?, ?, unixepoch(), unixepoch())`,
    args: [convId, prospectId, JSON.stringify(messages)],
  });
  await client.execute({
    sql: `INSERT INTO dashboard_snapshots (id, prospect_id, data, created_at)
          VALUES (?, ?, ?, unixepoch())`,
    args: [crypto.randomUUID(), prospectId, JSON.stringify(dashboardData)],
  });
}

export async function loadProspect(prospectId: string): Promise<{
  id: string;
  messages: ChatMessage[];
  dashboard: DashboardData | null;
} | null> {
  const prospect = await client.execute({
    sql: `SELECT id FROM prospects WHERE id = ?`,
    args: [prospectId],
  });
  if (prospect.rows.length === 0) return null;

  const conversation = await client.execute({
    sql: `SELECT messages FROM conversations WHERE prospect_id = ? ORDER BY updated_at DESC LIMIT 1`,
    args: [prospectId],
  });

  const dashboard = await client.execute({
    sql: `SELECT data FROM dashboard_snapshots WHERE prospect_id = ? ORDER BY created_at DESC LIMIT 1`,
    args: [prospectId],
  });

  return {
    id: prospectId,
    messages: conversation.rows.length > 0
      ? JSON.parse(conversation.rows[0].messages as string)
      : [],
    dashboard: dashboard.rows.length > 0
      ? JSON.parse(dashboard.rows[0].data as string)
      : null,
  };
}
