# Stack Research: AI-Powered Insurance Prospect Experience

- **Domain:** Conversational AI webapp / Insurance / RAG
- **Date:** 2026-03-20
- **Confidence:** High (all versions verified via npm/GitHub on 2026-03-20)

---

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Notes |
|---|---|---|---|
| **Next.js** | `16.2.0` | Full-stack React framework | App Router, Server Components, API Routes. Stable LTS. |
| **React** | `19.x` | UI library | Bundled with Next.js 16. Server Components, Actions. |
| **Tailwind CSS** | `4.2.0` | Utility-first CSS | Oxide engine (Rust), CSS-first config via `@theme`, 5x faster builds. |
| **TypeScript** | `5.7+` | Type safety | Required by Drizzle, AI SDK, and all major deps. |
| **Drizzle ORM** | `0.45.1` | Database ORM | Type-safe, lightweight, native Turso/libSQL support. |
| **@libsql/client** | `0.17.0` | Turso/SQLite driver | Local SQLite for dev, Turso cloud for deploy. |
| **AI SDK (Vercel)** | `6.0.x` (`ai`) | AI integration layer | Streaming, tool use, agent abstraction. Framework-agnostic. |
| **@ai-sdk/anthropic** | `3.0.x` | Claude provider for AI SDK | Bridges AI SDK to Claude API. |
| **@anthropic-ai/sdk** | `0.80.0` | Direct Claude API access | For advanced use cases outside AI SDK (batch, raw API). |

### Supporting Libraries

| Library | Version | Purpose |
|---|---|---|
| **shadcn/ui** | CLI v4 (March 2026) | Component library (Radix + Tailwind). Copy-paste, fully customizable. |
| **Zod** | `4.3.6` | Schema validation for forms, API payloads, AI structured output. |
| **Motion** (framer-motion) | `12.37.x` | Animations for dashboard transitions, conversational UI. |
| **Recharts** | `3.7.0` | Charts for risk dashboard visualization. |
| **react-markdown** | `10.1.0` | Render AI responses with rich formatting. |
| **Lucide React** | latest | Icon set, works natively with shadcn/ui. |
| **next-auth** | `5.x` (beta) | Auth for prospect persistence. Lightweight magic link / anonymous sessions. |
| **Crawlee** | `3.16.0` | MetLife website scraping (Playwright mode). |
| **Playwright** | latest | Browser automation for Crawlee scraper. |

### RAG & Embeddings

| Technology | Purpose | Notes |
|---|---|---|
| **Turso native vector search** | Vector storage + similarity search | Built into libSQL, no extension needed. `F32_BLOB` column type + `vector_top_k()`. Single DB for relational + vector data. |
| **Voyage AI API** | Text embeddings | Anthropic's recommended embedding provider. Models: `voyage-3.5` (general), `voyage-finance-2` (insurance/finance domain). |
| **voyageai** (npm) | Voyage AI client | TypeScript SDK for embedding generation. |

> **Why Turso native vector over sqlite-vec or Vectra?** Turso's native vector search eliminates the need for a separate vector DB or SQLite extension. Embeddings are just a column type -- zero setup, works in local dev and cloud, and queries use standard SQL with `vector_top_k()`. This keeps the architecture simple: one database for everything.

### Dev Tools

| Tool | Purpose |
|---|---|
| **drizzle-kit** | Schema migrations, DB push, studio UI. |
| **Biome** | Linting + formatting (replaces ESLint + Prettier, much faster). |
| **Turso CLI** | Database management, local dev, cloud deploy. |

---

## Installation Commands

### Project Bootstrap

```bash
# Create Next.js 16 project
npx create-next-app@latest metlife-prospect --typescript --tailwind --app --src-dir

# Navigate into project
cd metlife-prospect

# Core dependencies
npm install ai @ai-sdk/anthropic @anthropic-ai/sdk
npm install drizzle-orm @libsql/client
npm install zod motion recharts react-markdown lucide-react
npm install next-auth@beta

# Dev dependencies
npm install -D drizzle-kit @biomejs/biome typescript @types/node

# shadcn/ui init (interactive — picks theme, components)
npx shadcn@latest init

# Scraper (separate script, not in main app)
npm install -D crawlee @crawlee/playwright playwright
npx playwright install chromium
```

### Turso Setup

```bash
# Install Turso CLI
brew install tursodatabase/tap/turso

# Create local database (dev)
turso dev

# Create cloud database (deploy)
turso db create metlife-prospect
turso db tokens create metlife-prospect
```

### Environment Variables

```env
# .env.local
ANTHROPIC_API_KEY=sk-ant-...
VOYAGEAI_API_KEY=pa-...
TURSO_DATABASE_URL=libsql://localhost:8080   # local dev
TURSO_AUTH_TOKEN=                             # empty for local
AUTH_SECRET=                                  # generated for next-auth
```

---

## Alternatives Considered

| Choice | Alternative | Why Not |
|---|---|---|
| **AI SDK 6** | Direct `@anthropic-ai/sdk` only | AI SDK provides streaming hooks (`useChat`), tool calling abstraction, and provider-switching. Worth the abstraction for a conversational UI. |
| **Turso native vector** | sqlite-vec, Vectra, Pinecone, Chroma | sqlite-vec requires extension loading (painful in serverless). Vectra is file-based, not scalable. Pinecone/Chroma add infrastructure. Turso's native vector is zero-config and shares the same DB. |
| **Voyage AI** | OpenAI embeddings, local models (e5-small) | Voyage is Anthropic's recommended partner. `voyage-finance-2` is domain-tuned for insurance/finance. Local models avoid API costs but lose domain quality. |
| **Drizzle ORM** | Prisma, Kysely | Prisma is heavier, generates a client, slower cold starts. Kysely is raw SQL -- less ergonomic. Drizzle is the sweet spot: type-safe, lightweight, native Turso support. |
| **shadcn/ui** | Radix UI raw, Chakra UI, Ant Design, MUI | shadcn gives full control over styling (critical for MetLife brand compliance). Not a dependency -- components are copied into the project. MUI/Ant have strong opinions that fight custom branding. |
| **Crawlee** | Puppeteer raw, Cheerio, Scrapy | Crawlee handles retries, rate limiting, proxy rotation out of the box. Playwright mode renders JS-heavy pages. Purpose-built for scraping at scale. |
| **next-auth v5** | Clerk, Auth0, Lucia | Clerk/Auth0 add external dependencies and cost. Lucia was deprecated. next-auth is free, self-hosted, and sufficient for lightweight prospect sessions (magic link or anonymous). |
| **Biome** | ESLint + Prettier | Biome is a single tool replacing both, written in Rust, 10-100x faster. Less config overhead for a prototype. |

---

## What NOT to Use

| Technology | Why Not |
|---|---|
| **LangChain.js** | Massive abstraction layer with frequent breaking changes. For this project, AI SDK 6 + direct Voyage API calls are simpler and more maintainable. |
| **Prisma** | Heavy ORM, slow cold starts, poor Turso support compared to Drizzle. |
| **sqlite-vss** | Deprecated in favor of sqlite-vec. Do not use. |
| **sqlite-vec (extension)** | Requires native extension loading -- painful in serverless/Vercel. Use Turso's native vector search instead. |
| **Pinecone / Weaviate / Chroma** | External vector DB is overkill for a prototype with ~200-500 documents. Turso handles this natively. |
| **Tailwind CSS v3** | v4 is stable, faster, and has better DX. No reason to use v3 on a greenfield project. |
| **Pages Router (Next.js)** | Legacy. App Router is the standard in Next.js 16. |
| **CSS Modules / styled-components** | Tailwind CSS is the project constraint. No need for alternatives. |
| **Express.js / Fastify** | Next.js API Routes and Server Actions cover all backend needs. No separate server. |
| **MongoDB / PostgreSQL** | SQLite/Turso is the project constraint. Lighter, local-first, no external DB server. |
| **Clerk** | Adds external dependency and cost for a prototype. next-auth is sufficient. |
| **OpenAI API** | Project specifies Claude/Anthropic. Voyage AI for embeddings aligns with this ecosystem. |

---

## Stack Patterns by Variant

### Variant A: Demo-First (Recommended for Prototype)

Optimized for local demos and "wow effect."

```
Next.js 16 (App Router)
  + AI SDK 6 + @ai-sdk/anthropic (streaming chat)
  + Turso local dev (SQLite file, no cloud needed)
  + Drizzle ORM (type-safe queries)
  + Turso native vector search (RAG)
  + Voyage AI API (embeddings)
  + shadcn/ui + Tailwind CSS 4 (MetLife-branded UI)
  + Motion (animations)
  + No auth (anonymous sessions via cookies)
```

### Variant B: Deployable Prototype

Adds persistence and sharing capabilities.

```
Variant A
  + Turso cloud (replicated database)
  + next-auth v5 (magic link for prospect persistence)
  + Vercel deployment
  + Environment-based config (local vs cloud)
```

### Variant C: Production-Ready (Future)

```
Variant B
  + Clerk or Auth0 (full auth)
  + Rate limiting (Upstash Redis)
  + Analytics (PostHog)
  + Error tracking (Sentry)
  + CDN for static assets
```

---

## Version Compatibility Matrix

| Package | Requires | Compatible With |
|---|---|---|
| Next.js 16.2 | Node.js 18.18+ | React 19, Tailwind 4 |
| AI SDK 6.x | Node.js 18+ | Next.js 15-16, @ai-sdk/anthropic 3.x |
| Drizzle ORM 0.45 | TypeScript 5.4+ | @libsql/client 0.14+, Turso |
| Tailwind CSS 4.2 | PostCSS 8+ (auto) | Next.js 16 (built-in support) |
| shadcn/ui v4 | Tailwind CSS 4+ | Next.js 15-16, React 19 |
| next-auth 5.x | Next.js 14+ | App Router, Edge Runtime |
| Crawlee 3.16 | Node.js 16+ | Playwright (latest) |

---

## Key Architecture Decisions

### 1. Single Database for Everything
Turso/libSQL serves as both the relational database (prospect profiles, product catalog, conversation history) and the vector database (RAG embeddings). This eliminates infrastructure complexity.

### 2. AI SDK as Abstraction Layer
Use Vercel AI SDK 6 for the conversational UI (`useChat` hook, streaming, tool calling). Use `@anthropic-ai/sdk` directly only for advanced scenarios (batch processing, raw API access for scraper pipeline).

### 3. Embeddings Strategy
- **Scrape** MetLife site with Crawlee (one-time or periodic script)
- **Chunk** content into ~500 token segments
- **Embed** with Voyage AI (`voyage-3.5` or `voyage-finance-2`)
- **Store** embeddings in Turso with `F32_BLOB` column
- **Query** at runtime: embed user message, `vector_top_k()` to retrieve relevant chunks, inject into Claude prompt

### 4. Component Ownership
shadcn/ui components are copied into the project (`/src/components/ui/`). This means full control for MetLife branding -- colors, typography, spacing can all be customized without fighting a component library's theme system.

---

## Sources

- [Next.js Releases](https://github.com/vercel/next.js/releases)
- [Tailwind CSS v4.2](https://github.com/tailwindlabs/tailwindcss/releases)
- [@anthropic-ai/sdk on npm](https://www.npmjs.com/package/@anthropic-ai/sdk)
- [AI SDK 6 Announcement](https://vercel.com/blog/ai-sdk-6)
- [@ai-sdk/anthropic on npm](https://www.npmjs.com/package/@ai-sdk/anthropic)
- [Drizzle ORM on npm](https://www.npmjs.com/package/drizzle-orm)
- [@libsql/client on npm](https://www.npmjs.com/package/@libsql/client)
- [Turso Native Vector Search](https://turso.tech/vector)
- [Voyage AI Embeddings](https://docs.voyageai.com/docs/embeddings)
- [Anthropic Embeddings Guide](https://platform.claude.com/docs/en/build-with-claude/embeddings)
- [shadcn/ui CLI v4 Changelog](https://ui.shadcn.com/docs/changelog/2026-03-cli-v4)
- [Crawlee on npm](https://www.npmjs.com/package/crawlee)
- [next-auth on npm](https://www.npmjs.com/package/next-auth)
- [Zod v4 Release Notes](https://zod.dev/v4)
- [Motion (framer-motion) on npm](https://www.npmjs.com/package/framer-motion)
- [Recharts on npm](https://www.npmjs.com/package/recharts)
- [sqlite-vec GitHub](https://github.com/asg017/sqlite-vec)

---

*Research completed 2026-03-20. All versions verified against npm registry and official release pages.*
