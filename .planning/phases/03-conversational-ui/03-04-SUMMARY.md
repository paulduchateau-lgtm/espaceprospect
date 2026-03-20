---
phase: 03-conversational-ui
plan: 04
subsystem: ui, api
tags: [error-handling, french-i18n, chat, fallback, cta]

# Dependency graph
requires:
  - phase: 03-conversational-ui/03-01
    provides: MessageBubble component, StreamingText, chat shell
  - phase: 02-core-ai-loop
    provides: /api/chat route, system prompt with advisor-redirect language
provides:
  - chat-errors.ts utility mapping API errors to French messages
  - ChatErrorBanner component with retry/contact actions
  - TNS fallback CTA detection in MessageBubble
  - Hardened API route with try/catch and status-mapped error responses
affects: [03-conversational-ui, 06-hardening]

# Tech tracking
tech-stack:
  added: []
  patterns: [error-to-french-mapping, two-indicator-fallback-detection, status-mapped-api-errors]

key-files:
  created:
    - src/lib/chat-errors.ts
    - src/components/chat/ChatErrorBanner.tsx
  modified:
    - src/components/chat/MessageBubble.tsx
    - src/app/api/chat/route.ts

key-decisions:
  - "Used buttonVariants() for anchor-styled buttons (base-ui Button lacks asChild support)"
  - "Two-indicator threshold for fallback detection prevents false positives when Claude casually mentions 'conseiller'"
  - "Fallback CTA only renders after streaming completes to avoid premature display"

patterns-established:
  - "French error mapping: all user-facing errors go through mapErrorToFrench() — never show raw English or status codes"
  - "Fallback detection: content-based matching with multi-indicator threshold for confidence"

requirements-completed: [CONV-06, UX-03]

# Metrics
duration: 8min
completed: 2026-03-20
---

# Plan 03-04: Error Handling + French Messages + TNS Fallback Summary

**French error mapping utility, ChatErrorBanner with retry/contact actions, TNS fallback CTA detection, and hardened API route error handling**

## Performance

- **Duration:** 8 min
- **Tasks:** 4
- **Files created:** 2
- **Files modified:** 2

## Accomplishments
- All API error types (429, 401, 403, 529, network, stream disconnect, 500) mapped to professional French messages
- ChatErrorBanner renders contextual actions: "Réessayer" for retryable errors, "Contacter un conseiller" for auth/non-retryable
- MessageBubble detects advisor-redirect language with two-indicator threshold and shows inline MetLife contact CTA
- API route wrapped in try/catch with HTTP status codes matching error types for client-side classification

## Task Commits

Each task was committed atomically:

1. **Task 1: Create chat-errors.ts error mapping utility** - `7130d5c` (feat)
2. **Task 2: Create ChatErrorBanner component** - `7b954f1` (feat)
3. **Task 3: Add TNS fallback CTA detection to MessageBubble** - `cfa6a9e` (feat)
4. **Task 4: Harden API route error handling** - `da0c0d8` (feat)

## Files Created/Modified
- `src/lib/chat-errors.ts` - Maps Error objects to French ChatError with title, message, action type
- `src/components/chat/ChatErrorBanner.tsx` - Alert banner with retry/contact buttons
- `src/components/chat/MessageBubble.tsx` - Added FALLBACK_INDICATORS detection and inline CTA
- `src/app/api/chat/route.ts` - try/catch with status-mapped JSON error responses

## Decisions Made
- Used `buttonVariants()` className for anchor elements instead of `asChild` (base-ui Button does not support asChild like Radix)
- Two-indicator threshold for fallback detection: text must match at least 2 of 5 known advisor-redirect phrases
- Fallback CTA only appears after `!isStreaming && !isLoading` to prevent premature rendering during streaming

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Button asChild not available in base-ui**
- **Found during:** Task 2 (ChatErrorBanner) and Task 3 (MessageBubble)
- **Issue:** Plan used `<Button asChild><a href="...">` but base-ui Button does not support asChild
- **Fix:** Used `<a className={buttonVariants({...})}>` for anchor-styled buttons
- **Files modified:** src/components/chat/ChatErrorBanner.tsx, src/components/chat/MessageBubble.tsx
- **Verification:** Component renders correctly with proper styling
- **Committed in:** 7b954f1, cfa6a9e

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Necessary adaptation for component library compatibility. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Error handling layer complete, ready for Phase 3 completion (03-03 useChat integration will wire ChatErrorBanner)
- The ChatErrorBanner's `onRetry` prop maps to `regenerate()` from useChat (Plan 03-03)
- All Phase 3 success criteria are now addressable

---
*Phase: 03-conversational-ui*
*Completed: 2026-03-20*
