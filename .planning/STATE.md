---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: unknown
last_updated: "2026-03-20T16:02:00.000Z"
progress:
  total_phases: 6
  completed_phases: 2
  total_plans: 15
  completed_plans: 9
---

# Project State

## Current Phase

Phase 3: Conversational UI (In Progress, 2/4 plans done)

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-20)
**Core value:** Un TNS qui arrive sur le site comprend en moins de 2 minutes comment MetLife peut l'aider, à travers une expérience conversationnelle simple et personnalisée.
**Current focus:** Phase 03 — conversational-ui (03-01 + 03-02 complete)

## Phase Status

| Phase | Name | Status |
|-------|------|--------|
| 1 | Foundation & Data Acquisition | ● Complete (3/3) |
| 2 | Core AI Loop | ● Complete (4/4) |
| 3 | Conversational UI | ◐ In Progress (2/4) |
| 4 | Dashboard & Transition Animation | ○ Pending |
| 5 | Persistence & Legal Compliance | ○ Pending |
| 6 | Hardening & Demo Preparation | ○ Pending |

## Decisions Log

- **[Phase 01, Plan 01]** Used temp directory workaround for create-next-app (uppercase "METLife" dir violates npm naming rules)
- **[Phase 01, Plan 01]** Preserved shadcn/ui CSS variables alongside MetLife brand theme for component compatibility
- **[Phase 01, Plan 01]** Used custom Drizzle type for F32_BLOB vector column (Turso native vector search)
- **[Phase 01, Plan 02]** URL-based classification for product types (reliable for metlife.fr's structured URL hierarchy)
- **[Phase 01, Plan 02]** French text token estimation at 1.3x word count multiplier
- **[Phase 01, Plan 02]** Target chunk size ~400 tokens for optimal voyage-finance-2 retrieval precision
- **[Phase 01, Plan 03]** Raw SQL via @libsql/client for vector operations (Drizzle ORM F32_BLOB compatibility issues)
- **[Phase 01, Plan 03]** Batch size 64 for Voyage AI API calls (conservative, under 128 limit)
- **[Phase 01, Plan 03]** 70% pass threshold for validation query accuracy
- **[Phase 02, Plan 02]** XML source tags with metadata attributes for structured RAG context injection (Anthropic best practices)
- **[Phase 02, Plan 02]** 1-indexed source IDs matching [1], [2] citation format in Claude responses
- **[Phase 02, Plan 02]** Mock-based testing default for validation script (Voyage AI rate limits); --live flag for integration testing
- **[Phase 02, Plan 01]** createAnthropic with explicit baseURL and loadApiKey fallback (Claude Code runtime env conflicts)
- **[Phase 02, Plan 01]** RAG graceful degradation: proceed with empty context when Voyage AI is rate-limited
- **[Phase 02, Plan 01]** UIMessage.parts text extraction (AI SDK 6 removed .content property)
- **[Phase 02, Plan 03]** Used inputSchema (not parameters) for AI SDK 6 Tool type compatibility
- **[Phase 02, Plan 03]** Exported sub-schemas individually for Phase 4 dashboard component reuse
- **[Phase 02, Plan 04]** Explicit zodSchema() wrapper for Zod v4 in Next.js bundler (auto-detection fails)
- **[Phase 02, Plan 04]** Separated Claude streaming latency from RAG/embedding latency for validation (Voyage AI free tier ~22s)
- **[Phase 02, Plan 04]** Strengthened no-price system prompt constraint (Claude was quoting RAG source amounts)
- **[Phase 02, Plan 04]** Fixed libsql vector_top_k: returns rowid only, no distance column
- **[Phase 03, Plan 02]** Status-driven UI pattern: ChatInput status prop controls disabled state, button variant, and aria-live announcements
- **[Phase 03, Plan 02]** Prompt auto-submit: SuggestedPrompts onPromptClick calls same handleSubmit as ChatInput (no two-step confirm)

---
*Initialized: 2026-03-20*
