"use client"

import { useState } from "react"
import { MessageCircle, Send, Loader2, CheckCircle2, X } from "lucide-react"

interface WhatsAppCTAProps {
  prospectId: string
  profession?: string
}

type WhatsAppState = "idle" | "form" | "sending" | "sent" | "error"

export function WhatsAppCTA({ prospectId, profession }: WhatsAppCTAProps) {
  const [state, setState] = useState<WhatsAppState>("idle")
  const [phone, setPhone] = useState("")
  const [error, setError] = useState<string | null>(null)

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, "")
    if (digits.length <= 2) return digits
    if (digits.length <= 4) return `${digits.slice(0, 2)} ${digits.slice(2)}`
    if (digits.length <= 6) return `${digits.slice(0, 2)} ${digits.slice(2, 4)} ${digits.slice(4)}`
    if (digits.length <= 8) return `${digits.slice(0, 2)} ${digits.slice(2, 4)} ${digits.slice(4, 6)} ${digits.slice(6)}`
    return `${digits.slice(0, 2)} ${digits.slice(2, 4)} ${digits.slice(4, 6)} ${digits.slice(6, 8)} ${digits.slice(8, 10)}`
  }

  const isValidPhone = () => {
    const digits = phone.replace(/\D/g, "")
    return digits.length === 10 && (digits.startsWith("06") || digits.startsWith("07"))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValidPhone()) {
      setError("Numéro de mobile invalide (06 ou 07 attendu)")
      return
    }

    setState("sending")
    setError(null)

    try {
      const res = await fetch("/api/whatsapp/handoff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prospectId,
          phone: phone.replace(/\s/g, ""),
          profession,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "Erreur serveur" }))
        throw new Error(data.error || `Erreur ${res.status}`)
      }

      setState("sent")
    } catch (err) {
      setState("error")
      setError(err instanceof Error ? err.message : "Erreur lors de l'envoi")
    }
  }

  if (state === "sent") {
    return (
      <div className="rounded-xl p-6 text-center bg-green-50 border border-green-200">
        <CheckCircle2 className="h-8 w-8 text-green-600 mx-auto mb-3" />
        <h3 className="text-base font-semibold text-[#1A1A1A] mb-1">
          Message envoyé !
        </h3>
        <p className="text-sm text-[#75787B]">
          Vous allez recevoir un message WhatsApp pour continuer l&apos;échange
          avec votre conseiller MetLife.
        </p>
      </div>
    )
  }

  if (state === "form" || state === "sending" || state === "error") {
    return (
      <div className="rounded-xl border border-[#25D366]/30 bg-[#25D366]/5 p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-[#25D366]" />
            <h3 className="text-base font-semibold text-[#1A1A1A]">
              Poursuivre sur WhatsApp
            </h3>
          </div>
          <button
            onClick={() => { setState("idle"); setError(null) }}
            className="p-1 rounded hover:bg-black/5 transition-colors"
          >
            <X className="h-4 w-4 text-[#75787B]" />
          </button>
        </div>
        <p className="text-sm text-[#75787B] mb-4">
          Un conseiller MetLife vous contactera sur WhatsApp pour répondre à vos
          questions et affiner votre devis.
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label
              htmlFor="wa-phone"
              className="block text-xs font-medium text-[#1A1A1A] mb-1"
            >
              Votre numéro de mobile
            </label>
            <input
              id="wa-phone"
              type="tel"
              value={phone}
              onChange={(e) => {
                setPhone(formatPhone(e.target.value))
                setError(null)
              }}
              placeholder="06 12 34 56 78"
              disabled={state === "sending"}
              className="w-full px-3 py-2.5 text-sm rounded-lg border border-[#D9D9D6] focus:border-[#25D366] focus:ring-1 focus:ring-[#25D366] outline-none transition-colors disabled:opacity-50"
            />
            {error && (
              <p className="text-xs text-red-600 mt-1">{error}</p>
            )}
          </div>
          <button
            type="submit"
            disabled={state === "sending" || !phone}
            className="w-full flex items-center justify-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-lg text-white transition-colors disabled:opacity-50"
            style={{ background: "#25D366" }}
          >
            {state === "sending" ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Envoi en cours...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Recevoir un message WhatsApp
              </>
            )}
          </button>
          <p className="text-[10px] text-[#A7A8AA] text-center">
            En cliquant, vous acceptez d&apos;être contacté par MetLife via
            WhatsApp. Vos données sont traitées conformément à notre politique
            de confidentialité.
          </p>
        </form>
      </div>
    )
  }

  // Idle state — CTA button
  return (
    <button
      onClick={() => setState("form")}
      className="w-full rounded-xl p-5 text-left transition-all hover:shadow-md border border-[#25D366]/20 bg-gradient-to-r from-[#25D366]/5 to-[#25D366]/10 hover:border-[#25D366]/40"
    >
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[#25D366] shrink-0">
          <MessageCircle className="h-5 w-5 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-[#1A1A1A] mb-0.5">
            Poursuivre sur WhatsApp
          </h3>
          <p className="text-xs text-[#75787B]">
            Posez vos questions à un conseiller MetLife directement sur WhatsApp
          </p>
        </div>
        <Send className="h-4 w-4 text-[#25D366] shrink-0" />
      </div>
    </button>
  )
}
