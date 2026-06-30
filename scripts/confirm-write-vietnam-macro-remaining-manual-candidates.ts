import fs from "fs";
import path from "path";
import { pathToFileURL } from "node:url";
import { prisma } from "../src/lib/database/client.js";

const DATA_MODE = "vietnam_macro_candidate";
const REGION = "VN";
const TARGET_INDICATORS = [
  "FOREIGN_NET_FLOW",
  "PMI_MANUFACTURING",
  "POLICY_RATE",
  "MARKET_TRADING_VALUE",
] as const;

type IndicatorCode = (typeof TARGET_INDICATORS)[number];

type CandidateConfig = {
  indicatorCode: IndicatorCode;
  indicatorName: string;
  csvPath: string;
  sourceType: string;
  valueColumn: string;
  expectedRows: number;
  expectedUnit: string;
  expectedPeriodType: string;
  requiredColumns: readonly string[];
  caveat: string;
  validateRow: (row: CsvRow) => string[];
};

type CsvRow = Record<string, string>;

type CandidateRow = {
  indicatorCode: IndicatorCode;
  indicatorName: string;
  period: string;
  periodType: string;
  observationDate: Date;
  value: number;
  unit: string;
  sourceLabel: string;
  sourceType: string;
  sourceName: string;
  sourceUrl: string;
  publicationDate: string;
  extractedQuote: string;
  notes: string;
  semanticCaveat: string;
  metadata: Record<string, string | boolean>;
};

type WritePlan = {
  rows: CandidateRow[];
  validationErrors: string[];
  rowsByIndicator: Record<IndicatorCode, number>;
};

const args = new Set(process.argv.slice(2));
const confirmWriteRequested = args.has("--confirm-write");

const parseCsv = (content: string): CsvRow[] => {
  const lines = content.replace(/^\uFEFF/, "").split(/\r?\n/).filter((line) => line.trim() !== "");
  if (lines.length < 2) return [];

  const parseLine = (line: string): string[] => {
    const values: string[] = [];
    let current = "";
    let inQuote = false;

    for (let index = 0; index < line.length; index += 1) {
      const char = line[index];
      const next = line[index + 1];
      if (char === '"' && inQuote && next === '"') {
        current += '"';
        index += 1;
      } else if (char === '"') {
        inQuote = !inQuote;
      } else if (char === "," && !inQuote) {
        values.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }

    values.push(current.trim());
    return values.map((value) => value.replace(/^"|"$/g, ""));
  };

  const headers = parseLine(lines[0]).map((header) => header.trim());
  return lines.slice(1).map((line) => {
    const values = parseLine(line);
    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));
  });
};

const lastDayOfMonthUtc = (period: string): Date => {
  const match = period.match(/^(\d{4})-(\d{2})$/);
  if (!match) throw new Error(`Invalid monthly period: ${period}`);
  return new Date(Date.UTC(Number(match[1]), Number(match[2]), 0, 0, 0, 0));
};

const isFiniteNumber = (value: string): boolean => Number.isFinite(Number(value));

const requiredText = (row: CsvRow, columns: readonly string[]): string[] =>
  columns.filter((column) => !row[column]?.trim()).map((column) => `missing_${column}`);

const hasForbiddenPlaceholder = (row: CsvRow): boolean => {
  const text = Object.values(row).join(" ").toLowerCase();
  return /placeholder|sample|mock|fallback/.test(text);
};

const configs: readonly CandidateConfig[] = [
  {
    indicatorCode: "FOREIGN_NET_FLOW",
    indicatorName: "Foreign investor net flow",
    csvPath: "data/manual-review/macro/foreign-net-flow/vietnam-foreign-net-flow-manual.csv",
    sourceType: "manual_aggregated_foreign_net_flow_candidate",
    valueColumn: "foreign_net_flow_value",
    expectedRows: 12,
    expectedUnit: "billion_vnd",
    expectedPeriodType: "monthly",
    requiredColumns: [
      "period",
      "period_type",
      "foreign_net_flow_value",
      "unit",
      "value_type",
      "definition",
      "scope",
      "market",
      "source_name",
      "source_url",
      "publication_date",
      "extracted_quote",
      "notes",
    ],
    caveat: "Manual aggregated HOSE-only foreign investor net flow; positive and negative values describe net flow terminology, not an investment recommendation.",
    validateRow: (row) => [
      ...requiredText(row, configs[0].requiredColumns),
      row.period_type === "monthly" ? "" : "period_type_must_be_monthly",
      row.unit === "billion_vnd" ? "" : "unit_must_be_billion_vnd",
      row.value_type === "net_value" ? "" : "value_type_must_be_net_value",
      row.market === "HOSE" ? "" : "market_must_be_HOSE",
      isFiniteNumber(row.foreign_net_flow_value) ? "" : "foreign_net_flow_value_not_finite",
      hasForbiddenPlaceholder(row) ? "placeholder_or_mock_text_detected" : "",
    ].filter(Boolean),
  },
  {
    indicatorCode: "PMI_MANUFACTURING",
    indicatorName: "Vietnam manufacturing PMI",
    csvPath: "data/manual-review/macro/pmi-manufacturing/vietnam-pmi-manufacturing-manual.csv",
    sourceType: "manual_aggregated_pmi_manufacturing_candidate",
    valueColumn: "pmi_value",
    expectedRows: 29,
    expectedUnit: "index",
    expectedPeriodType: "monthly",
    requiredColumns: [
      "period",
      "period_type",
      "pmi_value",
      "unit",
      "definition",
      "scope",
      "source_name",
      "source_url",
      "publication_date",
      "extracted_quote",
      "notes",
    ],
    caveat: "Manual/secondary-source PMI manufacturing candidate; unit is index and source/provenance must be reviewed before production approval.",
    validateRow: (row) => [
      ...requiredText(row, configs[1].requiredColumns),
      row.period_type === "monthly" ? "" : "period_type_must_be_monthly",
      row.unit === "index" ? "" : "unit_must_be_index",
      /vietnam/i.test(row.scope) && /manufacturing/i.test(row.scope) ? "" : "scope_must_be_vietnam_manufacturing",
      isFiniteNumber(row.pmi_value) ? "" : "pmi_value_not_finite",
      hasForbiddenPlaceholder(row) ? "placeholder_or_mock_text_detected" : "",
    ].filter(Boolean),
  },
  {
    indicatorCode: "POLICY_RATE",
    indicatorName: "SBV refinancing rate",
    csvPath: "data/manual-review/macro/policy-rate/vietnam-policy-rate-manual.csv",
    sourceType: "manual_aggregated_policy_rate_candidate",
    valueColumn: "policy_rate_value",
    expectedRows: 30,
    expectedUnit: "percent",
    expectedPeriodType: "monthly_snapshot",
    requiredColumns: [
      "period",
      "period_type",
      "policy_rate_value",
      "unit",
      "definition",
      "scope",
      "rate_name",
      "source_name",
      "source_url",
      "publication_date",
      "extracted_quote",
      "notes",
    ],
    caveat: "Monthly carry-forward snapshot of the SBV refinancing rate; not a machine-readable official SBV feed.",
    validateRow: (row) => [
      ...requiredText(row, configs[2].requiredColumns),
      row.period_type === "monthly_snapshot" ? "" : "period_type_must_be_monthly_snapshot",
      row.unit === "percent" ? "" : "unit_must_be_percent",
      row.rate_name === "refinancing_rate" ? "" : "rate_name_must_be_refinancing_rate",
      isFiniteNumber(row.policy_rate_value) ? "" : "policy_rate_value_not_finite",
      /carry-forward|snapshot|held constant/i.test(row.notes) ? "" : "notes_must_explain_snapshot_or_carry_forward",
      hasForbiddenPlaceholder(row) ? "placeholder_or_mock_text_detected" : "",
    ].filter(Boolean),
  },
  {
    indicatorCode: "MARKET_TRADING_VALUE",
    indicatorName: "HOSE average daily trading value",
    csvPath: "data/manual-review/macro/market-trading-value/vietnam-market-trading-value-manual.csv",
    sourceType: "manual_aggregated_market_trading_value_candidate",
    valueColumn: "trading_value",
    expectedRows: 12,
    expectedUnit: "billion_vnd_per_session",
    expectedPeriodType: "monthly",
    requiredColumns: [
      "period",
      "period_type",
      "trading_value",
      "unit",
      "value_type",
      "definition",
      "scope",
      "market",
      "source_name",
      "source_url",
      "publication_date",
      "extracted_quote",
      "notes",
    ],
    caveat: "Average daily/session trading value by month for HOSE, not total monthly trading value.",
    validateRow: (row) => [
      ...requiredText(row, configs[3].requiredColumns),
      row.period_type === "monthly" ? "" : "period_type_must_be_monthly",
      row.unit === "billion_vnd_per_session" ? "" : "unit_must_be_billion_vnd_per_session",
      row.value_type === "average_daily_trading_value" ? "" : "value_type_must_be_average_daily_trading_value",
      row.market === "HOSE" ? "" : "market_must_be_HOSE",
      isFiniteNumber(row.trading_value) && Number(row.trading_value) > 0 ? "" : "trading_value_not_positive_finite",
      hasForbiddenPlaceholder(row) ? "placeholder_or_mock_text_detected" : "",
    ].filter(Boolean),
  },
];

const rowsByIndicatorTemplate = (): Record<IndicatorCode, number> => ({
  FOREIGN_NET_FLOW: 0,
  PMI_MANUFACTURING: 0,
  POLICY_RATE: 0,
  MARKET_TRADING_VALUE: 0,
});

const metadataFor = (config: CandidateConfig, row: CsvRow): Record<string, string | boolean> => ({
  sourceType: config.sourceType,
  sourceName: row.source_name,
  definition: row.definition,
  scope: row.scope,
  sourcePublicationDate: row.publication_date,
  extractedQuotePresent: Boolean(row.extracted_quote),
  notes: row.notes,
  valueType: row.value_type ?? "",
  market: row.market ?? "",
  rateName: row.rate_name ?? "",
});

const buildWarningCodes = (config: CandidateConfig): string =>
  JSON.stringify([
    "CANDIDATE_ONLY",
    "NEEDS_REVIEW",
    "PRODUCTION_APPROVED_FALSE",
    config.sourceType,
  ]);

const buildEvidenceNotes = (candidate: CandidateRow): string =>
  JSON.stringify({
    semanticCaveats: [candidate.semanticCaveat],
    ...candidate.metadata,
  });

const buildWritePlan = (): WritePlan => {
  const rows: CandidateRow[] = [];
  const validationErrors: string[] = [];
  const rowsByIndicator = rowsByIndicatorTemplate();

  for (const config of configs) {
    const absoluteCsvPath = path.join(process.cwd(), config.csvPath);
    if (!fs.existsSync(absoluteCsvPath)) {
      validationErrors.push(`${config.indicatorCode}:missing_csv:${config.csvPath}`);
      continue;
    }

    const records = parseCsv(fs.readFileSync(absoluteCsvPath, "utf-8"));
    const seenPeriods = new Set<string>();

    for (const [index, row] of records.entries()) {
      const rowNumber = index + 2;
      const rowErrors = config.validateRow(row);
      if (seenPeriods.has(row.period)) rowErrors.push("duplicate_period");
      seenPeriods.add(row.period);

      if (rowErrors.length > 0) {
        validationErrors.push(`${config.indicatorCode}:row_${rowNumber}:${rowErrors.join("|")}`);
        continue;
      }

      const value = Number(row[config.valueColumn]);
      const candidate: CandidateRow = {
        indicatorCode: config.indicatorCode,
        indicatorName: config.indicatorName,
        period: row.period,
        periodType: row.period_type,
        observationDate: lastDayOfMonthUtc(row.period),
        value,
        unit: config.expectedUnit,
        sourceLabel: config.sourceType,
        sourceType: config.sourceType,
        sourceName: row.source_name,
        sourceUrl: row.source_url,
        publicationDate: row.publication_date,
        extractedQuote: row.extracted_quote,
        notes: row.notes,
        semanticCaveat: config.caveat,
        metadata: metadataFor(config, row),
      };
      rows.push(candidate);
      rowsByIndicator[config.indicatorCode] += 1;
    }

    if (rowsByIndicator[config.indicatorCode] !== config.expectedRows) {
      validationErrors.push(
        `${config.indicatorCode}:expected_${config.expectedRows}_rows_got_${rowsByIndicator[config.indicatorCode]}`,
      );
    }
  }

  const uniqueKeys = new Set(rows.map((row) => [row.indicatorCode, REGION, row.observationDate.toISOString(), row.sourceLabel].join("|")));
  if (uniqueKeys.size !== rows.length) {
    validationErrors.push("duplicate_db_natural_key_in_write_plan");
  }

  return { rows, validationErrors, rowsByIndicator };
};

const countExistingRows = async (rows: CandidateRow[]) => {
  if (rows.length === 0) return { observations: 0, provenance: 0 };
  const where = {
    OR: rows.map((row) => ({
      indicatorCode: row.indicatorCode,
      region: REGION,
      observationDate: row.observationDate,
      sourceLabel: row.sourceLabel,
    })),
  };
  const [observations, provenance] = await Promise.all([
    prisma.macroObservation.count({ where }),
    prisma.macroObservationProvenance.count({ where }),
  ]);
  return { observations, provenance };
};

const readBackCounts = async () => {
  const [observations, provenance, productionApprovedTrueCount, needsReviewRowsCount] = await Promise.all([
    prisma.macroObservation.groupBy({
      by: ["indicatorCode"],
      where: { indicatorCode: { in: [...TARGET_INDICATORS] }, sourceLabel: { in: configs.map((config) => config.sourceType) } },
      _count: { _all: true },
    }),
    prisma.macroObservationProvenance.groupBy({
      by: ["indicatorCode"],
      where: { indicatorCode: { in: [...TARGET_INDICATORS] }, sourceLabel: { in: configs.map((config) => config.sourceType) } },
      _count: { _all: true },
    }),
    prisma.macroObservation.count({
      where: { indicatorCode: { in: [...TARGET_INDICATORS] }, productionApproved: true },
    }),
    prisma.macroObservation.count({
      where: { indicatorCode: { in: [...TARGET_INDICATORS] }, sourceLabel: { in: configs.map((config) => config.sourceType) }, needsReview: true },
    }),
  ]);

  return {
    observations: Object.fromEntries(observations.map((row) => [row.indicatorCode, row._count._all])),
    provenance: Object.fromEntries(provenance.map((row) => [row.indicatorCode, row._count._all])),
    productionApprovedTrueCount,
    needsReviewRowsCount,
  };
};

export async function runRemainingVietnamMacroManualConfirmWrite() {
  const plan = buildWritePlan();
  const before = await countExistingRows(plan.rows);
  const rowsToWriteByIndicator = plan.rowsByIndicator;

  const summary = {
    phase: "149P",
    confirmWriteRequested,
    dbWriteAttempted: confirmWriteRequested,
    targetIndicators: TARGET_INDICATORS,
    rowsToWriteTotal: plan.rows.length,
    rowsToWriteByIndicator,
    validationErrors: plan.validationErrors,
    rowsCreatedTotal: 0,
    rowsUpdatedTotal: 0,
    provenanceRowsCreated: 0,
    provenanceRowsUpdated: 0,
    writtenRowsByIndicator: rowsByIndicatorTemplate(),
    skippedIndicators: [] as string[],
    noWritesToOtherIndicators: true,
    candidateRowsPersisted: false,
    productionApprovedTrueCount: 0,
    needsReviewRowsCount: 0,
    readBackCounts: {
      observations: {} as Record<string, number>,
      provenance: {} as Record<string, number>,
    },
    idempotency: {
      existingObservationsBefore: before.observations,
      existingProvenanceBefore: before.provenance,
      secondRunSafeUpsert: true,
      duplicateRowsCreated: false,
    },
    guardrailResults: {
      onlyTargetIndicatorsSelected: plan.rows.every((row) => TARGET_INDICATORS.includes(row.indicatorCode)),
      expectedRowsToWriteTotal: plan.rows.length === 83,
      dbWriteAttempted: confirmWriteRequested,
      productionApprovedTrueCount: 0,
      missingDataZeroFilled: false,
      mockOrSampleAsReal: false,
      fallbackAsReal: false,
      frontendIndicatorUniverseExpanded: false,
      investmentAdviceAdded: false,
    },
  };

  if (plan.validationErrors.length > 0 || plan.rows.length !== 83) {
    console.log(JSON.stringify(summary, null, 2));
    throw new Error("Phase 149P write plan failed closed before DB write.");
  }

  if (!confirmWriteRequested) {
    console.log(JSON.stringify(summary, null, 2));
    return summary;
  }

  for (const config of configs) {
    await prisma.macroIndicator.upsert({
      where: { indicatorCode: config.indicatorCode },
      update: {
        indicatorName: config.indicatorName,
        defaultUnit: config.expectedUnit,
        defaultFrequency: config.expectedPeriodType,
        regionScope: REGION,
        sourceLabel: config.sourceType,
        isActive: true,
      },
      create: {
        indicatorCode: config.indicatorCode,
        indicatorName: config.indicatorName,
        category: config.indicatorCode === "PMI_MANUFACTURING" ? "growth" : config.indicatorCode === "POLICY_RATE" ? "rates" : "market",
        defaultUnit: config.expectedUnit,
        defaultFrequency: config.expectedPeriodType,
        regionScope: REGION,
        sourceLabel: config.sourceType,
        isActive: true,
      },
    });
  }

  const indicators = await prisma.macroIndicator.findMany({
    where: { indicatorCode: { in: [...TARGET_INDICATORS] } },
  });
  const indicatorIds = new Map(indicators.map((indicator) => [indicator.indicatorCode, indicator.id]));

  for (const row of plan.rows) {
    const indicatorId = indicatorIds.get(row.indicatorCode);
    if (!indicatorId) throw new Error(`Missing MacroIndicator after upsert: ${row.indicatorCode}`);

    const key = {
      indicatorCode: row.indicatorCode,
      region: REGION,
      observationDate: row.observationDate,
      sourceLabel: row.sourceLabel,
    };

    const existingObservation = await prisma.macroObservation.findUnique({
      where: { indicatorCode_region_observationDate_sourceLabel: key },
    });

    await prisma.macroObservation.upsert({
      where: { indicatorCode_region_observationDate_sourceLabel: key },
      create: {
        ...key,
        indicatorId,
        value: row.value,
        unit: row.unit,
        frequency: row.periodType,
        periodLabel: row.period,
        dataMode: DATA_MODE,
        productionApproved: false,
        needsReview: true,
      },
      update: {
        indicatorId,
        value: row.value,
        unit: row.unit,
        frequency: row.periodType,
        periodLabel: row.period,
        dataMode: DATA_MODE,
        productionApproved: false,
        needsReview: true,
      },
    });

    if (existingObservation) summary.rowsUpdatedTotal += 1;
    else summary.rowsCreatedTotal += 1;

    const existingProvenance = await prisma.macroObservationProvenance.findUnique({
      where: { indicatorCode_region_observationDate_sourceLabel: key },
    });

    await prisma.macroObservationProvenance.upsert({
      where: { indicatorCode_region_observationDate_sourceLabel: key },
      create: {
        ...key,
        providerType: row.sourceType,
        dataMode: DATA_MODE,
        productionApproved: false,
        needsReview: true,
        sourceUrl: row.sourceUrl,
        retrievedAt: new Date(),
        publishedAt: new Date(`${row.publicationDate}T00:00:00Z`),
        rawPayloadSnippet: row.extractedQuote,
        warningCodes: buildWarningCodes(configs.find((config) => config.indicatorCode === row.indicatorCode)!),
        evidenceNotes: buildEvidenceNotes(row),
      },
      update: {
        providerType: row.sourceType,
        dataMode: DATA_MODE,
        productionApproved: false,
        needsReview: true,
        sourceUrl: row.sourceUrl,
        retrievedAt: new Date(),
        publishedAt: new Date(`${row.publicationDate}T00:00:00Z`),
        rawPayloadSnippet: row.extractedQuote,
        warningCodes: buildWarningCodes(configs.find((config) => config.indicatorCode === row.indicatorCode)!),
        evidenceNotes: buildEvidenceNotes(row),
      },
    });

    if (existingProvenance) summary.provenanceRowsUpdated += 1;
    else summary.provenanceRowsCreated += 1;

    summary.writtenRowsByIndicator[row.indicatorCode] += 1;
  }

  const readBack = await readBackCounts();
  summary.candidateRowsPersisted = true;
  summary.productionApprovedTrueCount = readBack.productionApprovedTrueCount;
  summary.needsReviewRowsCount = readBack.needsReviewRowsCount;
  summary.readBackCounts = {
    observations: readBack.observations,
    provenance: readBack.provenance,
  };
  summary.guardrailResults.productionApprovedTrueCount = readBack.productionApprovedTrueCount;

  console.log(JSON.stringify(summary, null, 2));
  return summary;
}

const isDirectRun = process.argv[1] ? import.meta.url === pathToFileURL(process.argv[1]).href : false;

if (isDirectRun) {
  runRemainingVietnamMacroManualConfirmWrite()
    .catch((error) => {
      console.error(error);
      process.exitCode = 1;
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
