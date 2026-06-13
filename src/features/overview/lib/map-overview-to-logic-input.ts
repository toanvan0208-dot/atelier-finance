import type { FinancialStatementInput } from "../../../lib/financial-logic";

export type OverviewStatementSnapshot = {
  ticker?: string;
  companyType?: FinancialStatementInput["companyType"];
  industry?: string;
  period?: string;
  periodType?: FinancialStatementInput["periodType"];
  sourceName?: string | null;
  collectedAt?: string | Date | null;
  revenue?: number | null;
  previousRevenue?: number | null;
  grossProfit?: number | null;
  operatingProfit?: number | null;
  previousOperatingProfit?: number | null;
  netProfit?: number | null;
  previousNetProfit?: number | null;
  totalAssets?: number | null;
  previousTotalAssets?: number | null;
  totalLiabilities?: number | null;
  totalEquity?: number | null;
  previousTotalEquity?: number | null;
  cashAndEquivalents?: number | null;
  shortTermDebt?: number | null;
  longTermDebt?: number | null;
  totalDebt?: number | null;
  operatingCashFlow?: number | null;
  previousOperatingCashFlow?: number | null;
  capitalExpenditure?: number | null;
  interestExpense?: number | null;
  ebit?: number | null;
  ebitda?: number | null;
  sharesOutstanding?: number | null;
  eps?: number | null;
  bvps?: number | null;
  closePrice?: number | null;
  previousClosePrice?: number | null;
  volume?: number | null;
  avgVolume20d?: number | null;
  avgTradingValue20d?: number | null;
  dividendPerShare?: number | null;
};

export const mapOverviewToLogicInput = (snapshot: OverviewStatementSnapshot): FinancialStatementInput => ({
  ticker: snapshot.ticker,
  companyType: snapshot.companyType ?? "non_financial",
  industry: snapshot.industry,
  period: snapshot.period,
  periodType: snapshot.periodType ?? "ttm",
  sourceName: snapshot.sourceName,
  collectedAt: snapshot.collectedAt,
  revenue: snapshot.revenue,
  previousRevenue: snapshot.previousRevenue,
  grossProfit: snapshot.grossProfit,
  operatingProfit: snapshot.operatingProfit,
  previousOperatingProfit: snapshot.previousOperatingProfit,
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
  operatingCashFlow: snapshot.operatingCashFlow,
  previousOperatingCashFlow: snapshot.previousOperatingCashFlow,
  capitalExpenditure: snapshot.capitalExpenditure,
  interestExpense: snapshot.interestExpense,
  ebit: snapshot.ebit,
  ebitda: snapshot.ebitda,
  sharesOutstanding: snapshot.sharesOutstanding,
  eps: snapshot.eps,
  bvps: snapshot.bvps,
  closePrice: snapshot.closePrice,
  previousClosePrice: snapshot.previousClosePrice,
  volume: snapshot.volume,
  avgVolume20d: snapshot.avgVolume20d,
  avgTradingValue20d: snapshot.avgTradingValue20d,
  dividendPerShare: snapshot.dividendPerShare,
});
