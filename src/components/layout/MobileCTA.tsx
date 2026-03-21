"use client";

import { Phone } from "lucide-react";

export function MobileCTA() {
  return (
    <div
      data-testid="mobile-cta"
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-[#D9D9D6] bg-white p-3 lg:hidden"
    >
      <button
        className="w-full flex items-center justify-center gap-2 font-semibold text-sm text-[#1A1A1A] transition-colors hover:brightness-95 active:brightness-90"
        style={{
          background: "#A4CE4E",
          borderRadius: "0.375rem",
          minHeight: 48,
          border: "none",
          cursor: "pointer",
        }}
      >
        <Phone className="h-4 w-4" />
        Contacter un conseiller MetLife
      </button>
    </div>
  );
}
