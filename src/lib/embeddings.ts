const VOYAGE_API_URL = 'https://api.voyageai.com/v1/embeddings';
const VOYAGE_MODEL = 'voyage-finance-2';
const EMBEDDING_DIMENSIONS = 1024;

interface VoyageEmbeddingResponse {
  data: { embedding: number[]; index: number }[];
  usage: { total_tokens: number };
}

export async function generateEmbeddings(
  texts: string[],
  inputType: 'document' | 'query'
): Promise<number[][]> {
  const apiKey = process.env.VOYAGEAI_API_KEY;
  if (!apiKey) throw new Error('VOYAGEAI_API_KEY not set in environment');

  // Free tier: 3 RPM, 10K TPM — use small batches with 21s delay
  const BATCH_SIZE = 8;
  const RATE_LIMIT_DELAY_MS = 21000; // 21 seconds to stay under 3 RPM
  const MAX_RETRIES = 3;
  const allEmbeddings: number[][] = [];

  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(texts.length / BATCH_SIZE);
    console.log(
      `  Embedding batch ${batchNum}/${totalBatches} (${batch.length} texts)...`
    );

    let retries = 0;
    let success = false;

    while (!success && retries < MAX_RETRIES) {
      const response = await fetch(VOYAGE_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          input: batch,
          model: VOYAGE_MODEL,
          input_type: inputType,
        }),
      });

      if (response.status === 429) {
        retries++;
        const waitTime = RATE_LIMIT_DELAY_MS * retries;
        console.log(`    Rate limited. Waiting ${waitTime / 1000}s before retry ${retries}/${MAX_RETRIES}...`);
        await new Promise((resolve) => setTimeout(resolve, waitTime));
        continue;
      }

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Voyage AI API error: ${response.status} ${error}`);
      }

      const data: VoyageEmbeddingResponse = await response.json();
      const sorted = data.data.sort((a, b) => a.index - b.index);
      allEmbeddings.push(...sorted.map((d) => d.embedding));
      console.log(`    Tokens used: ${data.usage.total_tokens}`);
      success = true;
    }

    if (!success) {
      throw new Error(`Failed to embed batch ${batchNum} after ${MAX_RETRIES} retries`);
    }

    // Rate limiting: pause between batches
    if (i + BATCH_SIZE < texts.length) {
      await new Promise((resolve) => setTimeout(resolve, RATE_LIMIT_DELAY_MS));
    }
  }

  return allEmbeddings;
}

export async function embedQuery(text: string): Promise<number[]> {
  const [embedding] = await generateEmbeddings([text], 'query');
  return embedding;
}

export { EMBEDDING_DIMENSIONS, VOYAGE_MODEL };
