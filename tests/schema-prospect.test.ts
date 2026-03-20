import { describe, it, expect } from "vitest";
import * as schema from "@/db/schema";

describe("Prospect Persistence Schema", () => {
  it("exports prospects table", () => {
    expect(schema.prospects).toBeDefined();
    // Verify it's a sqliteTable with expected columns
    const cols = Object.keys(schema.prospects);
    expect(cols).toContain("id");
    expect(cols).toContain("createdAt");
    expect(cols).toContain("updatedAt");
    expect(cols).toContain("consentGiven");
    expect(cols).toContain("consentAt");
  });

  it("exports conversations table", () => {
    expect(schema.conversations).toBeDefined();
    const cols = Object.keys(schema.conversations);
    expect(cols).toContain("id");
    expect(cols).toContain("prospectId");
    expect(cols).toContain("messages");
    expect(cols).toContain("createdAt");
    expect(cols).toContain("updatedAt");
  });

  it("exports dashboardSnapshots table", () => {
    expect(schema.dashboardSnapshots).toBeDefined();
    const cols = Object.keys(schema.dashboardSnapshots);
    expect(cols).toContain("id");
    expect(cols).toContain("prospectId");
    expect(cols).toContain("data");
    expect(cols).toContain("createdAt");
  });

  it("preserves existing contentChunks and scrapeLog tables", () => {
    expect(schema.contentChunks).toBeDefined();
    expect(schema.scrapeLog).toBeDefined();
  });
});
