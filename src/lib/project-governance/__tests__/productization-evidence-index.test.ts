import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const repoRoot = process.cwd();

const readDoc = (relativePath: string) =>
  readFileSync(path.join(repoRoot, relativePath), "utf8");

describe("Phase 92 productization evidence docs", () => {
  const indexPath = "docs/product/PRODUCTIZATION_EVIDENCE_INDEX.md";
  const narrativePath = "docs/product/DEMO_NARRATIVE_AND_MODULE_WALKTHROUGH.md";

  it("keeps the productization evidence docs present", () => {
    expect(existsSync(path.join(repoRoot, indexPath))).toBe(true);
    expect(existsSync(path.join(repoRoot, narrativePath))).toBe(true);
  });

  it("indexes the core modules and AI/RAG evidence", () => {
    const doc = readDoc(indexPath);

    for (const marker of ["Overview", "Financials", "Valuation", "Technical/PVT", "Macro", "Industry", "AI/RAG"]) {
      expect(doc).toContain(marker);
    }
  });

  it("keeps the demo narrative bounded by Valuation and source guardrails", () => {
    const doc = readDoc(narrativePath);

    expect(doc).toContain("canClaimValuationDbBacked:false");
    expect(doc).toContain("No production-approved data claim.");
    expect(doc).toContain("does not provide target price/fair value/recommendation");
    expect(doc).toContain("does not provide trading signals");
  });

  it("documents no production-approved claim and no recommendation-style output", () => {
    const docs = `${readDoc(indexPath)}\n${readDoc(narrativePath)}`;

    expect(docs).toContain("No production-approved data claim.");
    expect(docs).toContain("does not provide target price/fair value/recommendation");
    expect(docs).toContain("does not provide trading signals");
  });
});
