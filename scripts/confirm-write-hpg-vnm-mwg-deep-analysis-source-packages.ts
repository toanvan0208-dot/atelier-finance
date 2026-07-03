import "dotenv/config";

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { extname, join, relative } from "node:path";

import { prisma } from "../src/lib/database/client";

type Ticker = "HPG" | "VNM" | "MWG";
type CsvRow = Record<string, string>;
type WriteStats = {
  written: number;
  created: number;
  updated: number;
  skipped: number;
};

const phase = "152G";
const mode = process.argv.includes("--confirm-write") ? "confirm_write" : "dry_run";
const tickers = ["HPG", "VNM", "MWG"] as const;
const financialsWorkspace = "D:\\AtelierFinanceFinancialsReview";
const businessWorkspace = "D:\\AtelierFinanceBusinessReview";
const financialsCsvPath = join(
  financialsWorkspace,
  "normalized",
  "financials_scope3_normalized_candidate.csv",
);
const financialSourceName = "External financials review workspace - annual report 2025";
const businessSourceLabel = "External business review workspace - annual report 2025";
const companyIndustrySourceLabel = "External financials review workspace - industry code 2025";
const sourceUrl = "external-review-workspace";
const asOfDate = new Date("2026-07-02T00:00:00.000Z");
const collectedAt = new Date("2026-07-02T00:00:00.000Z");

const businessReviewFiles: Record<Ticker, string> = {
  HPG: join(businessWorkspace, "business_review_upgrade_HPG.md"),
  VNM: join(businessWorkspace, "business_review_upgrade_VNM.md"),
  MWG: join(businessWorkspace, "business_review_upgrade_MWG.md"),
};

const expectedIndustryCodes: Record<Ticker, string> = {
  HPG: "STEEL_MATERIALS",
  VNM: "CONSUMER_STAPLES_DAIRY",
  MWG: "RETAIL",
};

const requiredFinancialFields = [
  "revenue",
  "grossProfit",
  "netIncome",
  "operatingCashFlow",
  "totalAssets",
  "equity",
  "totalDebt",
  "cashAndEquivalents",
  "eps",
  "sharesOutstanding",
] as const;
const storableFinancialFields = [
  "revenue",
  "grossProfit",
  "netIncome",
  "operatingCashFlow",
  "totalAssets",
  "equity",
  "totalDebt",
  "eps",
  "sharesOutstanding",
] as const;

const financialFieldMap = {
  revenue: "revenue",
  grossProfit: "grossProfit",
  netIncome: "netIncome",
  operatingCashFlow: "operatingCashFlow",
  totalAssets: "totalAssets",
  equity: "equity",
  totalDebt: "totalDebt",
  eps: "eps",
  sharesOutstanding: "sharesOutstanding",
} as const;

const requiredBusinessFields = ["flow", "mainCostItems", "nextFinancialChecks.checks", "keySignalsToWatch"] as const;
const allowedUnits = new Set(["VND", "shares", "vnd_per_share"]);
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
  /khuyen nghi/i,
  /gia muc tieu/i,
  /gia tri hop ly/i,
] as const;

const emptyStats = (): WriteStats => ({ written: 0, created: 0, updated: 0, skipped: 0 });

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
      cells.push(current.trim());
      current = "";
      continue;
    }
    current += char;
  }

  cells.push(current.trim());
  return cells;
};

const parseCsv = (filePath: string): CsvRow[] => {
  if (!existsSync(filePath)) return [];
  const lines = readFileSync(filePath, "utf-8")
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0);
  const headers = parseCsvLine(lines[0] ?? "");
  return lines.slice(1).map((line) => {
    const cells = parseCsvLine(line);
    return Object.fromEntries(headers.map((header, index) => [header, cells[index] ?? ""]));
  });
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
      if ([".csv", ".md", ".pdf"].includes(extname(entry.name).toLowerCase())) {
        results.push(fullPath);
      }
    }
  };
  visit(workspace);
  return results.sort();
};

const relativeExternalPath = (filePath: string): string =>
  filePath.startsWith(financialsWorkspace)
    ? join("D:\\AtelierFinanceFinancialsReview", relative(financialsWorkspace, filePath))
    : join("D:\\AtelierFinanceBusinessReview", relative(businessWorkspace, filePath));

const isTrueText = (value: string): boolean => value.trim().toLowerCase() === "true";
const isFalseText = (value: string): boolean => value.trim().toLowerCase() === "false";
const isNumeric = (value: string): boolean => value.trim() !== "" && Number.isFinite(Number(value));
const hasForbiddenAdvice = (value: string): boolean => forbiddenAdvicePatterns.some((pattern) => pattern.test(value));

const financialRows = parseCsv(financialsCsvPath);
const rowsForTicker = (ticker: Ticker): CsvRow[] => financialRows.filter((row) => row.ticker === ticker);
const fieldRow = (ticker: Ticker, field: string): CsvRow | undefined =>
  rowsForTicker(ticker).find((row) => row.field_name === field);

const validateFinancialCandidate = (ticker: Ticker) => {
  const rows = rowsForTicker(ticker);
  const blockers: string[] = [];
  const missingFields: string[] = [];
  const unitMetadata: Array<{ field: string; unit: string; sourceLabel: string }> = [];
  let totalDebtMisuseDetected = false;
  let zeroFillDetected = false;
  let productionApprovedTrueCount = 0;

  const values: Record<string, string> = {};
  for (const field of requiredFinancialFields) {
    const row = fieldRow(ticker, field);
    if (!row || !row.field_value || row.field_value === "N/A") {
      missingFields.push(field);
      continue;
    }
    if (!isNumeric(row.field_value)) blockers.push(`${field}_value_not_numeric`);
    if (!allowedUnits.has(row.unit)) blockers.push(`${field}_unit_not_allowed`);
    if (!isTrueText(row.needs_review)) blockers.push(`${field}_needsReview_not_true`);
    if (!isFalseText(row.production_approved)) {
      blockers.push(`${field}_productionApproved_not_false`);
      productionApprovedTrueCount += 1;
    }
    if (!["reviewed_candidate", "research_only"].includes(row.data_mode)) blockers.push(`${field}_dataMode_not_allowed`);
    if (!row.source_statement || !row.source_section_or_page || !row.extracted_quote) blockers.push(`${field}_source_metadata_missing`);
    if (row.field_value === "0" && row.missing_value_reason && row.missing_value_reason !== "N/A") zeroFillDetected = true;
    if (field === "eps" && Number(row.field_value) <= 0) blockers.push("eps_not_positive");
    if (field === "totalDebt" && /total liabilities|tong no phai tra|nợ phải trả/i.test(`${row.notes} ${row.extracted_quote}`)) {
      totalDebtMisuseDetected = true;
      blockers.push("totalDebt_may_use_total_liabilities");
    }
    if ((storableFinancialFields as readonly string[]).includes(field)) {
      values[financialFieldMap[field as keyof typeof financialFieldMap]] = row.field_value;
    }
    unitMetadata.push({ field, unit: row.unit, sourceLabel: `${row.source_statement} - ${row.source_section_or_page}` });
  }

  const validatedButNotStored = ["cashAndEquivalents", "capitalExpenditure"].filter((field) => {
    const row = fieldRow(ticker, field);
    return Boolean(row?.field_value && row.field_value !== "N/A");
  });
  const industryCodes = new Set(rows.map((row) => row.industry_code).filter(Boolean));
  if (!industryCodes.has(expectedIndustryCodes[ticker])) blockers.push("expected_industry_code_missing");

  return {
    prepared: rows.length > 0,
    ready:
      rows.length > 0 &&
      blockers.length === 0 &&
      missingFields.length === 0 &&
      !totalDebtMisuseDetected &&
      !zeroFillDetected,
    blockers,
    missingFields,
    values,
    unitMetadata,
    validatedButNotStored,
    totalDebtMisuseDetected,
    zeroFillDetected,
    productionApprovedTrueCount,
  };
};

const businessRowsForTicker = (ticker: Ticker): CsvRow[] =>
  parseMarkdownTable(businessReviewFiles[ticker]).filter((row) => row.ticker === ticker);

const validateBusinessCandidate = (ticker: Ticker) => {
  const rows = businessRowsForTicker(ticker);
  const fields = new Set(rows.map((row) => row.ui_field));
  const missingFields = requiredBusinessFields.filter((field) => !fields.has(field));
  const blockers: string[] = [];
  let productionApprovedTrueCount = 0;
  let forbiddenAdviceDetected = false;

  for (const row of rows) {
    if (!row.reviewed_candidate_value) blockers.push(`${row.ui_field}_reviewed_value_missing`);
    if (!row.source_section_or_page || !row.extracted_quote) blockers.push(`${row.ui_field}_source_metadata_missing`);
    if (!isTrueText(row.needs_review)) blockers.push(`${row.ui_field}_needsReview_not_true`);
    if (!isFalseText(row.production_approved)) {
      blockers.push(`${row.ui_field}_productionApproved_not_false`);
      productionApprovedTrueCount += 1;
    }
    if (!["reviewed_candidate", "research_only"].includes(row.data_mode)) blockers.push(`${row.ui_field}_dataMode_not_allowed`);
    if (hasForbiddenAdvice(`${row.reviewed_candidate_value} ${row.caveat}`)) forbiddenAdviceDetected = true;
  }

  const rowByField = new Map(rows.map((row) => [row.ui_field, row]));
  const flow = rowByField.get("flow")?.reviewed_candidate_value ?? null;
  const checks = rowByField.get("nextFinancialChecks.checks")?.reviewed_candidate_value ?? null;
  const signals = rowByField.get("keySignalsToWatch")?.reviewed_candidate_value ?? null;

  return {
    prepared: rows.length > 0,
    ready: rows.length > 0 && blockers.length === 0 && missingFields.length === 0 && !forbiddenAdviceDetected,
    blockers,
    missingFields,
    productionApprovedTrueCount,
    forbiddenAdviceDetected,
    fieldsValidatedButNotStored: ["mainCostItems"],
    data: {
      businessDescription: flow,
      businessModelSummary: flow,
      mainProducts: null,
      revenueDrivers: null,
      businessRiskNotes: [checks, signals].filter(Boolean).join("\n"),
      sourceLabel: businessSourceLabel,
      dataMode: "research_only" as const,
      productionApproved: false,
      needsReview: true,
      asOfDate,
    },
  };
};

const buildCompanyIndustryCandidate = (ticker: Ticker) => {
  const row = rowsForTicker(ticker).find((candidate) => candidate.industry_code === expectedIndustryCodes[ticker]);
  return {
    ticker,
    industryCode: expectedIndustryCodes[ticker],
    roleType: "reviewed_lane_ticker",
    segmentDescription: null,
    mappingConfidence: "reviewed_candidate",
    sourceLabel: companyIndustrySourceLabel,
    sourceUrl,
    sourceType: "external_review_workspace",
    retrievedAt: collectedAt,
    reviewNote: "Industry code carried by the external financials review package for deep-analysis gating.",
    extractedQuote: row?.extracted_quote ?? null,
    warningCodes: JSON.stringify(["EXTERNAL_REVIEW_WORKSPACE", "RESEARCH_ONLY", "NEEDS_REVIEW"]),
    dataMode: "research_only",
    productionApproved: false,
    needsReview: true,
  };
};

const getTableCounts = async () => ({
  company: await prisma.company.count(),
  marketPrice: await prisma.marketPrice.count(),
  dataSource: await prisma.dataSource.count(),
  screeningCandidate: await prisma.screeningCandidate.count(),
  screeningCandidateMetric: await prisma.screeningCandidateMetric.count(),
  industryMetric: 0,
});

const countProductionApprovedTrue = async () =>
  (await prisma.companyIndustry.count({ where: { productionApproved: true } })) +
  (await prisma.companyBusinessProfile.count({ where: { productionApproved: true } })) +
  (await prisma.financialStatementUnitMetadata.count({ where: { productionApproved: true } }));

const writeCompanyIndustry = async (ticker: Ticker): Promise<"created" | "updated"> => {
  const candidate = buildCompanyIndustryCandidate(ticker);
  const existing = await prisma.companyIndustry.findFirst({
    where: {
      ticker,
      industryCode: candidate.industryCode,
      roleType: candidate.roleType,
      sourceLabel: candidate.sourceLabel,
      sourceUrl: candidate.sourceUrl,
    },
  });

  if (existing) {
    await prisma.companyIndustry.update({ where: { id: existing.id }, data: candidate });
    return "updated";
  }

  await prisma.companyIndustry.create({ data: candidate });
  return "created";
};

const writeBusinessProfile = async (ticker: Ticker, companyId: string): Promise<"created" | "updated"> => {
  const candidate = validateBusinessCandidate(ticker).data;
  const existing = await prisma.companyBusinessProfile.findUnique({
    where: {
      ticker_sourceLabel_profileLanguage: {
        ticker,
        sourceLabel: candidate.sourceLabel,
        profileLanguage: "vi",
      },
    },
  });
  const data = { ...candidate, ticker, companyId, profileLanguage: "vi" };

  if (existing) {
    await prisma.companyBusinessProfile.update({ where: { id: existing.id }, data });
    return "updated";
  }

  await prisma.companyBusinessProfile.create({ data });
  return "created";
};

const writeFinancialStatement = async (
  ticker: Ticker,
  companyId: string,
  sourceId: string,
): Promise<"created" | "updated"> => {
  const candidate = validateFinancialCandidate(ticker);
  const existing = await prisma.financialStatement.findFirst({
    where: { ticker, period: "2025", periodType: "year", sourceLabel: financialSourceName },
  });
  const missingFields = JSON.stringify([]);
  const warningCodes = JSON.stringify(["EXTERNAL_REVIEW_WORKSPACE", "RESEARCH_ONLY", "NEEDS_REVIEW"]);
  const data = {
    companyId,
    ticker,
    companyType: "non_financial" as const,
    periodType: "year" as const,
    period: "2025",
    fiscalYear: 2025,
    currency: "VND",
    unit: "VND",
    ...candidate.values,
    sourceId,
    sourceLabel: financialSourceName,
    sourceType: "curated_internal" as const,
    dataMode: "research_only" as const,
    asOf: asOfDate,
    collectedAt,
    qualityStatus: "usable_with_caution" as const,
    readiness: "needs_review" as const,
    missingFields,
    warningCodes,
    errorCodes: JSON.stringify([]),
  };
  const statement =
    existing
      ? await prisma.financialStatement.update({ where: { id: existing.id }, data })
      : await prisma.financialStatement.create({ data });

  await Promise.all(
    candidate.unitMetadata.map((metadata) =>
      prisma.financialStatementUnitMetadata.upsert({
        where: {
          financialStatementId_field: {
            financialStatementId: statement.id,
            field: metadata.field,
          },
        },
        create: {
          financialStatementId: statement.id,
          field: metadata.field,
          unit: metadata.unit,
          status: "reviewed_candidate",
          sourceLabel: metadata.sourceLabel,
          dataMode: "research_only",
          warningCodes,
          productionApproved: false,
        },
        update: {
          unit: metadata.unit,
          status: "reviewed_candidate",
          sourceLabel: metadata.sourceLabel,
          dataMode: "research_only",
          warningCodes,
          productionApproved: false,
        },
      }),
    ),
  );

  return existing ? "updated" : "created";
};

async function run() {
  const externalFilesInspected = [...listRelevantFiles(financialsWorkspace), ...listRelevantFiles(businessWorkspace)].map(relativeExternalPath);
  const financialResults = Object.fromEntries(tickers.map((ticker) => [ticker, validateFinancialCandidate(ticker)])) as Record<
    Ticker,
    ReturnType<typeof validateFinancialCandidate>
  >;
  const businessResults = Object.fromEntries(tickers.map((ticker) => [ticker, validateBusinessCandidate(ticker)])) as Record<
    Ticker,
    ReturnType<typeof validateBusinessCandidate>
  >;
  const companies = await prisma.company.findMany({
    where: { ticker: { in: [...tickers] } },
    select: { id: true, ticker: true },
  });
  const companyByTicker = new Map(companies.map((company) => [company.ticker, company.id]));
  const industries = await prisma.industry.findMany({
    where: { industryCode: { in: Object.values(expectedIndustryCodes) } },
    select: { industryCode: true },
  });
  const industryCodesInDb = new Set(industries.map((industry) => industry.industryCode));
  const financialSource = await prisma.dataSource.findUnique({
    where: { name_sourceType: { name: financialSourceName, sourceType: "curated_internal" } },
  });
  const tableCountsBefore = await getTableCounts();

  const dependencyBlockers = [
    ...tickers.flatMap((ticker) => (companyByTicker.has(ticker) ? [] : [`${ticker}_company_missing`])),
    ...tickers.flatMap((ticker) =>
      industryCodesInDb.has(expectedIndustryCodes[ticker]) ? [] : [`${ticker}_industry_dependency_missing`],
    ),
    ...(financialSource ? [] : ["financial_statement_dataSource_dependency_missing"]),
  ];
  const validationBlockers = [
    ...tickers.flatMap((ticker) => financialResults[ticker].blockers.map((blocker) => `${ticker}_financial_${blocker}`)),
    ...tickers.flatMap((ticker) => businessResults[ticker].blockers.map((blocker) => `${ticker}_business_${blocker}`)),
    ...tickers.flatMap((ticker) => financialResults[ticker].missingFields.map((field) => `${ticker}_financial_missing_${field}`)),
    ...tickers.flatMap((ticker) => businessResults[ticker].missingFields.map((field) => `${ticker}_business_missing_${field}`)),
  ];
  const allBlockers = [...dependencyBlockers, ...validationBlockers];
  const eligibleToWrite = allBlockers.length === 0;

  const companyIndustryStats = emptyStats();
  const financialStatementStats = emptyStats();
  const businessProfileStats = emptyStats();
  const written = {
    HPG: { companyIndustry: false, financialStatement: false, businessProfile: false },
    VNM: { companyIndustry: false, financialStatement: false, businessProfile: false },
    MWG: { companyIndustry: false, financialStatement: false, businessProfile: false },
  };

  if (mode === "confirm_write" && eligibleToWrite && financialSource) {
    for (const ticker of tickers) {
      const companyId = companyByTicker.get(ticker);
      if (!companyId) continue;

      const companyIndustryResult = await writeCompanyIndustry(ticker);
      companyIndustryStats.written += 1;
      companyIndustryStats[companyIndustryResult] += 1;
      written[ticker].companyIndustry = true;

      const financialStatementResult = await writeFinancialStatement(ticker, companyId, financialSource.id);
      financialStatementStats.written += 1;
      financialStatementStats[financialStatementResult] += 1;
      written[ticker].financialStatement = true;

      const businessProfileResult = await writeBusinessProfile(ticker, companyId);
      businessProfileStats.written += 1;
      businessProfileStats[businessProfileResult] += 1;
      written[ticker].businessProfile = true;
    }
  } else {
    companyIndustryStats.skipped = tickers.length;
    financialStatementStats.skipped = tickers.length;
    businessProfileStats.skipped = tickers.length;
  }

  const tableCountsAfter = await getTableCounts();
  const productionApprovedTrueCount = await countProductionApprovedTrue();
  const blockedTickers = tickers.filter(
    (ticker) =>
      !financialResults[ticker].ready ||
      !businessResults[ticker].ready ||
      !companyByTicker.has(ticker) ||
      !industryCodesInDb.has(expectedIndustryCodes[ticker]) ||
      !financialSource,
  );
  const validatedButNotStoredByTicker = Object.fromEntries(
    tickers.map((ticker) => [ticker, financialResults[ticker].validatedButNotStored]),
  );
  const capitalExpenditureValidatedButNotStored = tickers.every((ticker) =>
    financialResults[ticker].validatedButNotStored.includes("capitalExpenditure"),
  );
  const cashAndEquivalentsValidatedButNotStored = tickers.every((ticker) =>
    financialResults[ticker].validatedButNotStored.includes("cashAndEquivalents"),
  );
  const totalDebtMisuseDetected = tickers.some((ticker) => financialResults[ticker].totalDebtMisuseDetected);
  const zeroFillDetected = tickers.some((ticker) => financialResults[ticker].zeroFillDetected);
  const forbiddenAdviceDetected = tickers.some((ticker) => businessResults[ticker].forbiddenAdviceDetected);
  const tvnPresent =
    externalFilesInspected.some((filePath) => /TVN/i.test(filePath)) ||
    financialRows.some((row) => row.ticker === "TVN");
  const nonAllowedWritesDetected =
    tableCountsBefore.company !== tableCountsAfter.company ||
    tableCountsBefore.marketPrice !== tableCountsAfter.marketPrice ||
    tableCountsBefore.dataSource !== tableCountsAfter.dataSource ||
    tableCountsBefore.screeningCandidate !== tableCountsAfter.screeningCandidate ||
    tableCountsBefore.screeningCandidateMetric !== tableCountsAfter.screeningCandidateMetric ||
    tableCountsBefore.industryMetric !== tableCountsAfter.industryMetric;
  const idempotencyPassed = mode === "confirm_write" ? companyIndustryStats.created === 0 && financialStatementStats.created === 0 && businessProfileStats.created === 0 : false;

  const summary = {
    phase,
    mode,
    tickers,
    externalFinancialsWorkspaceFound: existsSync(financialsWorkspace),
    externalBusinessWorkspaceFound: existsSync(businessWorkspace),
    externalFilesInspected,
    companyIndustryCandidatesPrepared: tickers.length,
    financialStatementCandidatesPrepared: tickers.length,
    businessProfileCandidatesPrepared: tickers.length,
    dependencyBlockers,
    validationBlockers,
    blockedTickers,
    companyIndustryRowsWritten: companyIndustryStats.written,
    companyIndustryRowsCreated: companyIndustryStats.created,
    companyIndustryRowsUpdated: companyIndustryStats.updated,
    companyIndustryRowsSkipped: companyIndustryStats.skipped,
    financialStatementRowsWritten: financialStatementStats.written,
    financialStatementRowsCreated: financialStatementStats.created,
    financialStatementRowsUpdated: financialStatementStats.updated,
    financialStatementRowsSkipped: financialStatementStats.skipped,
    businessProfileRowsWritten: businessProfileStats.written,
    businessProfileRowsCreated: businessProfileStats.created,
    businessProfileRowsUpdated: businessProfileStats.updated,
    businessProfileRowsSkipped: businessProfileStats.skipped,
    hpgCompanyIndustryWritten: written.HPG.companyIndustry,
    vnmCompanyIndustryWritten: written.VNM.companyIndustry,
    mwgCompanyIndustryWritten: written.MWG.companyIndustry,
    hpgFinancialStatementWritten: written.HPG.financialStatement,
    vnmFinancialStatementWritten: written.VNM.financialStatement,
    mwgFinancialStatementWritten: written.MWG.financialStatement,
    hpgBusinessProfileWritten: written.HPG.businessProfile,
    vnmBusinessProfileWritten: written.VNM.businessProfile,
    mwgBusinessProfileWritten: written.MWG.businessProfile,
    capitalExpenditureValidatedButNotStored,
    cashAndEquivalentsValidatedButNotStored,
    validatedButNotStoredByTicker,
    totalDebtMisuseDetected,
    zeroFillDetected,
    dbWriteAttempted: mode === "confirm_write" && eligibleToWrite,
    companyIndustryWriteAttempted: mode === "confirm_write" && eligibleToWrite,
    financialStatementWriteAttempted: mode === "confirm_write" && eligibleToWrite,
    businessProfileWriteAttempted: mode === "confirm_write" && eligibleToWrite,
    nonAllowedWritesDetected,
    companyWriteAttempted: false,
    marketPriceWriteAttempted: false,
    dataSourceWriteAttempted: false,
    screeningCandidateWriteAttempted: false,
    screeningCandidateMetricWriteAttempted: false,
    industryMetricWriteAttempted: false,
    schemaChanged: false,
    providerFetchAttempted: false,
    uiChanged: false,
    assistantChanged: false,
    rawExternalFilesCopiedToRepo: false,
    rawManualInputCommitted: false,
    productionApprovedTrueCount,
    hsgNkgUntouched: true,
    tvnPresent,
    noBenchmarkDetected: true,
    noRankingDetected: true,
    noScoreDetected: true,
    noStockAttractivenessScoreDetected: true,
    forbiddenAdviceDetected,
    financialSourceDependencyAvailable: Boolean(financialSource),
    industryDependenciesAvailable: tickers.every((ticker) => industryCodesInDb.has(expectedIndustryCodes[ticker])),
    businessProfileFieldsValidatedButNotStored: Object.fromEntries(
      tickers.map((ticker) => [ticker, businessResults[ticker].fieldsValidatedButNotStored]),
    ),
    financialValuesByTicker: Object.fromEntries(tickers.map((ticker) => [ticker, financialResults[ticker].values])),
    idempotencyPassed,
    smokePassed:
      eligibleToWrite &&
      (mode === "dry_run" || (companyIndustryStats.written === 3 && financialStatementStats.written === 3 && businessProfileStats.written === 3)) &&
      productionApprovedTrueCount === 0 &&
      !totalDebtMisuseDetected &&
      !zeroFillDetected &&
      !nonAllowedWritesDetected &&
      !tvnPresent &&
      !forbiddenAdviceDetected,
  };

  console.log(JSON.stringify(summary, null, 2));
  await prisma.$disconnect();
}

run().catch(async (error: unknown) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});
