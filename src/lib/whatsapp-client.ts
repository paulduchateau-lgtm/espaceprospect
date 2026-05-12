const GRAPH_API_BASE = 'https://graph.facebook.com/v21.0'

interface WhatsAppConfig {
  phoneNumberId: string
  accessToken: string
  verifyToken: string
  businessPhone: string
}

function getConfig(): WhatsAppConfig {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN
  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN || 'metlife-sailor-verify'
  const businessPhone = process.env.WHATSAPP_BUSINESS_PHONE || ''

  if (!phoneNumberId || !accessToken) {
    throw new Error('WHATSAPP_PHONE_NUMBER_ID and WHATSAPP_ACCESS_TOKEN must be set')
  }

  return { phoneNumberId, accessToken, verifyToken, businessPhone }
}

export function isWhatsAppConfigured(): boolean {
  return !!(process.env.WHATSAPP_PHONE_NUMBER_ID && process.env.WHATSAPP_ACCESS_TOKEN)
}

export function getWhatsAppLink(prospectCode: string): string {
  const config = getConfig()
  const text = encodeURIComponent(`Bonjour, je souhaite poursuivre ma conversation MetLife. Mon code : ${prospectCode}`)
  return `https://wa.me/${config.businessPhone}?text=${text}`
}

export async function sendTextMessage(to: string, text: string): Promise<void> {
  const config = getConfig()

  const res = await fetch(`${GRAPH_API_BASE}/${config.phoneNumberId}/messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'text',
      text: { body: text },
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    console.error('[WhatsApp] Send failed:', res.status, err)
    throw new Error(`WhatsApp send failed: ${res.status}`)
  }

  console.log(`[WhatsApp] Message sent to ${to.slice(0, 6)}***`)
}

export async function markAsRead(messageId: string): Promise<void> {
  const config = getConfig()

  await fetch(`${GRAPH_API_BASE}/${config.phoneNumberId}/messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      status: 'read',
      message_id: messageId,
    }),
  }).catch(() => {})
}

export function getVerifyToken(): string {
  return process.env.WHATSAPP_VERIFY_TOKEN || 'metlife-sailor-verify'
}

export interface IncomingWhatsAppMessage {
  from: string
  messageId: string
  text: string
  timestamp: number
}

export function parseWebhookPayload(body: Record<string, unknown>): IncomingWhatsAppMessage[] {
  const messages: IncomingWhatsAppMessage[] = []

  try {
    const entry = body.entry as Array<Record<string, unknown>> | undefined
    if (!entry) return messages

    for (const e of entry) {
      const changes = e.changes as Array<Record<string, unknown>> | undefined
      if (!changes) continue

      for (const change of changes) {
        const value = change.value as Record<string, unknown> | undefined
        if (!value) continue

        const msgs = value.messages as Array<Record<string, unknown>> | undefined
        if (!msgs) continue

        for (const msg of msgs) {
          if (msg.type !== 'text') continue
          const textObj = msg.text as Record<string, unknown> | undefined
          if (!textObj?.body) continue

          messages.push({
            from: msg.from as string,
            messageId: msg.id as string,
            text: textObj.body as string,
            timestamp: parseInt(msg.timestamp as string, 10),
          })
        }
      }
    }
  } catch (err) {
    console.error('[WhatsApp] Failed to parse webhook payload:', err)
  }

  return messages
}
