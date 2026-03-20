"use client";

import { Button } from "@/components/ui/button";
import { Phone } from "lucide-react";

export function MobileCTA() {
  return (
    <div
      data-testid="mobile-cta"
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background p-3 lg:hidden"
    >
      <Button
        className="w-full bg-primary hover:bg-primary-dark min-h-[48px]"
      >
        <Phone className="mr-2 h-4 w-4" />
        Contacter un conseiller MetLife
      </Button>
    </div>
  );
}
