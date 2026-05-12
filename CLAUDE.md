# metlife-sailor — CLAUDE.md

> Fork du front MetLife Espace Prospect, rebranché sur Sailor-api comme moteur RAG.
> Ce projet ne modifie PAS le MetLife original ni Sailor.

## Architecture

- **Front** : Next.js 16, React 19, Tailwind 4, shadcn/ui — identique au MetLife actuel
- **BFF** : Next.js API routes — orchestre Sailor-api (retrieval) + Claude (generation)
- **RAG** : Sailor-api (`/v1/retrieval/search`) — remplace Turso vector search
- **LLM** : Claude claude-sonnet-4-20250514 via Anthropic SDK — direct, pas via Sailor-api
- **Prospects** : SQLite local (Turso optionnel) — inchangé

## Fichiers clés (modifiés vs MetLife original)

| Fichier | Changement |
|---------|-----------|
| `src/app/api/chat/route.ts` | Retrieval via `SailorClient` au lieu de Turso |
| `src/lib/prompts.ts` | `formatSailorChunksAsRAG()` au lieu de `formatRAGContext()` |
| `src/lib/sailor-client.ts` | NOUVEAU — client HTTP Sailor-api |
| `src/db/schema.ts` | Simplifié — plus de `content_chunks` ni `scrape_log` |

## Variables d'environnement

- `SAILOR_API_URL` — URL de Sailor-api (ex: `http://localhost:3001`)
- `SAILOR_API_KEY` — Clé API tenant MetLife
- `ANTHROPIC_API_KEY` — Clé Claude (direct)
- `TURSO_DATABASE_URL` — Base prospects (local: `file:local.db`)

## Règles

- Ne JAMAIS modifier les composants UI (fork identique du MetLife)
- Le seul changement est la couche RAG : Sailor-api remplace Turso vector
- Graceful degradation : si Sailor-api est down, le chat fonctionne sans RAG
