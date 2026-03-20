---
phase: 02-core-ai-loop
plan: 03
subsystem: ai
tags: [zod, structured-output, tool-use, claude, dashboard]

requires:
  - phase: 02-core-ai-loop/02-01
    provides: Initial schemas.ts with dashboardSchema and dashboardTool
  - phase: 02-core-ai-loop/02-02
    provides: System prompt with tool_use instructions

provides:
  - Exported sub-schemas (riskSchema, productSchema, partnerSchema, resourceSchema, profileSchema)
  - Individual type exports (Risk, Product, Partner, Resource, Profile)
  - Schema validation script for dashboard payloads

affects: [04-dashboard, 03-conversational-ui]

tech-stack:
  added: []
  patterns:
    - "Composable Zod sub-schemas exported individually for reuse in UI components"
    - "Pass-through tool execution pattern (input === output) for structured output extraction"

key-files:
  created:
    - scripts/test-schema.ts
  modified:
    - src/lib/schemas.ts

key-decisions:
  - "Used inputSchema (not parameters) for AI SDK 6 Tool type compatibility"
  - "Exported sub-schemas individually for Phase 4 dashboard component reuse"

patterns-established:
  - "Schema validation scripts in scripts/ directory for verifying Zod schemas"

requirements-completed: [CONV-04, CONV-05]

duration: 5min
completed: 2026-03-20
---

# Phase 2 Plan 3: Structured Output via tool_use (Dashboard JSON Schema) Summary

**Exported composable Zod sub-schemas with individual type exports and pass-through dashboard tool for Claude structured output extraction**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-20T14:21:30Z
- **Completed:** 2026-03-20T14:27:25Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Refactored schemas.ts to export individual sub-schemas (riskSchema, productSchema, partnerSchema, resourceSchema, profileSchema) for reuse in Phase 4 dashboard components
- Added individual type exports (Risk, Product, Partner, Resource, Profile) alongside DashboardData
- Updated dashboardTool description to enforce MUST-call-after-every-response semantics
- Created validation script confirming both valid and invalid payload handling

## Task Commits

Each task was committed atomically:

1. **Task 1: Create dashboard Zod schema in src/lib/schemas.ts** - `51f8cfa` (feat)
2. **Task 2: Verify schema validates correctly with sample data** - `378398f` (test)

## Files Created/Modified
- `src/lib/schemas.ts` - Complete dashboard schema with exported sub-schemas, types, and tool definition
- `scripts/test-schema.ts` - Schema validation script testing valid and invalid payloads

## Decisions Made
- **Used inputSchema instead of parameters:** The plan specified `parameters` but the AI SDK 6 `Tool` type requires `inputSchema`. The `tool()` helper is a pass-through identity function, so only `inputSchema` satisfies TypeScript. This aligns with what Plan 02-01 already had.
- **Exported sub-schemas individually:** Enables Phase 4 dashboard components to import and use specific schemas (e.g., `riskSchema` for a RiskCard component) without depending on the full dashboard schema.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Used inputSchema instead of parameters in dashboardTool**
- **Found during:** Task 1 (Schema creation)
- **Issue:** Plan specified `parameters: dashboardSchema` but AI SDK 6 Tool type requires `inputSchema`
- **Fix:** Used `inputSchema: dashboardSchema` matching the SDK's Tool type definition
- **Files modified:** src/lib/schemas.ts
- **Verification:** `npx tsc --noEmit src/lib/schemas.ts` passes with no errors in source file
- **Committed in:** 51f8cfa (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Minimal -- corrected property name to match SDK API. No scope change.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Dashboard schema and tool are complete and wired into the chat route (from Plan 02-01)
- Sub-schemas are ready for Phase 4 dashboard component development
- Plan 02-04 (if any remaining in Phase 2) or Phase 3 can proceed

---
*Phase: 02-core-ai-loop*
*Completed: 2026-03-20*
