import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import type { ProductRecommendation } from "@/lib/types";

export function ProductCard({ product }: { product: ProductRecommendation }) {
  return (
    <Card data-testid="product-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{product.name}</CardTitle>
          {product.coverageType && (
            <Badge variant="secondary">{product.coverageType}</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <CardDescription className="text-sm leading-relaxed">
          {product.relevance}
        </CardDescription>
      </CardContent>
      {product.url && (
        <CardFooter>
          <a
            href={product.url}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            En savoir plus <ExternalLink className="ml-1 h-3 w-3" />
          </a>
        </CardFooter>
      )}
    </Card>
  );
}
