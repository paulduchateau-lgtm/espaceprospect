# Architecture Research — METLife Espace Prospect Intelligent

## System Overview

```
+------------------------------------------------------------------+
|                        BROWSER (Next.js App)                      |
|                                                                   |
|  +------------------+    +------------------------------------+   |
|  | Conversational   |    |        Dashboard View              |   |
|  | Chat UI          |--->|  - Risk cards                      |   |
|  | (React + Tailwind|    |  - Product recommendations         |   |
|  |  streaming)      |    |  - Partner services (Caarl, etc.)  |   |
|  +--------+---------+    |  - Resources & contacts            |   |
|           |              +------------------+-----------------+   |
+-----------|---------------------------------|-----------------+---+
            |                                 |
            v                                 v
+------------------------------------------------------------------+
|                     NEXT.JS API ROUTES                            |
|                                                                   |
|  /api/chat          /api/prospect       /api/dashboard            |
|  (streaming)        (CRUD)              (read/refresh)            |
+------+------------------+------------------+---------------------+
       |                  |                  |
       v                  v                  v
+-------------+   +---------------+   +-----------------+
| CLAUDE API  |   | SQLITE/TURSO  |   |  RAG PIPELINE   |
| (Anthropic) |   | (Persistence) |   |  (Embeddings +  |
|             |   |               |   |   Vector Search) |
| - Analyze   |   | - Prospects   |   |                 |
|   situation |   | - Profiles    |   | +-------------+ |
| - Generate  |   | - Sessions    |   | | Scraped     | |
|   dashboard |   | - Messages    |   | | MetLife     | |
| - Match     |   +---------------+   | | Content     | |
|   products  |                        | +-------------+ |
+------+------+                        +---------+-------+
       |                                         |
       +--------------- CONTEXT -----------------+
       |  (RAG injects relevant product/resource  |
       |   chunks into Claude system prompt)      |
       +------------------------------------------+

OFFLINE PIPELINE (run separately):
+----------------+     +------------------+     +----------------+
| MetLife Site   |---->| Scraper          |---->| Embeddings     |
| (Production)   |     | (Cheerio/        |     | (Claude or     |
|                |     |  Playwright)     |     |  local model)  |
+----------------+     +------------------+     +----+-----------+
                                                     |
                                                     v
                                                +----+-----------+
                                                | Vector Store   |
                                                | (SQLite-vec /  |
                                                |  in-memory)    |
                                                +----------------+
```

## Component Responsibilities

| Component | Responsibility | Technology |
|-----------|---------------|------------|
| **Chat UI** | Render streaming conversation, capture TNS situation description | React, Tailwind, `useChat` hook or custom streaming |
| **Dashboard UI** | Display personalized risk/product/resource cards, persist across sessions | React, Tailwind, client-side state |
| **Chat API Route** | Orchestrate Claude call: build system prompt with RAG context, stream response, extract structured data | Next.js Route Handler, Anthropic SDK |
| **Prospect API Route** | CRUD for prospect profiles, session tokens | Next.js Route Handler, Drizzle ORM |
| **Dashboard API Route** | Serve persisted dashboard state, refresh on new conversation data | Next.js Route Handler |
| **RAG Pipeline** | Retrieve relevant MetLife content chunks for a given prospect situation | Embedding search (cosine similarity) |
| **Claude Integration** | Analyze free-text TNS situation, match to products, generate structured dashboard payload | Claude API (messages endpoint, streaming) |
| **Persistence Layer** | Store prospect profiles, conversation history, dashboard state | SQLite (local) / Turso (deployed) |
| **Scraping Pipeline** | Extract product pages, advice articles, resources from MetLife site | Cheerio (static) or Playwright (JS-rendered) |
| **Embedding Pipeline** | Chunk scraped content, generate embeddings, store in vector format | Sentence chunking + embedding model |
| **Partner Services** | Display Caarl, Doado, Noctia integrations in dashboard | Static config + conditional display based on profile |

## Recommended Project Structure

```
metlife-prospect/
├── .planning/                    # Project planning (existing)
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── layout.tsx            # Root layout (MetLife branding)
│   │   ├── page.tsx              # Landing / entry point
│   │   ├── chat/
│   │   │   └── page.tsx          # Conversational UI page
│   │   ├── dashboard/
│   │   │   └── [prospectId]/
│   │   │       └── page.tsx      # Persistent dashboard page
│   │   └── api/
│   │       ├── chat/
│   │       │   └── route.ts      # POST — streaming chat endpoint
│   │       ├── prospect/
│   │       │   └── route.ts      # POST/GET — prospect CRUD
│   │       └── dashboard/
│   │           └── [prospectId]/
│   │               └── route.ts  # GET — dashboard data
│   ├── components/
│   │   ├── chat/
│   │   │   ├── ChatContainer.tsx
│   │   │   ├── MessageBubble.tsx
│   │   │   └── ChatInput.tsx
│   │   ├── dashboard/
│   │   │   ├── DashboardLayout.tsx
│   │   │   ├── RiskCard.tsx
│   │   │   ├── ProductCard.tsx
│   │   │   ├── PartnerCard.tsx
│   │   │   └── ResourceList.tsx
│   │   └── ui/                   # Shared UI primitives
│   │       ├── Button.tsx
│   │       ├── Card.tsx
│   │       └── LoadingDots.tsx
│   ├── lib/
│   │   ├── claude.ts             # Claude API client + prompt builder
│   │   ├── rag.ts                # RAG retrieval: query → relevant chunks
│   │   ├── db.ts                 # Database client (Drizzle + SQLite/Turso)
│   │   ├── embeddings.ts         # Embedding generation + similarity search
│   │   ├── prompts.ts            # System prompts, prompt templates
│   │   └── types.ts              # Shared TypeScript types
│   ├── db/
│   │   ├── schema.ts             # Drizzle schema definitions
│   │   └── migrations/           # SQL migrations
│   └── config/
│       ├── products.ts           # Product catalog (supplements scraped data)
│       └── partners.ts           # Caarl, Doado, Noctia config
├── scripts/
│   ├── scrape.ts                 # Scrape MetLife site → JSON
│   ├── embed.ts                  # Generate embeddings from scraped content
│   └── seed.ts                   # Seed database with scraped + embedded data
├── data/
│   ├── scraped/                  # Raw scraped content (JSON)
│   └── embeddings/               # Pre-computed embeddings (if file-based)
├── drizzle.config.ts
├── tailwind.config.ts
├── next.config.ts
├── package.json
└── .env.local                    # ANTHROPIC_API_KEY, TURSO_URL, etc.
```

## Architectural Patterns

### 1. Streaming Chat with Structured Output Extraction

The core pattern: Claude streams a natural-language response to the user while simultaneously producing a structured JSON payload that populates the dashboard. This is achieved by asking Claude to return both in a single response, using a delimiter or tool-use pattern.

```typescript
// src/lib/claude.ts
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

export async function analyzeProspect(
  messages: { role: string; content: string }[],
  ragContext: string
) {
  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    system: buildSystemPrompt(ragContext),
    messages,
    stream: true,
  });

  return response; // Stream to client
}

function buildSystemPrompt(ragContext: string): string {
  return `Tu es un conseiller MetLife spécialisé dans l'accompagnement des TNS.

CONTEXTE PRODUITS ET RESSOURCES METLIFE:
${ragContext}

INSTRUCTIONS:
1. Analyse la situation du TNS décrite par l'utilisateur.
2. Identifie les risques pertinents pour son profil.
3. Recommande les produits MetLife adaptés en t'appuyant sur le contexte fourni.
4. Termine ta réponse par un bloc JSON structuré entre balises <dashboard_data> et </dashboard_data>.

FORMAT DU BLOC JSON:
{
  "risks": [{ "id": string, "label": string, "severity": "high"|"medium"|"low", "description": string }],
  "products": [{ "id": string, "name": string, "relevance": string, "url": string }],
  "partners": [{ "id": "caarl"|"doado"|"noctia", "relevance": string }],
  "resources": [{ "title": string, "url": string, "type": "article"|"guide"|"tool" }],
  "profile": { "profession": string, "sector": string, "concerns": string[] }
}`;
}
```

**Alternative (recommended for cleaner separation): Use Claude's tool_use** to extract structured data in a separate call or via parallel tool invocation. This avoids parsing delimiters from streamed text.

```typescript
// Using tool_use for structured extraction
const tools = [
  {
    name: "generate_dashboard",
    description: "Generate personalized dashboard data based on the TNS situation analysis",
    input_schema: {
      type: "object" as const,
      properties: {
        risks: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: { type: "string" },
              label: { type: "string" },
              severity: { type: "string", enum: ["high", "medium", "low"] },
              description: { type: "string" },
            },
            required: ["id", "label", "severity", "description"],
          },
        },
        products: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: { type: "string" },
              name: { type: "string" },
              relevance: { type: "string" },
              url: { type: "string" },
            },
            required: ["id", "name", "relevance"],
          },
        },
        partners: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: { type: "string", enum: ["caarl", "doado", "noctia"] },
              relevance: { type: "string" },
            },
          },
        },
        profile: {
          type: "object",
          properties: {
            profession: { type: "string" },
            sector: { type: "string" },
            concerns: { type: "array", items: { type: "string" } },
          },
        },
      },
      required: ["risks", "products", "profile"],
    },
  },
];
```

### 2. RAG Pipeline — Lightweight for Prototype

For a prototype, avoid over-engineering. A SQLite-based vector search with `sqlite-vec` or even an in-memory approach with pre-computed embeddings is sufficient.

```typescript
// src/lib/rag.ts
import { db } from "./db";

interface ContentChunk {
  id: string;
  content: string;
  source: string;
  embedding: number[];
  metadata: {
    type: "product" | "article" | "resource" | "faq";
    title: string;
    url: string;
  };
}

// Cosine similarity — simple enough for prototype
function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

export async function retrieveContext(
  queryEmbedding: number[],
  topK: number = 8
): Promise<string> {
  // Option A: sqlite-vec extension for vector search
  // Option B: load all embeddings in memory (fine for <1000 chunks)
  const chunks = await db.select().from(contentChunks).all();

  const scored = chunks.map((chunk) => ({
    ...chunk,
    score: cosineSimilarity(queryEmbedding, chunk.embedding),
  }));

  scored.sort((a, b) => b.score - a.score);
  const topChunks = scored.slice(0, topK);

  return topChunks
    .map((c) => `[${c.metadata.type}: ${c.metadata.title}]\n${c.content}`)
    .join("\n\n---\n\n");
}
```

**Embedding strategy for prototype:**
- Use a lightweight embedding model (e.g., `@xenova/transformers` with `all-MiniLM-L6-v2` running locally in Node.js)
- Or use Claude itself to generate a "semantic summary" for matching (less precise but zero extra dependencies)
- Or use Anthropic's Voyage AI embeddings if available

### 3. Prospect Persistence with Drizzle + SQLite/Turso

```typescript
// src/db/schema.ts
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const prospects = sqliteTable("prospects", {
  id: text("id").primaryKey(), // UUID
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  profession: text("profession"),
  sector: text("sector"),
  concerns: text("concerns", { mode: "json" }), // string[]
  dashboardData: text("dashboard_data", { mode: "json" }), // full dashboard JSON
  accessToken: text("access_token").notNull(), // for persistent URL access
});

export const messages = sqliteTable("messages", {
  id: text("id").primaryKey(),
  prospectId: text("prospect_id").references(() => prospects.id),
  role: text("role").notNull(), // "user" | "assistant"
  content: text("content").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const contentChunks = sqliteTable("content_chunks", {
  id: text("id").primaryKey(),
  content: text("content").notNull(),
  source: text("source").notNull(), // URL
  chunkType: text("chunk_type").notNull(), // "product" | "article" | "resource"
  title: text("title").notNull(),
  url: text("url").notNull(),
  embedding: text("embedding", { mode: "json" }), // number[] stored as JSON
});
```

### 4. Two-Phase UI Pattern: Chat → Dashboard Transition

The UX follows a "conversation-then-dashboard" pattern common in AI-powered onboarding tools. The key architectural decision: the dashboard is not a separate page load but a progressive reveal.

```typescript
// src/app/chat/page.tsx — Simplified pattern
"use client";

import { useState } from "react";

type Phase = "chatting" | "analyzing" | "dashboard";

export default function ChatPage() {
  const [phase, setPhase] = useState<Phase>("chatting");
  const [dashboardData, setDashboardData] = useState(null);

  // During chat streaming, watch for dashboard data extraction
  // When Claude returns structured data, transition to dashboard phase
  const handleStreamComplete = (data: any) => {
    if (data.dashboardData) {
      setPhase("analyzing"); // Brief animation
      setTimeout(() => {
        setDashboardData(data.dashboardData);
        setPhase("dashboard");
      }, 1500); // Transition animation
    }
  };

  return (
    <div className="flex h-screen">
      {/* Chat panel — always visible, shrinks when dashboard appears */}
      <div className={phase === "dashboard" ? "w-1/3" : "w-full"}>
        <ChatPanel onStreamComplete={handleStreamComplete} />
      </div>

      {/* Dashboard panel — slides in from right */}
      {phase !== "chatting" && (
        <div className="flex-1 overflow-y-auto">
          {phase === "analyzing" && <AnalyzingAnimation />}
          {phase === "dashboard" && <Dashboard data={dashboardData} />}
        </div>
      )}
    </div>
  );
}
```

### 5. Content Scraping Pipeline

```typescript
// scripts/scrape.ts
import * as cheerio from "cheerio";
import fs from "fs/promises";

interface ScrapedPage {
  url: string;
  title: string;
  type: "product" | "article" | "resource";
  content: string;
  metadata: Record<string, string>;
}

const METLIFE_URLS = [
  { url: "https://www.metlife.fr/...", type: "product" as const },
  // ... enumerate target pages
];

async function scrapePage(url: string, type: string): Promise<ScrapedPage> {
  const response = await fetch(url);
  const html = await response.text();
  const $ = cheerio.load(html);

  // Remove nav, footer, scripts
  $("nav, footer, script, style, .cookie-banner").remove();

  return {
    url,
    title: $("h1").first().text().trim(),
    type: type as ScrapedPage["type"],
    content: $("main, article, .content").text().trim(),
    metadata: {
      description: $('meta[name="description"]').attr("content") || "",
    },
  };
}

// Chunking strategy: split by heading sections, max ~500 tokens per chunk
function chunkContent(page: ScrapedPage): Array<{ content: string; title: string }> {
  const sections = page.content.split(/(?=\n#{1,3}\s)/);
  const chunks: Array<{ content: string; title: string }> = [];

  for (const section of sections) {
    if (section.length < 100) continue; // Skip tiny fragments
    if (section.length > 2000) {
      // Split long sections by paragraph
      const paragraphs = section.split(/\n\n+/);
      let currentChunk = "";
      for (const p of paragraphs) {
        if ((currentChunk + p).length > 1500) {
          if (currentChunk) chunks.push({ content: currentChunk, title: page.title });
          currentChunk = p;
        } else {
          currentChunk += "\n\n" + p;
        }
      }
      if (currentChunk) chunks.push({ content: currentChunk, title: page.title });
    } else {
      chunks.push({ content: section, title: page.title });
    }
  }

  return chunks;
}
```

## Data Flow

### Request Flow: User Message → Dashboard Update

```
1. User types situation description in chat UI
   |
2. Client sends POST /api/chat { prospectId, message }
   |
3. API route:
   a. Save user message to DB
   b. Generate embedding for user message
   c. Query RAG: find top-K relevant content chunks
   d. Build system prompt with RAG context
   e. Call Claude API (streaming) with conversation history + system prompt
   f. Stream response tokens back to client (SSE / ReadableStream)
   g. On stream complete: parse structured dashboard data from response
   h. Save assistant message to DB
   i. Upsert dashboard data + prospect profile to DB
   |
4. Client receives:
   a. Streamed text → displayed in chat bubbles
   b. Dashboard data (final event) → triggers dashboard render/update
   |
5. Dashboard persisted: user can return via /dashboard/[prospectId]?token=xxx
```

### State Management

For this prototype, keep state management simple:

- **Server state**: SQLite/Turso is the source of truth for prospect profiles, messages, dashboard data
- **Client state**: React `useState` / `useReducer` for chat messages and dashboard display
- **No global state library needed** (no Redux, no Zustand) — the app has two main views (chat + dashboard) with straightforward data flow
- **URL-based persistence**: Each prospect gets a unique URL with an access token. Bookmark it, come back later, dashboard is still there.

### Key Data Types

```typescript
// src/lib/types.ts

export interface ProspectProfile {
  id: string;
  profession: string;
  sector: string;
  concerns: string[];
  createdAt: Date;
}

export interface DashboardData {
  risks: Risk[];
  products: ProductRecommendation[];
  partners: PartnerRecommendation[];
  resources: Resource[];
  profile: ProspectProfile;
}

export interface Risk {
  id: string;
  label: string;            // e.g. "Arrêt de travail prolongé"
  severity: "high" | "medium" | "low";
  description: string;       // Personalized explanation
}

export interface ProductRecommendation {
  id: string;
  name: string;              // e.g. "MetLife Prévoyance TNS"
  relevance: string;         // Why this product matters for this TNS
  url: string;               // Link to MetLife product page
  coverageType: string;      // e.g. "prevoyance", "sante", "epargne"
}

export interface PartnerRecommendation {
  id: "caarl" | "doado" | "noctia";
  name: string;
  description: string;
  relevance: string;         // Why this partner matters for this TNS
}

export interface Resource {
  title: string;
  url: string;
  type: "article" | "guide" | "tool" | "faq";
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: Date;
  dashboardData?: DashboardData; // Attached to assistant messages that generate/update dashboard
}
```

## Build Order (Recommended)

This sequence is ordered to get a working demo as fast as possible, then layer on features:

| Phase | What | Why First |
|-------|------|-----------|
| **1. Skeleton** | Next.js app, Tailwind config with MetLife colors, basic layout | Foundation for everything |
| **2. Chat UI** | Chat input, message bubbles, streaming display | Core UX — need to see it working |
| **3. Claude Integration** | API route calling Claude with hardcoded system prompt (no RAG yet) | Proves the conversation works |
| **4. Structured Output** | Extract dashboard JSON from Claude response (tool_use or parsing) | Bridge from chat to dashboard |
| **5. Dashboard UI** | Render risk cards, product cards, partner cards from structured data | The "wow" moment |
| **6. Scraping Pipeline** | Scrape MetLife site, chunk content, store as JSON | Feeds the RAG |
| **7. RAG Integration** | Embed chunks, wire vector search into chat API route | Makes responses accurate |
| **8. Persistence** | SQLite schema, Drizzle ORM, save prospects + messages + dashboards | Enables returning visitors |
| **9. Chat → Dashboard Transition** | Animated phase transition, split-panel layout | Polish the "wow" |
| **10. Partner Services** | Caarl, Doado, Noctia cards with conditional display logic | Completes the vision |
| **11. Polish** | MetLife branding, loading states, error handling, mobile responsive | Demo-ready |

## Scaling Considerations

These are noted for awareness but are **not priorities for the prototype**:

| Concern | Prototype Approach | Production Approach |
|---------|-------------------|---------------------|
| **Concurrent users** | SQLite handles it fine for demos | Turso (distributed SQLite) or PostgreSQL |
| **RAG accuracy** | In-memory cosine similarity, <1000 chunks | Dedicated vector DB (Pinecone, Qdrant), hybrid search |
| **Embedding cost** | Pre-compute once, store in SQLite | Incremental updates, background jobs |
| **Claude API latency** | Streaming hides latency well | Cache common situation patterns, edge functions |
| **Content freshness** | Run scraper manually before demo | Scheduled scraping jobs, content diffing |
| **Session management** | Simple access token in URL | Proper auth (NextAuth), session cookies |
| **Rate limiting** | None needed for demo | Per-IP rate limiting on API routes |

## Anti-Patterns to Avoid

| Anti-Pattern | Why It's Tempting | What to Do Instead |
|-------------|-------------------|-------------------|
| **Over-engineering RAG** | "We need a proper vector DB, re-ranking, HyDE..." | For <1000 chunks, in-memory cosine similarity is fast and accurate enough. Add complexity only when retrieval quality is demonstrably poor. |
| **Chatbot-style multi-turn** | "Let Claude ask follow-up questions in a long conversation" | For the prototype, optimize for a **single rich input** → **instant dashboard**. One or two exchanges max. Long conversations dilute the "wow". |
| **Client-side AI state** | "Store conversation context in React state and send it all each time" | Keep conversation history server-side (DB). Client only needs current messages for display and the latest dashboard snapshot. |
| **Premature abstraction** | "Let's build a generic AI chat framework" | Build the specific MetLife prospect experience. Hardcode product categories, partner IDs, dashboard card types. Generalize later (never). |
| **Giant system prompts** | "Put all MetLife content in the system prompt" | Use RAG to inject only the ~8 most relevant chunks. Claude performs better with focused context than with 50K tokens of everything. |
| **Splitting chat and dashboard into separate pages** | "Traditional MPA routing" | The magic is the transition. Chat and dashboard should be on the **same page**, with the dashboard sliding in as Claude responds. A page reload kills the effect. |
| **Using LangChain/LlamaIndex** | "These frameworks handle RAG" | For this scale, they add dependency weight and abstraction layers without benefit. Direct Anthropic SDK + manual similarity search is simpler and more controllable. |

## Integration Points

### Claude API (Anthropic)

- **SDK**: `@anthropic-ai/sdk`
- **Model**: `claude-sonnet-4-20250514` (good balance of speed + quality for prototype)
- **Features used**: Streaming, tool_use (for structured dashboard extraction), system prompts
- **Key consideration**: French language — Claude handles French natively, no special config needed
- **Rate limits**: Tier 1 is fine for prototype (50 RPM)

### SQLite / Turso

- **Local**: `better-sqlite3` driver via Drizzle ORM
- **Deployed**: Turso (libsql) — same Drizzle schema, swap driver
- **ORM**: Drizzle — lightweight, type-safe, good SQLite support
- **Config**: `drizzle.config.ts` with conditional local/remote DB URL

### Content Scraping (MetLife Site)

- **Target**: `metlife.fr` product pages, advice articles, FAQ, resource pages
- **Tool**: `cheerio` for static HTML parsing (prefer over Playwright for speed)
- **Output**: JSON files in `data/scraped/`, one per page
- **Schedule**: Manual run before demo, not automated

### Embedding Generation

- **Option A (recommended for prototype)**: `@xenova/transformers` with `all-MiniLM-L6-v2` — runs locally in Node, no API cost, fast
- **Option B**: Voyage AI embeddings via API — higher quality, small cost
- **Option C**: Use Claude to generate text summaries for keyword-based matching (no vectors) — simplest but least precise
- **Storage**: Embeddings stored as JSON arrays in SQLite `content_chunks` table

### Partner Services (Caarl, Doado, Noctia)

These are **fictional/demo services** — no real API integration needed:

```typescript
// src/config/partners.ts
export const partners = {
  caarl: {
    name: "Caarl",
    tagline: "Assistance juridique pour TNS",
    description: "Protection juridique et accompagnement administratif",
    icon: "scale", // Lucide icon name
    relevantFor: ["juridique", "litige", "contrat", "droit"],
    url: "#", // Demo link
  },
  doado: {
    name: "Doado",
    tagline: "Prévention des TMS",
    description: "Programme personnalisé de prévention des troubles musculo-squelettiques",
    icon: "activity",
    relevantFor: ["tms", "posture", "douleur", "physique", "artisan", "manuel"],
    url: "#",
  },
  noctia: {
    name: "Noctia",
    tagline: "Gestion du sommeil",
    description: "Diagnostic et accompagnement pour améliorer la qualité du sommeil",
    icon: "moon",
    relevantFor: ["sommeil", "fatigue", "stress", "burnout", "insomnie"],
    url: "#",
  },
} as const;
```

Claude decides which partners to recommend based on the TNS profile — no separate matching logic needed.

### MetLife Design System

- **Colors**: Extract from metlife.fr (primary green #00A94F, dark navy, white)
- **Typography**: Follow MetLife brand fonts or closest open-source equivalent
- **Logo**: Use MetLife logo assets (obtain from brand guidelines or site)
- **Implementation**: Tailwind config with MetLife color palette as custom theme

---

*Research completed 2026-03-20. This document describes architecture patterns for the prototype phase. Production architecture would differ significantly in auth, scaling, monitoring, and infrastructure.*
