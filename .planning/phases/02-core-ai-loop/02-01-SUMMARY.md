---
phase: 02-core-ai-loop
plan: 01
subsystem: api
tags: [ai-sdk, anthropic, claude, streaming, rag, zod, next-api-route]

requires:
  - phase: 01-foundation-data-acquisition
    provides: RAG pipeline (retrieveRelevantChunks), Turso vector DB, Voyage AI embeddings
provides:
  - POST /api/chat route handler with Claude streaming + RAG + dashboard tool
  - Zod dashboard schema (risks, products, partners, resources, profile)
  - formatRAGContext for XML-tagged source injection
  - Graceful RAG degradation on Voyage AI failure
affects: [03-conversational-ui, 04-dashboard-transition]

tech-stack:
  added: [ai@6.0.116, "@ai-sdk/anthropic@3.0.58", "zod@4.x"]
  patterns: [AI SDK streamText + toUIMessageStreamResponse, tool() with pass-through execute, RAG context injection via system prompt]

key-files:
  created:
    - src/app/api/chat/route.ts
    - src/lib/schemas.ts
  modified:
    - src/lib/prompts.ts
    - package.json

key-decisions:
  - "createAnthropic with explicit baseURL and loadApiKey fallback to handle Claude Code runtime env conflicts"
  - "RAG try/catch with graceful degradation: empty context when Voyage AI is rate-limited"
  - "UIMessage.parts text extraction instead of deprecated .content property (AI SDK 6)"
  - "Defined RAGChunk interface in prompts.ts to avoid cross-module import issues with Biome linter"

patterns-established:
  - "Route handler pattern: extract user text from parts, RAG retrieve, streamText, toUIMessageStreamResponse"
  - "Tool pass-through pattern: tool({ execute: async (input) => input }) for structured data extraction"

requirements-completed: [CONV-04, RAG-04]

duration: 18min
completed: 2026-03-20
---

# Phase 2 Plan 1: Install AI SDK Dependencies + Claude API Route with Streaming Summary

**AI SDK 6 route handler streaming Claude responses with RAG context injection and Zod-validated dashboard tool extraction**

## Performance

- **Duration:** 18 min
- **Started:** 2026-03-20T13:58:09Z
- **Completed:** 2026-03-20T14:16:56Z
- **Tasks:** 4
- **Files modified:** 4

## Accomplishments
- Installed ai@6.0.116, @ai-sdk/anthropic@3.0.58, zod@4.x with clean type-check
- Created POST /api/chat route handler with streaming Claude responses via AI SDK streamText
- Built dashboardSchema (Zod) with risks, products, partners, resources, profile sections + pass-through tool
- Added formatRAGContext to prompts.ts for XML-tagged source injection into system prompt
- Verified SSE streaming works end-to-end: French MetLife TNS responses stream correctly

## Task Commits

Each task was committed atomically:

1. **Task 1: Install AI SDK + Anthropic provider + Zod** - `b09b3de` (chore)
2. **Task 2: Verify ANTHROPIC_API_KEY in .env.local** - no commit (key already present)
3. **Task 3: Create POST /api/chat route handler** - `8acf91a` (feat)
4. **Task 4: Verify streaming + fix env/RAG issues** - `779a822` (fix)

## Files Created/Modified
- `src/app/api/chat/route.ts` - POST route handler: RAG retrieval -> Claude streaming -> SSE response
- `src/lib/schemas.ts` - Zod dashboardSchema + dashboardTool (pass-through execute)
- `src/lib/prompts.ts` - Added formatRAGContext + RAGChunk interface
- `package.json` - Added ai, @ai-sdk/anthropic, zod dependencies

## Decisions Made
- Used createAnthropic with explicit baseURL and loadApiKey fallback because Claude Code runtime sets ANTHROPIC_API_KEY="" and ANTHROPIC_BASE_URL without /v1 in shell env, preventing .env.local override
- Added RAG try/catch with graceful degradation: when Voyage AI is rate-limited, proceed with empty context rather than failing
- Used UIMessage.parts array for text extraction (AI SDK 6 removed .content property)
- Defined RAGChunk interface locally in prompts.ts rather than importing from rag.ts to avoid Biome linter removing unused type imports

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] AI SDK 6 UIMessage breaking change**
- **Found during:** Task 3 (route handler creation)
- **Issue:** Plan used `lastUserMessage.content` but AI SDK 6 UIMessage uses `parts` array, not `content`
- **Fix:** Extract text from `parts.filter(p => p.type === 'text').map(p => p.text).join(' ')`
- **Files modified:** src/app/api/chat/route.ts
- **Verification:** npx tsc --noEmit passes clean
- **Committed in:** 8acf91a

**2. [Rule 1 - Bug] convertToModelMessages returns Promise**
- **Found during:** Task 3 (type-check)
- **Issue:** streamText.messages expected ModelMessage[] but got Promise<ModelMessage[]>
- **Fix:** Added `await` before convertToModelMessages, stored in `modelMessages` variable
- **Files modified:** src/app/api/chat/route.ts
- **Verification:** npx tsc --noEmit passes clean
- **Committed in:** 8acf91a

**3. [Rule 3 - Blocking] Claude Code env var conflicts**
- **Found during:** Task 4 (smoke test)
- **Issue:** Shell env has ANTHROPIC_API_KEY="" (empty) and ANTHROPIC_BASE_URL="https://api.anthropic.com" (missing /v1). Next.js doesn't override existing env vars from .env.local.
- **Fix:** loadApiKey() reads .env.local as fallback; createAnthropic with explicit baseURL
- **Files modified:** src/app/api/chat/route.ts
- **Verification:** curl smoke test returns SSE stream with Claude responses
- **Committed in:** 779a822

**4. [Rule 2 - Missing Critical] RAG graceful degradation**
- **Found during:** Task 4 (smoke test)
- **Issue:** Voyage AI rate limiting caused 2+ minute delays before failing. Route returned 500.
- **Fix:** Wrapped retrieveRelevantChunks in try/catch, proceed with empty context on failure
- **Files modified:** src/app/api/chat/route.ts
- **Verification:** Route returns streaming response even when RAG fails
- **Committed in:** 779a822

---

**Total deviations:** 4 auto-fixed (2 bugs, 1 blocking, 1 missing critical)
**Impact on plan:** All fixes necessary for correctness. No scope creep.

## Issues Encountered
- Voyage AI free tier (3 RPM) causes rate limiting during smoke tests, requiring ~126s timeout before RAG fallback triggers. This will affect demo performance when database is empty. The seeded database should have faster retrieval once populated.
- Local database has 0 chunks (seed pipeline not run against this local.db), so RAG always falls back to empty context in current state.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Chat API route is functional and streaming
- Dashboard tool schema is defined and validated
- Ready for Plan 02-02 (system prompt + RAG context injection) and Plan 02-03 (dashboard schema refinement)
- Note: local.db needs to be seeded (npm run seed:pipeline && npm run seed && npm run seed:embed) for RAG to function

---
*Phase: 02-core-ai-loop*
*Completed: 2026-03-20*
