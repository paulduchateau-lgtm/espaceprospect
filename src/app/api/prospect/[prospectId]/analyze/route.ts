import { readFileSync } from 'node:fs'
import { createAnthropic } from '@ai-sdk/anthropic'
import { generateObject, zodSchema } from 'ai'
import {
  extractedContractSchema,
  extractedPrevoyanceSchema,
  documentTypeDetectionSchema,
  comparisonResultSchema,
  type CoverageLevel,
  type DocumentType,
} from '@/lib/guarantee-types'
import { metlifeProducts, formatGuaranteeValue, type GuaranteeDetail } from '@/data/metlife-mutuelle-products'
import { buildPrevoyanceReferenceContext } from '@/data/metlife-prevoyance-products'

function loadApiKey(): string {
  const envKey = process.env.ANTHROPIC_API_KEY
  if (envKey && envKey.length > 0) return envKey
  try {
    const content = readFileSync('.env.local', 'utf8')
    const match = content.match(/^ANTHROPIC_API_KEY=(.+)$/m)
    if (match?.[1]) return match[1].trim()
  } catch { /* .env.local not found */ }
  throw new Error('ANTHROPIC_API_KEY not configured')
}

function getAnthropic() {
  return createAnthropic({
    apiKey: loadApiKey(),
    baseURL: 'https://api.anthropic.com/v1',
  })
}

function buildMetLifeMutuelleContext(): string {
  return metlifeProducts.map(product => {
    const allGuarantees = Object.entries(product.guarantees)
      .flatMap(([, guarantees]) =>
        (guarantees as GuaranteeDetail[]).map((g: GuaranteeDetail) => `- ${g.label}: ${formatGuaranteeValue(g)}${g.notes ? ` (${g.notes})` : ''}`)
      )
      .join('\n')

    return `<metlife_product id="${product.id}" name="${product.name}" tier="${product.tier}">
Prix: ${product.monthly_price_range.solo} (solo) / ${product.monthly_price_range.family} (famille)
${allGuarantees}
</metlife_product>`
  }).join('\n\n')
}

type ImageMediaType = 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif'
type ContentPart = { type: 'image'; image: string } | { type: 'text'; text: string } | { type: 'file'; data: string; mediaType: 'application/pdf' }

const VALID_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf']
const MAX_FILE_SIZE = 20 * 1024 * 1024

export const maxDuration = 180

async function detectDocumentType(
  anthropic: ReturnType<typeof getAnthropic>,
  contentParts: ContentPart[],
  fileCount: number,
): Promise<DocumentType> {
  const detection = await generateObject({
    model: anthropic('claude-sonnet-4-20250514'),
    schema: zodSchema(documentTypeDetectionSchema),
    messages: [{
      role: 'user',
      content: [
        ...contentParts,
        {
          type: 'text',
          text: `Détermine le type de ce${fileCount > 1 ? 's' : ''} document${fileCount > 1 ? 's' : ''} d'assurance :

- "mutuelle" : complémentaire santé — tableaux de remboursements (hospitalisation, soins courants, optique, dentaire, médecine douce). Mots-clés : BRSS, remboursement, % BR, tiers payant, chambre particulière, prothèses.

- "prevoyance" : prévoyance/incapacité — protection de revenus en cas d'arrêt de travail, invalidité, décès. Mots-clés : ITT, indemnité journalière, invalidité, rente, décès, PTIA, arrêt de travail, capital, Madelin, régime obligatoire.

Réponds avec le type détecté.`,
        },
      ],
    }],
  })

  console.log(`[Analyze] Document type detected: ${detection.object.document_type} (confidence: ${detection.object.confidence}) — ${detection.object.reasoning}`)
  return detection.object.document_type
}

async function analyzeMutuelle(
  anthropic: ReturnType<typeof getAnthropic>,
  contentParts: ContentPart[],
  fileCount: number,
  prospectId: string,
  selectedLevel: string | null,
) {
  const extraction = await generateObject({
    model: anthropic('claude-sonnet-4-20250514'),
    schema: zodSchema(extractedContractSchema),
    messages: [{
      role: 'user',
      content: [
        ...contentParts,
        {
          type: 'text',
          text: `Analyse ce${fileCount > 1 ? 's' : ''} document${fileCount > 1 ? 's' : ''} d'assurance santé / mutuelle et extrais toutes les garanties visibles.

IMPORTANT — Détection des niveaux de couverture :
- Si le document présente PLUSIEURS COLONNES de niveaux (ex: "Base", "Base + Option 1", "Base + Option 2", "Confort", "Premium", etc.), extrais les garanties de CHAQUE colonne comme un niveau distinct dans coverage_levels.
- Si le document n'a qu'une seule colonne de valeurs, crée un seul niveau dans coverage_levels.
- Le nom de chaque niveau doit correspondre exactement à l'en-tête de colonne du document.

IMPORTANT — Détection des pages :
- Cherche une indication de pagination (ex: "Page 1 sur 5", "1/6", "Page 1 of 5").
- detected_pages = nombre de pages que tu peux voir dans les documents fournis.
- total_pages = nombre total de pages indiqué par le document (null si non indiqué).

IMPORTANT — Catégories manquantes :
- Les catégories attendues pour une mutuelle santé complète sont : hospitalisation, soins_courants, optique, dentaire, medecine_douce, prevention.
- Si certaines catégories sont absentes du document, liste-les dans missing_categories.

Pour chaque garantie, extrais :
- La catégorie (hospitalisation, soins_courants, optique, dentaire, medecine_douce, prevention)
- L'intitulé exact
- La valeur de remboursement (en % BRSS, % BR, en euros, en forfait, etc.)
- Les éventuelles conditions ou limites

Identifie aussi : le nom de l'assureur, le nom du produit/contrat, le prix mensuel si visible.
Évalue ta confiance globale dans l'extraction.`,
        },
      ],
    }],
  })

  const ext = extraction.object
  console.log(`[Analyze] Mutuelle extraction: ${ext.coverage_levels.length} levels, ${ext.coverage_levels.reduce((s, l) => s + l.guarantees.length, 0)} guarantees (confidence: ${ext.confidence})`)

  if (ext.coverage_levels.length > 1 && !selectedLevel) {
    return {
      document_type: 'mutuelle' as const,
      extraction: ext,
      comparison: null,
      prospectId,
      needsLevelSelection: true,
      availableLevels: ext.coverage_levels.map(l => l.name),
    }
  }

  const chosenLevel: CoverageLevel = ext.coverage_levels.length > 1
    ? ext.coverage_levels.find(l => l.name === selectedLevel) ?? ext.coverage_levels[0]
    : ext.coverage_levels[0]

  const extractedGuaranteesText = chosenLevel.guarantees
    .map(g => `- [${g.category}] ${g.label}: ${g.value}${g.notes ? ` (${g.notes})` : ''}`)
    .join('\n')

  const metlifeContext = buildMetLifeMutuelleContext()

  const missingNote = ext.missing_categories.length > 0
    ? `\n\nATTENTION : les catégories suivantes sont ABSENTES du document fourni : ${ext.missing_categories.join(', ')}. Pour les garanties MetLife dans ces catégories, utilise current_value = "Information manquante" et verdict = "missing_info". Ne JAMAIS utiliser "Non couvert" quand l'information est simplement absente du document.`
    : ''

  const comparison = await generateObject({
    model: anthropic('claude-sonnet-4-20250514'),
    schema: zodSchema(comparisonResultSchema),
    messages: [{
      role: 'user',
      content: `Compare les garanties du contrat actuel avec les 2 produits MetLife.

<contrat_actuel>
Assureur: ${ext.insurer}
Produit: ${ext.product_name}
Niveau sélectionné: ${chosenLevel.name}
${ext.monthly_price ? `Prix: ${ext.monthly_price}` : ''}
Garanties:
${extractedGuaranteesText}
</contrat_actuel>

<produits_metlife>
${metlifeContext}
</produits_metlife>

document_type = "mutuelle"

Pour chaque garantie du contrat actuel, trouve l'équivalent chez MetLife et compare.
Ajoute aussi les garanties MetLife qui n'ont pas d'équivalent dans le contrat actuel.

RÈGLE CRITIQUE sur "Information manquante" vs "Non couvert" :
- Si une garantie est EXPLICITEMENT absente ou exclue dans le contrat actuel → current_value = "Non couvert", verdict = "better"
- Si une garantie n'apparaît pas dans le document parce que les PAGES MANQUENT ou que l'information n'a pas été fournie → current_value = "Information manquante", verdict = "missing_info"
- Ne JAMAIS confondre les deux cas.${missingNote}

Pour le verdict, compare MetLife Premium avec l'actuel :
- "better" si MetLife Premium offre une meilleure couverture
- "equal" si c'est équivalent
- "worse" si l'actuel est meilleur
- "not_comparable" si les garanties ne sont pas directement comparables
- "missing_info" si l'information est manquante dans le document actuel

column_headers: { current: "Votre contrat", col2: "Essentiel", col3: "Premium" }

Donne un résumé factuel et une recommandation personnalisée.
Ne mentionne AUCUN montant en euros dans le summary ni la recommendation — réfère au tableau pour les détails.`,
    }],
  })

  console.log(`[Analyze] Mutuelle comparison: ${comparison.object.rows.length} rows`)

  return {
    document_type: 'mutuelle' as const,
    extraction: ext,
    comparison: comparison.object,
    prospectId,
    selectedLevel: chosenLevel.name,
    needsLevelSelection: false,
  }
}

async function analyzePrevoyance(
  anthropic: ReturnType<typeof getAnthropic>,
  contentParts: ContentPart[],
  fileCount: number,
  prospectId: string,
) {
  const extraction = await generateObject({
    model: anthropic('claude-sonnet-4-20250514'),
    schema: zodSchema(extractedPrevoyanceSchema),
    messages: [{
      role: 'user',
      content: [
        ...contentParts,
        {
          type: 'text',
          text: `Analyse ce${fileCount > 1 ? 's' : ''} document${fileCount > 1 ? 's' : ''} de prévoyance / protection de revenus et extrais toutes les informations.

Ce document concerne la PRÉVOYANCE (arrêt de travail, invalidité, décès) — pas la complémentaire santé.

Extrais :
1. L'assureur et le nom du produit
2. La profession ciblée et la caisse de rattachement (SSI, CIPAV, CNBF, CARMF, etc.)
3. Le profil d'exemple utilisé (âge, situation familiale, revenu mensuel) s'il est mentionné

Pour chaque couverture, extrais :
- category: "itt" (arrêt de travail / incapacité temporaire), "invalidite", "deces", ou "frais_generaux"
- label: intitulé de la garantie
- regime_obligatoire: ce que verse le Régime Obligatoire
- concurrent_value: la valeur proposée par ce contrat concurrent (total ou complément)
- conditions: délai de carence, franchise, durée, etc.

Extrais aussi :
- Les avantages listés
- L'éligibilité Madelin
- Le prix/cotisation si visible

Sois précis sur les montants : distingue les montants journaliers (€/jour) des montants mensuels (€/mois).
Indique les périodes : "du 4ème au 90ème jour", "à partir du 91ème jour", etc.`,
        },
      ],
    }],
  })

  const ext = extraction.object
  console.log(`[Analyze] Prévoyance extraction: ${ext.coverages.length} coverages for ${ext.target_profession} (${ext.caisse}) — confidence: ${ext.confidence}`)

  const prevoyanceContext = buildPrevoyanceReferenceContext()

  const coveragesText = ext.coverages
    .map(c => `- [${c.category}] ${c.label}: RO=${c.regime_obligatoire}${c.concurrent_value ? `, Concurrent=${c.concurrent_value}` : ''}${c.conditions ? ` (${c.conditions})` : ''}`)
    .join('\n')

  const comparison = await generateObject({
    model: anthropic('claude-sonnet-4-20250514'),
    schema: zodSchema(comparisonResultSchema),
    messages: [{
      role: 'user',
      content: `Compare l'offre de prévoyance concurrente avec les solutions MetLife Super Novaterm Prévoyance.

<offre_concurrente>
Assureur: ${ext.insurer}
Produit: ${ext.product_name}
Profession ciblée: ${ext.target_profession}
Caisse: ${ext.caisse || 'Non précisée'}
${ext.monthly_price ? `Cotisation: ${ext.monthly_price}` : ''}
${ext.example_profile ? `Profil exemple: ${ext.example_profile.age ? `${ext.example_profile.age} ans` : ''}${ext.example_profile.situation ? `, ${ext.example_profile.situation}` : ''}${ext.example_profile.revenu_mensuel ? `, ${ext.example_profile.revenu_mensuel}€/mois` : ''}` : ''}

Couvertures:
${coveragesText}

Avantages: ${ext.advantages.join(' | ')}
Madelin: ${ext.madelin_eligible ? 'Éligible' : ext.madelin_eligible === false ? 'Non éligible' : 'Non précisé'}
</offre_concurrente>

<metlife_prevoyance>
${prevoyanceContext}
</metlife_prevoyance>

document_type = "prevoyance"

IMPORTANT — Structure du comparatif :
- category : utilise "itt", "invalidite", "deces", "frais_generaux", "services", "fiscal"
- current_value : valeur de l'offre concurrente
- metlife_essentiel : ce que couvre le Régime Obligatoire SEUL (sans complément)
- metlife_premium : ce que couvre le Régime Obligatoire + Complément MetLife Super Novaterm
- verdict : compare MetLife (RO + complément) vs le concurrent

column_headers: { current: "Offre concurrente", col2: "Régime Obligatoire", col3: "RO + MetLife" }

Utilise les exemples chiffrés MetLife correspondant à la profession détectée.
Si la profession exacte n'est pas dans les exemples MetLife, utilise le profil le plus proche.

Pour le verdict :
- "better" si MetLife (RO + complément) offre une meilleure couverture que le concurrent
- "equal" si équivalent
- "worse" si le concurrent est meilleur
- "not_comparable" si pas directement comparable
- "missing_info" si l'information manque

Ajoute des lignes pour les services inclus MetLife (protection juridique, coaching, conciergerie décès) et l'avantage fiscal Madelin.

Donne un résumé factuel et une recommandation personnalisée mentionnant le nom du produit MetLife adapté.
Ne mentionne AUCUN montant en euros dans le summary ni la recommendation.`,
    }],
  })

  console.log(`[Analyze] Prévoyance comparison: ${comparison.object.rows.length} rows`)

  return {
    document_type: 'prevoyance' as const,
    extraction: ext,
    comparison: comparison.object,
    prospectId,
    needsLevelSelection: false,
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ prospectId: string }> }
) {
  const { prospectId } = await params
  const formData = await req.formData()

  const files = formData.getAll('documents') as File[]
  const singleFile = formData.get('document') as File | null
  const allFiles = files.length > 0 ? files : (singleFile ? [singleFile] : [])
  const selectedLevel = formData.get('selectedLevel') as string | null

  if (allFiles.length === 0) {
    return Response.json({ error: 'Aucun document fourni' }, { status: 400 })
  }

  const contentParts: ContentPart[] = []
  let totalSize = 0

  for (const file of allFiles) {
    if (!VALID_TYPES.includes(file.type)) {
      return Response.json(
        { error: `Format non supporté pour "${file.name}". Formats acceptés : JPEG, PNG, WebP, GIF, PDF` },
        { status: 400 }
      )
    }
    totalSize += file.size
    if (totalSize > MAX_FILE_SIZE) {
      return Response.json({ error: 'Fichiers trop volumineux (max 20 Mo au total)' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const base64 = Buffer.from(bytes).toString('base64')

    if (file.type === 'application/pdf') {
      contentParts.push({
        type: 'file',
        data: `data:application/pdf;base64,${base64}`,
        mediaType: 'application/pdf',
      })
    } else {
      contentParts.push({
        type: 'image',
        image: `data:${file.type as ImageMediaType};base64,${base64}`,
      })
    }

    console.log(`[Analyze] Prospect ${prospectId}: processing ${file.name} (${file.type}, ${(file.size / 1024).toFixed(0)}KB)`)
  }

  try {
    const anthropic = getAnthropic()

    const docType = await detectDocumentType(anthropic, contentParts, allFiles.length)

    if (docType === 'prevoyance') {
      const result = await analyzePrevoyance(anthropic, contentParts, allFiles.length, prospectId)
      return Response.json(result)
    }

    const result = await analyzeMutuelle(anthropic, contentParts, allFiles.length, prospectId, selectedLevel)
    return Response.json(result)
  } catch (error) {
    console.error('[Analyze] Error:', error)

    let status = 500
    let errorMessage = 'Erreur lors de l\'analyse du document'

    if (error instanceof Error) {
      if (error.message.includes('rate') || error.message.includes('429')) status = 429
      else if (error.message.includes('401')) status = 401
      errorMessage = error.message
    }

    return Response.json({ error: errorMessage }, { status })
  }
}
