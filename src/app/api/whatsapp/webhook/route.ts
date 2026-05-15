import { readFileSync } from 'node:fs'
import { eq } from 'drizzle-orm'
import { createAnthropic } from '@ai-sdk/anthropic'
import { generateText } from 'ai'
import { db } from '@/lib/db'
import { prospects, conversations } from '@/db/schema'
import { getSailorClient } from '@/lib/sailor-client'
import { formatSailorChunksAsRAG, buildSystemPrompt } from '@/lib/prompts'
import { saveMessages } from '@/lib/prospect'
import {
  getVerifyToken,
  parseWebhookPayload,
  sendTextMessage,
  markAsRead,
} from '@/lib/whatsapp-client'

function loadApiKey(): string {
  const envKey = process.env.ANTHROPIC_API_KEY
  if (envKey && envKey.length > 0) return envKey
  try {
    const content = readFileSync('.env.local', 'utf8')
    const match = content.match(/^ANTHROPIC_API_KEY=(.+)$/m)
    if (match?.[1]) return match[1].trim()
  } catch { /* .env.local not found */ }
  throw new Error('ANTHROPIC_API_KEY not configured')
}

function getAnthropic() {
  return createAnthropic({
    apiKey: loadApiKey(),
    baseURL: 'https://api.anthropic.com/v1',
  })
}

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

async function findProspectByPhone(phone: string) {
  const [prospect] = await db
    .select()
    .from(prospects)
    .where(eq(prospects.whatsappPhone, phone))
    .limit(1)
  return prospect ?? null
}

async function findProspectByCode(code: string) {
  const [prospect] = await db
    .select()
    .from(prospects)
    .where(eq(prospects.code, code))
    .limit(1)
  return prospect ?? null
}

async function linkPhoneToProspect(prospectId: string, phone: string) {
  await db
    .update(prospects)
    .set({ whatsappPhone: phone, updatedAt: new Date() })
    .where(eq(prospects.id, prospectId))
}

async function loadConversationHistory(prospectId: string): Promise<ChatMessage[]> {
  const [conv] = await db
    .select()
    .from(conversations)
    .where(eq(conversations.prospectId, prospectId))
    .limit(1)
  if (!conv?.messages) return []
  const msgs = conv.messages as ChatMessage[]
  return Array.isArray(msgs) ? msgs : []
}

async function saveConversationHistory(prospectId: string, messages: ChatMessage[]) {
  await saveMessages(prospectId, messages)
}

const WHATSAPP_EXTRA = `
IMPORTANT — Adaptation WhatsApp :
- Tu es concis car c'est WhatsApp — 2-3 phrases max par réponse sauf si le prospect demande plus de détails.
- N'utilise pas de markdown (pas de **gras**, pas de # titres). Utilise du texte brut adapté à WhatsApp.
- Tu peux utiliser des émojis avec parcimonie pour rendre la conversation naturelle.
- N'appelle PAS l'outil generate_dashboard sur WhatsApp.`

async function generateWhatsAppReply(
  userMessage: string,
  history: ChatMessage[],
): Promise<string> {
  let ragContext = ''
  try {
    const sailor = getSailorClient()
    const { chunks } = await sailor.retrieveChunks({
      query: userMessage,
      top_k: 6,
      strategy: 'hybrid',
    })
    ragContext = formatSailorChunksAsRAG(chunks)
    console.log(`[WhatsApp RAG] ${chunks.length} chunks`)
  } catch {
    console.error('[WhatsApp RAG] Sailor-api unavailable, proceeding without context')
  }

  const systemPrompt = buildSystemPrompt(ragContext) + '\n' + WHATSAPP_EXTRA

  const recentHistory = history.slice(-10)

  const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [
    ...recentHistory.map(m => ({ role: m.role, content: m.content })),
    { role: 'user', content: userMessage },
  ]

  const result = await generateText({
    model: getAnthropic()('claude-sonnet-4-20250514'),
    system: systemPrompt,
    messages,
  })

  return result.text
}

// GET — Webhook verification (Meta challenge)
export async function GET(req: Request) {
  const url = new URL(req.url)
  const mode = url.searchParams.get('hub.mode')
  const token = url.searchParams.get('hub.verify_token')
  const challenge = url.searchParams.get('hub.challenge')

  if (mode === 'subscribe' && token === getVerifyToken()) {
    console.log('[WhatsApp] Webhook verified')
    return new Response(challenge, { status: 200 })
  }

  return new Response('Forbidden', { status: 403 })
}

// POST — Incoming messages
export async function POST(req: Request) {
  const body = await req.json()

  // Always respond 200 to Meta quickly
  const respond200 = () => new Response('EVENT_RECEIVED', { status: 200 })

  const incomingMessages = parseWebhookPayload(body)
  if (incomingMessages.length === 0) return respond200()

  for (const msg of incomingMessages) {
    try {
      await markAsRead(msg.messageId)

      const text = msg.text.trim()
      const phone = msg.from

      console.log(`[WhatsApp] Message from ${phone.slice(0, 6)}***: "${text.slice(0, 50)}..."`)

      let prospect = await findProspectByPhone(phone)

      if (!prospect) {
        const codeMatch = text.match(/\b([A-Z0-9]{6})\b/)
        if (codeMatch) {
          const found = await findProspectByCode(codeMatch[1])
          if (found) {
            await linkPhoneToProspect(found.id, phone)
            prospect = { ...found, whatsappPhone: phone }
            console.log(`[WhatsApp] Linked phone ${phone.slice(0, 6)}*** to prospect ${found.id}`)

            const history = await loadConversationHistory(found.id)
            const welcomeMsg = history.length > 0
              ? `Bonjour ! J'ai bien retrouvé votre dossier MetLife. Je peux continuer à vous accompagner ici sur WhatsApp. Comment puis-je vous aider ?`
              : `Bonjour ! Votre dossier MetLife est bien associé. N'hésitez pas à me poser vos questions sur nos solutions de protection pour les TNS.`

            await sendTextMessage(phone, welcomeMsg)

            const updatedHistory: ChatMessage[] = [
              ...history,
              { role: 'user', content: text },
              { role: 'assistant', content: welcomeMsg },
            ]
            await saveConversationHistory(found.id, updatedHistory)
            continue
          }
        }

        await sendTextMessage(
          phone,
          `Bonjour ! Pour que je puisse retrouver votre dossier MetLife, pourriez-vous me communiquer votre code d'accès à 6 caractères ? Vous le trouverez sur votre espace prospect MetLife.`,
        )
        continue
      }

      const history = await loadConversationHistory(prospect.id)
      const reply = await generateWhatsAppReply(text, history)

      await sendTextMessage(phone, reply)

      const updatedHistory: ChatMessage[] = [
        ...history,
        { role: 'user', content: text },
        { role: 'assistant', content: reply },
      ]
      await saveConversationHistory(prospect.id, updatedHistory)
    } catch (err) {
      console.error('[WhatsApp] Error processing message:', err)
      try {
        await sendTextMessage(
          msg.from,
          `Désolé, une erreur s'est produite. Veuillez réessayer dans quelques instants ou contacter directement un conseiller MetLife.`,
        )
      } catch { /* best effort */ }
    }
  }

  return respond200()
}
