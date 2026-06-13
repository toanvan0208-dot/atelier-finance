import type { FinancialStatementInput } from "../../../lib/financial-logic";

export type ValuationStatementSnapshot = {
  ticker?: string;
  companyType?: FinancialStatementInput["companyType"];
  industry?: string;
  period?: string;
  periodType?: FinancialStatementInput["periodType"];
  sourceName?: string | null;
  sourceUrl?: string | null;
  collectedAt?: string | Date | null;
  revenue?: number | null;
  netProfit?: number | null;
  totalEquity?: number | null;
  cashAndEquivalents?: number | null;
  shortTermDebt?: number | null;
  longTermDebt?: number | null;
  totalDebt?: number | null;
  operatingCashFlow?: number | null;
  capitalExpenditure?: number | null;
  freeCashFlow?: number | null;
  ebitda?: number | null;
  sharesOutstanding?: number | null;
  eps?: number | null;
  bvps?: number | null;
  closePrice?: number | null;
  dividendPerShare?: number | null;
};

export const mapValuationToLogicInput = (snapshot: ValuationStatementSnapshot): FinancialStatementInput => ({
  ticker: snapshot.ticker,
  companyType: snapshot.companyType ?? "non_financial",
  industry: snapshot.industry,
  period: snapshot.period,
  periodType: snapshot.periodType ?? "ttm",
  sourceName: snapshot.sourceName,
  collectedAt: snapshot.collectedAt,
  revenue: snapshot.revenue,
  netProfit: snapshot.netProfit,
  totalEquity: snapshot.totalEquity,
  cashAndEquivalents: snapshot.cashAndEquivalents,
  shortTermDebt: snapshot.shortTermDebt,
  longTermDebt: snapshot.longTermDebt,
  totalDebt: snapshot.totalDebt,
  operatingCashFlow: snapshot.operatingCashFlow,
  capitalExpenditure: snapshot.capitalExpenditure,
  freeCashFlow: snapshot.freeCashFlow,
  ebitda: snapshot.ebitda,
  sharesOutstanding: snapshot.sharesOutstanding,
  eps: snapshot.eps,
  bvps: snapshot.bvps,
  closePrice: snapshot.closePrice,
  dividendPerShare: snapshot.dividendPerShare,
});
