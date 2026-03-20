import { createClient } from '@libsql/client';
import { embedQuery } from './embeddings';

export interface RetrievedChunk {
  id: string;
  content: string;
  title: string;
  productType: string;
  tnsRelevance: string;
  guarantees: string[];
  chunkType: string;
  distance: number;
}

function getClient() {
  return createClient({
    url: process.env.TURSO_DATABASE_URL || 'file:local.db',
    authToken: process.env.TURSO_AUTH_TOKEN,
  });
}

export async function retrieveRelevantChunks(
  query: string,
  topK: number = 8
): Promise<RetrievedChunk[]> {
  const queryEmbedding = await embedQuery(query);
  const client = getClient();

  const result = await client.execute({
    sql: `
      SELECT
        content_chunks.id,
        content_chunks.content,
        content_chunks.title,
        content_chunks.product_type,
        content_chunks.tns_relevance,
        content_chunks.guarantees,
        content_chunks.chunk_type,
        vt.distance
      FROM vector_top_k('chunks_embedding_idx', vector32(?), ?)
        AS vt
      JOIN content_chunks ON content_chunks.rowid = vt.id
      ORDER BY vt.distance ASC
    `,
    args: [JSON.stringify(queryEmbedding), topK],
  });

  client.close();

  return result.rows.map((row) => ({
    id: row.id as string,
    content: row.content as string,
    title: row.title as string,
    productType: row.product_type as string,
    tnsRelevance: row.tns_relevance as string,
    guarantees: JSON.parse(row.guarantees as string),
    chunkType: row.chunk_type as string,
    distance: row.distance as number,
  }));
}
