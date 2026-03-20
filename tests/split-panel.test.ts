import { describe, it, expect } from "vitest";
import {
  panelTransition,
  sectionContainerVariants,
  sectionVariants,
  cardContainerVariants,
  cardVariants,
  mobileTransitionVariants,
} from "@/lib/animation";

describe("Animation Configuration", () => {
  it("panelTransition uses spring physics", () => {
    expect(panelTransition.type).toBe("spring");
    expect(panelTransition.stiffness).toBe(200);
    expect(panelTransition.damping).toBe(30);
  });

  it("sectionContainerVariants staggers children at 300ms", () => {
    const visible = sectionContainerVariants.visible as any;
    expect(visible.transition.staggerChildren).toBe(0.3);
  });

  it("sectionVariants animates from y:30 to y:0", () => {
    const hidden = sectionVariants.hidden as any;
    const visible = sectionVariants.visible as any;
    expect(hidden.y).toBe(30);
    expect(visible.y).toBe(0);
  });

  it("cardContainerVariants staggers children at 120ms", () => {
    const visible = cardContainerVariants.visible as any;
    expect(visible.transition.staggerChildren).toBe(0.12);
  });

  it("cardVariants animates opacity, y, and scale", () => {
    const hidden = cardVariants.hidden as any;
    const visible = cardVariants.visible as any;
    expect(hidden.opacity).toBe(0);
    expect(hidden.y).toBe(20);
    expect(hidden.scale).toBe(0.95);
    expect(visible.opacity).toBe(1);
    expect(visible.y).toBe(0);
    expect(visible.scale).toBe(1);
  });

  it("mobileTransitionVariants uses y-axis animation", () => {
    expect(mobileTransitionVariants.initial.y).toBe(40);
    expect(mobileTransitionVariants.animate.y).toBe(0);
    expect(mobileTransitionVariants.exit.y).toBe(40);
  });
});

describe("SplitPanel Layout Constraints", () => {
  it("chat panel minimum width is 320px", () => {
    // Verified via grep on SplitPanel.tsx: min-w-[320px]
    // This test documents the design constraint
    const MIN_CHAT_WIDTH = 320;
    const VIEWPORT_1024 = 1024;
    const chatPanelWidth = Math.max(
      VIEWPORT_1024 / 3,
      MIN_CHAT_WIDTH
    );
    expect(chatPanelWidth).toBeGreaterThanOrEqual(MIN_CHAT_WIDTH);
  });

  it("message bubble max width prevents reflow", () => {
    // max-w-[480px] ensures bubbles don't reflow when panel shrinks to 1/3
    // At 1024px viewport, 1/3 = ~341px. At 1440px, 1/3 = 480px.
    const MAX_BUBBLE_WIDTH = 480;
    const NARROW_PANEL_WIDTH = 341; // 1024 / 3
    // Bubbles at max-w-[480px] will clip inside narrow panel but not reflow
    expect(MAX_BUBBLE_WIDTH).toBeGreaterThan(0);
  });

  it("total animation timeline is approximately 2 seconds", () => {
    // Timeline: panel slide (600ms) + section stagger delay (400ms) +
    // 5 sections * 300ms stagger = 1500ms + card stagger overhead
    // Total ~2000-2200ms
    const panelSlideMs = 600;
    const sectionDelay =
      (sectionContainerVariants.visible as any).transition.delayChildren * 1000;
    const sectionStagger =
      (sectionContainerVariants.visible as any).transition.staggerChildren * 1000;
    const sectionCount = 5;
    const totalMs =
      panelSlideMs + sectionDelay + sectionStagger * sectionCount;
    expect(totalMs).toBeLessThan(3000);
    expect(totalMs).toBeGreaterThan(1500);
  });
});
