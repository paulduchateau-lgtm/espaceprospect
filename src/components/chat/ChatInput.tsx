'use client';

import { forwardRef, useRef, useState, useCallback, useImperativeHandle } from 'react';
import { Button } from '@/components/ui/button';
import { SendHorizonal, Square } from 'lucide-react';

interface ChatInputProps {
  onSubmit: (text: string) => void;
  onStop?: () => void;
  disabled?: boolean;
  status: 'ready' | 'submitted' | 'streaming' | 'error';
}

export const ChatInput = forwardRef<HTMLTextAreaElement, ChatInputProps>(
  function ChatInput({ onSubmit, onStop, disabled = false, status }, ref) {
    const [input, setInput] = useState('');
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useImperativeHandle(ref, () => textareaRef.current!);

    const isProcessing = status === 'submitted' || status === 'streaming';
    const canSend = input.trim().length > 0 && !isProcessing && !disabled;

    const handleSubmit = useCallback(() => {
      if (!canSend) return;
      onSubmit(input.trim());
      setInput('');
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }, [input, canSend, onSubmit]);

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        // Enter sends; Shift+Enter inserts newline
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          handleSubmit();
        }
        if (e.key === 'Escape' && status === 'streaming' && onStop) {
          onStop();
        }
      },
      [handleSubmit, status, onStop]
    );

    const handleInput = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setInput(e.target.value);
      // Auto-resize textarea (capped at ~5 rows / 160px)
      const textarea = e.target;
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 160)}px`;
    }, []);

    return (
      <div className="sticky bottom-0 bg-background border-t border-border p-3 shrink-0">
        <form
          role="form"
          aria-label="Send a message"
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
          className="max-w-3xl mx-auto flex items-end gap-2"
        >
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder="Describe your situation (profession, age, concerns)..."
            aria-label="Describe your situation"
            aria-describedby="chat-input-help"
            disabled={isProcessing || disabled}
            rows={1}
            className="flex-1 min-h-[48px] max-h-[160px] resize-none rounded-lg border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <span id="chat-input-help" className="sr-only">
            Press Enter to send, Shift+Enter for a new line
          </span>

          {status === 'streaming' ? (
            <Button
              type="button"
              size="icon"
              variant="outline"
              onClick={onStop}
              aria-label="Stop generation"
              className="size-[48px] shrink-0"
            >
              <Square className="size-4" />
            </Button>
          ) : (
            <Button
              type="submit"
              size="icon"
              disabled={!canSend}
              aria-label="Send message"
              className="size-[48px] shrink-0 bg-primary hover:bg-primary-dark"
            >
              <SendHorizonal className="size-4" />
            </Button>
          )}
        </form>
      </div>
    );
  }
);
