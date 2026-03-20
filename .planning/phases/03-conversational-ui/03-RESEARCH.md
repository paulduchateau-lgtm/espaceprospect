# Phase 3 Research: Conversational UI

**Date:** 2026-03-20
**Requirements:** CONV-01, CONV-02, CONV-03, CONV-06, UX-03
**Goal:** Build the chat interface that serves as the prospect's entry point -- with streaming display, guided prompts, and humanized error handling.

**Dependencies:** Phase 2 (Core AI Loop) must provide a working `/api/chat` route that accepts messages and returns a streamed Claude response with RAG context. Phase 1 provides the branded layout, shadcn/ui components, and Tailwind theme.

---

## 1. Vercel AI SDK `useChat` Hook (AI SDK 6)

### 1.1 Architecture Overview

AI SDK 6 introduces a **transport-based architecture** for `useChat`. The hook no longer uses `handleSubmit`/`input` bindings directly -- instead it exposes `sendMessage`, `messages`, `status`, and `error`. Messages use a **parts-based model** where each message contains an array of typed parts (`text`, `file`, `tool-invocation`, `source`, `reasoning`).

Key API surface for Phase 3:

```typescript
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';

const { messages, sendMessage, status, error, stop, regenerate } = useChat({
  transport: new DefaultChatTransport({
    api: '/api/chat',
  }),
  onError: (error) => {
    // Custom error handling -- map to French messages here
  },
  onFinish: ({ message, messages, isAbort, isDisconnect, isError }) => {
    // Fires when assistant response is complete
    // Use to trigger dashboard transition (Phase 4)
  },
});
```

### 1.2 Status States

The `status` field drives all UI states in the chat interface:

| Status | Meaning | UI Behavior |
|--------|---------|-------------|
| `'ready'` | Idle, can accept input | Enable input, show send button |
| `'submitted'` | Request sent, waiting for first token | Show loading indicator (pulsing dots) |
| `'streaming'` | Tokens arriving from Claude | Display streaming text, show stop button |
| `'error'` | Request failed | Show French error message, show retry button |

### 1.3 Message Parts Model

AI SDK 6 replaces the flat `message.content` string with `message.parts[]`. Each part has a `type` discriminator:

```typescript
message.parts.map((part, index) => {
  switch (part.type) {
    case 'text':
      return <MarkdownRenderer key={index} content={part.text} />;
    case 'source':
      return <SourceBadge key={index} url={part.source.url} />;
    case 'tool-invocation':
      return <ToolResult key={index} data={part.toolInvocation} />;
    default:
      return null;
  }
});
```

This is critical for Phase 3: the assistant's streamed text arrives as `text` parts that update progressively. When Phase 4 adds dashboard data via tool_use, those will arrive as `tool-invocation` parts on the same message.

### 1.4 Server-Side Route Handler

The API route uses `streamText` + `toUIMessageStreamResponse()` to bridge Claude's output to the `useChat` client:

```typescript
// src/app/api/chat/route.ts (built in Phase 2, consumed in Phase 3)
import { convertToModelMessages, streamText, type UIMessage } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    model: anthropic('claude-sonnet-4-20250514'),
    system: buildSystemPrompt(ragContext),
    messages: await convertToModelMessages(messages),
    onError({ error }) {
      console.error('Stream error:', error);
    },
  });

  return result.toUIMessageStreamResponse();
}
```

### 1.5 Dependencies to Install

```bash
npm install ai @ai-sdk/react @ai-sdk/anthropic react-markdown
```

Note: `ai` is the core AI SDK package. `@ai-sdk/react` provides `useChat`. `@ai-sdk/anthropic` is the Claude provider. These are not yet in `package.json`.

---

## 2. Chat UI Components with shadcn/ui

### 2.1 Component Architecture

The chat interface requires five custom components built on top of existing shadcn/ui primitives (`Card`, `Button`) plus new shadcn components to install:

```
src/components/chat/
  ChatContainer.tsx      -- Full-page layout, manages empty/active states
  ChatInput.tsx          -- Textarea + send button, handles submit
  MessageBubble.tsx      -- Single message (user or assistant), renders parts
  StreamingText.tsx      -- Progressive markdown rendering for assistant messages
  SuggestedPrompts.tsx   -- Clickable example prompts for empty state
  ChatErrorBanner.tsx    -- French-language error display with retry
```

### 2.2 shadcn/ui Components Needed

Install additional shadcn components for the chat interface:

```bash
npx shadcn@latest add textarea scroll-area avatar badge alert
```

- **Textarea** -- Chat input field (with `InputGroup` for the send button addon)
- **ScrollArea** -- Scrollable message container with custom scrollbar
- **Avatar** -- User/assistant avatar indicators in message bubbles
- **Badge** -- For suggested prompt chips
- **Alert** -- For error message display

### 2.3 ChatContainer Layout

The container manages the full chat page layout with two states: empty (showing suggested prompts) and active (showing messages + input).

```typescript
// Conceptual structure
function ChatContainer() {
  const { messages, sendMessage, status, error, regenerate } = useChat({ ... });
  const hasMessages = messages.length > 0;

  return (
    <div className="flex flex-col h-screen">
      {/* Header with MetLife branding */}
      <ChatHeader />

      {/* Message area or empty state */}
      <ScrollArea className="flex-1">
        {hasMessages ? (
          <MessageList messages={messages} status={status} />
        ) : (
          <EmptyState onPromptClick={(text) => sendMessage({ text })} />
        )}
      </ScrollArea>

      {/* Error banner */}
      {error && <ChatErrorBanner error={error} onRetry={regenerate} />}

      {/* Input area - pinned to bottom */}
      <ChatInput
        onSubmit={(text) => sendMessage({ text })}
        disabled={status !== 'ready'}
        status={status}
      />
    </div>
  );
}
```

### 2.4 Message Bubble Design

Two visual variants: user messages (right-aligned, MetLife Blue background) and assistant messages (left-aligned, light gray background):

```typescript
// Design tokens for message bubbles
const bubbleStyles = {
  user: 'ml-auto bg-metlife-blue text-white rounded-2xl rounded-br-sm max-w-[80%]',
  assistant: 'mr-auto bg-muted text-foreground rounded-2xl rounded-bl-sm max-w-[85%]',
};
```

Key design decisions:
- **Max width constraint:** User bubbles cap at 80%, assistant at 85% (assistant messages tend to be longer)
- **Asymmetric border radius:** The bubble corner nearest the sender is squared off (`rounded-br-sm` for user, `rounded-bl-sm` for assistant) -- this is a standard chat UI pattern that visually connects the bubble to its sender
- **No avatars for user:** Just the bubble color differentiates. The assistant gets the MetLife logo as an avatar
- **Padding:** `px-4 py-3` for comfortable reading, especially on mobile

### 2.5 ChatInput Component

Uses shadcn `InputGroup` pattern with a textarea that auto-expands and a send button:

```typescript
// Key behaviors:
// - Auto-resize textarea (min 1 row, max 5 rows)
// - Enter to send, Shift+Enter for newline
// - Disabled state during streaming (visual grayout + disabled attribute)
// - Send button transforms to Stop button during streaming
// - Character count or subtle placeholder change when approaching limits
```

The input area should use the `InputGroupTextarea` + `InputGroupAddon` pattern from shadcn v4:

```tsx
<InputGroup>
  <InputGroupTextarea
    placeholder="Décrivez votre situation (métier, âge, préoccupations)..."
    className="min-h-[48px] max-h-[160px] resize-none"
    onKeyDown={handleKeyDown}
  />
  <InputGroupAddon align="block-end">
    {status === 'streaming' ? (
      <InputGroupButton onClick={stop}>
        <SquareIcon className="size-4" />
      </InputGroupButton>
    ) : (
      <InputGroupButton onClick={handleSubmit} disabled={!input.trim()}>
        <SendIcon className="size-4" />
      </InputGroupButton>
    )}
  </InputGroupAddon>
</InputGroup>
```

---

## 3. Streaming Text Rendering

### 3.1 Progressive Markdown with react-markdown

The assistant's response streams token-by-token. We need to render this as formatted markdown in real time without layout thrashing or flicker.

**Approach:** Use `react-markdown` with the `components` prop to map markdown elements to MetLife-styled components. The streaming text is simply the concatenated `text` parts from the message -- react-markdown handles re-rendering as the text grows.

```typescript
import Markdown from 'react-markdown';

function StreamingText({ content }: { content: string }) {
  return (
    <Markdown
      components={{
        p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
        strong: ({ children }) => (
          <strong className="font-semibold text-primary-dark">{children}</strong>
        ),
        ul: ({ children }) => <ul className="list-disc pl-4 mb-2 space-y-1">{children}</ul>,
        li: ({ children }) => <li className="text-sm">{children}</li>,
        a: ({ href, children }) => (
          <a href={href} target="_blank" rel="noopener" className="text-primary underline">
            {children}
          </a>
        ),
        h3: ({ children }) => (
          <h3 className="font-semibold text-base mt-3 mb-1">{children}</h3>
        ),
      }}
    >
      {content}
    </Markdown>
  );
}
```

### 3.2 Performance Considerations for Streaming Markdown

**Problem:** re-rendering the full markdown on every token can be expensive for long responses. Claude responses for this use case will typically be 300-800 tokens (30-60 seconds of streaming at typical rates), which react-markdown handles without issue.

**Optimization if needed:** Memoize completed paragraphs. The AI SDK cookbook documents a memoization pattern where only the last paragraph (actively streaming) is re-parsed, while completed paragraphs are cached:

```typescript
// react-markdown memoization pattern (from AI SDK cookbook)
// Split content by double newline, memoize all but the last block
const blocks = content.split('\n\n');
const completedBlocks = blocks.slice(0, -1);  // Memoized
const activeBlock = blocks[blocks.length - 1]; // Re-rendered on each token
```

For Phase 3 prototype, start without memoization. Add it only if rendering performance becomes noticeable (unlikely at this response length).

### 3.3 Streaming Cursor / Typing Indicator

During streaming (`status === 'streaming'`), show a blinking cursor at the end of the text to indicate the response is still arriving:

```css
/* Streaming cursor animation */
@keyframes blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}

.streaming-cursor::after {
  content: '';
  display: inline-block;
  width: 2px;
  height: 1em;
  background-color: currentColor;
  margin-left: 2px;
  vertical-align: text-bottom;
  animation: blink 1s infinite;
}
```

During `status === 'submitted'` (before first token arrives), show three pulsing dots inside an assistant bubble to indicate processing:

```typescript
function LoadingDots() {
  return (
    <div className="flex gap-1 items-center px-4 py-3">
      <span className="size-2 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:0ms]" />
      <span className="size-2 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:150ms]" />
      <span className="size-2 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:300ms]" />
    </div>
  );
}
```

---

## 4. Error Handling Patterns

### 4.1 Error Categories and French Messages

All user-facing errors must be in French, professional tone. Map technical errors to human-friendly messages:

```typescript
// src/lib/chat-errors.ts

interface ChatError {
  title: string;
  message: string;
  action: 'retry' | 'wait' | 'contact';
  retryable: boolean;
}

export function mapErrorToFrench(error: Error): ChatError {
  const message = error.message?.toLowerCase() || '';

  // Rate limiting (Claude API 429)
  if (message.includes('rate') || message.includes('429')) {
    return {
      title: 'Un instant, s\'il vous plait',
      message: 'Notre service est temporairement surchargé. Veuillez réessayer dans quelques secondes.',
      action: 'wait',
      retryable: true,
    };
  }

  // API key / auth errors (500, 401, 403)
  if (message.includes('401') || message.includes('403') || message.includes('api_key')) {
    return {
      title: 'Service indisponible',
      message: 'Notre service d\'analyse est momentanément indisponible. Nous vous invitons à contacter directement un conseiller MetLife.',
      action: 'contact',
      retryable: false,
    };
  }

  // Network errors
  if (message.includes('network') || message.includes('fetch') || message.includes('timeout')) {
    return {
      title: 'Problème de connexion',
      message: 'La connexion a été interrompue. Vérifiez votre connexion internet et réessayez.',
      action: 'retry',
      retryable: true,
    };
  }

  // Claude overloaded (529)
  if (message.includes('overloaded') || message.includes('529')) {
    return {
      title: 'Service en forte demande',
      message: 'Notre assistant est très sollicité en ce moment. Veuillez réessayer dans un instant.',
      action: 'wait',
      retryable: true,
    };
  }

  // Stream disconnected mid-response
  if (message.includes('disconnect') || message.includes('aborted')) {
    return {
      title: 'Réponse interrompue',
      message: 'La réponse a été interrompue. Vous pouvez relancer votre demande.',
      action: 'retry',
      retryable: true,
    };
  }

  // Default fallback
  return {
    title: 'Une erreur est survenue',
    message: 'Nous n\'avons pas pu traiter votre demande. Veuillez réessayer ou contacter un conseiller MetLife.',
    action: 'retry',
    retryable: true,
  };
}
```

### 4.2 Error UI Component

Errors display in an Alert-style banner between the messages and the input, using the `regenerate()` function from `useChat` for retry:

```typescript
function ChatErrorBanner({ error, onRetry }: { error: Error; onRetry: () => void }) {
  const chatError = mapErrorToFrench(error);

  return (
    <Alert variant="destructive" className="mx-4 mb-2">
      <AlertCircleIcon className="size-4" />
      <AlertTitle>{chatError.title}</AlertTitle>
      <AlertDescription>{chatError.message}</AlertDescription>
      {chatError.retryable && (
        <Button variant="outline" size="sm" onClick={onRetry} className="mt-2">
          Réessayer
        </Button>
      )}
      {chatError.action === 'contact' && (
        <Button variant="outline" size="sm" className="mt-2">
          Contacter un conseiller
        </Button>
      )}
    </Alert>
  );
}
```

### 4.3 Server-Side Error Handling

The API route should catch errors and return structured responses that the client can interpret:

```typescript
// In /api/chat/route.ts
export async function POST(req: Request) {
  try {
    // ... streamText call
    return result.toUIMessageStreamResponse();
  } catch (error) {
    // Return a structured error the client can parse
    const status = error instanceof Anthropic.RateLimitError ? 429
      : error instanceof Anthropic.AuthenticationError ? 401
      : 500;

    return new Response(
      JSON.stringify({ error: error.message }),
      { status, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
```

### 4.4 Graceful Fallback for Unrecognized TNS Profiles (UX-03)

This is handled at the **prompt engineering** level (Phase 2), but the UI must support the pattern. When Claude cannot confidently match a TNS profile to MetLife products, it should include a fallback message. The Phase 3 UI responsibility is:

1. **Detect the fallback:** The assistant's response will contain a specific phrase or a `tool-invocation` result with a `fallback: true` flag
2. **Render a contact CTA:** Show a prominent "Contacter un conseiller MetLife" button inline in the response

```typescript
// Fallback message template (injected via system prompt in Phase 2)
const FALLBACK_TEMPLATE = `
Votre situation est spécifique et mérite une attention particulière.
Je vous recommande d'échanger directement avec un conseiller MetLife
qui pourra vous accompagner de manière personnalisée.
`;

// In the message renderer, detect fallback text and enhance with CTA
function MessageContent({ message }: { message: UIMessage }) {
  const text = message.parts.filter(p => p.type === 'text').map(p => p.text).join('');
  const isFallback = text.includes('conseiller MetLife') && text.includes('spécifique');

  return (
    <>
      <StreamingText content={text} />
      {isFallback && (
        <Button className="mt-3" variant="default">
          <PhoneIcon className="size-4 mr-2" />
          Contacter un conseiller MetLife
        </Button>
      )}
    </>
  );
}
```

---

## 5. Suggested Prompts (CONV-02)

### 5.1 Empty State Design

When no messages exist, the chat area shows a welcome message and clickable example prompts. This is the prospect's first impression and must communicate what the tool does without being overwhelming.

**Layout:**
```
+--------------------------------------+
|         [MetLife Logo]               |
|                                      |
|   Bienvenue dans votre              |
|   espace prospect intelligent       |
|                                      |
|   Décrivez votre situation et       |
|   découvrez comment MetLife         |
|   peut vous accompagner.            |
|                                      |
|   [Example prompt 1              ]  |
|   [Example prompt 2              ]  |
|   [Example prompt 3              ]  |
|   [Example prompt 4              ]  |
|                                      |
+--------------------------------------+
|   [Input area                     ]  |
+--------------------------------------+
```

### 5.2 Example Prompts

Each prompt represents a common TNS profile and pre-fills + auto-submits when clicked:

```typescript
const SUGGESTED_PROMPTS = [
  {
    label: 'Kiné libéral',
    text: 'Je suis kinésithérapeute libéral, 35 ans, installé depuis 3 ans. Je m\'inquiète surtout pour les arrêts de travail et l\'impact sur mon cabinet.',
    icon: 'Stethoscope',
  },
  {
    label: 'Artisan du bâtiment',
    text: 'Je suis artisan plombier, 42 ans, avec 2 salariés. Je viens de contracter un prêt pour mon local professionnel. Quels risques dois-je couvrir en priorité ?',
    icon: 'Wrench',
  },
  {
    label: 'Commerçante',
    text: 'Je suis commerçante, 38 ans, je gère une boutique en centre-ville. Mon conjoint travaille avec moi. Comment protéger notre activité et notre famille ?',
    icon: 'Store',
  },
  {
    label: 'Consultant indépendant',
    text: 'Je suis consultant IT en freelance, 29 ans, micro-entrepreneur. Je n\'ai aucune protection sociale complémentaire pour le moment.',
    icon: 'Laptop',
  },
] as const;
```

### 5.3 Interaction Pattern

Clicking a prompt should:
1. Fill the input with the prompt text (visible briefly)
2. Auto-submit immediately via `sendMessage({ text: prompt.text })`
3. The empty state disappears as the user message appears
4. Stream begins

No need for a two-step "fill then confirm" pattern -- the prompts are designed as complete, ready-to-send messages.

---

## 6. Accessibility (a11y)

### 6.1 ARIA Roles and Live Regions

The chat interface must be screen-reader accessible:

```typescript
// ChatContainer accessibility structure
<main role="main" aria-label="Conversation avec l'assistant MetLife">
  <div role="log" aria-live="polite" aria-label="Messages de la conversation">
    {messages.map(m => (
      <article
        key={m.id}
        role="article"
        aria-label={m.role === 'user' ? 'Votre message' : 'Réponse de l\'assistant'}
      >
        {/* message content */}
      </article>
    ))}
  </div>

  {status === 'submitted' && (
    <div aria-live="assertive" role="status">
      L'assistant analyse votre situation...
    </div>
  )}

  <form
    role="form"
    aria-label="Envoyer un message"
    onSubmit={handleSubmit}
  >
    <textarea
      aria-label="Décrivez votre situation"
      aria-describedby="chat-input-help"
    />
    <span id="chat-input-help" className="sr-only">
      Appuyez sur Entrée pour envoyer, Maj+Entrée pour un retour à la ligne
    </span>
  </form>
</main>
```

### 6.2 Keyboard Navigation

| Key | Context | Action |
|-----|---------|--------|
| `Enter` | Input focused | Send message |
| `Shift+Enter` | Input focused | New line in input |
| `Escape` | During streaming | Stop generation (calls `stop()`) |
| `Tab` | Empty state | Navigate between suggested prompts |
| `Enter`/`Space` | Suggested prompt focused | Submit that prompt |

### 6.3 Focus Management

- After sending a message, focus returns to the input field
- After an error, focus moves to the retry button
- The message area auto-scrolls to the latest message but does not steal focus from the input
- Suggested prompts are focusable buttons with visible focus rings (shadcn/ui provides this via `focus-visible:border-ring focus-visible:ring-3`)

### 6.4 Color Contrast

MetLife brand colors have specific contrast considerations (documented in Phase 1 research):
- **MetLife Blue `#0090DA` on white:** 3.6:1 -- passes AA for large text only. Use for headings, buttons, but not small body text
- **MetLife Navy `#0061A0` on white:** 5.2:1 -- passes AA for all text sizes. Use for assistant message text
- **User bubble text (white on `#0090DA`):** 3.6:1 -- passes AA for large text. Since messages are 14-16px, this is borderline. Consider using `#0061A0` (navy) as the user bubble background instead for better contrast (white on navy = 5.2:1)

### 6.5 Reduced Motion

Respect `prefers-reduced-motion` for the streaming cursor and loading dots:

```css
@media (prefers-reduced-motion: reduce) {
  .streaming-cursor::after {
    animation: none;
    opacity: 1;
  }
  .animate-bounce {
    animation: none;
  }
}
```

---

## 7. Mobile Responsiveness

### 7.1 Mobile Layout Considerations

While full mobile optimization is Phase 6 (UX-01), Phase 3 should build mobile-friendly foundations to avoid costly retrofits:

- **Viewport:** The chat takes 100% of viewport height (`h-dvh` -- dynamic viewport height, handles iOS Safari bottom bar)
- **Input pinning:** The input area must remain visible above the mobile keyboard. Use `position: sticky; bottom: 0` with proper viewport unit handling
- **Touch targets:** All interactive elements (send button, suggested prompts, retry button) must be at least 44x44px (Apple HIG) / 48x48dp (Material)
- **Suggested prompts:** On mobile (<640px), prompts stack vertically as full-width cards instead of a grid

### 7.2 Virtual Keyboard Handling

The most common chat UI bug on mobile: the virtual keyboard pushes content off-screen or hides the input.

```typescript
// Use dvh (dynamic viewport height) instead of vh
// This accounts for mobile browser chrome and virtual keyboard
<div className="flex flex-col h-dvh">
  <ScrollArea className="flex-1 min-h-0">
    {/* messages */}
  </ScrollArea>
  <div className="sticky bottom-0 bg-background border-t p-3">
    {/* input */}
  </div>
</div>
```

### 7.3 Responsive Breakpoints

| Breakpoint | Layout Change |
|-----------|---------------|
| `<640px` (sm) | Suggested prompts: single column, full-width. Message bubbles: max-width 90%. Input: full width, no margins. |
| `640px-1024px` (md) | Suggested prompts: 2-column grid. Message bubbles: max-width 85%. Centered container with side padding. |
| `>1024px` (lg) | Max-width 768px container centered. This prepares for Phase 4 when the chat panel shrinks to 1/3 width. |

---

## 8. Component File Structure

### 8.1 New Files to Create

```
src/
  app/
    chat/
      page.tsx                    -- Chat page (client component)
  components/
    chat/
      ChatContainer.tsx           -- Main layout, orchestrates useChat
      ChatHeader.tsx              -- MetLife logo + title bar
      ChatInput.tsx               -- Textarea + send/stop button
      MessageBubble.tsx           -- Single message bubble (user or assistant)
      MessageList.tsx             -- Scrollable message list
      StreamingText.tsx           -- Markdown renderer for streaming content
      SuggestedPrompts.tsx        -- Empty state with clickable prompts
      ChatErrorBanner.tsx         -- French error display with retry
      LoadingDots.tsx             -- Pulsing dots indicator
  lib/
    chat-errors.ts               -- Error mapping to French messages
```

### 8.2 shadcn Components to Install

```bash
npx shadcn@latest add textarea scroll-area avatar badge alert input-group
```

### 8.3 npm Dependencies to Install

```bash
npm install ai @ai-sdk/react @ai-sdk/anthropic react-markdown
```

---

## 9. Key Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| AI SDK 6 `useChat` API differs from training data | Incorrect hook usage, broken streaming | Verified API against context7 docs (March 2026). Key change: `sendMessage` replaces `handleSubmit`, `DefaultChatTransport` is required, messages use `parts[]` not `content`. |
| Streaming markdown causes layout shifts | Jarring UX, content jumps during streaming | Set `min-height` on assistant bubble, use CSS `overflow-wrap: break-word`, test with long responses. |
| react-markdown performance on long streams | UI becomes sluggish during streaming | Claude responses for TNS analysis are 300-800 tokens -- within react-markdown's comfortable range. Memoization pattern available as fallback. |
| Mobile keyboard hides input | Prospect cannot type on mobile | Use `h-dvh` instead of `h-screen`, `position: sticky` for input, test on iOS Safari and Chrome Android. |
| Error messages leak technical details | Unprofessional, confusing for prospects | All errors pass through `mapErrorToFrench()` -- never display raw error.message to the user. |
| Phase 2 API route not ready | Cannot build complete flow | Build UI with mock data first. Create a mock transport that returns canned streaming responses for development. |
| shadcn v4 `InputGroup` component API | May differ from docs | Verify after `npx shadcn@latest add input-group`. Fallback: build custom input group with Tailwind flex layout. |

---

## Validation Architecture

### V1: Chat UI Renders (CONV-01)

**Test:** Navigate to `/chat`, verify the page renders correctly.

| Criterion | How to Validate | Pass Condition |
|-----------|----------------|----------------|
| Chat page loads | Navigate to `localhost:3000/chat` | Page renders without console errors |
| MetLife branding applied | Visual inspection | MetLife logo in header, brand colors in message bubbles, Inter font |
| Empty state visible | Check initial render | Welcome message + 4 suggested prompts visible |
| Input area functional | Type in textarea | Text appears, send button activates when input is non-empty |
| Layout is full-height | Inspect container | Chat container fills viewport height (h-dvh) |

### V2: Suggested Prompts (CONV-02)

**Test:** Click each suggested prompt and verify behavior.

| Criterion | How to Validate | Pass Condition |
|-----------|----------------|----------------|
| Prompts are clickable | Click each of the 4 prompts | Prompt text appears as user message in chat |
| Auto-submit works | Click a prompt | Message is sent immediately (status changes to `submitted` then `streaming`) |
| Empty state disappears | Click a prompt | Welcome message and prompts are replaced by the message list |
| Keyboard accessible | Tab to prompt, press Enter | Same behavior as clicking |

### V3: Streaming Display (CONV-03)

**Test:** Send a message and verify streaming response renders correctly.

| Criterion | How to Validate | Pass Condition |
|-----------|----------------|----------------|
| Loading indicator shown | Send message, observe `submitted` state | Pulsing dots appear in assistant bubble before first token |
| Text streams progressively | Watch assistant response | Text appears word-by-word, not all at once |
| Markdown renders correctly | Verify response with bold, lists, headings | Bold text, bullet lists, and headings render with correct formatting |
| Streaming cursor visible | During streaming | Blinking cursor at end of text |
| Auto-scroll works | Long response | Message area scrolls to show latest content |
| Stop button works | Click stop during streaming | Streaming halts, status returns to `ready` |

### V4: Error Handling (CONV-06)

**Test:** Simulate API failures and verify French error messages.

| Criterion | How to Validate | Pass Condition |
|-----------|----------------|----------------|
| Network error message | Disconnect network, send message | French error: "Problème de connexion..." with retry button |
| Rate limit message | Return 429 from API | French error: "Un instant..." with wait suggestion |
| Auth error message | Return 401 from API | French error: "Service indisponible..." with contact button |
| Retry works | Click retry button after error | Message is resent via `regenerate()` |
| No technical leakage | Inspect all error states | No English text, no stack traces, no HTTP codes visible to user |
| Input disabled on error | Observe input state | Input field is disabled when error is displayed |

### V5: TNS Fallback (UX-03)

**Test:** Send an unrecognized TNS profile description and verify graceful fallback.

| Criterion | How to Validate | Pass Condition |
|-----------|----------------|----------------|
| Fallback message appears | Send: "Je suis chauffeur VTC, 25 ans" | Response includes "Votre situation est spécifique" or similar advisor-redirect language |
| Contact CTA displayed | Check fallback response | A "Contacter un conseiller MetLife" button appears in/after the response |
| No fabricated products | Read response carefully | No invented product names or coverage amounts for the unrecognized profile |
| Tone is professional | Read response tone | Empathetic, not dismissive. The prospect should feel acknowledged, not rejected |

### V6: Accessibility

**Test:** Keyboard-only and screen reader testing.

| Criterion | How to Validate | Pass Condition |
|-----------|----------------|----------------|
| Keyboard-only operation | Navigate entire chat without mouse | Can tab to prompts, type message, submit with Enter, access retry button |
| Screen reader announces messages | Test with VoiceOver (macOS) | New messages announced via `aria-live="polite"` region |
| Loading state announced | Test with VoiceOver during streaming | "L'assistant analyse votre situation..." announced |
| Focus returns to input | Send message, verify focus | After message is sent, focus returns to textarea |
| Reduced motion respected | Enable reduced motion in OS settings | No animations (cursor blink, bouncing dots stop) |

### V7: Mobile Compatibility

**Test:** Test on mobile viewport (375px width minimum).

| Criterion | How to Validate | Pass Condition |
|-----------|----------------|----------------|
| Full-width layout | Resize to 375px | No horizontal overflow, all content visible |
| Suggested prompts stack | Check empty state at 375px | Prompts display as single column, full-width |
| Input visible with keyboard | Open mobile DevTools keyboard | Input area remains visible above virtual keyboard |
| Touch targets sufficient | Measure button sizes | All buttons >= 44px touch target |
| Message bubbles readable | Check text at mobile width | Text wraps correctly, no truncation, readable font size |

### Validation Script

```typescript
// scripts/validate-phase3.ts
// Manual checklist runner for Phase 3 validation

const CHECKLIST = {
  'V1-chat-renders': [
    'Page loads at /chat without errors',
    'MetLife logo visible in header',
    'Brand colors applied (blue bubbles, white bg)',
    'Empty state shows welcome + prompts',
  ],
  'V2-suggested-prompts': [
    'Click "Kiné libéral" prompt -> message sent',
    'Click "Artisan du bâtiment" prompt -> message sent',
    'Click "Commerçante" prompt -> message sent',
    'Click "Consultant indépendant" prompt -> message sent',
    'Tab + Enter works on prompts',
  ],
  'V3-streaming': [
    'Loading dots appear before first token',
    'Text streams progressively (not all at once)',
    'Markdown bold/lists render correctly',
    'Auto-scroll follows new content',
    'Stop button halts streaming',
  ],
  'V4-errors': [
    'Network error -> French message + retry',
    'API error -> French message + contact CTA',
    'Retry button resends message',
    'No English/technical text in errors',
  ],
  'V5-fallback': [
    'Unrecognized TNS -> advisor redirect message',
    'Contact CTA button appears',
    'No fabricated product info',
  ],
  'V6-a11y': [
    'Full keyboard-only operation',
    'VoiceOver announces new messages',
    'Focus returns to input after send',
  ],
  'V7-mobile': [
    'No overflow at 375px width',
    'Prompts stack vertically on mobile',
    'Input stays visible with keyboard open',
  ],
};

console.log('Phase 3 Validation Checklist');
console.log('============================');
for (const [section, items] of Object.entries(CHECKLIST)) {
  console.log(`\n${section}:`);
  items.forEach((item, i) => console.log(`  [ ] ${i + 1}. ${item}`));
}
```

---

*Research completed: 2026-03-20*
*Sources: ai-sdk.dev (AI SDK 6 docs), ui.shadcn.com (shadcn v4), github.com/remarkjs/react-markdown, WAI-ARIA chat pattern guidelines, Apple HIG touch target guidelines*
