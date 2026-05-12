# metlife-sailor — Prototype d'intégration

**REF-PROTO/METLIFE-SAILOR v1.0 — 2026-04-03**

> Front MetLife "Espace Prospect TNS" rebranché sur Sailor-api comme moteur RAG.
> MetLife devient le **deuxième client** de Sailor-api (après le front Sailor existant).
> **Aucune modification** sur le projet MetLife actuel ni sur Sailor.

---

## Table des matières

1. [Contexte et objectif](#1-contexte-et-objectif)
2. [Ce qu'on ne touche pas](#2-ce-quon-ne-touche-pas)
3. [Architecture du prototype](#3-architecture-du-prototype)
4. [Ce qu'on prend du MetLife actuel](#4-ce-quon-prend-du-metlife-actuel)
5. [Ce qu'on remplace](#5-ce-quon-remplace)
6. [Sailor-api : configuration tenant MetLife](#6-sailor-api--configuration-tenant-metlife)
7. [Couche d'adaptation (Backend-for-Frontend)](#7-couche-dadaptation-backend-for-frontend)
8. [Pipeline de données MetLife → Sailor-api](#8-pipeline-de-données-metlife--sailor-api)
9. [Flux de chat détaillé](#9-flux-de-chat-détaillé)
10. [Dashboard : conservation du tool-calling Claude](#10-dashboard--conservation-du-tool-calling-claude)
11. [Structure du projet](#11-structure-du-projet)
12. [Interfaces TypeScript](#12-interfaces-typescript)
13. [Code de la couche BFF](#13-code-de-la-couche-bff)
14. [Adaptation du front](#14-adaptation-du-front)
15. [Variables d'environnement](#15-variables-denvironnement)
16. [Plan d'exécution](#16-plan-dexécution)
17. [Ce que ça prouve](#17-ce-que-ça-prouve)

---

## 1. Contexte et objectif

### Situation actuelle

```
MetLife (Next.js)                    Sailor (Express + React)
┌─────────────────────┐              ┌─────────────────────┐
│ Chat Claude          │              │ Chat Mistral         │
│ RAG Voyage + Turso   │              │ RAG Voyage + SQLite  │
│ Dashboard tool-call  │              │ Pas de dashboard     │
│ Prospect persistence │              │ Workspace isolation  │
│ Standalone           │              │ Standalone           │
└─────────────────────┘              └─────────────────────┘
        ↕ (rien)                              ↕ (rien)
```

Les deux projets font du RAG chacun de leur côté, avec leur propre stockage, embeddings, et LLM.

### Objectif du prototype

```
MetLife Front (fork)  ──────────▶  Sailor-api
┌──────────────────┐               ┌──────────────────┐
│ Chat UI           │   HTTP/SSE   │ /v1/chat/stream   │
│ Dashboard UI      │◄────────────│ /v1/retrieval     │
│ Prospect UI       │              │ /v1/documents     │
│ Branding MetLife   │              │ /v1/datasources   │
│                   │              │                   │
│ BFF (Next.js API) │──────────────│ Tenant: metlife   │
│ Tool-calling local │              │ Datasource: TNS   │
└──────────────────┘               └──────────────────┘
```

MetLife-sailor prouve que :
- Sailor-api est **consommable par un front tiers**
- Le RAG est **centralisé** (une seule base documentaire, une seule pipeline d'embedding)
- Le front garde son **identité visuelle et sa logique métier** (dashboard, prospects)
- **Plusieurs clients** peuvent coexister sur Sailor-api avec isolation tenant

---

## 2. Ce qu'on ne touche pas

| Projet | Statut | Raison |
|--------|--------|--------|
| `/clients-infinitif/METLife/` | **Intouché** | C'est la prod client, on ne risque rien |
| `/liteops/sailor/` | **Intouché** | C'est le Sailor actuel avec son front React |
| `/liteops/sailor-api/` | **Spec seulement** | On implémente le sous-ensemble nécessaire au proto |

Le prototype vit dans **`/liteops/metlife-sailor/`** — un projet autonome.

---

## 3. Architecture du prototype

### Vue d'ensemble

```
┌─────────────────────────────────────────────────────┐
│                metlife-sailor (ce projet)             │
│                                                       │
│  ┌──────────────────────────────────────────────┐    │
│  │            FRONT (Next.js 16)                 │    │
│  │                                               │    │
│  │  [ChatContainer] [Dashboard] [ProspectSpace]  │    │
│  │  [MessageBubble] [RiskCard]  [ProductCard]    │    │
│  │  [SuggestedPrompts] [TrustSignals] [Legal]    │    │
│  │                                               │    │
│  │  Identique au MetLife actuel (fork des         │    │
│  │  composants UI + branding + tool-calling)      │    │
│  └────────────────────┬─────────────────────────┘    │
│                       │                               │
│  ┌────────────────────▼─────────────────────────┐    │
│  │            BFF (Next.js API Routes)           │    │
│  │                                               │    │
│  │  POST /api/chat      → Sailor-api + Claude    │    │
│  │  POST /api/prospect  → Local SQLite/Turso     │    │
│  │  GET  /api/sources   → Sailor-api retrieval   │    │
│  │                                               │    │
│  │  Le BFF orchestre :                           │    │
│  │  1. Retrieval via Sailor-api                  │    │
│  │  2. Augmentation du prompt + tool-calling     │    │
│  │  3. Streaming via Claude (Anthropic direct)   │    │
│  │  4. Persistance prospect locale               │    │
│  └────────────────────┬─────────────────────────┘    │
│                       │                               │
└───────────────────────┼───────────────────────────────┘
                        │ HTTP
                        ▼
            ┌───────────────────────┐
            │     Sailor-api        │
            │                       │
            │  Tenant: metlife      │
            │  Datasource: tns-docs │
            │                       │
            │  Endpoints utilisés : │
            │  POST /v1/retrieval   │
            │  POST /v1/documents   │
            │  POST /v1/datasources │
            │  GET  /v1/stats       │
            └───────────────────────┘
```

### Décision clé : le LLM reste côté MetLife

**Pourquoi ne pas utiliser `/v1/chat/stream` de Sailor-api ?**

Le front MetLife a une logique métier spécifique qui dépasse le simple RAG :
- **Tool-calling Claude** pour générer le dashboard structuré (risques, produits, partenaires)
- **Schéma Zod** spécifique à MetLife (DashboardData)
- **System prompt métier** avec contraintes légales (pas de montants, disclaimer assurance)
- **Modèle Claude** (pas Mistral) — choix client

→ On utilise Sailor-api **uniquement pour le retrieval** (la partie RAG), et on garde Claude + tool-calling côté BFF.

```
                Sailor-api                    BFF MetLife
              ┌────────────┐              ┌────────────────┐
User query ──▶│ /retrieval │─ chunks ───▶│ buildPrompt()  │
              │ (embed +   │              │ + Claude API   │
              │  search)   │              │ + tool-calling │
              └────────────┘              │ + streaming    │
                                          └───────┬────────┘
                                                  │
                                          Stream SSE ──▶ Frontend
```

Cela signifie que Sailor-api fournit le **retrieval-as-a-service**, et le client (MetLife) garde le contrôle sur :
- Le choix du LLM
- Le prompt engineering
- Le post-processing (dashboard)
- La persistance prospect

C'est exactement le modèle API-first voulu.

---

## 4. Ce qu'on prend du MetLife actuel

### Composants UI (fork intégral)

| Composant | Source | Modification |
|-----------|--------|-------------|
| `ChatContainer.tsx` | Fork | Aucune |
| `MessageBubble.tsx` | Fork | Aucune |
| `MessageList.tsx` | Fork | Aucune |
| `ChatInput.tsx` | Fork | Aucune |
| `SuggestedPrompts.tsx` | Fork | Aucune |
| `ChatHeader.tsx` | Fork | Aucune |
| `StreamingText.tsx` | Fork | Aucune |
| `LoadingDots.tsx` | Fork | Aucune |
| `DashboardLayout.tsx` | Fork | Aucune |
| `RisksList` | Fork | Aucune |
| `ProductsList` | Fork | Aucune |
| `PartnersList` | Fork | Aucune |
| `ResourcesList` | Fork | Aucune |
| `AdvisorSection` | Fork | Aucune |
| `SplitPanel.tsx` | Fork | Aucune |
| `ConsentBanner.tsx` | Fork | Aucune |
| `TrustSignals.tsx` | Fork | Aucune |
| shadcn/ui (`button`, `badge`, `card`...) | Fork | Aucune |
| `globals.css` (tokens MetLife) | Fork | Aucune |

### Logique métier conservée

| Fichier | Source | Modification |
|---------|--------|-------------|
| `useChatWithDashboard.ts` | Fork | API endpoint changé (`/api/chat`) |
| `schemas.ts` (Zod dashboard) | Fork | Aucune |
| `prompts.ts` (system prompt) | Fork | RAG context injecté depuis Sailor-api |
| `types.ts` | Fork | Aucune |
| `prospect.ts` | Fork | Aucune |
| `partners.ts` (Caarl, Doado, Noctia) | Fork | Aucune |
| `demo-fallback.ts` | Fork | Aucune |

---

## 5. Ce qu'on remplace

| Existant MetLife | Remplacé par | Raison |
|-----------------|-------------|--------|
| `lib/rag.ts` (Turso vector search) | **Sailor-api `/v1/retrieval/search`** | Le RAG est centralisé dans Sailor |
| `lib/embeddings.ts` (Voyage direct) | **Sailor-api** (embedding côté serveur) | Plus d'appel Voyage depuis le front |
| `data/chunks/` (fichiers JSON) | **Sailor-api datasource** (upload docs) | Les docs sont dans Sailor-api |
| `db/schema.ts` (content_chunks) | **Supprimé** | Plus de table de chunks locale |
| `TURSO_DATABASE_URL` (pour le RAG) | **`SAILOR_API_URL` + `SAILOR_API_KEY`** | Turso reste pour les prospects uniquement |
| Turso vector index | **pgvector dans Sailor-api** | Centralisation |

### Ce qui reste local (pas dans Sailor-api)

- **Prospects** : création, persistence, codes — reste dans Turso/SQLite local
- **Dashboard snapshots** : liés au prospect — reste local
- **Conversations** : messages du chat — reste local
- **Claude API** : le LLM est appelé directement depuis le BFF
- **Tool-calling** : logique dashboard — reste dans le BFF

---

## 6. Sailor-api : configuration tenant MetLife

### Provisionnement

```bash
# 1. Créer le tenant "metlife" dans Sailor-api
POST /v1/admin/tenants
{
  "name": "MetLife France",
  "slug": "metlife",
  "plan": "pro",
  "settings": {
    "language": "fr",
    "embed_model": "voyage-3-lite",
    "chunk_size": 500,
    "chunk_overlap": 100
  }
}

# 2. Générer une API key
POST /v1/admin/tenants/metlife/api-keys
{
  "name": "metlife-sailor-proto",
  "scopes": ["read", "write"]
}
# → Retourne: sk_live_xxx... (à stocker dans SAILOR_API_KEY)

# 3. Créer la datasource "TNS docs"
POST /v1/datasources
Authorization: Bearer sk_live_xxx...
{
  "name": "Documentation TNS MetLife",
  "type": "manual"
}
# → Retourne: { "id": "ds_metlife_tns_01..." }

# 4. Uploader les documents MetLife
POST /v1/documents/upload
Authorization: Bearer sk_live_xxx...
Content-Type: multipart/form-data

datasource_id: ds_metlife_tns_01...
files: [garanties-tns.pdf, prevoyance-tns.pdf, ...]
metadata: {"category": "assurance-tns", "tags": ["metlife", "tns"]}
```

### Données à ingérer

Les données MetLife existantes sont dans `/clients-infinitif/METLife/data/` :

```
data/
├── scraped/                    # Pages scrapées de metlife.fr
│   ├── raw/                    # HTML brut
│   └── normalized/             # Texte normalisé
└── chunks/                     # Pré-découpé en JSON
    └── content_chunks.json     # ~N chunks prêts à l'emploi
```

**Script de migration des données :**

```typescript
// scripts/seed-metlife-data.ts
// Lit les chunks existants et les uploade vers Sailor-api

import { readFileSync } from 'fs'

const SAILOR_API_URL = process.env.SAILOR_API_URL!
const SAILOR_API_KEY = process.env.SAILOR_API_KEY!
const DATASOURCE_ID = process.env.SAILOR_DATASOURCE_ID!

async function seedMetLifeData() {
  // Option A : Uploader les fichiers originaux (scraped/)
  // Sailor-api les re-parse et re-chunk
  const files = glob.sync('data/scraped/normalized/*.json')

  for (const file of files) {
    const data = JSON.parse(readFileSync(file, 'utf-8'))

    // Créer un document texte à partir du contenu normalisé
    const blob = new Blob([data.content], { type: 'text/plain' })
    const formData = new FormData()
    formData.append('datasource_id', DATASOURCE_ID)
    formData.append('files', blob, `${data.slug}.txt`)
    formData.append('metadata', JSON.stringify({
      title: data.title,
      category: data.productType || 'general',
      tags: data.guarantees || [],
      source_url: data.url,
    }))

    await fetch(`${SAILOR_API_URL}/v1/documents/upload`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${SAILOR_API_KEY}` },
      body: formData,
    })
  }

  console.log(`${files.length} documents uploaded to Sailor-api`)
}

seedMetLifeData()
```

---

## 7. Couche d'adaptation (Backend-for-Frontend)

Le BFF est le cœur du prototype. Il orchestre Sailor-api (retrieval) et Claude (generation).

### Flux complet `POST /api/chat`

```
1.  Client envoie: { message: "Je suis kiné libéral, quels risques ?" }
                         │
2.  BFF extrait le texte │
                         ▼
3.  BFF appelle Sailor-api retrieval :
    POST ${SAILOR_API_URL}/v1/retrieval/search
    Authorization: Bearer ${SAILOR_API_KEY}
    {
      "query": "kiné libéral risques",
      "top_k": 8,
      "strategy": "hybrid"
    }
                         │
4.  Sailor-api retourne : │
    {                     │
      "chunks": [         │
        { content: "...", score: 0.89, metadata: { title: "..." } },
        ...               │
      ]                   │
    }                     │
                         ▼
5.  BFF construit le prompt système :
    - Rôle MetLife (conseiller digital)
    - Contraintes légales
    - RAG context (chunks formatés en <source> XML)
    - Instructions tool-calling dashboard
                         │
6.  BFF appelle Claude :  │
    streamText({          │
      model: claude-sonnet-4,
      system: systemPrompt,
      messages: [...history, { role: 'user', content: message }],
      tools: { generate_dashboard: dashboardTool }
    })                    │
                         ▼
7.  BFF streame la réponse au client :
    event: text-delta
    data: {"delta": "En tant que kiné libéral, "}

    event: text-delta
    data: {"delta": "vos principaux risques sont..."}

    event: tool-output-available
    data: {"output": { risks: [...], products: [...], ... }}

    event: [DONE]
```

### Ce que ça change vs MetLife actuel

| Étape | MetLife actuel | metlife-sailor |
|-------|---------------|----------------|
| Embedding query | Voyage AI direct (lib/embeddings.ts) | **Sailor-api** fait l'embedding |
| Vector search | Turso SQLite vector_top_k | **Sailor-api** pgvector + BM25 hybrid |
| Chunks storage | Turso local (content_chunks table) | **Sailor-api** PostgreSQL |
| Prompt building | Identique | Identique (fork) |
| LLM call | Claude via Anthropic SDK | Identique (fork) |
| Tool-calling | generate_dashboard | Identique (fork) |
| Streaming | AI SDK SSE | Identique (fork) |
| Prospect persistence | Turso local | Identique (fork) |

**Un seul changement fonctionnel** : le retrieval passe par Sailor-api au lieu d'être local.

---

## 8. Pipeline de données MetLife → Sailor-api

### Upload initial

```
Documents MetLife (scraped + PDF internes)
         │
         ▼
POST /v1/documents/upload (Sailor-api)
         │
         ▼ (async job)
Parse → Chunk → Embed → Index
         │
         ▼
Prêt pour retrieval
```

### Mise à jour future

```
Nouveau contenu metlife.fr
         │
         ▼
Scraper (existant dans MetLife/data/)
         │
         ▼
POST /v1/documents/upload (Sailor-api)
         │
         ▼
Sailor-api détecte le changement (file_hash)
  → Si nouveau : ingest
  → Si modifié : re-ingest
  → Si supprimé : soft delete
```

### V2 : Connecteur web automatique

```
POST /v1/datasources
{
  "name": "metlife.fr TNS",
  "type": "web",
  "config": {
    "base_url": "https://www.metlife.fr",
    "paths": ["/prevoyance-tns/*", "/assurance-professionnelle/*"],
    "depth": 2,
    "schedule": "0 3 * * 1"   // Chaque lundi à 3h
  }
}
```

---

## 9. Flux de chat détaillé

### Séquence complète

```
┌────────┐     ┌────────────┐     ┌────────────┐     ┌──────────┐
│ Browser │     │  BFF       │     │ Sailor-api │     │ Claude   │
│ (React) │     │  (Next.js) │     │            │     │ API      │
└───┬─────┘     └─────┬──────┘     └─────┬──────┘     └────┬─────┘
    │                  │                  │                  │
    │ POST /api/chat   │                  │                  │
    │ {message}        │                  │                  │
    │─────────────────▶│                  │                  │
    │                  │                  │                  │
    │                  │ POST /v1/retrieval/search           │
    │                  │ {query, top_k:8} │                  │
    │                  │─────────────────▶│                  │
    │                  │                  │                  │
    │                  │  {chunks: [...]} │                  │
    │                  │◀─────────────────│                  │
    │                  │                  │                  │
    │                  │ buildSystemPrompt(chunks)           │
    │                  │                  │                  │
    │                  │ streamText(claude-sonnet-4,         │
    │                  │   system, messages, tools)          │
    │                  │─────────────────────────────────────▶
    │                  │                  │                  │
    │  SSE: text-delta │                  │                  │
    │◀─────────────────│◀────────────────────────────────────│
    │  SSE: text-delta │                  │                  │
    │◀─────────────────│◀────────────────────────────────────│
    │                  │                  │                  │
    │  SSE: tool-output│                  │                  │
    │◀─────────────────│◀────────────────────────────────────│
    │                  │                  │                  │
    │  SSE: [DONE]     │                  │                  │
    │◀─────────────────│                  │                  │
    │                  │                  │                  │
    │                  │ POST /api/prospect/:id/save         │
    │                  │ (async, non-blocking)               │
    │                  │─────────▶ local DB                  │
    │                  │                  │                  │
```

### Latence estimée

| Étape | Latence | Notes |
|-------|---------|-------|
| Retrieval Sailor-api | ~100-200ms | pgvector HNSW + embedding query |
| Prompt construction | ~5ms | Local |
| Claude first token | ~500-1000ms | Dépend de la charge Anthropic |
| Claude streaming | ~2-5s total | Tool-calling inclus |
| **Total (time to first byte)** | **~600-1200ms** | |
| **Total (réponse complète)** | **~3-6s** | |

**vs MetLife actuel :** ~identique (le goulot est Claude, pas le retrieval).

---

## 10. Dashboard : conservation du tool-calling Claude

Le dashboard MetLife est généré par un **tool-call Claude** — pas par Sailor-api. C'est crucial de le conserver car :

1. Le schéma `DashboardData` est **spécifique à MetLife** (risques TNS, produits MetLife, partenaires Caarl/Doado/Noctia)
2. Le LLM doit **analyser la conversation** pour scorer les risques, pas juste retourner des chunks
3. Le tool-calling est une **feature Claude**, pas Sailor

```typescript
// Inchangé : le tool definition reste identique
const dashboardTool = tool({
  description: 'Generate personalized dashboard...',
  parameters: dashboardSchema,  // Zod: risks, products, partners, resources, profile
  execute: async (input) => input,
})
```

Le dashboard n'est pas un endpoint Sailor-api. C'est une **logique métier front** qui consomme le RAG de Sailor-api indirectement (via le contexte injecté dans le prompt Claude).

---

## 11. Structure du projet

```
metlife-sailor/
├── package.json
├── next.config.ts
├── tsconfig.json
├── .env.local.example
├── PROTOTYPE.md                     # Ce document
├── CLAUDE.md                        # Règles Claude Code
│
├── scripts/
│   └── seed-metlife-data.ts         # Upload docs MetLife → Sailor-api
│
├── src/
│   ├── app/
│   │   ├── layout.tsx               # Root layout (Inter font, MetLife tokens)
│   │   ├── globals.css              # Fork MetLife (tokens, Tailwind)
│   │   ├── page.tsx                 # Landing page
│   │   │
│   │   ├── api/
│   │   │   ├── chat/
│   │   │   │   └── route.ts         # BFF: Sailor retrieval → Claude stream
│   │   │   └── prospect/
│   │   │       ├── route.ts         # POST: create prospect
│   │   │       ├── [prospectId]/
│   │   │       │   ├── route.ts     # GET: load prospect
│   │   │       │   └── save/
│   │   │       │       └── route.ts # POST: save messages + dashboard
│   │   │       └── by-code/
│   │   │           └── [code]/
│   │   │               └── route.ts # GET: lookup by code
│   │   │
│   │   ├── chat/
│   │   │   └── page.tsx             # Full chat page
│   │   │
│   │   └── espace/
│   │       └── [prospectId]/
│   │           └── page.tsx         # Dashboard prospect
│   │
│   ├── components/
│   │   ├── chat/                    # Fork intégral de MetLife
│   │   │   ├── ChatContainer.tsx
│   │   │   ├── MessageList.tsx
│   │   │   ├── MessageBubble.tsx
│   │   │   ├── ChatInput.tsx
│   │   │   ├── ChatHeader.tsx
│   │   │   ├── SuggestedPrompts.tsx
│   │   │   ├── StreamingText.tsx
│   │   │   ├── LoadingDots.tsx
│   │   │   └── ChatErrorBanner.tsx
│   │   │
│   │   ├── dashboard/               # Fork intégral
│   │   │   ├── DashboardLayout.tsx
│   │   │   ├── RiskCard.tsx
│   │   │   ├── ProductCard.tsx
│   │   │   ├── PartnerCard.tsx
│   │   │   └── ResourceCard.tsx
│   │   │
│   │   ├── layout/                  # Fork intégral
│   │   │   ├── SplitPanel.tsx
│   │   │   └── MobileTabBar.tsx
│   │   │
│   │   ├── legal/                   # Fork intégral
│   │   │   ├── ConsentBanner.tsx
│   │   │   └── TrustSignals.tsx
│   │   │
│   │   └── ui/                      # shadcn/ui (fork)
│   │       ├── button.tsx
│   │       ├── badge.tsx
│   │       ├── card.tsx
│   │       └── ...
│   │
│   ├── hooks/
│   │   └── useChatWithDashboard.ts  # Fork (API endpoint adapté)
│   │
│   ├── lib/
│   │   ├── sailor-client.ts         # ★ NOUVEAU: Client Sailor-api
│   │   ├── prompts.ts               # Fork (RAG context via Sailor)
│   │   ├── schemas.ts               # Fork (Zod dashboard)
│   │   ├── types.ts                 # Fork
│   │   ├── prospect.ts              # Fork (persistence locale)
│   │   └── db.ts                    # Fork (Turso/SQLite pour prospects)
│   │
│   ├── db/
│   │   └── schema.ts                # ★ RÉDUIT: prospects + conversations seulement
│   │                                #   (plus de content_chunks)
│   │
│   └── config/
│       └── partners.ts              # Fork (Caarl, Doado, Noctia)
│
└── data/                            # Données MetLife à ingérer dans Sailor-api
    └── README.md                    # Instructions pour seed
```

---

## 12. Interfaces TypeScript

```typescript
// src/lib/sailor-client.ts — Client Sailor-api

export interface SailorClientConfig {
  baseUrl: string         // SAILOR_API_URL
  apiKey: string          // SAILOR_API_KEY
  timeout?: number        // default 10_000ms
}

export interface SailorRetrievalRequest {
  query: string
  top_k?: number          // default 8
  threshold?: number      // default 0.3
  strategy?: 'vector' | 'bm25' | 'hybrid'
  datasource_ids?: string[]
}

export interface SailorChunk {
  chunk_id: string
  document_id: string
  content: string
  score: number
  metadata: {
    filename: string
    title: string
    page_number?: number
    section_title?: string
    category?: string
    source_url?: string
  }
}

export interface SailorRetrievalResponse {
  chunks: SailorChunk[]
  search_metadata: {
    strategy: string
    total_results: number
    embedding_model: string
    latency_ms: number
  }
}

export interface SailorUploadResponse {
  documents: Array<{
    id: string
    filename: string
    status: string
    job_id: string
  }>
}

export interface SailorStats {
  documents: number
  chunks: number
  embedded: number
  coverage_percent: number
}
```

---

## 13. Code de la couche BFF

### Client Sailor-api

```typescript
// src/lib/sailor-client.ts

import type {
  SailorClientConfig,
  SailorRetrievalRequest,
  SailorRetrievalResponse,
  SailorStats,
} from './types'

export class SailorClient {
  private baseUrl: string
  private apiKey: string
  private timeout: number

  constructor(config: SailorClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, '')
    this.apiKey = config.apiKey
    this.timeout = config.timeout ?? 10_000
  }

  private async request<T>(path: string, options?: RequestInit): Promise<T> {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), this.timeout)

    try {
      const res = await fetch(`${this.baseUrl}${path}`, {
        ...options,
        signal: controller.signal,
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          ...options?.headers,
        },
      })

      if (!res.ok) {
        const body = await res.text().catch(() => '')
        throw new Error(`Sailor-api ${res.status}: ${body}`)
      }

      return res.json() as T
    } finally {
      clearTimeout(timer)
    }
  }

  async retrieveChunks(req: SailorRetrievalRequest): Promise<SailorRetrievalResponse> {
    return this.request<SailorRetrievalResponse>('/v1/retrieval/search', {
      method: 'POST',
      body: JSON.stringify(req),
    })
  }

  async getStats(): Promise<SailorStats> {
    return this.request<SailorStats>('/v1/stats')
  }

  async healthCheck(): Promise<{ status: string }> {
    return this.request<{ status: string }>('/v1/health')
  }
}

// Singleton
let client: SailorClient | null = null

export function getSailorClient(): SailorClient {
  if (!client) {
    const baseUrl = process.env.SAILOR_API_URL
    const apiKey = process.env.SAILOR_API_KEY
    if (!baseUrl || !apiKey) {
      throw new Error('SAILOR_API_URL and SAILOR_API_KEY must be set')
    }
    client = new SailorClient({ baseUrl, apiKey })
  }
  return client
}
```

### Route API chat (le changement principal)

```typescript
// src/app/api/chat/route.ts

import { streamText } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'
import { getSailorClient } from '@/lib/sailor-client'
import { buildSystemPrompt, formatSailorChunksAsRAG } from '@/lib/prompts'
import { dashboardTool } from '@/lib/schemas'

export const maxDuration = 300

export async function POST(req: Request) {
  const body = await req.json()

  // 1. Extraire le message utilisateur
  const messages = body.messages ?? [{ role: 'user', content: body.message }]
  const lastUserMessage = messages.findLast(
    (m: { role: string }) => m.role === 'user'
  )
  const messageText = lastUserMessage?.content ?? ''

  // 2. Retrieval via Sailor-api (remplace Turso vector search)
  let ragContext = ''
  try {
    const sailor = getSailorClient()
    const { chunks } = await sailor.retrieveChunks({
      query: messageText,
      top_k: 8,
      strategy: 'hybrid',
    })
    ragContext = formatSailorChunksAsRAG(chunks)
  } catch (error) {
    // Graceful degradation : on continue sans RAG
    console.error('Sailor-api retrieval failed:', error)
  }

  // 3. Construire le prompt système avec le contexte RAG
  const systemPrompt = buildSystemPrompt(ragContext)

  // 4. Streamer via Claude avec tool-calling
  const result = streamText({
    model: anthropic('claude-sonnet-4-20250514'),
    system: systemPrompt,
    messages,
    tools: { generate_dashboard: dashboardTool },
  })

  return result.toUIMessageStreamResponse()
}
```

### Formatage des chunks Sailor-api → RAG context

```typescript
// src/lib/prompts.ts (section modifiée)

import type { SailorChunk } from './sailor-client'

/**
 * Convertit les chunks Sailor-api en format <source> XML
 * compatible avec le prompt MetLife existant.
 */
export function formatSailorChunksAsRAG(chunks: SailorChunk[]): string {
  if (chunks.length === 0) return ''

  return chunks
    .map((chunk, i) => {
      const attrs = [
        `id="${chunk.chunk_id}"`,
        `title="${escapeXml(chunk.metadata.title)}"`,
        chunk.metadata.category ? `productType="${escapeXml(chunk.metadata.category)}"` : '',
        `relevance="${chunk.score.toFixed(2)}"`,
        chunk.metadata.source_url ? `url="${escapeXml(chunk.metadata.source_url)}"` : '',
      ].filter(Boolean).join(' ')

      return `<source index="${i + 1}" ${attrs}>\n${chunk.content}\n</source>`
    })
    .join('\n\n')
}

function escapeXml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')
}

/**
 * buildSystemPrompt — identique au MetLife actuel,
 * sauf que ragContext vient de Sailor-api au lieu de Turso.
 */
export function buildSystemPrompt(ragContext: string): string {
  return `<role>
Tu es un conseiller digital MetLife spécialisé dans la protection des Travailleurs Non-Salariés (TNS).
Tu aides les prospects à comprendre leurs risques et les solutions de prévoyance adaptées.
</role>

<constraints>
- Ne cite QUE les sources fournies dans <context>. Ne fabrique rien.
- Ne mentionne JAMAIS de montants, tarifs ou prix.
- Réponds en 3-5 phrases maximum par message.
- Utilise un ton professionnel mais accessible.
- En cas de doute, oriente vers un conseiller MetLife.
</constraints>

<context>
${ragContext || 'Aucune source disponible pour cette question.'}
</context>

<output_instructions>
TOUJOURS utiliser l'outil generate_dashboard après ta réponse textuelle.
Le dashboard doit contenir les risques identifiés, produits pertinents, et partenaires adaptés.
</output_instructions>`
}
```

---

## 14. Adaptation du front

### Modifications minimales

Le front est un **fork quasi-identique** du MetLife actuel. Les seules différences :

#### 1. `useChatWithDashboard.ts` — aucune modification

Le hook appelle `/api/chat` qui est **notre BFF**. Le contrat SSE est identique (c'est le même AI SDK). Aucun changement nécessaire.

#### 2. `db/schema.ts` — simplifié

```typescript
// src/db/schema.ts
// SUPPRIMÉ : contentChunks (plus de RAG local)
// CONSERVÉ : prospects, conversations, dashboardSnapshots

import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'

export const prospects = sqliteTable('prospects', {
  id: text('id').primaryKey(),
  code: text('code').notNull().unique(),
  consent: integer('consent').default(0),
  createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
  updatedAt: text('updated_at').default('CURRENT_TIMESTAMP'),
})

export const conversations = sqliteTable('conversations', {
  id: text('id').primaryKey(),
  prospectId: text('prospect_id').references(() => prospects.id),
  messages: text('messages').default('[]'),       // JSON
  createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
  updatedAt: text('updated_at').default('CURRENT_TIMESTAMP'),
})

export const dashboardSnapshots = sqliteTable('dashboard_snapshots', {
  id: text('id').primaryKey(),
  prospectId: text('prospect_id').references(() => prospects.id),
  dashboard: text('dashboard').default('{}'),     // JSON
  createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
})
```

#### 3. Suppression de `lib/rag.ts` et `lib/embeddings.ts`

Ces fichiers ne sont plus nécessaires — le retrieval passe par `sailor-client.ts`.

---

## 15. Variables d'environnement

```env
# .env.local.example

# ── Sailor-api (RAG centralisé) ──
SAILOR_API_URL=http://localhost:3003
SAILOR_API_KEY=sk_live_xxx...

# ── Claude (LLM direct, conservé) ──
ANTHROPIC_API_KEY=sk-ant-api03-...

# ── Prospects DB (conservé, local) ──
TURSO_DATABASE_URL=file:local.db
# ou Turso hébergé :
# TURSO_DATABASE_URL=libsql://metlife-sailor-xxx.turso.io
# TURSO_AUTH_TOKEN=eyJ...

# ── App ──
NEXT_PUBLIC_DEMO_MODE=false
```

**Ce qui disparaît vs MetLife actuel :**
- `VOYAGEAI_API_KEY` — plus besoin, Sailor-api gère les embeddings
- `TURSO_DATABASE_URL` pour le RAG — plus de vector search local

---

## 16. Plan d'exécution

### Phase 0 — Pré-requis (1 jour)

| Tâche | Détail |
|-------|--------|
| Sailor-api MVP retrieval | Implémenter au minimum : auth, tenant, upload, parse, chunk, embed, `/v1/retrieval/search` |
| Docker Compose up | PG + pgvector + Redis opérationnels |
| Créer tenant metlife | Via script ou curl |
| Seed données MetLife | `scripts/seed-metlife-data.ts` — upload docs existants |

### Phase 1 — Fork + rewire (2 jours)

| Tâche | Détail |
|-------|--------|
| Init projet Next.js | `create-next-app` + copie des deps du MetLife actuel |
| Fork composants UI | Copier tous les composants chat + dashboard + layout + legal + ui |
| Fork hooks + lib | Copier `useChatWithDashboard`, `schemas`, `types`, `prospect`, `partners` |
| Fork styles | Copier `globals.css` avec tokens MetLife |
| Fork pages | Copier `page.tsx`, `chat/page.tsx`, `espace/[prospectId]/page.tsx` |
| Supprimer RAG local | Supprimer `lib/rag.ts`, `lib/embeddings.ts`, `content_chunks` du schema |
| Créer `sailor-client.ts` | Client HTTP Sailor-api |
| Adapter `api/chat/route.ts` | Retrieval via SailorClient au lieu de Turso vector |
| Adapter `lib/prompts.ts` | `formatSailorChunksAsRAG()` |
| Simplifier `db/schema.ts` | Garder prospects + conversations, supprimer chunks |

### Phase 2 — Test end-to-end (1 jour)

| Tâche | Détail |
|-------|--------|
| Test chat flow complet | Message → Sailor retrieval → Claude → dashboard |
| Test graceful degradation | Sailor down → chat sans RAG |
| Test prospect persistence | Création, code, reload, save |
| Test dashboard | Tool-calling → dashboard rendering |
| Comparer qualité RAG | Mêmes questions, comparer réponses Turso vs Sailor-api |

### Phase 3 — Polish (1 jour)

| Tâche | Détail |
|-------|--------|
| Demo mode | Vérifier que le fallback demo fonctionne toujours |
| Error handling | Messages d'erreur si Sailor-api down |
| Logging | Log retrieval latency, chunk count, scores |
| README | Instructions de setup |

**Total : ~5 jours** (dont 1 jour pour le subset de Sailor-api).

---

## 17. Ce que ça prouve

### Pour le produit Sailor-api

| Validation | Détail |
|-----------|--------|
| **API-first fonctionne** | Un front Next.js externe consomme Sailor-api sans couplage |
| **Multi-tenant** | MetLife et Sailor coexistent, données isolées |
| **Retrieval-as-a-service** | Le client choisit son LLM (Claude vs Mistral) |
| **Qualité RAG** | pgvector + hybrid search vs Turso vector : comparable ou meilleur |
| **Latence acceptable** | Le hop HTTP vers Sailor-api ajoute ~50-100ms, négligeable vs Claude |

### Pour le business

| Validation | Détail |
|-----------|--------|
| **Intégration rapide** | 5 jours pour brancher un front existant sur Sailor-api |
| **Identité préservée** | Le front MetLife ne change pas visuellement |
| **Logique métier préservée** | Dashboard, prospects, tool-calling — tout reste côté client |
| **Coût réduit** | Plus de Voyage AI direct, plus de Turso pour le RAG — tout passe par Sailor-api |
| **Évolutivité** | Demain, MetLife ajoute des docs → upload dans Sailor-api, c'est prêt |

### Ce que ça ne prouve pas encore (V2)

- Sync incrémentale automatique (connecteur web metlife.fr)
- ACL documentaire (restreindre certains docs à certains prospects)
- Analytics d'usage (quelles questions, quels docs utilisés)
- Multi-langue
- Scaling à N clients simultanés
