'use client';

import { AlertCircle, Phone, RotateCcw } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button, buttonVariants } from '@/components/ui/button';
import { mapErrorToUserMessage } from '@/lib/chat-errors';

interface ChatErrorBannerProps {
  error: Error;
  onRetry: () => void;
}

export function ChatErrorBanner({ error, onRetry }: ChatErrorBannerProps) {
  const chatError = mapErrorToUserMessage(error);

  return (
    <div className="px-4 pb-2 shrink-0">
      <Alert variant="destructive" className="max-w-3xl mx-auto">
        <AlertCircle className="size-4" />
        <AlertTitle>{chatError.title}</AlertTitle>
        <AlertDescription>{chatError.message}</AlertDescription>
        <div className="flex gap-2 mt-3">
          {chatError.retryable && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRetry}
              className="gap-1.5"
            >
              <RotateCcw className="size-3.5" />
              Retry
            </Button>
          )}
          {chatError.action === 'contact' && (
            <a
              href="https://www.metlife.fr/contact/"
              target="_blank"
              rel="noopener noreferrer"
              className={buttonVariants({ variant: 'outline', size: 'sm' }) + ' gap-1.5'}
            >
              <Phone className="size-3.5" />
              Contact an advisor
            </a>
          )}
        </div>
      </Alert>
    </div>
  );
}
