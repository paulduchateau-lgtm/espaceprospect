'use client';

import { useEffect, useRef } from 'react';
import type { UIMessage } from 'ai';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageBubble } from './MessageBubble';

interface MessageListProps {
  messages: UIMessage[];
  status: 'ready' | 'submitted' | 'streaming' | 'error';
}

export function MessageList({ messages, status }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages or streaming updates
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, status]);

  return (
    <ScrollArea className="flex-1 min-h-0">
      <div
        role="log"
        aria-live="polite"
        aria-label="Messages de la conversation"
        className="flex flex-col p-4 max-w-3xl mx-auto"
      >
        {messages.map((message, index) => {
          const isLastAssistant =
            message.role === 'assistant' && index === messages.length - 1;

          return (
            <MessageBubble
              key={message.id}
              message={message}
              isStreaming={isLastAssistant && status === 'streaming'}
              isLoading={isLastAssistant && status === 'submitted'}
            />
          );
        })}

        {/* Scroll anchor */}
        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  );
}
