import { prisma } from "../src/lib/database/client.js";
import { pathToFileURL } from "url";

type IndicatorCode =
  | "GDP_GROWTH"
  | "CPI_YOY"
  | "PMI_MANUFACTURING"
  | "POLICY_RATE"
  | "MARKET_TRADING_VALUE"
  | "FOREIGN_NET_FLOW"
  | "GLOBAL_FLOW";

type CandidateRow = {
  indicatorCode: IndicatorCode;
  period: string;
  periodType: "annual" | "monthly" | "daily" | "event_based" | "definition_pending";
  observationDate: string;
  value: number;
  unit: string;
  sourceName: string;
  sourceUrl: string;
  sourceType: string;
  dataMode: string;
  productionApproved: false;
  needsReview: true;
  semanticCaveats: string[];
  provenance: {
    sourceUrl: string;
    fetchedAt: string;
    httpStatus: number;
    contentType: string;
  };
};

type IndicatorSummary = {
  indicatorCode: IndicatorCode;
  currentDbCount: number;
  currentProvenanceCount: number;
  currentCoverageStatus: "db_backed_candidate_present" | "missing_from_current_db";
  sourceName: string;
  sourceUrl: string | null;
  sourceType: string;
  candidateRowsGenerated: number;
  expectedUnit: string | null;
  periodType: string | null;
  productionApproved: false;
  needsReview: true;
  readyForConfirmWrite: boolean;
  blockers: string[];
  manualCsvSchema?: string;
  definitionDecisionNeeded?: boolean;
  nextAction: string;
  providerFetchAttempted: boolean;
  providerFetchSucceeded: boolean;
  httpStatus?: number;
  contentType?: string;
};

type WorldBankSource = {
  indicatorCode: "GDP_GROWTH" | "CPI_YOY";
  sourceName: string;
  sourceUrl: string;
  expectedUnit: string;
  periodType: "annual";
  semanticCaveat: string;
};

const TARGET_INDICATORS: IndicatorCode[] = [
  "GDP_GROWTH",
  "CPI_YOY",
  "PMI_MANUFACTURING",
  "POLICY_RATE",
  "MARKET_TRADING_VALUE",
  "FOREIGN_NET_FLOW",
  "GLOBAL_FLOW",
];

const WORLD_BANK_SOURCES: WorldBankSource[] = [
  {
    indicatorCode: "GDP_GROWTH",
    sourceName: "World Bank Open Data - GDP growth (annual %)",
    sourceUrl: "https://api.worldbank.org/v2/country/VNM/indicator/NY.GDP.MKTP.KD.ZG?format=json&per_page=5",
    expectedUnit: "percent_yoy",
    periodType: "annual",
    semanticCaveat: "World Bank GDP growth is an annual candidate series and may lag current Vietnamese macro releases.",
  },
  {
    indicatorCode: "CPI_YOY",
    sourceName: "World Bank Open Data - Inflation, consumer prices (annual %)",
    sourceUrl: "https://api.worldbank.org/v2/country/VNM/indicator/FP.CPI.TOTL.ZG?format=json&per_page=5",
    expectedUnit: "percent_yoy",
    periodType: "annual",
    semanticCaveat: "World Bank CPI/inflation is an annual candidate series and is not a monthly GSO CPI release.",
  },
];

const MANUAL_OR_BLOCKED_SOURCES: Record<
  Exclude<IndicatorCode, "GDP_GROWTH" | "CPI_YOY">,
  Omit<
    IndicatorSummary,
    | "currentDbCount"
    | "currentProvenanceCount"
    | "currentCoverageStatus"
    | "candidateRowsGenerated"
    | "productionApproved"
    | "needsReview"
    | "providerFetchAttempted"
    | "providerFetchSucceeded"
  >
> = {
  PMI_MANUFACTURING: {
    indicatorCode: "PMI_MANUFACTURING",
    sourceName: "S&P Global Vietnam Manufacturing PMI press releases",
    sourceUrl: "https://www.pmi.spglobal.com/Public/Release/PressReleases",
    sourceType: "manual_csv_required",
    expectedUnit: "index_points",
    periodType: "monthly",
    readyForConfirmWrite: false,
    blockers: [
      "S&P Global PMI is proprietary and no stable free machine-readable API is documented in the repo.",
      "Manual extraction needs source URL, publication date, and quoted evidence for each row before confirm-write.",
    ],
    manualCsvSchema:
      "period,period_type,pmi_value,unit,definition,scope,source_name,source_url,publication_date,extracted_quote,notes",
    nextAction: "Collect manually reviewed PMI rows from official S&P Global release PDFs/pages using the manual CSV contract.",
  },
  POLICY_RATE: {
    indicatorCode: "POLICY_RATE",
    sourceName: "State Bank of Vietnam policy rate portal",
    sourceUrl: "https://www.sbv.gov.vn/webcenter/portal/vi/menu/trangchu/tstttlm/lsdh",
    sourceType: "manual_csv_required",
    expectedUnit: "percent",
    periodType: "event_based",
    readyForConfirmWrite: false,
    blockers: [
      "SBV policy-rate page was previously verified as dynamic_or_unstable; automated scraping remains blocked.",
      "INTERBANK_RATE_OVERNIGHT must not be substituted for POLICY_RATE.",
    ],
    manualCsvSchema:
      "period,period_type,policy_rate_value,unit,definition,scope,rate_name,source_name,source_url,publication_date,extracted_quote,notes",
    nextAction: "Prepare manually reviewed SBV policy-rate rows with explicit rate_name and publication evidence.",
  },
  MARKET_TRADING_VALUE: {
    indicatorCode: "MARKET_TRADING_VALUE",
    sourceName: "HOSE trading summary or documented market-wide exchange source",
    sourceUrl: "https://www.hsx.vn/",
    sourceType: "manual_csv_required",
    expectedUnit: "billion_vnd",
    periodType: "daily_or_monthly",
    readyForConfirmWrite: false,
    blockers: [
      "No documented stable public CSV/API endpoint for market-wide trading value is present in the repo.",
      "Single-ticker trading value is not acceptable for this market-wide indicator.",
    ],
    manualCsvSchema:
      "period,period_type,trading_value,unit,definition,scope,market,source_name,source_url,publication_date,extracted_quote,notes",
    nextAction: "Select a documented market-wide exchange/source contract and provide manual rows if no parser-safe endpoint exists.",
  },
  FOREIGN_NET_FLOW: {
    indicatorCode: "FOREIGN_NET_FLOW",
    sourceName: "HOSE/HNX/VNX market-wide foreign trading statistics or documented provider source",
    sourceUrl: "https://www.hsx.vn/",
    sourceType: "manual_csv_required",
    expectedUnit: "billion_vnd",
    periodType: "daily_or_monthly",
    readyForConfirmWrite: false,
    blockers: [
      "No documented stable public CSV/API endpoint for market-wide foreign net flow is present in the repo.",
      "Foreign net flow of a single ticker is not acceptable for this market-wide indicator.",
    ],
    manualCsvSchema:
      "period,period_type,foreign_net_flow_value,unit,definition,scope,market,source_name,source_url,publication_date,extracted_quote,notes",
    nextAction: "Select a market-wide source and provide manually reviewed rows with buy/sell/net-flow definition.",
  },
  GLOBAL_FLOW: {
    indicatorCode: "GLOBAL_FLOW",
    sourceName: "Product definition required before source selection",
    sourceUrl: null,
    sourceType: "definition_decision_needed",
    expectedUnit: null,
    periodType: "definition_pending",
    readyForConfirmWrite: false,
    definitionDecisionNeeded: true,
    blockers: [
      "GLOBAL_FLOW definition is not locked: possible meanings include global equity fund flow, ETF flow, risk-on/risk-off proxy, or global liquidity/financial conditions proxy.",
      "A proxy may be used later only as proxy_candidate and must not be described as official global flow.",
    ],
    nextAction: "Make a product definition decision before selecting a source or proxy.",
  },
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function latestFiniteWorldBankRecord(payload: unknown): { date: string; value: number } | null {
  if (!Array.isArray(payload) || payload.length < 2 || !Array.isArray(payload[1])) {
    return null;
  }

  for (const item of payload[1]) {
    if (!isRecord(item)) continue;
    const date = typeof item.date === "string" ? item.date : null;
    const rawValue = item.value;
    const value = typeof rawValue === "number" ? rawValue : typeof rawValue === "string" ? Number(rawValue) : NaN;

    if (date && Number.isFinite(value)) {
      return { date, value };
    }
  }

  return null;
}

async function fetchJsonWithTimeout(url: string, timeoutMs: number) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      headers: { accept: "application/json" },
      signal: controller.signal,
    });
    const contentType = response.headers.get("content-type") ?? "unknown";
    const payload = await response.json();

    return {
      ok: response.ok,
      status: response.status,
      contentType,
      payload,
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function currentCounts(indicatorCode: IndicatorCode) {
  const [observations, provenance] = await Promise.all([
    prisma.macroObservation.count({ where: { indicatorCode } }),
    prisma.macroObservationProvenance.count({ where: { indicatorCode } }),
  ]);

  return { observations, provenance };
}

async function buildWorldBankSummary(source: WorldBankSource): Promise<{
  summary: IndicatorSummary;
  candidates: CandidateRow[];
}> {
  const counts = await currentCounts(source.indicatorCode);
  const coverageStatus = counts.observations > 0 ? "db_backed_candidate_present" : "missing_from_current_db";
  const fetchedAt = new Date().toISOString();
  const blockers: string[] = [];
  const candidates: CandidateRow[] = [];
  let providerFetchSucceeded = false;
  let httpStatus: number | undefined;
  let contentType: string | undefined;

  try {
    const response = await fetchJsonWithTimeout(source.sourceUrl, 15_000);
    httpStatus = response.status;
    contentType = response.contentType;

    if (!response.ok) {
      blockers.push(`WORLD_BANK_HTTP_${response.status}`);
    } else {
      const latest = latestFiniteWorldBankRecord(response.payload);
      if (!latest) {
        blockers.push("WORLD_BANK_NO_FINITE_LATEST_RECORD");
      } else {
        providerFetchSucceeded = true;
        candidates.push({
          indicatorCode: source.indicatorCode,
          period: latest.date,
          periodType: source.periodType,
          observationDate: `${latest.date}-12-31`,
          value: latest.value,
          unit: source.expectedUnit,
          sourceName: source.sourceName,
          sourceUrl: source.sourceUrl,
          sourceType: "world_bank_api_candidate",
          dataMode: "world_bank_candidate",
          productionApproved: false,
          needsReview: true,
          semanticCaveats: [source.semanticCaveat, "Candidate data only; confirm-write must keep productionApproved=false and needsReview=true."],
          provenance: {
            sourceUrl: source.sourceUrl,
            fetchedAt,
            httpStatus: response.status,
            contentType: response.contentType,
          },
        });
      }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    blockers.push(`WORLD_BANK_FETCH_FAILED:${message}`);
  }

  return {
    summary: {
      indicatorCode: source.indicatorCode,
      currentDbCount: counts.observations,
      currentProvenanceCount: counts.provenance,
      currentCoverageStatus: coverageStatus,
      sourceName: source.sourceName,
      sourceUrl: source.sourceUrl,
      sourceType: "world_bank_api_candidate",
      candidateRowsGenerated: candidates.length,
      expectedUnit: source.expectedUnit,
      periodType: source.periodType,
      productionApproved: false,
      needsReview: true,
      readyForConfirmWrite: candidates.length > 0 && blockers.length === 0,
      blockers,
      nextAction:
        candidates.length > 0
          ? "Eligible for a separate candidate confirm-write phase if product accepts annual World Bank candidate coverage."
          : "Keep missing/needs_review until the World Bank response is available and valid.",
      providerFetchAttempted: true,
      providerFetchSucceeded,
      httpStatus,
      contentType,
    },
    candidates,
  };
}

async function buildManualOrBlockedSummary(indicatorCode: Exclude<IndicatorCode, "GDP_GROWTH" | "CPI_YOY">) {
  const counts = await currentCounts(indicatorCode);
  const source = MANUAL_OR_BLOCKED_SOURCES[indicatorCode];

  return {
    ...source,
    currentDbCount: counts.observations,
    currentProvenanceCount: counts.provenance,
    currentCoverageStatus: counts.observations > 0 ? "db_backed_candidate_present" : "missing_from_current_db",
    candidateRowsGenerated: 0,
    productionApproved: false,
    needsReview: true,
    providerFetchAttempted: false,
    providerFetchSucceeded: false,
  } satisfies IndicatorSummary;
}

export async function runRemainingMacroRealCandidatesDryRun() {
  const candidateRows: CandidateRow[] = [];
  const perIndicator: IndicatorSummary[] = [];

  for (const source of WORLD_BANK_SOURCES) {
    const result = await buildWorldBankSummary(source);
    perIndicator.push(result.summary);
    candidateRows.push(...result.candidates);
  }

  for (const indicatorCode of [
    "PMI_MANUFACTURING",
    "POLICY_RATE",
    "MARKET_TRADING_VALUE",
    "FOREIGN_NET_FLOW",
    "GLOBAL_FLOW",
  ] as const) {
    perIndicator.push(await buildManualOrBlockedSummary(indicatorCode));
  }

  const readyForConfirmWriteIndicators = perIndicator
    .filter((item) => item.readyForConfirmWrite)
    .map((item) => item.indicatorCode);
  const blockedIndicators = perIndicator
    .filter((item) => !item.readyForConfirmWrite)
    .map((item) => item.indicatorCode);
  const manualCsvRequiredIndicators = perIndicator
    .filter((item) => item.sourceType === "manual_csv_required")
    .map((item) => item.indicatorCode);
  const productionApprovedTrueCount = candidateRows.filter((row) => row.productionApproved).length;

  return {
    phase: "149K",
    mode: "remaining_macro_real_candidates_dry_run",
    targetIndicators: TARGET_INDICATORS,
    dbReadAttempted: true,
    dbWriteAttempted: false,
    providerFetchAttempted: perIndicator.some((item) => item.providerFetchAttempted),
    providerFetchSummary: perIndicator.map((item) => ({
      indicatorCode: item.indicatorCode,
      providerFetchAttempted: item.providerFetchAttempted,
      providerFetchSucceeded: item.providerFetchSucceeded,
      httpStatus: item.httpStatus ?? null,
      contentType: item.contentType ?? null,
    })),
    candidateRowsGenerated: candidateRows.length,
    candidateRowsGeneratedByIndicator: Object.fromEntries(
      perIndicator.map((item) => [item.indicatorCode, item.candidateRowsGenerated]),
    ) as Record<IndicatorCode, number>,
    readyForConfirmWriteIndicators,
    blockedIndicators,
    manualCsvRequiredIndicators,
    definitionDecisionNeededIndicators: perIndicator
      .filter((item) => item.definitionDecisionNeeded)
      .map((item) => item.indicatorCode),
    productionApprovedTrueCount,
    needsReviewTrueCount: candidateRows.filter((row) => row.needsReview).length,
    candidateRowsPersisted: false,
    perIndicator,
    candidateRows,
    guardrailResults: {
      dbWriteAttempted: false,
      productionApprovedTrueCount,
      missingDataZeroFilled: false,
      mockOrSampleAsReal: false,
      fallbackAsReal: false,
      frontendIndicatorUniverseExpanded: false,
      investmentAdviceAdded: false,
    },
  };
}

const isDirectRun = process.argv[1] ? import.meta.url === pathToFileURL(process.argv[1]).href : false;

if (isDirectRun) {
  runRemainingMacroRealCandidatesDryRun()
    .then(async (summary) => {
      console.log(JSON.stringify(summary, null, 2));
      await prisma.$disconnect();
    })
    .catch(async (error) => {
      console.error(error);
      await prisma.$disconnect();
      process.exit(1);
    });
}
