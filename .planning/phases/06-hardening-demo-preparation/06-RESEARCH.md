# Phase 6: Hardening & Demo Preparation - Research

**Researched:** 2026-03-21
**Domain:** Mobile responsiveness, performance optimization, test coverage, demo fallback infrastructure
**Confidence:** HIGH

## Summary

Phase 6 is a hardening phase, not a feature-building phase. The conversational UI and dashboard are fully built (Phases 3-5 complete). The work centers on four areas: (1) verifying and fixing mobile responsiveness at 375px+ viewports, (2) ensuring the end-to-end flow completes in under 90 seconds, (3) testing against 10+ diverse TNS personas to validate AI output quality, and (4) building a demo fallback system with pre-cached responses for live pitch resilience.

The existing codebase already has substantial mobile support: `SplitPanel` switches to tab-based layout below 1024px, `MobileCTA` provides a fixed bottom bar, `AnimatedDashboardLayout` uses faster mobile stagger (80ms vs 120ms), and `ConsentBanner` renders responsively. The main risk areas for mobile are: the inline `page.tsx` ChatPanel (hardcoded styles, not thoroughly tested at 375px), the prospect URL banner potentially overflowing on narrow screens, and the suggestion chips wrapping behavior.

**Primary recommendation:** Focus on three concrete deliverables: a mobile viewport audit/fix pass, a demo fallback data layer with 3 pre-cached JSON responses, and a written demo script document. Performance is likely already within bounds given Claude Sonnet streaming starts in ~3 seconds (Phase 2 criteria) and the main bottleneck is Voyage AI embedding (~22 seconds on free tier).

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| UX-01 | L'experience fonctionne sur mobile (au minimum le flow conversationnel) | Mobile viewport audit at 375px; existing SplitPanel/MobileCTA infrastructure handles layout; ChatPanel in page.tsx needs responsive fixes (max-width, padding, chip overflow) |
| UX-02 | Le temps entre la saisie et l'affichage du dashboard est inferieur a 90 secondes | Performance profiling of RAG retrieval (Voyage AI ~22s) + Claude streaming + tool_use extraction; 90s budget is generous given current architecture; add timing instrumentation to verify |
</phase_requirements>

## Standard Stack

### Core (Already Installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| next | 16.2.0 | App framework | Already in project |
| vitest | ^4.1.0 | Test runner | Already in project, jsdom environment |
| @testing-library/react | ^16.3.2 | Component testing | Already in project |
| playwright | ^1.58.2 | E2E browser testing | Already in devDependencies, ideal for mobile viewport testing |
| motion | ^12.38.0 | Animation library | Already in project for transitions |

### Supporting (No New Dependencies Needed)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| playwright (already installed) | ^1.58.2 | Visual mobile viewport testing | For verifying 375px layouts without manual device testing |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Playwright for mobile testing | Manual Chrome DevTools | Playwright provides reproducible, scriptable viewport tests |
| Static JSON fallback files | Service worker cache | Static files are simpler, more reliable for a pitch demo |

**Installation:**
```bash
# No new packages needed. All dependencies already installed.
```

## Architecture Patterns

### Recommended Project Structure for Phase 6 Additions
```
src/
  lib/
    demo-fallback.ts       # Pre-cached demo response loader
  data/
    demo-responses/
      kine-liberal.json     # Pre-cached: kinesitherapeute liberal
      architecte-tns.json   # Pre-cached: architecte independant
      infirmiere-lib.json   # Pre-cached: infirmiere liberale
tests/
  mobile-viewport.test.ts   # Mobile responsive audit tests
  demo-fallback.test.ts     # Fallback data loading tests
  persona-profiles.test.ts  # TNS persona coverage tests
  e2e/
    mobile-flow.spec.ts     # Playwright mobile viewport E2E
docs/
  demo-script.md            # Written demo script for rehearsal
```

### Pattern 1: Demo Fallback Data Layer
**What:** Pre-cached JSON responses that can replace live API calls during demo
**When to use:** When the presenter activates demo mode (env var or query param) or when API fails during live pitch
**Example:**
```typescript
// src/lib/demo-fallback.ts
import type { DashboardData, ChatMessage } from '@/lib/types';

interface DemoResponse {
  userMessage: string;
  assistantMessage: string;
  dashboard: DashboardData;
}

const DEMO_RESPONSES: Record<string, DemoResponse> = {
  'kine-liberal': { /* ... */ },
  'architecte-independant': { /* ... */ },
  'infirmiere-liberale': { /* ... */ },
};

export function getDemoResponse(profileKey: string): DemoResponse | null {
  return DEMO_RESPONSES[profileKey] ?? null;
}

export function matchDemoProfile(userInput: string): string | null {
  // Simple keyword matching to detect which demo profile to use
  if (userInput.includes('kine') || userInput.includes('kiné')) return 'kine-liberal';
  if (userInput.includes('architecte')) return 'architecte-independant';
  if (userInput.includes('infirmi')) return 'infirmiere-liberale';
  return null;
}
```

### Pattern 2: Environment-Based Demo Mode Toggle
**What:** A `NEXT_PUBLIC_DEMO_MODE` env var or `?demo=true` query param that switches to fallback data
**When to use:** During live pitch to guarantee consistent, fast responses
**Example:**
```typescript
// In useChatWithDashboard.ts or page.tsx
const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'
  || new URLSearchParams(window.location.search).has('demo');

if (isDemoMode) {
  const profileKey = matchDemoProfile(content);
  if (profileKey) {
    const demo = getDemoResponse(profileKey);
    // Simulate streaming with setTimeout for natural feel
    // Set dashboard data directly from cached response
  }
}
```

### Pattern 3: TNS Persona Test Matrix
**What:** A structured test suite that runs the same validation against 10+ TNS profiles
**When to use:** To verify AI output quality across diverse professions
**Example:**
```typescript
// tests/persona-profiles.test.ts
const TNS_PERSONAS = [
  { name: 'Kinesitherapeute liberal', input: 'Je suis kine liberal, 35 ans, cabinet depuis 2 ans' },
  { name: 'VTC driver', input: 'Je suis chauffeur VTC, auto-entrepreneur, 42 ans' },
  { name: 'Micro-entrepreneur e-commerce', input: 'Je suis micro-entrepreneur, vente en ligne, 28 ans' },
  { name: 'Profession liberale reglementee (avocat)', input: 'Je suis avocate independante, 38 ans, cabinet individuel' },
  { name: 'Architecte DPLG', input: 'Je suis architecte independant, 45 ans, marie avec 2 enfants' },
  { name: 'Infirmiere liberale', input: 'Je suis infirmiere liberale, 28 ans, debut activite' },
  { name: 'Medecin generaliste', input: 'Je suis medecin generaliste installe en liberal, 50 ans' },
  { name: 'Consultant IT freelance', input: 'Je suis consultant informatique freelance, 33 ans, celibataire' },
  { name: 'Artisan plombier', input: 'Je suis plombier a mon compte, 40 ans, 2 salaries' },
  { name: 'Agent commercial immobilier', input: 'Je suis agent commercial immobilier independant, 55 ans, pres de la retraite' },
];
```

### Anti-Patterns to Avoid
- **Over-engineering the fallback:** Don't build a service worker or complex caching layer. Static JSON files imported at build time are perfectly adequate for 3 demo responses.
- **Testing mobile with unit tests only:** Unit tests can verify CSS class presence but cannot catch overflow, scroll, or touch behavior. Playwright viewport tests are essential.
- **Hardcoding timing expectations:** Don't assert exact millisecond performance in tests. Instead, measure and log timing, with a generous 90-second threshold.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Mobile viewport simulation | Custom resize observers or mocks | Playwright `page.setViewportSize({ width: 375, height: 812 })` | Browser-level viewport simulation is the only reliable approach |
| Demo data streaming simulation | Custom SSE mock server | `setTimeout` with progressive message reveal | The demo just needs visual fidelity, not protocol fidelity |
| Performance measurement | Custom timing middleware | `performance.now()` or `console.time/timeEnd` in hook | Browser APIs are sufficient for measuring one flow |

**Key insight:** This phase is about testing and preparation, not building new infrastructure. Keep additions minimal.

## Common Pitfalls

### Pitfall 1: Mobile Overflow on Prospect URL Banner
**What goes wrong:** The prospect URL banner in `page.tsx` (line 131-155) uses `truncate` on the URL but the container uses `flex items-center gap-2` which may not constrain the link width on 375px screens.
**Why it happens:** The banner has multiple flex items (icon, text, link, copy button) that compete for space.
**How to avoid:** Add `min-w-0` to the flex container and ensure the link has `flex-1 min-w-0 truncate`.
**Warning signs:** URL text pushes copy button off-screen or forces horizontal scroll.

### Pitfall 2: Suggestion Chips Not Wrapping on Mobile
**What goes wrong:** The suggestion chips in `page.tsx` (lines 189-204 and 252-269) use `flex-col` for the empty state but `flex gap-2 flex-wrap` for the post-message state. The `max-w-[200px] truncate` on post-message chips may clip meaningful text at 375px.
**Why it happens:** Chip text like "Je suis kinesitherapeute liberal, 35 ans..." is long and truncates differently at narrow widths.
**How to avoid:** Test both empty-state and post-message chip layouts at 375px. Consider reducing to 2 chips on mobile.
**Warning signs:** Chips overflow or become unreadable.

### Pitfall 3: Consent Banner Padding on Small Screens
**What goes wrong:** `ConsentBanner` uses `max-w-lg` (512px) and `p-6` which is fine for 375px but the text may be cramped.
**Why it happens:** 512px max-width fits within 375px but the 24px padding on each side leaves only ~327px for content.
**How to avoid:** Verify the consent banner renders correctly at 375px. It likely works but should be confirmed.
**Warning signs:** Button hard to tap, text wraps awkwardly.

### Pitfall 4: 90-Second Performance Budget Misattribution
**What goes wrong:** Developers chase Claude API latency when the real bottleneck is Voyage AI embedding (documented as ~22s on free tier in Phase 2 decisions).
**Why it happens:** The RAG retrieval (`retrieveRelevantChunks`) calls Voyage AI for query embedding before vector search.
**How to avoid:** Measure separately: (a) Voyage AI embedding time, (b) SQLite vector search time, (c) Claude streaming time, (d) dashboard tool extraction time. The 90s budget is generous -- the typical flow should be 25-40 seconds total.
**Warning signs:** Inconsistent latency due to Voyage AI rate limiting (429s causing retries).

### Pitfall 5: Demo Fallback Not Matching Real Schema
**What goes wrong:** Pre-cached JSON responses get out of sync with the `dashboardDataSchema` in `schemas.ts`.
**Why it happens:** If schemas were updated in previous phases without updating fallback data.
**How to avoid:** Validate demo fallback data against `dashboardDataSchema` in tests.
**Warning signs:** `safeParse` returns errors when loading demo data.

### Pitfall 6: `h-screen` vs `h-dvh` on Mobile
**What goes wrong:** `SplitPanel` uses `h-screen` (line 37 desktop, line 86 mobile) which doesn't account for mobile browser chrome (address bar, bottom bar).
**Why it happens:** Phase 3 established `h-dvh` as the correct approach (Decision: "h-dvh for mobile virtual keyboard compatibility"), but SplitPanel may use `h-screen`.
**How to avoid:** Audit all `h-screen` usage and replace with `h-dvh` where it affects mobile layout.
**Warning signs:** Content cut off at bottom of mobile viewport, especially on Safari iOS.

## Code Examples

### Mobile Viewport E2E Test with Playwright
```typescript
// tests/e2e/mobile-flow.spec.ts
import { test, expect } from '@playwright/test';

const MOBILE_VIEWPORT = { width: 375, height: 812 }; // iPhone SE / small mobile

test.describe('Mobile Flow', () => {
  test.use({ viewport: MOBILE_VIEWPORT });

  test('chat interface renders without horizontal scroll', async ({ page }) => {
    await page.goto('/');
    // Accept RGPD consent
    await page.click('[data-testid="consent-accept"]');
    // Verify no horizontal overflow
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    expect(bodyWidth).toBeLessThanOrEqual(375);
  });

  test('suggested prompts are tappable and visible', async ({ page }) => {
    await page.goto('/');
    await page.click('[data-testid="consent-accept"]');
    const chips = await page.locator('button:has-text("kinesitherapeute")');
    await expect(chips).toBeVisible();
    const box = await chips.boundingBox();
    expect(box!.height).toBeGreaterThanOrEqual(44); // Apple HIG tap target
  });

  test('consent banner fits on 375px screen', async ({ page }) => {
    await page.goto('/');
    const banner = page.locator('[role="dialog"]');
    await expect(banner).toBeVisible();
    const bodyScroll = await page.evaluate(() => document.body.scrollWidth);
    expect(bodyScroll).toBeLessThanOrEqual(375);
  });
});
```

### Demo Fallback Response Structure
```typescript
// src/data/demo-responses/kine-liberal.json validates against dashboardDataSchema
{
  "userMessage": "Je suis kinesitherapeute liberal, 35 ans, je viens d'ouvrir mon cabinet",
  "assistantMessage": "En tant que kinesitherapeute liberal en debut d'activite, vous etes particulierement expose a certains risques...",
  "dashboard": {
    "risks": [
      { "id": "arret-travail", "label": "Arret de travail prolonge", "severity": "high", "description": "Sans revenus de remplacement, un arret maladie peut compromettre votre cabinet." },
      { "id": "invalidite", "label": "Invalidite professionnelle", "severity": "high", "description": "Les TMS sont frequents chez les kines — une invalidite peut mettre fin a votre activite." },
      { "id": "deces", "label": "Deces premature", "severity": "medium", "description": "Proteger vos proches en cas de disparition est essentiel, surtout en debut de carriere." }
    ],
    "products": [
      { "id": "super-novaterm", "name": "Super Novaterm", "relevance": "Assurance deces adaptee aux TNS avec capital ajustable selon votre situation familiale." },
      { "id": "prevoyance-incapacite", "name": "Prevoyance Incapacite", "relevance": "Indemnites journalieres en cas d'arret de travail, essentielles pour un kine liberal." }
    ],
    "partners": [
      { "id": "doado", "relevance": "Prevention des TMS pour les professionnels de sante pratiquant des gestes repetitifs." }
    ],
    "resources": [
      { "title": "Guide prevoyance TNS", "url": "https://www.metlife.fr/prevoyance-tns", "type": "guide" }
    ],
    "profile": {
      "profession": "Kinesitherapeute liberal",
      "sector": "Sante",
      "concerns": ["Protection des revenus", "Risque TMS", "Debut d'activite"]
    }
  }
}
```

### Performance Timing Instrumentation
```typescript
// Add to useChatWithDashboard.ts sendMessage
const t0 = performance.now();
// ... after fetch response starts:
const tFirstByte = performance.now();
// ... after dashboard extracted:
const tDashboard = performance.now();
console.log(`[Perf] First byte: ${(tFirstByte - t0).toFixed(0)}ms`);
console.log(`[Perf] Dashboard ready: ${(tDashboard - t0).toFixed(0)}ms`);
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| h-screen for full-height | h-dvh for mobile | Phase 3 decision | Prevents content clipping on mobile Safari |
| useChat (AI SDK DefaultChatTransport) | Custom SSE parsing in useChatWithDashboard | Phase 4 | Supports dashboard SSE events alongside chat streaming |
| AI SDK UIMessage.content | UIMessage.parts text extraction | Phase 2-3 | AI SDK 6 breaking change |

**Deprecated/outdated:**
- None specific to this phase -- it's a testing/hardening phase, not introducing new tech.

## Open Questions

1. **Voyage AI latency on demo day**
   - What we know: Free tier shows ~22s embedding latency (Phase 2 validation). This is the main performance bottleneck.
   - What's unclear: Will a paid tier or API key upgrade be in place for the demo? Will rate limiting be an issue with repeated demos?
   - Recommendation: The demo fallback system solves this entirely -- if using demo mode, no API calls are needed. For live demo, test with the actual API key that will be used on demo day.

2. **Demo environment (local vs deployed)**
   - What we know: The app runs locally with `next dev`. No deployment config exists.
   - What's unclear: Will the demo be from a local machine or a deployed URL?
   - Recommendation: Assume local demo. The fallback system works in both cases since it's built into the app code.

3. **Mobile physical device testing**
   - What we know: Playwright can simulate mobile viewports accurately.
   - What's unclear: Will anyone test on a real iPhone/Android before the pitch?
   - Recommendation: Playwright viewport testing is sufficient for this prototype phase. Real device testing is ideal but not blocking.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest 4.x + @testing-library/react 16.x |
| Config file | `/vitest.config.ts` |
| Quick run command | `npm test` |
| Full suite command | `npm run test:coverage` |
| E2E framework | Playwright 1.58.x (installed, needs config) |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| UX-01 | Mobile layout renders at 375px without overflow | E2E | `npx playwright test tests/e2e/mobile-flow.spec.ts` | No -- Wave 0 |
| UX-01 | Chat input usable at 375px (tap targets >= 44px) | E2E | `npx playwright test tests/e2e/mobile-flow.spec.ts` | No -- Wave 0 |
| UX-01 | Consent banner fits mobile viewport | E2E | `npx playwright test tests/e2e/mobile-flow.spec.ts` | No -- Wave 0 |
| UX-01 | h-dvh used instead of h-screen for mobile | unit | `npm test -- tests/mobile-viewport.test.ts` | No -- Wave 0 |
| UX-02 | End-to-end flow completes under 90 seconds | integration/manual | `npx tsx scripts/perf-benchmark.ts` | No -- Wave 0 |
| UX-02 | Performance timing instrumentation logs metrics | unit | `npm test -- tests/demo-fallback.test.ts` | No -- Wave 0 |
| N/A | 10 TNS personas produce valid dashboard data | integration | `npx tsx scripts/persona-test.ts` (live API) | No -- Wave 0 |
| N/A | Demo fallback data validates against schema | unit | `npm test -- tests/demo-fallback.test.ts` | No -- Wave 0 |
| N/A | Demo mode toggle works (env var or query param) | unit | `npm test -- tests/demo-fallback.test.ts` | No -- Wave 0 |

### Sampling Rate
- **Per task commit:** `npm test`
- **Per wave merge:** `npm run test:coverage`
- **Phase gate:** Full suite green + Playwright mobile E2E pass before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `tests/e2e/mobile-flow.spec.ts` -- covers UX-01 mobile viewport testing
- [ ] `tests/demo-fallback.test.ts` -- covers demo fallback schema validation and mode toggle
- [ ] `tests/mobile-viewport.test.ts` -- covers h-dvh audit and responsive CSS checks
- [ ] `scripts/perf-benchmark.ts` -- covers UX-02 timing measurement
- [ ] `scripts/persona-test.ts` -- covers 10-persona AI output validation
- [ ] `playwright.config.ts` -- Playwright configuration (framework installed but unconfigured)
- [ ] `docs/demo-script.md` -- written demo script for rehearsal

## Sources

### Primary (HIGH confidence)
- Codebase exploration: `src/app/page.tsx`, `src/components/layout/SplitPanel.tsx`, `src/hooks/useChatWithDashboard.ts`, `src/app/api/chat/route.ts` -- all directly read and analyzed
- `package.json` -- confirmed all dependencies and versions
- `.planning/STATE.md` -- confirmed 5/6 phases complete, all decisions logged
- `.planning/REQUIREMENTS.md` -- confirmed UX-01, UX-02 are the target requirements

### Secondary (MEDIUM confidence)
- Phase 2 decisions log entry about Voyage AI ~22s latency -- referenced for performance budgeting
- Phase 3 decision about h-dvh -- referenced for mobile audit

### Tertiary (LOW confidence)
- None -- all findings verified from codebase

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- no new dependencies needed, all already installed
- Architecture: HIGH -- patterns are simple (static JSON fallback, Playwright E2E, timing instrumentation)
- Pitfalls: HIGH -- identified from direct codebase analysis of existing mobile layout code
- Demo fallback design: HIGH -- straightforward static data approach, validated by schema

**Research date:** 2026-03-21
**Valid until:** 2026-04-21 (30 days -- stable, no external dependency changes expected)
