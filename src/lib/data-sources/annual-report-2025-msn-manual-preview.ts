export const MSN_PDF_FILE = "MSN_Baocaothuongnien_2025.pdf";
export const MSN_SOURCE_LABEL = "annual_report_2025_pdf_reviewed_preview";

export type MsnEntityStatus =
  | "valid_msn_consolidated"
  | "needs_review"
  | "invalid_for_msn";

export type MsnPreviewStatus =
  | "preview"
  | "derived_preview"
  | "dry_run_import_candidate"
  | "needs_review"
  | "ambiguous"
  | "missing"
  | "invalid_for_msn";

export type MsnImportReadiness =
  | "ready_for_future_controlled_import"
  | "not_ready_needs_better_provenance"
  | "invalid_source"
  | "partial_only_do_not_import_yet";

export type MsnIdentityEvidence = {
  companyName: string | null;
  ticker: string | null;
  reportTitle: string | null;
  consolidatedTitle: string | null;
  auditor: string | null;
  auditorReportNumber: string | null;
  consolidatedGroupLevel: boolean;
  subsidiaryOnlyRuledOut: boolean;
  status: MsnEntityStatus;
  evidence: Array<{
    pdfPage: number;
    reportPages: string;
    section: string;
    note: string;
  }>;
};

export type MsnFieldPreview = {
  ticker: "MSN";
  pdfFile: string;
  field:
    | "eps"
    | "sharesOutstanding"
    | "totalDebt"
    | "totalAssets"
    | "equity"
    | "revenue"
    | "netIncome";
  value: number | null;
  unit: string | null;
  fiscalYear: 2025;
  sourceLabel: string;
  dataMode: "research_only";
  productionApproved: false;
  status: MsnPreviewStatus;
  pdfPage: number | null;
  reportPages: string | null;
  tableOrSection: string | null;
  fieldLabel: string | null;
  extractionMethod:
    | "manual_visual_review"
    | "derived_from_explicit_debt_lines"
    | "not_found";
  evidenceNote: string;
  caveat: string | null;
};

export type MsnDebtComponent = {
  label: string;
  value: number;
  unit: "million_vnd";
  pdfPage: number;
  reportPages: string;
  tableOrSection: string;
  includedInTotal: boolean;
  note: string;
};

export type MsnDryRunImportCandidate = {
  ticker: "MSN";
  fiscalYear: 2025;
  periodType: "annual";
  sourceLabel: string;
  dataMode: "research_only";
  productionApproved: false;
  status: "dry_run_import_candidate";
  values: {
    eps: number | null;
    epsUnit: "vnd_per_share" | null;
    sharesOutstanding: number | null;
    sharesOutstandingUnit: "shares" | null;
    totalDebt: number | null;
    totalDebtUnit: "billion_vnd" | null;
  };
  conversions: {
    totalDebt: string | null;
  };
  existingRuntime: {
    sourceLabel: "vnstock_financials_candidate";
    eps: 2710;
    sharesOutstanding: 1520491927;
    totalDebt: null;
  };
  collisionAnalysis: string;
  importReadiness: MsnImportReadiness;
};

const REQUIRED_MSN_COMPANY_NAME = "Công ty Cổ phần Tập đoàn Masan";

export function evaluateMsnIdentity(input: {
  companyName?: string | null;
  ticker?: string | null;
  reportTitle?: string | null;
  consolidatedTitle?: string | null;
  auditor?: string | null;
}): MsnEntityStatus {
  const companyName = input.companyName?.toLocaleLowerCase("vi") ?? "";
  const consolidatedTitle = input.consolidatedTitle?.toLocaleLowerCase("vi") ?? "";
  const ticker = input.ticker?.trim().toUpperCase() ?? "";
  const auditor = input.auditor?.toLocaleLowerCase("vi") ?? "";

  const subsidiaryOnly =
    companyName.includes("masan consumer") ||
    companyName.includes("wincommerce") ||
    companyName.includes("techcombank") ||
    ticker === "MCH";

  if (subsidiaryOnly) return "invalid_for_msn";

  const isMasanGroup =
    companyName.includes("tập đoàn masan") ||
    companyName.includes("masan group");
  const isConsolidated =
    consolidatedTitle.includes("hợp nhất") &&
    (consolidatedTitle.includes("các công ty con") ||
      consolidatedTitle.includes("tập đoàn"));
  const hasMsnTicker = ticker === "MSN";
  const hasAuditor = auditor.includes("kpmg");

  return isMasanGroup && isConsolidated && hasMsnTicker && hasAuditor
    ? "valid_msn_consolidated"
    : "needs_review";
}

export function buildMsnIdentityEvidence(): MsnIdentityEvidence {
  const identity: MsnIdentityEvidence = {
    companyName: REQUIRED_MSN_COMPANY_NAME,
    ticker: "MSN",
    reportTitle: "Báo cáo Thường niên 2025",
    consolidatedTitle:
      "Báo cáo tài chính hợp nhất của Công ty Cổ phần Tập đoàn Masan và các công ty con",
    auditor: "Chi nhánh Công ty TNHH KPMG Việt Nam",
    auditorReportNumber: "25-01-01312-26-2",
    consolidatedGroupLevel: true,
    subsidiaryOnlyRuledOut: true,
    status: "needs_review",
    evidence: [
      {
        pdfPage: 62,
        reportPages: "126-127",
        section: "Báo cáo kiểm toán độc lập",
        note: "KPMG addresses Masan Group shareholders and audits the Company and its subsidiaries.",
      },
      {
        pdfPage: 63,
        reportPages: "128-129",
        section: "Bảng cân đối kế toán hợp nhất",
        note: "Statement header names Masan Group Corporation and its subsidiaries.",
      },
      {
        pdfPage: 106,
        reportPages: "214-215",
        section: "Lịch sử Công ty",
        note: "The company history identifies the HOSE stock code as MSN.",
      },
    ],
  };

  identity.status = evaluateMsnIdentity(identity);
  return identity;
}

export function normalizeToBillionVnd(
  value: number | null,
  unit: string | null,
): {
  value: number | null;
  unit: "billion_vnd" | null;
  conversionRule: string | null;
} {
  if (value === null) {
    return { value: null, unit: null, conversionRule: null };
  }

  if (unit === "VND" || unit === "vnd") {
    return {
      value: value / 1_000_000_000,
      unit: "billion_vnd",
      conversionRule: "VND / 1,000,000,000",
    };
  }

  if (unit === "thousand_vnd") {
    return {
      value: value / 1_000_000,
      unit: "billion_vnd",
      conversionRule: "thousand VND / 1,000,000",
    };
  }

  if (unit === "million_vnd") {
    return {
      value: value / 1_000,
      unit: "billion_vnd",
      conversionRule: "million VND / 1,000",
    };
  }

  if (unit === "billion_vnd") {
    return {
      value,
      unit: "billion_vnd",
      conversionRule: "already billion VND",
    };
  }

  return { value: null, unit: null, conversionRule: null };
}

export function deriveTotalDebt(
  components: MsnDebtComponent[],
): {
  value: number | null;
  unit: "million_vnd" | null;
  status: "derived_preview" | "needs_review";
  reason: string;
} {
  const included = components.filter((component) => component.includedInTotal);
  const hasCurrentDebt = included.some((component) =>
    component.label.includes("ngắn hạn"),
  );
  const hasNonCurrentDebt = included.some((component) =>
    component.label.includes("dài hạn"),
  );
  const validProvenance = included.every(
    (component) =>
      component.pdfPage > 0 &&
      component.reportPages.length > 0 &&
      component.tableOrSection.length > 0 &&
      component.unit === "million_vnd",
  );

  if (
    included.length !== 2 ||
    !hasCurrentDebt ||
    !hasNonCurrentDebt ||
    !validProvenance
  ) {
    return {
      value: null,
      unit: null,
      status: "needs_review",
      reason:
        "totalDebt requires exactly one explicit current and one explicit non-current interest-bearing debt line with matching units and provenance.",
    };
  }

  return {
    value: included.reduce((sum, component) => sum + component.value, 0),
    unit: "million_vnd",
    status: "derived_preview",
    reason:
      "Current and non-current balance-sheet debt lines are added once; current maturities already sit inside the current line and are not added again.",
  };
}

export function buildMsnDebtComponents(): MsnDebtComponent[] {
  return [
    {
      label: "Vay, trái phiếu phát hành và nợ thuê tài chính ngắn hạn",
      value: 24330984,
      unit: "million_vnd",
      pdfPage: 64,
      reportPages: "130-131",
      tableOrSection: "Bảng cân đối kế toán hợp nhất - Nguồn vốn",
      includedInTotal: true,
      note: "Explicit current interest-bearing debt line; includes current maturities from Note 20.",
    },
    {
      label: "Vay, trái phiếu phát hành và nợ thuê tài chính dài hạn",
      value: 40546194,
      unit: "million_vnd",
      pdfPage: 64,
      reportPages: "130-131",
      tableOrSection: "Bảng cân đối kế toán hợp nhất - Nguồn vốn",
      includedInTotal: true,
      note: "Explicit non-current interest-bearing debt line after amounts due within 12 months.",
    },
  ];
}

export function buildMsnPreview(
  identity = buildMsnIdentityEvidence(),
): MsnFieldPreview[] {
  if (identity.status !== "valid_msn_consolidated") {
    return [];
  }

  const debt = deriveTotalDebt(buildMsnDebtComponents());

  return [
    {
      ticker: "MSN",
      pdfFile: MSN_PDF_FILE,
      field: "eps",
      value: 2710,
      unit: "vnd_per_share",
      fiscalYear: 2025,
      sourceLabel: MSN_SOURCE_LABEL,
      dataMode: "research_only",
      productionApproved: false,
      status: "preview",
      pdfPage: 102,
      reportPages: "206-207",
      tableOrSection: "Thuyết minh 36(c) - Lãi cơ bản trên cổ phiếu",
      fieldLabel: "Lãi cơ bản trên cổ phiếu",
      extractionMethod: "manual_visual_review",
      evidenceNote:
        "The audited EPS table explicitly reports 2,710 VND for 2025.",
      caveat: null,
    },
    {
      ticker: "MSN",
      pdfFile: MSN_PDF_FILE,
      field: "sharesOutstanding",
      value: 1520491927,
      unit: "shares",
      fiscalYear: 2025,
      sourceLabel: MSN_SOURCE_LABEL,
      dataMode: "research_only",
      productionApproved: false,
      status: "preview",
      pdfPage: 97,
      reportPages: "196-197",
      tableOrSection: "Thuyết minh 23 - Vốn cổ phần và thặng dư vốn cổ phần",
      fieldLabel: "Cổ phiếu đang lưu hành",
      extractionMethod: "manual_visual_review",
      evidenceNote:
        "The audited table explicitly reports 1,520,491,927 outstanding shares at 31 December 2025.",
      caveat:
        "The total comprises 1,445,915,457 ordinary shares and 74,576,470 dividend-preference shares; the EPS weighted-average ordinary-share denominator is separately 1,516,140,129.",
    },
    {
      ticker: "MSN",
      pdfFile: MSN_PDF_FILE,
      field: "totalDebt",
      value: debt.value,
      unit: debt.unit,
      fiscalYear: 2025,
      sourceLabel: MSN_SOURCE_LABEL,
      dataMode: "research_only",
      productionApproved: false,
      status: debt.status,
      pdfPage: debt.value === null ? null : 64,
      reportPages: debt.value === null ? null : "130-131",
      tableOrSection:
        debt.value === null
          ? null
          : "Bảng cân đối kế toán hợp nhất - Nguồn vốn",
      fieldLabel:
        debt.value === null
          ? null
          : "Nợ vay ngắn hạn + nợ vay dài hạn (bao gồm trái phiếu và nợ thuê tài chính)",
      extractionMethod:
        debt.value === null
          ? "not_found"
          : "derived_from_explicit_debt_lines",
      evidenceNote: debt.reason,
      caveat:
        debt.value === null
          ? "Debt provenance is incomplete."
          : "Do not add Note 20 gross bonds, leases, or current maturities again; those amounts are already represented in the two balance-sheet lines.",
    },
    {
      ticker: "MSN",
      pdfFile: MSN_PDF_FILE,
      field: "totalAssets",
      value: 128963171,
      unit: "million_vnd",
      fiscalYear: 2025,
      sourceLabel: MSN_SOURCE_LABEL,
      dataMode: "research_only",
      productionApproved: false,
      status: "preview",
      pdfPage: 63,
      reportPages: "128-129",
      tableOrSection: "Bảng cân đối kế toán hợp nhất - Tài sản",
      fieldLabel: "Tổng tài sản",
      extractionMethod: "manual_visual_review",
      evidenceNote: "The audited balance sheet explicitly reports total assets.",
      caveat: null,
    },
    {
      ticker: "MSN",
      pdfFile: MSN_PDF_FILE,
      field: "equity",
      value: 45078644,
      unit: "million_vnd",
      fiscalYear: 2025,
      sourceLabel: MSN_SOURCE_LABEL,
      dataMode: "research_only",
      productionApproved: false,
      status: "preview",
      pdfPage: 64,
      reportPages: "130-131",
      tableOrSection: "Bảng cân đối kế toán hợp nhất - Nguồn vốn",
      fieldLabel: "Vốn chủ sở hữu",
      extractionMethod: "manual_visual_review",
      evidenceNote: "The audited balance sheet explicitly reports total equity.",
      caveat: null,
    },
    {
      ticker: "MSN",
      pdfFile: MSN_PDF_FILE,
      field: "revenue",
      value: 81621329,
      unit: "million_vnd",
      fiscalYear: 2025,
      sourceLabel: MSN_SOURCE_LABEL,
      dataMode: "research_only",
      productionApproved: false,
      status: "preview",
      pdfPage: 65,
      reportPages: "132-133",
      tableOrSection: "Báo cáo kết quả hoạt động kinh doanh hợp nhất",
      fieldLabel: "Doanh thu thuần",
      extractionMethod: "manual_visual_review",
      evidenceNote: "The audited income statement explicitly reports net revenue.",
      caveat: null,
    },
    {
      ticker: "MSN",
      pdfFile: MSN_PDF_FILE,
      field: "netIncome",
      value: 6763511,
      unit: "million_vnd",
      fiscalYear: 2025,
      sourceLabel: MSN_SOURCE_LABEL,
      dataMode: "research_only",
      productionApproved: false,
      status: "preview",
      pdfPage: 65,
      reportPages: "132-133",
      tableOrSection: "Báo cáo kết quả hoạt động kinh doanh hợp nhất",
      fieldLabel: "Lợi nhuận thuần sau thuế",
      extractionMethod: "manual_visual_review",
      evidenceNote:
        "The audited income statement explicitly reports consolidated profit after tax.",
      caveat:
        "This is consolidated profit after tax, not profit attributable only to owners of the Company.",
    },
  ];
}

export function validateMsnPreview(preview: MsnFieldPreview): string[] {
  const violations: string[] = [];

  if (preview.ticker !== "MSN") {
    violations.push("MSN-only restriction blocks other tickers.");
  }
  if (preview.productionApproved !== false) {
    violations.push("productionApproved must remain false.");
  }
  if (
    preview.value !== null &&
    (!preview.pdfPage ||
      !preview.reportPages ||
      !preview.tableOrSection ||
      !preview.fieldLabel)
  ) {
    violations.push("Non-null values require page, section, and field provenance.");
  }
  if (
    preview.field === "eps" &&
    preview.value !== null &&
    preview.unit !== "vnd_per_share"
  ) {
    violations.push("EPS must use vnd_per_share.");
  }
  if (
    preview.field === "sharesOutstanding" &&
    preview.value !== null &&
    preview.unit !== "shares"
  ) {
    violations.push("sharesOutstanding must use shares.");
  }
  if (
    preview.field === "totalDebt" &&
    preview.fieldLabel?.toLocaleLowerCase("vi").includes("tổng nợ phải trả")
  ) {
    violations.push("totalLiabilities must never map to totalDebt.");
  }
  if (preview.status === "missing" && preview.value === 0) {
    violations.push("Missing values must remain null, never 0.");
  }

  return violations;
}

export function buildMsnDryRunImportCandidate(
  identity = buildMsnIdentityEvidence(),
  previews = buildMsnPreview(identity),
): MsnDryRunImportCandidate | null {
  if (identity.status !== "valid_msn_consolidated") return null;

  const eps = previews.find((preview) => preview.field === "eps");
  const shares = previews.find(
    (preview) => preview.field === "sharesOutstanding",
  );
  const debt = previews.find((preview) => preview.field === "totalDebt");
  const normalizedDebt = normalizeToBillionVnd(
    debt?.value ?? null,
    debt?.unit ?? null,
  );

  const epsReady =
    eps?.value !== null &&
    eps?.unit === "vnd_per_share" &&
    validateMsnPreview(eps).length === 0;
  const sharesReady =
    shares?.value !== null &&
    shares?.unit === "shares" &&
    validateMsnPreview(shares).length === 0;
  const debtReady =
    debt?.value !== null &&
    debt?.status === "derived_preview" &&
    normalizedDebt.value !== null &&
    validateMsnPreview(debt).length === 0;

  let importReadiness: MsnImportReadiness =
    "not_ready_needs_better_provenance";
  if (epsReady && sharesReady && debtReady) {
    importReadiness = "ready_for_future_controlled_import";
  } else if (epsReady || sharesReady || debtReady) {
    importReadiness = "partial_only_do_not_import_yet";
  }

  return {
    ticker: "MSN",
    fiscalYear: 2025,
    periodType: "annual",
    sourceLabel: MSN_SOURCE_LABEL,
    dataMode: "research_only",
    productionApproved: false,
    status: "dry_run_import_candidate",
    values: {
      eps: epsReady ? eps?.value ?? null : null,
      epsUnit: epsReady ? "vnd_per_share" : null,
      sharesOutstanding: sharesReady ? shares?.value ?? null : null,
      sharesOutstandingUnit: sharesReady ? "shares" : null,
      totalDebt: debtReady ? normalizedDebt.value : null,
      totalDebtUnit: debtReady ? "billion_vnd" : null,
    },
    conversions: {
      totalDebt: debtReady ? normalizedDebt.conversionRule : null,
    },
    existingRuntime: {
      sourceLabel: "vnstock_financials_candidate",
      eps: 2710,
      sharesOutstanding: 1520491927,
      totalDebt: null,
    },
    collisionAnalysis:
      "A future controlled import should create a parallel annual_report_2025_pdf_reviewed_preview row. It must not overwrite the existing vnstock_financials_candidate row and this phase does not change runtime priority.",
    importReadiness,
  };
}
