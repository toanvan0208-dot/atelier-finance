import fs from "fs";
import path from "path";
import { describe, expect, it } from "vitest";

import {
  buildMsnDebtComponents,
  buildMsnDryRunImportCandidate,
  buildMsnIdentityEvidence,
  buildMsnPreview,
  deriveTotalDebt,
  evaluateMsnIdentity,
  normalizeToBillionVnd,
  validateMsnPreview,
  type MsnFieldPreview,
} from "../annual-report-2025-msn-manual-preview";

describe("Phase 139K MSN PDF reviewed-preview dry run", () => {
  it("accepts only Masan Group consolidated audited identity", () => {
    expect(buildMsnIdentityEvidence().status).toBe("valid_msn_consolidated");
    expect(
      evaluateMsnIdentity({
        companyName: "Công ty Cổ phần Tập đoàn Masan",
        ticker: "MSN",
        reportTitle: "Báo cáo Thường niên 2025",
        consolidatedTitle:
          "Báo cáo tài chính hợp nhất của Công ty và các công ty con",
        auditor: "KPMG Việt Nam",
      }),
    ).toBe("valid_msn_consolidated");
  });

  it("rejects MCH and subsidiary-only identity", () => {
    expect(
      evaluateMsnIdentity({
        companyName: "Công ty Cổ phần Hàng Tiêu Dùng Masan",
        ticker: "MCH",
        consolidatedTitle: "Báo cáo tài chính hợp nhất",
        auditor: "KPMG Việt Nam",
      }),
    ).toBe("invalid_for_msn");
    expect(
      evaluateMsnIdentity({
        companyName: "WinCommerce",
        ticker: "MSN",
        consolidatedTitle: "Báo cáo tài chính hợp nhất",
        auditor: "KPMG Việt Nam",
      }),
    ).toBe("invalid_for_msn");
  });

  it("blocks a dry-run candidate when identity is invalid", () => {
    const invalidIdentity = {
      ...buildMsnIdentityEvidence(),
      companyName: "Masan Consumer",
      ticker: "MCH",
      consolidatedGroupLevel: false,
      subsidiaryOnlyRuledOut: false,
      status: "invalid_for_msn" as const,
    };

    expect(buildMsnPreview(invalidIdentity)).toEqual([]);
    expect(buildMsnDryRunImportCandidate(invalidIdentity, [])).toBeNull();
  });

  it("maps EPS only with VND/share provenance", () => {
    const eps = buildMsnPreview().find((field) => field.field === "eps");
    expect(eps?.value).toBe(2710);
    expect(eps?.unit).toBe("vnd_per_share");
    expect(validateMsnPreview(eps!)).toEqual([]);

    const invalid = { ...eps!, unit: "million_vnd" };
    expect(validateMsnPreview(invalid)).toContain(
      "EPS must use vnd_per_share.",
    );
  });

  it("maps sharesOutstanding only from explicit shares provenance", () => {
    const shares = buildMsnPreview().find(
      (field) => field.field === "sharesOutstanding",
    );
    expect(shares?.value).toBe(1520491927);
    expect(shares?.unit).toBe("shares");
    expect(shares?.fieldLabel).toBe("Cổ phiếu đang lưu hành");
    expect(validateMsnPreview(shares!)).toEqual([]);
  });

  it("derives totalDebt only from explicit current and non-current debt lines", () => {
    const debt = deriveTotalDebt(buildMsnDebtComponents());
    expect(debt).toMatchObject({
      value: 64877178,
      unit: "million_vnd",
      status: "derived_preview",
    });
  });

  it("normalizes million VND debt to billion VND", () => {
    expect(normalizeToBillionVnd(64877178, "million_vnd")).toEqual({
      value: 64877.178,
      unit: "billion_vnd",
      conversionRule: "million VND / 1,000",
    });
  });

  it("does not double count bonds, leases, or current maturities", () => {
    const components = buildMsnDebtComponents();
    expect(components).toHaveLength(2);
    expect(
      components.some((component) =>
        component.note.includes("includes current maturities"),
      ),
    ).toBe(true);
    expect(deriveTotalDebt(components).value).toBe(24330984 + 40546194);
  });

  it("blocks total liabilities from totalDebt", () => {
    const totalLiabilitiesDebt = {
      ...buildMsnPreview().find((field) => field.field === "totalDebt")!,
      fieldLabel: "Tổng nợ phải trả",
    };
    expect(validateMsnPreview(totalLiabilitiesDebt)).toContain(
      "totalLiabilities must never map to totalDebt.",
    );
  });

  it("keeps missing values null instead of zero", () => {
    const missing = {
      ...buildMsnPreview().find((field) => field.field === "eps")!,
      value: 0,
      status: "missing" as const,
    };
    expect(validateMsnPreview(missing)).toContain(
      "Missing values must remain null, never 0.",
    );
  });

  it("keeps productionApproved false and requires non-null provenance", () => {
    const previews = buildMsnPreview();
    expect(previews.every((field) => field.productionApproved === false)).toBe(
      true,
    );

    const missingPage = {
      ...previews[0],
      pdfPage: null,
    };
    expect(validateMsnPreview(missingPage)).toContain(
      "Non-null values require page, section, and field provenance.",
    );
  });

  it("contains no write, import execution, confirm-write, or Prisma client", () => {
    const script = fs.readFileSync(
      path.join(process.cwd(), "scripts/dry-run-msn-pdf-reviewed-import.ts"),
      "utf8",
    );
    expect(script).not.toContain("prisma.");
    expect(script).not.toContain("createMany");
    expect(script).not.toContain("upsert");
    expect(script).not.toContain("confirm-write");
    expect(script).not.toContain("DATABASE_URL");
  });

  it("enforces MSN-only preview rows", () => {
    expect(buildMsnPreview().every((field) => field.ticker === "MSN")).toBe(
      true,
    );

    const invalidTicker = {
      ...buildMsnPreview()[0],
      ticker: "MCH",
    } as unknown as MsnFieldPreview;
    expect(validateMsnPreview(invalidTicker)).toContain(
      "MSN-only restriction blocks other tickers.",
    );
  });

  it("keeps the vnstock row unchanged and recommends a parallel source row", () => {
    const candidate = buildMsnDryRunImportCandidate();
    expect(candidate?.existingRuntime).toEqual({
      sourceLabel: "vnstock_financials_candidate",
      eps: 2710,
      sharesOutstanding: 1520491927,
      totalDebt: null,
    });
    expect(candidate?.collisionAnalysis).toContain("parallel");
    expect(candidate?.collisionAnalysis).toContain("must not overwrite");
  });

  it("returns partial-only readiness when EPS and shares exist but debt is ambiguous", () => {
    const previews = buildMsnPreview().map((field) =>
      field.field === "totalDebt"
        ? {
            ...field,
            value: null,
            unit: null,
            status: "ambiguous" as const,
            pdfPage: null,
            reportPages: null,
            tableOrSection: null,
            fieldLabel: null,
            extractionMethod: "not_found" as const,
          }
        : field,
    );

    expect(
      buildMsnDryRunImportCandidate(
        buildMsnIdentityEvidence(),
        previews,
      )?.importReadiness,
    ).toBe("partial_only_do_not_import_yet");
  });

  it("is ready only for a future controlled import, never this phase", () => {
    const candidate = buildMsnDryRunImportCandidate();
    expect(candidate?.importReadiness).toBe(
      "ready_for_future_controlled_import",
    );
    expect(candidate?.status).toBe("dry_run_import_candidate");
    expect(candidate?.productionApproved).toBe(false);
    expect(candidate?.values).toEqual({
      eps: 2710,
      epsUnit: "vnd_per_share",
      sharesOutstanding: 1520491927,
      sharesOutstandingUnit: "shares",
      totalDebt: 64877.178,
      totalDebtUnit: "billion_vnd",
    });
  });
});
