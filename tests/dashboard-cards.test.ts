import { describe, it, expect } from "vitest";
import { dashboardDataSchema } from "@/lib/schemas";

const validDashboardData = {
  risks: [
    {
      id: "risk-1",
      label: "Arret de travail prolonge",
      severity: "high" as const,
      description: "En tant que kine liberal, un arret de travail met en peril vos revenus.",
    },
  ],
  products: [
    {
      id: "prod-1",
      name: "MetLife Super Novaterm",
      relevance: "Couvre votre incapacite de travail avec des indemnites journalieres.",
      url: "https://www.metlife.fr/prevoyance-tns",
      coverageType: "prevoyance",
    },
  ],
  partners: [
    { id: "doado" as const, relevance: "Prevention TMS adaptee aux kinesitherapeutes." },
  ],
  resources: [
    { title: "Guide prevoyance TNS", url: "https://metlife.fr/guide", type: "guide" as const },
  ],
  profile: {
    profession: "Kinesitherapeute",
    sector: "Sante",
    concerns: ["incapacite", "prevoyance"],
  },
};

describe("Dashboard Zod Schemas", () => {
  it("validates a complete dashboard data object", () => {
    const result = dashboardDataSchema.safeParse(validDashboardData);
    expect(result.success).toBe(true);
  });

  it("rejects invalid severity values", () => {
    const invalid = {
      ...validDashboardData,
      risks: [{ ...validDashboardData.risks[0], severity: "critical" }],
    };
    const result = dashboardDataSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("rejects invalid partner IDs", () => {
    const invalid = {
      ...validDashboardData,
      partners: [{ id: "unknown", relevance: "test" }],
    };
    const result = dashboardDataSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("defaults partners and resources to empty arrays when omitted", () => {
    const minimal = {
      risks: validDashboardData.risks,
      products: validDashboardData.products,
      profile: validDashboardData.profile,
    };
    const result = dashboardDataSchema.safeParse(minimal);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.partners).toEqual([]);
      expect(result.data.resources).toEqual([]);
    }
  });

  it("rejects missing required fields", () => {
    const result = dashboardDataSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});
