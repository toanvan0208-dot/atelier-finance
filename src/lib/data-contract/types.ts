export type SourceType =
  | "official"
  | "exchange"
  | "licensed_vendor"
  | "company_disclosure"
  | "curated_internal"
  | "user_input"
  | "unknown";

export type PeriodType =
  | "session"
  | "day"
  | "month"
  | "quarter"
  | "year"
  | "ttm"
  | "manual"
  | "unknown";

export type CompanyType =
  | "non_financial"
  | "bank"
  | "securities"
  | "insurance"
  | "unknown";

export type ReadinessStatus =
  | "ready"
  | "needs_review"
  | "not_ready"
  | "insufficient_data"
  | "unknown";

export type InterpretationStatus =
  | "normal"
  | "not_applicable"
  | "needs_review"
  | "insufficient_data";

export type WarningCode =
  | "AS_OF_MISSING"
  | "DEMO_DATA"
  | "DERIVED_FROM_INPUTS"
  | "EQUITY_NOT_POSITIVE"
  | "EPS_NOT_POSITIVE"
  | "FINANCIAL_SECTOR_CAVEAT"
  | "INVALID_DENOMINATOR"
  | "MISSING_DATA"
  | "SOURCE_MISSING"
  | "STALE_DATA";

export interface DataSourceWarning {
  code: WarningCode;
  message: string;
  field?: string;
}

export interface DataPeriod {
  type: PeriodType;
  value: string;
  fiscalYear?: number;
  fiscalQuarter?: number;
}

export interface DataSourceMetadata {
  source: string | null;
  sourceType: SourceType;
  asOf: string | null;
  period: DataPeriod | null;
  collectedAt?: string | null;
  isDemoData: boolean;
  isStale: boolean;
  missingFields: string[];
  warnings: DataSourceWarning[];
}

export interface DerivedDataSourceMetadata extends DataSourceMetadata {
  derivedFrom: DataSourceMetadata[];
  calculationVersion?: string;
}

export interface DataContractRecord {
  metadata: DataSourceMetadata;
}

export interface MarketDataRecord extends DataContractRecord {
  ticker: string | null;
  closePrice: number | null;
  previousClose: number | null;
  volume: number | null;
  tradingValue: number | null;
}

export interface FinancialStatementRecord extends DataContractRecord {
  ticker: string | null;
  companyType: CompanyType;
  revenue: number | null;
  grossProfit: number | null;
  netIncome: number | null;
  operatingCashFlow: number | null;
  totalAssets: number | null;
  equity: number | null;
  totalDebt: number | null;
  currentAssets: number | null;
  currentLiabilities: number | null;
}

export interface ValuationInputRecord extends DataContractRecord {
  ticker: string | null;
  eps: number | null;
  bvps: number | null;
  sharesOutstanding: number | null;
  marketCap: number | null;
  enterpriseValue: number | null;
}

export interface MacroDataRecord extends DataContractRecord {
  country: string | null;
  indicator: string | null;
  value: number | null;
  unit: string | null;
}

export interface IndustryDataRecord extends DataContractRecord {
  industryCode: string | null;
  industryName: string | null;
  metric: string | null;
  value: number | null;
  unit: string | null;
}

export interface CompanyProfileRecord extends DataContractRecord {
  ticker: string | null;
  companyName: string | null;
  companyType: CompanyType;
  exchange: string | null;
  industryCode: string | null;
  industryName: string | null;
}

export interface DataContractMetricResult<T = number> {
  key: string;
  value: T | null;
  status: ReadinessStatus;
  interpretation: InterpretationStatus;
  missingFields: string[];
  warnings: DataSourceWarning[];
  metadata?: DataSourceMetadata | DerivedDataSourceMetadata;
  reason?: string;
}

export type SectorSensitiveMetric =
  | "currentRatio"
  | "debtToEquity"
  | "cfoInterpretation";

