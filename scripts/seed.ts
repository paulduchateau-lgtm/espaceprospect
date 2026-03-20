import { execSync } from 'child_process';

async function seed() {
  console.log('=== MetLife RAG Seed Pipeline ===\n');

  console.log('Step 1/4: Scraping metlife.fr...');
  execSync('npx tsx scripts/scrape.ts', { stdio: 'inherit' });

  console.log('\nStep 2/4: Normalizing content...');
  execSync('npx tsx scripts/normalize.ts', { stdio: 'inherit' });

  console.log('\nStep 3/4: Chunking content...');
  execSync('npx tsx scripts/chunk.ts', { stdio: 'inherit' });

  console.log('\nStep 4/4: Embedding and storing...');
  execSync('npx tsx scripts/embed.ts', { stdio: 'inherit' });

  console.log('\n=== Seed Pipeline Complete ===');
  console.log('Run "npm run seed:validate" to verify search quality.');
}

seed().catch((err) => {
  console.error('Seed pipeline failed:', err);
  process.exit(1);
});
