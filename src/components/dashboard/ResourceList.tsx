import { Badge } from "@/components/ui/badge";
import { ExternalLink, FileText, BookOpen, Wrench, HelpCircle } from "lucide-react";
import type { Resource } from "@/lib/types";

const typeConfig = {
  article: { label: "Article", Icon: FileText },
  guide: { label: "Guide", Icon: BookOpen },
  tool: { label: "Outil", Icon: Wrench },
  faq: { label: "FAQ", Icon: HelpCircle },
} as const;

export function ResourceList({ resources }: { resources: Resource[] }) {
  if (resources.length === 0) return null;

  return (
    <ul data-testid="resource-list" className="space-y-3">
      {resources.map((resource, index) => {
        const config = typeConfig[resource.type];
        return (
          <li key={`${resource.url}-${index}`}>
            <a
              href={resource.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-muted"
            >
              <config.Icon className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="flex-1 text-sm font-medium">
                {resource.title}
              </span>
              <Badge variant="outline" className="text-xs shrink-0">
                {config.label}
              </Badge>
              <ExternalLink className="h-3 w-3 text-muted-foreground shrink-0" />
            </a>
          </li>
        );
      })}
    </ul>
  );
}
