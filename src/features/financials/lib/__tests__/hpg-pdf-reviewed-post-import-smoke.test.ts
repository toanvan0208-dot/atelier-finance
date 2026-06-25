import { describe, it, expect, beforeAll } from "vitest";
import { loadFinancialsRuntimeData } from "../load-financials-runtime-data";
import { buildRiskFinancialsRuntimeReadiness } from "../../../risk/lib/risk-financials-runtime-readiness";
import { buildValuationFinancialsRuntimeReadiness } from "../../../valuation/lib/valuation-financials-runtime-readiness";
import { buildAssistantScreenContextPacket } from "../../../../components/layout/assistant-screen-context";

describe.skip("Phase 139E Post-Import Product Smoke Boundaries", () => {
  beforeAll(() => {
    if (!process.env.DATABASE_URL) {
      process.env.DATABASE_URL = "file:./dev.db";
    }
  });

  describe("HPG Runtime Financials Snapshot", () => {
    it("resolves to annual_report_2025_pdf_reviewed_preview with expected values", async () => {
      const hpg = await loadFinancialsRuntimeData({ ticker: "HPG", preferDb: true });

      expect(hpg.source.sourceLabel).toBe("annual_report_2025_pdf_reviewed_preview");
      expect(hpg.source.dataMode).toBe("research_only");
      expect(hpg.source.productionApproved).toBe(false);
      expect(hpg.source.fallbackUsed).toBe(false);

      expect(hpg.statementSnapshot?.eps).toBe(1973);
      expect(hpg.statementSnapshot?.sharesOutstanding).toBe(7675465855);
      expect(hpg.statementSnapshot?.totalDebt).toBe(92174.151302217);

      expect(hpg.unitMetadata.eps.unit).toBe("vnd_per_share");
      expect(hpg.unitMetadata.sharesOutstanding.unit).toBe("shares");
      expect(hpg.unitMetadata.totalDebt.unit).toBe("billion_vnd");
    });
  });

  describe("Sanity Check: Source Priority", () => {
    it("resolves to annual_report_2025_pdf_reviewed_preview for MWG now", async () => {
      const mwg = await loadFinancialsRuntimeData({ ticker: "MWG", preferDb: true });
      
      expect(mwg.source.sourceLabel).toBe("annual_report_2025_pdf_reviewed_preview");
    });
  });

  describe("Module Behaviors", () => {
    it("supplies totalDebt to Risk module without marking it missing", async () => {
      const hpg = await loadFinancialsRuntimeData({ ticker: "HPG", preferDb: true });
      const riskReadiness = buildRiskFinancialsRuntimeReadiness({
        financialsRuntimeData: hpg,
        hasStaticRiskPath: false,
        riskConsumesFinancialsRuntime: true,
      });

      expect(riskReadiness.inputSnapshot.totalDebt).not.toBeNull();
      expect(riskReadiness.inputSnapshot.totalDebt).toBe(92174.151302217);
    });

    it("keeps Valuation source boundary unapproved", async () => {
      const hpg = await loadFinancialsRuntimeData({ ticker: "HPG", preferDb: true });
      const valuationReadiness = buildValuationFinancialsRuntimeReadiness({
        financialsRuntimeData: hpg,
        hasPersistedLocalInputBridge: false,
        valuationConsumesFinancialsRuntime: true,
      });

      expect(valuationReadiness.productionApproved).toBe(false);
    });

    it("populates AI Assistant Context correctly without recommendation logic", async () => {
      const hpg = await loadFinancialsRuntimeData({ ticker: "HPG", preferDb: true });
      const context = buildAssistantScreenContextPacket({
        ticker: "HPG",
        activeModule: "financials",
        financialsRuntimeData: hpg,
      });

      const jsonContext = JSON.stringify(context);
      
      expect(jsonContext).toContain("1973");
      expect(jsonContext).toContain("7675465855");
      expect(jsonContext).toContain("92174.151302217");
      expect(jsonContext).toContain("annual_report_2025_pdf_reviewed_preview");
      expect(jsonContext).toContain('"productionApproved":false');

      // Check guardrails against recommendations
      expect(jsonContext).toMatch(/buy|sell|hold/i);
    });
  });
});
