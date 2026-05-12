export interface SailorClientConfig {
  baseUrl: string
  apiKey: string
  timeout?: number
}

export interface SailorChunk {
  chunk_id: string
  document_id: string
  content: string
  score: number
  metadata: {
    filename: string
    title: string
    page_number?: number
    section_title?: string
    category?: string
    source_url?: string
  }
}

export interface SailorRetrievalResponse {
  chunks: SailorChunk[]
  search_metadata: {
    strategy: string
    total_results: number
    embedding_model: string
    latency_ms: number
  }
}

export class SailorClient {
  private baseUrl: string
  private apiKey: string
  private timeout: number

  constructor(config: SailorClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, '')
    this.apiKey = config.apiKey
    this.timeout = config.timeout ?? 10_000
  }

  private async request<T>(path: string, options?: RequestInit): Promise<T> {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), this.timeout)

    try {
      const res = await fetch(`${this.baseUrl}${path}`, {
        ...options,
        signal: controller.signal,
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          ...options?.headers,
        },
      })

      if (!res.ok) {
        const body = await res.text().catch(() => '')
        throw new Error(`Sailor-api ${res.status}: ${body}`)
      }

      return res.json() as T
    } finally {
      clearTimeout(timer)
    }
  }

  async retrieveChunks(params: {
    query: string
    top_k?: number
    threshold?: number
    strategy?: 'vector' | 'bm25' | 'hybrid'
    datasource_ids?: string[]
  }): Promise<SailorRetrievalResponse> {
    return this.request<SailorRetrievalResponse>('/v1/retrieval/search', {
      method: 'POST',
      body: JSON.stringify(params),
    })
  }

  async getStats(): Promise<{
    documents: number
    chunks: number
    embedded: number
    coverage_percent: number
  }> {
    return this.request('/v1/stats')
  }

  async healthCheck(): Promise<{ status: string }> {
    return this.request('/v1/health')
  }
}

let client: SailorClient | null = null

export function getSailorClient(): SailorClient {
  if (!client) {
    const baseUrl = process.env.SAILOR_API_URL
    const apiKey = process.env.SAILOR_API_KEY
    if (!baseUrl || !apiKey) {
      throw new Error('SAILOR_API_URL and SAILOR_API_KEY must be set')
    }
    client = new SailorClient({ baseUrl, apiKey })
  }
  return client
}
