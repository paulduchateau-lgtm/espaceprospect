'use client';

import type { UIMessage } from 'ai';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { StreamingText } from './StreamingText';
import { LoadingDots } from './LoadingDots';

interface MessageBubbleProps {
  message: UIMessage;
  isStreaming?: boolean;
  isLoading?: boolean;
}

export function MessageBubble({ message, isStreaming = false, isLoading = false }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  // Extract text content from message parts
  const textContent = message.parts
    .filter((part): part is Extract<typeof part, { type: 'text' }> => part.type === 'text')
    .map((part) => part.text)
    .join('');

  return (
    <article
      role="article"
      aria-label={isUser ? 'Votre message' : "Réponse de l'assistant"}
      className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'} mb-4`}
    >
      {/* Avatar — assistant only */}
      {!isUser && (
        <Avatar className="size-8 shrink-0 mt-1">
          <AvatarImage src="/metlife-logo.png" alt="MetLife" />
          <AvatarFallback className="bg-primary text-white text-xs">ML</AvatarFallback>
        </Avatar>
      )}

      {/* Bubble */}
      <div
        className={`px-4 py-3 ${
          isUser
            ? 'ml-auto bg-metlife-navy text-white rounded-2xl rounded-br-sm max-w-[80%] sm:max-w-[70%]'
            : 'mr-auto bg-muted text-foreground rounded-2xl rounded-bl-sm max-w-[90%] sm:max-w-[85%]'
        }`}
      >
        {isLoading ? (
          <LoadingDots />
        ) : isUser ? (
          <p className="text-sm whitespace-pre-wrap">{textContent}</p>
        ) : (
          <div className="text-sm">
            <StreamingText content={textContent} isStreaming={isStreaming} />
          </div>
        )}
      </div>
    </article>
  );
}
