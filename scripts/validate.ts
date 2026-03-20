import { createClient } from '@libsql/client';
import { retrieveRelevantChunks } from '../src/lib/rag';

const TEST_QUERIES = [
  {
    name: 'TNS kiné incapacité',
    query: 'kiné libéral risques arrêt de travail',
    expectProductTypes: ['prevoyance-tns'],
    expectGuarantees: ['incapacite'],
  },
  {
    name: 'Décès chef entreprise',
    query: 'protection décès chef entreprise',
    expectProductTypes: ['prevoyance-tns', 'prevoyance-pro'],
    expectGuarantees: ['deces', 'capital-deces'],
  },
  {
    name: 'Assurance emprunteur',
    query: 'assurance prêt immobilier couverture',
    expectProductTypes: ['emprunteur'],
    expectGuarantees: ['emprunteur'],
  },
  {
    name: 'Artisan invalidité',
    query: 'artisan boulanger couverture invalidité',
    expectProductTypes: ['prevoyance-tns'],
    expectGuarantees: ['invalidite'],
  },
  {
    name: 'Frais généraux TNS',
    query: 'indemnisation frais généraux arrêt activité indépendant',
    expectProductTypes: ['prevoyance-tns'],
    expectGuarantees: ['frais-generaux'],
  },
];

async function validate() {
  const client = createClient({
    url: process.env.TURSO_DATABASE_URL || 'file:local.db',
    authToken: process.env.TURSO_AUTH_TOKEN,
  });

  console.log('=== RAG Validation ===\n');

  // 1. Check chunk count
  const countResult = await client.execute(
    'SELECT COUNT(*) as cnt FROM content_chunks'
  );
  const totalChunks = countResult.rows[0].cnt as number;
  console.log(`Total chunks in database: ${totalChunks}`);
  const chunkPass = totalChunks >= 100;
  console.log(`  Chunk count check (>= 100): ${chunkPass ? 'PASS' : 'FAIL'}\n`);

  // 2. Check all chunks have embeddings
  const embResult = await client.execute(
    'SELECT COUNT(*) as cnt FROM content_chunks WHERE embedding IS NOT NULL'
  );
  const embeddedChunks = embResult.rows[0].cnt as number;
  const embPass = embeddedChunks === totalChunks;
  console.log(`Chunks with embeddings: ${embeddedChunks}/${totalChunks}`);
  console.log(`  Embedding completeness: ${embPass ? 'PASS' : 'FAIL'}\n`);

  // 3. Check vector index exists
  const idxResult = await client.execute(
    "SELECT name FROM sqlite_master WHERE type='index' AND name='chunks_embedding_idx'"
  );
  const idxPass = idxResult.rows.length > 0;
  console.log(`Vector index exists: ${idxPass ? 'PASS' : 'FAIL'}\n`);

  // 4. Check product type distribution
  const typeResult = await client.execute(
    'SELECT product_type, COUNT(*) as cnt FROM content_chunks GROUP BY product_type'
  );
  console.log('Product type distribution:');
  for (const row of typeResult.rows) {
    console.log(`  ${row.product_type}: ${row.cnt}`);
  }
  console.log();

  // 5. Test similarity queries
  let queryPasses = 0;
  let queryTotal = 0;

  for (const test of TEST_QUERIES) {
    console.log(`--- Query: "${test.name}" ---`);
    console.log(`  "${test.query}"`);

    const results = await retrieveRelevantChunks(test.query, 5);

    const topProductTypes = results.slice(0, 3).map((r) => r.productType);
    const topGuarantees = results.slice(0, 3).flatMap((r) => r.guarantees);

    const hasExpectedProduct = test.expectProductTypes.some((pt) =>
      topProductTypes.includes(pt)
    );
    const hasExpectedGuarantee = test.expectGuarantees.some((g) =>
      topGuarantees.includes(g)
    );

    console.log(`  Top 3 product types: ${topProductTypes.join(', ')}`);
    console.log(`  Top 3 guarantees:    ${[...new Set(topGuarantees)].join(', ')}`);
    console.log(`  Closest distance:    ${results[0]?.distance.toFixed(4)}`);
    console.log(`  Product match:       ${hasExpectedProduct ? 'PASS' : 'FAIL'}`);
    console.log(`  Guarantee match:     ${hasExpectedGuarantee ? 'PASS' : 'FAIL'}`);
    console.log();

    queryTotal += 2;
    if (hasExpectedProduct) queryPasses++;
    if (hasExpectedGuarantee) queryPasses++;
  }

  // Summary
  console.log('=== Summary ===');
  console.log(`Chunk count:    ${chunkPass ? 'PASS' : 'FAIL'}`);
  console.log(`Embeddings:     ${embPass ? 'PASS' : 'FAIL'}`);
  console.log(`Vector index:   ${idxPass ? 'PASS' : 'FAIL'}`);
  console.log(`Query accuracy: ${queryPasses}/${queryTotal} checks passed`);

  const overallPass = chunkPass && embPass && idxPass && queryPasses >= queryTotal * 0.7;
  console.log(`\nOverall: ${overallPass ? 'PASS' : 'FAIL'}`);

  client.close();

  if (!overallPass) {
    process.exit(1);
  }
}

validate().catch((err) => {
  console.error('Validation failed:', err);
  process.exit(1);
});
