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
  | "official_download"
  | "licensed_feed"
  | "public_file"
  | "public_web"
  | "manual_fixture"
  | "manual_upload"
  | "scraping"
  | "scraped"
  | "private_api"
  | "undocumented_api"
  | "private_or_undocumented_api"
  | "unknown";

export type SourceUsageMode =
  | "development"
  | "thesis_verification"
  | "production"
  | "test";

export type SourceEvidenceStatus =
  | "verified"
  | "partially_verified"
  | "missing"
  | "conflicting";

export type PermissionFlag = boolean | "unknown";

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
  sourceEvidence?: SourceEvidence;
  notes: string;
};

export type SourceEvidence = {
  sourceId: string;
  sourceName: string;
  sourceType: SourceType;
  dataGroups: DataGroup[];
  homepageUrl?: string | null;
  documentationUrl?: string | null;
  licenseName?: string | null;
  licenseUrl?: string | null;
  termsUrl?: string | null;
  allowsPersonalUse: PermissionFlag;
  allowsAcademicUse: PermissionFlag;
  allowsCommercialUse: PermissionFlag;
  allowsRuntimeDisplay: PermissionFlag;
  allowsCaching: PermissionFlag;
  allowsRedistribution: PermissionFlag;
  allowsDerivedData: PermissionFlag;
  requiresAttribution: PermissionFlag;
  attributionText?: string | null;
  accessMethod: SourceAccessMethod;
  evidenceStatus: SourceEvidenceStatus;
  reviewedAt?: string | null;
  reviewedBy?: string | null;
  reviewNote?: string | null;
  notes: string;
  risks: string[];
  blockedReason?: string | null;
};

export type SourceEvidenceEvaluation = {
  sourceId: string;
  sourceStatus: SourceUsageStatus;
  productionUsable: boolean;
  allowedModes: SourceUsageMode[];
  canCache: boolean;
  canRedistribute: boolean;
  requiresLegalReview: boolean;
  warnings: AdapterWarning[];
  errors: AdapterError[];
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
