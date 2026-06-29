import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const TARGET_INDICATORS = [
  "USD_VND",
  "EXPORT_GROWTH",
  "CREDIT_GROWTH",
  "PUBLIC_INVESTMENT",
] as const;

const USD_VND_SOURCE_URL =
  "https://portal.vietcombank.com.vn/Usercontrols/TVPortal.TyGia/pXML.aspx";

const EXPECTED_CSV_FILES = {
  EXPORT_GROWTH: [
    "data/manual-review/macro/export-growth/gso-export-value-2024.csv",
    "data/manual-review/macro/export-growth/gso-export-value-2025.csv",
    "data/manual-review/macro/export-growth/gso-export-value-2026.csv",
  ],
  CREDIT_GROWTH: [
    "data/manual-review/macro/credit-growth/credit-growth-2025-2026-manual-aggregated.csv",
  ],
  PUBLIC_INVESTMENT: [
    "data/manual-review/macro/public-investment/public-investment-2025-2026-clean.csv",
  ],
} as const;

type IndicatorCode = (typeof TARGET_INDICATORS)[number];
type ParserStatus = "success" | "partial" | "blocked" | "semantic_review_required";

type CandidateProvenance = {
  sourceUrl?: string;
  sourceFile?: string;
  fetchedAt?: string;
  fileChecksum?: string;
  payloadChecksum?: string;
  contentType?: string | null;
  sourceName: string;
  sourceType: string;
  evidenceNotes: string[];
};

type CandidateRow = {
  indicatorCode: IndicatorCode;
  period: string;
  periodType: string;
  value: number;
  unit: string;
  sourceName: string;
  sourceType: string;
  sourceUrl?: string;
  sourceFile?: string;
  dataMode: "research_only";
  needsReview: true;
  productionApproved: false;
  parserStatus: ParserStatus;
  semanticCaveats: string[];
  provenance: CandidateProvenance;
  rateType?: "commercial_bank_quote";
  quoteField?: "buy" | "transfer" | "sell";
  sourceInstitution?: string;
  notSbvCentralRate?: true;
  derivedFrom?: string;
  derivedFormula?: string;
  notOfficialMachineReadableSbvCsv?: true;
};

type ParserResult = {
  indicatorCode: IndicatorCode;
  parserAttempted: boolean;
  parserSucceeded: boolean;
  parserStatus: ParserStatus;
  candidateRows: CandidateRow[];
  candidateProvenanceRows: CandidateProvenance[];
  numericValuesExtracted: number;
  blockedReasons: string[];
  warnings: string[];
  csvFilesExpected?: string[];
  csvFilesFound?: string[];
  missingCsvFiles?: string[];
  providerFetchAttempted?: boolean;
  providerFetchSucceeded?: boolean;
};

type DryRunSummary = {
  phase: "149C";
  mode: "dry_run";
  targetIndicators: IndicatorCode[];
  dbWriteAttempted: false;
  candidateRowsPersisted: false;
  observationRowsCreated: 0;
  provenanceRowsCreated: 0;
  productionApprovedTrueCount: 0;
  providerFetchAttempted: boolean;
  providerFetchSucceeded: boolean;
  csvFilesRead: boolean;
  csvFilesExpected: string[];
  csvFilesFound: string[];
  missingCsvFiles: string[];
  parserAttemptedByIndicator: Record<IndicatorCode, boolean>;
  parserSucceededByIndicator: Record<IndicatorCode, boolean>;
  candidateRowsByIndicator: Record<IndicatorCode, number>;
  candidateProvenanceRowsByIndicator: Record<IndicatorCode, number>;
  numericValuesExtracted: number;
  needsReviewTrueCount: number;
  semanticCaveats: Record<IndicatorCode, string[]>;
  usdVndRateType: string | null;
  usdVndNotSbvCentralRate: boolean;
  exportGrowthDerivedFormula: string;
  exportGrowthSourcePeriodDetection: string;
  exportGrowthNotDirectPublishedGrowth: boolean;
  creditGrowthSourceMode: string;
  creditGrowthProvenanceQuality: string;
  publicInvestmentUnitBreakdown: Record<string, number>;
  publicInvestmentSourceMode: string;
  manualReviewRequiredBeforeConfirmWrite: true;
  missingDataZeroFilled: false;
  parserResults: ParserResult[];
};

const normalizeText = (value: string): string =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .trim()
    .toLowerCase();

const checksum = (value: string | Buffer): string =>
  createHash("sha256").update(value).digest("hex");

const parseNumeric = (value: string): number | null => {
  const cleaned = value.trim().replace(/,/g, "").replace(/\s+/g, "");
  if (!cleaned || cleaned === "-") return null;
  const numeric = Number(cleaned);
  return Number.isFinite(numeric) ? numeric : null;
};

const parseCsv = (content: string, delimiter = ","): string[][] => {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  for (let index = 0; index < content.length; index += 1) {
    const char = content[index];
    const next = content[index + 1];

    if (char === '"' && inQuotes && next === '"') {
      cell += '"';
      index += 1;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === delimiter && !inQuotes) {
      row.push(cell);
      cell = "";
    } else if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(cell);
      if (row.some((value) => value.trim().length > 0)) rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }

  row.push(cell);
  if (row.some((value) => value.trim().length > 0)) rows.push(row);
  return rows;
};

const rowsToObjects = (rows: string[][]): Array<Record<string, string>> => {
  const [header, ...body] = rows;
  if (!header) return [];
  const keys = header.map((value) => value.trim().replace(/^\uFEFF/, ""));
  return body.map((row) =>
    Object.fromEntries(keys.map((key, index) => [key, row[index]?.trim() ?? ""])),
  );
};

const readTextFile = (path: string): string => {
  const buffer = readFileSync(path);
  return buffer.toString("utf8").replace(/^\uFEFF/, "");
};

const getMissingFiles = (paths: readonly string[]): string[] =>
  paths.filter((path) => !existsSync(path));

const getFoundFiles = (paths: readonly string[]): string[] =>
  paths.filter((path) => existsSync(path));

const extractXmlAttributes = (tag: string): Record<string, string> => {
  const attributes: Record<string, string> = {};
  const pattern = /([A-Za-z]+)="([^"]*)"/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(tag)) !== null) {
    attributes[match[1]] = match[2];
  }
  return attributes;
};

const fetchWithTimeout = async (url: string, timeoutMs: number): Promise<Response> => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
};

async function parseUsdVnd(): Promise<ParserResult> {
  const fetchedAt = new Date().toISOString();
  try {
    const response = await fetchWithTimeout(USD_VND_SOURCE_URL, 20_000);
    const xml = await response.text();
    const contentType = response.headers.get("content-type");
    const usdMatch = xml.match(/<Exrate\b[^>]*CurrencyCode="USD"[^>]*\/?>/i);

    if (!response.ok) {
      return {
        indicatorCode: "USD_VND",
        parserAttempted: true,
        parserSucceeded: false,
        parserStatus: "blocked",
        candidateRows: [],
        candidateProvenanceRows: [],
        numericValuesExtracted: 0,
        blockedReasons: [`HTTP_${response.status}`],
        warnings: [],
        providerFetchAttempted: true,
        providerFetchSucceeded: false,
      };
    }

    if (!usdMatch) {
      return {
        indicatorCode: "USD_VND",
        parserAttempted: true,
        parserSucceeded: false,
        parserStatus: "blocked",
        candidateRows: [],
        candidateProvenanceRows: [],
        numericValuesExtracted: 0,
        blockedReasons: ["USD_ROW_NOT_FOUND"],
        warnings: [],
        providerFetchAttempted: true,
        providerFetchSucceeded: true,
      };
    }

    const attributes = extractXmlAttributes(usdMatch[0]);
    const transferValue = parseNumeric(attributes.Transfer ?? "");
    const buyValue = parseNumeric(attributes.Buy ?? "");
    const sellValue = parseNumeric(attributes.Sell ?? "");
    const selectedQuote =
      transferValue !== null
        ? { field: "transfer" as const, value: transferValue }
        : buyValue !== null
          ? { field: "buy" as const, value: buyValue }
          : sellValue !== null
            ? { field: "sell" as const, value: sellValue }
            : null;

    if (!selectedQuote) {
      return {
        indicatorCode: "USD_VND",
        parserAttempted: true,
        parserSucceeded: false,
        parserStatus: "semantic_review_required",
        candidateRows: [],
        candidateProvenanceRows: [],
        numericValuesExtracted: 0,
        blockedReasons: ["XML_STRUCTURE_UNSTABLE"],
        warnings: ["USD row found but no numeric buy/transfer/sell quote was available."],
        providerFetchAttempted: true,
        providerFetchSucceeded: true,
      };
    }

    const provenance: CandidateProvenance = {
      sourceUrl: USD_VND_SOURCE_URL,
      fetchedAt,
      payloadChecksum: checksum(xml),
      contentType,
      sourceName: "Vietcombank Exchange Rate XML API",
      sourceType: "vietcombank_xml_candidate",
      evidenceNotes: [
        "Reachability and parser dry-run only; no DB write.",
        "VCB XML quote is a commercial bank quote, not SBV central rate.",
      ],
    };

    const candidate: CandidateRow = {
      indicatorCode: "USD_VND",
      period: fetchedAt.slice(0, 10),
      periodType: "day",
      value: selectedQuote.value,
      unit: "vnd_per_usd",
      sourceName: "Vietcombank",
      sourceType: "vietcombank_xml_candidate",
      sourceUrl: USD_VND_SOURCE_URL,
      dataMode: "research_only",
      needsReview: true,
      productionApproved: false,
      parserStatus: "success",
      semanticCaveats: [
        "USD_VND candidate uses Vietcombank commercial bank quote, not SBV central rate.",
      ],
      provenance,
      rateType: "commercial_bank_quote",
      quoteField: selectedQuote.field,
      sourceInstitution: "Vietcombank",
      notSbvCentralRate: true,
    };

    return {
      indicatorCode: "USD_VND",
      parserAttempted: true,
      parserSucceeded: true,
      parserStatus: "success",
      candidateRows: [candidate],
      candidateProvenanceRows: [provenance],
      numericValuesExtracted: 1,
      blockedReasons: [],
      warnings: [],
      providerFetchAttempted: true,
      providerFetchSucceeded: true,
    };
  } catch (error) {
    return {
      indicatorCode: "USD_VND",
      parserAttempted: true,
      parserSucceeded: false,
      parserStatus: "blocked",
      candidateRows: [],
      candidateProvenanceRows: [],
      numericValuesExtracted: 0,
      blockedReasons: ["PROVIDER_FETCH_FAILED"],
      warnings: [error instanceof Error ? error.message : "Unknown fetch error"],
      providerFetchAttempted: true,
      providerFetchSucceeded: false,
    };
  }
}

const isExportTotalRow = (row: string[]): boolean =>
  row.some((cell) => {
    const normalized = normalizeText(cell);
    return normalized === "tong so" || /^t.ng s.$/.test(normalized);
  });

const parseExportFile = (
  path: string,
): { year: string; monthlyValues: number[]; reportedTotal: number | null; checksumValue: string } => {
  const content = readTextFile(path);
  const rows = parseCsv(content, ";");
  const totalRow = rows.find(isExportTotalRow);
  if (!totalRow) {
    throw new Error(`TOTAL_ROW_NOT_FOUND:${path}`);
  }

  const values = totalRow
    .map((cell) => parseNumeric(cell))
    .filter((value): value is number => value !== null);
  const yearMatch = path.match(/20\d{2}/);
  if (!yearMatch) {
    throw new Error(`YEAR_NOT_FOUND:${path}`);
  }

  return {
    year: yearMatch[0],
    monthlyValues: values.length > 1 ? values.slice(0, -1) : values,
    reportedTotal: values.length > 1 ? values[values.length - 1] : null,
    checksumValue: checksum(content),
  };
};

function parseExportGrowth(): ParserResult {
  const expected = EXPECTED_CSV_FILES.EXPORT_GROWTH;
  const missing = getMissingFiles(expected);
  const found = getFoundFiles(expected);

  if (missing.length > 0) {
    return {
      indicatorCode: "EXPORT_GROWTH",
      parserAttempted: true,
      parserSucceeded: false,
      parserStatus: "blocked",
      candidateRows: [],
      candidateProvenanceRows: [],
      numericValuesExtracted: 0,
      blockedReasons: ["MISSING_REQUIRED_CSV_FILES"],
      warnings: missing,
      csvFilesExpected: [...expected],
      csvFilesFound: found,
      missingCsvFiles: missing,
    };
  }

  try {
    const parsed = Object.fromEntries(expected.map((path) => [path, parseExportFile(path)]));
    const byYear = Object.fromEntries(Object.values(parsed).map((item) => [item.year, item]));
    const candidates: CandidateRow[] = [];
    const provenances: CandidateProvenance[] = [];

    const createCandidate = (
      period: string,
      periodType: string,
      currentTotal: number,
      priorTotal: number,
      sourceFile: string,
    ): void => {
      if (priorTotal === 0) return;
      const value = ((currentTotal - priorTotal) / priorTotal) * 100;
      const content = readTextFile(sourceFile);
      const provenance: CandidateProvenance = {
        sourceFile,
        fileChecksum: checksum(content),
        sourceName: "GSO manual export value CSV",
        sourceType: "gso_manual_csv_derived_candidate",
        evidenceNotes: [
          "Derived from export value CSV, not directly published growth.",
          "Formula: (currentPeriodExportValue - priorPeriodExportValue) / priorPeriodExportValue * 100.",
        ],
      };
      provenances.push(provenance);
      candidates.push({
        indicatorCode: "EXPORT_GROWTH",
        period,
        periodType,
        value,
        unit: "percent_yoy",
        sourceName: "GSO manual export value CSV",
        sourceType: "gso_manual_csv_derived_candidate",
        sourceFile,
        dataMode: "research_only",
        needsReview: true,
        productionApproved: false,
        parserStatus: "success",
        semanticCaveats: [
          "EXPORT_GROWTH is derived from GSO export value CSV, not directly published growth.",
        ],
        provenance,
        derivedFrom: "export_value_1000_usd",
        derivedFormula:
          "(currentPeriodExportValue - priorPeriodExportValue) / priorPeriodExportValue * 100",
      });
    };

    const values2024 = byYear["2024"]?.monthlyValues ?? [];
    const values2025 = byYear["2025"]?.monthlyValues ?? [];
    const values2026 = byYear["2026"]?.monthlyValues ?? [];
    const total2024 =
      byYear["2024"]?.reportedTotal ?? values2024.reduce((sum, value) => sum + value, 0);
    const total2025 =
      byYear["2025"]?.reportedTotal ?? values2025.reduce((sum, value) => sum + value, 0);
    const total2026Ytd =
      byYear["2026"]?.reportedTotal ?? values2026.reduce((sum, value) => sum + value, 0);

    if (values2024.length >= 12 && values2025.length >= 12) {
      createCandidate(
        "2025",
        "year",
        total2025,
        total2024,
        expected[1],
      );
    }

    if (values2026.length > 0 && values2025.length >= values2026.length) {
      createCandidate(
        `2026-YTD-${values2026.length}M`,
        "ytd",
        total2026Ytd,
        values2025.slice(0, values2026.length).reduce((sum, value) => sum + value, 0),
        expected[2],
      );
    }

    return {
      indicatorCode: "EXPORT_GROWTH",
      parserAttempted: true,
      parserSucceeded: candidates.length > 0,
      parserStatus: candidates.length > 0 ? "success" : "blocked",
      candidateRows: candidates,
      candidateProvenanceRows: provenances,
      numericValuesExtracted: candidates.length,
      blockedReasons: candidates.length > 0 ? [] : ["INSUFFICIENT_PERIOD_OVERLAP"],
      warnings: [],
      csvFilesExpected: [...expected],
      csvFilesFound: found,
      missingCsvFiles: [],
    };
  } catch (error) {
    return {
      indicatorCode: "EXPORT_GROWTH",
      parserAttempted: true,
      parserSucceeded: false,
      parserStatus: "blocked",
      candidateRows: [],
      candidateProvenanceRows: [],
      numericValuesExtracted: 0,
      blockedReasons: ["EXPORT_GROWTH_PARSE_FAILED"],
      warnings: [error instanceof Error ? error.message : "Unknown parser error"],
      csvFilesExpected: [...expected],
      csvFilesFound: found,
      missingCsvFiles: [],
    };
  }
}

function validateColumns(
  rows: Array<Record<string, string>>,
  requiredColumns: string[],
): string[] {
  const columns = new Set(Object.keys(rows[0] ?? {}));
  return requiredColumns.filter((column) => !columns.has(column));
}

const inferPeriodType = (period: string): string =>
  period.includes("-Q") ? "quarterly_ytd" : period.length === 7 ? "monthly_ytd" : "unknown";

const normalizeCreditUnit = (unit: string): string =>
  unit.trim() === "%" ? "percent_ytd" : unit.trim();

const definitionLooksLikeCreditGrowth = (definition: string): boolean => {
  const normalized = normalizeText(definition);
  return (
    normalized.includes("tang truong tin dung") ||
    normalized.includes("tin dung") ||
    (/t.{1,8}ng/.test(normalized) &&
      /t.{1,8}n/.test(normalized) &&
      /d.{1,8}ng/.test(normalized))
  );
};

function parseCreditGrowth(): ParserResult {
  const expected = EXPECTED_CSV_FILES.CREDIT_GROWTH;
  const missing = getMissingFiles(expected);
  const found = getFoundFiles(expected);

  if (missing.length > 0) {
    return {
      indicatorCode: "CREDIT_GROWTH",
      parserAttempted: true,
      parserSucceeded: false,
      parserStatus: "blocked",
      candidateRows: [],
      candidateProvenanceRows: [],
      numericValuesExtracted: 0,
      blockedReasons: ["MISSING_REQUIRED_CSV_FILES"],
      warnings: missing,
      csvFilesExpected: [...expected],
      csvFilesFound: found,
      missingCsvFiles: missing,
    };
  }

  const sourceFile = expected[0];
  const content = readTextFile(sourceFile);
  const rows = rowsToObjects(parseCsv(content));
  const requiredColumns = [
    "period",
    "credit_growth_value",
    "unit",
    "definition",
    "scope",
    "source_name",
    "source_url",
    "publication_date",
    "extracted_quote",
    "notes",
  ];
  const missingColumns = validateColumns(rows, requiredColumns);
  const weakRows = rows.filter((row) => !row.source_url || !row.extracted_quote);

  if (missingColumns.length > 0) {
    return {
      indicatorCode: "CREDIT_GROWTH",
      parserAttempted: true,
      parserSucceeded: false,
      parserStatus: "blocked",
      candidateRows: [],
      candidateProvenanceRows: [],
      numericValuesExtracted: 0,
      blockedReasons: ["MISSING_REQUIRED_COLUMNS"],
      warnings: missingColumns,
      csvFilesExpected: [...expected],
      csvFilesFound: found,
      missingCsvFiles: [],
    };
  }

  const candidates: CandidateRow[] = [];
  const provenances: CandidateProvenance[] = [];
  for (const row of rows) {
    const value = parseNumeric(row.credit_growth_value);
    const validDefinition = definitionLooksLikeCreditGrowth(row.definition);
    const periodType = row.period_type || inferPeriodType(row.period);
    if (value === null || normalizeCreditUnit(row.unit) !== "percent_ytd" || !validDefinition) continue;
    const provenance: CandidateProvenance = {
      sourceFile,
      sourceUrl: row.source_url,
      fileChecksum: checksum(content),
      sourceName: row.source_name,
      sourceType: "manual_aggregated_sbv_news_candidate",
      evidenceNotes: [
        "Manually aggregated from SBV/news/publication sources, not an official machine-readable SBV CSV.",
        row.extracted_quote,
      ],
    };
    provenances.push(provenance);
    candidates.push({
      indicatorCode: "CREDIT_GROWTH",
      period: row.period,
      periodType,
      value,
      unit: "percent_ytd",
      sourceName: row.source_name,
      sourceType: "manual_aggregated_sbv_news_candidate",
      sourceUrl: row.source_url,
      sourceFile,
      dataMode: "research_only",
      needsReview: true,
      productionApproved: false,
      parserStatus: weakRows.includes(row) ? "partial" : "success",
      semanticCaveats: [
        "CREDIT_GROWTH is manually aggregated from SBV/news/publication sources, not an official machine-readable SBV CSV.",
      ],
      provenance,
      notOfficialMachineReadableSbvCsv: true,
    });
  }

  return {
    indicatorCode: "CREDIT_GROWTH",
    parserAttempted: true,
    parserSucceeded: candidates.length > 0,
    parserStatus: weakRows.length > 0 ? "partial" : candidates.length > 0 ? "success" : "blocked",
    candidateRows: candidates,
    candidateProvenanceRows: provenances,
    numericValuesExtracted: candidates.length,
    blockedReasons: candidates.length > 0 ? [] : ["NO_VALID_CREDIT_GROWTH_ROWS"],
    warnings: weakRows.length > 0 ? [`rowsWithWeakProvenance=${weakRows.length}`] : [],
    csvFilesExpected: [...expected],
    csvFilesFound: found,
    missingCsvFiles: [],
  };
}

function parsePublicInvestment(): ParserResult {
  const expected = EXPECTED_CSV_FILES.PUBLIC_INVESTMENT;
  const missing = getMissingFiles(expected);
  const found = getFoundFiles(expected);

  if (missing.length > 0) {
    return {
      indicatorCode: "PUBLIC_INVESTMENT",
      parserAttempted: true,
      parserSucceeded: false,
      parserStatus: "blocked",
      candidateRows: [],
      candidateProvenanceRows: [],
      numericValuesExtracted: 0,
      blockedReasons: ["MISSING_REQUIRED_CSV_FILES"],
      warnings: missing,
      csvFilesExpected: [...expected],
      csvFilesFound: found,
      missingCsvFiles: missing,
    };
  }

  const sourceFile = expected[0];
  const content = readTextFile(sourceFile);
  const rows = rowsToObjects(parseCsv(content));
  const requiredColumns = [
    "period",
    "period_type",
    "public_investment_value",
    "unit",
    "definition",
    "scope",
    "plan_basis",
    "source_name",
    "source_url",
    "publication_date",
    "extracted_quote",
    "notes",
  ];
  const missingColumns = validateColumns(rows, requiredColumns);
  const weakRows = rows.filter((row) => !row.source_url || !row.extracted_quote);

  if (missingColumns.length > 0) {
    return {
      indicatorCode: "PUBLIC_INVESTMENT",
      parserAttempted: true,
      parserSucceeded: false,
      parserStatus: "blocked",
      candidateRows: [],
      candidateProvenanceRows: [],
      numericValuesExtracted: 0,
      blockedReasons: ["MISSING_REQUIRED_COLUMNS"],
      warnings: missingColumns,
      csvFilesExpected: [...expected],
      csvFilesFound: found,
      missingCsvFiles: [],
    };
  }

  const candidates: CandidateRow[] = [];
  const provenances: CandidateProvenance[] = [];
  for (const row of rows) {
    const value = parseNumeric(row.public_investment_value);
    const unitAllowed = row.unit === "billion_vnd" || row.unit === "percent_of_plan_ytd";
    if (
      value === null ||
      !unitAllowed ||
      !row.definition ||
      !row.scope ||
      !row.plan_basis
    ) {
      continue;
    }

    const provenance: CandidateProvenance = {
      sourceFile,
      sourceUrl: row.source_url,
      fileChecksum: checksum(content),
      sourceName: row.source_name,
      sourceType: "manual_aggregated_public_investment_candidate",
      evidenceNotes: [
        "Manual public investment candidate; unit determines whether value is amount or plan progress.",
        row.extracted_quote,
      ],
    };
    provenances.push(provenance);
    candidates.push({
      indicatorCode: "PUBLIC_INVESTMENT",
      period: row.period,
      periodType: row.period_type,
      value,
      unit: row.unit,
      sourceName: row.source_name,
      sourceType: "manual_aggregated_public_investment_candidate",
      sourceUrl: row.source_url,
      sourceFile,
      dataMode: "research_only",
      needsReview: true,
      productionApproved: false,
      parserStatus: weakRows.includes(row) ? "partial" : "success",
      semanticCaveats: [
        "PUBLIC_INVESTMENT rows may represent either value in billion_vnd or progress as percent_of_plan_ytd; unit must determine interpretation.",
      ],
      provenance,
    });
  }

  return {
    indicatorCode: "PUBLIC_INVESTMENT",
    parserAttempted: true,
    parserSucceeded: candidates.length > 0,
    parserStatus: weakRows.length > 0 ? "partial" : candidates.length > 0 ? "success" : "blocked",
    candidateRows: candidates,
    candidateProvenanceRows: provenances,
    numericValuesExtracted: candidates.length,
    blockedReasons: candidates.length > 0 ? [] : ["NO_VALID_PUBLIC_INVESTMENT_ROWS"],
    warnings: weakRows.length > 0 ? [`rowsWithWeakProvenance=${weakRows.length}`] : [],
    csvFilesExpected: [...expected],
    csvFilesFound: found,
    missingCsvFiles: [],
  };
}

export async function runVietnamMacroParserDryRunBatch(): Promise<DryRunSummary> {
  const results = [
    await parseUsdVnd(),
    parseExportGrowth(),
    parseCreditGrowth(),
    parsePublicInvestment(),
  ];

  const allCandidates = results.flatMap((result) => result.candidateRows);
  const allExpectedCsv = [
    ...EXPECTED_CSV_FILES.EXPORT_GROWTH,
    ...EXPECTED_CSV_FILES.CREDIT_GROWTH,
    ...EXPECTED_CSV_FILES.PUBLIC_INVESTMENT,
  ];
  const allFoundCsv = results.flatMap((result) => result.csvFilesFound ?? []);
  const allMissingCsv = results.flatMap((result) => result.missingCsvFiles ?? []);

  const byIndicator = <T>(selector: (result: ParserResult) => T): Record<IndicatorCode, T> =>
    Object.fromEntries(results.map((result) => [result.indicatorCode, selector(result)])) as Record<
      IndicatorCode,
      T
    >;

  const publicInvestmentUnitBreakdown = allCandidates
    .filter((candidate) => candidate.indicatorCode === "PUBLIC_INVESTMENT")
    .reduce<Record<string, number>>((accumulator, candidate) => {
      accumulator[candidate.unit] = (accumulator[candidate.unit] ?? 0) + 1;
      return accumulator;
    }, {});

  return {
    phase: "149C",
    mode: "dry_run",
    targetIndicators: [...TARGET_INDICATORS],
    dbWriteAttempted: false,
    candidateRowsPersisted: false,
    observationRowsCreated: 0,
    provenanceRowsCreated: 0,
    productionApprovedTrueCount: 0,
    providerFetchAttempted: results.some((result) => result.providerFetchAttempted),
    providerFetchSucceeded: results.some((result) => result.providerFetchSucceeded),
    csvFilesRead: allFoundCsv.length > 0 && allMissingCsv.length === 0,
    csvFilesExpected: allExpectedCsv,
    csvFilesFound: allFoundCsv,
    missingCsvFiles: allMissingCsv,
    parserAttemptedByIndicator: byIndicator((result) => result.parserAttempted),
    parserSucceededByIndicator: byIndicator((result) => result.parserSucceeded),
    candidateRowsByIndicator: byIndicator((result) => result.candidateRows.length),
    candidateProvenanceRowsByIndicator: byIndicator(
      (result) => result.candidateProvenanceRows.length,
    ),
    numericValuesExtracted: results.reduce(
      (sum, result) => sum + result.numericValuesExtracted,
      0,
    ),
    needsReviewTrueCount: allCandidates.filter((candidate) => candidate.needsReview).length,
    semanticCaveats: byIndicator((result) =>
      Array.from(new Set(result.candidateRows.flatMap((row) => row.semanticCaveats))),
    ),
    usdVndRateType:
      allCandidates.find((candidate) => candidate.indicatorCode === "USD_VND")?.quoteField ??
      null,
    usdVndNotSbvCentralRate: allCandidates.some(
      (candidate) => candidate.indicatorCode === "USD_VND" && candidate.notSbvCentralRate,
    ),
    exportGrowthDerivedFormula:
      "(currentPeriodExportValue - priorPeriodExportValue) / priorPeriodExportValue * 100",
    exportGrowthSourcePeriodDetection:
      allMissingCsv.length > 0
        ? "blocked_missing_required_csv_files"
        : "annual_full_year_and_ytd_overlap_detection",
    exportGrowthNotDirectPublishedGrowth: true,
    creditGrowthSourceMode: "manual_aggregated_sbv_news_candidate",
    creditGrowthProvenanceQuality:
      results.find((result) => result.indicatorCode === "CREDIT_GROWTH")?.parserStatus ??
      "blocked",
    publicInvestmentUnitBreakdown,
    publicInvestmentSourceMode: "manual_aggregated_public_investment_candidate",
    manualReviewRequiredBeforeConfirmWrite: true,
    missingDataZeroFilled: false,
    parserResults: results,
  };
}

async function main() {
  if (process.argv.includes("--confirm-write")) {
    console.error("confirm-write is rejected in Phase 149C; this script is dry-run only.");
    process.exit(1);
  }

  const summary = await runVietnamMacroParserDryRunBatch();
  console.log(JSON.stringify(summary, null, 2));

  const usdSucceeded = summary.parserSucceededByIndicator.USD_VND;
  const csvFailClosed = summary.missingCsvFiles.length > 0;
  if (!usdSucceeded && !csvFailClosed) {
    process.exit(1);
  }
}

const currentFilePath = fileURLToPath(import.meta.url);

if (process.argv[1] === currentFilePath) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}
