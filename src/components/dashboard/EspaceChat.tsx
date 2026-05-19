"use client"

import {
  useRef,
  useState,
  useEffect,
  useCallback,
  useId,
} from "react"
import { MessageCircle, X, SendHorizonal, Camera, ArrowRight, PanelRightClose } from "lucide-react"

interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
}

interface ComparisonContext {
  document_type: string
  current_contract: { insurer: string; product_name: string; monthly_price?: string }
  rows: Array<{ category: string; label: string; current_value: string; metlife_essentiel: string; metlife_premium: string; verdict: string }>
  summary: string
  recommendation: string
}

interface EspaceChatProps {
  prospectId: string
  prospectCode: string
  initialMessages?: ChatMessage[]
  onImageUpload?: (file: File) => void
  onConversationUpdate?: () => void
  comparisonContext?: ComparisonContext | null
  isOpen: boolean
  onToggle: () => void
}

function LoadingDotsInline() {
  return (
    <div
      className="flex gap-1 items-center px-1 py-1"
      aria-label="L'assistant prépare une réponse..."
    >
      <span className="size-2 rounded-full bg-[#75787B]/50 animate-bounce [animation-delay:0ms]" />
      <span className="size-2 rounded-full bg-[#75787B]/50 animate-bounce [animation-delay:150ms]" />
      <span className="size-2 rounded-full bg-[#75787B]/50 animate-bounce [animation-delay:300ms]" />
    </div>
  )
}

const PANEL_WIDTH = 420

export { PANEL_WIDTH as CHAT_PANEL_WIDTH }

export function EspaceChat({ prospectId, prospectCode, initialMessages = [], onImageUpload, onConversationUpdate, comparisonContext, isOpen, onToggle }: EspaceChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages)
  const [input, setInput] = useState("")
  const [isStreaming, setIsStreaming] = useState(false)
  const [hasUnread, setHasUnread] = useState(false)
  const [photoToast, setPhotoToast] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const textareaId = useId()

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [])

  useEffect(() => {
    if (isOpen) {
      scrollToBottom()
      setHasUnread(false)
    }
  }, [isOpen, messages, scrollToBottom])

  // Focus textarea when panel opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => textareaRef.current?.focus(), 300)
    }
  }, [isOpen])

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isStreaming) return

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      content: text.trim(),
    }

    setMessages((prev) => [...prev, userMsg])
    setInput("")
    if (textareaRef.current) textareaRef.current.style.height = "auto"

    const assistantId = `a-${Date.now()}`
    setMessages((prev) => [
      ...prev,
      { id: assistantId, role: "assistant", content: "" },
    ])
    setIsStreaming(true)

    abortRef.current = new AbortController()

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text.trim(), prospectId, comparisonContext: comparisonContext ?? undefined }),
        signal: abortRef.current.signal,
      })

      if (!res.ok || !res.body) throw new Error(`Erreur ${res.status}`)

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split("\n")
        buffer = lines.pop() ?? ""

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue
          const raw = line.slice(6).trim()
          if (raw === "[DONE]") break

          try {
            const parsed = JSON.parse(raw) as { type?: string; delta?: string }
            if (parsed.type === "text-delta" && typeof parsed.delta === "string") {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId
                    ? { ...m, content: m.content + parsed.delta }
                    : m
                )
              )
            }
          } catch {
            // ligne SSE non-JSON, on ignore
          }
        }
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? {
                  ...m,
                  content:
                    "Désolé, une erreur s'est produite. Veuillez réessayer.",
                }
              : m
          )
        )
      }
    } finally {
      setIsStreaming(false)
      abortRef.current = null
      if (!isOpen) setHasUnread(true)
      // Dashboard may have been updated server-side via generate_dashboard tool
      setTimeout(() => onConversationUpdate?.(), 500)
    }
  }, [isStreaming, prospectId, isOpen, onConversationUpdate, comparisonContext])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault()
        sendMessage(input)
      }
    },
    [input, sendMessage]
  )

  const handleTextareaInput = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setInput(e.target.value)
      const el = e.target
      el.style.height = "auto"
      el.style.height = `${Math.min(el.scrollHeight, 120)}px`
    },
    []
  )

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return
      onImageUpload?.(file)

      if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
      setPhotoToast(true)
      toastTimerRef.current = setTimeout(() => setPhotoToast(false), 3000)

      if (fileInputRef.current) fileInputRef.current.value = ""
    },
    [onImageUpload]
  )

  const handleWhatsApp = useCallback(() => {
    const businessPhone = process.env.NEXT_PUBLIC_WHATSAPP_BUSINESS_PHONE
    if (!businessPhone) {
      document.getElementById("whatsapp-section")?.scrollIntoView({ behavior: "smooth" })
      onToggle()
      return
    }
    const text = encodeURIComponent(`Bonjour, je souhaite poursuivre ma conversation MetLife. Mon code : ${prospectCode}`)
    window.open(`https://wa.me/${businessPhone}?text=${text}`, '_blank')
  }, [prospectCode, onToggle])

  const handleOpen = useCallback(() => {
    onToggle()
    setHasUnread(false)
  }, [onToggle])

  const handleClose = useCallback(() => {
    onToggle()
    abortRef.current?.abort()
  }, [onToggle])

  const canSend = input.trim().length > 0 && !isStreaming

  const lastMessage = messages.at(-1)
  const showLoadingDots =
    isStreaming &&
    lastMessage?.role === "assistant" &&
    lastMessage.content === ""

  return (
    <>
      {/* Floating bubble — collapsed state */}
      <div
        className="fixed bottom-6 right-6 z-50"
        style={{
          pointerEvents: isOpen ? "none" : "auto",
          opacity: isOpen ? 0 : 1,
          transform: isOpen ? "scale(0.8)" : "scale(1)",
          transition: "opacity 200ms ease, transform 200ms ease",
        }}
      >
        <button
          onClick={handleOpen}
          aria-label="Ouvrir l'assistant MetLife"
          className="relative flex items-center justify-center w-14 h-14 rounded-full shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#0090DA] hover:scale-105 active:scale-95 transition-transform"
          style={{ background: "#0090DA" }}
        >
          <MessageCircle className="w-6 h-6 text-white" strokeWidth={2} />
          {hasUnread && (
            <span
              aria-label="Nouveaux messages"
              className="absolute top-0.5 right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white"
              style={{ background: "#0061A0" }}
            />
          )}
        </button>
      </div>

      {/* Side panel */}
      <div
        role="dialog"
        aria-label="Assistant MetLife"
        className="fixed top-0 right-0 bottom-0 z-40 flex flex-col border-l shadow-xl"
        style={{
          width: `${PANEL_WIDTH}px`,
          borderColor: "#D9D9D6",
          background: "#FFFFFF",
          transform: isOpen ? "translateX(0)" : `translateX(${PANEL_WIDTH}px)`,
          transition: "transform 300ms cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3 shrink-0"
          style={{ background: "#0090DA" }}
        >
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white/20">
              <MessageCircle className="w-4 h-4 text-white" strokeWidth={2} />
            </div>
            <span className="text-sm font-medium text-white tracking-tight">
              Votre assistant MetLife
            </span>
          </div>
          <button
            onClick={handleClose}
            aria-label="Fermer l'assistant"
            className="p-1.5 rounded-full hover:bg-white/20 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
            title="Fermer le panel"
          >
            <PanelRightClose className="w-4 h-4 text-white" strokeWidth={2} />
          </button>
        </div>

        {/* Message list */}
        <div
          className="flex-1 overflow-y-auto px-4 py-4 space-y-3"
          style={{ background: "#F2F2F2" }}
          aria-live="polite"
          aria-label="Conversation avec l'assistant"
        >
          {messages.length === 0 && !isStreaming && (
            <p className="text-xs text-center py-6" style={{ color: "#75787B" }}>
              Bonjour ! Posez-moi vos questions sur nos solutions, ou envoyez-moi votre tableau de garanties actuel pour le comparer aux produits MetLife.
            </p>
          )}

          {messages.map((msg, index) => {
            const isUser = msg.role === "user"
            const isLastAssistant =
              !isUser && index === messages.length - 1 && isStreaming

            return (
              <div
                key={msg.id}
                className={`flex gap-2 ${isUser ? "flex-row-reverse" : "flex-row"}`}
              >
                {!isUser && (
                  <div
                    className="flex items-center justify-center w-7 h-7 rounded-full shrink-0 mt-0.5 text-[10px] font-semibold text-white"
                    style={{ background: "#0061A0" }}
                    aria-hidden="true"
                  >
                    ML
                  </div>
                )}

                <div
                  className={`px-3 py-2 rounded-2xl text-sm max-w-[85%] ${
                    isUser ? "rounded-br-sm" : "rounded-bl-sm"
                  }`}
                  style={
                    isUser
                      ? { background: "#0061A0", color: "#FFFFFF" }
                      : { background: "#FFFFFF", color: "#1A1A1A", border: "1px solid #D9D9D6" }
                  }
                >
                  {isLastAssistant && msg.content === "" ? (
                    <LoadingDotsInline />
                  ) : (
                    <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                  )}
                </div>
              </div>
            )
          })}

          {showLoadingDots && messages.length === 0 && (
            <div className="flex gap-2">
              <div
                className="flex items-center justify-center w-7 h-7 rounded-full shrink-0 text-[10px] font-semibold text-white"
                style={{ background: "#0061A0" }}
                aria-hidden="true"
              >
                ML
              </div>
              <div
                className="px-3 py-2 rounded-2xl rounded-bl-sm border"
                style={{ background: "#FFFFFF", borderColor: "#D9D9D6" }}
              >
                <LoadingDotsInline />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Toast notification — photo upload */}
        {photoToast && (
          <div
            className="absolute left-4 right-4 flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-white shadow-md transition-all"
            style={{
              bottom: "100px",
              background: "#0061A0",
            }}
            role="status"
            aria-live="polite"
          >
            <Camera className="w-3.5 h-3.5 shrink-0" />
            Photo envoyée pour analyse
          </div>
        )}

        {/* Input area */}
        <div
          className="shrink-0 px-3 py-3 border-t"
          style={{ borderColor: "#D9D9D6", background: "#FFFFFF" }}
        >
          <div className="flex items-end gap-2">
            {/* Camera / upload button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              aria-label="Envoyer une photo pour analyse"
              title="Analyser une photo de garantie"
              className="flex items-center justify-center w-9 h-9 rounded-lg border shrink-0 transition-colors hover:border-[#0090DA] hover:bg-[#0090DA]/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0090DA]"
              style={{ borderColor: "#D9D9D6", color: "#75787B" }}
            >
              <Camera className="w-4 h-4" strokeWidth={2} />
            </button>

            {/* Textarea */}
            <label htmlFor={textareaId} className="sr-only">
              Saisir un message
            </label>
            <textarea
              id={textareaId}
              ref={textareaRef}
              value={input}
              onChange={handleTextareaInput}
              onKeyDown={handleKeyDown}
              placeholder="Posez votre question..."
              aria-label="Saisir un message"
              disabled={isStreaming}
              rows={1}
              className="flex-1 resize-none rounded-lg border px-3 py-2 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#0090DA]/40 focus:border-[#0090DA] disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                minHeight: "36px",
                maxHeight: "120px",
                borderColor: "#D9D9D6",
                color: "#1A1A1A",
                background: "#F2F2F2",
              }}
            />

            {/* Send button */}
            <button
              type="button"
              onClick={() => sendMessage(input)}
              disabled={!canSend}
              aria-label="Envoyer le message"
              className="flex items-center justify-center w-9 h-9 rounded-lg shrink-0 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0090DA] disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background: canSend ? "#0090DA" : "#D9D9D6",
                color: "#FFFFFF",
              }}
            >
              <SendHorizonal className="w-4 h-4" strokeWidth={2} />
            </button>

            {/* WhatsApp button */}
            <button
              type="button"
              onClick={handleWhatsApp}
              aria-label="Poursuivre sur WhatsApp"
              title="Poursuivre sur WhatsApp"
              className="flex items-center justify-center w-9 h-9 rounded-lg shrink-0 transition-colors hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366]"
              style={{ background: "#25D366" }}
            >
              <ArrowRight className="w-4 h-4 text-white" strokeWidth={2} />
            </button>
          </div>

          <p className="mt-1.5 text-[10px] text-center" style={{ color: "#A7A8AA" }}>
            Entrée pour envoyer · Maj+Entrée pour retour à la ligne
          </p>
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,application/pdf"
        onChange={handleFileChange}
        className="hidden"
        aria-hidden="true"
      />
    </>
  )
}
