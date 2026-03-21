"use client";

import { type ReactNode, useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import { panelTransition, mobileTransitionVariants } from "@/lib/animation";
import type { Phase } from "@/hooks/useChatWithDashboard";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";
import { MobileTabBar } from "./MobileTabBar";
import { MobileCTA } from "./MobileCTA";

interface SplitPanelProps {
  phase: Phase;
  chatPanel: ReactNode;
  dashboardPanel: ReactNode | null;
}

export function SplitPanel({
  phase,
  chatPanel,
  dashboardPanel,
}: SplitPanelProps) {
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const [mobileTab, setMobileTab] = useState<"chat" | "dashboard">("chat");

  // Auto-switch to dashboard tab when dashboard data arrives on mobile
  useEffect(() => {
    if (!isDesktop && phase === "dashboard") {
      setMobileTab("dashboard");
    }
  }, [isDesktop, phase]);

  // Desktop: side-by-side split with animation
  if (isDesktop) {
    return (
      <div className="flex h-screen overflow-hidden">
        {/* Chat panel -- animates width change via layout prop */}
        <motion.div
          layout
          data-testid="chat-panel"
          className={cn(
            "flex flex-col border-r border-border overflow-y-auto",
            phase === "dashboard"
              ? "w-1/3 min-w-[320px]"
              : "w-full max-w-3xl mx-auto"
          )}
          transition={panelTransition}
        >
          {chatPanel}
        </motion.div>

        {/* Dashboard panel -- slides in from right */}
        <AnimatePresence>
          {phase === "analyzing" && (
            <motion.div
              key="dashboard-skeleton"
              className="flex-1 overflow-y-auto bg-[#F2F2F2]"
              initial={{ opacity: 0, x: 300 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 300 }}
              transition={panelTransition}
            >
              <DashboardSkeleton />
            </motion.div>
          )}
          {phase === "dashboard" && dashboardPanel && (
            <motion.div
              key="dashboard-content"
              className="flex-1 overflow-y-auto bg-[#F2F2F2]"
              initial={{ opacity: 0, x: 300 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 300 }}
              transition={panelTransition}
            >
              {dashboardPanel}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Mobile/Tablet: full-screen swap with tab navigation
  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Tab bar -- only visible after dashboard exists */}
      {phase === "dashboard" && (
        <MobileTabBar activeTab={mobileTab} onTabChange={setMobileTab} />
      )}

      {/* Content area with bottom padding for fixed CTA */}
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {mobileTab === "chat" || phase !== "dashboard" ? (
            <motion.div
              key="chat-mobile"
              data-testid="chat-panel"
              className={cn(
                "h-full overflow-y-auto",
                phase === "dashboard" && "pb-[72px]"
              )}
              {...mobileTransitionVariants}
            >
              {chatPanel}
            </motion.div>
          ) : (
            <motion.div
              key="dashboard-mobile"
              className="h-full overflow-y-auto pb-[72px]"
              {...mobileTransitionVariants}
            >
              {dashboardPanel}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Fixed CTA bar -- visible on both tabs once dashboard exists */}
      {phase === "dashboard" && <MobileCTA />}
    </div>
  );
}
