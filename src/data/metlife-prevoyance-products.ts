export interface PrevoyanceExample {
  profession: string
  caisse: string
  age: number
  situation: string
  revenu_mensuel: number
  itt: {
    regime_obligatoire: string
    metlife_complement: string
    total_couvert: string
    periode_carence: string
    periode_apres_carence: string
  }
  invalidite: {
    regime_obligatoire_100: string
    metlife_complement_100: string
    total_100: string
    regime_obligatoire_66: string
    metlife_complement_66: string
    total_66: string
  }
}

export interface PrevoyanceProduct {
  id: string
  name: string
  product_line: string
  target_professions: string[]
  advantages: string[]
  services_included: string[]
  madelin: {
    eligible: boolean
    deduction_rate: string
    details: string
  }
  coverage: {
    itt: {
      description: string
      type: string
      max_daily: string
    }
    invalidite: {
      description: string
      max_monthly: string
    }
    deces: {
      description: string
      max_capital: string
    }
    frais_generaux: {
      description: string
      max_daily: string
    }
    options: string[]
  }
  examples: PrevoyanceExample[]
}

export const metlifePrevoyanceProducts: PrevoyanceProduct[] = [
  {
    id: 'snp-tns-taxi',
    name: 'Super Novaterm Prévoyance — Chauffeurs de taxi',
    product_line: 'Super Novaterm Prévoyance',
    target_professions: ['chauffeur de taxi', 'taxi', 'vtc'],
    advantages: [
      'Solution complète et adaptable grâce aux options',
      'Large choix dans le montant et le type de garanties (indemnitaire ou forfaitaire)',
      'Contrat irrévocable',
      'Formalités médicales simplifiées',
      'Services inclus : protection juridique, coaching nutritionnel, conciergerie décès, application mal de dos',
      'Contrat éligible à la loi Madelin',
    ],
    services_included: [
      'Protection juridique',
      'Coaching nutritionnel',
      'Conciergerie décès',
      'Application contre le mal de dos',
    ],
    madelin: {
      eligible: true,
      deduction_rate: '3,75%',
      details: 'Cotisations déductibles à hauteur de 3,75% du bénéfice imposable professionnel majoré de 7% du PASS, sans que cela n\'excède 3% de 8 PASS',
    },
    coverage: {
      itt: {
        description: 'Indemnité Journalière en cas d\'arrêt de travail temporaire',
        type: 'Indemnitaire ou forfaitaire',
        max_daily: '1 000€/jour',
      },
      invalidite: {
        description: 'Rente mensuelle en cas d\'invalidité permanente',
        max_monthly: '300€/jour en invalidité ou incapacité',
      },
      deces: {
        description: 'Capital décès + PTIA + options Rente Éducation',
        max_capital: '1,25 million d\'euros',
      },
      frais_generaux: {
        description: 'Prise en charge des frais généraux professionnels',
        max_daily: '600€',
      },
      options: [
        'Base décès/PTIA',
        'Rente Éducation aux Frais Généraux',
        'Choix possible du niveau de garantie pour la majorité des options',
        'Choix entre indemnitaire pondérée ou forfaitaire pour ITT, IPP et IPT',
      ],
    },
    examples: [
      {
        profession: 'Chauffeur de taxi',
        caisse: 'SSI',
        age: 55,
        situation: 'Marié',
        revenu_mensuel: 3500,
        itt: {
          regime_obligatoire: '50€/jour du 4ème au 90ème jour, puis 0€',
          metlife_complement: '65€/jour du 4ème au 363ème jour, puis 115€/jour à partir du 364ème jour',
          total_couvert: '115€/jour',
          periode_carence: 'Du 4ème jour au 363ème jour : 50€ RO + 65€ MetLife = 115€',
          periode_apres_carence: 'À partir du 364ème jour : 0€ RO + 115€ MetLife = 115€',
        },
        invalidite: {
          regime_obligatoire_100: '1 297€/mois',
          metlife_complement_100: '2 203€/mois',
          total_100: '3 500€/mois',
          regime_obligatoire_66: '778€/mois',
          metlife_complement_66: '2 722€/mois',
          total_66: '3 500€/mois',
        },
      },
    ],
  },
  {
    id: 'snp-tns-osteopathe',
    name: 'Super Novaterm Prévoyance — Ostéopathes',
    product_line: 'Super Novaterm Prévoyance',
    target_professions: ['ostéopathe', 'kinésithérapeute', 'professionnel de santé'],
    advantages: [
      'Solution complète et adaptable grâce aux options',
      'Large choix dans le montant et le type de garanties (indemnitaire ou forfaitaire)',
      'Contrat irrévocable',
      'Formalités médicales simplifiées',
      'Services inclus : protection juridique, coaching nutritionnel, conciergerie décès, application mal de dos',
      'Contrat éligible à la loi Madelin',
    ],
    services_included: [
      'Protection juridique',
      'Coaching nutritionnel',
      'Conciergerie décès',
      'Application contre le mal de dos',
    ],
    madelin: {
      eligible: true,
      deduction_rate: '3,75%',
      details: 'Cotisations déductibles à hauteur de 3,75% du bénéfice imposable professionnel majoré de 7% du PASS, sans que cela n\'excède 3% de 8 PASS',
    },
    coverage: {
      itt: {
        description: 'Indemnité Journalière en cas d\'arrêt de travail temporaire',
        type: 'Indemnitaire ou forfaitaire',
        max_daily: '1 000€/jour',
      },
      invalidite: {
        description: 'Rente mensuelle en cas d\'invalidité permanente',
        max_monthly: '300€/jour en invalidité ou incapacité',
      },
      deces: {
        description: 'Capital décès + PTIA + options Rente Éducation',
        max_capital: '1,25 million d\'euros',
      },
      frais_generaux: {
        description: 'Prise en charge des frais généraux professionnels',
        max_daily: '600€',
      },
      options: [
        'Base décès/PTIA',
        'Rente Éducation aux Frais Généraux',
        'Choix possible du niveau de garantie pour la majorité des options',
        'Choix entre indemnitaire pondérée ou forfaitaire pour ITT, IPP et IPT',
      ],
    },
    examples: [
      {
        profession: 'Ostéopathe',
        caisse: 'CIPAV',
        age: 36,
        situation: 'Célibataire',
        revenu_mensuel: 2500,
        itt: {
          regime_obligatoire: '35€/jour du 4ème au 90ème jour, puis 0€',
          metlife_complement: '47€/jour du 4ème au 90ème jour, puis 82€/jour à partir du 91ème jour',
          total_couvert: '82€/jour',
          periode_carence: 'Du 4ème au 90ème jour : 35€ RO + 47€ MetLife = 82€',
          periode_apres_carence: 'À partir du 91ème jour : 0€ RO + 82€ MetLife = 82€',
        },
        invalidite: {
          regime_obligatoire_100: '1 165€/mois',
          metlife_complement_100: '1 335€/mois',
          total_100: '2 500€/mois',
          regime_obligatoire_66: '769€/mois',
          metlife_complement_66: '1 731€/mois',
          total_66: '2 500€/mois',
        },
      },
      {
        profession: 'Ostéopathe',
        caisse: 'CIPAV',
        age: 46,
        situation: 'Marié',
        revenu_mensuel: 5000,
        itt: {
          regime_obligatoire: '67€/jour du 4ème au 90ème jour, puis 0€',
          metlife_complement: '97€/jour du 4ème au 90ème jour, puis 137€/jour à partir du 91ème jour',
          total_couvert: '137€/jour',
          periode_carence: 'Du 4ème au 90ème jour : 67€ RO + 97€ MetLife = 137€ (en fonction de la rémunération 5000€/mois)',
          periode_apres_carence: 'À partir du 91ème jour : 0€ RO + 137€ MetLife = 137€',
        },
        invalidite: {
          regime_obligatoire_100: '2 130€/mois',
          metlife_complement_100: '2 870€/mois',
          total_100: '5 000€/mois',
          regime_obligatoire_66: '1 406€/mois',
          metlife_complement_66: '3 594€/mois',
          total_66: '5 000€/mois',
        },
      },
    ],
  },
  {
    id: 'snp-tns-avocat',
    name: 'Super Novaterm Prévoyance — Avocats',
    product_line: 'Super Novaterm Prévoyance',
    target_professions: ['avocat', 'juriste', 'notaire'],
    advantages: [
      'Solution complète et adaptable grâce aux options',
      'Large choix dans le montant et le type de garanties (indemnitaire ou forfaitaire)',
      'Contrat irrévocable',
      'Formalités médicales simplifiées',
      'Services inclus : protection juridique, coaching nutritionnel, conciergerie décès, application mal de dos',
      'Contrat éligible à la loi Madelin',
    ],
    services_included: [
      'Protection juridique',
      'Coaching nutritionnel',
      'Conciergerie décès',
      'Application contre le mal de dos',
    ],
    madelin: {
      eligible: true,
      deduction_rate: '3,75%',
      details: 'Cotisations déductibles à hauteur de 3,75% du bénéfice imposable professionnel majoré de 7% du PASS, sans que cela n\'excède 3% de 8 PASS',
    },
    coverage: {
      itt: {
        description: 'Indemnité Journalière en cas d\'arrêt de travail temporaire',
        type: 'Indemnitaire ou forfaitaire',
        max_daily: '1 000€/jour',
      },
      invalidite: {
        description: 'Rente mensuelle en cas d\'invalidité permanente',
        max_monthly: '300€/jour en invalidité ou incapacité',
      },
      deces: {
        description: 'Capital décès + PTIA + options Rente Éducation',
        max_capital: '1,25 million d\'euros',
      },
      frais_generaux: {
        description: 'Prise en charge des frais généraux professionnels',
        max_daily: '600€',
      },
      options: [
        'Base décès/PTIA',
        'Rente Éducation aux Frais Généraux',
        'Choix possible du niveau de garantie pour la majorité des options',
        'Choix entre indemnitaire pondérée ou forfaitaire pour ITT, IPP et IPT',
      ],
    },
    examples: [
      {
        profession: 'Avocat',
        caisse: 'CNBF',
        age: 42,
        situation: 'Non précisé',
        revenu_mensuel: 10000,
        itt: {
          regime_obligatoire: '90€/jour du 16ème au 90ème jour, puis 90€/jour du 91ème au 1095ème jour',
          metlife_complement: '239€/jour',
          total_couvert: '329€/jour',
          periode_carence: 'Du 16ème au 90ème jour : 90€ RO + 239€ MetLife = 329€',
          periode_apres_carence: 'Du 91ème au 1095ème jour : 90€ RO + 239€ MetLife = 329€',
        },
        invalidite: {
          regime_obligatoire_100: '2 738€/mois',
          metlife_complement_100: '7 262€/mois',
          total_100: '10 000€/mois',
          regime_obligatoire_66: '693€/mois',
          metlife_complement_66: '9 307€/mois',
          total_66: '10 000€/mois',
        },
      },
    ],
  },
]

export function findPrevoyanceByProfession(profession: string): PrevoyanceProduct | undefined {
  const normalized = profession.toLowerCase()
  return metlifePrevoyanceProducts.find(p =>
    p.target_professions.some(t => normalized.includes(t))
  )
}

export function buildPrevoyanceReferenceContext(): string {
  return metlifePrevoyanceProducts.map(product => {
    const examplesText = product.examples.map(ex => `
  <exemple profession="${ex.profession}" caisse="${ex.caisse}" age="${ex.age}" situation="${ex.situation}" revenu="${ex.revenu_mensuel}€/mois">
    ITT:
      - Régime Obligatoire: ${ex.itt.regime_obligatoire}
      - Complément MetLife: ${ex.itt.metlife_complement}
      - Total couvert: ${ex.itt.total_couvert}
    Invalidité 100%:
      - Régime Obligatoire: ${ex.invalidite.regime_obligatoire_100}/mois
      - Complément MetLife: ${ex.invalidite.metlife_complement_100}/mois
      - Total: ${ex.invalidite.total_100}/mois
    Invalidité ≥66%:
      - Régime Obligatoire: ${ex.invalidite.regime_obligatoire_66}/mois
      - Complément MetLife: ${ex.invalidite.metlife_complement_66}/mois
      - Total: ${ex.invalidite.total_66}/mois
  </exemple>`).join('\n')

    return `<metlife_prevoyance id="${product.id}" name="${product.name}">
Produit: ${product.product_line}
Professions ciblées: ${product.target_professions.join(', ')}

Couvertures:
- ITT: ${product.coverage.itt.description} — max ${product.coverage.itt.max_daily}
- Invalidité: ${product.coverage.invalidite.description} — max ${product.coverage.invalidite.max_monthly}
- Décès: ${product.coverage.deces.description} — max ${product.coverage.deces.max_capital}
- Frais généraux: ${product.coverage.frais_generaux.description} — max ${product.coverage.frais_generaux.max_daily}

Options: ${product.coverage.options.join(' | ')}

Avantages: ${product.advantages.join(' | ')}

Madelin: ${product.madelin.eligible ? 'Éligible' : 'Non éligible'} — ${product.madelin.details}

Exemples chiffrés:${examplesText}
</metlife_prevoyance>`
  }).join('\n\n')
}
