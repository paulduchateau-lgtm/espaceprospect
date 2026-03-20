import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldAlert, Shield, ShieldCheck } from "lucide-react";
import type { Risk } from "@/lib/types";

const severityConfig = {
  high: {
    color: "bg-red-100 text-red-800 border-red-200",
    label: "Risque eleve",
    Icon: ShieldAlert,
    borderColor: "#ef4444",
  },
  medium: {
    color: "bg-amber-100 text-amber-800 border-amber-200",
    label: "Risque modere",
    Icon: Shield,
    borderColor: "#f59e0b",
  },
  low: {
    color: "bg-green-100 text-green-800 border-green-200",
    label: "Risque faible",
    Icon: ShieldCheck,
    borderColor: "#22c55e",
  },
};

export function RiskCard({ risk }: { risk: Risk }) {
  const config = severityConfig[risk.severity];

  return (
    <Card
      data-testid="risk-card"
      className="border-l-4"
      style={{ borderLeftColor: config.borderColor }}
    >
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <config.Icon className="h-5 w-5" />
            <CardTitle className="text-base">{risk.label}</CardTitle>
          </div>
          <Badge variant="outline" className={config.color}>
            {config.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <CardDescription className="text-sm leading-relaxed">
          {risk.description}
        </CardDescription>
      </CardContent>
    </Card>
  );
}
