'use client';

import Markdown from 'react-markdown';

interface StreamingTextProps {
  content: string;
  isStreaming?: boolean;
}

export function StreamingText({ content, isStreaming = false }: StreamingTextProps) {
  return (
    <div className={isStreaming ? 'streaming-cursor' : ''}>
      <Markdown
        components={{
          p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
          strong: ({ children }) => (
            <strong className="font-semibold text-primary-dark">{children}</strong>
          ),
          ul: ({ children }) => <ul className="list-disc pl-4 mb-2 space-y-1">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal pl-4 mb-2 space-y-1">{children}</ol>,
          li: ({ children }) => <li className="text-sm">{children}</li>,
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary underline hover:text-primary-dark">
              {children}
            </a>
          ),
          h3: ({ children }) => (
            <h3 className="font-semibold text-base mt-3 mb-1">{children}</h3>
          ),
          h4: ({ children }) => (
            <h4 className="font-semibold text-sm mt-2 mb-1">{children}</h4>
          ),
        }}
      >
        {content}
      </Markdown>
    </div>
  );
}
