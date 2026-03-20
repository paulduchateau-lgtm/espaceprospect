# Roadmap: METLife Espace Prospect Intelligent

**Created:** 2026-03-20
**Phases:** 6
**Requirements:** 27 mapped

## Phase 1: Foundation & Data Acquisition

**Goal:** Bootstrap the project skeleton with MetLife branding and build the RAG corpus by scraping, chunking, and embedding MetLife content — the foundation everything else depends on.
**Requirements:** CONF-01, RAG-01, RAG-02, RAG-03

### Success Criteria
1. The developer can run the project locally and see a branded MetLife page with correct colors, typography, and identity
2. The scraping pipeline produces structured markdown covering all five MetLife TNS product lines (Super Novaterm, emprunteur, incapacite, invalidite, capital deces)
3. Chunks are stored in SQLite with metadata (product type, TNS target, covered risk) and vector embeddings are queryable via similarity search
4. A manual similarity query for "kine liberal risques" returns relevant incapacity/prevoyance chunks, not unrelated content

## Phase 2: Core AI Loop

**Goal:** Wire Claude API with RAG context injection and structured output extraction so that a user message produces both a streamed conversational response and a structured dashboard JSON payload.
**Requirements:** CONV-04, CONV-05, RAG-04, RAG-05

### Success Criteria
1. A plain-text input describing a TNS situation returns a streamed Claude response grounded in RAG context (no hallucinated product details)
2. Claude's tool_use output produces valid structured JSON containing identified risks, matched products, and relevant resources
3. An off-catalog trap question (e.g., asking about a product MetLife does not offer) does not produce fabricated information — Claude redirects to an advisor
4. The end-to-end latency from input to first streamed token is under 3 seconds

## Phase 3: Conversational UI

**Goal:** Build the chat interface that serves as the prospect's entry point — with streaming display, guided prompts, and humanized error handling.
**Requirements:** CONV-01, CONV-02, CONV-03, CONV-06, UX-03

### Success Criteria
1. A prospect can type a free-text description of their situation and see the AI response stream in real time with message bubbles
2. Clickable example prompts are visible on the empty chat state, and clicking one fills the input and submits it
3. When the API fails or Claude returns an error, the user sees a friendly French-language message instead of a technical error
4. When a prospect describes an unusual or unrecognized TNS profile, a graceful fallback message recommends contacting a MetLife advisor

## Phase 4: Dashboard & Transition Animation

**Goal:** Build the personalized dashboard and implement the animated chat-to-dashboard transition that constitutes the prototype's "wow moment."
**Requirements:** DASH-01, DASH-02, DASH-03, DASH-04, DASH-05, DASH-06

### Success Criteria
1. After the AI response completes, the chat panel animates to 1/3 width and the dashboard slides in from the right with a progressive card-by-card reveal
2. The dashboard displays risk cards sorted by pertinence, product cards with relevance explanations, partner service cards (Caarl, Doado, Noctia), and curated resource links
3. A "Contact a MetLife advisor" CTA is visible on the dashboard at all times
4. The transition feels smooth and intentional — no layout jumps, no content flash, no jarring state changes

## Phase 5: Persistence & Legal Compliance

**Goal:** Enable prospect spaces to persist across sessions and add the legal/trust elements required for credibility with MetLife stakeholders.
**Requirements:** PERS-01, PERS-02, PERS-03, CONF-02, CONF-03, CONF-04

### Success Criteria
1. A prospect receives a UUID-based URL after their first interaction and can return to `/dashboard/[prospectId]` to see their saved conversation and dashboard
2. A RGPD consent banner appears before the first interaction and blocks usage until accepted
3. A visible disclaimer states that recommendations are indicative and do not constitute insurance advice
4. Trust signals (ACPR regulation, financial solidity, number of insured) are displayed in the interface

## Phase 6: Hardening & Demo Preparation

**Goal:** Test against diverse TNS profiles, optimize mobile responsiveness, prepare fallback scenarios, and rehearse the demo until it is bulletproof.
**Requirements:** UX-01, UX-02

### Success Criteria
1. The conversational flow works correctly on mobile viewports (minimum 375px width) with no broken layouts
2. The total time from prospect input submission to full dashboard display is under 90 seconds across all tested profiles
3. The prototype has been tested against at least 10 varied TNS personas (including edge cases like VTC driver, micro-entrepreneur, profession liberale reglementee) with acceptable results
4. Three pre-cached demo responses are available as fallback in case of API downtime during the live pitch
5. A written demo script exists and has been rehearsed end-to-end at least 3 times

---
*Roadmap created: 2026-03-20*
*Derived from: REQUIREMENTS.md (27 v1 requirements), research/SUMMARY.md*
