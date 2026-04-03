'use client';

import { useRef, useEffect } from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { ChatHeader } from './ChatHeader';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';
import { SuggestedPrompts } from './SuggestedPrompts';
import { ChatErrorBanner } from './ChatErrorBanner';

const chatTransport = new DefaultChatTransport({
  api: '/api/chat',
});

export function ChatContainer() {
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const { messages, sendMessage, status, error, stop, regenerate } = useChat({
    transport: chatTransport,
    onError: (error) => {
      // Error handling enhanced in Plan 04
      console.error('[Chat Error]', error);
    },
    onFinish: ({ message }) => {
      // Placeholder for Phase 4 dashboard transition
      // Will inspect message.parts for tool-invocation with dashboard data
      inputRef.current?.focus();
    },
  });

  const hasMessages = messages.length > 0;

  const handleSubmit = (text: string) => {
    sendMessage({ text });
  };

  // Return focus to input when status returns to ready
  useEffect(() => {
    if (status === 'ready' && hasMessages) {
      inputRef.current?.focus();
    }
  }, [status, hasMessages]);

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
          The assistant is analyzing your situation...
        </div>
      )}

      {error && <ChatErrorBanner error={error} onRetry={regenerate} />}

      <ChatInput
        onSubmit={handleSubmit}
        onStop={stop}
        status={status}
        ref={inputRef}
      />
    </div>
  );
}
