export type CompanyType = "non_financial" | "bank" | "securities" | "insurance" | "unknown";
export type MetricLevel = "good" | "neutral" | "watch" | "risk" | "danger" | "not_applicable" | "unknown";
export type DataQuality = "sufficient" | "partial" | "missing" | "low_confidence" | "not_applicable";
export type PeriodType = "annual" | "quarter" | "ttm" | "unknown";
export type MetricUnit = "%" | "x" | "vnd" | "billion_vnd" | "days" | "none";

export type FinancialMetricResult = {
  key: string;
  label: string;
  value: number | null;
  displayValue: string;
  unit: MetricUnit;
  period?: string;
  periodType?: PeriodType;
  level: MetricLevel;
  dataQuality: DataQuality;
  formula: string;
  inputFields: string[];
  missingFields: string[];
  explanation: string;
  warning: string | null;
  beginnerInterpretation: string;
  commonMisread: string;
  moduleUsage: string[];
};

export type FinancialStatementInput = {
  ticker?: string;
  companyType?: CompanyType;
  industry?: string;
  period?: string;
  periodType?: PeriodType;
  sourceName?: string | null;
  collectedAt?: string | Date | null;
  revenue?: number | null;
  previousRevenue?: number | null;
  grossProfit?: number | null;
  previousGrossProfit?: number | null;
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
  currentAssets?: number | null;
  currentLiabilities?: number | null;
  inventory?: number | null;
  previousInventory?: number | null;
  accountsReceivable?: number | null;
  previousAccountsReceivable?: number | null;
  operatingCashFlow?: number | null;
  previousOperatingCashFlow?: number | null;
  investingCashFlow?: number | null;
  financingCashFlow?: number | null;
  capitalExpenditure?: number | null;
  freeCashFlow?: number | null;
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

export type RiskLevel = "low" | "medium" | "high" | "critical" | "unknown";

export type RiskScoreResult = {
  key: string;
  label: string;
  score: number | null;
  level: RiskLevel;
  dataQuality: DataQuality;
  reasons: string[];
  warnings: string[];
  missingFields: string[];
  beginnerInterpretation: string;
};

export type FinancialHealthStatus = "healthy" | "acceptable" | "watch" | "risk" | "unknown";

export type FinancialHealthSummary = {
  status: FinancialHealthStatus;
  score: number | null;
  strengths: string[];
  watchPoints: string[];
  riskPoints: string[];
  missingFields: string[];
  dataQuality: DataQuality;
  beginnerInterpretation: string;
};

export type DataQualityStatus = "good" | "usable_with_caution" | "poor" | "missing" | "stale";
export type SourceStatus = "verified" | "unverified" | "missing";

export type DataQualityResult = {
  status: DataQualityStatus;
  sourceStatus: SourceStatus;
  score: number;
  missingFields: string[];
  stale: boolean;
  warnings: string[];
  beginnerInterpretation: string;
};

export type ValuationReadinessStatus = "ready" | "partial" | "not_ready" | "unknown";
export type ValuationConfidence = "high" | "medium" | "low" | "very_low" | "unknown";

export type ValuationReadinessResult = {
  status: ValuationReadinessStatus;
  confidence: ValuationConfidence;
  missingFields: string[];
  usableMethods: string[];
  warnings: string[];
  beginnerInterpretation: string;
};

export type ValuationSummary = {
  metrics: FinancialMetricResult[];
  readiness: ValuationReadinessResult;
  warnings: string[];
  beginnerInterpretation: string;
};

export type MetricExplanation = {
  beginner: string;
  warning: string;
  commonMisread: string;
};
