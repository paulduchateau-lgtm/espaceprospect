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
  const [prospectId, setProspectId] = useState<string | null>(null);
  const [prospectUrl, setProspectUrl] = useState<string | null>(null);

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

    // Create prospect on first message
    let currentProspectId = prospectId;
    if (!currentProspectId) {
      try {
        const prospectRes = await fetch("/api/prospect", { method: "POST" });
        if (prospectRes.ok) {
          const { id } = await prospectRes.json();
          currentProspectId = id;
          setProspectId(id);
          setProspectUrl(`${window.location.origin}/dashboard/${id}`);
        }
      } catch (err) {
        console.error("[Prospect] Creation failed:", err);
      }
    }

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
          if (!line.startsWith("data: ")) continue;
          const rawData = line.slice(6);
          if (rawData === "[DONE]") continue;

          try {
            const chunk = JSON.parse(rawData);

            // UIMessage stream protocol: accumulate text-delta chunks
            if (chunk.type === "text-delta" && typeof chunk.delta === "string") {
              assistantContent += chunk.delta;
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === assistantId
                    ? { ...msg, content: assistantContent }
                    : msg
                )
              );
              continue;
            }

            // Tool invocation result (dashboard generation)
            if (chunk.type === "tool-result" && chunk.toolName === "generate_dashboard") {
              try {
                const parsed = dashboardDataSchema.safeParse(chunk.result);
                if (parsed.success) {
                  const dashData = parsed.data as DashboardData;
                  setDashboardData(dashData);
                  setPhase("dashboard");

                  // Save prospect data non-blocking
                  if (currentProspectId) {
                    const finalAssistantMsg: ChatMessage = {
                      id: assistantId,
                      role: "assistant",
                      content: assistantContent,
                      createdAt: new Date(),
                    };
                    const messagesForSave = [userMessage, finalAssistantMsg];
                    fetch(`/api/prospect/${currentProspectId}/save`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        messages: messagesForSave,
                        dashboard: dashData,
                      }),
                    }).catch(console.error);
                  }
                } else {
                  console.error("Invalid dashboard data from AI:", parsed.error);
                  setError("Les donnees du dashboard n'ont pas pu etre validees.");
                }
              } catch (parseErr) {
                console.error("Failed to parse dashboard data:", parseErr);
              }
              continue;
            }

            // Ignore other chunk types (start, start-step, text-start, text-end, finish, etc.)
          } catch {
            // Non-JSON data line — treat as plain text (fallback)
            assistantContent += rawData;
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === assistantId
                  ? { ...msg, content: assistantContent }
                  : msg
              )
            );
          }
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
  }, [prospectId]);

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
    prospectId,
    prospectUrl,
    sendMessage,
    resetConversation,
  };
}
