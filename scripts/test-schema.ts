import { dashboardSchema } from '../src/lib/schemas';

// Valid dashboard payload -- simulates what Claude would produce
const validPayload = {
  risks: [
    {
      id: 'arret-travail',
      label: 'Arret de travail prolonge',
      severity: 'high' as const,
      description:
        'En tant que kinesitherapeute liberal, un arret de travail signifie une perte totale de revenus sans indemnites de la Securite sociale suffisantes.',
    },
    {
      id: 'invalidite',
      label: 'Invalidite permanente',
      severity: 'medium' as const,
      description:
        "Le risque d'invalidite est eleve pour les professions medicales avec des gestes repetitifs.",
    },
  ],
  products: [
    {
      id: 'super-novaterm',
      name: 'Super Novaterm',
      relevance:
        'Couvre le risque deces et protege votre famille en cas de disparition prematuree.',
      coverageType: 'deces',
      sourceIds: [1, 3],
    },
    {
      id: 'prevoyance-tns',
      name: 'Prevoyance TNS MetLife',
      relevance:
        "Indemnites journalieres en cas d'arret de travail, specifiquement concu pour les TNS.",
      coverageType: 'incapacite',
      sourceIds: [2, 4],
    },
  ],
  partners: [
    {
      id: 'doado' as const,
      relevance:
        'Prevention des TMS pour les kinesitherapeutes qui pratiquent des gestes repetitifs.',
    },
  ],
  resources: [
    {
      title: 'Guide prevoyance TNS',
      url: 'https://www.metlife.fr/prevoyance-tns/',
      type: 'guide' as const,
    },
  ],
  profile: {
    profession: 'Kinesitherapeute liberal',
    sector: 'Sante / Profession liberale reglementee',
    concerns: [
      "Perte de revenus en cas d'arret",
      'Protection de la famille',
    ],
  },
};

// Invalid payload -- missing required fields
const invalidPayload = {
  risks: [{ id: 'test' }], // missing label, severity, description
  products: [],
  profile: { profession: 'test' }, // missing sector, concerns
};

console.log('Testing valid payload...');
const validResult = dashboardSchema.safeParse(validPayload);
if (validResult.success) {
  console.log('  Valid payload: PASS');
  console.log(`  Risks: ${validResult.data.risks.length}`);
  console.log(`  Products: ${validResult.data.products.length}`);
  console.log(`  Partners: ${validResult.data.partners?.length ?? 0}`);
  console.log(`  Resources: ${validResult.data.resources?.length ?? 0}`);
} else {
  console.error('  Valid payload: FAIL', validResult.error.format());
  process.exit(1);
}

console.log('\nTesting invalid payload...');
const invalidResult = dashboardSchema.safeParse(invalidPayload);
if (!invalidResult.success) {
  console.log('  Invalid payload correctly rejected: PASS');
  console.log(`  Errors: ${invalidResult.error.issues.length} issues found`);
} else {
  console.error('  Invalid payload should have been rejected: FAIL');
  process.exit(1);
}

console.log('\nSchema validation: ALL PASS');
