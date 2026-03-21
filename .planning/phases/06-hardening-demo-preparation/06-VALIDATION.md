---
phase: 6
slug: hardening-demo-preparation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-21
---

# Phase 6 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest + @testing-library/react + playwright |
| **Config file** | vitest.config.ts, playwright.config.ts (Wave 0 creates) |
| **Quick run command** | `npx vitest run --reporter=verbose` |
| **Full suite command** | `npx vitest run && npx playwright test` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --reporter=verbose`
- **After every plan wave:** Run `npx vitest run && npx playwright test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 6-01-01 | 01 | 1 | UX-01 | e2e | `npx playwright test mobile` | ❌ W0 | ⬜ pending |
| 6-01-02 | 01 | 1 | UX-01 | visual | `npx playwright test --grep viewport` | ❌ W0 | ⬜ pending |
| 6-02-01 | 02 | 1 | UX-02 | unit | `npx vitest run demo-fallback` | ❌ W0 | ⬜ pending |
| 6-02-02 | 02 | 1 | UX-02 | e2e | `npx playwright test --grep demo` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `playwright.config.ts` — Playwright configuration with mobile viewports
- [ ] `tests/e2e/` — E2E test directory structure
- [ ] Existing vitest infrastructure covers unit test needs

*Playwright config is the only missing piece — vitest already works.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Demo script rehearsal | Success Criteria 5 | Human rehearsal | Run through demo script 3 times, note issues |
| TNS persona variety | Success Criteria 3 | AI response quality | Test 10 personas manually, score relevance |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
