import { Card, CardContent } from "@/components/ui/card";
import { Phone } from "lucide-react";

export function AdvisorCTA() {
  return (
    <Card
      data-testid="advisor-cta"
      className="sticky bottom-4 shadow-sm"
      style={{
        borderRadius: "12px",
        border: "1px solid #D9D9D6",
        background: "#FFFFFF",
      }}
    >
      <CardContent className="flex items-center justify-between px-5 py-4">
        <div>
          <p className="font-semibold text-sm text-[#1A1A1A]">
            Vous souhaitez aller plus loin ?
          </p>
          <p className="text-xs text-[#75787B]">
            Un conseiller MetLife peut vous accompagner
          </p>
        </div>
        <button
          className="flex items-center gap-2 font-semibold text-sm text-[#1A1A1A] transition-colors hover:brightness-95 active:brightness-90 shrink-0"
          style={{
            background: "#A4CE4E",
            borderRadius: "0.375rem",
            padding: "8px 16px",
            border: "none",
            cursor: "pointer",
          }}
        >
          <Phone className="h-4 w-4" />
          Contacter un conseiller
        </button>
      </CardContent>
    </Card>
  );
}
