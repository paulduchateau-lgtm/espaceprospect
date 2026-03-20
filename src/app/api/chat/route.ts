import { streamText, convertToModelMessages, type UIMessage } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { retrieveRelevantChunks } from '@/lib/rag';
import { formatRAGContext, buildSystemPrompt } from '@/lib/prompts';
import { dashboardTool } from '@/lib/schemas';

// Allow streaming responses up to 5 minutes
export const maxDuration = 300;

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  // Extract last user message text from parts array
  const lastUserMessage = messages.filter((m) => m.role === 'user').pop();
  const userQuery = lastUserMessage?.parts
    ?.filter((p): p is { type: 'text'; text: string } => p.type === 'text')
    .map((p) => p.text)
    .join(' ') ?? '';

  // RAG retrieval: embed query + vector search
  const chunks = await retrieveRelevantChunks(userQuery, 8);
  const ragContext = formatRAGContext(chunks);

  // Convert UI messages to model format (async in AI SDK 6)
  const modelMessages = await convertToModelMessages(messages);

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
}
