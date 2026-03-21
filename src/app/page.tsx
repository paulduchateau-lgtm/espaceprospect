"use client";

import { useState } from "react";
import { SplitPanel } from "@/components/layout/SplitPanel";
import { AnimatedDashboardLayout } from "@/components/dashboard/AnimatedDashboardLayout";
import { useChatWithDashboard } from "@/hooks/useChatWithDashboard";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { Link as LinkIcon, Copy, Check } from "lucide-react";

const EXAMPLE_PROMPTS = [
  "Je suis kinesitherapeute liberal, 35 ans, je viens d'ouvrir mon cabinet",
  "Je suis architecte independant, 45 ans, marie avec 2 enfants",
  "Je suis infirmiere liberale, 28 ans, debut d'activite",
];

// Send icon SVG
function SendIcon({ color = "currentColor" }: { color?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13"/>
      <polygon points="22 2 15 22 11 13 2 9 22 2"/>
    </svg>
  );
}

// Bot avatar
function BotAvatar() {
  return (
    <div
      className="shrink-0 flex items-center justify-center rounded-full"
      style={{
        width: 32,
        height: 32,
        background: "linear-gradient(135deg, #0090DA, #A4CE4E)",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
      }}
      aria-hidden="true"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="10" rx="2"/>
        <circle cx="12" cy="5" r="2"/>
        <line x1="12" y1="7" x2="12" y2="11"/>
        <line x1="8" y1="16" x2="8" y2="16.01"/>
        <line x1="16" y1="16" x2="16" y2="16.01"/>
      </svg>
    </div>
  );
}

// User avatar
function UserAvatar() {
  return (
    <div
      className="shrink-0 flex items-center justify-center rounded-full"
      style={{
        width: 32,
        height: 32,
        background: "#0061A0",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
      }}
      aria-hidden="true"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
        <circle cx="12" cy="7" r="4"/>
      </svg>
    </div>
  );
}

// Loading dots indicator
function LoadingDots() {
  return (
    <div
      className="flex items-center justify-start gap-1.5 px-4 py-3 bg-white rounded-[18px_18px_18px_4px] border border-[#D9D9D6]"
      style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.07)" }}
      aria-label="L'assistant redige une reponse"
    >
      <span className="dot-pulse flex gap-1">
        <span />
        <span />
        <span />
      </span>
    </div>
  );
}

function ChatPanel({
  messages,
  isStreaming,
  sendMessage,
  prospectUrl,
}: {
  messages: ReturnType<typeof useChatWithDashboard>["messages"];
  isStreaming: boolean;
  sendMessage: (content: string) => void;
  prospectUrl: string | null;
}) {
  const [input, setInput] = useState("");
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!prospectUrl) return;
    navigator.clipboard.writeText(prospectUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(console.error);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;
    sendMessage(input.trim());
    setInput("");
  };

  const handlePromptClick = (prompt: string) => {
    if (isStreaming) return;
    sendMessage(prompt);
  };

  const hasInput = input.trim().length > 0;

  return (
    <div className="flex flex-col h-full bg-white">
      <ChatHeader />

      {/* Prospect URL banner */}
      {prospectUrl && (
        <div className="bg-[#A4CE4E]/10 text-sm px-4 py-2 border-b border-[#D9D9D6] flex items-center gap-2 min-w-0">
          <LinkIcon className="h-3.5 w-3.5 text-[#A4CE4E] shrink-0" />
          <span className="text-[#75787B] shrink-0">
            Votre espace est sauvegarde. Retrouvez-le a tout moment :
          </span>
          <a
            href={prospectUrl}
            className="flex-1 min-w-0 font-medium text-[#0090DA] truncate hover:underline"
          >
            {prospectUrl}
          </a>
          <button
            type="button"
            onClick={handleCopy}
            className="shrink-0 p-1 rounded hover:bg-[#F2F2F2] transition-colors"
            aria-label="Copier le lien"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-[#A4CE4E]" />
            ) : (
              <Copy className="h-3.5 w-3.5 text-[#75787B]" />
            )}
          </button>
        </div>
      )}

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5" style={{ background: "var(--ml-chat-bg)" }}>
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full space-y-6">
            {/* Welcome bot avatar */}
            <div
              className="flex items-center justify-center rounded-2xl"
              style={{
                width: 56,
                height: 56,
                background: "linear-gradient(135deg, #0090DA, #A4CE4E)",
                boxShadow: "0 4px 16px rgba(0,144,218,0.25)",
              }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="10" rx="2"/>
                <circle cx="12" cy="5" r="2"/>
                <line x1="12" y1="7" x2="12" y2="11"/>
                <line x1="8" y1="16" x2="8" y2="16.01"/>
                <line x1="16" y1="16" x2="16" y2="16.01"/>
              </svg>
            </div>
            <div className="text-center space-y-2">
              <h2 className="text-lg font-semibold text-[#1A1A1A]">
                Decouvrez comment MetLife peut proteger votre activite
              </h2>
              <p className="text-sm text-[#75787B] max-w-md">
                Decrivez votre situation de travailleur non salarie et recevez des
                recommandations personnalisees.
              </p>
            </div>
            {/* Example prompt chips */}
            <div className="flex flex-col gap-2 w-full max-w-md">
              {EXAMPLE_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => handlePromptClick(prompt)}
                  className="text-left text-xs px-4 py-2.5 font-medium text-[#0090DA] bg-white hover:bg-[#F2F2F2] transition-colors"
                  style={{
                    borderRadius: 99,
                    border: "1px solid #D9D9D6",
                  }}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, index) => {
          const isUser = msg.role === "user";
          const isLastAssistant =
            !isUser &&
            index === messages.length - 1 &&
            isStreaming &&
            !msg.content;

          return (
            <div
              key={msg.id}
              className={`flex items-end gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}
            >
              {isUser ? <UserAvatar /> : <BotAvatar />}

              <div className="flex flex-col" style={{ maxWidth: "min(75%, 480px)" }}>
                {isLastAssistant ? (
                  <LoadingDots />
                ) : (
                  <div
                    className="text-sm whitespace-pre-wrap"
                    style={{
                      padding: "14px 18px",
                      borderRadius: isUser ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                      background: isUser ? "#0061A0" : "#FFFFFF",
                      color: isUser ? "#FFFFFF" : "#1A1A1A",
                      lineHeight: 1.65,
                      border: isUser ? "none" : "1px solid #D9D9D6",
                      boxShadow: isUser ? "none" : "0 1px 3px rgba(0,0,0,0.07)",
                    }}
                  >
                    {msg.content}
                    {msg.role === "assistant" && isStreaming && index === messages.length - 1 && msg.content && (
                      <span className="streaming-cursor" />
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Suggestion chips */}
      {messages.length > 0 && !isStreaming && (
        <div className="px-4 pt-3 pb-0 bg-white flex gap-2 flex-wrap">
          {EXAMPLE_PROMPTS.slice(0, 3).map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => handlePromptClick(prompt)}
              className="text-xs font-medium text-[#0090DA] bg-white hover:bg-[#F2F2F2] transition-colors"
              style={{
                padding: "6px 14px",
                borderRadius: 99,
                border: "1px solid #D9D9D6",
              }}
            >
              {prompt}
            </button>
          ))}
        </div>
      )}

      {/* Input area */}
      <div className="px-4 pt-3 pb-3 bg-white border-t border-[#F2F2F2]">
        <form onSubmit={handleSubmit}>
          <div
            className="flex items-end gap-2"
            style={{
              background: "#F2F2F2",
              borderRadius: 12,
              padding: "8px 12px",
              border: "1px solid #D9D9D6",
            }}
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Decrivez votre situation..."
              disabled={isStreaming}
              className="flex-1 bg-transparent border-none outline-none text-sm text-[#1A1A1A] placeholder:text-[#A7A8AA] py-1.5"
              style={{ lineHeight: 1.4 }}
            />
            <button
              type="submit"
              disabled={isStreaming || !hasInput}
              className="flex items-center justify-center rounded-[10px] transition-colors shrink-0"
              style={{
                width: 44,
                height: 44,
                background: hasInput && !isStreaming ? "#0090DA" : "#D9D9D6",
                border: "none",
                cursor: hasInput && !isStreaming ? "pointer" : "default",
              }}
              aria-label="Envoyer"
            >
              <SendIcon color={hasInput && !isStreaming ? "#FFFFFF" : "#A7A8AA"} />
            </button>
          </div>
        </form>
        {/* Disclaimer */}
        <p className="text-center mt-2" style={{ fontSize: 10, color: "#A7A8AA", lineHeight: 1.4 }}>
          MetLife AI peut produire des informations inexactes. Verifiez les details importants avec votre conseiller.
        </p>
      </div>
    </div>
  );
}

export default function ProspectPage() {
  const { dashboardData, phase, messages, isStreaming, sendMessage, prospectUrl } =
    useChatWithDashboard();
  const isDesktop = useMediaQuery("(min-width: 1024px)");

  return (
    <SplitPanel
      phase={phase}
      chatPanel={
        <ChatPanel
          messages={messages}
          isStreaming={isStreaming}
          sendMessage={sendMessage}
          prospectUrl={prospectUrl}
        />
      }
      dashboardPanel={
        dashboardData ? (
          <AnimatedDashboardLayout data={dashboardData} mobile={!isDesktop} />
        ) : null
      }
    />
  );
}
