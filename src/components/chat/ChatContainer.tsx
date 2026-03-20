'use client';

import { useState, useCallback } from 'react';
import type { UIMessage } from 'ai';
import { ChatHeader } from './ChatHeader';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';
import { SuggestedPrompts } from './SuggestedPrompts';

export function ChatContainer() {
  // Placeholder state — will be replaced by useChat in Plan 03
  const [messages, setMessages] = useState<UIMessage[]>([]);
  const [status, setStatus] = useState<'ready' | 'submitted' | 'streaming' | 'error'>('ready');

  const hasMessages = messages.length > 0;

  const handleSubmit = useCallback((text: string) => {
    // Placeholder: add user message to display
    // Will be replaced by sendMessage() from useChat in Plan 03
    const userMessage: UIMessage = {
      id: crypto.randomUUID(),
      role: 'user' as const,
      parts: [{ type: 'text' as const, text }],
      createdAt: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setStatus('submitted');

    // Simulate assistant response for layout testing
    setTimeout(() => {
      const assistantMessage: UIMessage = {
        id: crypto.randomUUID(),
        role: 'assistant' as const,
        parts: [
          {
            type: 'text' as const,
            text: "Merci pour ces informations. Je suis en train d'analyser votre situation...\n\n*(Réponse de démonstration — le streaming réel sera connecté dans l'étape suivante.)*",
          },
        ],
        createdAt: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setStatus('ready');
    }, 1500);
  }, []);

  const handleStop = useCallback(() => {
    setStatus('ready');
  }, []);

  return (
    <div className="flex flex-col h-dvh">
      <ChatHeader />

      {hasMessages ? (
        <MessageList messages={messages} status={status} />
      ) : (
        <SuggestedPrompts onPromptClick={handleSubmit} />
      )}

      {status === 'submitted' && (
        <div aria-live="assertive" role="status" className="sr-only">
          L&apos;assistant analyse votre situation...
        </div>
      )}

      <ChatInput
        onSubmit={handleSubmit}
        onStop={handleStop}
        status={status}
      />
    </div>
  );
}
