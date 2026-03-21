---
phase: 06-hardening-demo-preparation
plan: 02
subsystem: ui
tags: [demo-mode, fallback, performance, json-cache, streaming-simulation]

# Dependency graph
requires:
  - phase: 04-dashboard-transition-animation
    provides: dashboardDataSchema, useChatWithDashboard hook, DashboardData type
provides:
  - Demo fallback module with isDemoMode, matchDemoProfile, getDemoResponse exports
  - 3 pre-cached JSON demo responses (kine, architecte, infirmiere)
  - Performance timing instrumentation in useChatWithDashboard
  - Demo mode toggle via NEXT_PUBLIC_DEMO_MODE or ?demo=true query param
affects: [demo-script, live-pitch, deployment]

# Tech tracking
tech-stack:
  added: []
  patterns: [static-json-fallback, simulated-streaming, performance-instrumentation]

key-files:
  created:
    - src/lib/demo-fallback.ts
    - src/data/demo-responses/kine-liberal.json
    - src/data/demo-responses/architecte-independant.json
    - src/data/demo-responses/infirmiere-liberale.json
    - tests/demo-fallback.test.ts
  modified:
    - src/hooks/useChatWithDashboard.ts

key-decisions:
  - "Static JSON imports for demo responses (no dynamic loading or service workers)"
  - "30ms per-word simulated streaming for natural feel in demo mode"
  - "Performance timing uses performance.now() with [Perf] console log prefix"

patterns-established:
  - "Demo mode detection: NEXT_PUBLIC_DEMO_MODE env var or ?demo=true query param"
  - "Keyword-based profile matching: lowercase input scanned for profession keywords"
  - "Simulated streaming: word-by-word progressive reveal with 30ms delay"

requirements-completed: [UX-02]

# Metrics
duration: 2min
completed: 2026-03-21
---

# Phase 6 Plan 02: Demo Fallback & Performance Timing Summary

**Demo fallback system with 3 pre-cached JSON responses (kine, architecte, infirmiere) and [Perf] timing instrumentation for sub-90s verification**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-21T20:38:08Z
- **Completed:** 2026-03-21T20:40:29Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- Three pre-cached demo responses validated against dashboardDataSchema (all 3 pass schema validation)
- Demo mode bypass in useChatWithDashboard with simulated word-by-word streaming (zero API calls)
- Performance timing instrumentation logging API response, dashboard ready, and total flow timing
- 10 new tests covering profile matching, schema validation, and data integrity (61 total tests pass)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create demo fallback module and pre-cached JSON responses** - `f27f016` (feat)
2. **Task 2: Integrate demo mode and performance timing into useChatWithDashboard** - `f011438` (feat)

## Files Created/Modified
- `src/lib/demo-fallback.ts` - Demo response loader with isDemoMode, matchDemoProfile, getDemoResponse exports
- `src/data/demo-responses/kine-liberal.json` - Pre-cached kinesitherapeute liberal demo response
- `src/data/demo-responses/architecte-independant.json` - Pre-cached architecte independant demo response
- `src/data/demo-responses/infirmiere-liberale.json` - Pre-cached infirmiere liberale demo response
- `src/hooks/useChatWithDashboard.ts` - Demo mode bypass and [Perf] timing instrumentation
- `tests/demo-fallback.test.ts` - 10 tests for demo fallback system

## Decisions Made
- Static JSON imports at build time for demo responses (no dynamic loading, no service workers) - simplest approach for 3 responses
- 30ms per-word simulated streaming delay for natural feel during demo mode
- Performance timing uses `performance.now()` with `[Perf]` console log prefix for easy filtering
- Demo mode bypass placed before prospect creation to avoid any API calls whatsoever

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required. Demo mode activates via `NEXT_PUBLIC_DEMO_MODE=true` in `.env.local` or `?demo=true` query parameter.

## Next Phase Readiness
- Phase 6 complete: both plans (06-01 mobile fixes, 06-02 demo fallback) delivered
- Demo fallback guarantees pitch resilience with zero API dependency
- Performance timing ready to verify sub-90s budget during live testing
- All 61 tests pass with no regressions

---
*Phase: 06-hardening-demo-preparation*
*Completed: 2026-03-21*
