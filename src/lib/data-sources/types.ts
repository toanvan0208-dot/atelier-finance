import type {
  CompanyProfileRecord,
  DataSourceMetadata,
  FinancialStatementRecord,
  IndustryDataRecord,
  MacroDataRecord,
  MarketDataRecord,
  ReadinessStatus,
  SourceType,
  ValuationInputRecord,
} from "../data-contract";

export type DataGroup =
  | "market"
  | "financial_statement"
  | "valuation"
  | "macro"
  | "industry"
  | "company_profile"
  | "risk";

export type SourceUsageStatus =
  | "approved"
  | "needs_legal_review"
  | "blocked"
  | "research_only"
  | "unknown";

export type LegalReviewStatus =
  | "not_checked"
  | "needs_review"
  | "approved"
  | "rejected";

export type SourceAccessMethod =
  | "official_api"
  | "licensed_feed"
  | "public_file"
  | "manual_fixture"
  | "scraping"
  | "private_api"
  | "undocumented_api"
  | "unknown";

export type RawSourceValue = string | number | boolean | null | undefined;
export type RawSourceRecord = Record<string, RawSourceValue>;

export type AdapterWarning = {
  code: string;
  message: string;
  field?: string;
};

export type AdapterError = {
  code: string;
  message: string;
  field?: string;
};

export type SourceRegistryEntry = {
  id: string;
  name: string;
  sourceType: SourceType;
  supportedDataGroups: DataGroup[];
  usageStatus: SourceUsageStatus;
  licenseStatus: LegalReviewStatus;
  tosStatus: LegalReviewStatus;
  redistributionAllowed: boolean | "unknown";
  cachingAllowed: boolean | "unknown";
  accessMethod: SourceAccessMethod;
  evidence: string[];
  notes: string;
};

export type AdapterResult<T> = {
  data: T | null;
  metadata: DataSourceMetadata | null;
  warnings: AdapterWarning[];
  errors: AdapterError[];
  readiness: ReadinessStatus;
};

export type SourceAdapter = {
  id: string;
  name: string;
  sourceType: SourceType;
  supportedDataGroups: DataGroup[];
  legalStatus: SourceUsageStatus;
  licenseStatus: LegalReviewStatus;
  normalizeMarketData: (record: RawSourceRecord) => AdapterResult<MarketDataRecord>;
  normalizeFinancialData: (record: RawSourceRecord) => AdapterResult<FinancialStatementRecord>;
  normalizeValuationData: (record: RawSourceRecord) => AdapterResult<ValuationInputRecord>;
  normalizeMacroData?: (record: RawSourceRecord) => AdapterResult<MacroDataRecord>;
  normalizeIndustryData?: (record: RawSourceRecord) => AdapterResult<IndustryDataRecord>;
  normalizeCompanyProfile?: (record: RawSourceRecord) => AdapterResult<CompanyProfileRecord>;
};

