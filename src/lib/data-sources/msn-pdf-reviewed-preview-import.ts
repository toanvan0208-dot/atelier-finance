import { buildFinancialStatementImportDryRun } from "./financial-statement-import-contract";

export const MSN_PDF_REVIEWED_SOURCE_LABEL =
  "annual_report_2025_pdf_reviewed_preview";
export const MSN_PDF_REVIEWED_DATA_MODE = "research_only";
export const MSN_PDF_REVIEWED_TOTAL_DEBT = 64877.178;

const ALLOWED_VALUE_FIELDS = new Set([
  "eps",
  "sharesOutstanding",
  "totalDebt",
]);

type Phase139KValue = {
  sourceValue?: unknown;
  sourceUnit?: unknown;
  normalizedValue?: unknown;
  normalizedUnit?: unknown;
  conversionRule?: unknown;
  status?: unknown;
  components?: Array<{
    label?: unknown;
    value?: unknown;
    unit?: unknown;
  }>;
};

export type Phase139KImportArtifact = {
  entityIdentity?: {
    status?: unknown;
  };
  dryRunImportCandidate?: {
    ticker?: unknown;
    fiscalYear?: unknown;
    sourceLabel?: unknown;
    dataMode?: unknown;
    productionApproved?: unknown;
    status?: unknown;
    values?: Record<string, Phase139KValue>;
    importReadiness?: unknown;
  };
};

export type ValidatedMsnImport = {
  ticker: "MSN";
  fiscalYear: 2025;
  periodType: "annual";
  sourceLabel: typeof MSN_PDF_REVIEWED_SOURCE_LABEL;
  dataMode: typeof MSN_PDF_REVIEWED_DATA_MODE;
  productionApproved: false;
  eps: 2710;
  epsUnit: "vnd_per_share";
  sharesOutstanding: 1520491927;
  sharesOutstandingUnit: "shares";
  totalDebt: 64877.178;
  totalDebtUnit: "billion_vnd";
};

export type MsnImportValidationResult =
  | {
      ok: true;
      row: ValidatedMsnImport;
      errors: [];
    }
  | {
      ok: false;
      row: null;
      errors: string[];
    };

const finiteNumber = (value: unknown): number | null =>
  typeof value === "number" && Number.isFinite(value) ? value : null;

export function validateMsnPdfReviewedImportArtifact(
  artifact: Phase139KImportArtifact,
): MsnImportValidationResult {
  const errors: string[] = [];
  const candidate = artifact.dryRunImportCandidate;
  const values = candidate?.values ?? {};
  const valueKeys = Object.keys(values);

  if (artifact.entityIdentity?.status !== "valid_msn_consolidated") {
    errors.push("entityStatus must be valid_msn_consolidated.");
  }
  if (candidate?.ticker !== "MSN") {
    errors.push("Only ticker MSN is allowed.");
  }
  if (candidate?.fiscalYear !== 2025) {
    errors.push("Only MSN fiscal year 2025 is allowed.");
  }
  if (candidate?.sourceLabel !== MSN_PDF_REVIEWED_SOURCE_LABEL) {
    errors.push("Invalid sourceLabel.");
  }
  if (candidate?.dataMode !== MSN_PDF_REVIEWED_DATA_MODE) {
    errors.push("dataMode must be research_only.");
  }
  if (candidate?.productionApproved !== false) {
    errors.push("productionApproved must remain false.");
  }
  if (
    candidate?.importReadiness !== "ready_for_future_controlled_import"
  ) {
    errors.push(
      "importReadiness must be ready_for_future_controlled_import.",
    );
  }
  if (
    valueKeys.length !== ALLOWED_VALUE_FIELDS.size ||
    valueKeys.some((field) => !ALLOWED_VALUE_FIELDS.has(field))
  ) {
    errors.push(
      "Only eps, sharesOutstanding, and totalDebt may be imported.",
    );
  }

  const eps = values.eps;
  const shares = values.sharesOutstanding;
  const debt = values.totalDebt;

  if (
    finiteNumber(eps?.normalizedValue) !== 2710 ||
    eps?.normalizedUnit !== "vnd_per_share"
  ) {
    errors.push("EPS must be 2710 vnd_per_share.");
  }
  if (
    finiteNumber(shares?.normalizedValue) !== 1520491927 ||
    shares?.normalizedUnit !== "shares"
  ) {
    errors.push("sharesOutstanding must be 1520491927 shares.");
  }

  const normalizedDebt = finiteNumber(debt?.normalizedValue);
  const sourceDebt = finiteNumber(debt?.sourceValue);
  if (normalizedDebt === 0 || finiteNumber(eps?.normalizedValue) === 0) {
    errors.push("Missing values must not be converted to 0.");
  }
  if (finiteNumber(shares?.normalizedValue) === 0) {
    errors.push("Missing values must not be converted to 0.");
  }
  if (
    normalizedDebt !== MSN_PDF_REVIEWED_TOTAL_DEBT ||
    debt?.normalizedUnit !== "billion_vnd"
  ) {
    errors.push("totalDebt must be 64877.178 billion_vnd.");
  }
  if (normalizedDebt === 64877178 || normalizedDebt !== null && normalizedDebt > 1_000_000) {
    errors.push("Raw million VND magnitude must not be stored as billion_vnd.");
  }
  if (
    sourceDebt !== 64877178 ||
    debt?.sourceUnit !== "million_vnd" ||
    debt?.conversionRule !== "million VND / 1,000"
  ) {
    errors.push("totalDebt source and conversion provenance are invalid.");
  }

  const components = debt?.components ?? [];
  if (
    components.length !== 2 ||
    components.some(
      (component) =>
        finiteNumber(component.value) === null ||
        component.unit !== "million_vnd",
    )
  ) {
    errors.push("Exactly two explicit million-VND debt components are required.");
  } else {
    const labels = components.map((component) =>
      String(component.label ?? "").toLocaleLowerCase("vi"),
    );
    if (
      labels.some(
        (label) =>
          label.includes("tổng nợ phải trả") ||
          label.includes("total liabilities"),
      )
    ) {
      errors.push("totalLiabilities must never map to totalDebt.");
    }
    const componentTotal = components.reduce(
      (sum, component) => sum + (finiteNumber(component.value) ?? 0),
      0,
    );
    if (componentTotal !== 64877178 || componentTotal !== sourceDebt) {
      errors.push("Debt components are missing, duplicated, or double counted.");
    }
  }

  if (errors.length > 0) {
    return { ok: false, row: null, errors: Array.from(new Set(errors)) };
  }

  return {
    ok: true,
    errors: [],
    row: {
      ticker: "MSN",
      fiscalYear: 2025,
      periodType: "annual",
      sourceLabel: MSN_PDF_REVIEWED_SOURCE_LABEL,
      dataMode: MSN_PDF_REVIEWED_DATA_MODE,
      productionApproved: false,
      eps: 2710,
      epsUnit: "vnd_per_share",
      sharesOutstanding: 1520491927,
      sharesOutstandingUnit: "shares",
      totalDebt: MSN_PDF_REVIEWED_TOTAL_DEBT,
      totalDebtUnit: "billion_vnd",
    },
  };
}

export function buildMsnPdfReviewedImportDryRun(
  artifact: Phase139KImportArtifact,
) {
  const validation = validateMsnPdfReviewedImportArtifact(artifact);
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
      sourceLabel: MSN_PDF_REVIEWED_SOURCE_LABEL,
      dataMode: MSN_PDF_REVIEWED_DATA_MODE,
    },
  );

  return { validation, report };
}
