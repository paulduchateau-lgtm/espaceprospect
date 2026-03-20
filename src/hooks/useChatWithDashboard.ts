"use client";

import { useState, useCallback } from "react";
import { dashboardDataSchema } from "@/lib/schemas";
import type { DashboardData, ChatMessage } from "@/lib/types";

export type Phase = "chatting" | "analyzing" | "dashboard";

export function useChatWithDashboard() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    null
  );
  const [phase, setPhase] = useState<Phase>("chatting");
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(async (content: string) => {
    setIsStreaming(true);
    setError(null);

    // Add user message
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content,
      createdAt: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);

    // Create placeholder assistant message for streaming
    const assistantId = crypto.randomUUID();
    let assistantContent = "";

    setMessages((prev) => [
      ...prev,
      {
        id: assistantId,
        role: "assistant",
        content: "",
        createdAt: new Date(),
      },
    ]);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: content }),
      });

      if (!response.ok) {
        throw new Error(`Erreur serveur: ${response.status}`);
      }

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        let isNextLineDashboard = false;

        for (const line of lines) {
          if (line.startsWith("event: dashboard")) {
            isNextLineDashboard = true;
            continue;
          }

          if (isNextLineDashboard && line.startsWith("data: ")) {
            isNextLineDashboard = false;
            const rawJson = line.slice(6);
            try {
              const parsed = dashboardDataSchema.safeParse(JSON.parse(rawJson));
              if (parsed.success) {
                setDashboardData(parsed.data as DashboardData);
                setPhase("dashboard");
              } else {
                console.error(
                  "Invalid dashboard data from AI:",
                  parsed.error
                );
                setError(
                  "Les donnees du dashboard n'ont pas pu etre validees."
                );
              }
            } catch (parseErr) {
              console.error("Failed to parse dashboard JSON:", parseErr);
            }
            continue;
          }

          if (line.startsWith("data: ")) {
            const textChunk = line.slice(6);
            assistantContent += textChunk;
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === assistantId
                  ? { ...msg, content: assistantContent }
                  : msg
              )
            );
          }

          isNextLineDashboard = false;
        }
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Une erreur inattendue est survenue.";
      setError(errorMessage);
      // Update assistant message with error fallback
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantId
            ? {
                ...msg,
                content:
                  "Desolee, une erreur est survenue. Veuillez reessayer ou contacter un conseiller MetLife.",
              }
            : msg
        )
      );
    } finally {
      setIsStreaming(false);
    }
  }, []);

  const resetConversation = useCallback(() => {
    setMessages([]);
    setDashboardData(null);
    setPhase("chatting");
    setError(null);
  }, []);

  return {
    messages,
    dashboardData,
    phase,
    isStreaming,
    error,
    sendMessage,
    resetConversation,
  };
}
