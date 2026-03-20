import { readFileSync } from 'node:fs';
import { streamText, convertToModelMessages, type UIMessage } from 'ai';
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

const anthropic = createAnthropic({
  apiKey: loadApiKey(),
  baseURL: 'https://api.anthropic.com/v1',
});

// Allow streaming responses up to 5 minutes
export const maxDuration = 300;

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  // Extract last user message text from parts array
  const lastUserMessage = messages.filter((m) => m.role === 'user').pop();
  const userQuery =
    lastUserMessage?.parts
      ?.filter((p): p is { type: 'text'; text: string } => p.type === 'text')
      .map((p) => p.text)
      .join(' ') ?? '';

  // RAG retrieval with graceful degradation:
  // If Turso/Voyage fails, proceed with empty context (Claude will note lack of info)
  let ragContext = '';
  try {
    const chunks = await retrieveRelevantChunks(userQuery, 8);
    ragContext = formatRAGContext(chunks);
  } catch (error) {
    console.error('[RAG] Retrieval failed, proceeding without context:', error);
  }

  // Convert UI messages to model format (async in AI SDK 6)
  const modelMessages = await convertToModelMessages(messages);

  try {
    // Stream Claude response with dashboard tool
    const result = streamText({
      model: anthropic('claude-sonnet-4-20250514'),
      system: buildSystemPrompt(ragContext),
      messages: modelMessages,
      tools: {
        generate_dashboard: dashboardTool,
      },
    });

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
