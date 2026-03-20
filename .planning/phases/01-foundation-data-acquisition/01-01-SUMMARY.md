---
phase: 01-foundation-data-acquisition
plan: 01
subsystem: infra
tags: [next.js, tailwind-css-4, shadcn-ui, drizzle-orm, turso, libsql, vitest, metlife-branding]

requires: []
provides:
  - "Next.js 16 project scaffold with Tailwind CSS 4 and shadcn/ui"
  - "MetLife brand theme (colors, typography, logo)"
  - "Drizzle ORM schema with F32_BLOB vector column for RAG embeddings"
  - "Vitest test infrastructure with stub test files"
affects: [01-02, 01-03, 01-04, phase-2, phase-3]

tech-stack:
  added: [next.js-16.2.0, tailwind-css-4, shadcn-ui-4, drizzle-orm, libsql-client, drizzle-kit, vitest-4.1, biome]
  patterns: [app-router, css-theme-variables, custom-drizzle-type, atomic-commits]

key-files:
  created:
    - src/app/globals.css
    - src/app/layout.tsx
    - src/app/page.tsx
    - src/db/schema.ts
    - src/lib/db.ts
    - drizzle.config.ts
    - vitest.config.ts
    - biome.json
    - public/metlife-logo.png
    - tests/scraper.test.ts
    - tests/chunker.test.ts
    - tests/embeddings.test.ts
    - tests/vector-search.test.ts
  modified:
    - package.json
    - .gitignore

key-decisions:
  - "Used temp directory workaround for create-next-app uppercase directory name restriction"
  - "Preserved shadcn/ui CSS variables alongside MetLife brand theme variables"
  - "Used custom Drizzle type for F32_BLOB vector column (Turso native vector search)"

patterns-established:
  - "MetLife brand colors via Tailwind @theme CSS variables"
  - "French locale (lang=fr) as default for all pages"
  - "Atomic task commits with conventional commit format feat(01-01):"

requirements-completed: [CONF-01]

duration: 5min
completed: 2026-03-20
---

# Phase 1 Plan 01: Project Bootstrap & MetLife Branding Summary

**Next.js 16 scaffold with MetLife brand identity (blue/navy/green), Drizzle ORM schema with F32_BLOB(1024) vector column, and Vitest test infrastructure**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-20T11:45:48Z
- **Completed:** 2026-03-20T11:50:51Z
- **Tasks:** 6
- **Files modified:** 15

## Accomplishments
- Next.js 16.2.0 project with Tailwind CSS 4, shadcn/ui (button + card), and Biome linter
- MetLife brand theme with official colors (#0090DA blue, #0061A0 navy, #A4CE4E green) as Tailwind CSS variables
- French-language landing page with MetLife logo and brand color verification dots
- Drizzle ORM schema with content_chunks (F32_BLOB 1024-dim embeddings) and scrape_log tables
- Vitest 4.1.0 with 16 todo test stubs covering scraper, chunker, embeddings, and vector search

## Task Commits

Each task was committed atomically:

1. **Task 1: Create Next.js 16 Project** - `4c665e4` (feat)
2. **Task 2: Configure MetLife Brand Theme** - `25e269d` (feat)
3. **Task 3: Create Root Layout with Inter Font** - `91151b7` (feat)
4. **Task 4: Download MetLife Logo and Create Landing Page** - `7d7dde6` (feat)
5. **Task 5: Define Drizzle Schema and Database Client** - `c716cee` (feat)
6. **Task 6: Install Vitest Test Infrastructure** - `5674953` (feat)

## Files Created/Modified
- `package.json` - metlife-prospect project with all Phase 1 dependencies
- `src/app/globals.css` - MetLife brand colors + shadcn variables in Tailwind @theme
- `src/app/layout.tsx` - Root layout with Inter font, lang="fr", French metadata
- `src/app/page.tsx` - Branded landing page with logo and color dots
- `src/db/schema.ts` - content_chunks and scrape_log tables with F32_BLOB vector type
- `src/lib/db.ts` - Drizzle client with Turso/libSQL
- `drizzle.config.ts` - Drizzle Kit config for turso dialect
- `vitest.config.ts` - Vitest config with @ alias
- `biome.json` - Biome linter/formatter config
- `public/metlife-logo.png` - Official MetLife logo
- `tests/*.test.ts` - 4 stub test files with 16 todo test cases

## Decisions Made
- Used temp directory workaround for create-next-app (uppercase "METLife" directory violates npm naming rules)
- Preserved shadcn/ui CSS variables alongside MetLife brand theme variables for component compatibility
- Used custom Drizzle type for F32_BLOB vector column to support Turso native vector search

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Uppercase directory name incompatible with create-next-app**
- **Found during:** Task 1 (Create Next.js 16 Project)
- **Issue:** `npx create-next-app . --yes` fails because "METLife" contains uppercase letters (npm naming restriction)
- **Fix:** Scaffolded in /tmp/metlife-prospect, then rsync'd files to project directory
- **Files modified:** All scaffolded files
- **Verification:** package.json contains `"name": "metlife-prospect"`, build succeeds
- **Committed in:** 4c665e4

**2. [Rule 3 - Blocking] shadcn/ui globals.css must be preserved alongside MetLife theme**
- **Found during:** Task 2 (Configure MetLife Brand Theme)
- **Issue:** Plan specified replacing globals.css entirely, but shadcn/ui init wrote critical CSS variables (oklch colors, sidebar vars) needed for button/card components
- **Fix:** Merged MetLife brand variables into the @theme inline block while keeping shadcn :root and .dark CSS custom properties
- **Files modified:** src/app/globals.css
- **Verification:** All MetLife color variables present AND shadcn components render correctly
- **Committed in:** 25e269d

---

**Total deviations:** 2 auto-fixed (2 blocking)
**Impact on plan:** Both were necessary compatibility fixes. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Project builds and runs successfully (`npm run dev`, `npx next build`)
- Database schema pushed to local.db
- Test infrastructure ready for implementation in Plan 02 (scraper) and beyond
- Ready for Plan 02: Web Scraping Pipeline

---
*Phase: 01-foundation-data-acquisition*
*Completed: 2026-03-20*
