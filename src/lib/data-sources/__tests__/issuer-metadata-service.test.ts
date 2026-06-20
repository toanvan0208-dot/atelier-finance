import { describe, expect, it } from "vitest";

import { getIssuerMetadata } from "../issuer-metadata-service";

describe("issuer metadata service", () => {
  it("returns local research seed metadata for FPT", () => {
    const metadata = getIssuerMetadata("fpt");
    const output = JSON.stringify(metadata).toLowerCase();

    expect(metadata).toMatchObject({
      ticker: "FPT",
      displayName: "FPT",
      companyName: "FPT",
      issuerName: "FPT",
      industry: null,
      sector: null,
      sourceLabel: "local_issuer_metadata_seed",
      dataMode: "research_only",
      verificationStatus: "local_research_seed",
      productionApproved: false,
    });
    expect(output).not.toContain("recommendation");
    expect(output).not.toContain("signal");
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
    });
  });
});

