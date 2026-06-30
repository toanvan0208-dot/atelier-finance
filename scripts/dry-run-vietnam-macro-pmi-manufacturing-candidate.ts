import { prisma } from "../src/lib/database/client.js";
import { pathToFileURL } from "url";

const INDICATOR_CODE = "PMI_MANUFACTURING" as const;

const PMI_HOME_URL = "https://www.pmi.spglobal.com/";
const PMI_RELEASES_URL = "https://www.pmi.spglobal.com/Public/Release/PressReleases";
const RECENT_VIETNAM_PMI_RELEASE_URL =
  "https://www.pmi.spglobal.com/Public/Home/PressRelease/d05d320a82f840b4b910a30255537863";

const EXPECTED_SCHEMA =
  "period,period_type,pmi_value,unit,definition,scope,source_name,source_url,publication_date,extracted_quote,notes";

type SourceProbe = {
  sourceName: string;
  sourceUrl: string;
  sourceType: "official_html_landing_page" | "official_pdf_press_release" | "official_press_release_directory";
  fetchAttempted: boolean;
  fetchSucceeded: boolean;
  httpStatus: number | null;
  contentType: string | null;
  parserShape: "html_not_stable_contract" | "pdf_press_release_manual_review" | "directory_not_series_api";
  blocker: string | null;
};

type PmiDryRunSummary = {
  phase: "149L";
  mode: "vietnam_macro_pmi_manufacturing_candidate_dry_run";
  indicatorCode: typeof INDICATOR_CODE;
  dbReadAttempted: true;
  dbWriteAttempted: false;
  currentDbCount: number;
  currentProvenanceCount: number;
  currentCoverageStatus: "db_backed_candidate_present" | "missing_from_current_db";
  sourceCandidateFound: boolean;
  sourceCandidates: SourceProbe[];
  providerFetchAttempted: boolean;
  providerFetchSucceeded: boolean;
  candidateRowsGenerated: 0;
  manualCsvRequired: true;
  proposedManualCsvPath: string;
  expectedSchema: typeof EXPECTED_SCHEMA;
  expectedUnit: "index";
  expectedDefinition: string;
  expectedScope: string;
  productionApproved: false;
  needsReview: true;
  readyForConfirmWrite: false;
  blockers: string[];
  candidateRowsPersisted: false;
  guardrailResults: {
    dbWriteAttempted: false;
    productionApprovedTrueCount: 0;
    missingDataZeroFilled: false;
    mockOrSampleAsReal: false;
    fallbackAsReal: false;
    frontendIndicatorUniverseExpanded: false;
    investmentAdviceAdded: false;
  };
};

async function probeSource(
  sourceName: SourceProbe["sourceName"],
  sourceUrl: SourceProbe["sourceUrl"],
  sourceType: SourceProbe["sourceType"],
  parserShape: SourceProbe["parserShape"],
  blocker: SourceProbe["blocker"],
): Promise<SourceProbe> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);

  try {
    const response = await fetch(sourceUrl, {
      method: "GET",
      headers: {
        accept: sourceType === "official_pdf_press_release" ? "application/pdf,*/*" : "text/html,*/*",
        "user-agent": "atelier-finance-macro-source-audit/149L",
      },
      signal: controller.signal,
    });

    return {
      sourceName,
      sourceUrl,
      sourceType,
      fetchAttempted: true,
      fetchSucceeded: response.ok,
      httpStatus: response.status,
      contentType: response.headers.get("content-type"),
      parserShape,
      blocker: response.ok ? blocker : `HTTP_${response.status}`,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    return {
      sourceName,
      sourceUrl,
      sourceType,
      fetchAttempted: true,
      fetchSucceeded: false,
      httpStatus: null,
      contentType: null,
      parserShape,
      blocker: `FETCH_FAILED:${message}`,
    };
  } finally {
    clearTimeout(timeout);
  }
}

export async function runVietnamMacroPmiManufacturingCandidateDryRun(): Promise<PmiDryRunSummary> {
  const [currentDbCount, currentProvenanceCount] = await Promise.all([
    prisma.macroObservation.count({ where: { indicatorCode: INDICATOR_CODE } }),
    prisma.macroObservationProvenance.count({ where: { indicatorCode: INDICATOR_CODE } }),
  ]);

  const sourceCandidates = await Promise.all([
    probeSource(
      "S&P Global PMI landing page",
      PMI_HOME_URL,
      "official_html_landing_page",
      "html_not_stable_contract",
      "Official landing page may show latest Vietnam PMI, but it is not a stable series API and must not be used as an automated numeric parser contract.",
    ),
    probeSource(
      "S&P Global PMI press release directory",
      PMI_RELEASES_URL,
      "official_press_release_directory",
      "directory_not_series_api",
      "Release directory is useful for source discovery, but the repo has no stable machine-readable Vietnam PMI series parser contract.",
    ),
    probeSource(
      "S&P Global Vietnam Manufacturing PMI press release PDF",
      RECENT_VIETNAM_PMI_RELEASE_URL,
      "official_pdf_press_release",
      "pdf_press_release_manual_review",
      "Press release PDF is an official source candidate, but PMI extraction requires a reviewed PDF/manual workflow before DB confirm-write.",
    ),
  ]);

  const sourceCandidateFound = sourceCandidates.length > 0;
  const providerFetchAttempted = sourceCandidates.some((source) => source.fetchAttempted);
  const providerFetchSucceeded = sourceCandidates.some((source) => source.fetchSucceeded);

  return {
    phase: "149L",
    mode: "vietnam_macro_pmi_manufacturing_candidate_dry_run",
    indicatorCode: INDICATOR_CODE,
    dbReadAttempted: true,
    dbWriteAttempted: false,
    currentDbCount,
    currentProvenanceCount,
    currentCoverageStatus: currentDbCount > 0 ? "db_backed_candidate_present" : "missing_from_current_db",
    sourceCandidateFound,
    sourceCandidates,
    providerFetchAttempted,
    providerFetchSucceeded,
    candidateRowsGenerated: 0,
    manualCsvRequired: true,
    proposedManualCsvPath: "data/manual-review/macro/pmi-manufacturing/vietnam-pmi-manufacturing-manual-reviewed.csv",
    expectedSchema: EXPECTED_SCHEMA,
    expectedUnit: "index",
    expectedDefinition:
      "Vietnam manufacturing PMI; threshold 50 separates expansion from contraction when stated by the source.",
    expectedScope: "Vietnam manufacturing sector",
    productionApproved: false,
    needsReview: true,
    readyForConfirmWrite: false,
    blockers: [
      "No stable machine-readable S&P Global Vietnam Manufacturing PMI series API is documented in the repo.",
      "Current reachable official sources are HTML/PDF press-release surfaces, not a reviewed parser contract.",
      "S&P Global PMI data is proprietary; numeric extraction must go through manual review or an approved licensed source.",
      "No DB write is allowed in Phase 149L.",
    ],
    candidateRowsPersisted: false,
    guardrailResults: {
      dbWriteAttempted: false,
      productionApprovedTrueCount: 0,
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
  runVietnamMacroPmiManufacturingCandidateDryRun()
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
