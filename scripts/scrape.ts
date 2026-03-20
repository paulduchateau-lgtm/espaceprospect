import { PlaywrightCrawler, Dataset } from 'crawlee';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const BASE_URL = 'https://www.metlife.fr';
const OUTPUT_DIR = join(process.cwd(), 'data', 'scraped');

mkdirSync(OUTPUT_DIR, { recursive: true });

// Seed URLs covering all five MetLife TNS product lines
const SEED_URLS = [
  // Priority 1: Core products
  `${BASE_URL}/assurance-prevoyance-professionnels/travailleurs-non-salaries/`,
  `${BASE_URL}/assurance-prevoyance-professionnels/`,
  `${BASE_URL}/assurance-prevoyance-professionnels/homme-cle/`,
  `${BASE_URL}/assurance-prevoyance-professionnels/associe/`,
  `${BASE_URL}/assurance-emprunteur/`,
  `${BASE_URL}/assurance-prevoyance/`,
  `${BASE_URL}/assurance-prevoyance/prevoyance-individuelle/`,
  // Priority 2: Profession pages, guarantees, Madelin
  `${BASE_URL}/assurance-prevoyance-professionnels/travailleurs-non-salaries/chef-entreprise/`,
  `${BASE_URL}/assurance-prevoyance-professionnels/travailleurs-non-salaries/kinesitherapeute/`,
  `${BASE_URL}/assurance-prevoyance-professionnels/travailleurs-non-salaries/infirmier-liberal/`,
  `${BASE_URL}/assurance-prevoyance-professionnels/travailleurs-non-salaries/medecin-liberal/`,
  `${BASE_URL}/assurance-prevoyance-professionnels/travailleurs-non-salaries/artisan/`,
  `${BASE_URL}/assurance-prevoyance-professionnels/travailleurs-non-salaries/commercant/`,
  `${BASE_URL}/assurance-prevoyance-professionnels/travailleurs-non-salaries/vtc-chauffeur/`,
  `${BASE_URL}/assurance-prevoyance-professionnels/prevoyance-madelin/`,
  `${BASE_URL}/assurance-emprunteur/garanties/`,
  `${BASE_URL}/connaitre-metlife/`,
];

const allResults: Array<Record<string, unknown>> = [];

const crawler = new PlaywrightCrawler({
  launchContext: {
    launchOptions: { headless: true },
  },
  maxRequestsPerCrawl: 150,
  maxConcurrency: 3,
  navigationTimeoutSecs: 30,
  requestHandlerTimeoutSecs: 60,

  async requestHandler({ request, page, enqueueLinks, log }) {
    log.info(`Scraping: ${request.url}`);

    // Dismiss cookie banner if present
    try {
      await page.click('[id*="cookie"] button, .cookie-accept, #onetrust-accept-btn-handler', {
        timeout: 3000,
      });
    } catch {
      // No banner present
    }

    // Wait for main content to render
    try {
      await page.waitForSelector('main, article, .content-area, .page-content', {
        timeout: 10000,
      });
    } catch {
      // Fallback to body
    }

    // Remove noise elements before extracting content
    await page.evaluate(() => {
      const selectors = [
        'nav', 'footer', 'header', 'script', 'style', 'noscript',
        '.cookie-banner', '#onetrust-consent-sdk', 'iframe', '.modal',
        '.breadcrumb', '.social-share', '.sidebar', '[role="navigation"]',
      ];
      for (const sel of selectors) {
        document.querySelectorAll(sel).forEach((el) => el.remove());
      }
    });

    // Extract structured content
    const data = await page.evaluate(() => {
      const main =
        document.querySelector('main') ||
        document.querySelector('article') ||
        document.querySelector('.content-area') ||
        document.body;

      const headings = Array.from(main.querySelectorAll('h1, h2, h3')).map(
        (h) => ({
          level: parseInt(h.tagName[1]),
          text: h.textContent?.trim() || '',
        })
      );

      return {
        title:
          document.querySelector('h1')?.textContent?.trim() || document.title,
        description:
          document
            .querySelector('meta[name="description"]')
            ?.getAttribute('content') || '',
        headings,
        content: main.innerText.trim(),
        html: main.innerHTML,
      };
    });

    const pageData = {
      url: request.url,
      ...data,
      scrapedAt: new Date().toISOString(),
    };

    allResults.push(pageData);
    await Dataset.pushData(pageData);

    // Follow internal links within target sections
    await enqueueLinks({
      strategy: 'same-domain',
      globs: [
        '**/assurance-prevoyance-professionnels/**',
        '**/assurance-prevoyance/**',
        '**/assurance-emprunteur/**',
        '**/connaitre-metlife/**',
      ],
      exclude: [
        '**/espace-client/**',
        '**/intermediaires/**',
        '**cloud.e.metlife.fr**',
        '**/*.pdf',
        '**/#*',
      ],
    });
  },

  failedRequestHandler({ request, log }) {
    log.error(`Failed: ${request.url}`);
  },
});

await crawler.addRequests(SEED_URLS);
await crawler.run();

// Write all results to a single JSON file for the normalize step
const outputPath = join(OUTPUT_DIR, 'raw-pages.json');
writeFileSync(outputPath, JSON.stringify(allResults, null, 2), 'utf-8');

console.log(`\nScraping complete.`);
console.log(`Total pages scraped: ${allResults.length}`);
console.log(`Output: ${outputPath}`);
