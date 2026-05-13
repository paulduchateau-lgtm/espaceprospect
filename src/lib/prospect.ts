import { client, ensureSchema } from './db';
import type { DashboardData } from './types';

type MessageRecord = { role: 'user' | 'assistant'; content: string };

// 6-char alphanumeric code — excludes ambiguous chars (O, 0, I, 1, L)
const CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

function generateCode(): string {
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return code;
}

export async function createProspect(): Promise<{ id: string; code: string }> {
  await ensureSchema();
  const id = crypto.randomUUID();
  const code = generateCode();
  await client.execute({
    sql: `INSERT INTO prospects (id, code, created_at, updated_at, consent_given, consent_at)
          VALUES (?, ?, unixepoch(), unixepoch(), 1, unixepoch())`,
    args: [id, code],
  });
  return { id, code };
}

export async function loadProspectByCode(code: string): Promise<{
  id: string;
  messages: MessageRecord[];
  dashboard: DashboardData | null;
  code: string;
} | null> {
  const prospect = await client.execute({
    sql: `SELECT id, code FROM prospects WHERE code = ?`,
    args: [code.toUpperCase()],
  });
  if (prospect.rows.length === 0) return null;
  const prospectId = prospect.rows[0].id as string;
  const data = await loadProspect(prospectId);
  if (!data) return null;
  return { ...data, code: prospect.rows[0].code as string };
}

export async function saveProspectData(
  prospectId: string,
  messages: MessageRecord[],
  dashboardData: DashboardData
): Promise<void> {
  await saveMessages(prospectId, messages);
  await saveDashboard(prospectId, dashboardData);
}

export async function saveMessages(prospectId: string, messages: MessageRecord[]): Promise<void> {
  await ensureSchema();
  const existing = await client.execute({
    sql: `SELECT id FROM conversations WHERE prospect_id = ? LIMIT 1`,
    args: [prospectId],
  });
  if (existing.rows.length > 0) {
    await client.execute({
      sql: `UPDATE conversations SET messages = ?, updated_at = unixepoch() WHERE id = ?`,
      args: [JSON.stringify(messages), existing.rows[0].id as string],
    });
  } else {
    await client.execute({
      sql: `INSERT INTO conversations (id, prospect_id, messages, created_at, updated_at)
            VALUES (?, ?, ?, unixepoch(), unixepoch())`,
      args: [crypto.randomUUID(), prospectId, JSON.stringify(messages)],
    });
  }
}

export async function saveDashboard(prospectId: string, data: unknown): Promise<void> {
  await ensureSchema();
  await client.execute({
    sql: `INSERT INTO dashboard_snapshots (id, prospect_id, data, created_at)
          VALUES (?, ?, ?, unixepoch())`,
    args: [crypto.randomUUID(), prospectId, JSON.stringify(data)],
  });
}

export async function loadProspect(prospectId: string): Promise<{
  id: string;
  code: string | null;
  messages: MessageRecord[];
  dashboard: DashboardData | null;
} | null> {
  await ensureSchema();
  const prospect = await client.execute({
    sql: `SELECT id, code FROM prospects WHERE id = ?`,
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
    code: prospect.rows[0].code as string | null,
    messages: conversation.rows.length > 0
      ? JSON.parse(conversation.rows[0].messages as string)
      : [],
    dashboard: dashboard.rows.length > 0
      ? JSON.parse(dashboard.rows[0].data as string)
      : null,
  };
}
