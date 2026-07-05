import "dotenv/config";

import { readFileSync } from "node:fs";

import {
  buildLongSafeFinancialStatementCandidates,
  LONG_SAFE_FINANCIALS_SOURCE_LABEL,
  parseLongSafeFinancialsCsv,
  type LongSafeFinancialStatementCandidate,
} from "../src/features/financials/lib/long-safe-financials-csv-import";

type WriteStats = {
  created: number;
  skipped: number;
  updated: number;
  written: number;
};

const DEFAULT_FILE = "D:\\financials_hpg_vnm_mwg_long_safe.csv";
const IMPORT_SOURCE_LABEL = LONG_SAFE_FINANCIALS_SOURCE_LABEL;
const SOURCE_NAME = IMPORT_SOURCE_LABEL;
const SOURCE_TYPE = "licensed_vendor" as const;
const DATA_MODE = "research_only" as const;

const args = process.argv.slice(2);
const hasArg = (name: string): boolean => args.includes(name);
const valueAfter = (name: string): string | null => {
  const index = args.indexOf(name);
  if (index === -1) return null;
  return args[index + 1] ?? null;
};

const mode = hasArg("--confirm-write") ? "confirm_write" : "dry_run";
const inputFile = valueAfter("--file") ?? DEFAULT_FILE;
const requiredConfirmFlags = [
  "--confirm-local-research-only",
  "--confirm-no-production-source",
  "--confirm-reviewed-dry-run",
] as const;

const emptyStats = (): WriteStats => ({ created: 0, skipped: 0, updated: 0, written: 0 });

const parseDate = (value: string | null): Date => {
  if (!value) return new Date("2026-07-04T00:00:00.000Z");
  const normalized = value.includes("T") ? value : value.replace(" ", "T");
  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? new Date("2026-07-04T00:00:00.000Z") : parsed;
};

const countComplete = (candidate: LongSafeFinancialStatementCandidate): number =>
  Object.values(candidate.values).filter((value) => value !== null).length;

const candidateToPreview = (candidate: LongSafeFinancialStatementCandidate) => ({
  fiscalYear: candidate.fiscalYear,
  grossMargin:
    candidate.values.revenue && candidate.values.grossProfit !== null
      ? Number((candidate.values.grossProfit / candidate.values.revenue * 100).toFixed(2))
      : null,
  missingFields: candidate.missingFields,
  netMargin:
    candidate.values.revenue && candidate.values.netIncome !== null
      ? Number((candidate.values.netIncome / candidate.values.revenue * 100).toFixed(2))
      : null,
  selectedRows: candidate.selectedRows,
  ticker: candidate.ticker,
  values: candidate.values,
});

const buildSummary = (candidates: LongSafeFinancialStatementCandidate[]) => {
  const byTicker = Object.fromEntries(
    Array.from(new Set(candidates.map((candidate) => candidate.ticker))).map((ticker) => [
      ticker,
      candidates
        .filter((candidate) => candidate.ticker === ticker)
        .sort((a, b) => a.fiscalYear - b.fiscalYear)
        .map(candidateToPreview),
    ]),
  );
  const completeEnough = candidates.filter((candidate) => countComplete(candidate) >= 3);

  return {
    candidateRows: candidates.length,
    completeEnoughRows: completeEnough.length,
    inputFile,
    mode,
    sourceLabel: IMPORT_SOURCE_LABEL,
    tickers: Object.keys(byTicker).sort(),
    years: Array.from(new Set(candidates.map((candidate) => candidate.fiscalYear))).sort(),
    byTicker,
  };
};

const ensureConfirmFlags = () => {
  const missing = requiredConfirmFlags.filter((flag) => !hasArg(flag));
  if (missing.length > 0) {
    throw new Error(`Confirm write requires explicit safety flags: ${missing.join(", ")}`);
  }
};

const writeCandidates = async (candidates: LongSafeFinancialStatementCandidate[]) => {
  ensureConfirmFlags();
  const { prisma } = await import("../src/lib/database/client");
  const stats = emptyStats();

  const source = await prisma.dataSource.upsert({
    where: {
      name_sourceType: {
        name: SOURCE_NAME,
        sourceType: SOURCE_TYPE,
      },
    },
    create: {
      accessMethod: "private_or_undocumented_api",
      cachingAllowed: "unknown",
      derivedDataAllowed: "unknown",
      licenseStatus: "needs_review",
      name: SOURCE_NAME,
      notes: "Research-only long-format financial statement CSV supplied by the local workspace. Runtime display remains research-only.",
      redistributionAllowed: "unknown",
      runtimeDisplayAllowed: "unknown",
      sourceType: SOURCE_TYPE,
      supportedDataGroups: JSON.stringify(["financial_statements"]),
      tosStatus: "needs_review",
      usageStatus: "research_only",
    },
    update: {
      notes: "Research-only long-format financial statement CSV supplied by the local workspace. Runtime display remains research-only.",
      supportedDataGroups: JSON.stringify(["financial_statements"]),
      usageStatus: "research_only",
    },
  });

  for (const candidate of candidates) {
    if (countComplete(candidate) < 3) {
      stats.skipped += 1;
      continue;
    }

    const company = await prisma.company.upsert({
      where: {
        ticker_exchange: {
          exchange: "HOSE",
          ticker: candidate.ticker,
        },
      },
      create: {
        companyName: candidate.ticker,
        companyType: "non_financial",
        country: "VN",
        currency: "VND",
        dataMode: "research_only",
        exchange: "HOSE",
        ticker: candidate.ticker,
      },
      update: {
        companyType: "non_financial",
        currency: "VND",
        dataMode: "research_only",
      },
    });
    const existing = await prisma.financialStatement.findFirst({
      where: {
        fiscalYear: candidate.fiscalYear,
        period: candidate.period,
        periodType: "year",
        sourceLabel: IMPORT_SOURCE_LABEL,
        ticker: candidate.ticker,
      },
    });
    const warningCodes = JSON.stringify(candidate.warningCodes);
    const missingFields = JSON.stringify(candidate.missingFields);
    const data = {
      asOf: parseDate(candidate.fetchedAt),
      collectedAt: parseDate(candidate.fetchedAt),
      companyId: company.id,
      companyType: "non_financial" as const,
      currency: "VND",
      dataMode: DATA_MODE,
      eps: candidate.values.eps,
      errorCodes: JSON.stringify([]),
      fiscalYear: candidate.fiscalYear,
      grossProfit: candidate.values.grossProfit,
      missingFields,
      netIncome: candidate.values.netIncome,
      operatingCashFlow: candidate.values.operatingCashFlow,
      period: candidate.period,
      periodType: "year" as const,
      qualityStatus: candidate.missingFields.length === 0 ? "usable_with_caution" as const : "partial" as const,
      readiness: "needs_review" as const,
      reportDate: new Date(`${candidate.fiscalYear}-12-31T00:00:00.000Z`),
      revenue: candidate.values.revenue,
      sourceId: source.id,
      sourceLabel: IMPORT_SOURCE_LABEL,
      sourceType: SOURCE_TYPE,
      ticker: candidate.ticker,
      unit: "VND",
      warningCodes,
    };

    const statement = existing
      ? await prisma.financialStatement.update({ where: { id: existing.id }, data })
      : await prisma.financialStatement.create({ data });

    const sidecarFields = [
      ["revenue", candidate.values.revenue, "vnd"],
      ["netIncome", candidate.values.netIncome, "vnd"],
      ["operatingCashFlow", candidate.values.operatingCashFlow, "vnd"],
      ["eps", candidate.values.eps, "vnd_per_share"],
    ] as const;

    await Promise.all(
      sidecarFields.map(([field, value, unit]) =>
        prisma.financialStatementUnitMetadata.upsert({
          where: {
            financialStatementId_field: {
              field,
              financialStatementId: statement.id,
            },
          },
          create: {
            dataMode: DATA_MODE,
            field,
            financialStatementId: statement.id,
            productionApproved: false,
            sourceLabel: IMPORT_SOURCE_LABEL,
            status: value === null ? "missing" : "explicit",
            unit: value === null ? "unknown" : unit,
            warningCodes,
          },
          update: {
            dataMode: DATA_MODE,
            productionApproved: false,
            sourceLabel: IMPORT_SOURCE_LABEL,
            status: value === null ? "missing" : "explicit",
            unit: value === null ? "unknown" : unit,
            warningCodes,
          },
        }),
      ),
    );

    stats.written += 1;
    if (existing) stats.updated += 1;
    else stats.created += 1;
  }

  await prisma.$disconnect();
  return stats;
};

const run = async () => {
  const rows = parseLongSafeFinancialsCsv(readFileSync(inputFile, "utf8"));
  const candidates = buildLongSafeFinancialStatementCandidates(rows);

  if (mode === "dry_run") {
    console.log(JSON.stringify({ ...buildSummary(candidates), writeAttempted: false }, null, 2));
    return;
  }

  const stats = await writeCandidates(candidates);
  console.log(JSON.stringify({ ...buildSummary(candidates), stats, writeAttempted: true }, null, 2));
};

run().catch((error) => {
  console.error(error instanceof Error ? error.message : "Unknown import failure");
  process.exit(1);
});
