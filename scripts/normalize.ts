import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const INPUT_PATH = join(process.cwd(), 'data', 'scraped', 'raw-pages.json');
const OUTPUT_PATH = join(process.cwd(), 'data', 'scraped', 'normalized-pages.json');

interface RawPage {
  url: string;
  title: string;
  description: string;
  content: string;
  html: string;
  headings: { level: number; text: string }[];
  scrapedAt: string;
}

interface NormalizedPage {
  url: string;
  title: string;
  description: string;
  productType: 'prevoyance-tns' | 'emprunteur' | 'prevoyance-individuelle' | 'prevoyance-pro' | 'about' | 'guide' | 'other';
  tnsRelevance: 'direct' | 'indirect' | 'contextual';
  guarantees: string[];
  markdown: string;
  scrapedAt: string;
}

function classifyPage(
  url: string,
  _content: string
): { productType: NormalizedPage['productType']; tnsRelevance: NormalizedPage['tnsRelevance'] } {
  if (url.includes('travailleurs-non-salaries') || url.includes('prevoyance-tns'))
    return { productType: 'prevoyance-tns', tnsRelevance: 'direct' };
  if (url.includes('homme-cle') || url.includes('associe'))
    return { productType: 'prevoyance-pro', tnsRelevance: 'direct' };
  if (url.includes('prevoyance-madelin'))
    return { productType: 'guide', tnsRelevance: 'direct' };
  if (url.includes('assurance-emprunteur'))
    return { productType: 'emprunteur', tnsRelevance: 'indirect' };
  if (url.includes('assurance-prevoyance') && !url.includes('professionnels'))
    return { productType: 'prevoyance-individuelle', tnsRelevance: 'indirect' };
  if (url.includes('connaitre-metlife'))
    return { productType: 'about', tnsRelevance: 'contextual' };
  return { productType: 'other', tnsRelevance: 'contextual' };
}

function extractGuarantees(content: string): string[] {
  const guaranteeKeywords: Record<string, string> = {
    'incapacit': 'incapacite',
    'invalidit': 'invalidite',
    'décès': 'deces',
    'capital décès': 'capital-deces',
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

function contentToMarkdown(page: RawPage): string {
  // Build markdown from headings and content
  // Use headings array to reconstruct structure
  let md = `# ${page.title}\n\n`;
  if (page.description) {
    md += `> ${page.description}\n\n`;
  }

  // Clean up the plain text content:
  // - Remove excessive whitespace
  // - Remove empty lines beyond 2 consecutive
  // - Trim each line
  const lines = page.content
    .split('\n')
    .map((line) => line.trim())
    .filter((line, i, arr) => {
      // Remove more than 2 consecutive empty lines
      if (!line && i > 0 && !arr[i - 1]) return false;
      return true;
    });

  md += lines.join('\n');
  return md;
}

function normalizePage(raw: RawPage): NormalizedPage {
  const { productType, tnsRelevance } = classifyPage(raw.url, raw.content);
  const guarantees = extractGuarantees(raw.content);
  const markdown = contentToMarkdown(raw);

  return {
    url: raw.url,
    title: raw.title,
    description: raw.description,
    productType,
    tnsRelevance,
    guarantees,
    markdown,
    scrapedAt: raw.scrapedAt,
  };
}

// Main
const rawPages: RawPage[] = JSON.parse(readFileSync(INPUT_PATH, 'utf-8'));
console.log(`Normalizing ${rawPages.length} pages...`);

const normalized = rawPages.map(normalizePage);

// Log classification summary
const byType: Record<string, number> = {};
for (const page of normalized) {
  byType[page.productType] = (byType[page.productType] || 0) + 1;
}
console.log('Classification summary:');
for (const [type, count] of Object.entries(byType)) {
  console.log(`  ${type}: ${count} pages`);
}

// Log guarantee coverage
const allGuarantees = new Set(normalized.flatMap((p) => p.guarantees));
console.log(`\nGuarantee types found: ${allGuarantees.size}`);
console.log(`  ${Array.from(allGuarantees).join(', ')}`);

writeFileSync(OUTPUT_PATH, JSON.stringify(normalized, null, 2), 'utf-8');
console.log(`\nOutput: ${OUTPUT_PATH}`);
