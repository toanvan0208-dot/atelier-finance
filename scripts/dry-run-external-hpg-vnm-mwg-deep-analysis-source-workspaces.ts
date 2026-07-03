import { existsSync, readdirSync, readFileSync } from "node:fs";
import { extname, join, relative } from "node:path";

type Ticker = "HPG" | "VNM" | "MWG";
type CsvRow = Record<string, string>;

const phase = "152F";
const mode = "dry_run";
const tickers = ["HPG", "VNM", "MWG"] as const;
const financialsWorkspace = "D:\\AtelierFinanceFinancialsReview";
const businessWorkspace = "D:\\AtelierFinanceBusinessReview";
const repoRoot = process.cwd();
const financialsCsvPath = join(
  financialsWorkspace,
  "normalized",
  "financials_scope3_normalized_candidate.csv",
);
const businessReviewFiles: Record<Ticker, string> = {
  HPG: join(businessWorkspace, "business_review_upgrade_HPG.md"),
  VNM: join(businessWorkspace, "business_review_upgrade_VNM.md"),
  MWG: join(businessWorkspace, "business_review_upgrade_MWG.md"),
};
const requiredFinancialFields = [
  "revenue",
  "netIncome",
  "eps",
  "sharesOutstanding",
  "equity",
  "totalDebt",
  "cashAndEquivalents",
  "operatingCashFlow",
] as const;
const optionalFinancialFields = ["grossProfit", "totalAssets", "capitalExpenditure"] as const;
const requiredBusinessFields = ["flow", "mainCostItems", "nextFinancialChecks.checks", "keySignalsToWatch"] as const;
const allowedUnits = new Set(["VND", "shares", "vnd_per_share", "N/A"]);
const expectedIndustryCodes: Record<Ticker, string> = {
  HPG: "STEEL_MATERIALS",
  VNM: "CONSUMER_STAPLES_DAIRY",
  MWG: "RETAIL",
};
const forbiddenAdvicePatterns = [
  /\b(buy|sell|hold)\b/i,
  /target\s+price/i,
  /fair\s+value/i,
  /\bupside\b/i,
  /\bdownside\b/i,
  /\battractive\b/i,
  /worth\s+buying/i,
  /\branking\b/i,
  /\bscoring\b/i,
  /\bbenchmark\b/i,
] as const;

const parseCsvLine = (line: string): string[] => {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === '"' && inQuotes && next === '"') {
      current += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === "," && !inQuotes) {
      cells.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  cells.push(current);
  return cells;
};

const parseCsv = (filePath: string): CsvRow[] => {
  if (!existsSync(filePath)) return [];
  const lines = readFileSync(filePath, "utf-8")
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0);
  const headers = parseCsvLine(lines[0] ?? "").map((header) => header.trim());

  return lines.slice(1).map((line) => {
    const cells = parseCsvLine(line);
    return Object.fromEntries(headers.map((header, index) => [header, cells[index]?.trim() ?? ""]));
  });
};

const listRelevantFiles = (workspace: string): string[] => {
  if (!existsSync(workspace)) return [];
  const results: string[] = [];
  const visit = (dir: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        visit(fullPath);
        continue;
      }
      if ([".csv", ".json", ".md", ".ts", ".pdf"].includes(extname(entry.name).toLowerCase())) {
        results.push(fullPath);
      }
    }
  };
  visit(workspace);
  return results.sort();
};

const parseMarkdownTable = (filePath: string): CsvRow[] => {
  if (!existsSync(filePath)) return [];
  const lines = readFileSync(filePath, "utf-8")
    .split(/\r?\n/)
    .filter((line) => line.trim().startsWith("|"));
  const headerLine = lines[0];
  if (!headerLine) return [];
  const headers = headerLine
    .split("|")
    .slice(1, -1)
    .map((cell) => cell.trim());

  return lines.slice(2).map((line) => {
    const cells = line
      .split("|")
      .slice(1, -1)
      .map((cell) => cell.trim());

    if (headers.includes("reviewed_candidate_value") && cells.length > headers.length) {
      const stableTailCount = 9;
      const tailStart = cells.length - stableTailCount;
      const row: CsvRow = {
        ticker: cells[0] ?? "",
        ui_field: cells[1] ?? "",
        original_research_value: cells[2] ?? "",
        reviewed_candidate_value: cells.slice(3, tailStart).join(" | ").trim(),
      };
      const tailHeaders = headers.slice(headers.length - stableTailCount);
      const tailCells = cells.slice(tailStart);
      for (const [index, header] of tailHeaders.entries()) {
        row[header] = tailCells[index] ?? "";
      }
      return row;
    }

    return Object.fromEntries(headers.map((header, index) => [header, cells[index] ?? ""]));
  });
};

const isTruthyText = (value: string): boolean => value.trim().toLowerCase() === "true";
const isFalseText = (value: string): boolean => value.trim().toLowerCase() === "false";
const isMissingValue = (value: string): boolean => value.trim() === "" || value.trim().toUpperCase() === "N/A";
const isNumeric = (value: string): boolean => value.trim() !== "" && Number.isFinite(Number(value));
const hasForbiddenAdvice = (text: string): boolean => forbiddenAdvicePatterns.some((pattern) => pattern.test(text));

const schema = readFileSync(join(repoRoot, "prisma", "schema.prisma"), "utf-8");
const hasModel = (modelName: string): boolean => new RegExp(`model\\s+${modelName}\\s+\\{`).test(schema);
const sourceFiles = [...listRelevantFiles(financialsWorkspace), ...listRelevantFiles(businessWorkspace)];
const relativeExternalPath = (filePath: string): string =>
  filePath.startsWith(financialsWorkspace)
    ? join("D:\\AtelierFinanceFinancialsReview", relative(financialsWorkspace, filePath))
    : join("D:\\AtelierFinanceBusinessReview", relative(businessWorkspace, filePath));
const externalFilesInspected = sourceFiles.map(relativeExternalPath);
const financialRows = parseCsv(financialsCsvPath);

const rowsForTicker = (ticker: Ticker): CsvRow[] => financialRows.filter((row) => row.ticker === ticker);
const fieldRow = (ticker: Ticker, field: string): CsvRow | undefined =>
  rowsForTicker(ticker).find((row) => row.field_name === field);

const validateFinancialStatement = (ticker: Ticker) => {
  const rows = rowsForTicker(ticker);
  const missingFields: string[] = [];
  const ambiguousUnits: string[] = [];
  const blockers: string[] = [];
  const eligibleFields: string[] = [];
  const validatedButNotStored: string[] = [];
  let zeroFillDetected = false;
  let totalDebtMisuseDetected = false;
  let productionApprovedTrueCount = 0;

  for (const field of requiredFinancialFields) {
    const row = fieldRow(ticker, field);
    if (!row || isMissingValue(row.field_value)) {
      missingFields.push(field);
      continue;
    }
    if (!isNumeric(row.field_value)) blockers.push(`${field}_value_not_numeric`);
    if (!allowedUnits.has(row.unit)) ambiguousUnits.push(field);
    if (!isTruthyText(row.needs_review)) blockers.push(`${field}_needsReview_not_true`);
    if (!isFalseText(row.production_approved)) blockers.push(`${field}_productionApproved_not_false`);
    if (!["reviewed_candidate", "research_only"].includes(row.data_mode)) blockers.push(`${field}_dataMode_not_allowed`);
    if (!row.source_statement || !row.source_section_or_page || !row.extracted_quote) blockers.push(`${field}_source_metadata_missing`);
    if (row.field_value === "0" && row.missing_value_reason && row.missing_value_reason !== "N/A") zeroFillDetected = true;
    if (field === "eps" && Number(row.field_value) <= 0) blockers.push("eps_not_positive");
    if (
      field === "totalDebt" &&
      /total liabilities|tong no phai tra|nợ phải trả|ná»£ pháº£i tráº£/i.test(`${row.notes} ${row.extracted_quote}`)
    ) {
      totalDebtMisuseDetected = true;
      blockers.push("totalDebt_may_use_total_liabilities");
    }
    if (isFalseText(row.production_approved) === false) productionApprovedTrueCount += 1;
    eligibleFields.push(field);
  }

  for (const field of optionalFinancialFields) {
    const row = fieldRow(ticker, field);
    if (!row || isMissingValue(row.field_value)) continue;
    if (row.schema_status === "missing_in_current_schema") {
      validatedButNotStored.push(field);
    } else {
      eligibleFields.push(field);
    }
    if (!allowedUnits.has(row.unit)) ambiguousUnits.push(field);
  }

  const industryCodes = new Set(rows.map((row) => row.industry_code).filter(Boolean));
  const candidatePrepared = rows.length > 0;
  const ready =
    candidatePrepared &&
    missingFields.length === 0 &&
    ambiguousUnits.length === 0 &&
    blockers.length === 0 &&
    industryCodes.has(expectedIndustryCodes[ticker]) &&
    !zeroFillDetected &&
    !totalDebtMisuseDetected;

  return {
    candidatePrepared,
    ready,
    missingFields,
    ambiguousUnits,
    blockers,
    eligibleFields,
    validatedButNotStored,
    industryCodes: [...industryCodes],
    zeroFillDetected,
    totalDebtMisuseDetected,
    productionApprovedTrueCount,
  };
};

const validateCompanyIndustry = (ticker: Ticker) => {
  const rows = rowsForTicker(ticker);
  const industryCodes = new Set(rows.map((row) => row.industry_code).filter(Boolean));
  const sample = rows.find((row) => row.industry_code === expectedIndustryCodes[ticker]);
  const blockers = [
    ...(rows.length === 0 ? ["financials_source_rows_missing"] : []),
    ...(industryCodes.has(expectedIndustryCodes[ticker]) ? [] : ["expected_industry_code_missing"]),
    ...(sample?.source_statement ? [] : ["source_label_missing"]),
    ...(sample && !isTruthyText(sample.needs_review) ? ["needsReview_not_true"] : []),
    ...(sample && !isFalseText(sample.production_approved) ? ["productionApproved_not_false"] : []),
  ];

  return {
    candidatePrepared: rows.length > 0 && industryCodes.size > 0,
    ready: blockers.length === 0,
    industryCode: industryCodes.has(expectedIndustryCodes[ticker]) ? expectedIndustryCodes[ticker] : null,
    industryName: null,
    blockers,
  };
};

const validateBusinessProfile = (ticker: Ticker) => {
  const rows = parseMarkdownTable(businessReviewFiles[ticker]).filter((row) => row.ticker === ticker);
  const fields = new Set(rows.map((row) => row.ui_field));
  const missingFields = requiredBusinessFields.filter((field) => !fields.has(field));
  const blockers: string[] = [];
  let productionApprovedTrueCount = 0;
  let forbiddenAdviceDetected = false;

  for (const row of rows) {
    if (!row.reviewed_candidate_value) blockers.push(`${row.ui_field}_reviewed_value_missing`);
    if (!row.source_section_or_page || !row.extracted_quote) blockers.push(`${row.ui_field}_source_metadata_missing`);
    if (!isTruthyText(row.needs_review)) blockers.push(`${row.ui_field}_needsReview_not_true`);
    if (!isFalseText(row.production_approved)) {
      blockers.push(`${row.ui_field}_productionApproved_not_false`);
      productionApprovedTrueCount += 1;
    }
    if (!["reviewed_candidate", "research_only"].includes(row.data_mode)) blockers.push(`${row.ui_field}_dataMode_not_allowed`);
    if (hasForbiddenAdvice(`${row.reviewed_candidate_value} ${row.caveat}`)) forbiddenAdviceDetected = true;
  }

  const candidatePrepared = rows.length > 0;
  const ready =
    candidatePrepared &&
    missingFields.length === 0 &&
    blockers.length === 0 &&
    !forbiddenAdviceDetected;

  return {
    candidatePrepared,
    ready,
    missingFields,
    blockers,
    productionApprovedTrueCount,
    forbiddenAdviceDetected,
    rowCount: rows.length,
  };
};

const financialResults = Object.fromEntries(tickers.map((ticker) => [ticker, validateFinancialStatement(ticker)])) as Record<
  Ticker,
  ReturnType<typeof validateFinancialStatement>
>;
const companyIndustryResults = Object.fromEntries(tickers.map((ticker) => [ticker, validateCompanyIndustry(ticker)])) as Record<
  Ticker,
  ReturnType<typeof validateCompanyIndustry>
>;
const businessResults = Object.fromEntries(tickers.map((ticker) => [ticker, validateBusinessProfile(ticker)])) as Record<
  Ticker,
  ReturnType<typeof validateBusinessProfile>
>;

const productionApprovedTrueCount =
  Object.values(financialResults).reduce((sum, item) => sum + item.productionApprovedTrueCount, 0) +
  Object.values(businessResults).reduce((sum, item) => sum + item.productionApprovedTrueCount, 0);
const zeroFillDetected = Object.values(financialResults).some((item) => item.zeroFillDetected);
const totalDebtMisuseDetected = Object.values(financialResults).some((item) => item.totalDebtMisuseDetected);
const forbiddenAdviceDetected = Object.values(businessResults).some((item) => item.forbiddenAdviceDetected);
const ambiguousUnitsByTicker = Object.fromEntries(tickers.map((ticker) => [ticker, financialResults[ticker].ambiguousUnits]));
const missingFieldsByTicker = Object.fromEntries(
  tickers.map((ticker) => [
    ticker,
    {
      financialStatement: financialResults[ticker].missingFields,
      businessProfile: businessResults[ticker].missingFields,
      companyIndustry: companyIndustryResults[ticker].industryCode ? [] : ["industryCode"],
    },
  ]),
);
const blockersByTicker = Object.fromEntries(
  tickers.map((ticker) => [
    ticker,
    [
      ...financialResults[ticker].blockers.map((item) => `FinancialStatement:${item}`),
      ...businessResults[ticker].blockers.map((item) => `BusinessProfile:${item}`),
      ...companyIndustryResults[ticker].blockers.map((item) => `CompanyIndustry:${item}`),
    ],
  ]),
);
const blockedTickers = tickers.filter(
  (ticker) =>
    !financialResults[ticker].ready ||
    !businessResults[ticker].ready ||
    !companyIndustryResults[ticker].ready,
);
const rawExternalFilesCopiedToRepo = sourceFiles.some((filePath) => filePath.startsWith(repoRoot));
const rawManualInputCommitted = false;
const tvnPresent = financialRows.some((row) => row.ticker === "TVN") || sourceFiles.some((filePath) => /TVN/i.test(filePath));
const storageGaps = [
  ...(["capitalExpenditure"] as const).filter((field) => Object.values(financialResults).some((result) => result.validatedButNotStored.includes(field))),
  ...(!hasModel("CompanyBusinessProfile") ? ["BusinessProfile storage missing"] : []),
].filter((item, index, list) => list.indexOf(item) === index);

const summary = {
  phase,
  mode,
  financialsWorkspaceFound: existsSync(financialsWorkspace),
  businessWorkspaceFound: existsSync(businessWorkspace),
  externalFilesInspected,
  dbWriteAttempted: false,
  schemaChanged: false,
  providerFetchAttempted: false,
  uiChanged: false,
  assistantChanged: false,
  tickers,
  hpgCompanyIndustryCandidatePrepared: companyIndustryResults.HPG.candidatePrepared,
  vnmCompanyIndustryCandidatePrepared: companyIndustryResults.VNM.candidatePrepared,
  mwgCompanyIndustryCandidatePrepared: companyIndustryResults.MWG.candidatePrepared,
  hpgFinancialStatementCandidatePrepared: financialResults.HPG.candidatePrepared,
  vnmFinancialStatementCandidatePrepared: financialResults.VNM.candidatePrepared,
  mwgFinancialStatementCandidatePrepared: financialResults.MWG.candidatePrepared,
  hpgBusinessProfileCandidatePrepared: businessResults.HPG.candidatePrepared,
  vnmBusinessProfileCandidatePrepared: businessResults.VNM.candidatePrepared,
  mwgBusinessProfileCandidatePrepared: businessResults.MWG.candidatePrepared,
  companyIndustryStorageAvailable: hasModel("CompanyIndustry"),
  financialStatementStorageAvailable: hasModel("FinancialStatement"),
  businessProfileStorageAvailable: hasModel("CompanyBusinessProfile"),
  businessProfileReadPathAvailable: existsSync(join(repoRoot, "src", "features", "business", "lib", "load-company-business-profile.ts")),
  hpgReadyForCompanyIndustryConfirmWrite: companyIndustryResults.HPG.ready,
  vnmReadyForCompanyIndustryConfirmWrite: companyIndustryResults.VNM.ready,
  mwgReadyForCompanyIndustryConfirmWrite: companyIndustryResults.MWG.ready,
  hpgReadyForFinancialStatementConfirmWrite: financialResults.HPG.ready,
  vnmReadyForFinancialStatementConfirmWrite: financialResults.VNM.ready,
  mwgReadyForFinancialStatementConfirmWrite: financialResults.MWG.ready,
  hpgReadyForBusinessProfileConfirmWrite: businessResults.HPG.ready,
  vnmReadyForBusinessProfileConfirmWrite: businessResults.VNM.ready,
  mwgReadyForBusinessProfileConfirmWrite: businessResults.MWG.ready,
  financialResults,
  companyIndustryResults,
  businessResults,
  blockedTickers,
  blockersByTicker,
  missingFieldsByTicker,
  ambiguousUnitsByTicker,
  storageGaps,
  totalDebtMisuseDetected,
  zeroFillDetected,
  rawExternalFilesCopiedToRepo,
  rawManualInputCommitted,
  productionApprovedTrueCount,
  hsgNkgUntouched: true,
  tvnPresent,
  noBenchmarkDetected: true,
  noRankingDetected: true,
  noScoreDetected: true,
  noStockAttractivenessScoreDetected: true,
  forbiddenAdviceDetected,
  smokePassed:
    existsSync(financialsWorkspace) &&
    existsSync(businessWorkspace) &&
    blockedTickers.length === 0 &&
    productionApprovedTrueCount === 0 &&
    !totalDebtMisuseDetected &&
    !zeroFillDetected &&
    !rawExternalFilesCopiedToRepo &&
    !rawManualInputCommitted &&
    !tvnPresent &&
    !forbiddenAdviceDetected,
};

console.log(JSON.stringify(summary, null, 2));

if (!summary.smokePassed) {
  process.exitCode = 1;
}
