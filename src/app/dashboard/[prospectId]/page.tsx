'use client';

import { use, useEffect, useState } from 'react';
import { SplitPanel } from '@/components/layout/SplitPanel';
import { AnimatedDashboardLayout } from '@/components/dashboard/AnimatedDashboardLayout';
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { ChatHeader } from '@/components/chat/ChatHeader';
import type { DashboardData, ChatMessage } from '@/lib/types';
import { Link as LinkIcon } from 'lucide-react';

type LoadState = 'loading' | 'loaded' | 'not-found' | 'error';

function ReadOnlyChatPanel({
  messages,
  prospectUrl,
}: {
  messages: ChatMessage[];
  prospectUrl: string;
}) {
  return (
    <div className="flex flex-col h-full">
      <ChatHeader />

      {/* Shareable URL banner */}
      <div className="bg-metlife-green/10 text-sm px-4 py-2 border-b border-border flex items-center gap-2">
        <LinkIcon className="h-3.5 w-3.5 text-metlife-green shrink-0" />
        <span className="text-muted-foreground">Your personal space:</span>
        <span className="font-medium truncate">{prospectUrl}</span>
      </div>

      {/* Read-only messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[480px] rounded-lg px-4 py-2 text-sm ${
                msg.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
      </div>

      {/* No input form -- read-only view */}
    </div>
  );
}

export default function ProspectDashboardPage({
  params,
}: {
  params: Promise<{ prospectId: string }>;
}) {
  const { prospectId } = use(params);
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const isDesktop = useMediaQuery('(min-width: 1024px)');

  useEffect(() => {
    fetch(`/api/prospect/${prospectId}`)
      .then((res) => {
        if (res.status === 404) {
          setLoadState('not-found');
          return null;
        }
        if (!res.ok) {
          setLoadState('error');
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (!data) return;
        setMessages(data.messages || []);
        setDashboardData(data.dashboard || null);
        setLoadState('loaded');
      })
      .catch(() => {
        setLoadState('error');
      });
  }, [prospectId]);

  if (loadState === 'not-found') {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <h1 className="text-xl font-semibold">Prospect space not found</h1>
        <p className="text-sm text-muted-foreground">
          This space does not exist or has been deleted.
        </p>
        <a
          href="/"
          className="text-sm text-primary underline hover:text-primary/80"
        >
          Back to home
        </a>
      </div>
    );
  }

  if (loadState === 'error') {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <h1 className="text-xl font-semibold">Loading error</h1>
        <p className="text-sm text-muted-foreground">
          Unable to load your prospect space. Please try again.
        </p>
        <a
          href="/"
          className="text-sm text-primary underline hover:text-primary/80"
        >
          Back to home
        </a>
      </div>
    );
  }

  const prospectUrl = typeof window !== 'undefined' ? window.location.href : '';

  return (
    <SplitPanel
      phase="dashboard"
      chatPanel={
        <ReadOnlyChatPanel messages={messages} prospectUrl={prospectUrl} />
      }
      dashboardPanel={
        loadState === 'loading' ? (
          <DashboardSkeleton />
        ) : dashboardData ? (
          <AnimatedDashboardLayout data={dashboardData} mobile={!isDesktop} />
        ) : null
      }
    />
  );
}
