import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Phone } from "lucide-react";

export function AdvisorCTA() {
  return (
    <Card
      data-testid="advisor-cta"
      className="sticky bottom-4 border-primary/20 bg-primary/5"
    >
      <CardContent className="flex items-center justify-between py-4">
        <div>
          <p className="font-semibold text-sm">
            Vous souhaitez aller plus loin ?
          </p>
          <p className="text-xs text-muted-foreground">
            Un conseiller MetLife peut vous accompagner
          </p>
        </div>
        <Button className="bg-primary hover:bg-primary-dark">
          <Phone className="mr-2 h-4 w-4" />
          Contacter un conseiller
        </Button>
      </CardContent>
    </Card>
  );
}
