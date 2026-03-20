"use client";

import { useChatWithDashboard } from "@/hooks/useChatWithDashboard";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { SplitPanel } from "@/components/layout/SplitPanel";
import { AnimatedDashboardLayout } from "@/components/dashboard/AnimatedDashboardLayout";
import { ChatContainer } from "@/components/chat/ChatContainer";

export default function ProspectPage() {
  const { dashboardData, phase, messages, isStreaming, sendMessage } =
    useChatWithDashboard();
  const isDesktop = useMediaQuery("(min-width: 1024px)");

  return (
    <SplitPanel
      phase={phase}
      chatPanel={<ChatContainer />}
      dashboardPanel={
        dashboardData ? (
          <AnimatedDashboardLayout data={dashboardData} mobile={!isDesktop} />
        ) : null
      }
    />
  );
}
