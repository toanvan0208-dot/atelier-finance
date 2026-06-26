/* eslint-disable @typescript-eslint/no-explicit-any */
import { beforeAll, afterAll, describe, expect, it } from "vitest";

import { buildAssistantScreenContextPacket } from "../../../../components/layout/assistant-screen-context";
import { buildRiskFinancialsRuntimeReadiness } from "../../../risk/lib/risk-financials-runtime-readiness";
import { buildValuationFinancialsRuntimeReadiness } from "../../../valuation/lib/valuation-financials-runtime-readiness";
import { loadFinancialsRuntimeData } from "../load-financials-runtime-data";

import { getPostgresTestDatabase } from "@/test-utils/postgres-test-database";
import { seedSmokeTestsFixture } from "@/test-utils/smoke-test-seeder";
import { getFinancialStatementSeries } from "../../../../lib/data-sources/financial-statement-read-service";

describe("Phase 139L MSN post-import product smoke", () => {
  let prisma: any;
  let db: ReturnType<typeof getPostgresTestDatabase>;
  let deps: any;

  beforeAll(async () => {
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || "postgresql://atelier:atelier@localhost:5432/atelier_finance_test?schema=public";
    db = getPostgresTestDatabase();
    await seedSmokeTestsFixture(db);
    prisma = db.prisma;
    deps = {
      readSeries: (opt: any) => getFinancialStatementSeries(opt, { db: db.prisma as any })
    };
  });

  afterAll(async () => {
    await db.cleanup();
  });

  it("preserves both MSN source rows and resolves reviewed PDF values", async () => {
    const rows = await prisma.financialStatement.findMany({
      where: {
        ticker: "MSN",
        fiscalYear: 2025,
        dataMode: "research_only",
      },
      select: { sourceLabel: true },
    });
    expect(
      rows.map((row: { sourceLabel: string }) => row.sourceLabel),
    ).toEqual(
      expect.arrayContaining([
        "vnstock_financials_candidate",
        "annual_report_2025_pdf_reviewed_preview",
      ]),
    );

    const runtime = await loadFinancialsRuntimeData({
      ticker: "MSN",
      preferDb: true,
      allowFallback: false,
    }, deps);
    expect(runtime.source).toMatchObject({
      sourceLabel: "annual_report_2025_pdf_reviewed_preview",
      dataMode: "research_only",
      productionApproved: false,
      fallbackUsed: false,
    });
    expect(runtime.statementSnapshot).toMatchObject({
      eps: 2710,
      sharesOutstanding: 1520491927,
      totalDebt: 64877.178,
    });
    expect(runtime.unitMetadata.eps.unit).toBe("vnd_per_share");
    expect(runtime.unitMetadata.sharesOutstanding.unit).toBe("shares");
    expect(runtime.unitMetadata.totalDebt.unit).toBe("billion_vnd");
  });

  it("keeps Risk, Valuation, Checklist, and AI boundaries safe", async () => {
    const runtime = await loadFinancialsRuntimeData({
      ticker: "MSN",
      preferDb: true,
      allowFallback: false,
    }, deps);
    const risk = buildRiskFinancialsRuntimeReadiness({
      financialsRuntimeData: runtime,
      hasStaticRiskPath: false,
      riskConsumesFinancialsRuntime: true,
    });
    expect(risk.inputSnapshot.totalDebt).toBe(64877.178);
    expect(risk.blockedReasons).not.toContain(
      "debt missing; leverage risk is insufficient_data.",
    );
    expect(risk.productionApproved).toBe(false);
    expect(risk.missingValuePolicy.substituteZeroForMissing).toBe(false);

    const valuation = buildValuationFinancialsRuntimeReadiness({
      financialsRuntimeData: runtime,
      hasPersistedLocalInputBridge: false,
      valuationConsumesFinancialsRuntime: true,
    });
    expect(valuation.productionApproved).toBe(false);
    expect(valuation.canClaimValuationDbBacked).toBe(false);
    expect(valuation.boundaryNote).toContain(
      "Valuation readiness is only a data-safety state",
    );

    expect(runtime.dataQuality.missingFields).not.toContain("totalDebt");

    const context = buildAssistantScreenContextPacket({
      ticker: "MSN",
      activeModule: "financials",
      financialsRuntimeData: runtime,
    });
    expect(context.dataQuality).toMatchObject({
      sourceLabel: "annual_report_2025_pdf_reviewed_preview",
      dataMode: "research_only",
      productionApproved: false,
    });
    expect(context.allowedNumericValues).toEqual(
      expect.arrayContaining([2710, 1520491927, 64877.178]),
    );
    expect(context.constraints.join(" ")).toMatch(/buy, sell, or hold/i);
    expect(context.constraints.join(" ")).toMatch(
      /fair value, target price, upside, downside/i,
    );
  });

  it("preserves source priority for other tickers", async () => {
    const expected: Record<string, string> = {
      FPT: "annual_report_2025_pdf_reviewed_preview",
      HPG: "annual_report_2025_pdf_reviewed_preview",
      VNM: "annual_report_2025_pdf_reviewed_preview",
      MWG: "annual_report_2025_pdf_reviewed_preview",
    };
    for (const [ticker, sourceLabel] of Object.entries(expected)) {
      const runtime = await loadFinancialsRuntimeData({
        ticker,
        preferDb: true,
        allowFallback: false,
      }, deps);
      expect(runtime.source.sourceLabel).toBe(sourceLabel);
    }

    const vcb = await loadFinancialsRuntimeData({
      ticker: "VCB",
      preferDb: true,
      allowFallback: false,
      sourceLabel: "postgres_test_fixture",
    }, deps);
    expect(vcb.source.sourceLabel).toBe("postgres_test_fixture");
    expect(vcb.source.productionApproved).toBe(false);
    expect(vcb.statementSnapshot?.totalDebt ?? null).toBeNull();
  });
});
