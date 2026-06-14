import type { FinancialStatementInput } from "../../../lib/financial-logic";

export type TechnicalMarketSnapshot = {
  ticker?: string;
  companyType?: FinancialStatementInput["companyType"];
  industry?: string;
  period?: string;
  periodType?: FinancialStatementInput["periodType"];
  sourceName?: string | null;
  collectedAt?: string | Date | null;
  closePrice?: number | null;
  previousClosePrice?: number | null;
  volume?: number | null;
  avgVolume20d?: number | null;
  avgTradingValue20d?: number | null;
};

export const mapTechnicalToLogicInput = (snapshot: TechnicalMarketSnapshot): FinancialStatementInput => ({
  ticker: snapshot.ticker,
  companyType: snapshot.companyType ?? "non_financial",
  industry: snapshot.industry,
  period: snapshot.period,
  periodType: snapshot.periodType ?? "unknown",
  sourceName: snapshot.sourceName,
  collectedAt: snapshot.collectedAt,
  closePrice: snapshot.closePrice,
  previousClosePrice: snapshot.previousClosePrice,
  volume: snapshot.volume,
  avgVolume20d: snapshot.avgVolume20d,
  avgTradingValue20d: snapshot.avgTradingValue20d,
});
