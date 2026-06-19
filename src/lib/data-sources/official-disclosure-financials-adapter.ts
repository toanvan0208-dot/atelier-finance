import type {
  DataPeriod,
  DataSourceMetadata,
  FinancialStatementRecord,
  ReadinessStatus,
} from "../data-contract";
import { assessFinancialStatementReadiness } from "../data-contract";
import { buildAdapterMetadata, combineReadiness } from "./adapter-contract";
import { normalizeCurrencyAmount } from "./normalization";
import { evaluateSourceEvidence } from "./source-evidence";
import {
  getSourcePolicy,
} from "./source-policy";
import type {
  AdapterError,
  AdapterWarning,
  RawSourceRecord,
  SourceEvidence,
  SourceEvidenceStatus,
  SourceUsageMode,
  SourceUsageStatus,
} from "./types";

export const OFFICIAL_DISCLOSURE_FINANCIALS_SOURCE_ID =
  "official-disclosure-financials-pilot";

export type OfficialDisclosureFinancialStatementAdapterInput = {
  sourceId?: string;
  sourceUrl?: string | null;
  sourceLabel?: string | null;
  fetchedAt?: string | null;
  rawRecord: RawSourceRecord;
  evidenceStatus?: SourceEvidenceStatus;
  usageStatus?: SourceUsageStatus;
  sourceEvidence?: SourceEvidence | null;
  mode?: SourceUsageMode;
  now?: Date;
};

export type OfficialDisclosureFinancialStatementAdapterOutput = {
  data: FinancialStatementRecord | null;
  metadata: DataSourceMetadata | null;
  readiness: ReadinessStatus;
  warnings: AdapterWarning[];
  errors: AdapterError[];
  sourceEvidenceStatus: SourceEvidenceStatus;
  usageStatus: SourceUsageStatus;
  productionApproved: false;
  sourceId: string;
  sourceUrl: string | null;
};

const requiredText = (
  value: unknown,
  field: string,
): { value: string | null; errors: AdapterError[] } => {
  if (typeof value === "string" && value.trim().length > 0) {
    return { value: value.trim(), errors: [] };
  }

  return {
    value: null,
    errors: [{ code: "REQUIRED_FIELD_MISSING", message: `${field} is required.`, field }],
  };
};

const optionalText = (value: unknown): string | null =>
  typeof value === "string" && value.trim().length > 0 ? value.trim() : null;

const parsePeriod = (
  periodValue: unknown,
  periodTypeValue: unknown,
): { period: DataPeriod | null; fiscalYear: number | null; fiscalQuarter: number | null; errors: AdapterError[] } => {
  const periodText = requiredText(periodValue, "period");
  const periodTypeText = requiredText(periodTypeValue, "periodType");
  const errors = [...periodText.errors, ...periodTypeText.errors];

  if (!periodText.value || !periodTypeText.value) {
    return { period: null, fiscalYear: null, fiscalQuarter: null, errors };
  }

  const periodType = periodTypeText.value;
  if (!["quarter", "year", "ttm"].includes(periodType)) {
    return {
      period: null,
      fiscalYear: null,
      fiscalQuarter: null,
      errors: [
        ...errors,
        {
          code: "PERIOD_TYPE_UNSUPPORTED",
          message: "Official disclosure financials pilot supports quarter, year, or ttm periods.",
          field: "periodType",
        },
      ],
    };
  }

  const quarterMatch = periodText.value.match(/^(\d{4})[- ]?Q([1-4])$/i);
  const yearMatch = periodText.value.match(/^(\d{4})$/);

  if (periodType === "quarter" && quarterMatch) {
    return {
      period: {
        type: "quarter",
        value: periodText.value,
        fiscalYear: Number(quarterMatch[1]),
        fiscalQuarter: Number(quarterMatch[2]),
      },
      fiscalYear: Number(quarterMatch[1]),
      fiscalQuarter: Number(quarterMatch[2]),
      errors,
    };
  }

  if (periodType === "year" && yearMatch) {
    return {
      period: {
        type: "year",
        value: periodText.value,
        fiscalYear: Number(yearMatch[1]),
      },
      fiscalYear: Number(yearMatch[1]),
      fiscalQuarter: null,
      errors,
    };
  }

  if (periodType === "ttm") {
    return {
      period: {
        type: "ttm",
        value: periodText.value,
      },
      fiscalYear: yearMatch ? Number(yearMatch[1]) : null,
      fiscalQuarter: null,
      errors,
    };
  }

  return {
    period: null,
    fiscalYear: null,
    fiscalQuarter: null,
    errors: [
      ...errors,
      {
        code: "PERIOD_FORMAT_UNSUPPORTED",
        message: "Period value does not match the declared period type.",
        field: "period",
      },
    ],
  };
};

const blockedOutput = ({
  sourceId,
  sourceUrl,
  sourceEvidenceStatus,
  usageStatus,
  warnings = [],
  errors,
}: {
  sourceId: string;
  sourceUrl: string | null;
  sourceEvidenceStatus: SourceEvidenceStatus;
  usageStatus: SourceUsageStatus;
  warnings?: AdapterWarning[];
  errors: AdapterError[];
}): OfficialDisclosureFinancialStatementAdapterOutput => ({
  data: null,
  metadata: null,
  readiness: "not_ready",
  warnings,
  errors,
  sourceEvidenceStatus,
  usageStatus,
  productionApproved: false,
  sourceId,
  sourceUrl,
});

export const normalizeOfficialDisclosureFinancialStatement = (
  input: OfficialDisclosureFinancialStatementAdapterInput,
): OfficialDisclosureFinancialStatementAdapterOutput => {
  const sourceId = input.sourceId ?? OFFICIAL_DISCLOSURE_FINANCIALS_SOURCE_ID;
  const policy = getSourcePolicy(sourceId);
  const sourceEvidence = input.sourceEvidence ?? policy.sourceEvidence ?? null;
  const sourceEvidenceStatus = input.evidenceStatus ?? sourceEvidence?.evidenceStatus ?? "missing";
  const usageStatus = input.usageStatus ?? policy.usageStatus;
  const sourceUrl = input.sourceUrl ?? sourceEvidence?.homepageUrl ?? null;
  const mode = input.mode ?? "production";
  const policyWarnings: AdapterWarning[] = [];
  const policyErrors: AdapterError[] = [];

  if (!sourceEvidence) {
    return blockedOutput({
      sourceId,
      sourceUrl,
      sourceEvidenceStatus,
      usageStatus,
      errors: [
        {
          code: "SOURCE_EVIDENCE_MISSING",
          message: "Official disclosure adapter requires a source evidence record before normalization.",
          field: "sourceEvidence",
        },
      ],
    });
  }

  const evidenceEvaluation = evaluateSourceEvidence(sourceEvidence, usageStatus);
  policyWarnings.push(...evidenceEvaluation.warnings);
  policyErrors.push(...evidenceEvaluation.errors);

  if (usageStatus === "blocked") {
    return blockedOutput({
      sourceId,
      sourceUrl,
      sourceEvidenceStatus,
      usageStatus,
      warnings: policyWarnings,
      errors: [
        ...policyErrors,
        { code: "SOURCE_BLOCKED", message: "Source is blocked by policy.", field: "usageStatus" },
      ],
    });
  }

  if (sourceEvidenceStatus !== "verified") {
    return blockedOutput({
      sourceId,
      sourceUrl,
      sourceEvidenceStatus,
      usageStatus,
      warnings: policyWarnings,
      errors: [
        ...policyErrors,
        {
          code: "SOURCE_EVIDENCE_NOT_VERIFIED",
          message: "Source evidence is not verified; adapter fails closed.",
          field: "evidenceStatus",
        },
      ],
    });
  }

  if (mode === "production" && !evidenceEvaluation.productionUsable) {
    return blockedOutput({
      sourceId,
      sourceUrl,
      sourceEvidenceStatus,
      usageStatus,
      warnings: policyWarnings,
      errors: [
        ...policyErrors,
        {
          code: "SOURCE_NOT_PRODUCTION_USABLE",
          message: "Source is not approved for production runtime.",
          field: "usageStatus",
        },
      ],
    });
  }

  const raw = input.rawRecord;
  const sourceLabel = requiredText(input.sourceLabel ?? sourceEvidence.sourceName, "sourceLabel");
  const sourceUrlValue = requiredText(sourceUrl, "sourceUrl");
  const fetchedAt = requiredText(input.fetchedAt, "fetchedAt");
  const ticker = requiredText(raw.ticker, "ticker");
  const companyType = optionalText(raw.companyType) ?? "unknown";
  const currency = requiredText(raw.currency, "currency");
  const unit = requiredText(raw.unit, "unit");
  const { period, fiscalYear, fiscalQuarter, errors: periodErrors } = parsePeriod(raw.period, raw.periodType);
  const errors: AdapterError[] = [
    ...policyErrors,
    ...sourceLabel.errors,
    ...sourceUrlValue.errors,
    ...fetchedAt.errors,
    ...ticker.errors,
    ...currency.errors,
    ...unit.errors,
    ...periodErrors,
  ];
  const warnings: AdapterWarning[] = [...policyWarnings];

  if (usageStatus !== "approved") {
    warnings.push({
      code: "SOURCE_NEEDS_REVIEW",
      message: "Source is normalized only for local review and remains not production-approved.",
      field: "usageStatus",
    });
  }

  const numericFields = {
    revenue: normalizeCurrencyAmount({ value: raw.revenue, currency: currency.value, field: "revenue" }),
    grossProfit: normalizeCurrencyAmount({ value: raw.grossProfit, currency: currency.value, field: "grossProfit" }),
    netIncome: normalizeCurrencyAmount({ value: raw.netIncome, currency: currency.value, field: "netIncome" }),
    operatingCashFlow: normalizeCurrencyAmount({ value: raw.operatingCashFlow, currency: currency.value, field: "operatingCashFlow" }),
    totalAssets: normalizeCurrencyAmount({ value: raw.totalAssets, currency: currency.value, field: "totalAssets" }),
    equity: normalizeCurrencyAmount({ value: raw.equity, currency: currency.value, field: "equity" }),
    totalDebt: normalizeCurrencyAmount({ value: raw.totalDebt, currency: currency.value, field: "totalDebt" }),
    currentAssets: normalizeCurrencyAmount({ value: raw.currentAssets, currency: currency.value, field: "currentAssets" }),
    currentLiabilities: normalizeCurrencyAmount({ value: raw.currentLiabilities, currency: currency.value, field: "currentLiabilities" }),
  };

  const numericResults = Object.values(numericFields);
  warnings.push(...numericResults.flatMap((result) => result.warnings));
  errors.push(...numericResults.flatMap((result) => result.errors));

  const missingFields = [
    ...(ticker.value ? [] : ["ticker"]),
    ...(period ? [] : ["period"]),
    ...(currency.value ? [] : ["currency"]),
    ...(unit.value ? [] : ["unit"]),
    ...(numericFields.netIncome.value === null ? ["netIncome"] : []),
    ...(numericFields.totalAssets.value === null ? ["totalAssets"] : []),
    ...(numericFields.equity.value === null ? ["equity"] : []),
  ];

  const metadataResult = buildAdapterMetadata({
    source: sourceLabel.value,
    sourceType: "company_disclosure",
    asOf: raw.asOf,
    dataGroup: "financial_statement",
    period,
    collectedAt: fetchedAt.value,
    isDemoData: false,
    missingFields,
    warnings,
    now: input.now,
  });
  warnings.push(...metadataResult.warnings);
  errors.push(...metadataResult.errors);

  if (errors.length > 0 || !metadataResult.metadata || !period) {
    return {
      data: null,
      metadata: metadataResult.metadata,
      readiness: combineReadiness([
        metadataResult.readiness,
        errors.length > 0 ? "not_ready" : "insufficient_data",
      ]),
      warnings,
      errors,
      sourceEvidenceStatus,
      usageStatus,
      productionApproved: false,
      sourceId,
      sourceUrl,
    };
  }

  const data: FinancialStatementRecord = {
    ticker: ticker.value,
    companyType: companyType === "bank" || companyType === "securities" || companyType === "insurance" || companyType === "non_financial"
      ? companyType
      : "unknown",
    revenue: numericFields.revenue.value,
    grossProfit: numericFields.grossProfit.value,
    netIncome: numericFields.netIncome.value,
    operatingCashFlow: numericFields.operatingCashFlow.value,
    totalAssets: numericFields.totalAssets.value,
    equity: numericFields.equity.value,
    totalDebt: numericFields.totalDebt.value,
    currentAssets: numericFields.currentAssets.value,
    currentLiabilities: numericFields.currentLiabilities.value,
    metadata: {
      ...metadataResult.metadata,
      period: {
        ...period,
        fiscalYear: period.fiscalYear ?? fiscalYear ?? undefined,
        fiscalQuarter: period.fiscalQuarter ?? fiscalQuarter ?? undefined,
      },
    },
  };
  const dataReadiness = assessFinancialStatementReadiness(data);

  return {
    data,
    metadata: data.metadata,
    readiness: combineReadiness([
      metadataResult.readiness,
      dataReadiness.status,
      warnings.length > 0 ? "needs_review" : "ready",
    ]),
    warnings,
    errors,
    sourceEvidenceStatus,
    usageStatus,
    productionApproved: false,
    sourceId,
    sourceUrl,
  };
};
