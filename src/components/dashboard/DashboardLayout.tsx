import type { DashboardData } from "@/lib/types";
import { RiskCard } from "./RiskCard";
import { ProductCard } from "./ProductCard";
import { PartnerCard } from "./PartnerCard";
import { ResourceList } from "./ResourceList";
import { AdvisorCTA } from "./AdvisorCTA";

export function DashboardLayout({ data }: { data: DashboardData }) {
  return (
    <div data-testid="dashboard-panel" className="p-6 space-y-8">
      {/* Profile summary */}
      <section>
        <h2 className="text-lg font-semibold mb-1">
          Your profile: {data.profile.profession}
        </h2>
        <p className="text-sm text-muted-foreground">
          Sector: {data.profile.sector}
        </p>
      </section>

      {/* Risk cards -- sorted by severity: high first */}
      <section>
        <h3 className="text-md font-semibold mb-3">Identified risks</h3>
        <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
          {data.risks
            .sort((a, b) => {
              const order = { high: 0, medium: 1, low: 2 };
              return order[a.severity] - order[b.severity];
            })
            .map((risk) => (
              <RiskCard key={risk.id} risk={risk} />
            ))}
        </div>
      </section>

      {/* Product cards */}
      <section>
        <h3 className="text-md font-semibold mb-3">
          Recommended MetLife solutions
        </h3>
        <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
          {data.products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* Partner cards -- only if partners exist */}
      {data.partners.length > 0 && (
        <section>
          <h3 className="text-md font-semibold mb-3">Partner services</h3>
          <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-3">
            {data.partners.map((partner) => (
              <PartnerCard key={partner.id} partner={partner} />
            ))}
          </div>
        </section>
      )}

      {/* Resources -- only if resources exist */}
      {data.resources.length > 0 && (
        <section>
          <h3 className="text-md font-semibold mb-3">Useful resources</h3>
          <ResourceList resources={data.resources} />
        </section>
      )}

      {/* CTA -- always visible (DASH-04) */}
      <AdvisorCTA />
    </div>
  );
}
