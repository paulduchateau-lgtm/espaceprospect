import { describe, it, expect } from "vitest";
import { dashboardDataSchema } from "@/lib/schemas";

describe("Dashboard Data Flow", () => {
  describe("SSE Dashboard Event Parsing", () => {
    it("parses a valid dashboard SSE event payload", () => {
      const ssePayload = JSON.stringify({
        risks: [
          {
            id: "r1",
            label: "Incapacite",
            severity: "high",
            description: "Risque principal",
          },
        ],
        products: [
          {
            id: "p1",
            name: "Super Novaterm",
            relevance: "Couverture adaptee",
          },
        ],
        profile: {
          profession: "Kine",
          sector: "Sante",
          concerns: ["incapacite"],
        },
      });

      const parsed = dashboardDataSchema.safeParse(JSON.parse(ssePayload));
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.risks).toHaveLength(1);
        expect(parsed.data.risks[0].severity).toBe("high");
        expect(parsed.data.partners).toEqual([]);
        expect(parsed.data.resources).toEqual([]);
      }
    });

    it("rejects malformed JSON payloads gracefully", () => {
      const result = dashboardDataSchema.safeParse("not-json");
      expect(result.success).toBe(false);
    });

    it("validates all three partner IDs are accepted", () => {
      for (const id of ["caarl", "doado", "noctia"]) {
        const data = {
          risks: [
            { id: "r1", label: "Test", severity: "low", description: "Test" },
          ],
          products: [
            { id: "p1", name: "Test", relevance: "Test" },
          ],
          partners: [{ id, relevance: "Test relevance" }],
          profile: {
            profession: "Test",
            sector: "Test",
            concerns: [],
          },
        };
        const result = dashboardDataSchema.safeParse(data);
        expect(result.success).toBe(true);
      }
    });

    it("validates all four resource types are accepted", () => {
      for (const type of ["article", "guide", "tool", "faq"]) {
        const data = {
          risks: [
            { id: "r1", label: "Test", severity: "low", description: "Test" },
          ],
          products: [
            { id: "p1", name: "Test", relevance: "Test" },
          ],
          resources: [{ title: "Test", url: "https://test.com", type }],
          profile: {
            profession: "Test",
            sector: "Test",
            concerns: [],
          },
        };
        const result = dashboardDataSchema.safeParse(data);
        expect(result.success).toBe(true);
      }
    });
  });

  describe("Risk Sorting", () => {
    it("sorts risks by severity: high > medium > low", () => {
      const risks = [
        { id: "r1", label: "Low", severity: "low" as const, description: "" },
        { id: "r2", label: "High", severity: "high" as const, description: "" },
        { id: "r3", label: "Medium", severity: "medium" as const, description: "" },
      ];

      const order = { high: 0, medium: 1, low: 2 };
      const sorted = [...risks].sort(
        (a, b) => order[a.severity] - order[b.severity]
      );

      expect(sorted[0].severity).toBe("high");
      expect(sorted[1].severity).toBe("medium");
      expect(sorted[2].severity).toBe("low");
    });
  });
});
