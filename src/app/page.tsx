"use client";

import { useState, useRef, useEffect } from "react";
import { useChatWithDashboard } from "@/hooks/useChatWithDashboard";
import {
  MessageCircle,
  X,
  ChevronRight,
  Shield,
  Users,
  TrendingUp,
  Phone,
} from "lucide-react";

// ──────────────────────────────────────────────
// Simulated metlife.fr site header
// ──────────────────────────────────────────────
function SiteHeader() {
  return (
    <header className="bg-white border-b border-[#D9D9D6] sticky top-0 z-40">
      <div className="max-w-[1200px] mx-auto flex items-center justify-between h-16 px-6">
        <div className="flex items-center gap-8">
          <img src="/metlife-logo.png" alt="MetLife" className="h-8" />
          <nav className="hidden md:flex items-center gap-6">
            <span className="text-sm font-medium text-[#1A1A1A] cursor-default">
              Individuals
            </span>
            <span className="text-sm font-medium text-[#0090DA] cursor-default">
              Self-Employed Workers
            </span>
            <span className="text-sm font-medium text-[#1A1A1A] cursor-default">
              Businesses
            </span>
            <span className="text-sm font-medium text-[#1A1A1A] cursor-default">
              About
            </span>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <button className="hidden sm:flex items-center gap-2 text-sm font-medium text-[#0090DA] hover:underline">
            <Phone className="h-4 w-4" />
            01 45 67 89 00
          </button>
          <button
            className="text-sm font-semibold px-4 py-2 rounded-md transition-colors"
            style={{ background: "#0090DA", color: "#FFFFFF" }}
          >
            My space
          </button>
        </div>
      </div>
    </header>
  );
}

// ──────────────────────────────────────────────
// Hero section
// ──────────────────────────────────────────────
function HeroSection({ onOpenChat }: { onOpenChat: () => void }) {
  return (
    <section className="bg-gradient-to-br from-[#0061A0] to-[#0090DA] text-white">
      <div className="max-w-[1200px] mx-auto px-6 py-20 md:py-28">
        <div className="max-w-2xl">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight mb-6">
            Protect your self-employed business activity
          </h1>
          <p className="text-lg md:text-xl text-white/85 mb-8 leading-relaxed">
            Income protection, disability, invalidity, death: solutions tailored to
            your professional and family situation.
          </p>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={onOpenChat}
              className="flex items-center gap-2 font-semibold text-sm px-6 py-3 rounded-md transition-colors hover:brightness-95"
              style={{ background: "#A4CE4E", color: "#1A1A1A" }}
            >
              Discover my solutions
              <ChevronRight className="h-4 w-4" />
            </button>
            <button className="flex items-center gap-2 font-semibold text-sm px-6 py-3 rounded-md border-2 border-white/40 text-white hover:bg-white/10 transition-colors">
              Request a callback
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

// ──────────────────────────────────────────────
// "Nouveau" CTA banner
// ──────────────────────────────────────────────
function NewFeatureBanner({ onOpenChat }: { onOpenChat: () => void }) {
  return (
    <section className="bg-[#A4CE4E]/10 border-b border-[#A4CE4E]/20">
      <div className="max-w-[1200px] mx-auto px-6 py-4 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#A4CE4E] text-[#1A1A1A]">
            New
          </span>
          <p className="text-sm text-[#1A1A1A]">
            <span className="font-semibold">
              Discover how MetLife can support you
            </span>{" "}
            with a personalized AI-powered space
          </p>
        </div>
        <button
          onClick={onOpenChat}
          className="text-sm font-semibold text-[#0090DA] hover:underline flex items-center gap-1 shrink-0"
        >
          Try it now
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </section>
  );
}

// ──────────────────────────────────────────────
// Trust signals strip
// ──────────────────────────────────────────────
function TrustStrip() {
  const items = [
    { icon: Shield, label: "ACPR Regulated", detail: "Supervisory authority" },
    { icon: TrendingUp, label: "A1 Rating", detail: "Moody's" },
    {
      icon: Users,
      label: "100M+ policyholders",
      detail: "Worldwide",
    },
  ];
  return (
    <section className="border-b border-[#D9D9D6] bg-white">
      <div className="max-w-[1200px] mx-auto px-6 py-6 grid grid-cols-1 sm:grid-cols-3 gap-6">
        {items.map((item) => (
          <div key={item.label} className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-[#0090DA]/7">
              <item.icon className="h-5 w-5 text-[#0090DA]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#1A1A1A]">
                {item.label}
              </p>
              <p className="text-xs text-[#75787B]">{item.detail}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ──────────────────────────────────────────────
// Product cards section (simulated site content)
// ──────────────────────────────────────────────
function ProductsSection() {
  const products = [
    {
      title: "Super Novaterm",
      description:
        "Life insurance with adjustable capital to protect your family and professional activity.",
      type: "Death",
    },
    {
      title: "Disability Coverage",
      description:
        "Daily allowances in case of work stoppage to maintain your self-employed income.",
      type: "Disability",
    },
    {
      title: "Invalidity Guarantee",
      description:
        "Capital and annuities in case of invalidity to secure your future and that of your loved ones.",
      type: "Invalidity",
    },
  ];
  return (
    <section className="bg-[#F2F2F2]">
      <div className="max-w-[1200px] mx-auto px-6 py-16">
        <h2 className="text-2xl font-bold text-[#1A1A1A] mb-2">
          Our solutions for the self-employed
        </h2>
        <p className="text-[#75787B] mb-8">
          Coverage designed for self-employed workers
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {products.map((p) => (
            <div
              key={p.title}
              className="bg-white rounded-xl p-6 border border-[#D9D9D6] hover:shadow-md transition-shadow cursor-pointer"
            >
              <span className="inline-block text-xs font-semibold px-2.5 py-1 rounded-full bg-[#0090DA]/8 text-[#0090DA] mb-4">
                {p.type}
              </span>
              <h3 className="text-lg font-semibold text-[#1A1A1A] mb-2">
                {p.title}
              </h3>
              <p className="text-sm text-[#75787B] leading-relaxed">
                {p.description}
              </p>
              <span className="inline-flex items-center gap-1 text-sm font-medium text-[#0090DA] mt-4 hover:underline">
                Learn more <ChevronRight className="h-3.5 w-3.5" />
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ──────────────────────────────────────────────
// Site footer
// ──────────────────────────────────────────────
function SiteFooter() {
  return (
    <footer className="bg-[#1A1A1A] text-white/60">
      <div className="max-w-[1200px] mx-auto px-6 py-10">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <img
              src="/metlife-logo.png"
              alt="MetLife"
              className="h-6 brightness-0 invert opacity-60 mb-2"
            />
            <p className="text-xs">
              MetLife, Inc. - World-class insurer since 1868
            </p>
          </div>
          <div className="flex flex-wrap gap-6 text-xs">
            <span className="hover:text-white cursor-pointer">
              Legal notices
            </span>
            <span className="hover:text-white cursor-pointer">
              Privacy policy
            </span>
            <span className="hover:text-white cursor-pointer">
              Cookie settings
            </span>
            <span className="hover:text-white cursor-pointer">Contact</span>
          </div>
        </div>
        <div className="mt-8 pt-6 border-t border-white/10">
          <p className="text-[11px] leading-relaxed text-white/40">
            This website is solely the property of LITE OPS SAS, and was made as a demonstrator for the confidential project opportunities shared between METLIFE FRANCE and LITE OPS SAS. The content is strictly confidential and should not be shared without explicit consent from LITE OPS SAS.
          </p>
        </div>
      </div>
    </footer>
  );
}

// ──────────────────────────────────────────────
// Embedded Chat Widget (framed)
// ──────────────────────────────────────────────
const EXAMPLE_PROMPTS = [
  "I'm a freelance physiotherapist, 35 years old, just opened my practice",
  "I'm a self-employed architect, 45 years old, married with 2 children",
  "I'm a freelance nurse, 28 years old, just starting out",
];

function SendIcon({ color = "currentColor" }: { color?: string }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}

function BotAvatar({ size = 32 }: { size?: number }) {
  return (
    <div
      className="shrink-0 flex items-center justify-center rounded-full"
      style={{
        width: size,
        height: size,
        background: "linear-gradient(135deg, #0090DA, #A4CE4E)",
      }}
      aria-hidden="true"
    >
      <svg
        width={size * 0.5}
        height={size * 0.5}
        viewBox="0 0 24 24"
        fill="none"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3" y="11" width="18" height="10" rx="2" />
        <circle cx="12" cy="5" r="2" />
        <line x1="12" y1="7" x2="12" y2="11" />
        <line x1="8" y1="16" x2="8" y2="16.01" />
        <line x1="16" y1="16" x2="16" y2="16.01" />
      </svg>
    </div>
  );
}

function UserAvatar() {
  return (
    <div
      className="shrink-0 flex items-center justify-center rounded-full"
      style={{ width: 28, height: 28, background: "#0061A0" }}
      aria-hidden="true"
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    </div>
  );
}

function LoadingDots() {
  return (
    <div
      className="flex items-center gap-1.5 px-3 py-2 bg-white rounded-[14px_14px_14px_4px] border border-[#D9D9D6]"
      style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}
      aria-label="The assistant is composing a response"
    >
      <span className="dot-pulse flex gap-1">
        <span />
        <span />
        <span />
      </span>
    </div>
  );
}

function CodeAccessForm() {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalized = code.trim().toUpperCase();
    if (normalized.length !== 6) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/prospect/by-code/${normalized}`);
      if (res.status === 404) {
        setError("Code not found. Please check and try again.");
        return;
      }
      if (!res.ok) {
        setError("Server error. Please try again.");
        return;
      }
      const data = await res.json();
      window.location.href = `/espace/${data.id}`;
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <p className="text-xs text-[#75787B] text-center mb-2">
        Already have a space? Enter your code
      </p>
      <div className="flex gap-2">
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z2-9]/g, "").slice(0, 6))}
          placeholder="ex. A3K9PX"
          maxLength={6}
          className="flex-1 text-center font-mono text-sm font-bold tracking-widest bg-white border border-[#E5E5E5] rounded-lg px-3 py-2 outline-none focus:border-[#0090DA] transition-colors"
          style={{ letterSpacing: "0.2em" }}
        />
        <button
          type="submit"
          disabled={code.length !== 6 || loading}
          className="shrink-0 text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
          style={{
            background: code.length === 6 && !loading ? "#0090DA" : "#D9D9D6",
            color: code.length === 6 && !loading ? "#FFFFFF" : "#A7A8AA",
          }}
        >
          {loading ? "..." : "Access"}
        </button>
      </div>
      {error && <p className="text-xs text-red-500 text-center mt-1.5">{error}</p>}
    </form>
  );
}

function ChatWidget({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const {
    messages,
    isStreaming,
    sendMessage,
    phase,
    dashboardData,
    prospectId,
  } = useChatWithDashboard();
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Prepare espace URL when dashboard is ready
  const espaceUrl = (() => {
    if (phase !== "dashboard" || !dashboardData) return null;
    if (prospectId) return `/espace/${prospectId}`;
    // Demo mode: store in sessionStorage for the espace page to read
    sessionStorage.setItem("demo-dashboard", JSON.stringify(dashboardData));
    return "/espace/demo";
  })();

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

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col" style={{ width: 400, height: 560, maxHeight: "calc(100dvh - 100px)", maxWidth: "calc(100vw - 32px)" }}>
      {/* Widget frame */}
      <div
        className="flex flex-col h-full bg-white overflow-hidden"
        style={{
          borderRadius: 16,
          boxShadow: "0 8px 40px rgba(0,0,0,0.15), 0 2px 8px rgba(0,0,0,0.08)",
          border: "1px solid #D9D9D6",
        }}
      >
        {/* Widget header */}
        <div
          className="flex items-center justify-between px-4 shrink-0"
          style={{
            height: 56,
            background: "linear-gradient(135deg, #0061A0, #0090DA)",
          }}
        >
          <div className="flex items-center gap-3">
            <BotAvatar size={32} />
            <div>
              <p className="text-sm font-semibold text-white">
                Assistant MetLife
              </p>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#A4CE4E]" />
                <span className="text-[10px] text-white/75">Online</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-white/15 transition-colors"
            aria-label="Close"
          >
            <X className="h-4 w-4 text-white" />
          </button>
        </div>

        {/* Messages area */}
        <div
          className="flex-1 overflow-y-auto px-4 py-4 space-y-4"
          style={{ background: "#F7F7F7" }}
        >
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full space-y-4 py-4">
              <BotAvatar size={44} />
              <div className="text-center space-y-1.5">
                <p className="text-sm font-semibold text-[#1A1A1A]">
                  Hello! How can I help you?
                </p>
                <p className="text-xs text-[#75787B] max-w-[280px]">
                  Describe your situation and receive personalized
                  recommendations.
                </p>
              </div>
              <div className="flex flex-col gap-2 w-full">
                {EXAMPLE_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => handlePromptClick(prompt)}
                    className="text-left text-xs px-3 py-2 text-[#0090DA] bg-white hover:bg-[#F2F2F2] transition-colors"
                    style={{
                      borderRadius: 10,
                      border: "1px solid #E5E5E5",
                    }}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
              <div className="w-full border-t border-[#E5E5E5] pt-3">
                <CodeAccessForm />
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
                className={`flex items-end gap-2 ${isUser ? "flex-row-reverse" : "flex-row"}`}
              >
                {isUser ? <UserAvatar /> : <BotAvatar size={28} />}
                <div style={{ maxWidth: "75%" }}>
                  {isLastAssistant ? (
                    <LoadingDots />
                  ) : (
                    <div
                      className="text-[13px] whitespace-pre-wrap"
                      style={{
                        padding: "10px 14px",
                        borderRadius: isUser
                          ? "14px 14px 4px 14px"
                          : "14px 14px 14px 4px",
                        background: isUser ? "#0061A0" : "#FFFFFF",
                        color: isUser ? "#FFFFFF" : "#1A1A1A",
                        lineHeight: 1.6,
                        border: isUser ? "none" : "1px solid #E5E5E5",
                        boxShadow: isUser
                          ? "none"
                          : "0 1px 2px rgba(0,0,0,0.04)",
                      }}
                    >
                      {msg.content}
                      {msg.role === "assistant" &&
                        isStreaming &&
                        index === messages.length - 1 &&
                        msg.content && <span className="streaming-cursor" />}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* CTA to navigate to espace */}
          {espaceUrl && (
            <div className="flex justify-center py-3">
              <a
                href={espaceUrl}
                className="flex items-center gap-2 text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors hover:brightness-95"
                style={{ background: "#A4CE4E", color: "#1A1A1A" }}
              >
                Go to my personalized space
                <ChevronRight className="h-4 w-4" />
              </a>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className="px-3 pt-2 pb-3 bg-white border-t border-[#F2F2F2]">
          <form onSubmit={handleSubmit}>
            <div
              className="flex items-center gap-2"
              style={{
                background: "#F2F2F2",
                borderRadius: 10,
                padding: "6px 10px",
              }}
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Describe your situation..."
                disabled={isStreaming || phase === "dashboard"}
                className="flex-1 bg-transparent border-none outline-none text-[13px] text-[#1A1A1A] placeholder:text-[#A7A8AA] py-1"
              />
              <button
                type="submit"
                disabled={isStreaming || !hasInput || phase === "dashboard"}
                className="flex items-center justify-center rounded-lg shrink-0 transition-colors"
                style={{
                  width: 36,
                  height: 36,
                  background:
                    hasInput && !isStreaming ? "#0090DA" : "#D9D9D6",
                  border: "none",
                  cursor:
                    hasInput && !isStreaming ? "pointer" : "default",
                }}
                aria-label="Send"
              >
                <SendIcon
                  color={hasInput && !isStreaming ? "#FFFFFF" : "#A7A8AA"}
                />
              </button>
            </div>
          </form>
          <p
            className="text-center mt-1.5"
            style={{ fontSize: 9, color: "#A7A8AA" }}
          >
            MetLife AI may produce inaccurate information.
          </p>
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// Floating chat trigger button
// ──────────────────────────────────────────────
function ChatTrigger({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 z-50 flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
      style={{
        width: 60,
        height: 60,
        borderRadius: "50%",
        background: "linear-gradient(135deg, #0090DA, #0061A0)",
        boxShadow: "0 4px 20px rgba(0,97,160,0.35)",
        border: "none",
        cursor: "pointer",
      }}
      aria-label="Open MetLife assistant"
    >
      <MessageCircle className="h-6 w-6 text-white" />
    </button>
  );
}

// ──────────────────────────────────────────────
// Main page component
// ──────────────────────────────────────────────
export default function MetLifeLandingPage() {
  const [chatOpen, setChatOpen] = useState(false);

  const openChat = () => setChatOpen(true);

  return (
    <div className="min-h-screen bg-white">
      <SiteHeader />
      <NewFeatureBanner onOpenChat={openChat} />
      <HeroSection onOpenChat={openChat} />
      <TrustStrip />
      <ProductsSection />
      <SiteFooter />

      {/* Chat widget */}
      {chatOpen ? (
        <ChatWidget isOpen={chatOpen} onClose={() => setChatOpen(false)} />
      ) : (
        <ChatTrigger onClick={openChat} />
      )}
    </div>
  );
}
