import type {
  DataSourceMetadata,
  FinancialStatementRecord,
  MarketDataRecord,
  ReadinessStatus,
  ValuationInputRecord,
} from "../data-contract";
import {
  bridgeFinancialsContract,
  bridgeValuationContract,
  type FinancialsBridgeOutput,
  type ValuationBridgeOutput,
} from "../data-contract";
import {
  buildManualUploadValidationReport,
  formatManualUploadValidationReport,
  type ManualUploadValidationReport,
} from "./manual-upload-report";
import {
  normalizeManualUpload,
  type ManualUploadAdapterResult,
  type ManualUploadInput,
  type ManualUploadRowResult,
} from "./manual-upload-adapter";
import type { AdapterWarning, SourceUsageMode } from "./types";

export type ManualUploadPreviewModule = "financials" | "valuation";
export type ManualUploadPreviewStatus =
  | ReadinessStatus
  | "failed";

export type ManualUploadPreviewInput = ManualUploadInput & {
  options?: {
    mode: Exclude<SourceUsageMode, "production">;
    targetTicker?: string;
    targetPeriod?: string;
    allowedModules?: ManualUploadPreviewModule[];
    strict?: boolean;
  };
};

export type ManualUploadSelectedRecord = {
  rowIndex: number;
  financialStatement: FinancialStatementRecord | null;
  marketData: MarketDataRecord | null;
  valuationInput: ValuationInputRecord | null;
};

export type ManualUploadAvailableRecord = {
  rowIndex: number;
  ticker: string | null;
  period: string | null;
  asOf: string | null;
  readiness: ReadinessStatus;
};

export type ManualUploadModulePreview<T> = {
  input: T | null;
  readiness: ManualUploadPreviewStatus;
  warnings: AdapterWarning[];
  blockedReasons: string[];
};

export type ManualUploadPreviewResult = {
  status: ManualUploadPreviewStatus;
  adapterResult: ManualUploadAdapterResult;
  report: ManualUploadValidationReport;
  markdownReport: string;
  selectedRecord: ManualUploadSelectedRecord | null;
  availableRecords: ManualUploadAvailableRecord[];
  financialsPreview: ManualUploadModulePreview<FinancialsBridgeOutput>;
  valuationPreview: ManualUploadModulePreview<ValuationBridgeOutput>;
  metadata: DataSourceMetadata | null;
  diagnostics: {
    rowCount: number;
    selectedRowIndex: number | null;
    unmatchedTargetReason: string | null;
    moduleReadiness: ManualUploadValidationReport["moduleReadiness"];
    safeNextSteps: string[];
  };
};

const warning = (code: string, message: string, field?: string): AdapterWarning => ({
  code,
  message,
  field,
});

const recordTicker = (row: ManualUploadRowResult): string | null =>
  row.financialStatement?.ticker ?? row.marketData?.ticker ?? row.valuationInput?.ticker ?? null;

const recordPeriod = (row: ManualUploadRowResult): string | null =>
  row.financialStatement?.metadata.period?.value ??
  row.marketData?.metadata.period?.value ??
  row.valuationInput?.metadata.period?.value ??
  null;

const recordAsOf = (row: ManualUploadRowResult): string | null =>
  row.financialStatement?.metadata.asOf ??
  row.marketData?.metadata.asOf ??
  row.valuationInput?.metadata.asOf ??
  null;

const isSelectableRow = (row: ManualUploadRowResult): boolean =>
  row.errors.length === 0 &&
  Boolean(row.financialStatement || row.marketData || row.valuationInput);

const availableRecord = (row: ManualUploadRowResult): ManualUploadAvailableRecord => ({
  rowIndex: row.rowIndex,
  ticker: recordTicker(row),
  period: recordPeriod(row),
  asOf: recordAsOf(row),
  readiness: row.readiness,
});

const latestByAsOf = (rows: ManualUploadRowResult[]): ManualUploadRowResult | null => {
  const dated = rows
    .map((row) => ({ row, time: Date.parse(recordAsOf(row) ?? "") }))
    .filter((entry) => Number.isFinite(entry.time))
    .sort((a, b) => b.time - a.time);

  if (dated.length !== rows.length || dated.length === 0) return null;
  if (dated.length > 1 && dated[0].time === dated[1].time) return null;
  return dated[0].row;
};

const selectRow = ({
  rows,
  targetTicker,
  targetPeriod,
}: {
  rows: ManualUploadRowResult[];
  targetTicker?: string;
  targetPeriod?: string;
}): {
  row: ManualUploadRowResult | null;
  warnings: AdapterWarning[];
  unmatchedTargetReason: string | null;
} => {
  const selectable = rows.filter(isSelectableRow);
  const warnings: AdapterWarning[] = [];

  if (selectable.length === 0) {
    return {
      row: null,
      warnings,
      unmatchedTargetReason: "No valid canonical record is available for preview.",
    };
  }

  if (targetTicker && targetPeriod) {
    const matches = selectable.filter((row) =>
      recordTicker(row)?.toUpperCase() === targetTicker.toUpperCase() &&
      recordPeriod(row) === targetPeriod,
    );
    if (matches.length === 0) {
      return {
        row: null,
        warnings,
        unmatchedTargetReason: `No record matches ticker ${targetTicker} and period ${targetPeriod}.`,
      };
    }
    if (matches.length > 1) {
      warnings.push(warning("DUPLICATE_TARGET_MATCH", "Multiple rows match the requested ticker and period; first match selected."));
    }
    return { row: matches[0], warnings, unmatchedTargetReason: null };
  }

  if (targetTicker) {
    const matches = selectable.filter((row) => recordTicker(row)?.toUpperCase() === targetTicker.toUpperCase());
    if (matches.length === 0) {
      return {
        row: null,
        warnings,
        unmatchedTargetReason: `No record matches ticker ${targetTicker}.`,
      };
    }
    if (matches.length === 1) return { row: matches[0], warnings, unmatchedTargetReason: null };

    const latest = latestByAsOf(matches);
    if (!latest) {
      return {
        row: null,
        warnings: [warning("TARGET_PERIOD_REQUIRED", "Multiple rows match ticker; select a period to avoid an unsafe choice.")],
        unmatchedTargetReason: "Multiple rows match ticker and latest record cannot be determined safely.",
      };
    }
    warnings.push(warning("LATEST_BY_AS_OF_SELECTED", "Multiple ticker matches found; selected latest row by asOf."));
    return { row: latest, warnings, unmatchedTargetReason: null };
  }

  if (selectable.length === 1) {
    return { row: selectable[0], warnings, unmatchedTargetReason: null };
  }

  return {
    row: null,
    warnings: [warning("TARGET_REQUIRED", "Multiple valid records are available; select ticker and period before preview.")],
    unmatchedTargetReason: "Multiple valid records are available and no target was provided.",
  };
};

const selectedRecordFromRow = (row: ManualUploadRowResult): ManualUploadSelectedRecord => ({
  rowIndex: row.rowIndex,
  financialStatement: row.financialStatement,
  marketData: row.marketData,
  valuationInput: row.valuationInput,
});

const previewStatus = ({
  report,
  selectedRow,
  selectionReason,
  warnings,
}: {
  report: ManualUploadValidationReport;
  selectedRow: ManualUploadRowResult | null;
  selectionReason: string | null;
  warnings: AdapterWarning[];
}): ManualUploadPreviewStatus => {
  if (report.status === "failed" || report.severityCounts.critical > 0) return "failed";
  if (!selectedRow) return warnings.length > 0 ? "needs_review" : selectionReason ? "not_ready" : "failed";
  if (selectedRow.errors.length > 0 || selectedRow.readiness === "not_ready") return "not_ready";
  if (report.categoryCounts.non_vnd_currency > 0) return "needs_review";
  if (selectedRow.readiness === "insufficient_data") return "insufficient_data";
  if (warnings.length > 0 || selectedRow.warnings.length > 0 || report.status === "needs_review") return "needs_review";
  return "ready";
};

const buildFinancialsPreview = (
  row: ManualUploadRowResult | null,
  enabled: boolean,
): ManualUploadModulePreview<FinancialsBridgeOutput> => {
  if (!enabled) {
    return { input: null, readiness: "unknown", warnings: [], blockedReasons: ["Financials preview is not enabled."] };
  }
  if (!row?.financialStatement) {
    return { input: null, readiness: "not_ready", warnings: [], blockedReasons: ["No financial statement record selected."] };
  }

  const bridge = bridgeFinancialsContract({
    statement: row.financialStatement,
    market: row.marketData ?? undefined,
  });
  const warnings: AdapterWarning[] = [...bridge.warnings];
  const blockedReasons: string[] = [];

  if (row.financialStatement.operatingCashFlow === null) {
    warnings.push(warning("OPERATING_CASH_FLOW_MISSING", "operatingCashFlow is missing; cash-flow quality preview needs review.", "operatingCashFlow"));
  }
  if ((row.financialStatement.totalAssets ?? 0) <= 0) {
    blockedReasons.push("totalAssets is missing or not positive, so ROA/CFOA cannot be calculated.");
  }
  if (row.financialStatement.companyType === "bank" || row.financialStatement.companyType === "securities" || row.financialStatement.companyType === "insurance") {
    warnings.push(warning("FINANCIAL_SECTOR_CAVEAT", "Financial-sector companies need sector-specific current ratio and debt-to-equity interpretation.", "companyType"));
  }

  return {
    input: bridge,
    readiness: blockedReasons.length > 0 ? "insufficient_data" : warnings.length > 0 ? "needs_review" : bridge.readiness,
    warnings,
    blockedReasons,
  };
};

const buildValuationPreview = (
  row: ManualUploadRowResult | null,
  enabled: boolean,
): ManualUploadModulePreview<ValuationBridgeOutput> => {
  if (!enabled) {
    return { input: null, readiness: "unknown", warnings: [], blockedReasons: ["Valuation preview is not enabled."] };
  }
  if (!row?.financialStatement || !row.marketData || !row.valuationInput) {
    return { input: null, readiness: "not_ready", warnings: [], blockedReasons: ["Financial, market, and valuation input records are required."] };
  }

  const bridge = bridgeValuationContract({
    statement: row.financialStatement,
    market: row.marketData,
    valuation: row.valuationInput,
  });
  const warnings: AdapterWarning[] = [...bridge.warnings];
  const blockedReasons: string[] = [];

  if (!row.marketData.closePrice || row.marketData.closePrice <= 0) {
    blockedReasons.push("closePrice is missing or not positive, so valuation preview is not ready.");
  }
  if (!row.valuationInput.sharesOutstanding || row.valuationInput.sharesOutstanding <= 0) {
    warnings.push(warning("SHARES_OUTSTANDING_MISSING", "sharesOutstanding is missing or not positive; marketCap must not be derived.", "sharesOutstanding"));
  }
  if ((row.valuationInput.eps ?? 1) <= 0) {
    warnings.push(warning("EPS_NOT_POSITIVE", "EPS is zero or negative; P/E is not applicable.", "eps"));
  }
  if ((row.financialStatement.equity ?? 1) <= 0) {
    warnings.push(warning("EQUITY_NOT_POSITIVE", "Equity is zero or negative; ROE, P/B, and BVPS are not applicable for normal interpretation.", "equity"));
  }

  return {
    input: bridge,
    readiness: blockedReasons.length > 0 ? "not_ready" : warnings.length > 0 ? "needs_review" : bridge.readiness,
    warnings,
    blockedReasons,
  };
};

export const buildManualUploadPreview = (
  input: ManualUploadPreviewInput,
): ManualUploadPreviewResult => {
  const { options } = input;
  const allowedModules = options?.allowedModules ?? ["financials", "valuation"];
  const adapterInput: ManualUploadInput = input.kind === "csv"
    ? { kind: "csv", csvText: input.csvText, batch: input.batch }
    : { kind: "rows", rows: input.rows, batch: input.batch };
  const adapterResult = normalizeManualUpload(adapterInput);
  const report = buildManualUploadValidationReport(adapterResult);
  const markdownReport = formatManualUploadValidationReport(report);
  const selection = selectRow({
    rows: adapterResult.rowResults,
    targetTicker: options?.targetTicker,
    targetPeriod: options?.targetPeriod,
  });
  const selectedRecord = selection.row ? selectedRecordFromRow(selection.row) : null;
  const financialsPreview = buildFinancialsPreview(selection.row, allowedModules.includes("financials"));
  const valuationPreview = buildValuationPreview(selection.row, allowedModules.includes("valuation"));
  const status = previewStatus({
    report,
    selectedRow: selection.row,
    selectionReason: selection.unmatchedTargetReason,
    warnings: selection.warnings,
  });
  const allWarnings = [...selection.warnings];

  return {
    status,
    adapterResult,
    report,
    markdownReport,
    selectedRecord,
    availableRecords: adapterResult.rowResults.filter(isSelectableRow).map(availableRecord),
    financialsPreview: {
      ...financialsPreview,
      warnings: [...financialsPreview.warnings, ...allWarnings],
    },
    valuationPreview: {
      ...valuationPreview,
      warnings: [...valuationPreview.warnings, ...allWarnings],
    },
    metadata:
      selectedRecord?.financialStatement?.metadata ??
      selectedRecord?.marketData?.metadata ??
      selectedRecord?.valuationInput?.metadata ??
      null,
    diagnostics: {
      rowCount: adapterResult.summary.totalRows,
      selectedRowIndex: selection.row?.rowIndex ?? null,
      unmatchedTargetReason: selection.unmatchedTargetReason,
      moduleReadiness: report.moduleReadiness,
      safeNextSteps: report.safeNextSteps,
    },
  };
};
