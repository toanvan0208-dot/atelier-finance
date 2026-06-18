import type { ReadinessStatus } from "../data-contract";
import type {
  ManualUploadAdapterResult,
  ManualUploadRowResult,
  ManualUploadSummary,
} from "./manual-upload-adapter";
import type { AdapterError, AdapterWarning } from "./types";

export type ManualUploadReportStatus = "pass" | "needs_review" | "failed";
export type ManualUploadIssueSeverity = "info" | "warning" | "error" | "critical";
export type ManualUploadIssueCategory =
  | "missing_required_field"
  | "invalid_number"
  | "invalid_date"
  | "missing_as_of"
  | "missing_period"
  | "stale_data"
  | "non_vnd_currency"
  | "unmapped_field"
  | "financial_guardrail"
  | "source_policy"
  | "parser_limitation";

export type ManualUploadIssue = {
  issueCode: string;
  severity: ManualUploadIssueSeverity;
  category: ManualUploadIssueCategory;
  message: string;
  count: number;
  affectedRows: number[];
  affectedFields: string[];
  suggestedAction: string;
};

export type ManualUploadFieldCoverage = {
  fieldName: string;
  presentCount: number;
  missingCount: number;
  invalidCount: number;
  coverageRatio: number;
  requiredForModules: string[];
};

export type ManualUploadModuleReadiness = {
  status: ReadinessStatus;
  missing: string[];
  blockedReasons: string[];
};

export type ManualUploadUnmappedFieldReport = {
  fieldName: string;
  count: number;
  sampleValues: string[];
  suggestedCanonicalField: string | null;
};

export type ManualUploadRowDiagnostic = {
  rowIndex: number;
  status: ManualUploadReportStatus;
  errors: AdapterError[];
  warnings: AdapterWarning[];
  missingFields: string[];
  unmappedFields: string[];
  readiness: ReadinessStatus;
};

export type ManualUploadValidationReport = {
  status: ManualUploadReportStatus;
  readiness: ReadinessStatus;
  summary: ManualUploadSummary & {
    validRatio: number;
    errorRatio: number;
  };
  severityCounts: Record<ManualUploadIssueSeverity, number>;
  categoryCounts: Record<ManualUploadIssueCategory, number>;
  topIssues: ManualUploadIssue[];
  fieldCoverage: ManualUploadFieldCoverage[];
  moduleReadiness: {
    financials: ManualUploadModuleReadiness;
    valuation: ManualUploadModuleReadiness;
    risk: ManualUploadModuleReadiness;
    pvt: ManualUploadModuleReadiness;
    overview: ManualUploadModuleReadiness;
  };
  unmappedFields: ManualUploadUnmappedFieldReport[];
  rowDiagnostics: ManualUploadRowDiagnostic[];
  safeNextSteps: string[];
  disclaimer: string;
};

const trackedFields = [
  { fieldName: "ticker", modules: ["overview", "financials", "valuation", "pvt"] },
  { fieldName: "period", modules: ["financials", "valuation"] },
  { fieldName: "asOf", modules: ["overview", "financials", "valuation", "pvt", "risk"] },
  { fieldName: "revenue", modules: ["financials", "risk"] },
  { fieldName: "netIncome", modules: ["financials", "valuation", "risk"] },
  { fieldName: "operatingCashFlow", modules: ["financials", "risk"] },
  { fieldName: "totalAssets", modules: ["financials", "risk"] },
  { fieldName: "equity", modules: ["financials", "valuation", "risk"] },
  { fieldName: "eps", modules: ["valuation"] },
  { fieldName: "bvps", modules: ["valuation"] },
  { fieldName: "closePrice", modules: ["valuation", "pvt", "overview"] },
  { fieldName: "volume", modules: ["pvt"] },
  { fieldName: "tradingValue", modules: ["pvt"] },
] as const;

const issueCategoryByCode = (code: string): ManualUploadIssueCategory => {
  if (code === "CSV_PARSE_UNSUPPORTED" || code === "CSV_EMPTY" || code === "CSV_HEADER_INVALID") return "parser_limitation";
  if (code === "INVALID_NUMBER") return "invalid_number";
  if (code === "INVALID_AS_OF") return "invalid_date";
  if (code === "AS_OF_MISSING") return "missing_as_of";
  if (code === "PERIOD_MISSING" || code === "PERIOD_FORMAT_UNKNOWN") return "missing_period";
  if (code === "STALE_DATA") return "stale_data";
  if (code === "CURRENCY_NEEDS_REVIEW") return "non_vnd_currency";
  if (code === "UNMAPPED_FIELDS") return "unmapped_field";
  if (code.includes("POLICY") || code.includes("SOURCE")) return "source_policy";
  return "missing_required_field";
};

const issueSeverity = (code: string, hasRows: boolean): ManualUploadIssueSeverity => {
  if (!hasRows || code === "CSV_PARSE_UNSUPPORTED" || code === "CSV_EMPTY" || code === "CSV_HEADER_INVALID") return "critical";
  if (code === "INVALID_NUMBER" || code === "INVALID_AS_OF" || code === "AS_OF_MISSING" || code === "PERIOD_MISSING") return "error";
  if (code === "EPS_NOT_POSITIVE" || code === "EQUITY_NOT_POSITIVE" || code === "TOTAL_ASSETS_NOT_POSITIVE") return "warning";
  return "warning";
};

const suggestedAction = (category: ManualUploadIssueCategory, field?: string): string => {
  if (category === "missing_as_of") return "Add record-level asOf. Do not replace it with the current date.";
  if (category === "invalid_date") return "Fix invalid date values and keep asOf tied to the source record.";
  if (category === "missing_period") return "Add a financial period such as 2024Q4, 2024-Q4, 2024, or TTM.";
  if (category === "invalid_number") return `Check numeric value${field ? ` for ${field}` : ""}; missing values must remain null.`;
  if (category === "non_vnd_currency") return "Provide exchange-rate source before currency conversion, or keep the row for review only.";
  if (category === "unmapped_field") return "Rename the field to a supported canonical alias or document why it should stay unmapped.";
  if (category === "financial_guardrail") return "Keep the affected metric not applicable and review the underlying financial data.";
  if (category === "parser_limitation") return "Use object-array input or simple CSV without quoted fields for Phase 28B.";
  if (category === "source_policy") return "Review source evidence and keep manual upload out of production runtime.";
  return `Add or verify required field${field ? ` ${field}` : ""}.`;
};

const issueKey = (code: string, field?: string): string => `${code}:${field ?? ""}`;

const addIssue = (
  issues: Map<string, ManualUploadIssue>,
  params: {
    code: string;
    message: string;
    rowIndex?: number;
    field?: string;
    hasRows: boolean;
    category?: ManualUploadIssueCategory;
  },
): void => {
  const category = params.category ?? issueCategoryByCode(params.code);
  const key = issueKey(params.code, params.field);
  const existing = issues.get(key);
  if (existing) {
    issues.set(key, {
      ...existing,
      count: existing.count + 1,
      affectedRows: params.rowIndex && !existing.affectedRows.includes(params.rowIndex)
        ? [...existing.affectedRows, params.rowIndex]
        : existing.affectedRows,
      affectedFields: params.field && !existing.affectedFields.includes(params.field)
        ? [...existing.affectedFields, params.field]
        : existing.affectedFields,
    });
    return;
  }

  issues.set(key, {
    issueCode: params.code,
    severity: issueSeverity(params.code, params.hasRows),
    category,
    message: params.message,
    count: 1,
    affectedRows: params.rowIndex ? [params.rowIndex] : [],
    affectedFields: params.field ? [params.field] : [],
    suggestedAction: suggestedAction(category, params.field),
  });
};

const statusFromRow = (row: ManualUploadRowResult): ManualUploadReportStatus => {
  if (row.errors.length > 0 || row.readiness === "not_ready") return "failed";
  if (row.warnings.length > 0 || row.readiness !== "ready") return "needs_review";
  return "pass";
};

const issueSeverityCounts = (issues: ManualUploadIssue[]) => ({
  info: issues.filter((issue) => issue.severity === "info").length,
  warning: issues.filter((issue) => issue.severity === "warning").length,
  error: issues.filter((issue) => issue.severity === "error").length,
  critical: issues.filter((issue) => issue.severity === "critical").length,
});

const issueCategoryCounts = (issues: ManualUploadIssue[]) => ({
  missing_required_field: issues.filter((issue) => issue.category === "missing_required_field").length,
  invalid_number: issues.filter((issue) => issue.category === "invalid_number").length,
  invalid_date: issues.filter((issue) => issue.category === "invalid_date").length,
  missing_as_of: issues.filter((issue) => issue.category === "missing_as_of").length,
  missing_period: issues.filter((issue) => issue.category === "missing_period").length,
  stale_data: issues.filter((issue) => issue.category === "stale_data").length,
  non_vnd_currency: issues.filter((issue) => issue.category === "non_vnd_currency").length,
  unmapped_field: issues.filter((issue) => issue.category === "unmapped_field").length,
  financial_guardrail: issues.filter((issue) => issue.category === "financial_guardrail").length,
  source_policy: issues.filter((issue) => issue.category === "source_policy").length,
  parser_limitation: issues.filter((issue) => issue.category === "parser_limitation").length,
});

const invalidCountForField = (rows: ManualUploadRowResult[], fieldName: string): number =>
  rows.filter((row) => row.errors.some((error) => error.field === fieldName)).length;

const isFieldPresent = (row: ManualUploadRowResult, fieldName: string): boolean => {
  if (fieldName === "ticker") return Boolean(row.financialStatement?.ticker ?? row.marketData?.ticker ?? row.valuationInput?.ticker);
  if (fieldName === "period") return Boolean(row.financialStatement?.metadata.period ?? row.marketData?.metadata.period ?? row.valuationInput?.metadata.period);
  if (fieldName === "asOf") return Boolean(row.financialStatement?.metadata.asOf ?? row.marketData?.metadata.asOf ?? row.valuationInput?.metadata.asOf);
  if (fieldName === "revenue") return row.financialStatement?.revenue !== null && row.financialStatement?.revenue !== undefined;
  if (fieldName === "netIncome") return row.financialStatement?.netIncome !== null && row.financialStatement?.netIncome !== undefined;
  if (fieldName === "operatingCashFlow") return row.financialStatement?.operatingCashFlow !== null && row.financialStatement?.operatingCashFlow !== undefined;
  if (fieldName === "totalAssets") return row.financialStatement?.totalAssets !== null && row.financialStatement?.totalAssets !== undefined;
  if (fieldName === "equity") return row.financialStatement?.equity !== null && row.financialStatement?.equity !== undefined;
  if (fieldName === "totalDebt") return row.financialStatement?.totalDebt !== null && row.financialStatement?.totalDebt !== undefined;
  if (fieldName === "currentAssets") return row.financialStatement?.currentAssets !== null && row.financialStatement?.currentAssets !== undefined;
  if (fieldName === "currentLiabilities") return row.financialStatement?.currentLiabilities !== null && row.financialStatement?.currentLiabilities !== undefined;
  if (fieldName === "eps") return row.valuationInput?.eps !== null && row.valuationInput?.eps !== undefined;
  if (fieldName === "bvps") return row.valuationInput?.bvps !== null && row.valuationInput?.bvps !== undefined;
  if (fieldName === "closePrice") return row.marketData?.closePrice !== null && row.marketData?.closePrice !== undefined;
  if (fieldName === "volume") return row.marketData?.volume !== null && row.marketData?.volume !== undefined;
  if (fieldName === "tradingValue") return row.marketData?.tradingValue !== null && row.marketData?.tradingValue !== undefined;
  return !row.missingFields.includes(fieldName);
};

const buildFieldCoverage = (rows: ManualUploadRowResult[]): ManualUploadFieldCoverage[] =>
  trackedFields.map((field) => {
    const invalidCount = invalidCountForField(rows, field.fieldName);
    const presentCount = rows.filter((row) => isFieldPresent(row, field.fieldName)).length;
    const missingCount = Math.max(0, rows.length - presentCount - invalidCount);
    const denominator = rows.length || 1;
    return {
      fieldName: field.fieldName,
      presentCount,
      missingCount,
      invalidCount,
      coverageRatio: presentCount / denominator,
      requiredForModules: [...field.modules],
    };
  });

const readinessStatus = (missing: string[], warnings: string[], blockers: string[]): ReadinessStatus => {
  if (blockers.length > 0) return "not_ready";
  if (missing.length > 0) return "insufficient_data";
  if (warnings.length > 0) return "needs_review";
  return "ready";
};

const buildModuleReadiness = (rows: ManualUploadRowResult[]): ManualUploadValidationReport["moduleReadiness"] => {
  const missingCounts = (field: string) => rows.filter((row) => row.missingFields.includes(field)).length;
  const anyErrors = rows.some((row) => row.errors.length > 0);
  const hasFinancial = rows.some((row) => row.financialStatement);
  const hasMarket = rows.some((row) => row.marketData);
  const hasValuation = rows.some((row) => row.valuationInput);
  const financialMissing = ["ticker", "period", "netIncome", "totalAssets", "equity"].filter((field) => missingCounts(field) > 0);
  const financialWarnings = missingCounts("operatingCashFlow") > 0 ? ["operatingCashFlow is missing for some rows."] : [];
  const valuationMissing = ["closePrice"].filter((field) => missingCounts(field) > 0);
  if (missingCounts("eps") > 0 && missingCounts("bvps") > 0) valuationMissing.push("eps_or_bvps");
  const valuationWarnings: string[] = [];
  if (rows.some((row) => (row.valuationInput?.eps ?? 1) <= 0)) valuationWarnings.push("EPS <= 0 makes P/E not applicable.");
  if (rows.some((row) => (row.financialStatement?.equity ?? 1) <= 0)) valuationWarnings.push("Equity <= 0 blocks normal ROE/P/B/BVPS interpretation.");
  const pvtMissing = ["ticker", "closePrice"].filter((field) => missingCounts(field) > 0);
  if (missingCounts("volume") > 0 && missingCounts("tradingValue") > 0) pvtMissing.push("volume_or_tradingValue");
  const riskMissing = ["totalDebt", "operatingCashFlow", "currentAssets", "currentLiabilities"].filter((field) =>
    rows.some((row) => !isFieldPresent(row, field)),
  );
  const riskWarnings = rows.some((row) => row.warnings.some((warning) => warning.code === "COMPANY_TYPE_UNKNOWN"))
    ? ["companyType is unknown for some rows."]
    : [];

  const financialBlockers = [...(!hasFinancial ? ["No financial statement record could be built."] : []), ...(anyErrors ? ["Rows contain errors."] : [])];
  const valuationBlockers = [...(!hasValuation || !hasMarket ? ["Valuation needs market and valuation input records."] : []), ...(anyErrors ? ["Rows contain errors."] : [])];
  const pvtBlockers = [...(!hasMarket ? ["No market data record could be built."] : []), ...(anyErrors ? ["Rows contain errors."] : [])];
  const riskBlockers = [...(!hasFinancial ? ["Risk review needs financial statement records."] : []), ...(anyErrors ? ["Rows contain errors."] : [])];

  const financials = {
    missing: financialMissing,
    blockedReasons: financialBlockers,
    status: readinessStatus(financialMissing, financialWarnings, financialBlockers),
  };
  const valuation = {
    missing: valuationMissing,
    blockedReasons: valuationBlockers,
    status: readinessStatus(valuationMissing, valuationWarnings, valuationBlockers),
  };
  const pvt = {
    missing: pvtMissing,
    blockedReasons: pvtBlockers,
    status: readinessStatus(pvtMissing, [], pvtBlockers),
  };
  const risk = {
    missing: riskMissing,
    blockedReasons: riskBlockers,
    status: readinessStatus([], [...riskMissing, ...riskWarnings], riskBlockers),
  };
  const overviewBlockers = financials.status === "not_ready" && pvt.status === "not_ready" ? ["Overview lacks both financial and market-ready records."] : [];
  return {
    financials,
    valuation,
    pvt,
    risk,
    overview: {
      missing: [],
      blockedReasons: overviewBlockers,
      status: readinessStatus([], [financials.status, valuation.status, pvt.status, risk.status].filter((status) => status !== "ready"), overviewBlockers),
    },
  };
};

const suggestedCanonicalField = (fieldName: string): string | null => {
  const normalized = fieldName.toLowerCase();
  if (normalized.includes("profit")) return "netIncome";
  if (normalized.includes("equity")) return "equity";
  if (normalized.includes("price")) return "closePrice";
  if (normalized.includes("volume")) return "volume";
  return null;
};

const buildUnmappedFieldReport = (rows: ManualUploadRowResult[]): ManualUploadUnmappedFieldReport[] => {
  const counts = new Map<string, number>();
  for (const row of rows) {
    for (const field of row.unmappedFields) {
      counts.set(field, (counts.get(field) ?? 0) + 1);
    }
  }

  return Array.from(counts.entries()).map(([fieldName, count]) => ({
    fieldName,
    count,
    sampleValues: [],
    suggestedCanonicalField: suggestedCanonicalField(fieldName),
  }));
};

const safeNextSteps = (report: Pick<ManualUploadValidationReport, "topIssues" | "moduleReadiness">): string[] => {
  const steps = new Set<string>();
  if (report.topIssues.some((issue) => issue.category === "missing_as_of" || issue.category === "invalid_date")) {
    steps.add("Add or fix asOf for affected rows before previewing modules.");
  }
  if (report.topIssues.some((issue) => issue.category === "invalid_number")) {
    steps.add("Review invalid numeric fields and keep unavailable values as null.");
  }
  if (report.topIssues.some((issue) => issue.category === "non_vnd_currency")) {
    steps.add("Provide exchange-rate source before converting non-VND values.");
  }
  if (report.moduleReadiness.financials.missing.includes("operatingCashFlow")) {
    steps.add("Add operatingCashFlow if cash-flow quality analysis is needed.");
  }
  if (report.topIssues.some((issue) => issue.issueCode === "EPS_NOT_POSITIVE")) {
    steps.add("Keep P/E not applicable when EPS is zero or negative.");
  }
  if (report.topIssues.some((issue) => issue.issueCode === "EQUITY_NOT_POSITIVE")) {
    steps.add("Keep ROE, P/B, and BVPS interpretation blocked when equity is zero or negative.");
  }
  steps.add("Use this result for thesis/local verification only until source evidence is reviewed.");
  return Array.from(steps);
};

export const buildManualUploadValidationReport = (
  adapterResult: ManualUploadAdapterResult,
): ManualUploadValidationReport => {
  const issues = new Map<string, ManualUploadIssue>();
  const hasRows = adapterResult.rowResults.length > 0;

  for (const error of adapterResult.errors) {
    addIssue(issues, {
      code: error.code,
      message: error.message,
      field: error.field,
      hasRows,
    });
  }

  for (const row of adapterResult.rowResults) {
    for (const error of row.errors) {
      addIssue(issues, { code: error.code, message: error.message, rowIndex: row.rowIndex, field: error.field, hasRows });
    }
    for (const warning of row.warnings) {
      addIssue(issues, { code: warning.code, message: warning.message, rowIndex: row.rowIndex, field: warning.field, hasRows });
    }
    for (const field of row.missingFields) {
      addIssue(issues, {
        code: "MISSING_FIELD",
        message: `Missing field: ${field}.`,
        rowIndex: row.rowIndex,
        field,
        hasRows,
        category: "missing_required_field",
      });
    }
    if (row.financialStatement?.operatingCashFlow === null) {
      addIssue(issues, {
        code: "OPERATING_CASH_FLOW_MISSING",
        message: "operatingCashFlow is missing; cash-flow quality analysis needs review.",
        rowIndex: row.rowIndex,
        field: "operatingCashFlow",
        hasRows,
      });
    }
    if ((row.valuationInput?.eps ?? 1) <= 0) {
      addIssue(issues, {
        code: "EPS_NOT_POSITIVE",
        message: "EPS is zero or negative; P/E is not applicable for normal interpretation.",
        rowIndex: row.rowIndex,
        field: "eps",
        hasRows,
        category: "financial_guardrail",
      });
    }
    if ((row.financialStatement?.equity ?? 1) <= 0) {
      addIssue(issues, {
        code: "EQUITY_NOT_POSITIVE",
        message: "Equity is zero or negative; ROE, P/B, and BVPS cannot be interpreted normally.",
        rowIndex: row.rowIndex,
        field: "equity",
        hasRows,
        category: "financial_guardrail",
      });
    }
    if ((row.financialStatement?.totalAssets ?? 1) <= 0) {
      addIssue(issues, {
        code: "TOTAL_ASSETS_NOT_POSITIVE",
        message: "totalAssets is zero or negative; ROA/CFOA are insufficient data.",
        rowIndex: row.rowIndex,
        field: "totalAssets",
        hasRows,
        category: "financial_guardrail",
      });
    }
  }

  const topIssues = Array.from(issues.values()).sort((a, b) => {
    const rank = { critical: 4, error: 3, warning: 2, info: 1 };
    return rank[b.severity] - rank[a.severity] || b.count - a.count;
  });
  const severityCounts = issueSeverityCounts(topIssues);
  const categoryCounts = issueCategoryCounts(topIssues);
  const summary = {
    ...adapterResult.summary,
    validRatio: adapterResult.summary.totalRows > 0 ? adapterResult.summary.validRows / adapterResult.summary.totalRows : 0,
    errorRatio: adapterResult.summary.totalRows > 0 ? adapterResult.summary.errorRows / adapterResult.summary.totalRows : severityCounts.critical > 0 ? 1 : 0,
  };
  const rowDiagnostics = adapterResult.rowResults.map((row) => ({
    rowIndex: row.rowIndex,
    status: statusFromRow(row),
    errors: row.errors,
    warnings: row.warnings,
    missingFields: row.missingFields,
    unmappedFields: row.unmappedFields,
    readiness: row.readiness,
  }));
  const moduleReadiness = buildModuleReadiness(adapterResult.rowResults);
  const status: ManualUploadReportStatus =
    severityCounts.critical > 0 || summary.validRows === 0 || adapterResult.readiness === "not_ready"
      ? "failed"
      : severityCounts.error > 0 || severityCounts.warning > 0 || adapterResult.readiness !== "ready"
        ? "needs_review"
        : "pass";

  const reportWithoutSteps = {
    status,
    readiness: adapterResult.readiness,
    summary,
    severityCounts,
    categoryCounts,
    topIssues,
    fieldCoverage: buildFieldCoverage(adapterResult.rowResults),
    moduleReadiness,
    unmappedFields: buildUnmappedFieldReport(adapterResult.rowResults),
    rowDiagnostics,
    safeNextSteps: [],
    disclaimer: "This report checks data quality and readiness only. It is not an investment recommendation.",
  };

  return {
    ...reportWithoutSteps,
    safeNextSteps: safeNextSteps(reportWithoutSteps),
  };
};

const moduleLine = (name: string, readiness: ManualUploadModuleReadiness): string =>
  `* ${name}: ${readiness.status}${readiness.missing.length > 0 ? `; missing ${readiness.missing.join(", ")}` : ""}${readiness.blockedReasons.length > 0 ? `; blocked: ${readiness.blockedReasons.join("; ")}` : ""}`;

export const formatManualUploadValidationReport = (
  report: ManualUploadValidationReport,
): string => {
  const mainIssues = report.topIssues.slice(0, 5).map((issue, index) =>
    `${index + 1}. [${issue.severity}] ${issue.message} (${issue.count} occurrence${issue.count === 1 ? "" : "s"}). ${issue.suggestedAction}`,
  );
  const coverageLines = report.fieldCoverage.map((field) =>
    `* ${field.fieldName}: ${field.presentCount}/${report.summary.totalRows} present, ${field.missingCount} missing, ${field.invalidCount} invalid`,
  );
  const nextSteps = report.safeNextSteps.map((step) => `* ${step}`);

  return [
    "# Manual Upload Validation Report",
    "",
    "## Summary",
    "",
    `* Total rows: ${report.summary.totalRows}`,
    `* Valid rows: ${report.summary.validRows}`,
    `* Rows needing review: ${report.summary.warningRows}`,
    `* Failed rows: ${report.summary.errorRows}`,
    `* Overall status: ${report.status}`,
    "",
    "## Main Issues",
    "",
    ...(mainIssues.length > 0 ? mainIssues : ["1. No major data-quality issue was detected."]),
    "",
    "## Field Coverage",
    "",
    ...coverageLines,
    "",
    "## Module Readiness",
    "",
    moduleLine("Financials", report.moduleReadiness.financials),
    moduleLine("Valuation", report.moduleReadiness.valuation),
    moduleLine("Risk", report.moduleReadiness.risk),
    moduleLine("PVT", report.moduleReadiness.pvt),
    moduleLine("Overview", report.moduleReadiness.overview),
    "",
    "## Recommended Data Fixes",
    "",
    ...nextSteps,
    "",
    "## Scope Note",
    "",
    report.disclaimer,
  ].join("\n");
};
