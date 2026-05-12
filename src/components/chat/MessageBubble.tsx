'use client';

import { Phone } from 'lucide-react';
import type { UIMessage } from 'ai';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { buttonVariants } from '@/components/ui/button';
import { StreamingText } from './StreamingText';
import { LoadingDots } from './LoadingDots';

// Phrases that indicate Claude is redirecting to an advisor (UX-03 fallback)
const FALLBACK_INDICATORS = [
  'conseiller metlife',
  'situation est spécifique',
  'attention particulière',
  'échangez directement',
  'accompagner de manière personnalisée',
] as const;

function isFallbackResponse(text: string): boolean {
  const lower = text.toLowerCase();
  // Must contain at least 2 indicators to avoid false positives
  const matchCount = FALLBACK_INDICATORS.filter((phrase) => lower.includes(phrase)).length;
  return matchCount >= 2;
}

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
            {!isStreaming && !isLoading && isFallbackResponse(textContent) && (
              <a
                href="https://www.metlife.fr/contact/"
                target="_blank"
                rel="noopener noreferrer"
                className={buttonVariants({ variant: 'default', size: 'sm' }) + ' mt-3 gap-1.5'}
              >
                <Phone className="size-3.5" />
                Contacter un conseiller MetLife
              </a>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
