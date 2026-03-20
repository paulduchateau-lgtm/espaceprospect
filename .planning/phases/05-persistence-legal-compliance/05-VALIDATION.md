---
phase: 5
slug: persistence-legal-compliance
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-20
---

# Phase 5 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest (if configured) / manual verification |
| **Config file** | vitest.config.ts or none |
| **Quick run command** | `npx vitest run --reporter=verbose` |
| **Full suite command** | `npx vitest run && npx tsc --noEmit` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx tsc --noEmit`
- **After every plan wave:** Run full suite
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 05-01-01 | 01 | 1 | PERS-01 | integration | `curl -s -X POST localhost:3000/api/prospect` | ❌ W0 | ⬜ pending |
| 05-01-02 | 01 | 1 | PERS-03 | integration | `sqlite3 .data/metlife.db "SELECT * FROM prospects LIMIT 1"` | ❌ W0 | ⬜ pending |
| 05-02-01 | 02 | 1 | PERS-02 | manual | Navigate to `/dashboard/[id]` | N/A | ⬜ pending |
| 05-02-02 | 02 | 1 | PERS-02 | integration | `curl -s localhost:3000/dashboard/test-uuid` | ❌ W0 | ⬜ pending |
| 05-03-01 | 03 | 2 | CONF-02 | unit | `npx vitest run tests/legal-components.test.tsx` | tests/legal-components.test.tsx | ⬜ pending |
| 05-03-02 | 03 | 2 | CONF-03 | unit | `npx vitest run tests/legal-components.test.tsx` | tests/legal-components.test.tsx | ⬜ pending |
| 05-03-03 | 03 | 2 | CONF-04 | unit | `npx vitest run tests/legal-components.test.tsx` | tests/legal-components.test.tsx | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] Database migration script for prospects/conversations/dashboard_snapshots tables
- [ ] API route for prospect creation returns UUID

*If none: "Existing infrastructure covers all phase requirements."*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| RGPD banner blocks chat | CONF-02 | Visual + interaction | Open app fresh, verify banner appears, verify chat is blocked until accepted |
| Dashboard persistence | PERS-02 | E2E flow | Complete conversation, copy URL, reload, verify data loads |
| Trust signals visible | CONF-04 | Visual check | Scroll to trust section, verify ACPR/rating/count present |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
