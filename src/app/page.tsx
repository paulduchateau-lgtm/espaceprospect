"use client";

import { useState } from "react";
import { SplitPanel } from "@/components/layout/SplitPanel";
import { AnimatedDashboardLayout } from "@/components/dashboard/AnimatedDashboardLayout";
import { useChatWithDashboard } from "@/hooks/useChatWithDashboard";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { Button } from "@/components/ui/button";
import { SendHorizonal, Link as LinkIcon, Copy, Check } from "lucide-react";

const EXAMPLE_PROMPTS = [
  "Je suis kinesitherapeute liberal, 35 ans, je viens d'ouvrir mon cabinet",
  "Je suis architecte independant, 45 ans, marie avec 2 enfants",
  "Je suis infirmiere liberale, 28 ans, debut d'activite",
];

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

  return (
    <div className="flex flex-col h-full">
      <ChatHeader />

      {/* Prospect URL banner */}
      {prospectUrl && (
        <div className="bg-metlife-green/10 text-sm px-4 py-2 border-b border-border flex items-center gap-2">
          <LinkIcon className="h-3.5 w-3.5 text-metlife-green shrink-0" />
          <span className="text-muted-foreground shrink-0">
            Votre espace est sauvegarde. Retrouvez-le a tout moment :
          </span>
          <a
            href={prospectUrl}
            className="font-medium text-primary truncate hover:underline"
          >
            {prospectUrl}
          </a>
          <button
            type="button"
            onClick={handleCopy}
            className="shrink-0 p-1 rounded hover:bg-muted transition-colors"
            aria-label="Copier le lien"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-metlife-green" />
            ) : (
              <Copy className="h-3.5 w-3.5 text-muted-foreground" />
            )}
          </button>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full space-y-6">
            <h2 className="text-xl font-semibold text-center">
              Decouvrez comment MetLife peut proteger votre activite
            </h2>
            <p className="text-sm text-muted-foreground text-center max-w-md">
              Decrivez votre situation de travailleur non salarie et recevez des
              recommandations personnalisees.
            </p>
            <div className="flex flex-col gap-2 w-full max-w-md">
              {EXAMPLE_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => handlePromptClick(prompt)}
                  className="text-left text-sm p-3 rounded-lg border border-border hover:bg-muted transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[480px] rounded-lg px-4 py-2 text-sm ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted"
              }`}
            >
              {msg.content}
              {msg.role === "assistant" && isStreaming && !msg.content && (
                <span className="animate-pulse">...</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="border-t border-border p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Decrivez votre situation..."
            disabled={isStreaming}
            className="flex-1 rounded-lg border border-border bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          <Button type="submit" disabled={isStreaming || !input.trim()}>
            <SendHorizonal className="h-4 w-4" />
          </Button>
        </div>
      </form>
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
