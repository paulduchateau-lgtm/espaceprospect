---
phase: 1
slug: foundation-data-acquisition
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-20
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 3.x |
| **Config file** | vitest.config.ts (Wave 0 installs) |
| **Quick run command** | `npx vitest run --reporter=verbose` |
| **Full suite command** | `npx vitest run --reporter=verbose --coverage` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --reporter=verbose`
- **After every plan wave:** Run `npx vitest run --reporter=verbose --coverage`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 01-01-01 | 01 | 1 | CONF-01 | visual | Manual: check branded page loads | N/A | ⬜ pending |
| 01-02-01 | 02 | 1 | RAG-01 | integration | `npx vitest run scraper` | ❌ W0 | ⬜ pending |
| 01-02-02 | 02 | 1 | RAG-02 | unit | `npx vitest run chunker` | ❌ W0 | ⬜ pending |
| 01-03-01 | 03 | 2 | RAG-03 | integration | `npx vitest run embeddings` | ❌ W0 | ⬜ pending |
| 01-03-02 | 03 | 2 | RAG-03 | integration | `npx vitest run vector-search` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `vitest` + `@vitest/coverage-v8` — install test framework
- [ ] `vitest.config.ts` — configure test paths
- [ ] `tests/scraper.test.ts` — stubs for RAG-01
- [ ] `tests/chunker.test.ts` — stubs for RAG-02
- [ ] `tests/embeddings.test.ts` — stubs for RAG-03
- [ ] `tests/vector-search.test.ts` — stubs for RAG-03 vector queries

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| MetLife branded page displays correctly | CONF-01 | Visual/CSS verification | Run `npm run dev`, open localhost:3000, verify MetLife blue (#0090DA), navy (#0061A0), green (#A4CE4E) colors, Inter font, logo presence |
| Vector search returns relevant results for "kiné libéral risques" | RAG-03 | Semantic quality requires human judgment | Run `npx tsx scripts/test-search.ts "kiné libéral risques"`, verify results include incapacité/prévoyance content |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
