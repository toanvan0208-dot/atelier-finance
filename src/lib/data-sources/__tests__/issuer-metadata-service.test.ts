import { describe, expect, it } from "vitest";

import { getIssuerMetadata } from "../issuer-metadata-service";

describe("issuer metadata service", () => {
  it("returns controlled local company metadata for FPT/MWG/VNM", () => {
    const fpt = getIssuerMetadata("fpt");
    const mwg = getIssuerMetadata("MWG");
    const vnm = getIssuerMetadata("vnm");
    const output = JSON.stringify([fpt, mwg, vnm]).toLowerCase();

    expect(fpt).toMatchObject({
      ticker: "FPT",
      displayName: "FPT",
      companyName: "FPT Corporation",
      issuerName: "FPT Corporation",
      exchange: "HOSE",
      industry: "Information technology",
      sector: null,
      sourceLabel: "controlled_local_company_metadata",
      dataMode: "research_only",
      verificationStatus: "controlled_local_research",
      productionApproved: false,
    });
    expect(mwg.companyName).toBe("Mobile World Investment Corporation");
    expect(mwg.exchange).toBe("HOSE");
    expect(mwg.industry).toBe("Retail");
    expect(vnm.companyName).toBe("Vietnam Dairy Products Joint Stock Company");
    expect(vnm.exchange).toBe("HOSE");
    expect(vnm.industry).toBe("Consumer staples");
    expect(output).not.toContain("official");
    expect(output).not.toContain("realtime");
    expect(output).not.toContain("source-approved");
    expect(output).not.toContain("production-approved");
    expect(output).not.toContain("recommendation");
    expect(output).not.toContain("signal");
  });

  it("keeps sharesOutstanding unavailable instead of zero-filling it", () => {
    const metadata = getIssuerMetadata("fpt");

    expect(metadata.sharesOutstanding).toBeNull();
    expect(metadata.sharesUnit).toBeNull();
    expect(metadata.sharesStatus).toBe("unavailable");
    expect(metadata.sharesOutstanding).not.toBe(0);
    expect(JSON.stringify(metadata.limitations)).toContain("Valuation fully DB-backed");
  });

  it("returns unavailable metadata for unknown tickers", () => {
    const metadata = getIssuerMetadata("NOPE");

    expect(metadata).toMatchObject({
      ticker: "NOPE",
      displayName: null,
      companyName: null,
      issuerName: null,
      industry: null,
      sector: null,
      sourceLabel: "unavailable",
      dataMode: "unavailable",
      verificationStatus: "unavailable",
      productionApproved: false,
      sharesOutstanding: null,
      sharesUnit: null,
      sharesStatus: "unavailable",
    });
  });
});
