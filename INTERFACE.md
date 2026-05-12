# metlife-sailor — Interface Contract with Sailor-api

**REF-SPEC/METLIFE-SAILOR-INTERFACE v1.0 — 2026-04-03**

> Contrat d'interface précis entre le BFF `metlife-sailor` et le moteur RAG `sailor-api`.
> Document destiné aux développeurs implémentant les deux côtés.
> Aucune ambiguité tolérée : tous les payloads, headers, et types sont spécifiés exactement.

---

## Table des matières

1. [Overview diagram](#1-overview-diagram)
2. [Authentication contract](#2-authentication-contract)
3. [Endpoint contracts](#3-endpoint-contracts)
4. [Data mapping](#4-data-mapping)
5. [Sequence diagrams](#5-sequence-diagrams)
6. [Error handling contract](#6-error-handling-contract)
7. [TypeScript interfaces](#7-typescript-interfaces)
8. [Configuration contract](#8-configuration-contract)
9. [Testing contract](#9-testing-contract)

---

## 1. Overview diagram

### Architecture des appels HTTP

```
metlife-sailor (Next.js)              sailor-api (Fastify)
┌────────────────────────┐            ┌────────────────────────────┐
│                        │            │  Tenant: metlife            │
│  Browser (React)       │            │  Datasource: tns-docs       │
│       │                │            │                             │
│       │ POST /api/chat │            │                             │
│       ▼                │            │                             │
│  BFF (Next.js API)     │            │                             │
│       │                │            │                             │
│       ├─────────────────────────────▶ POST /v1/retrieval/search  │ ← [1] critique
│       │                │            │         │                   │
│       │◀─────────────────────────────  {chunks[]}                 │
│       │                │            │                             │
│       │ (build prompt) │            │                             │
│       │                │            │                             │
│       ├────────────────────────────────────────────────────────   │
│       │  streamText() via Anthropic (externe, pas Sailor-api)     │
│       │                │            │                             │
│  Scripts (seed)        │            │                             │
│       ├─────────────────────────────▶ POST /v1/datasources        │ ← [2] setup
│       ├─────────────────────────────▶ POST /v1/documents/upload   │ ← [3] seed
│       ├─────────────────────────────▶ GET  /v1/jobs/:id           │ ← [4] polling
│       │                │            │                             │
│  Monitoring            │            │                             │
│       ├─────────────────────────────▶ GET  /v1/health             │ ← [5] health
│       ├─────────────────────────────▶ GET  /v1/stats              │ ← [6] metrics
└────────────────────────┘            └────────────────────────────┘
```

### Fréquence et criticité des appels

| Appel | Fréquence | Criticité | Timeout recommandé |
|-------|-----------|-----------|-------------------|
| `POST /v1/retrieval/search` | 1x par message utilisateur | CRITIQUE — bloque le chat | 10 000 ms |
| `GET /v1/health` | Toutes les 30s (monitoring) | Faible | 3 000 ms |
| `GET /v1/stats` | A la demande | Faible | 5 000 ms |
| `GET /v1/jobs/:id` | Polling toutes les 2s (seed) | Moyen | 5 000 ms |
| `POST /v1/documents/upload` | Opération de setup uniquement | Moyen | 60 000 ms |
| `POST /v1/datasources` | Opération de setup uniquement | Moyen | 10 000 ms |

### Ce que metlife-sailor N'utilise PAS

Sailor-api expose également `/v1/chat/completions` et `/v1/chat/stream`. Ces endpoints ne sont **pas utilisés** par metlife-sailor. Le LLM (Claude) est appelé directement depuis le BFF. Sailor-api est utilisé **uniquement comme retrieval-as-a-service**.

---

## 2. Authentication contract

### Mécanisme

Toutes les requêtes (sauf `GET /v1/health`) portent une API key dans le header `Authorization`.

```
Authorization: Bearer sk_live_<base64url-secret>
```

Le format complet de la clé :

```
sk_live_<43-chars-base64url>

Exemple : sk_live_<your-secret-here>
          ^^^^^^^  ^^^^^^^^^^^^^^^^^^
          préfixe  secret (32 bytes random, base64url encoded)
```

Sailor-api stocke uniquement `SHA-256(key)` en base. La clé complète est fournie **une seule fois** à la création et n'est jamais retournée à nouveau.

### Headers requis sur chaque requête

```http
Authorization: Bearer sk_live_xxx...
Content-Type: application/json
X-Request-ID: <uuid-v4>              (optionnel, mais recommandé pour le debug)
```

### Scopes nécessaires pour metlife-sailor

| Scope | Pourquoi |
|-------|----------|
| `read` | `GET /v1/health`, `GET /v1/stats`, `GET /v1/jobs/:id`, `POST /v1/retrieval/search` |
| `write` | `POST /v1/datasources`, `POST /v1/documents/upload` |

La clé de production du prototype doit avoir les scopes `["read", "write"]`. Le scope `admin` n'est pas nécessaire.

### Réponses d'erreur d'auth

**401 Unauthorized** — clé absente, malformée, ou inconnue :

```json
{
  "error": "UNAUTHORIZED",
  "message": "Missing or invalid API key",
  "request_id": "req_01HQ..."
}
```

**403 Forbidden** — clé valide mais scope insuffisant :

```json
{
  "error": "FORBIDDEN",
  "message": "This operation requires scope: write",
  "required_scope": "write",
  "request_id": "req_01HQ..."
}
```

**401 Unauthorized** — clé expirée :

```json
{
  "error": "UNAUTHORIZED",
  "message": "API key expired",
  "expired_at": "2026-01-01T00:00:00Z",
  "request_id": "req_01HQ..."
}
```

---

## 3. Endpoint contracts

### Base URL

```
Development : http://localhost:3003
Production  : https://api.sailor.liteops.fr
```

La variable d'environnement `SAILOR_API_URL` ne doit **pas** contenir de slash final.

---

### 3.1 POST /v1/retrieval/search

L'appel le plus critique. Appelé à chaque message utilisateur depuis `src/app/api/chat/route.ts`.

**Request headers :**

```http
POST /v1/retrieval/search HTTP/1.1
Authorization: Bearer sk_live_xxx...
Content-Type: application/json
X-Request-ID: <uuid>
```

**Request body :**

```json
{
  "query": "Je suis kiné libéral, quels risques pour ma retraite ?",
  "top_k": 8,
  "threshold": 0.3,
  "strategy": "hybrid",
  "datasource_ids": ["ds_metlife_tns_01HQ..."]
}
```

TypeScript types (côté metlife-sailor) :

```typescript
interface RetrievalSearchRequest {
  query: string                              // Texte exact du message utilisateur
  top_k?: number                             // default: 8 — nombre de chunks retournés
  threshold?: number                         // default: 0.3 — score minimum (0-1)
  strategy?: 'vector' | 'bm25' | 'hybrid'  // default: 'hybrid'
  datasource_ids?: string[]                  // Filtrer sur la datasource MetLife uniquement
  metadata_filter?: Record<string, unknown>  // Non utilisé par metlife-sailor v1
}
```

**Response 200 :**

```json
{
  "results": [
    {
      "chunk_id": "chk_01HQ3K...",
      "document_id": "doc_01HQ3K...",
      "content": "Le risque d'invalidité pour un kiné libéral est couvert dès 66% d'incapacité...",
      "score": 0.91,
      "metadata": {
        "filename": "prevoyance-tns.txt",
        "title": "Prévoyance TNS MetLife",
        "page_number": 3,
        "section_title": "Invalidité et incapacité",
        "category": "assurance-tns",
        "source_url": "https://www.metlife.fr/prevoyance-tns/invalidite"
      }
    },
    {
      "chunk_id": "chk_01HQ3L...",
      "document_id": "doc_01HQ3L...",
      "content": "La retraite des TNS est constituée d'une retraite de base via la CIPAV...",
      "score": 0.84,
      "metadata": {
        "filename": "garanties-tns.txt",
        "title": "Garanties TNS",
        "page_number": null,
        "section_title": null,
        "category": "assurance-tns",
        "source_url": "https://www.metlife.fr/garanties-tns"
      }
    }
  ],
  "search_metadata": {
    "strategy": "hybrid",
    "total_results": 8,
    "embedding_model": "voyage-3",
    "latency_ms": 142
  }
}
```

TypeScript types (côté metlife-sailor) :

```typescript
interface RetrievalSearchResponse {
  results: SailorChunk[]
  search_metadata: {
    strategy: string
    total_results: number
    embedding_model: string
    latency_ms: number
  }
}

interface SailorChunk {
  chunk_id: string
  document_id: string
  content: string
  score: number           // 0.0 – 1.0, cosine similarity ou RRF score
  metadata: {
    filename: string
    title: string
    page_number: number | null
    section_title: string | null
    category?: string
    source_url?: string
  }
}
```

**Erreurs possibles :**

| Status | Code | Cause |
|--------|------|-------|
| 400 | `VALIDATION_ERROR` | `query` vide ou `top_k` < 1 |
| 401 | `UNAUTHORIZED` | Clé absente ou invalide |
| 403 | `FORBIDDEN` | Scope `read` manquant |
| 404 | `DATASOURCE_NOT_FOUND` | `datasource_ids` contient un ID inconnu |
| 429 | `RATE_LIMITED` | Quota journalier dépassé (plan Pro : 10 000/jour) |
| 503 | `SERVICE_UNAVAILABLE` | pgvector ou Redis indisponible |

**Exemple curl :**

```bash
curl -X POST https://api.sailor.liteops.fr/v1/retrieval/search \
  -H "Authorization: Bearer sk_live_xxx..." \
  -H "Content-Type: application/json" \
  -H "X-Request-ID: $(uuidgen)" \
  -d '{
    "query": "kiné libéral risques invalidité retraite",
    "top_k": 8,
    "threshold": 0.3,
    "strategy": "hybrid",
    "datasource_ids": ["ds_metlife_tns_01HQ..."]
  }'
```

---

### 3.2 POST /v1/documents/upload

Upload des documents MetLife vers Sailor-api pour ingestion. Utilisé par `scripts/seed-metlife-data.ts` uniquement — pas par le BFF en runtime.

**Request headers :**

```http
POST /v1/documents/upload HTTP/1.1
Authorization: Bearer sk_live_xxx...
Content-Type: multipart/form-data; boundary=----FormBoundary
```

**Request body (multipart/form-data) :**

```
------FormBoundary
Content-Disposition: form-data; name="datasource_id"

ds_metlife_tns_01HQ...
------FormBoundary
Content-Disposition: form-data; name="files"; filename="prevoyance-tns.txt"
Content-Type: text/plain

[contenu binaire ou texte du fichier]
------FormBoundary
Content-Disposition: form-data; name="files"; filename="garanties-tns.txt"
Content-Type: text/plain

[contenu binaire ou texte du fichier]
------FormBoundary
Content-Disposition: form-data; name="metadata"
Content-Type: application/json

{"category": "assurance-tns", "tags": ["metlife", "tns"], "source_url": "https://www.metlife.fr/prevoyance-tns"}
------FormBoundary--
```

Types des champs :

```typescript
// Champs multipart attendus
interface UploadFormFields {
  datasource_id: string              // ID de la datasource MetLife (obligatoire)
  files: File | File[]               // Un ou plusieurs fichiers (obligatoire)
  metadata?: string                  // JSON stringifié (optionnel)
}

interface UploadMetadata {
  category?: string
  tags?: string[]
  source_url?: string
  title?: string
  author?: string
}
```

**Response 202 :**

```json
{
  "documents": [
    {
      "id": "doc_01HQ3N...",
      "filename": "prevoyance-tns.txt",
      "status": "pending",
      "job_id": "job_01HQ3N..."
    },
    {
      "id": "doc_01HQ3O...",
      "filename": "garanties-tns.txt",
      "status": "pending",
      "job_id": "job_01HQ3O..."
    }
  ],
  "message": "2 documents queued for processing"
}
```

TypeScript type :

```typescript
interface DocumentUploadResponse {
  documents: Array<{
    id: string
    filename: string
    status: 'pending'
    job_id: string
  }>
  message: string
}
```

**Erreurs possibles :**

| Status | Code | Cause |
|--------|------|-------|
| 400 | `VALIDATION_ERROR` | `datasource_id` manquant ou type MIME non supporté |
| 401 | `UNAUTHORIZED` | Clé invalide |
| 403 | `FORBIDDEN` | Scope `write` manquant |
| 404 | `DATASOURCE_NOT_FOUND` | `datasource_id` inconnu dans ce tenant |
| 413 | `PAYLOAD_TOO_LARGE` | Fichier dépasse la limite (configurable, défaut 50 MB) |
| 429 | `QUOTA_EXCEEDED` | Quota documents dépassé pour le plan |

**Exemple curl :**

```bash
curl -X POST https://api.sailor.liteops.fr/v1/documents/upload \
  -H "Authorization: Bearer sk_live_xxx..." \
  -F "datasource_id=ds_metlife_tns_01HQ..." \
  -F "files=@./data/scraped/normalized/prevoyance-tns.txt" \
  -F "files=@./data/scraped/normalized/garanties-tns.txt" \
  -F 'metadata={"category":"assurance-tns","tags":["metlife","tns"]}'
```

---

### 3.3 POST /v1/datasources

Création de la datasource MetLife. Opération de setup exécutée **une seule fois** via script ou curl d'administration.

**Request headers :**

```http
POST /v1/datasources HTTP/1.1
Authorization: Bearer sk_live_xxx...
Content-Type: application/json
```

**Request body :**

```json
{
  "name": "Documentation TNS MetLife",
  "type": "manual"
}
```

TypeScript type :

```typescript
interface CreateDatasourceRequest {
  name: string
  type: 'manual' | 's3' | 'gdrive' | 'sharepoint' | 'web' | 'sql' | 'api'
  config?: Record<string, unknown>   // Vide pour type 'manual'
  schedule?: string                   // Cron — non utilisé pour 'manual'
}
```

**Response 201 :**

```json
{
  "id": "ds_01HQ3K...",
  "tenant_id": "tn_01HQ...",
  "name": "Documentation TNS MetLife",
  "type": "manual",
  "status": "active",
  "schedule": null,
  "doc_count": 0,
  "last_sync": null,
  "created_at": "2026-04-03T10:00:00Z",
  "updated_at": "2026-04-03T10:00:00Z"
}
```

TypeScript type :

```typescript
interface DatasourceResponse {
  id: string
  tenant_id: string
  name: string
  type: string
  status: 'active' | 'paused' | 'error' | 'archived'
  schedule: string | null
  doc_count: number
  last_sync: string | null      // ISO 8601 ou null
  created_at: string            // ISO 8601
  updated_at: string            // ISO 8601
}
```

**Erreurs possibles :**

| Status | Code | Cause |
|--------|------|-------|
| 400 | `VALIDATION_ERROR` | Champ `name` ou `type` invalide |
| 401 | `UNAUTHORIZED` | Clé invalide |
| 403 | `FORBIDDEN` | Scope `write` manquant |
| 429 | `QUOTA_EXCEEDED` | Quota datasources dépassé (plan Pro : 20 max) |

**Exemple curl :**

```bash
curl -X POST https://api.sailor.liteops.fr/v1/datasources \
  -H "Authorization: Bearer sk_live_xxx..." \
  -H "Content-Type: application/json" \
  -d '{"name": "Documentation TNS MetLife", "type": "manual"}'
```

---

### 3.4 GET /v1/stats

Statistiques du tenant MetLife. Utilisé pour le monitoring et la vérification post-seed.

**Request headers :**

```http
GET /v1/stats HTTP/1.1
Authorization: Bearer sk_live_xxx...
```

**Response 200 :**

```json
{
  "tenant_id": "tn_01HQ...",
  "documents": {
    "total": 42,
    "by_status": {
      "indexed": 38,
      "processing": 2,
      "pending": 1,
      "error": 1
    }
  },
  "chunks": {
    "total": 1840,
    "embedded": 1760
  },
  "datasources": {
    "total": 1,
    "active": 1
  },
  "coverage_percent": 95.6,
  "storage_mb": 12.4,
  "queries_today": 127,
  "queries_limit_per_day": 10000
}
```

TypeScript type :

```typescript
interface SailorStats {
  tenant_id: string
  documents: {
    total: number
    by_status: {
      indexed: number
      processing: number
      pending: number
      error: number
    }
  }
  chunks: {
    total: number
    embedded: number
  }
  datasources: {
    total: number
    active: number
  }
  coverage_percent: number      // chunks embedded / chunks total * 100
  storage_mb: number
  queries_today: number
  queries_limit_per_day: number
}
```

**Erreurs possibles :**

| Status | Code | Cause |
|--------|------|-------|
| 401 | `UNAUTHORIZED` | Clé invalide |
| 403 | `FORBIDDEN` | Scope `read` manquant |

**Exemple curl :**

```bash
curl https://api.sailor.liteops.fr/v1/stats \
  -H "Authorization: Bearer sk_live_xxx..."
```

---

### 3.5 GET /v1/health

Health check de l'API Sailor. Public, sans authentification.

**Request headers :**

```http
GET /v1/health HTTP/1.1
```

**Response 200 (healthy) :**

```json
{
  "status": "healthy",
  "version": "1.0.0",
  "uptime_seconds": 86400,
  "checks": {
    "database": { "status": "up", "latency_ms": 2 },
    "redis": { "status": "up", "latency_ms": 1 },
    "storage": { "status": "up" },
    "embedding_provider": { "status": "up", "provider": "voyage" },
    "llm_provider": { "status": "up", "provider": "mistral" }
  }
}
```

**Response 503 (degraded) :**

```json
{
  "status": "degraded",
  "version": "1.0.0",
  "uptime_seconds": 3600,
  "checks": {
    "database": { "status": "up", "latency_ms": 2 },
    "redis": { "status": "down", "error": "Connection refused" },
    "storage": { "status": "up" },
    "embedding_provider": { "status": "up", "provider": "voyage" },
    "llm_provider": { "status": "up", "provider": "mistral" }
  }
}
```

TypeScript type :

```typescript
type HealthStatus = 'healthy' | 'degraded' | 'unhealthy'
type ComponentStatus = 'up' | 'down'

interface HealthCheckResponse {
  status: HealthStatus
  version: string
  uptime_seconds: number
  checks: {
    database: { status: ComponentStatus; latency_ms?: number; error?: string }
    redis: { status: ComponentStatus; latency_ms?: number; error?: string }
    storage: { status: ComponentStatus; error?: string }
    embedding_provider: { status: ComponentStatus; provider?: string; error?: string }
    llm_provider: { status: ComponentStatus; provider?: string; error?: string }
  }
}
```

**Règle côté metlife-sailor :** si `status !== 'healthy'`, logguer un warning mais ne pas bloquer le chat. Voir section 6 pour la dégradation gracieuse.

**Exemple curl :**

```bash
curl https://api.sailor.liteops.fr/v1/health
```

---

### 3.6 GET /v1/jobs/:id

Polling sur l'état d'un job d'ingestion après upload. Utilisé par `scripts/seed-metlife-data.ts`.

**Request headers :**

```http
GET /v1/jobs/job_01HQ3N... HTTP/1.1
Authorization: Bearer sk_live_xxx...
```

**Response 200 (en cours) :**

```json
{
  "id": "job_01HQ3N...",
  "type": "embed",
  "status": "running",
  "progress": {
    "total": 150,
    "done": 87,
    "percent": 58,
    "current_step": "embedding"
  },
  "started_at": "2026-04-03T10:01:00Z",
  "completed_at": null,
  "error": null,
  "created_at": "2026-04-03T10:00:55Z"
}
```

**Response 200 (terminé) :**

```json
{
  "id": "job_01HQ3N...",
  "type": "embed",
  "status": "completed",
  "progress": {
    "total": 150,
    "done": 150,
    "percent": 100,
    "current_step": "done"
  },
  "started_at": "2026-04-03T10:01:00Z",
  "completed_at": "2026-04-03T10:03:42Z",
  "error": null,
  "created_at": "2026-04-03T10:00:55Z"
}
```

**Response 200 (en erreur) :**

```json
{
  "id": "job_01HQ3N...",
  "type": "parse",
  "status": "failed",
  "progress": {
    "total": 1,
    "done": 0,
    "percent": 0,
    "current_step": "parse"
  },
  "started_at": "2026-04-03T10:01:00Z",
  "completed_at": "2026-04-03T10:01:05Z",
  "error": "Failed to parse PDF: unexpected end of stream",
  "created_at": "2026-04-03T10:00:55Z"
}
```

TypeScript type :

```typescript
type JobStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
type JobType = 'sync' | 'embed' | 'reembed' | 'rebuild' | 'parse'

interface JobResponse {
  id: string
  type: JobType
  status: JobStatus
  progress: {
    total: number
    done: number
    percent: number          // 0-100
    current_step: string
  }
  started_at: string | null  // ISO 8601
  completed_at: string | null
  error: string | null
  created_at: string
}
```

**Erreurs possibles :**

| Status | Code | Cause |
|--------|------|-------|
| 401 | `UNAUTHORIZED` | Clé invalide |
| 403 | `FORBIDDEN` | Scope `read` manquant |
| 404 | `JOB_NOT_FOUND` | Job ID inconnu ou appartenant à un autre tenant |

**Exemple curl :**

```bash
curl https://api.sailor.liteops.fr/v1/jobs/job_01HQ3N... \
  -H "Authorization: Bearer sk_live_xxx..."
```

---

## 4. Data mapping

### 4.1 MetLife data model vs Sailor-api data model

#### Chunks locaux (MetLife/Turso) → Chunks Sailor-api

| Champ MetLife (Turso) | Champ Sailor-api | Transformation |
|----------------------|------------------|----------------|
| `content_chunks.id` | `chunks.id` (UUID auto) | Nouveau UUID généré par Sailor-api |
| `content_chunks.content` | `chunks.content` | Direct, aucune transformation |
| `content_chunks.embedding` | `chunks.embedding` (pgvector 1024d) | Re-calculé par Sailor-api avec Voyage-3 |
| `content_chunks.metadata.title` | `documents.metadata.title` | Porté au niveau document |
| `content_chunks.metadata.productType` | `documents.metadata.category` | Renommage de champ |
| `content_chunks.metadata.url` | `documents.metadata.source_url` | Renommage de champ |
| `content_chunks.metadata.guarantees` | `documents.metadata.tags[]` | Array direct |
| — | `chunks.chunk_index` | Calculé à l'ingestion |
| — | `chunks.token_count` | Calculé à l'ingestion |
| — | `chunks.embed_model` | `"voyage-3"` (plan Pro) |

#### Documents MetLife (scraped) → Documents Sailor-api

| Champ source MetLife | Champ Sailor-api `documents` | Valeur |
|---------------------|------------------------------|--------|
| `data.slug + ".txt"` | `filename` | `prevoyance-tns.txt` |
| `data.title` | `metadata.title` | Titre de la page |
| `data.productType` | `metadata.category` | `"assurance-tns"` |
| `data.url` | `metadata.source_url` | URL d'origine metlife.fr |
| `data.guarantees[]` | `metadata.tags[]` | Array de strings |
| SHA-256 du contenu | `file_hash` | Calculé par Sailor-api |
| — | `datasource_id` | `SAILOR_DATASOURCE_ID` |
| — | `tenant_id` | ID du tenant `metlife` |
| — | `storage_key` | Clé S3 auto-générée |

### 4.2 Format RAG context : Turso vs Sailor-api

#### Format Turso (MetLife actuel)

```typescript
// lib/rag.ts — Turso vector_top_k
interface TursoChunk {
  content: string
  metadata: {
    title: string
    productType: string
    url: string
    guarantees: string[]
  }
  distance: number   // distance cosine (0 = identique, 2 = opposé)
}

// Formatage en XML (prompts.ts actuel)
function formatChunksAsRAG(chunks: TursoChunk[]): string {
  return chunks.map((chunk, i) =>
    `<source index="${i+1}" title="${chunk.metadata.title}">\n${chunk.content}\n</source>`
  ).join('\n\n')
}
```

#### Format Sailor-api (metlife-sailor)

```typescript
// lib/sailor-client.ts — Sailor-api retrieval
interface SailorChunk {
  chunk_id: string      // ← Nouveau : identifiant unique du chunk
  document_id: string   // ← Nouveau : lien vers le document parent
  content: string       // ← Identique
  score: number         // ← Converti : similarity score (0-1, 1 = identique)
  metadata: {
    filename: string
    title: string
    page_number: number | null   // ← Nouveau : numéro de page si disponible
    section_title: string | null // ← Nouveau : titre de section
    category?: string            // ← Renommé depuis productType
    source_url?: string          // ← Renommé depuis url
  }
}

// Formatage en XML (prompts.ts metlife-sailor)
// Enrichi avec chunk_id, category, relevance score, source_url
function formatSailorChunksAsRAG(chunks: SailorChunk[]): string {
  return chunks.map((chunk, i) => {
    const attrs = [
      `id="${chunk.chunk_id}"`,
      `title="${escapeXml(chunk.metadata.title)}"`,
      chunk.metadata.category ? `productType="${escapeXml(chunk.metadata.category)}"` : '',
      `relevance="${chunk.score.toFixed(2)}"`,
      chunk.metadata.source_url ? `url="${escapeXml(chunk.metadata.source_url)}"` : '',
    ].filter(Boolean).join(' ')
    return `<source index="${i+1}" ${attrs}>\n${chunk.content}\n</source>`
  }).join('\n\n')
}
```

#### Différence structurelle clé

| Aspect | Turso (actuel) | Sailor-api |
|--------|---------------|------------|
| Score | `distance` (0-2, plus bas = mieux) | `score` (0-1, plus haut = mieux) |
| Identifiant chunk | Absent | `chunk_id` (UUID) |
| Algorithme de recherche | Vector uniquement (cosine) | Hybrid (vector + BM25 + RRF) |
| Embedding model | voyage-3-lite (depuis front) | voyage-3 (serveur, plan Pro) |
| Numéro de page | Absent | Présent si disponible |
| Section title | Absent | Présent si disponible |

### 4.3 Métadonnées d'upload : mapping depuis le script seed

Le script `scripts/seed-metlife-data.ts` lit les fichiers normalisés MetLife et construit ce payload d'upload :

```typescript
// Données source (data/scraped/normalized/*.json)
interface MetLifeNormalizedDoc {
  slug: string
  title: string
  content: string       // Texte brut normalisé
  url: string
  productType?: string  // 'prevoyance-tns' | 'retraite' | 'sante' | etc.
  guarantees?: string[] // ['incapacite', 'invalidite', 'deces']
}

// Transformation pour Sailor-api upload
function buildUploadMetadata(doc: MetLifeNormalizedDoc): UploadMetadata {
  return {
    title: doc.title,
    category: doc.productType ?? 'general',
    tags: doc.guarantees ?? [],
    source_url: doc.url,
  }
}
```

---

## 5. Sequence diagrams

### 5.1 Chat flow (message utilisateur → réponse streamée)

```
Browser          BFF (Next.js)      Sailor-api         Claude (Anthropic)
   │                  │                  │                      │
   │ POST /api/chat   │                  │                      │
   │ {messages}       │                  │                      │
   │─────────────────▶│                  │                      │
   │                  │                  │                      │
   │                  │ [extraire dernier message utilisateur]   │
   │                  │                  │                      │
   │                  │ POST /v1/retrieval/search               │
   │                  │ {query, top_k:8, strategy:'hybrid'}     │
   │                  │─────────────────▶│                      │
   │                  │                  │                      │
   │                  │ [embed query → vector search + BM25 → RRF]
   │                  │                  │                      │
   │                  │   200 {results[8 chunks]}               │
   │                  │◀─────────────────│                      │
   │                  │                  │                      │
   │                  │ [formatSailorChunksAsRAG(chunks)]       │
   │                  │                  │                      │
   │                  │ [buildSystemPrompt(ragContext)]          │
   │                  │                  │                      │
   │                  │ streamText(claude-sonnet-4, system,     │
   │                  │   messages, tools:{generate_dashboard}) │
   │                  │─────────────────────────────────────────▶
   │                  │                  │                      │
   │  SSE: text-delta │                  │ [stream token par token]
   │◀─────────────────│◀────────────────────────────────────────│
   │  SSE: text-delta │                  │                      │
   │◀─────────────────│◀────────────────────────────────────────│
   │  ...             │                  │                      │
   │  SSE: tool-result│                  │ [tool-call: generate_dashboard]
   │◀─────────────────│◀────────────────────────────────────────│
   │  SSE: [DONE]     │                  │                      │
   │◀─────────────────│                  │                      │
   │                  │                  │                      │
   │                  │ [async: save dashboard snapshot → Turso]│
   │                  │─────────▶ Turso  │                      │
   │                  │                  │                      │
```

**Points critiques :**
- L'appel à Sailor-api (étape 3) est **synchrone et bloquant** : le BFF attend les chunks avant d'appeler Claude.
- Si Sailor-api échoue (timeout ou erreur), le BFF continue avec `ragContext = ''` (dégradation gracieuse).
- Le prospect n'est pas sauvegardé pendant le stream — il l'est après, de manière non bloquante.

---

### 5.2 Data seeding flow (upload des docs MetLife → prêt pour retrieval)

```
Script seed          Sailor-api BFF       BullMQ Queue      Workers
    │                     │                    │                │
    │ POST /v1/datasources│                    │                │
    │─────────────────────▶                    │                │
    │ 201 {id: ds_xxx}    │                    │                │
    │◀─────────────────────                    │                │
    │                     │                    │                │
    │ [pour chaque fichier normalisé]           │                │
    │                     │                    │                │
    │ POST /v1/documents/upload                 │                │
    │ (multipart: file + metadata)              │                │
    │─────────────────────▶                    │                │
    │                     │ [stocker en S3]    │                │
    │                     │ [créer document DB, status:pending] │
    │                     │─────────────────▶  │                │
    │                     │  enqueue parse job │                │
    │ 202 {job_id: job_x} │                    │                │
    │◀─────────────────────                    │                │
    │                     │                    │                │
    │ [attendre 2s]       │                    │ parse-document │
    │                     │                    │────────────────▶
    │                     │                    │ chunk-document │
    │                     │                    │────────────────▶
    │                     │                    │ embed-chunks   │
    │                     │                    │────────────────▶
    │                     │                    │                │
    │ GET /v1/jobs/job_x  │                    │ [status:running]
    │─────────────────────▶                    │                │
    │ 200 {status:running, percent:58}         │                │
    │◀─────────────────────                    │                │
    │                     │                    │                │
    │ [attendre 2s, poll] │                    │                │
    │                     │                    │ [status:completed]
    │ GET /v1/jobs/job_x  │                    │                │
    │─────────────────────▶                    │                │
    │ 200 {status:completed, percent:100}      │                │
    │◀─────────────────────                    │                │
    │                     │                    │                │
    │ [passer au fichier suivant]               │                │
```

**Notes importantes :**
- L'upload retourne immédiatement 202 — le traitement est asynchrone.
- Le polling de `GET /v1/jobs/:id` est nécessaire pour savoir quand un document est prêt.
- Un document n'est disponible pour le retrieval que quand son statut est `indexed` (pas `pending`, pas `processing`).
- Le délai typique entre upload et statut `indexed` : 10-60 secondes selon la taille du fichier.

---

### 5.3 Health check / monitoring flow

```
metlife-sailor (cron 30s)    Sailor-api
         │                       │
         │ GET /v1/health        │
         │──────────────────────▶│
         │                       │ [vérifie PG, Redis, S3, Voyage, Mistral]
         │ 200 {status:healthy}  │
         │◀──────────────────────│
         │                       │
         │ [si status != healthy] │
         │ [log warning, ne pas bloquer le chat]
         │                       │
         │ GET /v1/stats         │
         │──────────────────────▶│
         │ 200 {documents, chunks, coverage_percent}
         │◀──────────────────────│
         │                       │
         │ [si coverage_percent < 100] │
         │ [log: des documents sont encore en cours d'indexation]
```

---

## 6. Error handling contract

### 6.1 Quand Sailor-api est indisponible (timeout ou 5xx)

**Comportement attendu dans `src/app/api/chat/route.ts` :**

```typescript
let ragContext = ''

try {
  const sailor = getSailorClient()
  const { results } = await sailor.retrieveChunks({
    query: messageText,
    top_k: 8,
    strategy: 'hybrid',
  })
  ragContext = formatSailorChunksAsRAG(results)
} catch (error) {
  // NE PAS faire échouer le chat entier
  // Logguer l'erreur avec le contexte
  console.error('[sailor] retrieval failed', {
    error: error instanceof Error ? error.message : String(error),
    query: messageText.slice(0, 100),
    timestamp: new Date().toISOString(),
  })
  // ragContext reste '' — le prompt sera construit sans RAG
}

const systemPrompt = buildSystemPrompt(ragContext)
// buildSystemPrompt gère ragContext === '' :
// → "Aucune source disponible pour cette question."
```

**Ce que voit l'utilisateur :** Claude répond quand même, mais sans contexte documentaire. La réponse sera plus générale, sans sources MetLife.

### 6.2 Quand le retrieval retourne 0 résultats

**Cas :** `results: []` avec HTTP 200.

```typescript
const { results } = await sailor.retrieveChunks({ query, top_k: 8 })

if (results.length === 0) {
  // Logguer pour monitoring — peut indiquer un problème d'indexation
  console.warn('[sailor] zero results for query', {
    query: messageText.slice(0, 100),
    datasource_ids: [process.env.SAILOR_DATASOURCE_ID],
  })
  ragContext = ''  // Même comportement que si sailor était down
}
```

**Ce que voit l'utilisateur :** même dégradation gracieuse — Claude répond sans sources.

**Causes possibles à investiguer :**
- Datasource pas encore seed (aucun document indexé)
- Query trop éloignée du corpus (threshold trop haut)
- Tous les documents sont en statut `processing` (seed en cours)

### 6.3 Timeout handling

Timeouts configurés dans `SailorClient` :

| Endpoint | Timeout recommandé | Justification |
|----------|-------------------|---------------|
| `POST /v1/retrieval/search` | 10 000 ms | Doit rester sous 10s pour ne pas bloquer le chat |
| `GET /v1/health` | 3 000 ms | Check rapide |
| `GET /v1/stats` | 5 000 ms | Non critique |
| `GET /v1/jobs/:id` | 5 000 ms | Non critique |
| `POST /v1/documents/upload` | 60 000 ms | Peut être lent pour les gros fichiers |
| `POST /v1/datasources` | 10 000 ms | Opération simple |

Implémentation dans `SailorClient` :

```typescript
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
      throw new SailorApiError(res.status, body, path)
    }

    return res.json() as T
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new SailorApiError(408, `Timeout after ${this.timeout}ms`, path)
    }
    throw err
  } finally {
    clearTimeout(timer)
  }
}
```

### 6.4 Rate limit handling

Sailor-api retourne `429` avec header `Retry-After` quand le quota est dépassé.

**Plan Pro : 10 000 queries/jour.** Dans le contexte du prototype, ce quota est très difficile à atteindre.

```typescript
if (res.status === 429) {
  const retryAfter = res.headers.get('Retry-After')
  throw new SailorApiError(429, `Rate limited. Retry after ${retryAfter}s`, path)
}
```

**Comportement attendu côté BFF :** logger et déclencher la dégradation gracieuse (pas de RAG), identique au cas de service indisponible.

---

## 7. TypeScript interfaces

### 7.1 SailorClient — interface complète

```typescript
// src/lib/sailor-client.ts

// ── Configuration ──────────────────────────────────────────────────

export interface SailorClientConfig {
  baseUrl: string      // Sans slash final — ex: "http://localhost:3003"
  apiKey: string       // Format: sk_live_xxx...
  timeout?: number     // Milliseconds, default: 10_000
}

// ── Retrieval ──────────────────────────────────────────────────────

export interface SailorRetrievalRequest {
  query: string
  top_k?: number
  threshold?: number
  strategy?: 'vector' | 'bm25' | 'hybrid'
  datasource_ids?: string[]
  metadata_filter?: Record<string, unknown>
}

export interface SailorChunk {
  chunk_id: string
  document_id: string
  content: string
  score: number
  metadata: {
    filename: string
    title: string
    page_number: number | null
    section_title: string | null
    category?: string
    source_url?: string
  }
}

export interface SailorRetrievalResponse {
  results: SailorChunk[]
  search_metadata: {
    strategy: string
    total_results: number
    embedding_model: string
    latency_ms: number
  }
}

// ── Documents ──────────────────────────────────────────────────────

export interface SailorDocumentUploadResult {
  id: string
  filename: string
  status: 'pending'
  job_id: string
}

export interface SailorUploadResponse {
  documents: SailorDocumentUploadResult[]
  message: string
}

// ── Datasources ────────────────────────────────────────────────────

export interface SailorCreateDatasourceRequest {
  name: string
  type: 'manual' | 's3' | 'gdrive' | 'sharepoint' | 'web' | 'sql' | 'api'
  config?: Record<string, unknown>
  schedule?: string
}

export interface SailorDatasource {
  id: string
  tenant_id: string
  name: string
  type: string
  status: 'active' | 'paused' | 'error' | 'archived'
  schedule: string | null
  doc_count: number
  last_sync: string | null
  created_at: string
  updated_at: string
}

// ── Stats ──────────────────────────────────────────────────────────

export interface SailorStats {
  tenant_id: string
  documents: {
    total: number
    by_status: {
      indexed: number
      processing: number
      pending: number
      error: number
    }
  }
  chunks: {
    total: number
    embedded: number
  }
  datasources: {
    total: number
    active: number
  }
  coverage_percent: number
  storage_mb: number
  queries_today: number
  queries_limit_per_day: number
}

// ── Health ─────────────────────────────────────────────────────────

export type SailorHealthStatus = 'healthy' | 'degraded' | 'unhealthy'

export interface SailorHealthResponse {
  status: SailorHealthStatus
  version: string
  uptime_seconds: number
  checks: {
    database: { status: 'up' | 'down'; latency_ms?: number; error?: string }
    redis: { status: 'up' | 'down'; latency_ms?: number; error?: string }
    storage: { status: 'up' | 'down'; error?: string }
    embedding_provider: { status: 'up' | 'down'; provider?: string; error?: string }
    llm_provider: { status: 'up' | 'down'; provider?: string; error?: string }
  }
}

// ── Jobs ───────────────────────────────────────────────────────────

export type SailorJobStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
export type SailorJobType = 'sync' | 'embed' | 'reembed' | 'rebuild' | 'parse'

export interface SailorJobResponse {
  id: string
  type: SailorJobType
  status: SailorJobStatus
  progress: {
    total: number
    done: number
    percent: number
    current_step: string
  }
  started_at: string | null
  completed_at: string | null
  error: string | null
  created_at: string
}

// ── Error ──────────────────────────────────────────────────────────

export class SailorApiError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly endpoint: string
  ) {
    super(`SailorApiError [${statusCode}] on ${endpoint}: ${message}`)
    this.name = 'SailorApiError'
  }

  get isTransient(): boolean {
    return this.statusCode >= 500 || this.statusCode === 408 || this.statusCode === 429
  }
}
```

### 7.2 SailorClient — classe complète

```typescript
// src/lib/sailor-client.ts (suite)

export class SailorClient {
  private baseUrl: string
  private apiKey: string
  private timeout: number

  constructor(config: SailorClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, '')
    this.apiKey = config.apiKey
    this.timeout = config.timeout ?? 10_000
  }

  private async request<T>(
    path: string,
    options?: RequestInit & { timeout?: number }
  ): Promise<T> {
    const timeout = options?.timeout ?? this.timeout
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeout)

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
        throw new SailorApiError(res.status, body, path)
      }

      return res.json() as T
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        throw new SailorApiError(408, `Timeout after ${timeout}ms`, path)
      }
      throw err
    } finally {
      clearTimeout(timer)
    }
  }

  async retrieveChunks(
    req: SailorRetrievalRequest
  ): Promise<SailorRetrievalResponse> {
    return this.request<SailorRetrievalResponse>('/v1/retrieval/search', {
      method: 'POST',
      body: JSON.stringify(req),
    })
  }

  async uploadDocuments(
    formData: FormData
  ): Promise<SailorUploadResponse> {
    return this.request<SailorUploadResponse>('/v1/documents/upload', {
      method: 'POST',
      // Ne pas forcer Content-Type — le browser/node le gère pour multipart
      headers: { 'Authorization': `Bearer ${this.apiKey}` },
      body: formData,
      timeout: 60_000,
    })
  }

  async createDatasource(
    req: SailorCreateDatasourceRequest
  ): Promise<SailorDatasource> {
    return this.request<SailorDatasource>('/v1/datasources', {
      method: 'POST',
      body: JSON.stringify(req),
    })
  }

  async getJob(jobId: string): Promise<SailorJobResponse> {
    return this.request<SailorJobResponse>(`/v1/jobs/${jobId}`, {
      timeout: 5_000,
    })
  }

  async getStats(): Promise<SailorStats> {
    return this.request<SailorStats>('/v1/stats', {
      timeout: 5_000,
    })
  }

  async healthCheck(): Promise<SailorHealthResponse> {
    // Health check est public — on peut omettre le header auth mais on le laisse
    return this.request<SailorHealthResponse>('/v1/health', {
      timeout: 3_000,
    })
  }
}

// ── Singleton ──────────────────────────────────────────────────────

let _client: SailorClient | null = null

export function getSailorClient(): SailorClient {
  if (!_client) {
    const baseUrl = process.env.SAILOR_API_URL
    const apiKey = process.env.SAILOR_API_KEY
    if (!baseUrl || !apiKey) {
      throw new Error(
        'SAILOR_API_URL and SAILOR_API_KEY must be set. ' +
        'Copy .env.local.example to .env.local and fill the values.'
      )
    }
    _client = new SailorClient({ baseUrl, apiKey })
  }
  return _client
}

// Utile pour les tests : reset le singleton
export function resetSailorClient(): void {
  _client = null
}
```

### 7.3 Mapping functions — signatures

```typescript
// src/lib/prompts.ts

/**
 * Convertit les chunks Sailor-api en contexte XML injecté dans le system prompt.
 * Compatible avec le format attendu par le prompt MetLife existant.
 */
export function formatSailorChunksAsRAG(chunks: SailorChunk[]): string

/**
 * Construit le system prompt complet avec le contexte RAG.
 * Si ragContext est vide (Sailor indisponible ou 0 résultats), le prompt
 * indique "Aucune source disponible" et Claude répond sans sources.
 */
export function buildSystemPrompt(ragContext: string): string

// src/scripts/seed-metlife-data.ts

/**
 * Convertit un document normalisé MetLife en métadonnées pour Sailor-api.
 */
export function buildUploadMetadata(doc: MetLifeNormalizedDoc): UploadMetadata

/**
 * Attend qu'un job soit terminé en polling. Retourne le job complété.
 * Lève une erreur si le job échoue ou si le timeout est dépassé.
 */
export async function waitForJob(
  client: SailorClient,
  jobId: string,
  options?: { pollIntervalMs?: number; timeoutMs?: number }
): Promise<SailorJobResponse>
```

---

## 8. Configuration contract

### 8.1 Variables d'environnement côté metlife-sailor

```bash
# .env.local (ne pas committer)
# Généré depuis .env.local.example

# ── Sailor-api (RAG centralisé) ── OBLIGATOIRES
SAILOR_API_URL=http://localhost:3003          # Dev local
# SAILOR_API_URL=https://api.sailor.liteops.fr  # Production
SAILOR_API_KEY=sk_live_xxx...                 # Clé avec scopes read + write
SAILOR_DATASOURCE_ID=ds_metlife_tns_01HQ...  # ID de la datasource TNS

# ── Claude (LLM direct) ── OBLIGATOIRE
ANTHROPIC_API_KEY=sk-ant-api03-...

# ── Prospects DB (local) ── OBLIGATOIRE
TURSO_DATABASE_URL=file:local.db
# En Turso hébergé :
# TURSO_DATABASE_URL=libsql://metlife-sailor-xxx.turso.io
# TURSO_AUTH_TOKEN=eyJ...

# ── App ──
NEXT_PUBLIC_DEMO_MODE=false
```

**Variables qui n'existent plus** (supprimées vs MetLife actuel) :

```bash
# SUPPRIMÉES — ne plus utiliser
VOYAGEAI_API_KEY=...   # Géré par Sailor-api côté serveur
# TURSO_DATABASE_URL pour les chunks RAG — conservé uniquement pour les prospects
```

### 8.2 Tenant MetLife — provisionnement complet (step-by-step)

Ces commandes sont à exécuter **une seule fois**, sur l'environnement cible, par un administrateur Sailor-api.

**Étape 1 — Créer le tenant MetLife (commande admin)**

```bash
# Requiert une clé admin Sailor-api (sk_live_admin_xxx)
curl -X POST https://api.sailor.liteops.fr/v1/admin/tenants \
  -H "Authorization: Bearer sk_live_admin_xxx..." \
  -H "Content-Type: application/json" \
  -d '{
    "name": "MetLife France",
    "slug": "metlife",
    "plan": "pro",
    "settings": {
      "language": "fr",
      "embed_model": "voyage-3",
      "chunk_size": 500,
      "chunk_overlap": 100
    }
  }'

# Réponse attendue :
# { "id": "tn_01HQ...", "slug": "metlife", "plan": "pro", ... }
# → Sauvegarder l'id du tenant
```

**Étape 2 — Générer l'API key MetLife (commande admin)**

```bash
curl -X POST https://api.sailor.liteops.fr/v1/admin/tenants/metlife/api-keys \
  -H "Authorization: Bearer sk_live_admin_xxx..." \
  -H "Content-Type: application/json" \
  -d '{
    "name": "metlife-sailor-proto",
    "scopes": ["read", "write"]
  }'

# Réponse attendue :
# { "key": "sk_live_xxx...", "prefix": "sk_live_xxx1", "scopes": ["read","write"] }
# → COPIER la valeur "key" dans .env.local → SAILOR_API_KEY
# → La clé complète n'est jamais re-affichée
```

**Étape 3 — Créer la datasource TNS (avec la clé MetLife)**

```bash
curl -X POST https://api.sailor.liteops.fr/v1/datasources \
  -H "Authorization: Bearer sk_live_xxx..." \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Documentation TNS MetLife",
    "type": "manual"
  }'

# Réponse attendue :
# { "id": "ds_01HQ3K...", "name": "Documentation TNS MetLife", "type": "manual", ... }
# → COPIER la valeur "id" dans .env.local → SAILOR_DATASOURCE_ID
```

**Étape 4 — Seed des données MetLife**

```bash
# Depuis la racine de metlife-sailor
cp .env.local.example .env.local
# Remplir SAILOR_API_URL, SAILOR_API_KEY, SAILOR_DATASOURCE_ID

npm run seed
# → Exécute scripts/seed-metlife-data.ts
# → Upload tous les fichiers de data/scraped/normalized/
# → Poll jusqu'à ce que tous les jobs soient complétés
```

**Étape 5 — Vérifier l'indexation**

```bash
curl https://api.sailor.liteops.fr/v1/stats \
  -H "Authorization: Bearer sk_live_xxx..."

# Vérifier que coverage_percent est proche de 100
# et que by_status.indexed > 0
```

**Étape 6 — Test du retrieval**

```bash
curl -X POST https://api.sailor.liteops.fr/v1/retrieval/search \
  -H "Authorization: Bearer sk_live_xxx..." \
  -H "Content-Type: application/json" \
  -d '{
    "query": "kiné libéral invalidité retraite",
    "top_k": 3,
    "strategy": "hybrid",
    "datasource_ids": ["ds_01HQ3K..."]
  }'

# Vérifier que results[] contient des chunks pertinents avec score > 0.5
```

---

## 9. Testing contract

### 9.1 Tests d'intégration locaux

**Prérequis :**

```bash
# 1. Démarrer Sailor-api en local (depuis /liteops/sailor-api/)
docker compose up -d   # PG + pgvector + Redis
npm run dev            # Sailor-api sur :3003

# 2. Configurer metlife-sailor
cp .env.local.example .env.local
# SAILOR_API_URL=http://localhost:3003
# SAILOR_API_KEY=sk_live_xxx... (généré à l'étape de provisionnement)
# SAILOR_DATASOURCE_ID=ds_xxx... (généré à l'étape de provisionnement)

# 3. Seed les données de test
npm run seed

# 4. Démarrer metlife-sailor
npm run dev   # sur :3000
```

**Test manuel du flow complet :**

```bash
# Test retrieval direct
curl -X POST http://localhost:3003/v1/retrieval/search \
  -H "Authorization: Bearer sk_live_xxx..." \
  -H "Content-Type: application/json" \
  -d '{"query": "prévoyance TNS", "top_k": 3}'

# Test du BFF chat (doit déclencher retrieval + Claude)
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"messages": [{"role": "user", "content": "Quels sont mes risques en tant que kiné libéral ?"}]}'
# → Doit retourner un stream SSE
```

### 9.2 Mock responses pour tests unitaires

Quand Sailor-api est indisponible (CI, tests unitaires), utiliser ce mock :

```typescript
// src/lib/__mocks__/sailor-client.ts

import type {
  SailorRetrievalResponse,
  SailorHealthResponse,
  SailorStats,
} from '../sailor-client'

export const MOCK_RETRIEVAL_RESPONSE: SailorRetrievalResponse = {
  results: [
    {
      chunk_id: 'chk_mock_001',
      document_id: 'doc_mock_001',
      content: 'Le risque d\'invalidité est la principale menace pour un kiné libéral. ' +
               'Une incapacité de travail peut entraîner une perte totale de revenus.',
      score: 0.91,
      metadata: {
        filename: 'prevoyance-tns.txt',
        title: 'Prévoyance TNS MetLife',
        page_number: null,
        section_title: null,
        category: 'assurance-tns',
        source_url: 'https://www.metlife.fr/prevoyance-tns',
      },
    },
    {
      chunk_id: 'chk_mock_002',
      document_id: 'doc_mock_001',
      content: 'La retraite des TNS dépend de leur régime : CIPAV pour les professions ' +
               'libérales réglementées. Le taux de remplacement est souvent inférieur à 50%.',
      score: 0.84,
      metadata: {
        filename: 'prevoyance-tns.txt',
        title: 'Prévoyance TNS MetLife',
        page_number: null,
        section_title: null,
        category: 'assurance-tns',
        source_url: 'https://www.metlife.fr/prevoyance-tns',
      },
    },
  ],
  search_metadata: {
    strategy: 'hybrid',
    total_results: 2,
    embedding_model: 'voyage-3',
    latency_ms: 42,
  },
}

export const MOCK_HEALTH_HEALTHY: SailorHealthResponse = {
  status: 'healthy',
  version: '1.0.0',
  uptime_seconds: 3600,
  checks: {
    database: { status: 'up', latency_ms: 2 },
    redis: { status: 'up', latency_ms: 1 },
    storage: { status: 'up' },
    embedding_provider: { status: 'up', provider: 'voyage' },
    llm_provider: { status: 'up', provider: 'mistral' },
  },
}

export const MOCK_HEALTH_DEGRADED: SailorHealthResponse = {
  status: 'degraded',
  version: '1.0.0',
  uptime_seconds: 3600,
  checks: {
    database: { status: 'up', latency_ms: 2 },
    redis: { status: 'down', error: 'Connection refused' },
    storage: { status: 'up' },
    embedding_provider: { status: 'up', provider: 'voyage' },
    llm_provider: { status: 'up', provider: 'mistral' },
  },
}

export const MOCK_STATS: SailorStats = {
  tenant_id: 'tn_mock_001',
  documents: {
    total: 42,
    by_status: { indexed: 42, processing: 0, pending: 0, error: 0 },
  },
  chunks: { total: 1840, embedded: 1840 },
  datasources: { total: 1, active: 1 },
  coverage_percent: 100,
  storage_mb: 12.4,
  queries_today: 0,
  queries_limit_per_day: 10000,
}

// Mock SailorClient pour tests
export class MockSailorClient {
  async retrieveChunks() {
    return MOCK_RETRIEVAL_RESPONSE
  }
  async healthCheck() {
    return MOCK_HEALTH_HEALTHY
  }
  async getStats() {
    return MOCK_STATS
  }
}
```

Usage dans les tests :

```typescript
// src/app/api/chat/__tests__/route.test.ts
import { MockSailorClient } from '@/lib/__mocks__/sailor-client'
import * as sailorModule from '@/lib/sailor-client'

jest.spyOn(sailorModule, 'getSailorClient').mockReturnValue(
  new MockSailorClient() as unknown as sailorModule.SailorClient
)
```

### 9.3 Health check expectations

| Condition à tester | Health status attendu | Comportement BFF |
|-------------------|-----------------------|------------------|
| Sailor-api opérationnel | `healthy` | Chat normal avec RAG |
| Redis down mais PG up | `degraded` | Chat sans RAG (retrieval peut échouer) |
| PG down | `unhealthy` | Chat sans RAG (retrieval échoue immédiatement) |
| Sailor-api injoignable (réseau) | Timeout / connexion refusée | Chat sans RAG (dégradation gracieuse) |
| Quota dépassé | HTTP 429 | Chat sans RAG (dégradation gracieuse) |

**Le chat MetLife ne doit jamais retourner une erreur 5xx à l'utilisateur à cause de Sailor-api.**
Si le retrieval échoue pour quelque raison que ce soit, le BFF continue avec `ragContext = ''`.

---

*REF-SPEC/METLIFE-SAILOR-INTERFACE v1.0 — 2026-04-03*
*Lite Ops — Intelligent Systems & Operations*
