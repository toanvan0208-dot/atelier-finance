import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { loadFinancialsRuntimeData } from "../load-financials-runtime-data";
import { buildRiskFinancialsRuntimeReadiness } from "../../../risk/lib/risk-financials-runtime-readiness";
import { buildValuationFinancialsRuntimeReadiness } from "../../../valuation/lib/valuation-financials-runtime-readiness";
import { buildAssistantScreenContextPacket } from "../../../../components/layout/assistant-screen-context";

import { getPostgresTestDatabase } from "@/test-utils/postgres-test-database";
import { seedSmokeTestsFixture } from "@/test-utils/smoke-test-seeder";
import { getFinancialStatementSeries } from "../../../../lib/data-sources/financial-statement-read-service";

describe("Phase 139J Post-Import Product Smoke Boundaries", () => {
  let db: ReturnType<typeof getPostgresTestDatabase>;
  let deps: any;

  beforeAll(async () => {
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || "postgresql://atelier:atelier@localhost:5432/atelier_finance_test?schema=public";
    db = getPostgresTestDatabase();
    await seedSmokeTestsFixture(db);
    deps = {
      readSeries: (opt: any) => getFinancialStatementSeries(opt, { db: db.prisma as any })
    };
  });

  afterAll(async () => {
    await db.cleanup();
  });

  describe("FPT Runtime Financials Snapshot", () => {
    it("resolves to annual_report_2025_pdf_reviewed_preview with expected values", async () => {
      const fpt = await loadFinancialsRuntimeData({ ticker: "FPT", preferDb: true }, deps);

      expect(fpt.source.sourceLabel).toBe("annual_report_2025_pdf_reviewed_preview");
      expect(fpt.source.dataMode).toBe("research_only");
      expect(fpt.source.productionApproved).toBe(false);
      expect(fpt.source.fallbackUsed).toBe(false);

      expect(fpt.statementSnapshot?.eps).toBe(5216);
      expect(fpt.statementSnapshot?.sharesOutstanding).toBe(1703507121);
      expect(fpt.statementSnapshot?.totalDebt).toBe(21073.487486139);

      expect(fpt.unitMetadata.eps.unit).toBe("vnd_per_share");
      expect(fpt.unitMetadata.sharesOutstanding.unit).toBe("shares");
      expect(fpt.unitMetadata.totalDebt.unit).toBe("billion_vnd");
    });
  });

  describe("Sanity Check: Source Priority", () => {
    it("resolves to annual_report_2025_pdf_reviewed_preview for MWG now", async () => {
      const mwg = await loadFinancialsRuntimeData({ ticker: "MWG", preferDb: true }, deps);
      
      expect(mwg.source.sourceLabel).toBe("annual_report_2025_pdf_reviewed_preview");
    });
  });

  describe("Module Behaviors", () => {
    it("supplies totalDebt to Risk module without marking it missing", async () => {
      const fpt = await loadFinancialsRuntimeData({ ticker: "FPT", preferDb: true }, deps);
      const riskReadiness = buildRiskFinancialsRuntimeReadiness({
        financialsRuntimeData: fpt,
        hasStaticRiskPath: false,
        riskConsumesFinancialsRuntime: true,
      });

      expect(riskReadiness.inputSnapshot.totalDebt).not.toBeNull();
      expect(riskReadiness.inputSnapshot.totalDebt).toBe(21073.487486139);
    });

    it("keeps Valuation source boundary unapproved", async () => {
      const fpt = await loadFinancialsRuntimeData({ ticker: "FPT", preferDb: true }, deps);
      const valuationReadiness = buildValuationFinancialsRuntimeReadiness({
        financialsRuntimeData: fpt,
        hasPersistedLocalInputBridge: false,
        valuationConsumesFinancialsRuntime: true,
      });

      expect(valuationReadiness.productionApproved).toBe(false);
    });

    it("populates AI Assistant Context correctly without recommendation logic", async () => {
      const fpt = await loadFinancialsRuntimeData({ ticker: "FPT", preferDb: true }, deps);
      const context = buildAssistantScreenContextPacket({
        ticker: "FPT",
        activeModule: "financials",
        financialsRuntimeData: fpt,
      });

      const jsonContext = JSON.stringify(context);
      
      expect(jsonContext).toContain("5216");
      expect(jsonContext).toContain("1703507121");
      expect(jsonContext).toContain("21073.487486139");
      expect(jsonContext).toContain("annual_report_2025_pdf_reviewed_preview");
      expect(jsonContext).toContain('"productionApproved":false');

      // Check guardrails against recommendations
      expect(jsonContext).toMatch(/buy|sell|hold/i);
    });
  });
});
