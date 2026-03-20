# Research Synthesis — METLife Espace Prospect Intelligent

- **Date:** 2026-03-20
- **Purpose:** Roadmap decision support for a prototype meant to wow MetLife
- **Sources synthesized:** STACK.md, FEATURES.md, ARCHITECTURE.md, PITFALLS.md, PROJECT.md

---

## Executive Summary

The project builds a conversational AI webapp that transforms how TNS (Travailleurs Non Salariés) prospects engage with MetLife. Instead of static product pages and form funnels, a prospect describes their situation in natural language and receives a personalized dashboard within 90 seconds — surfacing their specific risks, matched MetLife products, partner services, and curated resources. The prototype's sole objective is to generate a "wow effect" sufficient to win MetLife's buy-in for the full product vision.

The research confirms this is a genuinely differentiated concept in the French insurance market. No competitor — not Alan, not +Simple, not SwissLife — offers conversational natural-language onboarding for TNS prospects. The closest global analog is Penni.io (Denmark), which operates in a different market segment. The technical stack required to build this is mature, well-understood, and fits entirely within the project's constraints (Next.js, Claude API, SQLite/Turso, local-first demo capability). There are no blocking technical unknowns.

The primary risks are execution risks, not concept risks. The prototype can fail at the demo stage due to hallucinated product information, perceived latency without streaming feedback, poorly performing RAG retrieval, or insufficient testing against edge-case TNS profiles. These are all solvable if the build order is respected and the pitfalls are addressed phase by phase. The critical success metric is not feature completeness — it is whether a MetLife stakeholder watching the demo says "this is how it should work."

---

## Key Findings

### Recommended Stack Summary

The stack is a tightly coherent unit optimized for prototype speed and local demo reliability:

| Layer | Choice | Rationale |
|---|---|---|
| Framework | Next.js 16.2 + React 19 (App Router) | Full-stack, streaming-native, Vercel-deployable |
| Styling | Tailwind CSS 4.2 + shadcn/ui | Full brand control, no fighting a theme system |
| AI integration | Vercel AI SDK 6 + @ai-sdk/anthropic | Streaming hooks, tool_use abstraction, provider-switching |
| LLM | Claude Sonnet (claude-sonnet-4-20250514) | French-native, fast, strong structured output |
| Embeddings | Voyage AI (voyage-finance-2) | Domain-tuned for insurance/finance, Anthropic-recommended |
| Database + Vector | Turso/libSQL with native vector search | Single DB for relational + vector data, zero-config, local-first |
| ORM | Drizzle ORM 0.45 | Lightweight, type-safe, native Turso support |
| Animations | Motion (framer-motion) 12.x | Dashboard reveal transitions are essential for the wow effect |
| Scraping | Crawlee 3.16 + Playwright | JS-rendered pages, retry/rate-limit handling out of the box |

Explicitly excluded: LangChain, Prisma, Pinecone/Chroma, sqlite-vec extension, OpenAI, Clerk/Auth0. None add value for this prototype scope.

Two viable variants exist: **Variant A (Demo-First)** — local SQLite, no auth, anonymous sessions — is right for the pitch. **Variant B** adds Turso cloud and next-auth for a shareable deployable prototype post-pitch.

### Expected Features Summary

The feature landscape breaks into three tiers:

**P0 — Must have for the pitch (the demo lives or dies on these):**
- Conversational natural language input (free text, not forms)
- AI risk analysis and product matching via Claude
- Personalized dashboard (risks + products + partners + resources)
- RAG knowledge base fed by scraped MetLife content
- MetLife brand identity (colors, typography, logo)

**P1 — Important for completeness and credibility:**
- Trust signals (regulatory mentions, RGPD notice, brand markers)
- Partner services display (Caarl, Doado, Noctia — fictitious, cards only)
- Contact/advisor CTA visible at all stages
- Mobile responsive (at minimum the chat flow)

**P2 and beyond — Not in v1 prototype:**
- Prospect persistence (session-only is sufficient for demo)
- Profession-specific depth refinements
- Conversation follow-up loops
- Quote simulation, live advisor chat, subscription flow (explicitly out of scope per PROJECT.md)

Four features are classified as anti-features and must be kept out: price/quote generation in the conversational flow, medical data collection, aggressive lead capture before showing value, and overly chatty AI personality. Each has a documented reason why it would harm the demo rather than help it.

### Architecture Approach Summary

The architecture is a two-phase UI pattern on a single page: the prospect types their situation, Claude streams a response while simultaneously producing a structured JSON payload via tool_use, and the dashboard slides in from the right as the conversation narrows to one third of the screen. The magic is the transition — chat and dashboard must never be separate page loads.

The data flow is: user message → embed query → RAG retrieval (top 5-8 chunks) → build system prompt with RAG context → Claude streaming + tool_use → streamed text to chat + structured JSON to dashboard state → persist to SQLite. The RAG corpus is built once before the demo via a scrape + embed + seed pipeline (three scripts, run offline).

The recommended build order (11 phases) front-loads the core experience: skeleton → chat UI → Claude integration → structured output extraction → dashboard UI. RAG, persistence, and polish come after the core loop works. This ensures a working demo exists at every stage of development.

State management is intentionally minimal: React useState for UI, SQLite/Turso as server-side source of truth, no Redux or Zustand needed.

### Critical Pitfalls — Top 5

**1. Hallucinations on insurance product details (P1 — Critical)**
The LLM will invent coverage amounts, franchise periods, and eligibility conditions not in the RAG corpus. This is the single highest-impact failure mode for a pitch to an insurance company. Mitigation: system prompt must explicitly instruct Claude to cite only information present in the RAG context; never display specific pricing or coverage figures; redirect to advisors for exact numbers. Test with off-catalog trap questions before the demo.

**2. Perceived latency that kills the wow effect (P2 — Critical)**
More than 2 seconds without visual feedback destroys the "instant" experience the concept promises. Mitigation: streaming is non-negotiable, not a nice-to-have; display a transition message ("Je regarde votre situation...") while the RAG retrieval runs; show skeleton loading for dashboard cards; pre-compute all corpus embeddings at build time, never at runtime.

**3. RAG returning noise instead of relevant products (P3 — Critical)**
A TNS describing a wrist injury risk should retrieve incapacity/invalidity prevoyance content, not borrower insurance. Poor retrieval makes the entire personalization premise collapse. Mitigation: chunk by semantic section (one product aspect per chunk, not fixed token size); enrich chunks with metadata (product type, TNS target, covered risk); test manually with 20+ real TNS profiles before the demo.

**4. The prototype works for 3 profiles and fails on the 4th (P7 — High)**
The demo will be tested with a "kine liberal, 35 ans" script. A spectator will ask about a VTC driver with a pregnant spouse and a mortgage. Mitigation: test with 10-15 varied TNS personas; build an explicit graceful fallback ("Votre situation est specifique, je vous recommande d'echanger avec un conseiller MetLife"); a bot that admits uncertainty is more trustworthy than one that improvises.

**5. Regulatory and RGPD blind spots undermine credibility with MetLife's legal audience (P6 — High)**
Even a prototype shown to MetLife stakeholders will be reviewed by people who notice the absence of disclaimers, RGPD consent, and data processing notices. Anthropic is a non-EU sub-processor. Mitigation: visible disclaimer ("Ces recommandations sont indicatives et ne constituent pas un conseil en assurance"), RGPD consent banner before first interaction, UUID-based prospect identifiers (not auto-increment), no health data collected in any form.

---

## Implications for Roadmap

### Suggested Phases with Rationale

**Phase 0 — Foundation (Days 1-2)**
Bootstrap Next.js 16 with Tailwind CSS 4, configure MetLife color palette in `@theme`, initialize shadcn/ui, set up Drizzle + SQLite schema (prospects, messages, content_chunks), configure TypeScript and Biome.

Rationale: Every subsequent phase depends on this. The Tailwind/MetLife brand setup belongs here so no UI work ever runs against a blank or wrong theme.

**Phase 1 — Data Acquisition (Days 2-3, can overlap with Phase 0)**
Run Crawlee/Playwright scraper against MetLife.fr target pages. Normalize to structured markdown. Generate Voyage AI embeddings (`voyage-finance-2`). Store chunks in SQLite with metadata (product type, TNS target, covered risk). Version the corpus.

Rationale: The RAG corpus is the most critical asset of the prototype — more critical than the code. It must exist before any meaningful AI integration testing. Running this early also surfaces scraping gotchas (JS-rendered pages, changed selectors) before they block later phases.

Research flag: Validate manually that the scraped corpus covers all five MetLife TNS product lines (Super Novaterm, emprunteur, incapacite, invalidite, capital deces) before proceeding to Phase 2.

**Phase 2 — Core AI Loop (Days 3-5)**
Implement `/api/chat` route handler: embed user message, RAG retrieval (top 8 chunks), build system prompt with RAG context, call Claude with tool_use to extract structured dashboard JSON alongside streamed conversational response.

Rationale: This is the functional core of the entire prototype. Everything else is UI around it. Getting this working — even with a plain text interface — proves the concept is technically viable. Test against the hallucination anti-pattern immediately at this phase.

Research flag: The ARCHITECTURE.md notes two implementation options for structured output (delimiter parsing vs tool_use). Prefer tool_use — it produces cleaner separation and is easier to iterate on.

**Phase 3 — Conversational UI (Days 5-6)**
Build the chat panel: message bubbles, streaming text display, input with example prompts pre-filled (to solve the blank-input intimidation pitfall), loading indicators, error states with humanized French messages.

Rationale: The chat panel is the prospect's entry point. The example prompts ("Je suis architecte liberal...") are critical for guiding the demo without forcing the presenter to script every interaction.

**Phase 4 — Dashboard UI and Transition (Days 6-8)**
Build the dashboard panel: risk cards, product cards (with relevance explanation), partner service cards (Caarl, Doado, Noctia), resource list, advisor CTA. Implement the split-panel transition animation: chat shrinks to 1/3, dashboard slides in from the right with card-by-card reveal using Motion.

Rationale: This is the "wow" moment. The quality of this transition determines whether the demo lands. The animations are not polish — they are core to the concept. Build them properly here, not as an afterthought.

**Phase 5 — Persistence and Legal (Days 8-9)**
Add prospect persistence: UUID-based access tokens, `/dashboard/[prospectId]` route, return-visit detection. Add RGPD consent banner, legal disclaimer, and data processing notice. Implement UUID prospect IDs throughout.

Rationale: Persistence enables the "your space is waiting for you" narrative in the pitch. The legal elements are required for credibility with MetLife stakeholders, not optional polish.

**Phase 6 — Hardening and Demo Prep (Days 9-11)**
Test against 10-15 varied TNS personas. Build the graceful fallback for unknown profiles. Prepare 3 pre-cached demo responses for API-down recovery. Write the demo script. Run 5+ full end-to-end rehearsals with people asking unexpected questions. Optimize mobile responsiveness for the chat flow.

Rationale: The difference between a prototype that wows and one that embarrasses is almost entirely in this phase. Most teams skip it. Do not skip it.

### Phase Ordering Rationale

The ordering is driven by two constraints: (1) the RAG corpus must exist before AI integration can be meaningfully tested; (2) the core AI loop must work before any UI is worth building around it. The build order in ARCHITECTURE.md (11 micro-phases) maps onto these 6 macro-phases and should be followed inside each phase.

The most common mistake is to build UI first and wire AI later — this produces a beautiful interface that fails during the demo when the AI integration is rushed. The reversed approach (data → AI → UI → polish) ensures the demo experience is grounded in a working system.

### Research Flags Requiring Decisions

| Flag | Decision Required | Impact if Deferred |
|---|---|---|
| Embedding model choice | Voyage AI API (voyage-finance-2) vs local @xenova/transformers (all-MiniLM-L6-v2) | Voyage costs money but is domain-tuned for insurance; local model is free but generic. For a pitch, Voyage quality is worth the small API cost. Recommend Voyage. |
| Structured output method | Tool_use vs delimiter parsing from streamed text | Tool_use is cleaner and avoids stream parsing bugs. Recommend tool_use. Decision must be made before Phase 2. |
| Demo variant | Variant A (local SQLite, no auth) vs Variant B (Turso cloud, magic link) | Variant A is sufficient for an in-person demo. If MetLife will access the prototype independently post-pitch, Variant B is needed. Decide before Phase 5. |
| Corpus scope | How many MetLife pages to scrape | ARCHITECTURE.md estimates <1000 chunks for the prototype. This is the right scale — do not try to scrape the entire site. Curate 30-50 key pages. |
| French language robustness | Accents, typographic apostrophes, profession abbreviations | Must be validated in chunking and embedding pipeline. "kine", "archi", "VTC", "micro-entrepreneur" must resolve correctly in RAG retrieval. Test explicitly. |

---

## Confidence Assessment

| Research Area | Confidence | Basis | Gaps |
|---|---|---|---|
| Stack versions | High | All versions verified via npm/GitHub on 2026-03-20 | None — versions are current |
| Feature differentiation | High | Competitor analysis across Alan, Luko, +Simple, SwissLife; global references (Penni.io, Discovery) | No direct access to competitor analytics or conversion rates |
| Architecture patterns | High | Patterns are well-established for Next.js + AI SDK + SQLite stack | Turso native vector search less battle-tested than sqlite-vec at prototype scale |
| RAG retrieval quality | Medium | Approach is sound; actual quality depends on MetLife corpus quality and chunking implementation | Cannot be validated until corpus is scraped and tested |
| Pitfall coverage | High | Drawn from real failure modes in conversational AI + insurance domain; pitfall-to-phase mapping is actionable | Edge case TNS profiles not yet enumerated — needs a real persona list |
| Regulatory compliance | Medium | RGPD requirements identified; Anthropic as non-EU sub-processor flagged | No formal legal review; MetLife's own compliance requirements not yet known |
| Demo timing estimate | Medium | 11-phase build order estimated at ~10 working days for core prototype | Depends heavily on MetLife brand asset availability and scraping complexity |
| MetLife brand assets | Low | Architecture references MetLife green (#00A94F) and brand fonts, but no confirmed access to official assets | Must be resolved before any UI work begins |

---

## Sources

| Document | Date | Confidence |
|---|---|---|
| `/Users/paulduchateau/projects/METLife/.planning/research/STACK.md` | 2026-03-20 | High — versions verified |
| `/Users/paulduchateau/projects/METLife/.planning/research/FEATURES.md` | 2026-03-20 | High |
| `/Users/paulduchateau/projects/METLife/.planning/research/ARCHITECTURE.md` | 2026-03-20 | High |
| `/Users/paulduchateau/projects/METLife/.planning/research/PITFALLS.md` | 2026-03-20 | High |
| `/Users/paulduchateau/projects/METLife/.planning/PROJECT.md` | 2026-03-20 | Authoritative (project constraints) |

---

*Synthesized 2026-03-20. This document is intended to be the single source of truth for roadmap decisions. Update as new findings emerge during development.*
