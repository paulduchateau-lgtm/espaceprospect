"use client";

import { motion } from "motion/react";
import type { DashboardData } from "@/lib/types";
import { RiskCard } from "./RiskCard";
import { ProductCard } from "./ProductCard";
import { PartnerCard } from "./PartnerCard";
import { ResourceList } from "./ResourceList";
import { AdvisorCTA } from "./AdvisorCTA";
import {
  sectionContainerVariants,
  sectionVariants,
  cardContainerVariants,
  cardVariants,
} from "@/lib/animation";

export function AnimatedDashboardLayout({ data }: { data: DashboardData }) {
  const sortedRisks = [...data.risks].sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 };
    return order[a.severity] - order[b.severity];
  });

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
          Votre profil : {data.profile.profession}
        </h2>
        <p className="text-sm text-muted-foreground">
          Secteur : {data.profile.sector}
        </p>
      </motion.section>

      {/* Risk cards with stagger */}
      <motion.section variants={sectionVariants}>
        <h3 className="text-md font-semibold mb-3">Risques identifies</h3>
        <motion.div
          className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2"
          variants={cardContainerVariants}
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
          Solutions MetLife recommandees
        </h3>
        <motion.div
          className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2"
          variants={cardContainerVariants}
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
          <h3 className="text-md font-semibold mb-3">Services partenaires</h3>
          <motion.div
            className="grid gap-4 sm:grid-cols-1 md:grid-cols-3"
            variants={cardContainerVariants}
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
          <h3 className="text-md font-semibold mb-3">Ressources utiles</h3>
          <ResourceList resources={data.resources} />
        </motion.section>
      )}

      {/* CTA -- always visible, appears last in stagger */}
      <motion.section variants={sectionVariants}>
        <AdvisorCTA />
      </motion.section>
    </motion.div>
  );
}
