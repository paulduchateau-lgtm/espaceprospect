/**
 * Seed MetLife data into Sailor-api.
 *
 * Reads normalized content from the original MetLife data directory
 * and uploads it as documents to the configured Sailor-api datasource.
 *
 * Usage:
 *   SAILOR_API_URL=http://localhost:3001 \
 *   SAILOR_API_KEY=sk_live_xxx \
 *   SAILOR_DATASOURCE_ID=ds_xxx \
 *   npx tsx scripts/seed-metlife-data.ts
 */

import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const SAILOR_API_URL = process.env.SAILOR_API_URL
const SAILOR_API_KEY = process.env.SAILOR_API_KEY
const DATASOURCE_ID = process.env.SAILOR_DATASOURCE_ID

if (!SAILOR_API_URL || !SAILOR_API_KEY || !DATASOURCE_ID) {
  console.error('Required env vars: SAILOR_API_URL, SAILOR_API_KEY, SAILOR_DATASOURCE_ID')
  process.exit(1)
}

// Path to original MetLife scraped data
const DATA_DIR = join(__dirname, '../../clients-infinitif/METLife/data/scraped/normalized')

async function main() {
  let files: string[]
  try {
    files = readdirSync(DATA_DIR).filter(f => f.endsWith('.json'))
  } catch {
    console.error(`Data directory not found: ${DATA_DIR}`)
    console.error('Make sure the MetLife project exists at ../clients-infinitif/METLife/')
    process.exit(1)
  }

  console.log(`Found ${files.length} normalized documents to upload`)

  let uploaded = 0
  let errors = 0

  for (const file of files) {
    try {
      const raw = readFileSync(join(DATA_DIR, file), 'utf-8')
      const data = JSON.parse(raw)

      const content = data.content || data.text || ''
      if (!content) {
        console.log(`  Skip ${file}: no content`)
        continue
      }

      const blob = new Blob([content], { type: 'text/plain' })
      const formData = new FormData()
      formData.append('datasource_id', DATASOURCE_ID)
      formData.append('files', blob, `${data.slug || file.replace('.json', '')}.txt`)
      formData.append('metadata', JSON.stringify({
        title: data.title || file,
        category: data.productType || 'general',
        tags: data.guarantees || [],
        source_url: data.url || data.sourceUrl || '',
      }))

      const res = await fetch(`${SAILOR_API_URL}/v1/documents/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${SAILOR_API_KEY}` },
        body: formData,
      })

      if (!res.ok) {
        const err = await res.text()
        console.error(`  Error ${file}: ${res.status} ${err}`)
        errors++
      } else {
        uploaded++
        console.log(`  Uploaded: ${data.title || file}`)
      }
    } catch (err) {
      console.error(`  Error ${file}:`, err)
      errors++
    }
  }

  console.log(`\nDone: ${uploaded} uploaded, ${errors} errors`)
}

main()
