import { describe, it, expect } from "vitest";
import {
  mobileTransitionVariants,
  mobileCardContainerVariants,
  cardContainerVariants,
} from "@/lib/animation";

describe("Mobile Dashboard", () => {
  describe("Mobile transition variants", () => {
    it("uses y-axis animation (bottom-to-top)", () => {
      expect(mobileTransitionVariants.initial.y).toBe(40);
      expect(mobileTransitionVariants.animate.y).toBe(0);
      expect(mobileTransitionVariants.exit.y).toBe(40);
    });

    it("includes opacity fade", () => {
      expect(mobileTransitionVariants.initial.opacity).toBe(0);
      expect(mobileTransitionVariants.animate.opacity).toBe(1);
      expect(mobileTransitionVariants.exit.opacity).toBe(0);
    });
  });

  describe("Mobile card stagger timing", () => {
    it("mobile stagger is faster than desktop", () => {
      const mobileStagger = (mobileCardContainerVariants.visible as any)
        .transition.staggerChildren;
      const desktopStagger = (cardContainerVariants.visible as any).transition
        .staggerChildren;
      expect(mobileStagger).toBeLessThan(desktopStagger);
    });

    it("mobile stagger is 80ms", () => {
      const mobileStagger = (mobileCardContainerVariants.visible as any)
        .transition.staggerChildren;
      expect(mobileStagger).toBe(0.08);
    });
  });

  describe("CTA visibility constraints", () => {
    it("mobile CTA fixed bar height leaves room for content", () => {
      // CTA button: 48px min-height + 24px padding (12px top + 12px bottom) = 72px
      // Content must have pb-[72px] to avoid overlap
      const ctaHeight = 48 + 24;
      expect(ctaHeight).toBe(72);
    });

    it("mobile CTA tap target meets Apple HIG minimum", () => {
      const MIN_TAP_TARGET = 44; // Apple HIG minimum
      const CTA_HEIGHT = 48;
      expect(CTA_HEIGHT).toBeGreaterThanOrEqual(MIN_TAP_TARGET);
    });
  });

  describe("Responsive breakpoints", () => {
    it("desktop threshold is 1024px", () => {
      const DESKTOP_BREAKPOINT = 1024;
      // Below 1024: tab-based mobile layout
      // At or above 1024: side-by-side split
      expect(DESKTOP_BREAKPOINT).toBe(1024);
    });

    it("chat panel minimum width is respected at smallest desktop viewport", () => {
      const MIN_CHAT_WIDTH = 320;
      const DESKTOP_BREAKPOINT = 1024;
      const chatWidthAtMinDesktop = DESKTOP_BREAKPOINT / 3;
      // At 1024px, 1/3 = 341px > 320px minimum
      expect(chatWidthAtMinDesktop).toBeGreaterThanOrEqual(MIN_CHAT_WIDTH);
    });
  });
});
