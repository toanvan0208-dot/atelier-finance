import { buildFinancialStatementImportDryRun } from "./financial-statement-import-contract";

export const MWG_PDF_REVIEWED_SOURCE_LABEL =
  "annual_report_2025_pdf_reviewed_preview";
export const MWG_PDF_REVIEWED_DATA_MODE = "research_only";
export const MWG_PDF_REVIEWED_TOTAL_DEBT = 29930.943;



type Phase140FValue = {
  value?: unknown;
  unit?: unknown;
  provenance?: unknown;
  conversion?: unknown;
  status?: unknown;
  confidence?: unknown;
};

export type Phase140FImportArtifact = {
  ticker?: unknown;
  sourceLabel?: unknown;
  dataMode?: unknown;
  productionApproved?: unknown;
  entityStatus?: unknown;
  importReadiness?: unknown;
  epsPreview?: Phase140FValue;
  sharesOutstandingPreview?: Phase140FValue;
  totalDebtPreview?: Phase140FValue;
  financials?: Record<string, Phase140FValue>; // for test mock
};

export type ValidatedMwgImport = {
  ticker: "MWG";
  fiscalYear: 2025;
  periodType: "annual";
  sourceLabel: typeof MWG_PDF_REVIEWED_SOURCE_LABEL;
  dataMode: typeof MWG_PDF_REVIEWED_DATA_MODE;
  productionApproved: false;
  eps: 4774;
  epsUnit: "vnd_per_share";
  sharesOutstanding: 1468456763;
  sharesOutstandingUnit: "shares";
  totalDebt: 29930.943;
  totalDebtUnit: "billion_vnd";
};

export type MwgImportValidationResult =
  | {
      ok: true;
      row: ValidatedMwgImport;
      errors: [];
    }
  | {
      ok: false;
      row: null;
      errors: string[];
    };

const finiteNumber = (value: unknown): number | null =>
  typeof value === "number" && Number.isFinite(value) ? value : null;

export function validateMwgPdfReviewedImportArtifact(
  artifact: Phase140FImportArtifact,
): MwgImportValidationResult {
  const errors: string[] = [];

  if (!String(artifact.entityStatus).includes("Công ty Cổ phần Đầu tư Thế Giới Di Động")) {
    errors.push("entityStatus must refer to Công ty Cổ phần Đầu tư Thế Giới Di Động.");
  }
  if (artifact.ticker !== "MWG") {
    errors.push("Only ticker MWG is allowed.");
  }
  if (artifact.sourceLabel !== MWG_PDF_REVIEWED_SOURCE_LABEL) {
    errors.push("Invalid source.");
  }
  if (artifact.dataMode !== MWG_PDF_REVIEWED_DATA_MODE) {
    errors.push("dataMode must be research_only.");
  }
  if (artifact.productionApproved !== false) {
    errors.push("productionApproved must remain false.");
  }
  if (artifact.importReadiness !== "ready_for_future_controlled_import") {
    errors.push("importReadiness must be ready_for_future_controlled_import.");
  }
  
  const eps = artifact.epsPreview ?? artifact.financials?.EPS;
  const shares = artifact.sharesOutstandingPreview ?? artifact.financials?.sharesOutstanding;
  const debt = artifact.totalDebtPreview ?? artifact.financials?.totalDebt;
  
  if (!eps || !shares || !debt) {
    errors.push("Only EPS, sharesOutstanding, and totalDebt may be imported.");
  }
  
  if (artifact.financials) {
    const keys = Object.keys(artifact.financials);
    const allowed = new Set(["EPS", "sharesOutstanding", "totalDebt"]);
    if (keys.length > 3 || keys.some(k => !allowed.has(k))) {
      errors.push("Only EPS, sharesOutstanding, and totalDebt may be imported.");
    }
  }

  if (
    finiteNumber(eps?.value) !== 4774 ||
    eps?.unit !== "vnd_per_share"
  ) {
    errors.push("EPS must be 4774 vnd_per_share.");
  }
  if (
    finiteNumber(shares?.value) !== 1468456763 ||
    shares?.unit !== "shares"
  ) {
    errors.push("sharesOutstanding must be 1468456763 shares.");
  }

  const normalizedDebt = finiteNumber(debt?.value);
  if (normalizedDebt === 0 || finiteNumber(eps?.value) === 0 || finiteNumber(shares?.value) === 0) {
    errors.push("Missing values must not be converted to 0.");
  }
  if (
    normalizedDebt !== MWG_PDF_REVIEWED_TOTAL_DEBT ||
    debt?.unit !== "billion_vnd"
  ) {
    errors.push("totalDebt must be 29930.943 billion_vnd.");
  }
  if (normalizedDebt === 29930942961668 || (normalizedDebt !== null && normalizedDebt > 1_000_000)) {
    errors.push("Raw VND magnitude must not be stored as billion_vnd.");
  }
  
  const provenanceStr = String(debt?.provenance).toLowerCase();
  if (provenanceStr.includes("total liabilities") || provenanceStr.includes("tổng nợ phải trả") || provenanceStr.includes("accounts payable") || provenanceStr.includes("phải trả người bán")) {
    errors.push("totalLiabilities or accounts payable must never map to totalDebt.");
  }

  if (errors.length > 0) {
    return { ok: false, row: null, errors: Array.from(new Set(errors)) };
  }

  return {
    ok: true,
    errors: [],
    row: {
      ticker: "MWG",
      fiscalYear: 2025,
      periodType: "annual",
      sourceLabel: MWG_PDF_REVIEWED_SOURCE_LABEL,
      dataMode: MWG_PDF_REVIEWED_DATA_MODE,
      productionApproved: false,
      eps: 4774,
      epsUnit: "vnd_per_share",
      sharesOutstanding: 1468456763,
      sharesOutstandingUnit: "shares",
      totalDebt: MWG_PDF_REVIEWED_TOTAL_DEBT,
      totalDebtUnit: "billion_vnd",
    },
  };
}

export function buildMwgPdfReviewedImportDryRun(
  artifact: Phase140FImportArtifact,
) {
  const validation = validateMwgPdfReviewedImportArtifact(artifact);
  if (!validation.ok) {
    return {
      validation,
      report: null,
    };
  }

  const row = validation.row;
  const report = buildFinancialStatementImportDryRun(
    [
      {
        ticker: row.ticker,
        fiscalYear: row.fiscalYear,
        periodType: row.periodType,
        eps: row.eps,
        epsUnit: row.epsUnit,
        sharesOutstanding: row.sharesOutstanding,
        sharesOutstandingUnit: row.sharesOutstandingUnit,
        totalDebt: row.totalDebt,
        totalDebtUnit: row.totalDebtUnit,
        sourceLabel: row.sourceLabel,
        dataMode: row.dataMode,
        productionApproved: false,
      },
    ],
    {
      sourceLabel: MWG_PDF_REVIEWED_SOURCE_LABEL,
      dataMode: MWG_PDF_REVIEWED_DATA_MODE,
    },
  );

  return { validation, report };
}
