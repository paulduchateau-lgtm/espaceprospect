import { z } from 'zod'

const handoffSchema = z.object({
  prospectId: z.string(),
  phone: z.string().regex(/^0[67]\d{8}$/, 'Numéro de mobile français invalide'),
  profession: z.string().optional(),
})

export async function POST(req: Request) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = handoffSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0]?.message || 'Données invalides' },
      { status: 400 }
    )
  }

  const { prospectId, phone, profession } = parsed.data
  const intlPhone = `+33${phone.slice(1)}`

  console.log(`[WhatsApp Handoff] Prospect ${prospectId}: ${intlPhone} (${profession || 'unknown'})`)

  // WhatsApp Business API integration
  // For now, this is a stub. To enable:
  // 1. Set WHATSAPP_BUSINESS_PHONE_ID and WHATSAPP_ACCESS_TOKEN in .env.local
  // 2. Create a message template in Meta Business Manager
  // 3. Uncomment the fetch below

  const waPhoneId = process.env.WHATSAPP_BUSINESS_PHONE_ID
  const waToken = process.env.WHATSAPP_ACCESS_TOKEN

  if (waPhoneId && waToken) {
    try {
      const response = await fetch(
        `https://graph.facebook.com/v21.0/${waPhoneId}/messages`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${waToken}`,
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: intlPhone,
            type: 'template',
            template: {
              name: 'metlife_prospect_handoff',
              language: { code: 'fr' },
              components: [
                {
                  type: 'body',
                  parameters: [
                    { type: 'text', text: profession || 'TNS' },
                    { type: 'text', text: prospectId },
                  ],
                },
              ],
            },
          }),
        }
      )

      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        console.error('[WhatsApp] API error:', err)
        return Response.json(
          { error: 'Impossible d\'envoyer le message WhatsApp. Réessayez plus tard.' },
          { status: 502 }
        )
      }

      const result = await response.json()
      console.log(`[WhatsApp] Message sent: ${result.messages?.[0]?.id}`)

      return Response.json({
        success: true,
        messageId: result.messages?.[0]?.id,
      })
    } catch (error) {
      console.error('[WhatsApp] Send failed:', error)
      return Response.json(
        { error: 'Erreur de communication avec WhatsApp' },
        { status: 502 }
      )
    }
  }

  // Stub mode: simulate success when WA credentials not configured
  console.log(`[WhatsApp] Stub mode — would send template to ${intlPhone}`)

  return Response.json({
    success: true,
    stub: true,
    message: `Message WhatsApp simulé vers ${intlPhone}`,
  })
}
