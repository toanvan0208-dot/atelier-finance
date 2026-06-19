import { describe, expect, it, vi } from "vitest";

import type { SourceEvidence } from "../types";
import {
  getSourcePolicy,
  normalizeOfficialDisclosureFinancialStatement,
  OFFICIAL_DISCLOSURE_FINANCIALS_SOURCE_ID,
} from "../index";

const verifiedEvidence: SourceEvidence = {
  sourceId: OFFICIAL_DISCLOSURE_FINANCIALS_SOURCE_ID,
  sourceName: "Official disclosure financials pilot candidate",
  sourceType: "company_disclosure",
  dataGroups: ["financial_statement", "company_profile"],
  homepageUrl: "https://disclosures.example.test",
  documentationUrl: "https://disclosures.example.test/docs",
  licenseName: "Pilot review fixture license",
  licenseUrl: "https://disclosures.example.test/license",
  termsUrl: "https://disclosures.example.test/terms",
  allowsPersonalUse: true,
  allowsAcademicUse: true,
  allowsCommercialUse: false,
  allowsRuntimeDisplay: false,
  allowsCaching: "unknown",
  allowsRedistribution: false,
  allowsDerivedData: "unknown",
  requiresAttribution: true,
  attributionText: "Source: official disclosure pilot fixture",
  accessMethod: "public_file",
  evidenceStatus: "verified",
  reviewedAt: "2026-06-19",
  reviewedBy: "unit-test",
  reviewNote: "Fixture only; not production-approved.",
  notes: "Local adapter skeleton fixture.",
  risks: ["not_production_approved"],
  blockedReason: null,
};

const baseRawRecord = {
  ticker: "FPTLAB",
  companyType: "non_financial",
  period: "2024Q4",
  periodType: "quarter",
  asOf: "2025-01-31",
  currency: "VND",
  unit: "VND",
  revenue: "1000000",
  grossProfit: "400000",
  netIncome: "120000",
  operatingCashFlow: "90000",
  totalAssets: "5000000",
  equity: "3000000",
  totalDebt: "700000",
  currentAssets: "1500000",
  currentLiabilities: "800000",
};

describe("official disclosure financials adapter skeleton", () => {
  it("registers the pilot source as needs legal review, not production-approved", () => {
    const policy = getSourcePolicy(OFFICIAL_DISCLOSURE_FINANCIALS_SOURCE_ID);

    expect(policy.usageStatus).toBe("needs_legal_review");
    expect(policy.sourceEvidence?.evidenceStatus).toBe("missing");
  });

  it("fails closed when source evidence is missing", () => {
    const result = normalizeOfficialDisclosureFinancialStatement({
      sourceId: OFFICIAL_DISCLOSURE_FINANCIALS_SOURCE_ID,
      sourceLabel: "Official disclosure financials pilot candidate",
      sourceUrl: "https://disclosures.example.test",
      fetchedAt: "2026-06-19T00:00:00.000Z",
      rawRecord: baseRawRecord,
    });

    expect(result.data).toBeNull();
    expect(result.metadata).toBeNull();
    expect(result.productionApproved).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "SOURCE_EVIDENCE_NOT_VERIFIED" }),
      ]),
    );
  });

  it("fails closed for blocked source status", () => {
    const result = normalizeOfficialDisclosureFinancialStatement({
      sourceLabel: "Official disclosure financials pilot candidate",
      sourceUrl: "https://disclosures.example.test",
      fetchedAt: "2026-06-19T00:00:00.000Z",
      rawRecord: baseRawRecord,
      sourceEvidence: { ...verifiedEvidence, blockedReason: "Blocked fixture." },
      evidenceStatus: "verified",
      usageStatus: "blocked",
      mode: "development",
    });

    expect(result.data).toBeNull();
    expect(result.readiness).toBe("not_ready");
    expect(result.productionApproved).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "SOURCE_BLOCKED" }),
      ]),
    );
  });

  it("does not allow production mode while usage still needs legal review", () => {
    const result = normalizeOfficialDisclosureFinancialStatement({
      sourceLabel: "Official disclosure financials pilot candidate",
      sourceUrl: "https://disclosures.example.test",
      fetchedAt: "2026-06-19T00:00:00.000Z",
      rawRecord: baseRawRecord,
      sourceEvidence: verifiedEvidence,
      evidenceStatus: "verified",
      usageStatus: "needs_legal_review",
      mode: "production",
    });

    expect(result.data).toBeNull();
    expect(result.productionApproved).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "SOURCE_NOT_PRODUCTION_USABLE" }),
      ]),
    );
  });

  it("normalizes a local-review fixture while keeping production approval false", () => {
    const result = normalizeOfficialDisclosureFinancialStatement({
      sourceLabel: "Official disclosure financials pilot candidate",
      sourceUrl: "https://disclosures.example.test",
      fetchedAt: "2026-06-19T00:00:00.000Z",
      rawRecord: baseRawRecord,
      sourceEvidence: verifiedEvidence,
      evidenceStatus: "verified",
      usageStatus: "needs_legal_review",
      mode: "development",
      now: new Date("2025-02-01T00:00:00.000Z"),
    });

    expect(result.errors).toHaveLength(0);
    expect(result.data?.ticker).toBe("FPTLAB");
    expect(result.data?.netIncome).toBe(120000);
    expect(result.metadata?.sourceType).toBe("company_disclosure");
    expect(result.metadata?.period?.type).toBe("quarter");
    expect(result.sourceEvidenceStatus).toBe("verified");
    expect(result.usageStatus).toBe("needs_legal_review");
    expect(result.productionApproved).toBe(false);
  });

  it("keeps missing numeric fields null instead of zero", () => {
    const result = normalizeOfficialDisclosureFinancialStatement({
      sourceLabel: "Official disclosure financials pilot candidate",
      sourceUrl: "https://disclosures.example.test",
      fetchedAt: "2026-06-19T00:00:00.000Z",
      rawRecord: {
        ...baseRawRecord,
        operatingCashFlow: "-",
        equity: "",
      },
      sourceEvidence: verifiedEvidence,
      evidenceStatus: "verified",
      usageStatus: "needs_legal_review",
      mode: "development",
      now: new Date("2025-02-01T00:00:00.000Z"),
    });

    expect(result.data?.operatingCashFlow).toBeNull();
    expect(result.data?.operatingCashFlow).not.toBe(0);
    expect(result.data?.equity).toBeNull();
    expect(result.data?.equity).not.toBe(0);
    expect(result.metadata?.missingFields).toContain("equity");
  });

  it("returns errors for invalid numbers without fallback values", () => {
    const result = normalizeOfficialDisclosureFinancialStatement({
      sourceLabel: "Official disclosure financials pilot candidate",
      sourceUrl: "https://disclosures.example.test",
      fetchedAt: "2026-06-19T00:00:00.000Z",
      rawRecord: {
        ...baseRawRecord,
        netIncome: "not-a-number",
      },
      sourceEvidence: verifiedEvidence,
      evidenceStatus: "verified",
      usageStatus: "needs_legal_review",
      mode: "development",
      now: new Date("2025-02-01T00:00:00.000Z"),
    });

    expect(result.data).toBeNull();
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "INVALID_NUMBER", field: "netIncome" }),
      ]),
    );
  });

  it("returns insufficient or not-ready output when required metadata is missing", () => {
    const result = normalizeOfficialDisclosureFinancialStatement({
      sourceLabel: "Official disclosure financials pilot candidate",
      sourceUrl: "https://disclosures.example.test",
      fetchedAt: "2026-06-19T00:00:00.000Z",
      rawRecord: {
        ...baseRawRecord,
        period: "",
        asOf: "",
      },
      sourceEvidence: verifiedEvidence,
      evidenceStatus: "verified",
      usageStatus: "needs_legal_review",
      mode: "development",
    });

    expect(result.data).toBeNull();
    expect(["insufficient_data", "not_ready"]).toContain(result.readiness);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "REQUIRED_FIELD_MISSING", field: "period" }),
        expect.objectContaining({ code: "AS_OF_MISSING", field: "asOf" }),
      ]),
    );
  });

  it("preserves source status and does not expose valuation or action fields", () => {
    const result = normalizeOfficialDisclosureFinancialStatement({
      sourceLabel: "Official disclosure financials pilot candidate",
      sourceUrl: "https://disclosures.example.test",
      fetchedAt: "2026-06-19T00:00:00.000Z",
      rawRecord: baseRawRecord,
      sourceEvidence: verifiedEvidence,
      evidenceStatus: "verified",
      usageStatus: "needs_legal_review",
      mode: "development",
      now: new Date("2025-02-01T00:00:00.000Z"),
    });

    expect(result.usageStatus).toBe("needs_legal_review");
    expect(result.productionApproved).toBe(false);
    expect(result).not.toHaveProperty("fairValue");
    expect(result).not.toHaveProperty("targetPrice");
    expect(result).not.toHaveProperty("recommendation");
    expect(result).not.toHaveProperty("signal");
  });

  it("does not call external fetch", () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    normalizeOfficialDisclosureFinancialStatement({
      sourceLabel: "Official disclosure financials pilot candidate",
      sourceUrl: "https://disclosures.example.test",
      fetchedAt: "2026-06-19T00:00:00.000Z",
      rawRecord: baseRawRecord,
      sourceEvidence: verifiedEvidence,
      evidenceStatus: "verified",
      usageStatus: "needs_legal_review",
      mode: "development",
      now: new Date("2025-02-01T00:00:00.000Z"),
    });

    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });
});
