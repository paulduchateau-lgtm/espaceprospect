# Phase 1 Research: Foundation & Data Acquisition

**Date:** 2026-03-20
**Requirements:** CONF-01, RAG-01, RAG-02, RAG-03
**Goal:** Bootstrap the Next.js project with MetLife branding, scrape metlife.fr content, chunk it semantically, embed it with Voyage AI, and store it in Turso with vector search.

---

## 1. Next.js 16 Project Bootstrap

### 1.1 Create-Next-App Setup

Next.js 16.2 ships with a simplified `create-next-app` flow that defaults to App Router, TypeScript, and Tailwind CSS 4.

```bash
npx create-next-app@latest metlife-prospect \
  --typescript --tailwind --app --src-dir \
  --no-eslint  # We use Biome instead
```

This generates the scaffolding with React 19, App Router, and Tailwind CSS 4 pre-configured.

### 1.2 Tailwind CSS 4 Configuration

Tailwind CSS 4 uses **CSS-first configuration** via `@theme` directives instead of `tailwind.config.js`. Content detection is automatic (no `content` paths needed). The Oxide engine (Rust-based) provides ~5x faster builds.

The MetLife brand theme is defined directly in the main CSS file:

```css
/* src/app/globals.css */
@import "tailwindcss";

@theme {
  /* MetLife Brand Colors */
  --color-metlife-blue: #0090DA;
  --color-metlife-navy: #0061A0;
  --color-metlife-green: #A4CE4E;
  --color-metlife-dark: #333333;
  --color-metlife-white: #FFFFFF;

  /* Semantic aliases */
  --color-primary: #0090DA;
  --color-primary-dark: #0061A0;
  --color-accent: #A4CE4E;
  --color-foreground: #333333;
  --color-background: #FFFFFF;
  --color-muted: #F5F7FA;
  --color-border: #E2E8F0;

  /* Typography */
  --font-sans: 'MetLife Circular', 'Inter', system-ui, sans-serif;
  --font-serif: 'Utopia', Georgia, serif;

  /* Spacing & Radius */
  --radius-lg: 0.75rem;
  --radius-md: 0.5rem;
  --radius-sm: 0.25rem;
}
```

### 1.3 shadcn/ui Integration

shadcn/ui v4 (March 2026) supports Tailwind CSS 4 natively. Components are copied into the project, giving full control for MetLife branding.

```bash
npx shadcn@latest init
# Select: New York style, CSS variables: yes

# Install components needed for Phase 1 (minimal)
npx shadcn@latest add button card
```

**Important:** When using npm with React 19, use `--legacy-peer-deps` if peer dependency conflicts arise. pnpm/bun handle this automatically.

### 1.4 Project Structure (Phase 1 Scope)

```
metlife-prospect/
├── src/
│   ├── app/
│   │   ├── layout.tsx          # Root layout with MetLife branding
│   │   ├── page.tsx            # Landing page (branded placeholder)
│   │   └── globals.css         # Tailwind @theme with MetLife colors
│   ├── components/
│   │   └── ui/                 # shadcn/ui components
│   ├── lib/
│   │   ├── db.ts               # Turso/libSQL client
│   │   └── embeddings.ts       # Voyage AI client
│   └── db/
│       ├── schema.ts           # Drizzle schema (content_chunks + vector)
│       └── migrations/
├── scripts/
│   ├── scrape.ts               # Crawlee + Playwright scraper
│   ├── chunk.ts                # Content chunking pipeline
│   ├── embed.ts                # Voyage AI embedding generation
│   └── seed.ts                 # Orchestrator: scrape → chunk → embed → store
├── data/
│   └── scraped/                # Raw scraped markdown files
├── drizzle.config.ts
├── next.config.ts
├── package.json
└── .env.local
```

### 1.5 Dependencies for Phase 1

```bash
# Core framework
npm install next@16 react@19 react-dom@19

# Database
npm install drizzle-orm @libsql/client
npm install -D drizzle-kit

# Scraping (dev dependencies — offline pipeline only)
npm install -D crawlee @crawlee/playwright playwright
npx playwright install chromium

# Embeddings
npm install voyageai

# Dev tooling
npm install -D @biomejs/biome typescript @types/node

# shadcn/ui (after init)
npx shadcn@latest add button card
```

---

## 2. MetLife Brand Identity (CONF-01)

### 2.1 Official Brand Colors

Sourced from design.metlife.com and verified against metlife.fr production CSS:

| Name | Hex | Usage |
|------|-----|-------|
| **MetLife Blue** | `#0090DA` | Primary brand color, CTAs, links, headers |
| **MetLife Navy** | `#0061A0` | Secondary, hover states, dark accents |
| **MetLife Green** | `#A4CE4E` | Accent, success states, highlights |
| **MetLife Dark** | `#333333` | Body text, icons (never for backgrounds) |
| **White** | `#FFFFFF` | Backgrounds, cards |

### 2.2 Typography

MetLife's official typefaces are:

- **MetLife Circular** -- primary sans-serif for headings and UI elements
- **Utopia** -- serif, used for editorial/long-form content

Since MetLife Circular is a proprietary font, the prototype should use **Inter** (from Google Fonts) as a close fallback. Inter has similar geometric proportions and x-height. For the pitch, if MetLife provides brand font files, they can be loaded as local `@font-face`.

```tsx
// src/app/layout.tsx
import { Inter } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={inter.variable}>
      <body className="font-sans text-foreground bg-background antialiased">
        {children}
      </body>
    </html>
  );
}
```

### 2.3 Visual Identity Guidelines

- MetLife logo: `/content/dam/metga/logo/MetLife.png` on the production site. Download and serve from `/public/metlife-logo.png`.
- All digital assets must meet **Level AA color contrast** (WCAG). The primary blue `#0090DA` on white passes AA for large text (ratio 3.6:1) but fails for small text. Use `#0061A0` (navy) for small body text on white backgrounds (ratio 5.2:1).
- The green `#A4CE4E` should only be used for decorative elements or large text, not for small text on white (insufficient contrast).

### 2.4 Branded Landing Page

Phase 1 delivers a simple branded page confirming visual identity is correct:

```tsx
// src/app/page.tsx
export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-background">
      <img src="/metlife-logo.png" alt="MetLife" className="h-12 mb-8" />
      <h1 className="text-3xl font-bold text-primary-dark mb-4">
        Espace Prospect Intelligent
      </h1>
      <p className="text-lg text-foreground/70 max-w-md text-center">
        Découvrez comment MetLife peut protéger votre activité de TNS.
      </p>
    </main>
  );
}
```

---

## 3. Web Scraping MetLife.fr (RAG-01)

### 3.1 Site Architecture Analysis

MetLife.fr uses a hierarchical URL structure. The sitemap reveals **hundreds of pages** across several sections. For the TNS prospect use case, the following sections are high-value:

#### Priority 1 -- Core Product Pages (must scrape)

| Section | URL Pattern | Content Type | Est. Pages |
|---------|-------------|--------------|------------|
| **Prévoyance TNS** | `/assurance-prevoyance-professionnels/travailleurs-non-salaries/` | Product: Super Novaterm guarantees | ~10 |
| **Prévoyance Pro** | `/assurance-prevoyance-professionnels/` | Homme clé, croisée associés | ~5 |
| **Assurance Emprunteur** | `/assurance-emprunteur/` | Prêt immobilier coverage | ~15 |
| **Prévoyance Individuelle** | `/assurance-prevoyance/prevoyance-individuelle/` | Décès, hospitalisation | ~10 |

#### Priority 2 -- Supporting Content (should scrape)

| Section | URL Pattern | Content Type | Est. Pages |
|---------|-------------|--------------|------------|
| **TNS Profession Pages** | `/assurance-prevoyance-professionnels/travailleurs-non-salaries/[profession]/` | Profession-specific risk content | ~30 |
| **Guarantees Explainers** | `/assurance-emprunteur/garanties/` | ITT, IPT, PTIA, décès definitions | ~10 |
| **Madelin/Fiscal** | `/assurance-prevoyance-professionnels/prevoyance-madelin/` | Tax deduction guidance | ~5 |
| **Connaître MetLife** | `/connaitre-metlife/` | Trust signals, company info | ~5 |

#### Priority 3 -- Contextual Content (nice to have)

| Section | URL Pattern | Content Type | Est. Pages |
|---------|-------------|--------------|------------|
| **Health Risk Articles** | `/assurance-emprunteur/[pathologie]/` | Condition-specific insurance guidance | ~50 |
| **Legal Framework** | `/assurance-emprunteur/loi-*/` | Lemoine, Hamon, AERAS | ~10 |
| **FAQ / Assistance** | `/assistance/` | Common questions | ~10 |

**Recommendation:** Start with Priority 1 + 2 (~85 pages). This covers the five core product lines (Super Novaterm incapacité, invalidité, décès, frais généraux + emprunteur) and profession-specific content. Add Priority 3 only if retrieval quality is insufficient.

### 3.2 Super Novaterm Product Details (Discovered)

The main TNS product is **Super Novaterm Prévoyance**, offering:

| Guarantee | Max Coverage |
|-----------|-------------|
| Décès | Up to 50M EUR per insured |
| PTIA (Perte Totale et Irréversible d'Autonomie) | Up to 20M EUR |
| Incapacité (Arrêt de travail) | Up to 1,000 EUR/day |
| Invalidité | Up to 30,000 EUR/month |
| Frais Généraux (Operating costs) | Up to 600 EUR/day |
| Rente Éducation | Up to 2,000 EUR/month per child |
| Rente de Conjoint | Up to 5,000 EUR/month |
| Maladies Redoutées | Lump sum capital |
| Protection Juridique | Included |

Target: artisans, commerçants, professions libérales, gérants majoritaires, micro-entrepreneurs, indépendants. Tax-deductible under Madelin framework.

### 3.3 Crawlee + Playwright Scraper Implementation

MetLife.fr uses JavaScript rendering for some sections (cookie banners, dynamic content), making Playwright necessary over simple HTTP fetching.

```typescript
// scripts/scrape.ts
import { PlaywrightCrawler, Dataset } from 'crawlee';

const BASE_URL = 'https://www.metlife.fr';

// Target URLs by priority
const SEED_URLS = [
  // Priority 1: Core products
  `${BASE_URL}/assurance-prevoyance-professionnels/travailleurs-non-salaries/`,
  `${BASE_URL}/assurance-prevoyance-professionnels/`,
  `${BASE_URL}/assurance-prevoyance-professionnels/homme-cle/`,
  `${BASE_URL}/assurance-prevoyance-professionnels/associe/`,
  `${BASE_URL}/assurance-emprunteur/`,
  `${BASE_URL}/assurance-prevoyance/`,
  `${BASE_URL}/assurance-prevoyance/prevoyance-individuelle/`,
  // Priority 2: Profession pages, guarantees
  `${BASE_URL}/assurance-prevoyance-professionnels/travailleurs-non-salaries/chef-entreprise/`,
  `${BASE_URL}/assurance-prevoyance-professionnels/prevoyance-madelin/`,
  `${BASE_URL}/connaitre-metlife/`,
];

const crawler = new PlaywrightCrawler({
  launchContext: {
    launchOptions: { headless: true },
  },
  maxRequestsPerCrawl: 150,
  maxConcurrency: 3, // Be polite to metlife.fr
  navigationTimeoutSecs: 30,

  async requestHandler({ request, page, enqueueLinks, log }) {
    log.info(`Scraping: ${request.url}`);

    // Dismiss cookie banner if present
    try {
      await page.click('[id*="cookie"] button, .cookie-accept', { timeout: 3000 });
    } catch { /* no banner */ }

    // Wait for main content to render
    await page.waitForSelector('main, article, .content-area', { timeout: 10000 });

    // Remove noise elements
    await page.evaluate(() => {
      document.querySelectorAll('nav, footer, script, style, .cookie-banner, iframe, .modal')
        .forEach(el => el.remove());
    });

    // Extract structured content
    const data = await page.evaluate(() => {
      const main = document.querySelector('main') || document.querySelector('article') || document.body;
      const headings = Array.from(main.querySelectorAll('h1, h2, h3')).map(h => ({
        level: parseInt(h.tagName[1]),
        text: h.textContent?.trim() || '',
      }));

      return {
        title: document.querySelector('h1')?.textContent?.trim() || document.title,
        description: document.querySelector('meta[name="description"]')?.getAttribute('content') || '',
        headings,
        content: main.innerText.trim(),
        html: main.innerHTML,
      };
    });

    await Dataset.pushData({
      url: request.url,
      ...data,
      scrapedAt: new Date().toISOString(),
    });

    // Follow internal links within our target sections
    await enqueueLinks({
      strategy: 'same-domain',
      globs: [
        '**/assurance-prevoyance-professionnels/**',
        '**/assurance-prevoyance/**',
        '**/assurance-emprunteur/**',
        '**/connaitre-metlife/**',
      ],
      exclude: [
        '**/espace-client/**',
        '**/intermediaires/**',
        '**cloud.e.metlife.fr**',
      ],
    });
  },

  failedRequestHandler({ request, log }) {
    log.error(`Failed: ${request.url}`);
  },
});

await crawler.addRequests(SEED_URLS);
await crawler.run();
```

### 3.4 Content Normalization to Markdown

After scraping, convert raw HTML/text to structured markdown with metadata frontmatter:

```typescript
// scripts/normalize.ts
interface NormalizedPage {
  url: string;
  title: string;
  description: string;
  productType: 'prevoyance-tns' | 'emprunteur' | 'prevoyance-individuelle'
    | 'prevoyance-pro' | 'about' | 'guide' | 'other';
  tnsRelevance: 'direct' | 'indirect' | 'contextual';
  guarantees: string[];  // e.g., ['incapacite', 'invalidite', 'deces']
  markdown: string;
}

function classifyPage(url: string, content: string): Pick<NormalizedPage, 'productType' | 'tnsRelevance'> {
  if (url.includes('travailleurs-non-salaries') || url.includes('prevoyance-tns'))
    return { productType: 'prevoyance-tns', tnsRelevance: 'direct' };
  if (url.includes('homme-cle') || url.includes('associe'))
    return { productType: 'prevoyance-pro', tnsRelevance: 'direct' };
  if (url.includes('assurance-emprunteur'))
    return { productType: 'emprunteur', tnsRelevance: 'indirect' };
  if (url.includes('assurance-prevoyance') && !url.includes('professionnels'))
    return { productType: 'prevoyance-individuelle', tnsRelevance: 'indirect' };
  if (url.includes('connaitre-metlife'))
    return { productType: 'about', tnsRelevance: 'contextual' };
  return { productType: 'other', tnsRelevance: 'contextual' };
}

function extractGuarantees(content: string): string[] {
  const guaranteeKeywords: Record<string, string> = {
    'incapacit': 'incapacite',
    'invalidit': 'invalidite',
    'décès': 'deces',
    'capital décès': 'capital-deces',
    'ptia': 'ptia',
    'frais généraux': 'frais-generaux',
    'rente éducation': 'rente-education',
    'rente de conjoint': 'rente-conjoint',
    'maladies redoutées': 'maladies-redoutees',
    'protection juridique': 'protection-juridique',
    'emprunteur': 'emprunteur',
    'hospitalisation': 'hospitalisation',
  };

  const found = new Set<string>();
  const lower = content.toLowerCase();
  for (const [keyword, tag] of Object.entries(guaranteeKeywords)) {
    if (lower.includes(keyword)) found.add(tag);
  }
  return Array.from(found);
}
```

---

## 4. RAG Pipeline (RAG-02, RAG-03)

### 4.1 Chunking Strategy for Insurance Content

Insurance content has specific characteristics that affect chunking:
- **Products** have multiple guarantees, each with distinct conditions
- **Profession pages** describe risks specific to a trade
- **Legal/fiscal pages** contain precise rules (Madelin deduction limits, etc.)
- **FAQ sections** have natural question/answer pairs

**Recommended approach: Semantic chunking by heading sections with metadata enrichment.**

```typescript
// scripts/chunk.ts
import { randomUUID } from 'crypto';

interface ContentChunk {
  id: string;
  content: string;          // The chunk text (markdown)
  source_url: string;       // Origin page URL
  title: string;            // Section heading or page title
  product_type: string;     // prevoyance-tns, emprunteur, etc.
  tns_relevance: string;    // direct, indirect, contextual
  guarantees: string[];     // Covered guarantees in this chunk
  chunk_type: string;       // product, guarantee, profession, faq, guide, about
  token_estimate: number;   // Rough token count
}

function chunkPage(page: NormalizedPage): ContentChunk[] {
  const chunks: ContentChunk[] = [];
  const sections = splitByHeadings(page.markdown);

  for (const section of sections) {
    const tokens = estimateTokens(section.content);

    if (tokens < 50) continue; // Skip trivial sections (nav fragments, etc.)

    if (tokens <= 600) {
      // Section fits in one chunk — keep it whole
      chunks.push(createChunk(section, page));
    } else {
      // Split long sections by paragraph, target ~400 tokens per chunk
      const subChunks = splitByParagraphs(section.content, 400);
      for (const sub of subChunks) {
        chunks.push(createChunk({ ...section, content: sub }, page));
      }
    }
  }

  return chunks;
}

function splitByHeadings(markdown: string): { heading: string; content: string }[] {
  // Split on ## and ### headings, preserving the heading as context
  const regex = /^(#{1,3})\s+(.+)$/gm;
  const sections: { heading: string; content: string }[] = [];
  let lastIndex = 0;
  let lastHeading = '';
  let match;

  while ((match = regex.exec(markdown)) !== null) {
    if (lastIndex > 0 || match.index > 0) {
      const content = markdown.slice(lastIndex, match.index).trim();
      if (content) sections.push({ heading: lastHeading, content });
    }
    lastHeading = match[2];
    lastIndex = match.index + match[0].length;
  }
  // Last section
  const remaining = markdown.slice(lastIndex).trim();
  if (remaining) sections.push({ heading: lastHeading, content: remaining });

  return sections;
}

function splitByParagraphs(text: string, targetTokens: number): string[] {
  const paragraphs = text.split(/\n\n+/);
  const chunks: string[] = [];
  let current = '';

  for (const p of paragraphs) {
    const combined = current ? `${current}\n\n${p}` : p;
    if (estimateTokens(combined) > targetTokens * 1.2 && current) {
      chunks.push(current);
      current = p;
    } else {
      current = combined;
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

function estimateTokens(text: string): number {
  // French text averages ~1.3 tokens per word
  return Math.ceil(text.split(/\s+/).length * 1.3);
}

function createChunk(
  section: { heading: string; content: string },
  page: NormalizedPage
): ContentChunk {
  return {
    id: randomUUID(),
    content: section.heading
      ? `## ${section.heading}\n\n${section.content}`
      : section.content,
    source_url: page.url,
    title: section.heading || page.title,
    product_type: page.productType,
    tns_relevance: page.tnsRelevance,
    guarantees: extractGuarantees(section.content),
    chunk_type: inferChunkType(section, page),
    token_estimate: estimateTokens(section.content),
  };
}

function inferChunkType(
  section: { heading: string; content: string },
  page: NormalizedPage
): string {
  const lower = (section.heading + section.content).toLowerCase();
  if (lower.includes('?') && lower.includes('réponse')) return 'faq';
  if (page.productType === 'about') return 'about';
  if (page.url.includes('madelin') || lower.includes('déduction')) return 'guide';
  if (lower.includes('garantie') || lower.includes('couverture')) return 'guarantee';
  if (page.url.includes('travailleurs-non-salaries/') &&
      !page.url.endsWith('travailleurs-non-salaries/')) return 'profession';
  return 'product';
}
```

### 4.2 Chunk Size Rationale

| Approach | Target Size | Trade-off |
|----------|-------------|-----------|
| ~200 tokens | High precision, low context | Too granular for insurance — loses guarantee conditions |
| **~400 tokens** | **Good precision + enough context** | **Recommended — captures a full guarantee description or profession risk profile** |
| ~800 tokens | Rich context, lower precision | May mix multiple guarantees, diluting relevance |

For `voyage-finance-2` with 1024 dimensions, **400-token chunks** provide the best balance. The model's 32K context window means we can embed much larger texts, but smaller chunks give better retrieval precision.

### 4.3 Voyage AI Embedding Setup

```typescript
// src/lib/embeddings.ts

const VOYAGE_API_URL = 'https://api.voyageai.com/v1/embeddings';
const VOYAGE_MODEL = 'voyage-finance-2'; // Domain-tuned for insurance/finance
const EMBEDDING_DIMENSIONS = 1024;

interface VoyageEmbeddingResponse {
  data: { embedding: number[]; index: number }[];
  usage: { total_tokens: number };
}

export async function generateEmbeddings(
  texts: string[],
  inputType: 'document' | 'query'
): Promise<number[][]> {
  const apiKey = process.env.VOYAGEAI_API_KEY;
  if (!apiKey) throw new Error('VOYAGEAI_API_KEY not set');

  // Voyage finance-2: max 128 texts per batch, max 120K tokens total
  const BATCH_SIZE = 64; // Conservative batch size
  const allEmbeddings: number[][] = [];

  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE);

    const response = await fetch(VOYAGE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        input: batch,
        model: VOYAGE_MODEL,
        input_type: inputType,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Voyage AI API error: ${response.status} ${error}`);
    }

    const data: VoyageEmbeddingResponse = await response.json();
    const sorted = data.data.sort((a, b) => a.index - b.index);
    allEmbeddings.push(...sorted.map(d => d.embedding));

    // Rate limiting: brief pause between batches
    if (i + BATCH_SIZE < texts.length) {
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }

  return allEmbeddings;
}

// Convenience function for single query embedding
export async function embedQuery(text: string): Promise<number[]> {
  const [embedding] = await generateEmbeddings([text], 'query');
  return embedding;
}
```

**Key detail:** Voyage AI uses `input_type: "document"` when embedding chunks for storage, and `input_type: "query"` when embedding user questions at runtime. This asymmetric embedding improves retrieval quality.

### 4.4 Turso Vector Search Configuration

Turso's native vector search uses `F32_BLOB` columns with DiskANN-based approximate nearest neighbor indexing. No extensions to install.

```typescript
// src/lib/db.ts
import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from '@/db/schema';

const client = createClient({
  url: process.env.TURSO_DATABASE_URL || 'file:local.db',
  authToken: process.env.TURSO_AUTH_TOKEN,
});

export const db = drizzle(client, { schema });
export { client };
```

Vector index creation (run once during seed):

```sql
CREATE INDEX IF NOT EXISTS chunks_embedding_idx
  ON content_chunks(libsql_vector_idx(embedding, 'metric=cosine'));
```

Query pattern for retrieval:

```sql
SELECT id, distance
FROM vector_top_k('chunks_embedding_idx', vector32(?), 8)
JOIN content_chunks ON content_chunks.rowid = id;
```

---

## 5. Database Schema (RAG-02, RAG-03)

### 5.1 Drizzle Schema with Custom Vector Type

```typescript
// src/db/schema.ts
import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import { customType } from 'drizzle-orm/sqlite-core';

// Custom F32_BLOB vector column type for Turso native vector search
const float32Vector = customType<{
  data: number[];
  config: { dimensions: number };
  configRequired: true;
  driverData: Buffer;
}>({
  dataType(config) {
    return `F32_BLOB(${config.dimensions})`;
  },
  fromDriver(value: Buffer) {
    return Array.from(new Float32Array(value.buffer));
  },
  toDriver(value: number[]) {
    return sql`vector32(${JSON.stringify(value)})`;
  },
});

// ─── Content Chunks Table ────────────────────────────────
export const contentChunks = sqliteTable('content_chunks', {
  id: text('id').primaryKey(),                          // UUID
  content: text('content').notNull(),                   // Markdown text of the chunk
  sourceUrl: text('source_url').notNull(),              // Origin page URL on metlife.fr
  title: text('title').notNull(),                       // Section heading or page title
  productType: text('product_type').notNull(),          // prevoyance-tns | emprunteur | prevoyance-individuelle | prevoyance-pro | about | guide
  tnsRelevance: text('tns_relevance').notNull(),        // direct | indirect | contextual
  guarantees: text('guarantees', { mode: 'json' })      // string[] — e.g., ["incapacite", "invalidite"]
    .notNull()
    .$type<string[]>(),
  chunkType: text('chunk_type').notNull(),              // product | guarantee | profession | faq | guide | about
  tokenEstimate: integer('token_estimate').notNull(),   // Approximate token count
  embedding: float32Vector('embedding', { dimensions: 1024 }), // Voyage finance-2 = 1024 dims
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
});

// ─── Scrape Metadata Table ───────────────────────────────
// Tracks what was scraped and when, for incremental updates
export const scrapeLog = sqliteTable('scrape_log', {
  id: text('id').primaryKey(),                          // UUID
  url: text('url').notNull().unique(),                  // Page URL
  title: text('title'),                                 // Page title
  statusCode: integer('status_code'),                   // HTTP status
  chunkCount: integer('chunk_count'),                   // Number of chunks generated
  scrapedAt: integer('scraped_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
});
```

### 5.2 Why This Schema

- **`content_chunks`** is the core RAG table. Each row = one semantic chunk with its vector embedding.
- **`embedding`** uses `F32_BLOB(1024)` for Voyage finance-2's 1024-dimensional output. Turso's native vector index makes this queryable via `vector_top_k`.
- **`guarantees`** is stored as JSON array to enable metadata filtering (e.g., only retrieve chunks about `incapacite` when the prospect mentions work stoppage).
- **`productType`** and **`tnsRelevance`** enable pre-filtering before vector search, improving precision.
- **`scrape_log`** tracks provenance — which pages were scraped, when, and how many chunks they produced. Essential for re-scraping.

### 5.3 Index and Migration Setup

```typescript
// drizzle.config.ts
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './src/db/migrations',
  dialect: 'turso',
  dbCredentials: {
    url: process.env.TURSO_DATABASE_URL || 'file:local.db',
    authToken: process.env.TURSO_AUTH_TOKEN,
  },
});
```

After migration, create the vector index via raw SQL (Drizzle does not generate vector indexes automatically):

```typescript
// scripts/seed.ts — run after drizzle-kit push
import { client } from '@/lib/db';

await client.execute(`
  CREATE INDEX IF NOT EXISTS chunks_embedding_idx
  ON content_chunks(libsql_vector_idx(embedding, 'metric=cosine'))
`);
```

### 5.4 Vector Insertion Pattern

Due to a known Drizzle ORM issue with F32_BLOB columns, vector insertions should use raw SQL via the libSQL client:

```typescript
// scripts/embed.ts
import { client } from '@/lib/db';

async function insertChunkWithEmbedding(chunk: ContentChunk, embedding: number[]) {
  await client.execute({
    sql: `INSERT INTO content_chunks
          (id, content, source_url, title, product_type, tns_relevance,
           guarantees, chunk_type, token_estimate, embedding, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, vector32(?), unixepoch())`,
    args: [
      chunk.id,
      chunk.content,
      chunk.source_url,
      chunk.title,
      chunk.product_type,
      chunk.tns_relevance,
      JSON.stringify(chunk.guarantees),
      chunk.chunk_type,
      chunk.token_estimate,
      JSON.stringify(embedding),
    ],
  });
}
```

### 5.5 Vector Retrieval Pattern

```typescript
// src/lib/rag.ts (used in Phase 2, built in Phase 1 for validation)
import { client } from './db';
import { embedQuery } from './embeddings';

export interface RetrievedChunk {
  id: string;
  content: string;
  title: string;
  productType: string;
  guarantees: string[];
  distance: number;
}

export async function retrieveRelevantChunks(
  query: string,
  topK: number = 8
): Promise<RetrievedChunk[]> {
  const queryEmbedding = await embedQuery(query);

  const result = await client.execute({
    sql: `
      SELECT
        content_chunks.id,
        content_chunks.content,
        content_chunks.title,
        content_chunks.product_type,
        content_chunks.guarantees,
        vt.distance
      FROM vector_top_k('chunks_embedding_idx', vector32(?), ?)
        AS vt
      JOIN content_chunks ON content_chunks.rowid = vt.id
      ORDER BY vt.distance ASC
    `,
    args: [JSON.stringify(queryEmbedding), topK],
  });

  return result.rows.map(row => ({
    id: row.id as string,
    content: row.content as string,
    title: row.title as string,
    productType: row.product_type as string,
    guarantees: JSON.parse(row.guarantees as string),
    distance: row.distance as number,
  }));
}
```

---

## 6. Seed Pipeline Orchestration

The full pipeline runs as a single script:

```typescript
// scripts/seed.ts
// 1. Scrape metlife.fr → data/scraped/*.json
// 2. Normalize → structured markdown with metadata
// 3. Chunk → ~400 token semantic chunks
// 4. Embed via Voyage AI → 1024-dim vectors
// 5. Store in Turso/SQLite with vector index

async function seed() {
  console.log('Step 1: Scraping metlife.fr...');
  await runScraper();           // Crawlee pipeline → data/scraped/

  console.log('Step 2: Normalizing content...');
  const pages = await normalizeScrapedData(); // JSON → NormalizedPage[]

  console.log('Step 3: Chunking content...');
  const chunks = pages.flatMap(chunkPage);
  console.log(`  Generated ${chunks.length} chunks from ${pages.length} pages`);

  console.log('Step 4: Generating embeddings...');
  const texts = chunks.map(c => c.content);
  const embeddings = await generateEmbeddings(texts, 'document');
  console.log(`  Generated ${embeddings.length} embeddings`);

  console.log('Step 5: Storing in database...');
  // Create vector index first
  await client.execute(`
    CREATE INDEX IF NOT EXISTS chunks_embedding_idx
    ON content_chunks(libsql_vector_idx(embedding, 'metric=cosine'))
  `);

  for (let i = 0; i < chunks.length; i++) {
    await insertChunkWithEmbedding(chunks[i], embeddings[i]);
  }
  console.log(`  Stored ${chunks.length} chunks with embeddings`);

  console.log('Seed complete.');
}
```

**Expected output:** ~200-400 chunks from ~85 pages, each with a 1024-dim embedding, stored in SQLite with a cosine vector index.

---

## 7. Key Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| MetLife.fr blocks scraping (403/rate limiting) | Cannot build RAG corpus | Use Playwright with realistic user-agent, low concurrency (3 req), add delays. Fallback: manually download key pages. |
| Drizzle ORM F32_BLOB insertion bug | Cannot store embeddings via ORM | Use raw SQL via `client.execute()` for vector operations (documented workaround above). |
| Voyage AI API cost | Budget constraint | ~400 chunks x 400 tokens = ~160K tokens. At Voyage pricing this is negligible (<$0.10). |
| Turso local dev lacks vector support | Cannot test locally | Turso's `turso dev` command supports vector search as of late 2025. Verify with `turso dev --version`. Fallback: use Turso cloud free tier. |
| MetLife.fr structure changes | Scraper breaks | Scraper output is cached in `data/scraped/`. Re-scrape only when needed. The chunking pipeline is decoupled from scraping. |
| Insufficient chunk quality | Poor RAG retrieval | Validate with test queries (see Validation section). Iterate on chunking strategy before moving to Phase 2. |

---

## Validation Architecture

### V1: Project Bootstrap (CONF-01)

**Test:** Visual inspection of the branded landing page.

| Criterion | How to Validate | Pass Condition |
|-----------|----------------|----------------|
| MetLife colors applied | Run `npm run dev`, inspect page | Primary blue `#0090DA` visible in heading/CTA, navy `#0061A0` in text, green `#A4CE4E` as accent |
| Typography renders | Inspect computed font-family | `Inter` loads correctly as primary sans-serif |
| MetLife logo displayed | Visual check | Logo renders at appropriate size, not pixelated |
| Tailwind 4 @theme working | Inspect CSS variables in devtools | `--color-primary`, `--color-metlife-blue` etc. resolve to correct hex values |
| Page is in French | Read the text | All visible text is in French |

### V2: Scraping Pipeline (RAG-01)

**Test:** Run `npm run seed:scrape` and verify output files.

| Criterion | How to Validate | Pass Condition |
|-----------|----------------|----------------|
| Scraper runs without errors | Check console output | No unhandled errors, all seed URLs attempted |
| Coverage of product lines | Count scraped files by `productType` | At least one page scraped for each: prevoyance-tns, emprunteur, prevoyance-pro, prevoyance-individuelle |
| Super Novaterm content captured | Search scraped output for "Super Novaterm" | Product name and at least 5 guarantee types appear in scraped content |
| Content is clean markdown | Read a sample file | No HTML tags, no navigation/footer text, no cookie banner text |
| Metadata is classified | Check `productType` and `tnsRelevance` fields | Every scraped page has a non-empty classification |

### V3: Chunking Quality (RAG-02)

**Test:** Run `npm run seed:chunk` and analyze output.

| Criterion | How to Validate | Pass Condition |
|-----------|----------------|----------------|
| Chunk count in expected range | Count chunks | Between 150 and 500 chunks total |
| Chunk size distribution | Compute token stats | Mean: 300-500 tokens, Max: <800 tokens, Min: >50 tokens |
| No duplicate chunks | Check for identical `content` values | Zero exact duplicates |
| Metadata enrichment | Spot-check 10 random chunks | Every chunk has non-empty `productType`, `chunkType`, and at least one `guarantee` tag |
| Guarantee coverage | Count distinct guarantees | At least 8 of the 12 identified guarantee types appear across all chunks |

### V4: Embedding & Vector Search (RAG-03)

**Test:** Run `npm run seed` (full pipeline) then execute test queries.

| Criterion | How to Validate | Pass Condition |
|-----------|----------------|----------------|
| Embeddings stored | `SELECT COUNT(*) FROM content_chunks WHERE embedding IS NOT NULL` | Count matches total chunk count |
| Vector index created | `SELECT * FROM sqlite_master WHERE name = 'chunks_embedding_idx'` | Index exists |
| Similarity search works | Query: `"kiné libéral risques arrêt de travail"` | Top 3 results contain chunks about incapacité or TNS prévoyance, not unrelated content |
| Finance domain relevance | Query: `"protection décès chef entreprise"` | Top 3 results contain chunks about capital décès or homme-clé, not funeral insurance |
| Cross-product relevance | Query: `"artisan emprunt immobilier protection"` | Results include both emprunteur AND prévoyance TNS chunks |
| Irrelevant query handling | Query: `"meilleur restaurant paris"` | All results have cosine distance > 0.5 (low similarity), no false positives |

### V5: End-to-End Pipeline

**Test:** Delete `local.db`, run `npm run seed` from scratch.

| Criterion | How to Validate | Pass Condition |
|-----------|----------------|----------------|
| Full pipeline completes | Console output | All 5 steps complete without error |
| Idempotent | Run `npm run seed` twice | Second run either skips or replaces, no duplicates |
| Execution time | Measure wall-clock time | Under 10 minutes (scraping dominates) |
| Database size | Check `local.db` file size | Under 50MB (1024-dim float32 vectors for ~400 chunks = ~1.6MB for vectors alone) |

### Validation Script

```typescript
// scripts/validate.ts
import { client } from '@/lib/db';
import { retrieveRelevantChunks } from '@/lib/rag';

const TEST_QUERIES = [
  {
    query: 'kiné libéral risques arrêt de travail',
    expectProductTypes: ['prevoyance-tns'],
    expectGuarantees: ['incapacite'],
  },
  {
    query: 'protection décès chef entreprise',
    expectProductTypes: ['prevoyance-tns', 'prevoyance-pro'],
    expectGuarantees: ['deces'],
  },
  {
    query: 'assurance prêt immobilier',
    expectProductTypes: ['emprunteur'],
    expectGuarantees: ['emprunteur'],
  },
  {
    query: 'artisan boulanger couverture invalidité',
    expectProductTypes: ['prevoyance-tns'],
    expectGuarantees: ['invalidite'],
  },
];

async function validate() {
  // Check chunk count
  const countResult = await client.execute('SELECT COUNT(*) as cnt FROM content_chunks');
  const totalChunks = countResult.rows[0].cnt as number;
  console.log(`Total chunks: ${totalChunks}`);
  console.assert(totalChunks >= 150, 'Expected at least 150 chunks');

  // Check embeddings
  const embResult = await client.execute(
    'SELECT COUNT(*) as cnt FROM content_chunks WHERE embedding IS NOT NULL'
  );
  const embeddedChunks = embResult.rows[0].cnt as number;
  console.assert(embeddedChunks === totalChunks, 'All chunks should have embeddings');

  // Test similarity queries
  for (const test of TEST_QUERIES) {
    const results = await retrieveRelevantChunks(test.query, 5);
    const topProductTypes = results.slice(0, 3).map(r => r.productType);
    const topGuarantees = results.slice(0, 3).flatMap(r => r.guarantees);

    const hasExpectedProduct = test.expectProductTypes.some(pt =>
      topProductTypes.includes(pt)
    );
    const hasExpectedGuarantee = test.expectGuarantees.some(g =>
      topGuarantees.includes(g)
    );

    console.log(`Query: "${test.query}"`);
    console.log(`  Top results: ${topProductTypes.join(', ')}`);
    console.log(`  Guarantees:  ${[...new Set(topGuarantees)].join(', ')}`);
    console.log(`  Distance:    ${results[0]?.distance.toFixed(4)}`);
    console.log(`  Product match: ${hasExpectedProduct ? 'PASS' : 'FAIL'}`);
    console.log(`  Guarantee match: ${hasExpectedGuarantee ? 'PASS' : 'FAIL'}`);
  }
}

validate().catch(console.error);
```

---

*Research completed: 2026-03-20*
*Sources: metlife.fr, design.metlife.com, docs.turso.tech, docs.voyageai.com, crawlee.dev, orm.drizzle.team, nextjs.org, tailwindcss.com, ui.shadcn.com*
