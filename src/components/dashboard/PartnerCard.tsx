import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Scale, Activity, Moon } from "lucide-react";
import { partners } from "@/config/partners";
import type { PartnerRecommendation } from "@/lib/types";

const partnerIcons = {
  caarl: Scale,
  doado: Activity,
  noctia: Moon,
} as const;

export function PartnerCard({ partner }: { partner: PartnerRecommendation }) {
  const config = partners[partner.id];
  const Icon = partnerIcons[partner.id];

  return (
    <Card data-testid="partner-card" className="bg-muted/50">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-base">{config.name}</CardTitle>
            <CardDescription className="text-xs">
              {config.tagline}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{partner.relevance}</p>
      </CardContent>
    </Card>
  );
}
