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
import { ExternalLink, ShieldCheck } from "lucide-react";
import type { ProductRecommendation } from "@/lib/types";

export function ProductCard({ product }: { product: ProductRecommendation }) {
  return (
    <Card
      data-testid="product-card"
      className="shadow-sm"
      style={{
        borderRadius: "12px",
        border: "1px solid #D9D9D6",
      }}
    >
      <CardHeader className="px-5 pt-5 pb-0">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            {/* Icon container — 32px with color-tinted bg */}
            <div
              className="flex items-center justify-center shrink-0 rounded-lg"
              style={{
                width: 32,
                height: 32,
                background: "rgba(0, 144, 218, 0.07)",
              }}
            >
              <ShieldCheck className="h-4 w-4 text-[#0090DA]" />
            </div>
            <CardTitle className="text-base">{product.name}</CardTitle>
          </div>
          {product.coverageType && (
            <Badge variant="secondary" className="shrink-0">{product.coverageType}</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="px-5 py-4">
        <CardDescription className="text-sm leading-relaxed">
          {product.relevance}
        </CardDescription>
      </CardContent>
      {product.url && (
        <CardFooter className="px-5 pb-5 pt-0">
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
