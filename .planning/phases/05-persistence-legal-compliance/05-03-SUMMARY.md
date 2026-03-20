---
phase: 05-persistence-legal-compliance
plan: 03
subsystem: ui
tags: [rgpd, consent, legal, trust-signals, disclaimer, localStorage]

# Dependency graph
requires:
  - phase: 03-conversational-ui
    provides: Layout and dashboard structure
  - phase: 04-dashboard-transition-animation
    provides: AnimatedDashboardLayout with motion sections
provides:
  - RGPD consent banner blocking app interaction until accepted
  - Insurance disclaimer component (L.521-1 Code des assurances)
  - Trust signals display (ACPR, Moody's A1, 100M insured)
affects: [06-hardening-demo-preparation]

# Tech tracking
tech-stack:
  added: []
  patterns: [localStorage consent persistence, usePathname route-based bypass, hydration guard with null state]

key-files:
  created:
    - src/components/legal/ConsentBanner.tsx
    - src/components/legal/Disclaimer.tsx
    - src/components/legal/TrustSignals.tsx
    - tests/legal-components.test.tsx
  modified:
    - src/app/layout.tsx
    - src/components/dashboard/AnimatedDashboardLayout.tsx

key-decisions:
  - "usePathname-based dashboard route bypass to avoid redundant consent on /dashboard/[id]"
  - "Hydration guard pattern: consented=null returns null during SSR, useEffect sets real value"
  - "Global afterEach cleanup in tests to prevent DOM leakage between describe blocks"

patterns-established:
  - "Consent wrapper pattern: client component wrapping server component children in layout.tsx"
  - "Legal section at bottom of dashboard using motion.section stagger animation"

requirements-completed: [CONF-02, CONF-03, CONF-04]

# Metrics
duration: 3min
completed: 2026-03-20
---

# Phase 05 Plan 03: Legal Components Summary

**RGPD consent banner with localStorage persistence, insurance disclaimer, and ACPR/Moody's trust signals wired into layout and dashboard**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-20T18:29:46Z
- **Completed:** 2026-03-20T18:32:48Z
- **Tasks:** 2 (1 TDD + 1 wiring)
- **Files modified:** 6

## Accomplishments
- RGPD consent banner blocks all interaction on "/" until user accepts, persists in localStorage
- Dashboard routes (/dashboard/[id]) bypass consent check via usePathname
- Disclaimer warns recommendations are indicative per L.521-1 Code des assurances
- Trust signals display ACPR regulation, A1 Moody's rating, 100M insured worldwide
- 9 unit tests covering consent logic, disclaimer text, and trust signals content

## Task Commits

Each task was committed atomically:

1. **Task 1: Create legal components (TDD RED)** - `ae51bbd` (test)
2. **Task 1: Create legal components (TDD GREEN)** - `7ef4319` (feat)
3. **Task 2: Wire legal components into layout and dashboard** - `8560ced` (feat)

## Files Created/Modified
- `src/components/legal/ConsentBanner.tsx` - Blocking RGPD consent overlay with localStorage persistence and dashboard bypass
- `src/components/legal/Disclaimer.tsx` - Insurance advice disclaimer with amber warning styling
- `src/components/legal/TrustSignals.tsx` - ACPR, Moody's A1, 100M insured trust display grid
- `tests/legal-components.test.tsx` - 9 unit tests for all three legal components
- `src/app/layout.tsx` - Added ConsentBanner wrapping {children}
- `src/components/dashboard/AnimatedDashboardLayout.tsx` - Added Disclaimer and TrustSignals at bottom

## Decisions Made
- Used usePathname to bypass consent on /dashboard/[id] routes (consent already given during initial interaction)
- Hydration guard pattern (consented === null returns null) to avoid SSR/client mismatch
- Global afterEach(cleanup) in tests to prevent DOM leakage between describe blocks

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed test DOM leakage between describe blocks**
- **Found during:** Task 1 (TDD GREEN)
- **Issue:** @testing-library/react renders from ConsentBanner tests leaked into Disclaimer tests causing "Found multiple elements" errors
- **Fix:** Added global afterEach(cleanup) and waitFor() for async useEffect state updates
- **Files modified:** tests/legal-components.test.tsx
- **Verification:** All 9 tests pass consistently
- **Committed in:** 7ef4319 (part of GREEN commit)

**2. [Rule 1 - Bug] Fixed TypeScript error on localStorage mock return type**
- **Found during:** Task 2 (verification)
- **Issue:** mockReturnValue(null) incompatible with string-typed getItem mock
- **Fix:** Added explicit return type annotation `(key: string): string | null`
- **Files modified:** tests/legal-components.test.tsx
- **Committed in:** 8560ced (part of Task 2 commit)

---

**Total deviations:** 2 auto-fixed (2 bugs)
**Impact on plan:** Both fixes necessary for test correctness and TypeScript compliance. No scope creep.

## Issues Encountered
- Pre-existing TypeScript error in scripts/validate.ts (Property 'distance' does not exist on type 'RetrievedChunk') -- out of scope, not introduced by this plan

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All three legal requirements (CONF-02, CONF-03, CONF-04) satisfied
- Consent banner, disclaimer, and trust signals visible in production layout
- Ready for Phase 06 hardening and demo preparation

---
*Phase: 05-persistence-legal-compliance*
*Completed: 2026-03-20*
