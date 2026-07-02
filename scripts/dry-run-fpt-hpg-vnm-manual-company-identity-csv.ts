import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

type TargetTicker = "FPT" | "HPG" | "VNM";

type CsvRow = Record<string, string>;

type IdentityCandidate = {
  ticker: TargetTicker;
  companyName: string | null;
  exchange: string | null;
  country: string | null;
  market: string | null;
  sector: string | null;
  industryLabel: string | null;
  sourceType: string | null;
  sourceLabel: string | null;
  sourceUrl: string | null;
  sourceFile: string | null;
  page: string | null;
  extractedQuote: string | null;
  reviewNote: string | null;
  warningCodes: string[];
  dataMode: string | null;
  needsReview: boolean | null;
  productionApproved: boolean | null;
  eligibleForCompanyConfirmWrite: boolean;
  blocker: string | null;
  sourceDecision: string;
};

const phase = "151X";
const csvPath = "data/manual-review/company-identity/fpt-hpg-vnm-company-identity-reviewed.csv";
const targetTickers = ["FPT", "HPG", "VNM"] as const;
const requiredColumns = [
  "ticker",
  "companyName",
  "exchange",
  "sourceType",
  "sourceLabel",
  "sourceUrl",
  "sourceFile",
  "page",
  "extractedQuote",
  "reviewNote",
  "warningCodes",
  "dataMode",
  "needsReview",
  "productionApproved",
] as const;

const requiredWarningCodes = [
  "MANUAL_REVIEWED_COMPANY_IDENTITY",
  "NEEDS_REVIEW",
  "RESEARCH_ONLY",
] as const;

const forbiddenPatterns = [
  /\b(buy|sell|hold)\b/i,
  /\btarget\s+price\b/i,
  /\bfair\s+value\b/i,
  /\bupside\b/i,
  /\bdownside\b/i,
  /\battractive\b/i,
  /\bworth\s+buying\b/i,
  /\branking\b/i,
  /\bscoring\b/i,
  /\bscore\b/i,
  /\bbenchmark\b/i,
  /\bpe\s*=|\bpb\s*=|\bclose\s*price\b|\bmarket\s*price\b/i,
  /\bdoanh\s+thu\b/i,
  /\blợi\s+nhuận\b/i,
  /\bgiá\s+mục\s+tiêu\b/i,
  /\bgiá\s+trị\s+hợp\s+lý\b/i,
  /\btiềm\s+năng\s+tăng\s+giá\b/i,
] as const;

const placeholderPatterns = [
  /\b(sample|mock|placeholder|fake|todo|tbd|test)\b/i,
  /\bdữ\s+liệu\s+mẫu\b/i,
] as const;

const normalize = (value: string): string =>
  value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();

const parseBoolean = (value: string): boolean | null => {
  const normalized = value.trim().toLowerCase();
  if (normalized === "true") return true;
  if (normalized === "false") return false;
  return null;
};

const splitCsvLine = (line: string): string[] => {
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
      cells.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  cells.push(current.trim());
  return cells;
};

const parseCsv = (content: string): { headers: string[]; rows: CsvRow[]; errors: string[] } => {
  const lines = content
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0);

  if (lines.length === 0) {
    return { headers: [], rows: [], errors: ["CSV is empty."] };
  }

  const headers = splitCsvLine(lines[0]);
  const rows: CsvRow[] = [];
  const errors: string[] = [];

  for (const [lineIndex, line] of lines.slice(1).entries()) {
    const cells = splitCsvLine(line);
    if (cells.length !== headers.length) {
      errors.push(`Line ${lineIndex + 2} has ${cells.length} cells; expected ${headers.length}.`);
      continue;
    }

    rows.push(Object.fromEntries(headers.map((header, index) => [header, cells[index] ?? ""])));
  }

  return { headers, rows, errors };
};

const parseWarningCodes = (value: string): string[] =>
  value
    .split(/[;,|]/)
    .map((code) => code.trim())
    .filter(Boolean);

const isTargetTicker = (value: string): value is TargetTicker =>
  targetTickers.includes(value.trim().toUpperCase() as TargetTicker);

const identityMatches = (ticker: TargetTicker, companyName: string, extractedQuote: string): boolean => {
  const haystack = normalize(`${companyName} ${extractedQuote}`);

  if (ticker === "FPT") {
    return haystack.includes("cong ty co phan fpt") || haystack.includes("fpt corporation");
  }
  if (ticker === "HPG") {
    return (
      haystack.includes("cong ty co phan tap doan hoa phat") ||
      haystack.includes("hoa phat group") ||
      haystack.includes("tap doan hoa phat")
    );
  }
  return (
    haystack.includes("cong ty co phan sua viet nam") ||
    haystack.includes("vietnam dairy products") ||
    haystack.includes("vinamilk")
  );
};

const quoteHasDirectLegalName = (ticker: TargetTicker, extractedQuote: string): boolean => {
  const quote = normalize(extractedQuote);
  if (ticker === "FPT") return quote.includes("cong ty co phan fpt") || quote.includes("fpt corporation");
  if (ticker === "HPG") {
    return quote.includes("cong ty co phan tap doan hoa phat") || quote.includes("hoa phat group");
  }
  return quote.includes("cong ty co phan sua viet nam") || quote.includes("vietnam dairy products");
};

const isRawCsvCommitted = (): boolean => {
  try {
    execSync(`git ls-files --error-unmatch "${csvPath}"`, {
      cwd: process.cwd(),
      stdio: "ignore",
    });
    return true;
  } catch {
    return false;
  }
};

const blockedCandidate = (ticker: TargetTicker, blocker: string, decision: string): IdentityCandidate => ({
  ticker,
  companyName: null,
  exchange: null,
  country: null,
  market: null,
  sector: null,
  industryLabel: null,
  sourceType: null,
  sourceLabel: null,
  sourceUrl: null,
  sourceFile: null,
  page: null,
  extractedQuote: null,
  reviewNote: null,
  warningCodes: ["NEEDS_REVIEW", "RESEARCH_ONLY"],
  dataMode: "research_only",
  needsReview: true,
  productionApproved: false,
  eligibleForCompanyConfirmWrite: false,
  blocker,
  sourceDecision: decision,
});

const validateRow = (row: CsvRow): IdentityCandidate => {
  const rawTicker = row.ticker?.trim().toUpperCase() ?? "";

  if (!isTargetTicker(rawTicker)) {
    return blockedCandidate(
      "FPT",
      `invalid_or_unsupported_ticker:${rawTicker || "missing"}`,
      "blocked: CSV contains a ticker outside FPT/HPG/VNM or a missing ticker.",
    );
  }

  const ticker = rawTicker;
  const companyName = row.companyName?.trim() ?? "";
  const exchange = row.exchange?.trim() || null;
  const sourceType = row.sourceType?.trim() ?? "";
  const sourceLabel = row.sourceLabel?.trim() ?? "";
  const sourceUrl = row.sourceUrl?.trim() || null;
  const sourceFile = row.sourceFile?.trim() || null;
  const page = row.page?.trim() || null;
  const extractedQuote = row.extractedQuote?.trim() ?? "";
  const reviewNote = row.reviewNote?.trim() ?? "";
  const warningCodes = parseWarningCodes(row.warningCodes ?? "");
  const dataMode = row.dataMode?.trim() ?? "";
  const needsReview = parseBoolean(row.needsReview ?? "");
  const productionApproved = parseBoolean(row.productionApproved ?? "");
  const rowText = JSON.stringify(row);
  const blockers: string[] = [];

  if (!companyName) blockers.push("companyName_missing");
  if (sourceType !== "manual_reviewed_company_identity") blockers.push("sourceType_must_be_manual_reviewed_company_identity");
  if (!sourceLabel) blockers.push("sourceLabel_missing");
  if (!extractedQuote) blockers.push("extractedQuote_missing");
  if (!reviewNote) blockers.push("reviewNote_missing");
  if (dataMode !== "research_only") blockers.push("dataMode_must_be_research_only");
  if (needsReview !== true) blockers.push("needsReview_must_be_true");
  if (productionApproved !== false) blockers.push("productionApproved_must_be_false");
  for (const requiredCode of requiredWarningCodes) {
    if (!warningCodes.includes(requiredCode)) blockers.push(`warningCode_missing:${requiredCode}`);
  }
  if (!identityMatches(ticker, companyName, extractedQuote)) blockers.push("identity_consistency_check_failed");
  if (forbiddenPatterns.some((pattern) => pattern.test(rowText))) blockers.push("forbidden_financial_or_advice_content_detected");
  if (placeholderPatterns.some((pattern) => pattern.test(rowText))) blockers.push("placeholder_or_sample_content_detected");

  const finalWarningCodes = [...warningCodes];
  if (ticker === "VNM" && extractedQuote && !quoteHasDirectLegalName(ticker, extractedQuote)) {
    finalWarningCodes.push("VNM_IDENTITY_QUOTE_NEEDS_STRONGER_DIRECT_LEGAL_NAME");
  }

  const eligible = blockers.length === 0;

  return {
    ticker,
    companyName: companyName || null,
    exchange,
    country: null,
    market: null,
    sector: null,
    industryLabel: null,
    sourceType,
    sourceLabel: sourceLabel || null,
    sourceUrl,
    sourceFile,
    page,
    extractedQuote: extractedQuote || null,
    reviewNote: reviewNote || null,
    warningCodes: Array.from(new Set(finalWarningCodes)),
    dataMode,
    needsReview,
    productionApproved,
    eligibleForCompanyConfirmWrite: eligible,
    blocker: eligible ? null : blockers.join(";"),
    sourceDecision: eligible
      ? "accepted: manual reviewed Company identity CSV row passed dry-run validation."
      : `blocked: ${blockers.join(";")}`,
  };
};

const fullCsvPath = join(process.cwd(), csvPath);
const csvFound = existsSync(fullCsvPath);
const csvContent = csvFound ? readFileSync(fullCsvPath, "utf-8") : "";
const parsed = csvFound ? parseCsv(csvContent) : { headers: [], rows: [], errors: ["CSV file not found."] };
const missingRequiredColumns = requiredColumns.filter((column) => !parsed.headers.includes(column));
const rawCandidates = missingRequiredColumns.length === 0 ? parsed.rows.map(validateRow) : [];
const candidatesByTicker = new Map<TargetTicker, IdentityCandidate>();

for (const candidate of rawCandidates) {
  if (!candidatesByTicker.has(candidate.ticker)) {
    candidatesByTicker.set(candidate.ticker, candidate);
  }
}

const identityCandidates = targetTickers.map(
  (ticker) =>
    candidatesByTicker.get(ticker) ??
    blockedCandidate(
      ticker,
      csvFound ? "ticker_row_missing_or_required_columns_invalid" : "csv_missing",
      csvFound
        ? "blocked: CSV is present but required columns are missing or this ticker row is absent."
        : "blocked: manual reviewed Company identity CSV was not found at the required path.",
    ),
);

const duplicateTickers = rawCandidates
  .map((candidate) => candidate.ticker)
  .filter((ticker, index, list) => list.indexOf(ticker) !== index);
for (const ticker of duplicateTickers) {
  const candidate = identityCandidates.find((item) => item.ticker === ticker);
  if (candidate) {
    candidate.eligibleForCompanyConfirmWrite = false;
    candidate.blocker = [candidate.blocker, "duplicate_ticker_rows"].filter(Boolean).join(";");
    candidate.sourceDecision = `blocked: ${candidate.blocker}`;
  }
}

const unsupportedTickerRows = parsed.rows
  .map((row) => row.ticker?.trim().toUpperCase() ?? "")
  .filter((ticker) => ticker.length > 0 && !targetTickers.includes(ticker as TargetTicker));

const rawCsvCommitted = isRawCsvCommitted();
const productionApprovedTrueCount = identityCandidates.filter((candidate) => candidate.productionApproved === true).length;
const scannedText = JSON.stringify(identityCandidates);
const forbiddenAdviceDetected = forbiddenPatterns.some((pattern) => pattern.test(scannedText));
const eligibleIdentityCandidates = identityCandidates.filter((candidate) => candidate.eligibleForCompanyConfirmWrite).length;
const blockedIdentityCandidates = identityCandidates.length - eligibleIdentityCandidates;
const allThreeReady = eligibleIdentityCandidates === targetTickers.length;

const summary = {
  phase,
  mode: "dry_run",
  targetTickers,
  csvPath,
  csvFound,
  requiredColumnsPresent: missingRequiredColumns.length === 0,
  missingRequiredColumns,
  csvParseErrors: parsed.errors,
  unsupportedTickerRows,
  identityCandidatesPrepared: identityCandidates.length,
  eligibleIdentityCandidates,
  blockedIdentityCandidates,
  readyForCompanyConfirmWriteByTicker: Object.fromEntries(
    identityCandidates.map((candidate) => [candidate.ticker, candidate.eligibleForCompanyConfirmWrite]),
  ),
  tickersReadyForCompanyConfirmWrite: identityCandidates
    .filter((candidate) => candidate.eligibleForCompanyConfirmWrite)
    .map((candidate) => candidate.ticker),
  tickersBlocked: identityCandidates
    .filter((candidate) => !candidate.eligibleForCompanyConfirmWrite)
    .map((candidate) => candidate.ticker),
  missingIdentityFieldsByTicker: Object.fromEntries(
    identityCandidates.map((candidate) => [
      candidate.ticker,
      [
        ...(candidate.companyName ? [] : ["companyName"]),
        ...(candidate.sourceType ? [] : ["sourceType"]),
        ...(candidate.sourceLabel ? [] : ["sourceLabel"]),
        ...(candidate.extractedQuote ? [] : ["extractedQuote"]),
        ...(candidate.reviewNote ? [] : ["reviewNote"]),
        ...(candidate.exchange ? [] : ["exchange"]),
        ...(candidate.industryLabel ? [] : ["industryLabel"]),
      ],
    ]),
  ),
  sourceDecisionByTicker: Object.fromEntries(
    identityCandidates.map((candidate) => [candidate.ticker, candidate.sourceDecision]),
  ),
  sanitizedIdentityCandidates: identityCandidates.map((candidate) => ({
    ticker: candidate.ticker,
    companyName: candidate.companyName,
    exchange: candidate.exchange,
    sourceType: candidate.sourceType,
    sourceLabel: candidate.sourceLabel,
    sourceUrlPresent: Boolean(candidate.sourceUrl),
    sourceFilePresent: Boolean(candidate.sourceFile),
    pagePresent: Boolean(candidate.page),
    extractedQuotePresent: Boolean(candidate.extractedQuote),
    reviewNotePresent: Boolean(candidate.reviewNote),
    warningCodes: candidate.warningCodes,
    dataMode: candidate.dataMode,
    needsReview: candidate.needsReview,
    productionApproved: candidate.productionApproved,
    eligibleForCompanyConfirmWrite: candidate.eligibleForCompanyConfirmWrite,
    blocker: candidate.blocker,
  })),
  manualCsvAccepted: allThreeReady,
  wouldAllowAllCoreCompanyConfirmWrite: allThreeReady,
  dbWriteAttempted: false,
  schemaChanged: false,
  providerFetchAttempted: false,
  uiChanged: false,
  assistantChanged: false,
  screeningCandidateWriteAttempted: false,
  marketPriceWriteAttempted: false,
  financialStatementWriteAttempted: false,
  companyIndustryWriteAttempted: false,
  productionApprovedTrueCount,
  msnMwgVcbUntouched: true,
  hsgNkgUntouched: true,
  tvnPresent: scannedText.includes("TVN") || unsupportedTickerRows.includes("TVN"),
  rankingCreated: false,
  stockAttractivenessScoreCreated: false,
  industryMetricCreated: false,
  benchmarkCreated: false,
  forbiddenAdviceDetected,
  rawCsvCommitted,
  smokePassed:
    !rawCsvCommitted &&
    productionApprovedTrueCount === 0 &&
    !forbiddenAdviceDetected &&
    unsupportedTickerRows.length === 0 &&
    !scannedText.includes("TVN"),
};

console.log(JSON.stringify(summary, null, 2));

if (!summary.smokePassed) {
  process.exitCode = 1;
}
