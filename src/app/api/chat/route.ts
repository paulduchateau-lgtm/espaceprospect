import { readFileSync } from 'node:fs';
import { streamText } from 'ai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { getSailorClient } from '@/lib/sailor-client';
import { formatSailorChunksAsRAG, buildSystemPrompt } from '@/lib/prompts';
import { dashboardTool } from '@/lib/schemas';
import { loadProspect, saveMessages, saveDashboard } from '@/lib/prospect';

function loadApiKey(): string {
  const envKey = process.env.ANTHROPIC_API_KEY;
  if (envKey && envKey.length > 0) return envKey;
  try {
    const content = readFileSync('.env.local', 'utf8');
    const match = content.match(/^ANTHROPIC_API_KEY=(.+)$/m);
    if (match?.[1]) return match[1].trim();
  } catch { /* .env.local not found */ }
  throw new Error('ANTHROPIC_API_KEY not configured');
}

function getAnthropic() {
  return createAnthropic({
    apiKey: loadApiKey(),
    baseURL: 'https://api.anthropic.com/v1',
  });
}

export const maxDuration = 300;

function extractUserText(messages: Array<{ role: string; parts?: Array<{ type: string; text?: string }> }>): string {
  if (!Array.isArray(messages) || messages.length === 0) return '';
  const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user');
  if (!lastUserMsg?.parts) return '';
  return lastUserMsg.parts
    .filter((p) => p.type === 'text' && p.text)
    .map((p) => p.text)
    .join(' ');
}

export async function POST(req: Request) {
  const body = await req.json();
  const prospectId = body.prospectId as string | undefined;
  const comparisonContext = body.comparisonContext ?? null;

  let messageText: string;
  if (typeof body.message === 'string' && body.message.length > 0) {
    messageText = body.message;
  } else if (Array.isArray(body.messages)) {
    messageText = extractUserText(body.messages);
  } else {
    messageText = '';
  }

  if (!messageText) {
    return new Response(
      JSON.stringify({ error: 'No message provided' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Load existing conversation history for context continuity
  let previousMessages: Array<{ role: 'user' | 'assistant'; content: string }> = [];
  if (prospectId) {
    try {
      const prospect = await loadProspect(prospectId);
      if (prospect?.messages) {
        previousMessages = prospect.messages.map(m => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        }));
      }
    } catch {
      console.error('[Chat] Failed to load history, proceeding without');
    }
  }

  const allMessages = [
    ...previousMessages,
    { role: 'user' as const, content: messageText },
  ];

  // ── RAG retrieval via Sailor-api (replaces Turso vector search) ──
  let ragContext = '';
  try {
    const sailor = getSailorClient();
    const { chunks } = await sailor.retrieveChunks({
      query: messageText,
      top_k: 8,
      strategy: 'hybrid',
    });
    ragContext = formatSailorChunksAsRAG(chunks);
    console.log(`[RAG] Sailor-api returned ${chunks.length} chunks`);
  } catch (error) {
    console.error('[RAG] Sailor-api retrieval failed, proceeding without context:', error);
  }

  try {
    const result = streamText({
      model: getAnthropic()('claude-sonnet-4-20250514'),
      system: buildSystemPrompt(ragContext, comparisonContext),
      messages: allMessages,
      tools: { generate_dashboard: dashboardTool },
      onFinish: async (event) => {
        if (!prospectId) return;
        try {
          const updatedMessages = [
            ...allMessages,
            { role: 'assistant' as const, content: event.text },
          ];
          await saveMessages(prospectId, updatedMessages);

          if (event.toolResults && Array.isArray(event.toolResults)) {
            for (const tr of event.toolResults) {
              const toolResult = tr as { toolName?: string; result?: unknown };
              if (toolResult.toolName === 'generate_dashboard' && toolResult.result) {
                await saveDashboard(prospectId, toolResult.result);
                break;
              }
            }
          }
          console.log(`[Chat] Saved conversation (${updatedMessages.length} msgs) for ${prospectId}`);
        } catch (err) {
          console.error('[Chat] Failed to save conversation:', err);
        }
      },
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error('[API Chat Error]', error);

    let status = 500;
    let errorMessage = 'Internal server error';

    if (error instanceof Error) {
      errorMessage = error.message;
      if (errorMessage.includes('rate') || errorMessage.includes('429')) status = 429;
      else if (errorMessage.includes('401') || errorMessage.includes('authentication')) status = 401;
      else if (errorMessage.includes('403')) status = 403;
      else if (errorMessage.includes('overloaded') || errorMessage.includes('529')) status = 529;
    }

    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
