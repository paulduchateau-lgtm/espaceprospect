# Feature Landscape Research: AI-Powered Insurance Prospect Experience

*Research date: 2026-03-20*

---

## Table Stakes (Features Users Expect)

These are non-negotiable. If they're missing, the product feels broken or untrustworthy.

### 1. Clear Product Information
- Product pages with plain-language descriptions of coverage, pricing ranges, and eligibility
- MetLife TNS products: prevoyance (Super Novaterm), borrower insurance, incapacity/invalidity, death coverage
- Madelin tax deduction explanation (critical for TNS audience -- they actively search for this)
- FAQ / common questions answered without friction

### 2. Mobile-Responsive Design
- 60%+ of insurance prospects browse on mobile (industry benchmark)
- Full functionality on all screen sizes, not just a shrunk desktop view

### 3. Contact Access
- Visible phone number, email, or callback request at every stage
- TNS prospects often want to talk to a human before committing -- the digital experience must make this easy, not hide it

### 4. Trust & Credibility Signals
- MetLife brand presence (logo, brand colors, consistent identity)
- Regulatory mentions (ACPR, assureur agree)
- Data privacy notice / RGPD compliance visible
- SSL / security indicators
- Social proof: number of insured clients, years in market, financial strength ratings

### 5. Basic Needs Assessment
- Some form of guided questionnaire or needs analysis (even traditional step-by-step forms)
- Ability to understand which product category applies to the visitor

### 6. Content Quality
- No jargon-heavy walls of text
- Explanatory content about insurance concepts (prevoyance, incapacite, invalidite, capital deces)
- Contextual glossary or tooltips for insurance terminology

---

## Differentiators (Competitive Advantage)

These are what make this project worth building. They create the "wow effect" MetLife needs for the pitch.

### 1. Conversational Natural Language Onboarding (HIGH IMPACT)
- **What:** Instead of forms or dropdowns, the prospect describes their situation in free text: "Je suis kine liberal, 35 ans, je viens d'acheter un cabinet"
- **Why it differentiates:** No French insurer does this today. Alan uses structured forms. SwissLife uses guided questionnaires. +Simple uses standard quote forms. This is a category-first UX.
- **Key design decision:** The conversation must feel like talking to a knowledgeable advisor, not a chatbot. Avoid the "I didn't understand that" dead-end patterns.

### 2. AI-Driven Risk Analysis & Product Matching (HIGH IMPACT)
- **What:** The AI identifies risks specific to the prospect's profession, situation, and life stage, then maps them to relevant MetLife products
- **Why it differentiates:** Traditional sites show the same product catalog to everyone. This approach surfaces what matters: "En tant que kine, votre risque principal est l'incapacite de travail -- voici comment MetLife vous couvre"
- **Competitive gap:** Alan does some personalization but only within health insurance. No prevoyance-focused insurer does AI-driven matching for TNS profiles.

### 3. Personalized Prospect Dashboard (HIGH IMPACT)
- **What:** A persistent, visual space showing:
  - Identified risks (ranked by severity/relevance)
  - Matched MetLife products with relevance explanation
  - Curated resources and articles
  - Relevant partner services (Caarl, Doado, Noctia)
  - Next steps / CTA toward advisor contact
- **Why it differentiates:** No insurer in France offers a dynamic, personalized dashboard pre-subscription. The closest analog is Alan's post-subscription member dashboard.

### 4. Partner Service Ecosystem (MEDIUM IMPACT)
- **What:** Integration of value-added services beyond insurance:
  - Caarl: legal assistance for TNS
  - Doado: TMS (musculoskeletal disorder) prevention
  - Noctia: sleep disorder support
- **Why it differentiates:** Positions MetLife as a holistic partner, not just a policy seller. Mirrors the ecosystem strategy of Discovery (South Africa) and Alan (wellness features). McKinsey data: 75%+ of insurance executives see ecosystems as essential to competitive advantage.
- **Pitch value:** Shows MetLife's vision extends beyond insurance into prevention and well-being.

### 5. RAG-Powered Knowledge Base (MEDIUM IMPACT)
- **What:** AI answers draw from MetLife's actual product content, advice articles, and regulatory information -- grounded in real data, not hallucinated
- **Why it differentiates:** Source traceability builds trust. When the AI says "MetLife couvre jusqu'a 1000EUR/jour en incapacite," it can cite the source page.
- **Technical advantage:** 95-99% accuracy on domain-specific queries (industry RAG benchmarks). Eliminates the chatbot credibility problem.

### 6. Prospect Persistence (MEDIUM IMPACT)
- **What:** The prospect's space is saved and accessible later. They can return, refine their profile, and pick up where they left off.
- **Why it differentiates:** Insurance is rarely an impulse purchase. TNS prospects research over days/weeks. Persistence respects this buying cycle. No major French insurer offers this for prospects (only for clients post-subscription).

### 7. Profession-Specific Intelligence (MEDIUM IMPACT)
- **What:** The system knows the specific risks, regulatory environment, and coverage needs of different TNS profiles (kine, avocat, artisan, commercant, etc.)
- **Why it differentiates:** Generic insurance sites treat all TNS the same. MetLife's site already has some profession-specific pages (notaire, gerant) -- the AI can leverage this at scale for any profession.

---

## Anti-Features (Commonly Requested but Problematic)

Features that sound good in planning but consistently hurt the product or create liability.

### 1. Price/Quote Generation in the Conversational Flow
- **Why it's tempting:** Prospects want to know "how much" immediately
- **Why it's dangerous:** Insurance pricing depends on medical questionnaires, detailed financial info, and actuarial calculations. An approximate price that's wrong destroys trust more than no price at all. Luko's "2-minute insurance" worked for standardized home insurance, not for complex prevoyance products.
- **Recommendation:** Explicitly out of scope for the prototype. Instead, show coverage ranges and direct toward a human advisor for exact pricing.

### 2. Medical or Health Data Collection
- **Why it's tempting:** More data = better recommendations
- **Why it's dangerous:** RGPD classifies health data as "sensitive." Collecting it in a conversational interface without proper consent flows, data minimization, and security creates massive legal exposure. The CNIL has specifically flagged AI health data collection.
- **Recommendation:** The AI should discuss health risks in general terms ("les kines ont un risque eleve de TMS") but never collect individual health data.

### 3. Auto-Play Video or Audio
- **Why it's tempting:** "Rich media engagement"
- **Why it's dangerous:** Universally hated by users. Accessibility nightmare. Breaks the conversational flow.
- **Recommendation:** Video content available on demand only, never auto-playing.

### 4. Aggressive Lead Capture (Email/Phone Gate Before Value)
- **Why it's tempting:** Sales team wants leads immediately
- **Why it's dangerous:** TNS prospects are savvy. Gating the experience before showing value creates immediate bounce. Insurance industry benchmark: gated experiences have 60-80% abandonment.
- **Recommendation:** Show full value first (personalized dashboard). Offer contact/save as a natural next step, not a gate. The persistence feature can soft-capture identity later.

### 5. Overly Chatty AI / Personality-Heavy Bot
- **Why it's tempting:** "Let's make it fun and engaging!"
- **Why it's dangerous:** Insurance is a trust purchase. Excessive personality feels frivolous. Alan succeeded precisely because their tone is professional-warm, never playful-casual.
- **Recommendation:** Professional, clear, empathetic tone. The AI should feel like a competent advisor, not a friend or mascot.

### 6. Complex Comparison Tools
- **Why it's tempting:** Prospects want to compare options
- **Why it's dangerous:** MetLife doesn't want to build a comparison site against competitors. Internal product comparison adds complexity without clear value in a prospect experience.
- **Recommendation:** Show why each recommended product is relevant to *this* prospect. Don't build a generic comparator.

### 7. Chat History Export / PDF Generation (for MVP)
- **Why it's tempting:** "Users might want to save their conversation"
- **Why it's dangerous:** Scope creep. The persistent dashboard already serves this purpose. PDF export implies contractual weight the conversation doesn't carry.
- **Recommendation:** v2+ feature at most. The dashboard IS the persistent artifact.

---

## Feature Dependencies

```
Conversational Input
    |
    v
AI Analysis Engine (Claude API)
    |
    +---> Product Matching -----> Personalized Dashboard
    |         |                        |
    |         v                        v
    |    RAG Knowledge Base       Partner Services Display
    |    (scraped MetLife          (Caarl, Doado, Noctia)
    |     content)                     |
    |                                  v
    v                            Contact / Next Steps
Risk Identification                    |
    |                                  v
    v                            Prospect Persistence
Profession-Specific                (SQLite/Turso)
Intelligence
```

**Critical path:** Conversational Input -> AI Analysis -> Product Matching -> Dashboard

**Blocking dependencies:**
- RAG knowledge base must be populated (MetLife site scraping) before AI Analysis can work accurately
- Product catalog must be structured before Product Matching can function
- MetLife brand assets must be available before any UI work
- Claude API integration is a prerequisite for all AI features

**Non-blocking (can be added incrementally):**
- Partner services (can be added as dashboard cards without deep integration)
- Prospect persistence (can start with session-only, add persistence later)
- Profession-specific intelligence (can start with general TNS knowledge, add profession data iteratively)

---

## MVP Definition

### v1 -- Prototype for Pitch (Target: Wow Effect Demo)

**Core flow:** Prospect arrives -> describes situation in natural language -> receives personalized dashboard

| Feature | Priority | Effort |
|---------|----------|--------|
| Conversational input (free text) | MUST | M |
| AI situation analysis (Claude API) | MUST | L |
| Risk identification by profession/situation | MUST | M |
| Product matching to MetLife catalog | MUST | M |
| Personalized dashboard (risks + products + resources) | MUST | L |
| RAG from scraped MetLife content | MUST | L |
| MetLife brand identity (colors, typography, logo) | MUST | M |
| Partner services display (Caarl, Doado, Noctia) | SHOULD | S |
| Trust signals (brand, regulatory, security) | SHOULD | S |
| Mobile responsive | SHOULD | M |
| Contact CTA / advisor connection | SHOULD | S |

**Effort key:** S = Small (< 1 day), M = Medium (1-3 days), L = Large (3-5 days)

**v1 explicitly excludes:**
- Prospect persistence (session-only is fine for demo)
- User accounts / authentication
- Quote simulation
- Live advisor chat
- Vocal input
- Subscription flow

### v1.x -- Enhanced Prototype (Post-Pitch Iterations)

| Feature | Priority |
|---------|----------|
| Prospect persistence (save/resume space) | HIGH |
| Refined profession-specific intelligence (deeper TNS profiles) | HIGH |
| Dashboard refinement (edit situation, update recommendations) | HIGH |
| Conversation follow-up questions (AI asks clarifying questions) | MEDIUM |
| Resource library (curated articles per profile) | MEDIUM |
| Analytics / tracking (prospect behavior insights for MetLife) | MEDIUM |
| Shareable prospect space (send link to partner/spouse) | LOW |
| Multi-language support | LOW |

### v2+ -- Production Vision

| Feature | Priority |
|---------|----------|
| Quote simulation integration | HIGH |
| Live advisor connection (chat/video/callback) | HIGH |
| Prospect-to-client transition (post-subscription space) | HIGH |
| Voice input | MEDIUM |
| Widget embeddable on MetLife.fr | MEDIUM |
| CRM integration (Salesforce or equivalent) | MEDIUM |
| A/B testing framework | MEDIUM |
| Advanced analytics dashboard (MetLife internal) | MEDIUM |
| Document upload (existing contracts for gap analysis) | LOW |
| Multi-product bundling recommendations | LOW |

---

## Feature Prioritization Matrix

| Feature | User Value | Business Value | Technical Risk | Priority Score |
|---------|-----------|---------------|---------------|---------------|
| Conversational NL input | 5 | 5 | 3 | **P0 - Critical** |
| AI risk analysis + product matching | 5 | 5 | 3 | **P0 - Critical** |
| Personalized dashboard | 5 | 5 | 2 | **P0 - Critical** |
| RAG knowledge base | 4 | 4 | 3 | **P0 - Critical** |
| MetLife brand identity | 3 | 5 | 1 | **P0 - Critical** |
| Trust/credibility signals | 4 | 4 | 1 | **P1 - Important** |
| Partner services ecosystem | 3 | 5 | 1 | **P1 - Important** |
| Contact / advisor CTA | 4 | 5 | 1 | **P1 - Important** |
| Mobile responsive | 4 | 3 | 2 | **P1 - Important** |
| Prospect persistence | 4 | 3 | 2 | **P2 - Nice to Have** |
| Profession-specific depth | 3 | 3 | 2 | **P2 - Nice to Have** |
| Conversation refinement loop | 3 | 2 | 2 | **P2 - Nice to Have** |

*Scoring: 1 (low) to 5 (high). Technical Risk: 1 = easy, 5 = hard. Priority derived from (User + Business value) vs. Technical Risk.*

---

## Competitor Feature Analysis

### Alan (alan.com)
- **Model:** Full-stack digital health insurer (mutuelle + wellness)
- **Prospect experience:** Structured form-based onboarding (company size, employee count, needs). NOT conversational. Clean, minimal UI.
- **Dashboard:** Post-subscription only. Member dashboard with reimbursements, teleconsultation, wellness content.
- **Strengths:** Brand trust, speed (claims reimbursed in 24h), integrated wellness features, 40% customer support automated by AI
- **Weaknesses:** Health-only (no prevoyance). Structured forms, no NL input. No prospect-side personalization.
- **What to learn:** Their tone of voice (professional-warm), their speed obsession, their wellness ecosystem approach
- **What to beat:** Their prospect journey is still a traditional form funnel. The conversational approach is a clear differentiator.

### Luko (now Allianz Direct)
- **Model:** Digital home insurance (MRH), now absorbed by Allianz
- **Prospect experience:** "2 minutes to get insured" -- very fast onboarding with minimal questions. AI + satellite imagery for instant risk assessment.
- **Strengths:** Speed, simplicity, NPS-driven growth (50% word-of-mouth acquisition), AI claims processing
- **Weaknesses:** Product was simple/standardized (home insurance). Approach doesn't directly translate to complex prevoyance products. Company ultimately wasn't viable standalone.
- **What to learn:** The "2-minute" promise resonates powerfully. Speed and simplicity win.
- **What to beat:** Luko's speed worked because home insurance is standardized. For TNS prevoyance, the challenge is making complex products feel simple without oversimplifying.

### +Simple (plussimple.com)
- **Model:** Insurance broker/comparator for professionals and TNS
- **Prospect experience:** Traditional form-based quote request. Step-by-step questionnaire (profession, revenue, coverage needs). Phone callback model.
- **Strengths:** TNS-specific positioning, multi-product comparison, human advisor follow-up
- **Weaknesses:** Generic digital experience. No personalization. Feels like filling out a tax form. Heavy reliance on phone callback.
- **What to learn:** They understand the TNS segment deeply. Their content about profession-specific risks is useful reference material.
- **What to beat:** Everything about their digital experience. The bar is low.

### SwissLife (swisslife.fr)
- **Model:** Traditional insurer with digital transformation efforts
- **Prospect experience:** SwissLife One platform primarily for brokers/advisors, not end prospects. Consumer-facing site is traditional product pages + contact forms. New digital subscription journeys being rolled out (electronic signature, streamlined forms).
- **Strengths:** Product depth, financial strength, broker network, brand trust
- **Weaknesses:** Digital experience is broker-centric, not prospect-centric. Consumer journey is still "find a product page, fill a form, wait for callback."
- **What to learn:** Their broker enablement tools (SwissLife One) show what advisors need. The prospect experience could feed into advisor handoff.
- **What to beat:** Their entire consumer-facing digital experience. Traditional insurer website with modern CSS.

### Other Notable References

**Penni.io (Denmark):** Conversational AI insurance platform that uses chat-based onboarding for product recommendations. Closest existing analog to what MetLife wants to build, but focused on general insurance, not TNS-specific.

**Discovery (South Africa):** Pioneer of the wellness-insurance ecosystem model. Vitality program integrates health tracking, prevention incentives, and insurance pricing. Proved that ecosystems drive retention (28% reduction in hospital stays). The Caarl/Doado/Noctia partner model echoes this approach.

**Dacadoo / Wellmo:** Digital health platforms that white-label wellness features for insurers. Show the market appetite for insurance + wellness integration.

---

## Key Research Takeaways

1. **The conversational NL approach is genuinely novel in French insurance.** No competitor does it. This is the core differentiator and must be executed exceptionally well.

2. **The prospect dashboard concept fills a real gap.** Every competitor's prospect journey ends with "we'll call you." A persistent, personalized space is new.

3. **Trust is the make-or-break factor.** Insurance prospects are skeptical by default. The AI must feel authoritative and grounded (RAG with source citations), not experimental. MetLife's brand weight is an asset here.

4. **The partner ecosystem (Caarl, Doado, Noctia) is strategically smart for the pitch** even if services are fictitious. It signals MetLife's vision extends beyond policy sales into holistic protection.

5. **Resist the urge to add pricing/quotes in the prototype.** This is the most common request that will derail the project. The value is in the experience and personalization, not in premature price display.

6. **Speed matters enormously.** The "2-minute" benchmark from Luko resonates. The conversational flow should feel fast -- the prospect should see their dashboard within 60-90 seconds of describing their situation.

---

*Last updated: 2026-03-20*
