import { describe, it, expect, vi, beforeEach } from "vitest";
import type { ChatMessage, DashboardData } from "@/lib/types";

// Mock the db module before importing prospect
const mockExecute = vi.fn();
vi.mock("@/lib/db", () => ({
  client: {
    execute: (...args: unknown[]) => mockExecute(...args),
  },
  db: {},
}));

// Import after mock setup
import { createProspect, saveProspectData, loadProspect } from "@/lib/prospect";

const mockMessages: ChatMessage[] = [
  { id: "m1", role: "user", content: "Bonjour", createdAt: new Date() },
  {
    id: "m2",
    role: "assistant",
    content: "Comment puis-je vous aider?",
    createdAt: new Date(),
  },
];

const mockDashboard: DashboardData = {
  risks: [
    { id: "r1", label: "Incapacite", severity: "high", description: "Test" },
  ],
  products: [{ id: "p1", name: "Novaterm", relevance: "Adapte" }],
  partners: [],
  resources: [],
  profile: { profession: "Kine", sector: "Sante", concerns: ["incapacite"] },
};

describe("Prospect CRUD Module", () => {
  beforeEach(() => {
    mockExecute.mockReset();
  });

  describe("createProspect", () => {
    it("inserts into prospects table and returns a UUID", async () => {
      mockExecute.mockResolvedValueOnce({ rows: [] });

      const id = await createProspect();

      expect(id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
      );
      expect(mockExecute).toHaveBeenCalledOnce();

      const call = mockExecute.mock.calls[0][0];
      expect(call.sql).toContain("INSERT INTO prospects");
      expect(call.args[0]).toBe(id);
    });
  });

  describe("saveProspectData", () => {
    it("upserts conversation and inserts dashboard snapshot", async () => {
      mockExecute
        .mockResolvedValueOnce({ rows: [] }) // conversation upsert
        .mockResolvedValueOnce({ rows: [] }); // dashboard insert

      await saveProspectData("test-uuid", mockMessages, mockDashboard);

      expect(mockExecute).toHaveBeenCalledTimes(2);

      const convCall = mockExecute.mock.calls[0][0];
      expect(convCall.sql).toContain("INSERT OR REPLACE INTO conversations");
      expect(convCall.args[1]).toBe("test-uuid");
      expect(convCall.args[2]).toBe(JSON.stringify(mockMessages));

      const dashCall = mockExecute.mock.calls[1][0];
      expect(dashCall.sql).toContain("INSERT INTO dashboard_snapshots");
      expect(dashCall.args[1]).toBe("test-uuid");
      expect(dashCall.args[2]).toBe(JSON.stringify(mockDashboard));
    });
  });

  describe("loadProspect", () => {
    it("returns null when prospect not found", async () => {
      mockExecute.mockResolvedValueOnce({ rows: [] });

      const result = await loadProspect("nonexistent-uuid");

      expect(result).toBeNull();
      expect(mockExecute).toHaveBeenCalledOnce();
      const call = mockExecute.mock.calls[0][0];
      expect(call.sql).toContain("SELECT id FROM prospects");
    });

    it("returns parsed messages and dashboard when found", async () => {
      // JSON.stringify converts Date to ISO string; JSON.parse returns strings
      const serializedMessages = JSON.parse(JSON.stringify(mockMessages));
      mockExecute
        .mockResolvedValueOnce({ rows: [{ id: "test-uuid" }] }) // prospect found
        .mockResolvedValueOnce({
          rows: [{ messages: JSON.stringify(mockMessages) }],
        }) // conversation
        .mockResolvedValueOnce({
          rows: [{ data: JSON.stringify(mockDashboard) }],
        }); // dashboard

      const result = await loadProspect("test-uuid");

      expect(result).not.toBeNull();
      expect(result!.id).toBe("test-uuid");
      expect(result!.messages).toEqual(serializedMessages);
      expect(result!.dashboard).toEqual(mockDashboard);
    });

    it("returns empty messages and null dashboard when no data exists yet", async () => {
      mockExecute
        .mockResolvedValueOnce({ rows: [{ id: "test-uuid" }] }) // prospect found
        .mockResolvedValueOnce({ rows: [] }) // no conversation
        .mockResolvedValueOnce({ rows: [] }); // no dashboard

      const result = await loadProspect("test-uuid");

      expect(result).not.toBeNull();
      expect(result!.id).toBe("test-uuid");
      expect(result!.messages).toEqual([]);
      expect(result!.dashboard).toBeNull();
    });
  });
});
