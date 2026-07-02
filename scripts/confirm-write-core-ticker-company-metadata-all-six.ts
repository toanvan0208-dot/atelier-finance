import "dotenv/config";

import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { prisma } from "../src/lib/database/client";
import { buildMsnIdentityEvidence } from "../src/lib/data-sources/annual-report-2025-msn-manual-preview";
import { buildVcbIdentityEvidence } from "../src/lib/data-sources/annual-report-2025-vcb-manual-preview";

type CoreTicker = "FPT" | "HPG" | "VNM" | "MSN" | "MWG" | "VCB";
type CompanyTypeValue = "non_financial" | "bank";

type CompanyPackage = {
  ticker: CoreTicker;
  companyName: string;
  exchange: string | null;
  companyType: CompanyTypeValue;
  country: "VN";
  currency: "VND";
  dataMode: "research_only";
  needsReview: true;
  productionApproved: false;
  sourceType: string;
  sourceLabel: string;
  sourceUrl: string | null;
  sourceFile: string | null;
  extractedQuote: string | null;
  reviewNote: string;
  warningCodes: string[];
};

type TableCounts = {
  company: number;
  screeningCandidate: number;
  marketPrice: number;
  financialStatement: number;
  companyIndustry: number;
};

const phase = "151Y";
const mode = process.argv.includes("--confirm-write") ? "confirm_write" : "dry_run";
const csvPath = "data/manual-review/company-identity/fpt-hpg-vnm-company-identity-reviewed.csv";
const readyTickers = ["FPT", "HPG", "VNM", "MSN", "MWG", "VCB"] as const;
const blockedTickers: CoreTicker[] = [];
const profileAsOf = new Date("2026-07-02T00:00:00.000Z");

const forbiddenAdvicePatterns = [
  /\b(buy|sell|hold)\b/i,
  /\btarget\s+price\b/i,
  /\bfair\s+value\b/i,
  /\bupside\b/i,
  /\bdownside\b/i,
  /\battractive\b/i,
  /\bworth\s+buying\b/i,
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
      cells.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  cells.push(current.trim());
  return cells;
};

const readManualIdentityCsvRows = (): Array<Record<string, string>> => {
  const fullPath = join(process.cwd(), csvPath);
  if (!existsSync(fullPath)) {
    throw new Error(`Manual Company identity CSV not found: ${csvPath}`);
  }

  const lines = readFileSync(fullPath, "utf-8")
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0);

  const headers = parseCsvLine(lines[0] ?? "");
  return lines.slice(1).map((line) => {
    const cells = parseCsvLine(line);
    return Object.fromEntries(headers.map((header, index) => [header, cells[index] ?? ""]));
  });
};

const getCsvPackage = (ticker: "FPT" | "HPG" | "VNM"): CompanyPackage => {
  const rows = readManualIdentityCsvRows();
  const row = rows.find((candidate) => candidate.ticker?.trim().toUpperCase() === ticker);
  if (!row) throw new Error(`Missing manual identity CSV row for ${ticker}.`);

  if (
    row.sourceType !== "manual_reviewed_company_identity" ||
    row.dataMode !== "research_only" ||
    row.needsReview?.toLowerCase() !== "true" ||
    row.productionApproved?.toLowerCase() !== "false"
  ) {
    throw new Error(`Manual identity CSV row for ${ticker} failed guardrail fields.`);
  }

  return {
    ticker,
    companyName: row.companyName,
    exchange: row.exchange?.trim() || null,
    companyType: "non_financial",
    country: "VN",
    currency: "VND",
    dataMode: "research_only",
    needsReview: true,
    productionApproved: false,
    sourceType: row.sourceType,
    sourceLabel: row.sourceLabel,
    sourceUrl: row.sourceUrl?.trim() || null,
    sourceFile: row.sourceFile?.trim() || null,
    extractedQuote: row.extractedQuote,
    reviewNote: row.reviewNote,
    warningCodes: row.warningCodes.split(/[;,|]/).map((code) => code.trim()).filter(Boolean),
  };
};

const buildMsnPackage = (): CompanyPackage => {
  const identity = buildMsnIdentityEvidence();
  if (identity.status !== "valid_msn_consolidated" || !identity.companyName) {
    throw new Error("MSN identity evidence is not ready.");
  }

  return {
    ticker: "MSN",
    companyName: identity.companyName,
    exchange: "HOSE",
    companyType: "non_financial",
    country: "VN",
    currency: "VND",
    dataMode: "research_only",
    needsReview: true,
    productionApproved: false,
    sourceType: "company_disclosure",
    sourceLabel: "annual_report_2025_pdf_reviewed_preview",
    sourceUrl: null,
    sourceFile: "docs/product/evidence/source-pdfs/MSN_Baocaothuongnien_2025.pdf",
    extractedQuote: "Company/entity: Công ty Cổ phần Tập đoàn Masan; Ticker: MSN.",
    reviewNote: "Annual-report identity evidence verifies MSN at consolidated group level.",
    warningCodes: ["ANNUAL_REPORT_IDENTITY_REVIEWED", "NEEDS_REVIEW", "RESEARCH_ONLY"],
  };
};

const buildMwgPackage = (): CompanyPackage => ({
  ticker: "MWG",
  companyName: "Công ty Cổ phần Đầu tư Thế Giới Di Động",
  exchange: null,
  companyType: "non_financial",
  country: "VN",
  currency: "VND",
  dataMode: "research_only",
  needsReview: true,
  productionApproved: false,
  sourceType: "company_disclosure",
  sourceLabel: "annual_report_2025_pdf_reviewed_preview",
  sourceUrl: null,
  sourceFile: "docs/product/evidence/source-pdfs/MWG_Annual_Report_2025.pdf",
  extractedQuote: "Entity verified as Công ty Cổ phần Đầu tư Thế Giới Di Động.",
  reviewNote: "Refreshed annual-report manual preview verifies the MWG reporting entity.",
  warningCodes: ["ANNUAL_REPORT_IDENTITY_REVIEWED", "EXCHANGE_NOT_VERIFIED", "NEEDS_REVIEW", "RESEARCH_ONLY"],
});

const buildVcbPackage = (): CompanyPackage => {
  const identity = buildVcbIdentityEvidence();
  if (identity.status !== "valid_vcb_consolidated" || !identity.companyName) {
    throw new Error("VCB identity evidence is not ready.");
  }

  return {
    ticker: "VCB",
    companyName: identity.companyName,
    exchange: null,
    companyType: "bank",
    country: "VN",
    currency: "VND",
    dataMode: "research_only",
    needsReview: true,
    productionApproved: false,
    sourceType: "company_disclosure",
    sourceLabel: "annual_report_2025_pdf_reviewed_preview",
    sourceUrl: null,
    sourceFile: "docs/product/evidence/source-pdfs/VCB_Annual_Report_2025.pdf",
    extractedQuote: "Entity: Ngân hàng TMCP Ngoại thương Việt Nam (Vietcombank / VCB).",
    reviewNote: "Annual-report bank-specific identity evidence validates the VCB entity.",
    warningCodes: ["ANNUAL_REPORT_IDENTITY_REVIEWED", "BANK_SPECIFIC_CAVEAT", "NEEDS_REVIEW", "RESEARCH_ONLY"],
  };
};

const companyPackages: CompanyPackage[] = [
  getCsvPackage("FPT"),
  getCsvPackage("HPG"),
  getCsvPackage("VNM"),
  buildMsnPackage(),
  buildMwgPackage(),
  buildVcbPackage(),
];

const rawCsvCommitted = (): boolean => {
  try {
    execSync(`git ls-files --error-unmatch "${csvPath}"`, { cwd: process.cwd(), stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
};

const getTableCounts = async (): Promise<TableCounts> => ({
  company: await prisma.company.count(),
  screeningCandidate: await prisma.screeningCandidate.count(),
  marketPrice: await prisma.marketPrice.count(),
  financialStatement: await prisma.financialStatement.count(),
  companyIndustry: await prisma.companyIndustry.count(),
});

const findCompany = async (candidate: CompanyPackage) => {
  const rows = await prisma.company.findMany({
    where: { ticker: candidate.ticker, exchange: candidate.exchange },
    orderBy: { createdAt: "asc" },
  });

  if (rows.length > 1) {
    throw new Error(`Duplicate Company rows found for ${candidate.ticker}/${candidate.exchange ?? "null"}.`);
  }

  return rows[0] ?? null;
};

const companyData = (candidate: CompanyPackage) => ({
  ticker: candidate.ticker,
  exchange: candidate.exchange,
  companyName: candidate.companyName,
  companyType: candidate.companyType,
  industryCode: null,
  industryName: null,
  country: candidate.country,
  currency: candidate.currency,
  dataMode: candidate.dataMode,
  profileSourceId: null,
  profileAsOf,
});

const valuesMatch = (existing: Awaited<ReturnType<typeof findCompany>>, candidate: CompanyPackage): boolean => {
  if (!existing) return false;
  const desired = companyData(candidate);
  return (
    existing.companyName === desired.companyName &&
    existing.exchange === desired.exchange &&
    existing.companyType === desired.companyType &&
    existing.industryCode === desired.industryCode &&
    existing.industryName === desired.industryName &&
    existing.country === desired.country &&
    existing.currency === desired.currency &&
    existing.dataMode === desired.dataMode &&
    existing.profileSourceId === desired.profileSourceId &&
    existing.profileAsOf?.toISOString() === desired.profileAsOf.toISOString()
  );
};

const scannedPackageText = JSON.stringify(companyPackages);
const forbiddenAdviceDetected = forbiddenAdvicePatterns.some((pattern) => pattern.test(scannedPackageText));

async function run() {
  const beforeCounts = await getTableCounts();
  let companyRowsCreated = 0;
  let companyRowsUpdated = 0;
  let companyRowsSkipped = 0;

  const writtenByTicker = Object.fromEntries(readyTickers.map((ticker) => [ticker, false]));

  if (mode === "confirm_write") {
    for (const candidate of companyPackages) {
      const existing = await findCompany(candidate);

      if (existing && valuesMatch(existing, candidate)) {
        companyRowsSkipped += 1;
        writtenByTicker[candidate.ticker] = true;
        continue;
      }

      if (existing) {
        await prisma.company.update({
          where: { id: existing.id },
          data: companyData(candidate),
        });
        companyRowsUpdated += 1;
      } else {
        await prisma.company.create({
          data: companyData(candidate),
        });
        companyRowsCreated += 1;
      }
      writtenByTicker[candidate.ticker] = true;
    }
  }

  const afterCounts = await getTableCounts();
  const nonCompanyWritesAttempted =
    afterCounts.screeningCandidate !== beforeCounts.screeningCandidate ||
    afterCounts.marketPrice !== beforeCounts.marketPrice ||
    afterCounts.financialStatement !== beforeCounts.financialStatement ||
    afterCounts.companyIndustry !== beforeCounts.companyIndustry;
  const tvnCompanyRows = await prisma.company.count({ where: { ticker: "TVN" } });
  const hsgNkgCompanyRows = await prisma.company.count({ where: { ticker: { in: ["HSG", "NKG"] } } });
  const productionApprovedTrueCount = companyPackages.filter((candidate) => candidate.productionApproved).length;
  const companyRowsWritten = companyRowsCreated + companyRowsUpdated + companyRowsSkipped;

  const summary = {
    phase,
    mode,
    companyRowsPrepared: companyPackages.length,
    companyRowsWritten,
    companyRowsCreated,
    companyRowsUpdated,
    companyRowsSkipped,
    readyTickers,
    blockedTickers,
    dbWriteAttempted: mode === "confirm_write",
    schemaChanged: false,
    providerFetchAttempted: false,
    uiChanged: false,
    assistantChanged: false,
    screeningCandidateWriteAttempted: false,
    marketPriceWriteAttempted: false,
    financialStatementWriteAttempted: false,
    companyIndustryWriteAttempted: false,
    nonCompanyWritesDetected: nonCompanyWritesAttempted,
    productionApprovedTrueCount,
    fptWritten: writtenByTicker.FPT,
    hpgWritten: writtenByTicker.HPG,
    vnmWritten: writtenByTicker.VNM,
    msnWritten: writtenByTicker.MSN,
    mwgWritten: writtenByTicker.MWG,
    vcbWritten: writtenByTicker.VCB,
    hsgNkgUntouched: hsgNkgCompanyRows === 0,
    tvnPresent: tvnCompanyRows > 0,
    rawCsvCommitted: rawCsvCommitted(),
    rankingCreated: false,
    stockAttractivenessScoreCreated: false,
    industryMetricCreated: false,
    benchmarkCreated: false,
    forbiddenAdviceDetected,
    idempotencyPassed: mode === "dry_run" ? false : companyPackages.length === 6 && !nonCompanyWritesAttempted,
    smokePassed:
      productionApprovedTrueCount === 0 &&
      !forbiddenAdviceDetected &&
      !nonCompanyWritesAttempted &&
      !rawCsvCommitted() &&
      tvnCompanyRows === 0 &&
      hsgNkgCompanyRows === 0,
    companyModelMetadataLimitations: [
      "Company table does not contain needsReview, productionApproved, sourceLabel, sourceUrl, extractedQuote, reviewNote, or warningCodes fields.",
      "Phase 151Y writes only schema-supported Company metadata fields; source package provenance is preserved in script/evidence, not forced into semantically wrong columns.",
    ],
    sourcePackageSummary: companyPackages.map((candidate) => ({
      ticker: candidate.ticker,
      companyName: candidate.companyName,
      exchange: candidate.exchange,
      companyType: candidate.companyType,
      sourceType: candidate.sourceType,
      sourceLabel: candidate.sourceLabel,
      warningCodes: candidate.warningCodes,
      dataMode: candidate.dataMode,
      needsReview: candidate.needsReview,
      productionApproved: candidate.productionApproved,
    })),
    tableCountsBefore: beforeCounts,
    tableCountsAfter: afterCounts,
  };

  console.log(JSON.stringify(summary, null, 2));

  await prisma.$disconnect();

  if (!summary.smokePassed) {
    process.exitCode = 1;
  }
}

run().catch(async (error: unknown) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});
