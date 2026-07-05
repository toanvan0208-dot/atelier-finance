import { loadFinancialsRuntimeData } from "@/features/financials/lib/load-financials-runtime-data";
import { buildChecklistDeskData } from "./build-checklist-desk-data";
import { baseCheckThinkingData } from "../data/checkThinking.data";
import type { ChecklistStatementSnapshot } from "./map-checklist-to-logic-input";
import type { CheckThinkingData } from "../types";

export type LoadChecklistRuntimeDataOptions = {
  ticker?: string;
  preferDb?: boolean;
  allowFinancialsFallback?: boolean;
};

export const loadChecklistRuntimeData = async (
  options: LoadChecklistRuntimeDataOptions = {}
): Promise<CheckThinkingData> => {
  const ticker = options.ticker || "FPT";
  
  if (ticker === "VCB") {
    // VCB is excluded from corporate reviewed-preview path
    return buildChecklistDeskData({
      ...baseCheckThinkingData,
      stockReadinessByTicker: [
        {
          ticker: "VCB",
          companyName: "N/A",
          industry: "Ngân hàng",
          currentThesis: "Không áp dụng",
          moduleReadiness: [],
          missingEvidenceQuestions: [],
          fomoChecks: [],
          finalReadiness: {
            status: "not_enough_data",
            label: "Không được hỗ trợ",
            tone: "neutral",
            summary: "Cổ phiếu ngân hàng chưa được hỗ trợ trên luồng checklist hiện tại.",
            reasons: ["Mô hình tài chính không tương thích."],
            nextActions: []
          }
        }
      ]
    }, [
      {
        ticker: "VCB",
        industry: "Ngân hàng",
        period: "TTM",
        periodType: "ttm",
        sourceName: "excluded_bank",
        collectedAt: null,
      } as ChecklistStatementSnapshot
    ]);
  }

  const financialsData = await loadFinancialsRuntimeData({
    ticker,
    preferDb: options.preferDb,
    allowFallback: options.allowFinancialsFallback,
  });

  const snapshot = financialsData.statementSnapshot;
  
  const checklistSnapshot: ChecklistStatementSnapshot = snapshot ? {
    ticker: financialsData.source.ticker,
    companyType: snapshot.companyType,
    industry: snapshot.industry,
    period: snapshot.period,
    periodType: snapshot.periodType,
    sourceName: financialsData.source.sourceLabel,
    collectedAt: financialsData.source.asOf,
    revenue: snapshot.revenue,
    previousRevenue: snapshot.previousRevenue,
    grossProfit: snapshot.grossProfit,
    operatingProfit: snapshot.operatingProfit,
    netProfit: snapshot.netProfit,
    previousNetProfit: snapshot.previousNetProfit,
    totalAssets: snapshot.totalAssets,
    previousTotalAssets: snapshot.previousTotalAssets,
    totalLiabilities: snapshot.totalLiabilities,
    totalEquity: snapshot.totalEquity,
    previousTotalEquity: snapshot.previousTotalEquity,
    cashAndEquivalents: snapshot.cashAndEquivalents,
    shortTermDebt: snapshot.shortTermDebt,
    longTermDebt: snapshot.longTermDebt,
    totalDebt: snapshot.totalDebt,
    currentAssets: snapshot.currentAssets,
    currentLiabilities: snapshot.currentLiabilities,
    inventory: snapshot.inventory,
    previousInventory: snapshot.previousInventory,
    accountsReceivable: snapshot.accountsReceivable,
    previousAccountsReceivable: snapshot.previousAccountsReceivable,
    operatingCashFlow: snapshot.operatingCashFlow,
    previousOperatingCashFlow: snapshot.previousOperatingCashFlow,
    capitalExpenditure: snapshot.capitalExpenditure,
    freeCashFlow: snapshot.freeCashFlow,
    interestExpense: snapshot.interestExpense,
    ebit: snapshot.ebit,
    ebitda: snapshot.ebitda,
    sharesOutstanding: snapshot.sharesOutstanding,
    eps: snapshot.eps,
    bvps: snapshot.bvps,
    closePrice: snapshot.closePrice,
  } : {
    ticker,
    sourceName: financialsData.source.sourceLabel,
  };

  const baseData = { ...baseCheckThinkingData };
  if (!baseData.stockReadinessByTicker.some(s => s.ticker === ticker)) {
    baseData.stockReadinessByTicker = [
      ...baseData.stockReadinessByTicker,
      {
        ticker,
        companyName: snapshot?.sourceName ?? "N/A",
        industry: snapshot?.industry ?? "N/A",
        currentThesis: "N/A",
        moduleReadiness: [],
        missingEvidenceQuestions: [],
        fomoChecks: [],
        finalReadiness: {
          status: "not_enough_data",
          label: "Chưa đủ dữ liệu",
          tone: "neutral",
          summary: "Chưa có đủ dữ liệu",
          reasons: [],
          nextActions: []
        }
      }
    ];
  }

  return buildChecklistDeskData(baseData, [checklistSnapshot]);
};
