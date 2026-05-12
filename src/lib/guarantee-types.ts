import { z } from 'zod'

// --- Shared types ---

export type DocumentType = 'mutuelle' | 'prevoyance'

// --- Mutuelle (santé) schemas ---

export const extractedGuaranteeSchema = z.object({
  category: z.string().describe('Catégorie : hospitalisation, soins_courants, optique, dentaire, medecine_douce, prevention'),
  label: z.string().describe('Intitulé de la garantie'),
  value: z.string().describe('Valeur de remboursement telle qu\'extraite du document (ex: "300% BRSS", "450€/an", "100% FR")'),
  notes: z.string().optional().describe('Conditions ou précisions supplémentaires'),
})

export const coverageLevelSchema = z.object({
  name: z.string().describe('Nom du niveau tel qu\'affiché sur le document (ex: "Base uniquement", "Base + Option 1", "Confort", "Premium")'),
  guarantees: z.array(extractedGuaranteeSchema).describe('Garanties extraites pour ce niveau'),
})

export const extractedContractSchema = z.object({
  insurer: z.string().describe('Nom de l\'assureur (ex: Alan, Allianz, AXA, Harmonie)'),
  product_name: z.string().describe('Nom du contrat/produit'),
  tier: z.string().optional().describe('Niveau de couverture si mentionné (base, renforcé, premium)'),
  monthly_price: z.string().optional().describe('Prix mensuel si visible sur le document'),
  coverage_levels: z.array(coverageLevelSchema).describe('Niveaux de couverture détectés dans le document. Si le document a plusieurs colonnes (Base, Option 1, Option 2...), chaque colonne est un niveau. Si une seule colonne, un seul niveau.'),
  detected_pages: z.number().describe('Nombre de pages visibles/analysées dans ce document'),
  total_pages: z.number().nullable().describe('Nombre total de pages indiqué sur le document (ex: "Page 1 sur 5" → 5). Null si non indiqué.'),
  detected_categories: z.array(z.string()).describe('Catégories de garanties trouvées dans le document'),
  missing_categories: z.array(z.string()).describe('Catégories probablement manquantes (attendues pour une mutuelle santé mais absentes du document). Ex: si seule l\'hospitalisation est visible, les autres catégories sont probablement sur les pages suivantes.'),
  confidence: z.enum(['high', 'medium', 'low']).describe('Niveau de confiance dans l\'extraction'),
  extraction_notes: z.string().optional().describe('Notes sur la qualité de l\'extraction ou éléments manquants'),
})

// --- Prévoyance schemas ---

export const prevoyanceCoverageSchema = z.object({
  category: z.enum(['itt', 'invalidite', 'deces', 'frais_generaux']).describe('Type de couverture prévoyance'),
  label: z.string().describe('Intitulé de la garantie'),
  regime_obligatoire: z.string().describe('Prestation du Régime Obligatoire'),
  concurrent_value: z.string().optional().describe('Valeur proposée par le concurrent si document concurrent'),
  conditions: z.string().optional().describe('Conditions, délais de carence, durée de franchise'),
})

export const extractedPrevoyanceSchema = z.object({
  document_type: z.literal('prevoyance'),
  insurer: z.string().describe('Nom de l\'assureur ou "Régime Obligatoire" si document RO seul'),
  product_name: z.string().describe('Nom du produit de prévoyance'),
  target_profession: z.string().describe('Profession ciblée (ex: chauffeur de taxi, ostéopathe, avocat)'),
  caisse: z.string().optional().describe('Caisse de rattachement (SSI, CIPAV, CNBF, CARMF, etc.)'),
  monthly_price: z.string().optional().describe('Cotisation mensuelle si visible'),
  example_profile: z.object({
    age: z.number().optional(),
    situation: z.string().optional(),
    revenu_mensuel: z.number().optional(),
  }).optional().describe('Profil d\'exemple utilisé dans le document pour les chiffres'),
  coverages: z.array(prevoyanceCoverageSchema).describe('Garanties de prévoyance extraites'),
  advantages: z.array(z.string()).describe('Avantages ou points forts mentionnés'),
  madelin_eligible: z.boolean().optional().describe('Éligibilité loi Madelin'),
  detected_pages: z.number(),
  total_pages: z.number().nullable(),
  confidence: z.enum(['high', 'medium', 'low']),
  extraction_notes: z.string().optional(),
})

// --- Document type detection ---

export const documentTypeDetectionSchema = z.object({
  document_type: z.enum(['mutuelle', 'prevoyance']).describe('Type du document : "mutuelle" pour complémentaire santé (remboursements soins, optique, dentaire...) ou "prevoyance" pour prévoyance/incapacité (ITT, invalidité, décès, arrêt de travail, rente...)'),
  confidence: z.enum(['high', 'medium', 'low']),
  reasoning: z.string().describe('Explication courte du choix'),
})

// --- Comparison schemas (unified for both types) ---

export const comparisonRowSchema = z.object({
  category: z.string(),
  label: z.string(),
  current_value: z.string().describe('Valeur de la garantie actuelle du prospect. "Information manquante" si la garantie n\'a pas été trouvée dans le document uploadé.'),
  metlife_essentiel: z.string().describe('Pour mutuelle: MetLife Essentiel. Pour prévoyance: Régime Obligatoire seul.'),
  metlife_premium: z.string().describe('Pour mutuelle: MetLife Premium. Pour prévoyance: Régime Obligatoire + Complément MetLife.'),
  verdict: z.enum(['better', 'equal', 'worse', 'not_comparable', 'missing_info']).describe('Comparaison MetLife vs actuel. "missing_info" si la garantie actuelle est manquante.'),
})

export const comparisonResultSchema = z.object({
  document_type: z.enum(['mutuelle', 'prevoyance']).default('mutuelle'),
  current_contract: z.object({
    insurer: z.string(),
    product_name: z.string(),
    monthly_price: z.string().optional(),
  }),
  column_headers: z.object({
    current: z.string().default('Votre contrat'),
    col2: z.string().default('Essentiel'),
    col3: z.string().default('Premium'),
  }).optional(),
  rows: z.array(comparisonRowSchema),
  summary: z.string().describe('Résumé de la comparaison en 2-3 phrases'),
  recommendation: z.string().describe('Recommandation personnalisée'),
  metlife_product_id: z.string().optional().describe('ID du produit MetLife recommandé'),
})

export type ExtractedGuarantee = z.infer<typeof extractedGuaranteeSchema>
export type CoverageLevel = z.infer<typeof coverageLevelSchema>
export type ExtractedContract = z.infer<typeof extractedContractSchema>
export type ExtractedPrevoyance = z.infer<typeof extractedPrevoyanceSchema>
export type ComparisonRow = z.infer<typeof comparisonRowSchema>
export type ComparisonResult = z.infer<typeof comparisonResultSchema>
