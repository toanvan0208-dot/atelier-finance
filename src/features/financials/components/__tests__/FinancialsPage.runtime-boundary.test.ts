import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { DataQualityBanner } from "@/components/shared/DataQualityBanner";
import { FinancialsPage } from "../FinancialsPage";
import { FinancialsSourceTransparency } from "../FinancialsSourceTransparency";
import type { FinancialsRuntimeData } from "../../lib/financials-runtime-types";
import { buildFinancialsUnitMetadata } from "../../lib/financials-unit-metadata-contract";

const repoRoot = process.cwd();

const sampleRuntimeData = {
  runtimeStatus: "sample_fallback",
  source: {
    sourceLabel: "static_sample_financials",
    dataMode: "sample",
    productionApproved: false,
    fallbackUsed: true,
    readPath: "sample_static",
    ticker: "FPT",
    asOf: null,
    fiscalYear: null,
    periodType: "annual",
  },
  dataQuality: {
    status: "unavailable",
    missingFields: [],
    warnings: ["Financials runtime is using static sample data."],
    errors: [],
  },
  statementSnapshot: {
    ticker: "FPT",
    period: "sample",
    periodType: "annual",
    sourceName: "static_sample_financials",
    collectedAt: null,
    revenue: null,
    previousRevenue: null,
    grossProfit: null,
    operatingProfit: null,
    netProfit: null,
    previousNetProfit: null,
    totalAssets: null,
    previousTotalAssets: null,
    totalLiabilities: null,
    totalEquity: null,
    previousTotalEquity: null,
    currentAssets: null,
    currentLiabilities: null,
    operatingCashFlow: null,
    previousOperatingCashFlow: null,
    capitalExpenditure: null,
    sharesOutstanding: null,
    eps: null,
  },
  unitMetadata: buildFinancialsUnitMetadata(),
  readResult: null,
} satisfies FinancialsRuntimeData;

const dbBackedRuntimeData = {
  ...sampleRuntimeData,
  runtimeStatus: "db_backed",
  source: {
    ...sampleRuntimeData.source,
    sourceLabel: "phase45_synthetic_financial_statement_local_write",
    dataMode: "research_only",
    fallbackUsed: false,
    readPath: "local_db",
    ticker: "MWG",
    fiscalYear: 2024,
  },
  dataQuality: {
    status: "partial",
    missingFields: ["revenue", "operatingCashFlow"],
    warnings: ["Some fields are missing and remain null."],
    errors: [],
  },
  statementSnapshot: {
    ...sampleRuntimeData.statementSnapshot,
    ticker: "MWG",
    period: "2024",
    sourceName: "phase45_synthetic_financial_statement_local_write",
    revenue: null,
    operatingCashFlow: null,
    netProfit: 1000,
    totalAssets: 2000,
    totalEquity: 1200,
  },
  unitMetadata: buildFinancialsUnitMetadata(),
} satisfies FinancialsRuntimeData;

describe("Financials runtime UI boundary", () => {
  it("renders default sample fallback metadata without a DB-backed claim", () => {
    const html = renderToStaticMarkup(
      createElement(FinancialsPage, { initialRuntimeData: sampleRuntimeData }),
    );

    expect(html).toContain("Dữ liệu minh họa");
    expect(html).toContain("Minh họa/đang chờ dữ liệu");
    expect(html).toContain("chưa phê duyệt sản xuất");
    expect(html).not.toContain("sample_fallback");
    expect(html).not.toContain("static_sample_financials");
    expect(html).not.toContain("sample_static");
    expect(html).not.toContain("productionApproved:false");
    expect(html).not.toContain(
      "phase45_synthetic_financial_statement_local_write",
    );
  });

  it("renders DB-backed local research source transparency", () => {
    const html = renderToStaticMarkup(
      createElement(FinancialsSourceTransparency, {
        runtimeData: dbBackedRuntimeData,
      }),
    );

    expect(html).toContain("Đã có dữ liệu tài chính trong hệ thống");
    expect(html).toContain("phạm vi nghiên cứu");
    expect(html).toContain("Đã có trong hệ thống");
    expect(html).toContain("chưa phê duyệt sản xuất");
    expect(html).toContain("Financials cung cấp đầu vào");
    expect(html).toContain("Phân loại dữ liệu");
    expect(html).toContain("Nguồn/evidence");
    expect(html).toContain("Đơn vị dữ liệu");
    expect(html).toContain("Chuyển sang định giá");
    expect(html).toContain("Định giá vẫn kiểm tra ranh giới riêng");
    expect(html).not.toContain(
      "phase45_synthetic_financial_statement_local_write",
    );
    expect(html).not.toContain("research_only");
    expect(html).not.toContain("local_db");
    expect(html).not.toContain("fallbackUsed");
    expect(html).not.toContain("productionApproved:false");
    expect(html).not.toContain("canClaimValuationDbBacked");
  });

  it("shows reviewed debt, EPS, and shares status without exposing raw flags", () => {
    const html = renderToStaticMarkup(
      createElement(FinancialsPage, {
        initialRuntimeData: dbBackedRuntimeData,
        reviewedReadiness: {
          ticker: "MWG",
          sourceDecisions: {
            totalDebt: {
              status: "available",
              value: 27300.247,
              unit: "billion_vnd",
              period: "2024",
            },
            eps: {
              status: "available",
              value: 2546,
              unit: "vnd_per_share",
              period: "2024",
            },
            sharesOutstanding: {
              status: "available",
              value: 1454644497,
              unit: "shares",
              period: "2024",
            },
          },
        },
      } as never),
    );

    expect(html).toContain("Bản ghi đã rà soát");
    expect(html).toContain("Nợ vay");
    expect(html).toContain("EPS");
    expect(html).toContain("Số cổ phiếu");
    expect(html).toContain("Dùng cho nghiên cứu");
    expect(html).toContain("chưa phê duyệt sản xuất");
    expect(html).not.toContain("sharesOutstanding");
    expect(html).not.toContain("totalDebt");
    expect(html).not.toContain("sourceLabel");
    expect(html).not.toContain("runtimeStatus");
    expect(html).not.toContain("fallbackUsed");
    expect(html).not.toContain("productionApproved:false");
  });

  it("renders research-only data quality wording without overclaiming the source", () => {
    const html = renderToStaticMarkup(
      createElement(DataQualityBanner, {
        source: "phase45_synthetic_financial_statement_local_write",
        isResearchOnly: true,
        missingFields: ["revenue"],
      }),
    );

    expect(html).toContain("Du lieu local research-only");
    expect(html).toContain("chưa phê duyệt sản xuất");
    expect(html).toContain("trạng thái nguồn");
    expect(html).toContain("revenue");
    expect(html).not.toContain("Du lieu co metadata nguon");
  });

  it("keeps partial missing fields visible instead of rendering them as zero", () => {
    const html = renderToStaticMarkup(
      createElement(FinancialsSourceTransparency, {
        runtimeData: dbBackedRuntimeData,
      }),
    );

    expect(html).toContain("revenue");
    expect(html).toContain("operatingCashFlow");
    expect(html).toContain("null/unavailable");
    expect(html).toContain("Lý do đang chặn");
    expect(html).toContain("revenue missing for valuation handoff");
    expect(html).toContain("Các trường hiện có chưa có đơn vị rõ");
    expect(html).not.toContain("0 ty");
    expect(html).not.toContain("0 tỷ");
  });

  it("keeps client financials components away from server-only data access", () => {
    const clientFiles = [
      "src/features/financials/components/FinancialsPage.tsx",
      "src/features/financials/components/FinancialsSourceTransparency.tsx",
    ];
    const forbiddenImports = [
      "@prisma/client",
      "PrismaClient",
      "financial-statement-read-service",
      "load-financials-runtime-data",
      "node:fs",
      ' from "fs"',
      " from 'fs'",
    ];

    for (const file of clientFiles) {
      const source = readFileSync(join(repoRoot, file), "utf8");
      for (const forbiddenImport of forbiddenImports) {
        expect(source).not.toContain(forbiddenImport);
      }
    }
  });

  it("keeps Overview, Valuation, and Risk from claiming the Financials DB-backed boundary", () => {
    const moduleFiles = [
      "src/features/overview/components/OverviewPage.tsx",
      "src/features/valuation/components/ValuationPage.tsx",
      "src/features/risk/components/RiskPage.tsx",
    ];
    const financialsOnlyClaims = [
      "phase45_synthetic_financial_statement_local_write",
      "db_backed",
      "local_db",
      "FinancialsSourceTransparency",
    ];

    for (const file of moduleFiles) {
      const source = readFileSync(join(repoRoot, file), "utf8");
      for (const claim of financialsOnlyClaims) {
        expect(source).not.toContain(claim);
      }
    }
  });

  it("does not add restricted recommendation or source-approval wording", () => {
    const files = [
      "src/features/financials/components/FinancialsPage.tsx",
      "src/features/financials/components/FinancialsSourceTransparency.tsx",
    ];
    const phrase = (...parts: string[]) => parts.join("");
    const restrictedPhrases = [
      phrase("nên ", "mua"),
      phrase("nên ", "bán"),
      phrase("nên ", "nắm giữ"),
      phrase("tín hiệu ", "mua"),
      phrase("tín hiệu ", "bán"),
      phrase("điểm ", "mua"),
      phrase("cổ phiếu ", "an toàn"),
      phrase("chắc chắn ", "rẻ"),
      phrase("chắc chắn ", "xấu"),
      phrase("du lieu ", "chinh thuc"),
      phrase("nguon ", "chinh thuc"),
      phrase("production ", "approved"),
    ];

    const source = files
      .map((file) => readFileSync(join(repoRoot, file), "utf8").toLowerCase())
      .join("\n");
    for (const phrase of restrictedPhrases) {
      expect(source).not.toContain(phrase);
    }
  });
});
