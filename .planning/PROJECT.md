# METLife — Espace Prospect Intelligent

## What This Is

Une webapp conversationnelle qui transforme le parcours prospect des Travailleurs Non Salariés (TNS) sur MetLife. Au lieu d'un site classique avec des pages produits statiques, le visiteur décrit sa situation en langage naturel — qui il est, ce qu'il fait, les risques qu'il prend — et reçoit instantanément un dashboard personnalisé avec les produits, ressources et contacts pertinents. L'espace prospect persiste et évolue jusqu'à devenir un espace client après souscription.

## Core Value

Un TNS qui arrive sur le site comprend en moins de 2 minutes comment MetLife peut l'aider, à travers une expérience conversationnelle simple et personnalisée.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Saisie en langage naturel de la situation du TNS (métier, risques, situation)
- [ ] Analyse IA de la situation et matching avec les produits MetLife
- [ ] Dashboard personnalisé : risques identifiés, produits recommandés, ressources, contacts
- [ ] RAG alimenté par le contenu scrapé du site MetLife (produits, conseils, ressources)
- [ ] Intégration de services partenaires (Caarl — assistance juridique, Doado — réduction TMS, Noctia — troubles du sommeil)
- [ ] Persistance de l'espace prospect (réaccessible ultérieurement)
- [ ] Design respectant la charte graphique MetLife

### Out of Scope

- Input vocal — v2, texte d'abord pour le proto
- Simulation de devis — vision long terme, pas dans le proto
- Échanges live avec conseillers/courtiers — vision long terme
- Process de souscription — vision long terme
- Transition espace prospect → espace client — vision long terme
- Widget intégrable au site MetLife — le proto tourne en standalone/local d'abord

## Context

**Objectif business :** Ce prototype sert à pitcher MetLife sur une nouvelle expérience digitale prospect. L'objectif est le "wow effect" — montrer que l'approche conversationnelle + IA est supérieure au parcours formulaire/FAQ classique.

**Cible :** Tous les TNS — freelances, professions libérales, artisans, commerçants, dirigeants. Ces visiteurs arrivent sur le site MetLife parce qu'ils ont déjà entendu parler des produits. Ils ont besoin d'être rassurés et de comprendre simplement ce qui les concerne.

**Image à véhiculer :** Simplicité, modernité, solidité. MetLife doit apparaître comme un acteur tech-savvy et accessible, pas comme un assureur traditionnel complexe.

**Données :** Le contenu produits/conseils sera scrapé depuis le site MetLife en production, complété par des services fictifs (Caarl, Doado, Noctia) pour illustrer un écosystème de services à valeur ajoutée.

**Vision long terme :** L'espace prospect est le point d'entrée d'un parcours complet : conversation → dashboard → simulation devis → échange conseiller → souscription → espace client. Le proto ne couvre que la première partie (conversation → dashboard).

## Constraints

- **Stack frontend :** Next.js + Tailwind CSS — persistance avec SQLite/Turso pour pouvoir tourner en local
- **IA :** Claude API (Anthropic) pour l'analyse conversationnelle et le RAG
- **Déploiement :** Doit pouvoir tourner en local pour les démos, déployable sur Vercel à terme
- **Design :** Charte graphique MetLife (couleurs, typographie, identité visuelle)
- **Prototype :** Priorité à l'effet wow et à la fluidité de l'expérience, pas à la robustesse production

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Next.js + Tailwind + SQLite/Turso | Proto léger, tourne en local, déployable facilement | — Pending |
| Claude API pour le conversationnel + RAG | Cohérent avec l'écosystème de travail, performant pour le NLP français | — Pending |
| Scraping site MetLife + services fictifs | Données réalistes sans dépendre d'une API MetLife, services partenaires pour illustrer la vision | — Pending |
| Texte d'abord, vocal en v2 | Réduire la complexité du proto, le texte suffit pour démontrer le concept | — Pending |
| Standalone d'abord, intégrable ensuite | Liberté de démo sans contrainte d'intégration MetLife | — Pending |

---
*Last updated: 2026-03-20 after initialization*
