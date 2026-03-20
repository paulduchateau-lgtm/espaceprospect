import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { randomUUID } from 'crypto';

const INPUT_PATH = join(process.cwd(), 'data', 'scraped', 'normalized-pages.json');
const OUTPUT_PATH = join(process.cwd(), 'data', 'chunks', 'chunks.json');

interface NormalizedPage {
  url: string;
  title: string;
  description: string;
  productType: string;
  tnsRelevance: string;
  guarantees: string[];
  markdown: string;
  scrapedAt: string;
}

export interface ContentChunk {
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

function estimateTokens(text: string): number {
  // French text averages ~1.3 tokens per word
  return Math.ceil(text.split(/\s+/).length * 1.3);
}

function splitByHeadings(
  markdown: string
): { heading: string; content: string }[] {
  const regex = /^(#{1,3})\s+(.+)$/gm;
  const sections: { heading: string; content: string }[] = [];
  let lastIndex = 0;
  let lastHeading = '';
  let match: RegExpExecArray | null;

  while ((match = regex.exec(markdown)) !== null) {
    if (lastIndex > 0 || match.index > 0) {
      const content = markdown.slice(lastIndex, match.index).trim();
      if (content) sections.push({ heading: lastHeading, content });
    }
    lastHeading = match[2];
    lastIndex = match.index + match[0].length;
  }

  const remaining = markdown.slice(lastIndex).trim();
  if (remaining) sections.push({ heading: lastHeading, content: remaining });

  return sections;
}

function splitByParagraphs(text: string, targetTokens: number): string[] {
  const paragraphs = text.split(/\n\n+/);
  const chunks: string[] = [];
  let current = '';

  for (const p of paragraphs) {
    const combined = current ? `${current}\n\n${p}` : p;
    if (estimateTokens(combined) > targetTokens * 1.2 && current) {
      chunks.push(current);
      current = p;
    } else {
      current = combined;
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

function extractGuarantees(content: string): string[] {
  const guaranteeKeywords: Record<string, string> = {
    'incapacit': 'incapacite',
    'invalidit': 'invalidite',
    'décès': 'deces',
    'ptia': 'ptia',
    'frais généraux': 'frais-generaux',
    'rente éducation': 'rente-education',
    'rente de conjoint': 'rente-conjoint',
    'maladies redoutées': 'maladies-redoutees',
    'protection juridique': 'protection-juridique',
    'emprunteur': 'emprunteur',
    'hospitalisation': 'hospitalisation',
    'ipt': 'ipt',
    'itt': 'itt',
  };

  const found = new Set<string>();
  const lower = content.toLowerCase();
  for (const [keyword, tag] of Object.entries(guaranteeKeywords)) {
    if (lower.includes(keyword)) found.add(tag);
  }
  return Array.from(found);
}

function inferChunkType(
  heading: string,
  content: string,
  page: NormalizedPage
): string {
  const lower = (heading + content).toLowerCase();
  if (lower.includes('?') && (lower.includes('réponse') || lower.includes('oui') || lower.includes('non')))
    return 'faq';
  if (page.productType === 'about') return 'about';
  if (page.url.includes('madelin') || lower.includes('déduction'))
    return 'guide';
  if (lower.includes('garantie') || lower.includes('couverture'))
    return 'guarantee';
  if (
    page.url.includes('travailleurs-non-salaries/') &&
    !page.url.endsWith('travailleurs-non-salaries/')
  )
    return 'profession';
  return 'product';
}

function chunkPage(page: NormalizedPage): ContentChunk[] {
  const chunks: ContentChunk[] = [];
  const sections = splitByHeadings(page.markdown);

  for (const section of sections) {
    const tokens = estimateTokens(section.content);

    // Skip trivial sections (nav fragments, cookie text, etc.)
    if (tokens < 50) continue;

    if (tokens <= 600) {
      // Section fits in one chunk -- keep whole
      chunks.push({
        id: randomUUID(),
        content: section.heading
          ? `## ${section.heading}\n\n${section.content}`
          : section.content,
        source_url: page.url,
        title: section.heading || page.title,
        product_type: page.productType,
        tns_relevance: page.tnsRelevance,
        guarantees: extractGuarantees(section.content),
        chunk_type: inferChunkType(section.heading, section.content, page),
        token_estimate: tokens,
      });
    } else {
      // Split long sections by paragraph, target ~400 tokens per chunk
      const subTexts = splitByParagraphs(section.content, 400);
      for (const sub of subTexts) {
        const subTokens = estimateTokens(sub);
        if (subTokens < 50) continue;

        chunks.push({
          id: randomUUID(),
          content: section.heading
            ? `## ${section.heading}\n\n${sub}`
            : sub,
          source_url: page.url,
          title: section.heading || page.title,
          product_type: page.productType,
          tns_relevance: page.tnsRelevance,
          guarantees: extractGuarantees(sub),
          chunk_type: inferChunkType(section.heading, sub, page),
          token_estimate: subTokens,
        });
      }
    }
  }

  return chunks;
}

// Main
const pages: NormalizedPage[] = JSON.parse(readFileSync(INPUT_PATH, 'utf-8'));
console.log(`Chunking ${pages.length} normalized pages...`);

const allChunks = pages.flatMap(chunkPage);

// Deduplicate by content
const seen = new Set<string>();
const dedupedChunks = allChunks.filter((chunk) => {
  const key = chunk.content.trim();
  if (seen.has(key)) return false;
  seen.add(key);
  return true;
});

const removed = allChunks.length - dedupedChunks.length;
if (removed > 0) {
  console.log(`Removed ${removed} duplicate chunks`);
}

// Stats
const tokenCounts = dedupedChunks.map((c) => c.token_estimate);
const avgTokens = Math.round(
  tokenCounts.reduce((a, b) => a + b, 0) / tokenCounts.length
);
const maxTokens = Math.max(...tokenCounts);
const minTokens = Math.min(...tokenCounts);

console.log(`\nChunk statistics:`);
console.log(`  Total chunks: ${dedupedChunks.length}`);
console.log(`  Avg tokens:   ${avgTokens}`);
console.log(`  Min tokens:   ${minTokens}`);
console.log(`  Max tokens:   ${maxTokens}`);

// Product type distribution
const byType: Record<string, number> = {};
for (const chunk of dedupedChunks) {
  byType[chunk.product_type] = (byType[chunk.product_type] || 0) + 1;
}
console.log(`\nBy product type:`);
for (const [type, count] of Object.entries(byType)) {
  console.log(`  ${type}: ${count} chunks`);
}

// Guarantee coverage
const allGuarantees = new Set(dedupedChunks.flatMap((c) => c.guarantees));
console.log(`\nGuarantee types covered: ${allGuarantees.size}`);
console.log(`  ${Array.from(allGuarantees).join(', ')}`);

writeFileSync(OUTPUT_PATH, JSON.stringify(dedupedChunks, null, 2), 'utf-8');
console.log(`\nOutput: ${OUTPUT_PATH}`);
