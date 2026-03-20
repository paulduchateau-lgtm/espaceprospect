"use client";

import { cn } from "@/lib/utils";

interface MobileTabBarProps {
  activeTab: "chat" | "dashboard";
  onTabChange: (tab: "chat" | "dashboard") => void;
}

export function MobileTabBar({ activeTab, onTabChange }: MobileTabBarProps) {
  return (
    <div
      data-testid="mobile-tab-bar"
      className="flex border-b border-border bg-background"
    >
      <button
        type="button"
        role="tab"
        aria-selected={activeTab === "chat"}
        aria-label="Conversation"
        className={cn(
          "flex-1 py-3 text-sm font-medium transition-colors",
          activeTab === "chat"
            ? "border-b-2 border-primary text-primary"
            : "text-muted-foreground hover:text-foreground"
        )}
        onClick={() => onTabChange("chat")}
      >
        Conversation
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={activeTab === "dashboard"}
        aria-label="Mon espace"
        className={cn(
          "flex-1 py-3 text-sm font-medium transition-colors",
          activeTab === "dashboard"
            ? "border-b-2 border-primary text-primary"
            : "text-muted-foreground hover:text-foreground"
        )}
        onClick={() => onTabChange("dashboard")}
      >
        Mon espace
      </button>
    </div>
  );
}
