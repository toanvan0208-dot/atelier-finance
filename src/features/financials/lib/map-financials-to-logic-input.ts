import type { FinancialStatementInput } from "../../../lib/financial-logic";

export type FinancialsStatementSnapshot = {
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
  currentAssets?: number | null;
  currentLiabilities?: number | null;
  inventory?: number | null;
  previousInventory?: number | null;
  accountsReceivable?: number | null;
  previousAccountsReceivable?: number | null;
  operatingCashFlow?: number | null;
  previousOperatingCashFlow?: number | null;
  capitalExpenditure?: number | null;
  freeCashFlow?: number | null;
  interestExpense?: number | null;
  ebit?: number | null;
  ebitda?: number | null;
  sharesOutstanding?: number | null;
  eps?: number | null;
  bvps?: number | null;
  closePrice?: number | null;
};

export const mapFinancialsToLogicInput = (snapshot: FinancialsStatementSnapshot): FinancialStatementInput => ({
  ticker: snapshot.ticker,
  companyType: snapshot.companyType ?? "non_financial",
  industry: snapshot.industry,
  period: snapshot.period,
  periodType: snapshot.periodType ?? "annual",
  sourceName: snapshot.sourceName,
  collectedAt: snapshot.collectedAt,
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
});
