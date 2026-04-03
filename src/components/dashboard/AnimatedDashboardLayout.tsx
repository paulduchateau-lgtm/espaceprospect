"use client";

import { motion } from "motion/react";
import type { DashboardData } from "@/lib/types";
import { RiskCard } from "./RiskCard";
import { ProductCard } from "./ProductCard";
import { PartnerCard } from "./PartnerCard";
import { ResourceList } from "./ResourceList";
import { AdvisorCTA } from "./AdvisorCTA";
import { Disclaimer } from "@/components/legal/Disclaimer";
import { TrustSignals } from "@/components/legal/TrustSignals";
import {
  sectionContainerVariants,
  sectionVariants,
  cardContainerVariants,
  cardVariants,
  mobileCardContainerVariants,
} from "@/lib/animation";

interface AnimatedDashboardLayoutProps {
  data: DashboardData;
  mobile?: boolean;
}

export function AnimatedDashboardLayout({
  data,
  mobile = false,
}: AnimatedDashboardLayoutProps) {
  const sortedRisks = [...data.risks].sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 };
    return order[a.severity] - order[b.severity];
  });

  const activeCardContainerVariants = mobile
    ? mobileCardContainerVariants
    : cardContainerVariants;

  return (
    <motion.div
      data-testid="dashboard-panel"
      className="p-6 space-y-8"
      variants={sectionContainerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Profile summary */}
      <motion.section variants={sectionVariants}>
        <h2 className="text-lg font-semibold mb-1">
          Your profile: {data.profile.profession}
        </h2>
        <p className="text-sm text-muted-foreground">
          Sector: {data.profile.sector}
        </p>
      </motion.section>

      {/* Risk cards with stagger */}
      <motion.section variants={sectionVariants}>
        <h3 className="text-md font-semibold mb-3">Identified risks</h3>
        <motion.div
          className="grid gap-4 grid-cols-1 lg:grid-cols-2"
          variants={activeCardContainerVariants}
          initial="hidden"
          animate="visible"
        >
          {sortedRisks.map((risk) => (
            <motion.div key={risk.id} variants={cardVariants}>
              <RiskCard risk={risk} />
            </motion.div>
          ))}
        </motion.div>
      </motion.section>

      {/* Product cards with stagger */}
      <motion.section variants={sectionVariants}>
        <h3 className="text-md font-semibold mb-3">
          Recommended MetLife solutions
        </h3>
        <motion.div
          className="grid gap-4 grid-cols-1 lg:grid-cols-2"
          variants={activeCardContainerVariants}
          initial="hidden"
          animate="visible"
        >
          {data.products.map((product) => (
            <motion.div key={product.id} variants={cardVariants}>
              <ProductCard product={product} />
            </motion.div>
          ))}
        </motion.div>
      </motion.section>

      {/* Partner cards with stagger */}
      {data.partners.length > 0 && (
        <motion.section variants={sectionVariants}>
          <h3 className="text-md font-semibold mb-3">Partner services</h3>
          <motion.div
            className="grid gap-4 grid-cols-1 md:grid-cols-3"
            variants={activeCardContainerVariants}
            initial="hidden"
            animate="visible"
          >
            {data.partners.map((partner) => (
              <motion.div key={partner.id} variants={cardVariants}>
                <PartnerCard partner={partner} />
              </motion.div>
            ))}
          </motion.div>
        </motion.section>
      )}

      {/* Resources */}
      {data.resources.length > 0 && (
        <motion.section variants={sectionVariants}>
          <h3 className="text-md font-semibold mb-3">Useful resources</h3>
          <ResourceList resources={data.resources} />
        </motion.section>
      )}

      {/* CTA -- desktop only (mobile uses fixed bottom bar) */}
      {!mobile && (
        <motion.section variants={sectionVariants}>
          <AdvisorCTA />
        </motion.section>
      )}

      {/* Legal: Disclaimer and Trust Signals */}
      <motion.section variants={sectionVariants}>
        <div className="mt-6 space-y-4">
          <Disclaimer />
          <TrustSignals />
        </div>
      </motion.section>
    </motion.div>
  );
}
