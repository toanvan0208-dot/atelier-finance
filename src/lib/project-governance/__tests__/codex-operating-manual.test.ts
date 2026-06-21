import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const repoRoot = process.cwd();

const readDoc = (relativePath: string) =>
  readFileSync(path.join(repoRoot, relativePath), "utf8");

describe("Codex operating manual governance docs", () => {
  const operatingManual = "docs/product/CODEX_OPERATING_MANUAL.md";
  const guardrails = "docs/product/ATELIER_FINANCE_GUARDRAILS.md";
  const phaseStatus = "docs/product/IMPLEMENTATION_PHASE_STATUS.md";

  it("keeps Phase 84 governance docs present", () => {
    expect(readDoc(operatingManual)).toContain("# Codex Operating Manual");
    expect(readDoc(guardrails)).toContain("# Atelier Finance Guardrails");
    expect(readDoc(phaseStatus)).toContain("# Implementation Phase Status");
  });

  it("documents critical Codex operating rules and default validation", () => {
    const doc = readDoc(operatingManual);

    expect(doc).toContain("Do not use git add .");
    expect(doc).toContain("npx prisma validate");
    expect(doc).toContain("npx tsc --noEmit");
    expect(doc).toContain("npm run lint");
    expect(doc).toContain("npm test");
    expect(doc).toContain("Compressed Future Prompt Template");
  });

  it("documents data guardrails for missing values, units, and approval status", () => {
    const doc = readDoc(guardrails);

    expect(doc).toContain("Do not use `0` to replace missing data.");
    expect(doc).toContain("Do not guess unit by magnitude.");
    expect(doc).toContain("productionApproved:false");
  });

  it("records latest Phase 83 status and commit", () => {
    const doc = readDoc(phaseStatus);

    expect(doc).toContain("Phase 83");
    expect(doc).toContain("3df05d0");
    expect(doc).toContain("Financials Data Source Transparency UI Readiness");
  });
});
