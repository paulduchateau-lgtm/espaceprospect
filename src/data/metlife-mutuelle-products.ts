export interface GuaranteeDetail {
  category: string
  label: string
  brss_percent?: number
  fixed_amount?: number
  unit: 'percent_brss' | 'euro' | 'euro_per_year' | 'euro_per_2years' | 'forfait' | 'percent_fr'
  notes?: string
}

export interface MutuelleProduct {
  id: string
  name: string
  tier: string
  target: string
  monthly_price_range: { solo: string; couple: string; family: string }
  guarantees: {
    hospitalisation: GuaranteeDetail[]
    soins_courants: GuaranteeDetail[]
    optique: GuaranteeDetail[]
    dentaire: GuaranteeDetail[]
    medecine_douce: GuaranteeDetail[]
    prevention: GuaranteeDetail[]
  }
  highlights: string[]
  services_included: string[]
}

export const metlifeProducts: MutuelleProduct[] = [
  {
    id: 'metlife-sante-essentiel',
    name: 'MetLife Santé Essentiel',
    tier: 'Base',
    target: 'TNS et salariés souhaitant une couverture solide à prix maîtrisé',
    monthly_price_range: { solo: '45-65€', couple: '85-120€', family: '110-160€' },
    guarantees: {
      hospitalisation: [
        { category: 'Hospitalisation', label: 'Frais de séjour (secteur conventionné)', brss_percent: 200, unit: 'percent_brss' },
        { category: 'Hospitalisation', label: 'Honoraires chirurgicaux (OPTAM)', brss_percent: 250, unit: 'percent_brss' },
        { category: 'Hospitalisation', label: 'Honoraires chirurgicaux (non-OPTAM)', brss_percent: 200, unit: 'percent_brss' },
        { category: 'Hospitalisation', label: 'Chambre particulière', fixed_amount: 60, unit: 'euro', notes: 'par jour, max 60 jours/an' },
        { category: 'Hospitalisation', label: 'Forfait journalier hospitalier', fixed_amount: 20, unit: 'euro', notes: 'prise en charge intégrale' },
        { category: 'Hospitalisation', label: 'Transport sanitaire', brss_percent: 100, unit: 'percent_brss' },
      ],
      soins_courants: [
        { category: 'Soins courants', label: 'Consultation généraliste (secteur 1)', brss_percent: 200, unit: 'percent_brss', notes: '50€ remboursés' },
        { category: 'Soins courants', label: 'Consultation spécialiste (OPTAM)', brss_percent: 250, unit: 'percent_brss' },
        { category: 'Soins courants', label: 'Consultation spécialiste (non-OPTAM)', brss_percent: 200, unit: 'percent_brss' },
        { category: 'Soins courants', label: 'Analyses et examens de laboratoire', brss_percent: 200, unit: 'percent_brss' },
        { category: 'Soins courants', label: 'Radiologie', brss_percent: 200, unit: 'percent_brss' },
        { category: 'Soins courants', label: 'Pharmacie (vignette blanche)', brss_percent: 100, unit: 'percent_brss' },
        { category: 'Soins courants', label: 'Pharmacie (vignette bleue)', brss_percent: 100, unit: 'percent_brss' },
        { category: 'Soins courants', label: 'Auxiliaires médicaux (kiné, infirmier)', brss_percent: 200, unit: 'percent_brss' },
      ],
      optique: [
        { category: 'Optique', label: 'Monture', fixed_amount: 100, unit: 'euro', notes: 'par période de 2 ans' },
        { category: 'Optique', label: 'Verres simples (paire)', fixed_amount: 200, unit: 'euro_per_2years' },
        { category: 'Optique', label: 'Verres complexes (paire)', fixed_amount: 350, unit: 'euro_per_2years' },
        { category: 'Optique', label: 'Verres très complexes (paire)', fixed_amount: 450, unit: 'euro_per_2years' },
        { category: 'Optique', label: 'Lentilles (y compris jetables)', fixed_amount: 150, unit: 'euro_per_year' },
        { category: 'Optique', label: 'Équipement 100% Santé', fixed_amount: 0, unit: 'euro', notes: 'Reste à charge zéro' },
      ],
      dentaire: [
        { category: 'Dentaire', label: 'Soins dentaires conservateurs', brss_percent: 200, unit: 'percent_brss' },
        { category: 'Dentaire', label: 'Prothèses dentaires (100% Santé)', fixed_amount: 0, unit: 'euro', notes: 'Reste à charge zéro' },
        { category: 'Dentaire', label: 'Prothèses dentaires (hors 100% Santé)', brss_percent: 250, unit: 'percent_brss' },
        { category: 'Dentaire', label: 'Implants dentaires', fixed_amount: 400, unit: 'euro_per_year', notes: 'par implant, max 2/an' },
        { category: 'Dentaire', label: 'Orthodontie (acceptée SS)', brss_percent: 200, unit: 'percent_brss' },
        { category: 'Dentaire', label: 'Orthodontie (refusée SS)', fixed_amount: 300, unit: 'euro_per_year' },
        { category: 'Dentaire', label: 'Parodontologie', fixed_amount: 200, unit: 'euro_per_year' },
      ],
      medecine_douce: [
        { category: 'Médecine douce', label: 'Ostéopathie', fixed_amount: 30, unit: 'euro', notes: '3 séances/an max' },
        { category: 'Médecine douce', label: 'Acupuncture', fixed_amount: 30, unit: 'euro', notes: '3 séances/an max' },
        { category: 'Médecine douce', label: 'Chiropractie', fixed_amount: 30, unit: 'euro', notes: '3 séances/an max' },
      ],
      prevention: [
        { category: 'Prévention', label: 'Sevrage tabagique', fixed_amount: 100, unit: 'euro_per_year' },
        { category: 'Prévention', label: 'Vaccins non remboursés', fixed_amount: 50, unit: 'euro_per_year' },
      ],
    },
    highlights: [
      'Couverture hospitalisation solide à 200-250% BRSS',
      'Optique : jusqu\'à 450€ pour verres très complexes',
      'Dentaire : implants couverts à 400€/implant',
      'Réseau de soins partenaire pour tarifs négociés',
    ],
    services_included: [
      'Tiers payant généralisé',
      'Téléconsultation 24h/24 incluse',
      'Réseau Santéclair (optique et dentaire)',
      'Application mobile de gestion',
    ],
  },
  {
    id: 'metlife-sante-premium',
    name: 'MetLife Santé Premium',
    tier: 'Renforcé',
    target: 'TNS et cadres souhaitant une couverture haut de gamme sans reste à charge',
    monthly_price_range: { solo: '75-110€', couple: '140-200€', family: '185-270€' },
    guarantees: {
      hospitalisation: [
        { category: 'Hospitalisation', label: 'Frais de séjour (secteur conventionné)', brss_percent: 300, unit: 'percent_brss' },
        { category: 'Hospitalisation', label: 'Honoraires chirurgicaux (OPTAM)', brss_percent: 350, unit: 'percent_brss' },
        { category: 'Hospitalisation', label: 'Honoraires chirurgicaux (non-OPTAM)', brss_percent: 300, unit: 'percent_brss' },
        { category: 'Hospitalisation', label: 'Chambre particulière', fixed_amount: 100, unit: 'euro', notes: 'par jour, max 90 jours/an' },
        { category: 'Hospitalisation', label: 'Forfait journalier hospitalier', fixed_amount: 20, unit: 'euro', notes: 'prise en charge intégrale' },
        { category: 'Hospitalisation', label: 'Transport sanitaire', brss_percent: 100, unit: 'percent_brss' },
        { category: 'Hospitalisation', label: 'Lit accompagnant (enfant < 12 ans)', fixed_amount: 40, unit: 'euro', notes: 'par jour' },
      ],
      soins_courants: [
        { category: 'Soins courants', label: 'Consultation généraliste (secteur 1)', brss_percent: 300, unit: 'percent_brss', notes: '75€ remboursés' },
        { category: 'Soins courants', label: 'Consultation spécialiste (OPTAM)', brss_percent: 350, unit: 'percent_brss' },
        { category: 'Soins courants', label: 'Consultation spécialiste (non-OPTAM)', brss_percent: 300, unit: 'percent_brss' },
        { category: 'Soins courants', label: 'Analyses et examens de laboratoire', brss_percent: 300, unit: 'percent_brss' },
        { category: 'Soins courants', label: 'Radiologie / IRM / Scanner', brss_percent: 300, unit: 'percent_brss' },
        { category: 'Soins courants', label: 'Pharmacie (vignette blanche)', brss_percent: 100, unit: 'percent_brss' },
        { category: 'Soins courants', label: 'Pharmacie (vignette bleue)', brss_percent: 100, unit: 'percent_brss' },
        { category: 'Soins courants', label: 'Auxiliaires médicaux (kiné, infirmier)', brss_percent: 300, unit: 'percent_brss' },
      ],
      optique: [
        { category: 'Optique', label: 'Monture', fixed_amount: 150, unit: 'euro', notes: 'par période de 2 ans' },
        { category: 'Optique', label: 'Verres simples (paire)', fixed_amount: 350, unit: 'euro_per_2years' },
        { category: 'Optique', label: 'Verres complexes (paire)', fixed_amount: 550, unit: 'euro_per_2years' },
        { category: 'Optique', label: 'Verres très complexes (paire)', fixed_amount: 700, unit: 'euro_per_2years' },
        { category: 'Optique', label: 'Lentilles (y compris jetables)', fixed_amount: 250, unit: 'euro_per_year' },
        { category: 'Optique', label: 'Chirurgie réfractive', fixed_amount: 500, unit: 'euro', notes: 'par œil, 1 fois dans la vie du contrat' },
        { category: 'Optique', label: 'Équipement 100% Santé', fixed_amount: 0, unit: 'euro', notes: 'Reste à charge zéro' },
      ],
      dentaire: [
        { category: 'Dentaire', label: 'Soins dentaires conservateurs', brss_percent: 300, unit: 'percent_brss' },
        { category: 'Dentaire', label: 'Prothèses dentaires (100% Santé)', fixed_amount: 0, unit: 'euro', notes: 'Reste à charge zéro' },
        { category: 'Dentaire', label: 'Prothèses dentaires (hors 100% Santé)', brss_percent: 350, unit: 'percent_brss' },
        { category: 'Dentaire', label: 'Implants dentaires', fixed_amount: 600, unit: 'euro_per_year', notes: 'par implant, max 3/an' },
        { category: 'Dentaire', label: 'Orthodontie (acceptée SS)', brss_percent: 300, unit: 'percent_brss' },
        { category: 'Dentaire', label: 'Orthodontie (refusée SS)', fixed_amount: 600, unit: 'euro_per_year', notes: 'par semestre, max 4 semestres' },
        { category: 'Dentaire', label: 'Parodontologie', fixed_amount: 400, unit: 'euro_per_year' },
        { category: 'Dentaire', label: 'Inlay / Onlay', brss_percent: 300, unit: 'percent_brss' },
      ],
      medecine_douce: [
        { category: 'Médecine douce', label: 'Ostéopathie', fixed_amount: 50, unit: 'euro', notes: '5 séances/an max' },
        { category: 'Médecine douce', label: 'Acupuncture', fixed_amount: 50, unit: 'euro', notes: '5 séances/an max' },
        { category: 'Médecine douce', label: 'Chiropractie', fixed_amount: 50, unit: 'euro', notes: '5 séances/an max' },
        { category: 'Médecine douce', label: 'Naturopathie', fixed_amount: 40, unit: 'euro', notes: '3 séances/an max' },
        { category: 'Médecine douce', label: 'Sophrologie / Hypnothérapie', fixed_amount: 40, unit: 'euro', notes: '3 séances/an max' },
        { category: 'Médecine douce', label: 'Diététique / Nutrition', fixed_amount: 40, unit: 'euro', notes: '3 séances/an max' },
      ],
      prevention: [
        { category: 'Prévention', label: 'Sevrage tabagique', fixed_amount: 200, unit: 'euro_per_year' },
        { category: 'Prévention', label: 'Vaccins non remboursés', fixed_amount: 100, unit: 'euro_per_year' },
        { category: 'Prévention', label: 'Bilan de santé', fixed_amount: 150, unit: 'euro_per_year', notes: '1 bilan/an' },
        { category: 'Prévention', label: 'Coaching santé (nutrition, sport)', fixed_amount: 200, unit: 'euro_per_year' },
      ],
    },
    highlights: [
      'Couverture hospitalisation maximale à 300-350% BRSS',
      'Optique : jusqu\'à 700€ pour verres très complexes + chirurgie réfractive',
      'Dentaire : implants à 600€/implant (3/an) + orthodontie adulte',
      '6 disciplines de médecine douce couvertes (5 séances/an)',
      'Prévention renforcée avec bilan de santé et coaching',
    ],
    services_included: [
      'Tiers payant généralisé',
      'Téléconsultation 24h/24 incluse',
      'Réseau Santéclair (optique et dentaire)',
      'Application mobile de gestion',
      'Conciergerie santé dédiée',
      'Second avis médical en 48h',
      'Coaching sommeil et nutrition inclus',
    ],
  },
]

export function getProductById(id: string): MutuelleProduct | undefined {
  return metlifeProducts.find(p => p.id === id)
}

export function formatGuaranteeValue(g: GuaranteeDetail): string {
  if (g.unit === 'percent_brss') return `${g.brss_percent}% BRSS`
  if (g.unit === 'percent_fr') return `${g.brss_percent}% FR`
  if (g.unit === 'euro') return `${g.fixed_amount}€`
  if (g.unit === 'euro_per_year') return `${g.fixed_amount}€/an`
  if (g.unit === 'euro_per_2years') return `${g.fixed_amount}€/2 ans`
  if (g.unit === 'forfait') return `${g.fixed_amount}€ (forfait)`
  return ''
}
