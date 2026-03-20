import { readFileSync } from 'fs';
import { join } from 'path';
import { createClient } from '@libsql/client';
import { generateEmbeddings } from '../src/lib/embeddings';

const CHUNKS_PATH = join(process.cwd(), 'data', 'chunks', 'chunks.json');

interface ContentChunk {
  id: string;
  content: string;
  source_url: string;
  title: string;
  product_type: string;
  tns_relevance: string;
  guarantees: string[];
  chunk_type: string;
  token_estimate: number;
}

async function embed() {
  const client = createClient({
    url: process.env.TURSO_DATABASE_URL || 'file:local.db',
    authToken: process.env.TURSO_AUTH_TOKEN,
  });

  // Step 1: Load chunks
  const chunks: ContentChunk[] = JSON.parse(
    readFileSync(CHUNKS_PATH, 'utf-8')
  );
  console.log(`Loaded ${chunks.length} chunks from ${CHUNKS_PATH}`);

  // Step 2: Clear existing data (idempotent re-runs)
  await client.execute('DELETE FROM content_chunks');
  console.log('Cleared existing content_chunks table');

  // Step 3: Create vector index (idempotent)
  await client.execute(`
    CREATE INDEX IF NOT EXISTS chunks_embedding_idx
    ON content_chunks(libsql_vector_idx(embedding, 'metric=cosine'))
  `);
  console.log('Vector index created/verified');

  // Step 4: Generate embeddings
  console.log('Generating embeddings via Voyage AI...');
  const texts = chunks.map((c) => c.content);
  const embeddings = await generateEmbeddings(texts, 'document');
  console.log(`Generated ${embeddings.length} embeddings (1024 dimensions each)`);

  // Step 5: Insert chunks with embeddings
  console.log('Inserting chunks into database...');
  let inserted = 0;

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const embedding = embeddings[i];

    await client.execute({
      sql: `INSERT INTO content_chunks
            (id, content, source_url, title, product_type, tns_relevance,
             guarantees, chunk_type, token_estimate, embedding, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, vector32(?), unixepoch())`,
      args: [
        chunk.id,
        chunk.content,
        chunk.source_url,
        chunk.title,
        chunk.product_type,
        chunk.tns_relevance,
        JSON.stringify(chunk.guarantees),
        chunk.chunk_type,
        chunk.token_estimate,
        JSON.stringify(embedding),
      ],
    });

    inserted++;
    if (inserted % 50 === 0) {
      console.log(`  Inserted ${inserted}/${chunks.length}...`);
    }
  }

  console.log(`\nEmbed complete: ${inserted} chunks stored with embeddings`);

  // Step 6: Verify
  const countResult = await client.execute(
    'SELECT COUNT(*) as cnt FROM content_chunks WHERE embedding IS NOT NULL'
  );
  const count = countResult.rows[0].cnt;
  console.log(`Verification: ${count} chunks with embeddings in database`);

  client.close();
}

embed().catch((err) => {
  console.error('Embed failed:', err);
  process.exit(1);
});
