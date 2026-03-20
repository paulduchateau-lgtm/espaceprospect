import { formatRAGContext, type RAGChunk, buildSystemPrompt } from '../src/lib/prompts';

/**
 * Test the RAG context injection pipeline.
 * Uses mock chunks to verify formatting and prompt assembly without requiring API calls.
 * Pass --live to test with real Voyage AI embeddings + Turso vector search.
 */

const MOCK_CHUNKS: RAGChunk[] = [
  {
    content: 'Super Novaterm est un contrat de prevoyance concu pour les TNS. Il couvre les risques d\'incapacite temporaire, d\'invalidite et de deces.',
    title: 'Super Novaterm - Presentation generale',
    productType: 'prevoyance',
    tnsRelevance: 'high',
    chunkType: 'product_overview',
  },
  {
    content: 'Les professions liberales de sante (kinesitherapeutes, infirmiers, medecins) sont particulierement exposees aux risques de TMS et d\'arret de travail prolonge.',
    title: 'Professions de sante - Risques specifiques',
    productType: 'incapacite',
    tnsRelevance: 'high',
    chunkType: 'risk_profile',
  },
  {
    content: 'MetLife propose une garantie emprunteur qui protege les TNS en cas de defaillance de remboursement liee a un arret de travail ou un deces.',
    title: 'Assurance emprunteur TNS',
    productType: 'emprunteur',
    tnsRelevance: 'medium',
    chunkType: 'product_overview',
  },
];

async function main() {
  const isLive = process.argv.includes('--live');

  let chunks: RAGChunk[];

  if (isLive) {
    const { retrieveRelevantChunks } = await import('../src/lib/rag');
    const query = 'Je suis kinesitherapeute liberal, 38 ans';
    console.log(`[LIVE] Query: "${query}"\n`);
    const retrieved = await retrieveRelevantChunks(query, 8);
    chunks = retrieved.map((c) => ({
      content: c.content,
      title: c.title,
      productType: c.productType,
      tnsRelevance: c.tnsRelevance,
      chunkType: c.chunkType,
    }));
  } else {
    console.log('[MOCK] Using mock chunks to verify pipeline\n');
    chunks = MOCK_CHUNKS;
  }

  console.log(`Retrieved ${chunks.length} chunks:`);
  for (const chunk of chunks) {
    console.log(`  - [${chunk.productType}] ${chunk.title}`);
  }

  // Step 2: Format context
  const ragContext = formatRAGContext(chunks);
  console.log(`\nFormatted context length: ${ragContext.length} chars`);

  // Step 3: Build system prompt
  const systemPrompt = buildSystemPrompt(ragContext);
  console.log(`System prompt length: ${systemPrompt.length} chars`);
  console.log(`Estimated tokens: ~${Math.ceil(systemPrompt.length / 4)}`);

  // Step 4: Verify structure
  const hasRole = systemPrompt.includes('<role>');
  const hasConstraints = systemPrompt.includes('<constraints>');
  const hasContext = systemPrompt.includes('<context>');
  const hasOutput = systemPrompt.includes('<output_instructions>');
  const hasSources = systemPrompt.includes('<source id="1"');

  console.log(`\nStructure check:`);
  console.log(`  <role>: ${hasRole ? 'OK' : 'MISSING'}`);
  console.log(`  <constraints>: ${hasConstraints ? 'OK' : 'MISSING'}`);
  console.log(`  <context>: ${hasContext ? 'OK' : 'MISSING'}`);
  console.log(`  <output_instructions>: ${hasOutput ? 'OK' : 'MISSING'}`);
  console.log(`  RAG sources injected: ${hasSources ? 'OK' : 'MISSING'}`);

  if (hasRole && hasConstraints && hasContext && hasOutput && hasSources) {
    console.log('\nRAG context injection: PASS');
  } else {
    console.error('\nRAG context injection: FAIL');
    process.exit(1);
  }
}

main().catch(console.error);
