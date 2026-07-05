import { describe, expect, it } from "vitest";

import {
  buildLongSafeFinancialStatementCandidates,
  parseLongSafeFinancialsCsv,
} from "../long-safe-financials-csv-import";

const csv = [
  "ticker,reportType,year,item,itemId,value,sourceLabel,dataMode,needsReview,productionApproved,fetchedAt,fetchStatus,error",
  "MWG,income_statement,2024,1. Doanh thu ban hang va cung cap dich vu,revenue,1200,VNStock financial statements,research_only,True,False,2026-07-04 19:00:17,ok,",
  "MWG,income_statement,2024,3. Doanh thu thuan ve ban hang va cung cap dich vu,revenue,1000,VNStock financial statements,research_only,True,False,2026-07-04 19:00:17,ok,",
  "MWG,income_statement,2024,5. Loi nhuan gop ve ban hang va cung cap dich vu,gross_profit,157,VNStock financial statements,research_only,True,False,2026-07-04 19:00:17,ok,",
  "MWG,income_statement,2024,18. Loi nhuan sau thue thu nhap doanh nghiep,net_profit,99,VNStock financial statements,research_only,True,False,2026-07-04 19:00:17,ok,",
  "MWG,cash_flow,2024,Luu chuyen tien thuan tu hoat dong kinh doanh,operating_cash_flow,80,VNStock financial statements,research_only,True,False,2026-07-04 19:00:17,ok,",
  "MWG,income_statement,2024,19. Lai co ban tren co phieu VND,earnings_per_share_vnd,2546000,VNStock financial statements,research_only,True,False,2026-07-04 19:00:17,ok,",
].join("\n");

describe("long safe financials CSV import", () => {
  it("selects net revenue instead of pre-deduction revenue", () => {
    const candidates = buildLongSafeFinancialStatementCandidates(parseLongSafeFinancialsCsv(csv));

    expect(candidates).toHaveLength(1);
    expect(candidates[0]).toMatchObject({
      dataMode: "research_only",
      fiscalYear: 2024,
      period: "2024",
      sourceLabel: "VNStock financial statements",
      ticker: "MWG",
      values: {
        eps: 2546,
        grossProfit: 157,
        netIncome: 99,
        operatingCashFlow: 80,
        revenue: 1000,
      },
    });
    expect(candidates[0].selectedRows.revenue.item).toContain("3.");
    expect(candidates[0].warningCodes).toEqual(
      expect.arrayContaining(["NEEDS_REVIEW", "RESEARCH_ONLY", "VNSTOCK_LONG_SAFE_CSV"]),
    );
  });
});
