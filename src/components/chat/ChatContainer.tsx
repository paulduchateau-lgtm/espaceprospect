'use client';

import { useState } from 'react';
import type { UIMessage } from 'ai';
import { ChatHeader } from './ChatHeader';
import { MessageList } from './MessageList';

export function ChatContainer() {
  // Placeholder state — will be replaced by useChat in Plan 03
  const [messages] = useState<UIMessage[]>([]);
  const status = 'ready' as const;
  const hasMessages = messages.length > 0;

  return (
    <div className="flex flex-col h-dvh">
      <ChatHeader />

      {/* Message area — placeholder until Plans 02/03 add empty state and useChat */}
      {hasMessages ? (
        <MessageList messages={messages} status={status} />
      ) : (
        <div className="flex-1 flex items-center justify-center text-muted-foreground">
          <p className="text-center text-sm">
            Décrivez votre situation pour commencer...
          </p>
        </div>
      )}

      {/* Input placeholder — replaced in Plan 02 */}
      <div className="sticky bottom-0 bg-background border-t border-border p-3 shrink-0">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-4 py-3 text-muted-foreground text-sm">
            Décrivez votre situation (métier, âge, préoccupations)...
          </div>
        </div>
      </div>
    </div>
  );
}
