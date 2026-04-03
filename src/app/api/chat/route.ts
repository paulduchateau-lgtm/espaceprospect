import { readFileSync } from 'node:fs';
import { streamText } from 'ai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { retrieveRelevantChunks } from '@/lib/rag';
import { formatRAGContext, buildSystemPrompt } from '@/lib/prompts';
import { dashboardTool } from '@/lib/schemas';

// Read API key: shell env may have ANTHROPIC_API_KEY="" (empty) due to Claude
// Code runtime, preventing Next.js .env.local from overriding it.
function loadApiKey(): string {
  const envKey = process.env.ANTHROPIC_API_KEY;
  if (envKey && envKey.length > 0) return envKey;

  try {
    const content = readFileSync('.env.local', 'utf8');
    const match = content.match(/^ANTHROPIC_API_KEY=(.+)$/m);
    if (match?.[1]) return match[1].trim();
  } catch {
    // .env.local not found
  }
  throw new Error('ANTHROPIC_API_KEY not configured');
}

// Lazy init — evaluated at request time, not at build/import time
function getAnthropic() {
  return createAnthropic({
    apiKey: loadApiKey(),
    baseURL: 'https://api.anthropic.com/v1',
  });
}

// Allow streaming responses up to 5 minutes
export const maxDuration = 300;

// Extract plain text from the last user message in a UIMessage[] array
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

  // Support both request formats:
  // - Main page (useChatWithDashboard): { message: string }
  // - /chat page (DefaultChatTransport): { id, messages: UIMessage[], trigger, messageId }
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

  // RAG retrieval with graceful degradation
  let ragContext = '';
  try {
    const chunks = await retrieveRelevantChunks(messageText, 8);
    ragContext = formatRAGContext(chunks);
  } catch (error) {
    console.error('[RAG] Retrieval failed, proceeding without context:', error);
  }

  try {
    const result = streamText({
      model: getAnthropic()('claude-sonnet-4-20250514'),
      system: buildSystemPrompt(ragContext),
      messages: [{ role: 'user' as const, content: messageText }],
      tools: {
        generate_dashboard: dashboardTool,
      },
    });

    // Return SSE UIMessage stream — DefaultChatTransport parses this via EventSourceParserStream
    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error('[API Chat Error]', error);

    let status = 500;
    let errorMessage = 'Internal server error';

    if (error instanceof Error) {
      errorMessage = error.message;

      if (errorMessage.includes('rate') || errorMessage.includes('429')) {
        status = 429;
      } else if (errorMessage.includes('401') || errorMessage.includes('authentication')) {
        status = 401;
      } else if (errorMessage.includes('403')) {
        status = 403;
      } else if (errorMessage.includes('overloaded') || errorMessage.includes('529')) {
        status = 529;
      }
    }

    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
