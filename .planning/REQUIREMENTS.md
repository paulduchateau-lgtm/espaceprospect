# Requirements: METLife Espace Prospect Intelligent

**Defined:** 2026-03-20
**Core Value:** Un TNS qui arrive sur le site comprend en moins de 2 minutes comment MetLife peut l'aider, à travers une expérience conversationnelle simple et personnalisée.

## v1 Requirements

Requirements for the prototype pitch. Each maps to roadmap phases.

### Conversationnel

- [x] **CONV-01**: Le prospect peut décrire sa situation en texte libre (métier, âge, risques, contexte)
- [ ] **CONV-02**: Des exemples de prompts cliquables guident le prospect ("Je suis kiné libéral, 35 ans...")
- [x] **CONV-03**: La réponse IA s'affiche en streaming temps réel
- [x] **CONV-04**: Claude analyse la situation et identifie les risques spécifiques au profil TNS
- [x] **CONV-05**: Claude matche les risques identifiés avec les produits MetLife pertinents
- [ ] **CONV-06**: Les messages d'erreur sont humanisés en français

### Dashboard

- [x] **DASH-01**: Le dashboard affiche les risques identifiés classés par pertinence
- [x] **DASH-02**: Le dashboard affiche les produits MetLife recommandés avec explication de pertinence
- [x] **DASH-03**: Le dashboard affiche les services partenaires (Caarl, Doado, Noctia) sous forme de cartes
- [ ] **DASH-04**: Un CTA contact conseiller est visible à tout moment
- [ ] **DASH-05**: La transition chat → dashboard est animée (chat shrink 1/3, dashboard slide-in avec reveal progressif des cartes)
- [x] **DASH-06**: Le dashboard affiche des ressources/articles curés pertinents au profil

### RAG

- [x] **RAG-01**: Le contenu du site MetLife est scrapé et normalisé en markdown structuré
- [x] **RAG-02**: Le contenu est découpé en chunks sémantiques par produit/risque avec métadonnées enrichies
- [x] **RAG-03**: Les chunks sont embarqués via Voyage AI (voyage-finance-2) et stockés avec recherche vectorielle dans SQLite/Turso
- [x] **RAG-04**: Les requêtes prospect sont embarquées et matchées par similarité cosinus avec les chunks pertinents
- [x] **RAG-05**: Le contexte RAG est injecté dans le prompt système de Claude pour gronder les réponses

### Confiance & Légal

- [x] **CONF-01**: L'interface respecte la charte graphique MetLife (couleurs, typographie, identité visuelle)
- [ ] **CONF-02**: Un bandeau de consentement RGPD est affiché avant la première interaction
- [ ] **CONF-03**: Un disclaimer précise que les recommandations sont indicatives et ne constituent pas un conseil en assurance
- [ ] **CONF-04**: Des signaux de confiance sont visibles (ACPR, solidité financière, nombre d'assurés)

### Persistance

- [ ] **PERS-01**: Chaque prospect reçoit un UUID unique à la création de son espace
- [ ] **PERS-02**: Le prospect peut revenir sur son espace via une URL dédiée (/dashboard/[prospectId])
- [ ] **PERS-03**: L'historique de conversation et le dashboard sont sauvegardés en base

### Responsive & UX

- [ ] **UX-01**: L'expérience fonctionne sur mobile (au minimum le flow conversationnel)
- [ ] **UX-02**: Le temps entre la saisie et l'affichage du dashboard est inférieur à 90 secondes
- [ ] **UX-03**: Un fallback gracieux s'affiche pour les profils TNS non reconnus ("Votre situation est spécifique, je vous recommande d'échanger avec un conseiller MetLife")

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Input Vocal

- **VOCL-01**: Le prospect peut dicter sa situation oralement via speech-to-text
- **VOCL-02**: La réponse IA est lue à voix haute via text-to-speech

### Parcours Avancé

- **PARC-01**: Le prospect peut simuler un devis à partir de son profil
- **PARC-02**: Le prospect peut échanger en live avec un conseiller/courtier
- **PARC-03**: Le prospect peut déclencher un processus de souscription
- **PARC-04**: L'espace prospect se transforme en espace client après souscription

### Intégration

- **INTG-01**: L'app est intégrable en widget/iframe sur le site MetLife
- **INTG-02**: Intégration CRM (Salesforce ou équivalent)
- **INTG-03**: Analytics avancé du comportement prospect

## Out of Scope

| Feature | Reason |
|---------|--------|
| Génération de prix/devis | Les produits prévoyance sont trop complexes — un prix approximatif faux détruit la confiance |
| Collecte de données médicales | RGPD données sensibles — risque juridique disproportionné pour un proto |
| Auto-play vidéo/audio | Universellement détesté, casse le flow conversationnel |
| Lead capture avant valeur | 60-80% d'abandon — montrer la valeur d'abord |
| Personnalité IA excessive | L'assurance est un achat de confiance — ton professionnel, pas ludique |
| Comparaison concurrents | MetLife ne veut pas comparer ses produits à la concurrence |
| Export PDF conversation | Scope creep — le dashboard persistant remplit ce rôle |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| CONV-01 | 3 | Complete |
| CONV-02 | 3 | Pending |
| CONV-03 | 3 | Complete |
| CONV-04 | 2 | Complete |
| CONV-05 | 2 | Complete |
| CONV-06 | 3 | Pending |
| DASH-01 | 4 | Complete |
| DASH-02 | 4 | Complete |
| DASH-03 | 4 | Complete |
| DASH-04 | 4 | Pending |
| DASH-05 | 4 | Pending |
| DASH-06 | 4 | Complete |
| RAG-01 | 1 | Complete |
| RAG-02 | 1 | Complete |
| RAG-03 | 1 | Complete |
| RAG-04 | 2 | Complete |
| RAG-05 | 2 | Complete |
| CONF-01 | 1 | Complete |
| CONF-02 | 5 | Pending |
| CONF-03 | 5 | Pending |
| CONF-04 | 5 | Pending |
| PERS-01 | 5 | Pending |
| PERS-02 | 5 | Pending |
| PERS-03 | 5 | Pending |
| UX-01 | 6 | Pending |
| UX-02 | 6 | Pending |
| UX-03 | 3 | Pending |

**Coverage:**
- v1 requirements: 27 total
- Mapped to phases: 27
- Unmapped: 0

---
*Requirements defined: 2026-03-20*
*Last updated: 2026-03-20 after initial definition*
