import { describe, expect, it } from "vitest";

import {
  SOURCE_CANDIDATES,
  evaluateCandidateForAdapter,
  getBlockedCandidates,
  getCandidatesByDataGroup,
  getCandidatesNeedingLegalReview,
} from "../index";

const candidate = (id: string) => {
  const found = SOURCE_CANDIDATES.find((item) => item.candidateId === id);
  if (!found) throw new Error(`Missing candidate ${id}`);
  return found;
};

describe("source candidate evaluation matrix", () => {
  it("does not define any default candidate as approved", () => {
    expect(SOURCE_CANDIDATES.some((item) => item.currentPolicyStatus === "approved")).toBe(false);
  });

  it("keeps unknown candidates out of adapter-ready state", () => {
    const result = evaluateCandidateForAdapter(candidate("commercial-data-vendors"));

    expect(result.adapterReady).toBe(false);
    expect(result.productionReady).toBe(false);
    expect(result.blockers).toContain("Source evidence is not verified.");
    expect(result.blockers).toContain("Source policy status is unknown.");
  });

  it("keeps needs_legal_review candidates out of production-ready state", () => {
    const result = evaluateCandidateForAdapter(candidate("official-exchange-market-data"));

    expect(result.productionReady).toBe(false);
    expect(result.blockers).toContain("Source still needs legal review.");
  });

  it("blocks private or undocumented candidates", () => {
    const result = evaluateCandidateForAdapter(candidate("private-undocumented-apis"));

    expect(result.adapterReady).toBe(false);
    expect(result.productionReady).toBe(false);
    expect(result.blockers).toEqual(
      expect.arrayContaining([
        "Source policy status is blocked.",
        "Private or undocumented access is not adapter-ready.",
      ]),
    );
  });

  it("keeps official sources missing ToS or license in legal review", () => {
    const source = candidate("official-company-filings");

    expect(source.currentPolicyStatus).toBe("needs_legal_review");
    expect(source.evidenceStatus).toBe("missing");
    expect(evaluateCandidateForAdapter(source).productionReady).toBe(false);
  });

  it("allows academic/manual candidates only for thesis verification, not production", () => {
    const source = candidate("manual-academic-upload");

    expect(evaluateCandidateForAdapter(source, "thesis_verification").adapterReady).toBe(false);
    expect(evaluateCandidateForAdapter(source, "production").productionReady).toBe(false);
    expect(source.allowedModes).toEqual(["development", "thesis_verification"]);
  });

  it("returns candidates by data group", () => {
    const marketCandidates = getCandidatesByDataGroup("market").map((item) => item.candidateId);
    const macroCandidates = getCandidatesByDataGroup("macro").map((item) => item.candidateId);

    expect(marketCandidates).toContain("official-exchange-market-data");
    expect(macroCandidates).toContain("official-macro-statistical");
  });

  it("returns blocked and legal-review candidate groups", () => {
    expect(getBlockedCandidates().map((item) => item.candidateId)).toContain("private-undocumented-apis");
    expect(getCandidatesNeedingLegalReview().map((item) => item.candidateId)).toContain("scraped-sources");
  });
});

