# Phase 5: Persistence & Legal Compliance - Research

**Researched:** 2026-03-20
**Domain:** Database persistence (SQLite/Turso), RGPD compliance, Next.js 16 dynamic routes
**Confidence:** HIGH

## Summary

Phase 5 adds two distinct capabilities: (1) prospect session persistence via UUID-based spaces stored in SQLite/Turso, and (2) legal/trust UI elements (RGPD consent banner, disclaimer, trust signals). The persistence layer requires new database tables for prospects, conversations, and dashboard snapshots, plus a new dynamic route `/dashboard/[prospectId]`. The legal layer is purely UI -- no backend complexity.

The project already uses `@libsql/client` with raw SQL for vector operations and Drizzle ORM for schema definition. New tables should follow the same pattern: define in Drizzle schema, use raw SQL via `client.execute()` for operations. UUID generation uses `crypto.randomUUID()` (already used in `useChatWithDashboard` for message IDs).

**Primary recommendation:** Add `prospects`, `conversations`, and `dashboard_snapshots` tables to the existing Drizzle schema. Create `/dashboard/[prospectId]/page.tsx` as a client component that fetches persisted data via a new API route. RGPD consent uses localStorage with a blocking overlay. No new dependencies needed.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| PERS-01 | Chaque prospect recoit un UUID unique a la creation de son espace | UUID via `crypto.randomUUID()`, stored in `prospects` table with creation timestamp |
| PERS-02 | Le prospect peut revenir sur son espace via une URL dediee (/dashboard/[prospectId]) | Next.js 16 dynamic route with `params: Promise<{ prospectId: string }>`, client component with `use()` |
| PERS-03 | L'historique de conversation et le dashboard sont sauvegardes en base | `conversations` table for messages JSON, `dashboard_snapshots` table for dashboard data |
| CONF-02 | Un bandeau de consentement RGPD est affiche avant la premiere interaction | Client-side consent banner component, localStorage persistence, blocking overlay pattern |
| CONF-03 | Un disclaimer precise que les recommandations sont indicatives | Static disclaimer component in dashboard and chat views |
| CONF-04 | Des signaux de confiance sont visibles (ACPR, solidite financiere, nombre d'assures) | Trust signals component with MetLife regulatory data |
</phase_requirements>

## Standard Stack

### Core (Already Installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @libsql/client | 0.17.2 | SQLite/Turso database client | Already used for RAG, raw SQL for all DB ops |
| drizzle-orm | 0.45.1 | Schema definition and type safety | Already used for content_chunks schema |
| drizzle-kit | 0.31.10 | Schema push/migration | Already installed, use `drizzle-kit push` for schema changes |
| next | 16.2.0 | Dynamic routes, API routes | Already the framework |
| zod | 4.3.6 | Schema validation | Already used for dashboard schemas |

### Supporting (Already Installed)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| lucide-react | 0.577.0 | Icons for trust signals, consent banner | Shield, CheckCircle, Info icons |
| motion | 12.38.0 | Consent banner slide animation | Banner entrance/exit |
| shadcn/ui (base-ui) | 4.1.0 | Button, Dialog components | Consent accept button |

### No New Dependencies Needed
| Problem | Why No New Package |
|---------|-------------------|
| UUID generation | `crypto.randomUUID()` is built into Web Crypto API, already used in codebase |
| Cookie consent | Simple localStorage check + blocking overlay, no cookie-consent library needed |
| Date formatting | Intl.DateTimeFormat for French locale, built-in |

## Architecture Patterns

### New Database Tables

```sql
-- Prospects: core entity with UUID
CREATE TABLE prospects (
  id TEXT PRIMARY KEY,           -- crypto.randomUUID()
  created_at INTEGER NOT NULL,   -- Unix timestamp
  updated_at INTEGER NOT NULL,   -- Unix timestamp
  consent_given INTEGER NOT NULL DEFAULT 0,  -- RGPD consent flag
  consent_at INTEGER             -- When consent was given
);

-- Conversations: message history per prospect
CREATE TABLE conversations (
  id TEXT PRIMARY KEY,
  prospect_id TEXT NOT NULL REFERENCES prospects(id),
  messages TEXT NOT NULL,         -- JSON array of ChatMessage[]
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Dashboard Snapshots: persisted dashboard data
CREATE TABLE dashboard_snapshots (
  id TEXT PRIMARY KEY,
  prospect_id TEXT NOT NULL REFERENCES prospects(id),
  data TEXT NOT NULL,             -- JSON of DashboardData
  created_at INTEGER NOT NULL
);
```

### Drizzle Schema Pattern (Match Existing Style)

```typescript
// In src/db/schema.ts - extend existing file
export const prospects = sqliteTable('prospects', {
  id: text('id').primaryKey(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  consentGiven: integer('consent_given').notNull().default(0),
  consentAt: integer('consent_at', { mode: 'timestamp' }),
});

export const conversations = sqliteTable('conversations', {
  id: text('id').primaryKey(),
  prospectId: text('prospect_id').notNull().references(() => prospects.id),
  messages: text('messages', { mode: 'json' }).notNull().$type<ChatMessage[]>(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

export const dashboardSnapshots = sqliteTable('dashboard_snapshots', {
  id: text('id').primaryKey(),
  prospectId: text('prospect_id').notNull().references(() => prospects.id),
  data: text('data', { mode: 'json' }).notNull().$type<DashboardData>(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});
```

### Recommended File Structure (New Files)

```
src/
├── app/
│   ├── api/
│   │   ├── chat/route.ts              # Existing - modify to accept prospectId
│   │   └── prospect/
│   │       ├── route.ts               # POST: create prospect, returns UUID
│   │       └── [prospectId]/
│   │           └── route.ts           # GET: fetch prospect data (conversation + dashboard)
│   ├── dashboard/
│   │   └── [prospectId]/
│   │       └── page.tsx               # Dynamic route - load persisted prospect space
│   └── page.tsx                       # Existing - modify to create prospect on first interaction
├── components/
│   ├── legal/
│   │   ├── ConsentBanner.tsx          # RGPD consent banner (blocking overlay)
│   │   ├── Disclaimer.tsx             # Insurance advice disclaimer
│   │   └── TrustSignals.tsx           # ACPR, financial solidity, insured count
│   └── ...existing...
├── db/
│   └── schema.ts                      # Extend with prospects, conversations, dashboard_snapshots
└── lib/
    └── prospect.ts                    # Prospect CRUD operations (create, save, load)
```

### Pattern 1: Next.js 16 Dynamic Route with Client Component

**What:** `/dashboard/[prospectId]` page that loads persisted prospect data
**When to use:** When the prospect returns via their saved URL
**CRITICAL:** In Next.js 16, `params` is a Promise -- use `use()` in client components.

```typescript
// src/app/dashboard/[prospectId]/page.tsx
'use client'
import { use, useEffect, useState } from 'react'
import type { DashboardData, ChatMessage } from '@/lib/types'

export default function ProspectDashboardPage({
  params,
}: {
  params: Promise<{ prospectId: string }>
}) {
  const { prospectId } = use(params)
  const [data, setData] = useState<{ messages: ChatMessage[]; dashboard: DashboardData } | null>(null)

  useEffect(() => {
    fetch(`/api/prospect/${prospectId}`)
      .then(res => res.json())
      .then(setData)
  }, [prospectId])

  // Render with existing SplitPanel + AnimatedDashboardLayout components
}
```

### Pattern 2: Prospect Creation on First Message

**What:** Create prospect record when user sends first message, redirect to `/dashboard/[id]`
**When to use:** First interaction flow

```typescript
// In useChatWithDashboard or page.tsx sendMessage handler:
// 1. POST /api/prospect → { id: "uuid" }
// 2. Store prospectId in hook state
// 3. Include prospectId in subsequent /api/chat calls
// 4. After dashboard generation, save snapshot
// 5. Show shareable URL to user
```

### Pattern 3: RGPD Consent Banner (Blocking)

**What:** Full-screen overlay that blocks interaction until consent is given
**When to use:** Before any data processing (first page load)

```typescript
// ConsentBanner.tsx - blocking overlay pattern
'use client'
import { useState, useEffect } from 'react'

export function ConsentBanner({ children }: { children: React.ReactNode }) {
  const [consented, setConsented] = useState<boolean | null>(null)

  useEffect(() => {
    setConsented(localStorage.getItem('rgpd-consent') === 'true')
  }, [])

  if (consented === null) return null // SSR/hydration guard
  if (consented) return <>{children}</>

  return (
    <>
      {/* Dimmed background with non-interactive app */}
      <div className="pointer-events-none opacity-50">{children}</div>
      {/* Consent overlay */}
      <div className="fixed inset-0 z-50 flex items-end justify-center p-4">
        {/* Banner content */}
      </div>
    </>
  )
}
```

### Pattern 4: Save Conversation & Dashboard on Generation

**What:** Persist data server-side when dashboard is generated
**When to use:** In the API chat route, after tool result

```typescript
// In /api/chat/route.ts or a separate save endpoint:
// After streamText completes and dashboard tool is called:
async function saveProspectData(prospectId: string, messages: ChatMessage[], dashboard: DashboardData) {
  await client.execute({
    sql: `INSERT OR REPLACE INTO conversations (id, prospect_id, messages, created_at, updated_at)
          VALUES (?, ?, ?, unixepoch(), unixepoch())`,
    args: [crypto.randomUUID(), prospectId, JSON.stringify(messages)],
  });
  await client.execute({
    sql: `INSERT INTO dashboard_snapshots (id, prospect_id, data, created_at)
          VALUES (?, ?, ?, unixepoch())`,
    args: [crypto.randomUUID(), prospectId, JSON.stringify(dashboard)],
  });
}
```

### Anti-Patterns to Avoid
- **Do NOT use cookies for prospect identification:** Cookies expire and are device-specific. UUID in URL is the right approach for a prototype -- prospects share/bookmark their URL.
- **Do NOT build a full auth system:** This is a prototype pitch. UUID-based URLs provide "good enough" access control. Security hardening is Phase 6/v2.
- **Do NOT use Drizzle ORM query builder for inserts:** The project established raw SQL via `client.execute()` as the pattern (Phase 1 decision). Stay consistent.
- **Do NOT block on consent for the /dashboard/[id] route:** Consent was already given during initial interaction. Only block on the main `/` page.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| UUID generation | Custom ID scheme | `crypto.randomUUID()` | RFC 4122 v4, already used in codebase, zero dependencies |
| RGPD consent persistence | Cookie-based consent | `localStorage` + server flag | Simpler for prototype, no cookie banner library needed |
| JSON serialization for DB | Custom serializer | `JSON.stringify/parse` with Zod validation on read | Drizzle `{ mode: 'json' }` handles this |
| Table creation | Manual SQL migrations | `npx drizzle-kit push` | Auto-syncs Drizzle schema to SQLite, already configured |

**Key insight:** This phase adds persistence to an existing working prototype. The complexity is in wiring, not in any single component. Keep each piece minimal.

## Common Pitfalls

### Pitfall 1: Next.js 16 params is a Promise
**What goes wrong:** Using `params.prospectId` directly without `await` or `use()` -- gets `undefined` or `[object Promise]`
**Why it happens:** Next.js 15+ changed params to async. Training data may suggest synchronous access.
**How to avoid:** Always use `const { prospectId } = await params` (server) or `const { prospectId } = use(params)` (client)
**Warning signs:** `undefined` prospectId, `[object Promise]` in URLs

### Pitfall 2: Hydration Mismatch with localStorage
**What goes wrong:** ConsentBanner renders differently on server vs client because localStorage is client-only
**Why it happens:** SSR renders without localStorage, client hydration reads it
**How to avoid:** Initialize consent state as `null`, render nothing until client-side check completes (`useEffect`)
**Warning signs:** React hydration warnings in console

### Pitfall 3: Race Condition Between Prospect Creation and Chat
**What goes wrong:** Chat message sent before prospect record is created in DB
**Why it happens:** Prospect creation is async, user message fires immediately
**How to avoid:** Create prospect synchronously before first message send. Await the POST /api/prospect response before calling /api/chat.
**Warning signs:** Foreign key constraint errors, orphaned messages

### Pitfall 4: Drizzle Schema vs Raw SQL Mismatch
**What goes wrong:** Schema defined in Drizzle but queries use raw SQL with different column names
**Why it happens:** Drizzle uses camelCase in TypeScript but snake_case in SQL. When using raw SQL, you must use SQL column names.
**How to avoid:** Always reference the SQL column names (snake_case) in `client.execute()` queries, not the Drizzle TypeScript property names
**Warning signs:** "no such column" errors

### Pitfall 5: RGPD Consent Must Block Before ANY Data Processing
**What goes wrong:** Chat API receives user data before consent is recorded
**Why it happens:** Consent check is client-side only, API has no guard
**How to avoid:** ConsentBanner wraps the entire app and prevents interaction. Optionally verify consent server-side via prospect record's `consent_given` flag.
**Warning signs:** Data processing without consent = RGPD violation

### Pitfall 6: JSON Column Size with Message History
**What goes wrong:** Conversation JSON grows unbounded as users chat
**Why it happens:** Storing all messages as a single JSON blob
**How to avoid:** For a prototype, this is acceptable (conversations are short, 5-10 messages). For production, normalize to a messages table. Set a soft limit of 50 messages.
**Warning signs:** Slow queries, large row sizes

## Code Examples

### Creating Prospect Record (Raw SQL Pattern)

```typescript
// src/lib/prospect.ts
import { client } from './db';

export async function createProspect(): Promise<string> {
  const id = crypto.randomUUID();
  await client.execute({
    sql: `INSERT INTO prospects (id, created_at, updated_at, consent_given, consent_at)
          VALUES (?, unixepoch(), unixepoch(), 1, unixepoch())`,
    args: [id],
  });
  return id;
}

export async function loadProspect(prospectId: string) {
  const prospect = await client.execute({
    sql: `SELECT id, created_at, updated_at FROM prospects WHERE id = ?`,
    args: [prospectId],
  });
  if (prospect.rows.length === 0) return null;

  const conversation = await client.execute({
    sql: `SELECT messages FROM conversations WHERE prospect_id = ? ORDER BY updated_at DESC LIMIT 1`,
    args: [prospectId],
  });

  const dashboard = await client.execute({
    sql: `SELECT data FROM dashboard_snapshots WHERE prospect_id = ? ORDER BY created_at DESC LIMIT 1`,
    args: [prospectId],
  });

  return {
    id: prospect.rows[0].id as string,
    messages: conversation.rows.length > 0
      ? JSON.parse(conversation.rows[0].messages as string)
      : [],
    dashboard: dashboard.rows.length > 0
      ? JSON.parse(dashboard.rows[0].data as string)
      : null,
  };
}
```

### API Route for Prospect Data

```typescript
// src/app/api/prospect/[prospectId]/route.ts
import { client } from '@/lib/db';
import { loadProspect } from '@/lib/prospect';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ prospectId: string }> }
) {
  const { prospectId } = await params;

  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(prospectId)) {
    return Response.json({ error: 'Invalid prospect ID' }, { status: 400 });
  }

  const data = loadProspect(prospectId);
  if (!data) {
    return Response.json({ error: 'Prospect not found' }, { status: 404 });
  }

  return Response.json(data);
}
```

### RGPD Consent Banner

```typescript
// src/components/legal/ConsentBanner.tsx
'use client'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Shield } from 'lucide-react'

const CONSENT_KEY = 'metlife-rgpd-consent'

export function useConsent() {
  const [consented, setConsented] = useState<boolean | null>(null)

  useEffect(() => {
    setConsented(localStorage.getItem(CONSENT_KEY) === 'true')
  }, [])

  const acceptConsent = () => {
    localStorage.setItem(CONSENT_KEY, 'true')
    setConsented(true)
  }

  return { consented, acceptConsent }
}
```

### Trust Signals Data (Static)

```typescript
// MetLife France regulatory information
const TRUST_SIGNALS = {
  regulation: {
    label: 'Regulee par l\'ACPR',
    detail: 'Autorite de Controle Prudentiel et de Resolution',
    icon: 'Shield',
  },
  solidity: {
    label: 'Solidite financiere',
    detail: 'Notation A1 (Moody\'s) - Groupe MetLife, Inc.',
    icon: 'TrendingUp',
  },
  insured: {
    label: 'Confiance',
    detail: 'Plus de 100 millions d\'assures dans le monde',
    icon: 'Users',
  },
} as const;
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `params` synchronous access | `params` is `Promise` -- use `await`/`use()` | Next.js 15+ | All dynamic routes must use async params |
| Custom PageProps typing | `PageProps<'/route'>` global helper | Next.js 16 | Type-safe params from route literals |
| `RouteContext` import | `RouteContext<'/route'>` globally available | Next.js 16 | No import needed for route handler typing |
| Drizzle `db.insert()` | Raw SQL `client.execute()` | Project decision (Phase 1) | Consistent with existing codebase pattern |

## Open Questions

1. **Prospect lifecycle / cleanup**
   - What we know: Prospects get UUIDs and persist indefinitely in SQLite
   - What's unclear: Should old prospects be cleaned up? TTL?
   - Recommendation: For prototype, no cleanup. Add `expires_at` column if needed later.

2. **Saving conversation mid-stream vs on completion**
   - What we know: Dashboard data is generated at end of conversation
   - What's unclear: Should we save after every message or only when dashboard is generated?
   - Recommendation: Save once when dashboard is generated (simpler, matches the "prospect space" concept). The prospect URL is only meaningful once there's a dashboard to show.

3. **Multiple conversations per prospect**
   - What we know: Schema supports multiple conversations per prospect
   - What's unclear: Can a returning prospect start a new conversation?
   - Recommendation: For prototype, one conversation per prospect (latest wins). The return flow shows the saved state, not a new chat.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.0 |
| Config file | `/vitest.config.ts` |
| Quick run command | `npm test` |
| Full suite command | `npm run test:coverage` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PERS-01 | Prospect UUID creation and storage | unit | `npx vitest run tests/prospect.test.ts -t "create"` | No -- Wave 0 |
| PERS-02 | Load prospect by UUID returns data | unit | `npx vitest run tests/prospect.test.ts -t "load"` | No -- Wave 0 |
| PERS-03 | Conversation and dashboard persistence | unit | `npx vitest run tests/prospect.test.ts -t "save"` | No -- Wave 0 |
| CONF-02 | Consent banner blocks interaction | unit | `npx vitest run tests/consent-banner.test.tsx -t "blocks"` | No -- Wave 0 |
| CONF-03 | Disclaimer text renders | unit | `npx vitest run tests/disclaimer.test.tsx -t "renders"` | No -- Wave 0 |
| CONF-04 | Trust signals display ACPR, solidity, insured count | unit | `npx vitest run tests/trust-signals.test.tsx -t "displays"` | No -- Wave 0 |

### Sampling Rate
- **Per task commit:** `npm test`
- **Per wave merge:** `npm run test:coverage`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `tests/prospect.test.ts` -- covers PERS-01, PERS-02, PERS-03 (prospect CRUD with mocked libsql client)
- [ ] `tests/consent-banner.test.tsx` -- covers CONF-02 (localStorage mock, render blocking)
- [ ] `tests/disclaimer.test.tsx` -- covers CONF-03
- [ ] `tests/trust-signals.test.tsx` -- covers CONF-04

## Sources

### Primary (HIGH confidence)
- Next.js 16.2.0 local docs (`node_modules/next/dist/docs/`) -- dynamic routes, page.tsx, route.ts conventions
- Project codebase -- existing schema, DB patterns, hook structure, API route format
- Drizzle ORM 0.45.1 -- schema definition patterns (from existing `src/db/schema.ts`)

### Secondary (MEDIUM confidence)
- `@libsql/client` 0.17.2 -- raw SQL execution pattern (verified from project's embed.ts and rag.ts)
- RGPD consent requirements -- standard practice for French web applications

### Tertiary (LOW confidence)
- MetLife trust signal data (ACPR regulation, Moody's rating) -- should be verified against MetLife France public communications

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all libraries already installed and used in project
- Architecture: HIGH -- follows established project patterns (raw SQL, Drizzle schema, App Router)
- Dynamic routes: HIGH -- verified from Next.js 16 local docs (params is Promise)
- Pitfalls: HIGH -- derived from Next.js 16 docs and project-specific decisions
- Legal content: MEDIUM -- RGPD banner pattern is standard, but MetLife-specific trust data needs verification

**Research date:** 2026-03-20
**Valid until:** 2026-04-20 (stable domain, no fast-moving dependencies)
