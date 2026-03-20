---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: unknown
last_updated: "2026-03-20T15:21:41Z"
progress:
  total_phases: 6
  completed_phases: 3
  total_plans: 15
  completed_plans: 13
---

# Project State

## Current Phase

Phase 4: Dashboard & Transition Animation (In Progress, 2/4 plans done)

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-20)
**Core value:** Un TNS qui arrive sur le site comprend en moins de 2 minutes comment MetLife peut l'aider, à travers une expérience conversationnelle simple et personnalisée.
**Current focus:** Phase 04 — dashboard-transition

## Phase Status

| Phase | Name | Status |
|-------|------|--------|
| 1 | Foundation & Data Acquisition | ● Complete (3/3) |
| 2 | Core AI Loop | ● Complete (4/4) |
| 3 | Conversational UI | ● Complete (4/4) |
| 4 | Dashboard & Transition Animation | ◐ In Progress (2/4) |
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
- **[Phase 03, Plan 01]** User bubbles use bg-metlife-navy (#0061A0) for AA contrast with white text (5.2:1 ratio)
- **[Phase 03, Plan 01]** UIMessage.parts text extraction pattern for AI SDK 6 compatibility
- **[Phase 03, Plan 01]** h-dvh for mobile virtual keyboard compatibility instead of h-screen
- **[Phase 03, Plan 01]** prefers-reduced-motion support for streaming cursor animation
- **[Phase 03, Plan 02]** Status-driven UI pattern: ChatInput status prop controls disabled state, button variant, and aria-live announcements
- **[Phase 03, Plan 02]** Prompt auto-submit: SuggestedPrompts onPromptClick calls same handleSubmit as ChatInput (no two-step confirm)
- **[Phase 03, Plan 03]** useChat onFinish focuses input via forwarded ref (no manual status polling)
- **[Phase 03, Plan 03]** ChatErrorBanner wired to regenerate() for one-click retry on errors
- **[Phase 03, Plan 04]** Used buttonVariants() for anchor-styled buttons (base-ui Button lacks asChild support unlike Radix)
- **[Phase 03, Plan 04]** Two-indicator threshold for TNS fallback detection prevents false positives on casual "conseiller" mentions
- **[Phase 03, Plan 04]** Fallback CTA renders only after streaming completes (!isStreaming && !isLoading) to avoid premature display
- **[Phase 04, Plan 01]** Used buttonVariants() for ProductCard external link (base-ui Button lacks asChild)
- **[Phase 04, Plan 01]** Added clientProductSchema with optional coverageType/sourceIds for client-side dashboard rendering
- **[Phase 04, Plan 01]** dashboardDataSchema defaults partners/resources to empty arrays when omitted
- **[Phase 04, Plan 02]** Wrapped AI SDK toUIMessageStream with custom ReadableStream to emit named SSE "dashboard" event while preserving useChat protocol
- **[Phase 04, Plan 02]** Used toolResult.output (not .result) for AI SDK 6 TypedToolResult compatibility
- **[Phase 04, Plan 02]** Phase state machine pattern: chatting -> analyzing -> dashboard for useChatWithDashboard hook

---
*Initialized: 2026-03-20*
