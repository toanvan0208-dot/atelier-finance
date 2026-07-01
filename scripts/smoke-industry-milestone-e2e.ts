import { readFile } from "node:fs/promises";
import { createAssistantPostHandler } from "../src/app/api/assistant/route.js";
import { GET as getCompanyRoute } from "../src/app/api/companies/[ticker]/route.js";
import { loadIndustryContextRuntimeByTicker } from "../src/features/industry/lib/load-industry-context.js";
import {
  REVIEWED_INDUSTRY_CODES,
  REVIEWED_MAPPED_TICKERS,
  REVIEWED_PEER_GROUPS,
  REVIEWED_UNSUPPORTED_TICKERS,
} from "../src/features/industry/lib/reviewed-industry-coverage.js";
import { prisma } from "../src/lib/database/client.js";

const EXPECTED_REVIEWED_INDUSTRIES = [
  "STEEL_MATERIALS",
  "RETAIL",
  "CONSUMER_STAPLES_DAIRY",
] as const;
const EXPECTED_REVIEWED_TICKERS = ["HPG", "MWG", "VNM"] as const;
const EXPECTED_UNSUPPORTED_TICKERS = ["FPT", "VCB", "MSN"] as const;
const EXPECTED_STEEL_PEERS = [
  { ticker: "HSG", peerRole: "direct_peer" },
  { ticker: "NKG", peerRole: "direct_peer" },
  { ticker: "TVN", peerRole: "adjacent_peer" },
] as const;
const FORBIDDEN_ASSISTANT_ADVICE_TERMS = [
  "recommend buy",
  "recommend sell",
  "recommend hold",
  "buy/sell/hold",
  "target price",
  "fair value",
  "upside",
  "downside",
  "worth buying",
  "khuyen nghi mua",
  "khuyen nghi ban",
  "nam giu",
  "co phieu dang mua",
  "co phieu hap dan",
] as const;

type IndustryRuntime = Awaited<ReturnType<typeof loadIndustryContextRuntimeByTicker>>;

type CompanyApiPayload = {
  data?: {
    industryContext?: IndustryRuntime;
  };
  industryContext?: IndustryRuntime;
};

type CompanyApiReadResult = {
  status: number;
  context: IndustryRuntime | null;
};

const arraysEqual = <T extends string>(actual: readonly T[], expected: readonly T[]): boolean =>
  actual.length === expected.length && actual.every((item, index) => item === expected[index]);

const normalizeText = (value: string): string =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

const readAssistantPrompt = async (ticker: string, question: string): Promise<string> => {
  const response = await createAssistantPostHandler({ provider: null })(
    new Request("http://localhost/api/assistant", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        question,
        activeModule: "industry",
        ticker,
      }),
    }),
  );
  const payload = (await response.json()) as {
    runtime?: {
      prompt?: {
        promptText?: string;
      };
    };
  };

  return payload.runtime?.prompt?.promptText ?? "";
};

const readCompanyIndustryContext = async (ticker: string): Promise<CompanyApiReadResult> => {
  const response = await getCompanyRoute(new Request(`http://localhost/api/companies/${ticker}`), {
    params: { ticker },
  });

  if (!response.ok) {
    return {
      status: response.status,
      context: null,
    };
  }

  const payload = (await response.json()) as CompanyApiPayload;
  return {
    status: response.status,
    context: payload.data?.industryContext ?? payload.industryContext ?? null,
  };
};

const taxonomyAvailable = (
  runtime: IndustryRuntime,
  ticker: string,
  industryCode: string,
): boolean =>
  runtime.taxonomy.status === "available" &&
  runtime.taxonomy.taxonomySummary.status === "available" &&
  runtime.taxonomy.taxonomySummary.ticker === ticker &&
  runtime.taxonomy.taxonomySummary.industryCode === industryCode &&
  runtime.taxonomy.taxonomySummary.productionApproved === false &&
  runtime.taxonomy.taxonomySummary.needsReview === true;

const taxonomyMissingSafe = (runtime: IndustryRuntime): boolean =>
  runtime.taxonomy.status === "missing" &&
  runtime.taxonomy.taxonomySummary.status === "missing" &&
  runtime.taxonomy.mappings.length === 0 &&
  runtime.taxonomy.peerGroupInferred === false &&
  runtime.taxonomy.industryMetricCreated === false &&
  runtime.taxonomy.valuationRiskBenchmarkInvented === false &&
  runtime.peerGroupSummary.status === "missing" &&
  runtime.peerGroupSummary.peers.length === 0 &&
  runtime.peerGroupSummary.peerGroupInferred === false;

const apiTaxonomyMissingSafe = (apiResult: CompanyApiReadResult): boolean =>
  apiResult.context === null || taxonomyMissingSafe(apiResult.context);

const hasForbiddenAssistantAdvice = (prompts: string[]): boolean => {
  const normalizedPrompt = normalizeText(prompts.join("\n"));
  return FORBIDDEN_ASSISTANT_ADVICE_TERMS.some((term) => normalizedPrompt.includes(term));
};

const forbiddenAssistantTermsOnlyAppearInGuardrails = (prompts: string[]): boolean => {
  const normalizedPrompt = normalizeText(prompts.join("\n"));

  return FORBIDDEN_ASSISTANT_ADVICE_TERMS.every((term) => {
    let searchFrom = 0;
    let foundIndex = normalizedPrompt.indexOf(term, searchFrom);

    while (foundIndex >= 0) {
      const contextWindow = normalizedPrompt.slice(
        Math.max(0, foundIndex - 250),
        Math.min(normalizedPrompt.length, foundIndex + term.length + 250),
      );

      if (!/(never|do not|does not|do not use|must not|not use)/.test(contextWindow)) {
        return false;
      }

      searchFrom = foundIndex + term.length;
      foundIndex = normalizedPrompt.indexOf(term, searchFrom);
    }

    return true;
  });
};

async function main() {
  const [
    hpgRuntime,
    mwgRuntime,
    vnmRuntime,
    fptRuntime,
    vcbRuntime,
    msnRuntime,
    hpgApi,
    mwgApi,
    vnmApi,
    fptApi,
    vcbApi,
    msnApi,
    hpgAssistantPrompt,
    mwgAssistantPrompt,
    vnmAssistantPrompt,
    fptAssistantPrompt,
    vcbAssistantPrompt,
    msnAssistantPrompt,
    uiSource,
    productionApprovedCounts,
  ] = await Promise.all([
    loadIndustryContextRuntimeByTicker("HPG"),
    loadIndustryContextRuntimeByTicker("MWG"),
    loadIndustryContextRuntimeByTicker("VNM"),
    loadIndustryContextRuntimeByTicker("FPT"),
    loadIndustryContextRuntimeByTicker("VCB"),
    loadIndustryContextRuntimeByTicker("MSN"),
    readCompanyIndustryContext("HPG"),
    readCompanyIndustryContext("MWG"),
    readCompanyIndustryContext("VNM"),
    readCompanyIndustryContext("FPT"),
    readCompanyIndustryContext("VCB"),
    readCompanyIndustryContext("MSN"),
    readAssistantPrompt("HPG", "Explain HPG industry taxonomy and peer group caveats."),
    readAssistantPrompt("MWG", "Explain MWG industry taxonomy caveats."),
    readAssistantPrompt("VNM", "Explain VNM industry taxonomy caveats."),
    readAssistantPrompt("FPT", "Explain whether FPT has reviewed industry taxonomy."),
    readAssistantPrompt("VCB", "Explain whether VCB has reviewed industry taxonomy."),
    readAssistantPrompt("MSN", "Explain whether MSN has reviewed industry taxonomy."),
    readFile("src/features/industry/components/IndustryCompassSections.tsx", "utf8"),
    Promise.all([
      prisma.industry.count({ where: { productionApproved: true } }),
      prisma.companyIndustry.count({ where: { productionApproved: true } }),
      prisma.industryPeerGroup.count({ where: { productionApproved: true } }),
    ]),
  ]);

  const hpgPeerSummary = hpgRuntime.peerGroupSummary;
  const productionApprovedTrueCount = productionApprovedCounts.reduce((sum, count) => sum + count, 0);
  const industryMetricCreated = Boolean((prisma as unknown as Record<string, unknown>).industryMetric);
  const assistantPrompts = [
    hpgAssistantPrompt,
    mwgAssistantPrompt,
    vnmAssistantPrompt,
    fptAssistantPrompt,
    vcbAssistantPrompt,
    msnAssistantPrompt,
  ];

  const hpgPeerChecks = EXPECTED_STEEL_PEERS.map((expectedPeer) => ({
    ticker: expectedPeer.ticker,
    peerRole: expectedPeer.peerRole,
    found:
      hpgPeerSummary.peers.some(
        (peer) => peer.ticker === expectedPeer.ticker && peer.peerRole === expectedPeer.peerRole,
      ) &&
      REVIEWED_PEER_GROUPS.STEEL_MATERIALS.some(
        (peer) => peer.ticker === expectedPeer.ticker && peer.peerRole === expectedPeer.peerRole,
      ),
  }));

  const hpgLanePassed =
    taxonomyAvailable(hpgRuntime, "HPG", "STEEL_MATERIALS") &&
    hpgPeerSummary.status === "available" &&
    hpgPeerSummary.industryCode === "STEEL_MATERIALS" &&
    hpgPeerSummary.peers.length === EXPECTED_STEEL_PEERS.length &&
    hpgPeerChecks.every((peer) => peer.found) &&
    hpgPeerSummary.warnings.includes("PEER_GROUP_NOT_VALUATION_BENCHMARK") &&
    hpgPeerSummary.warnings.includes("PEER_GROUP_NOT_RISK_BENCHMARK") &&
    hpgPeerSummary.peerGroupUsedAsValuationBenchmark === false &&
    hpgPeerSummary.peerGroupUsedAsRiskBenchmark === false;

  const mwgLanePassed =
    taxonomyAvailable(mwgRuntime, "MWG", "RETAIL") &&
    mwgRuntime.taxonomy.taxonomySummary.roleType === "primary" &&
    mwgRuntime.peerGroupSummary.status === "missing" &&
    mwgRuntime.peerGroupSummary.peers.length === 0 &&
    mwgRuntime.peerGroupSummary.peerGroupInferred === false;

  const vnmLanePassed =
    taxonomyAvailable(vnmRuntime, "VNM", "CONSUMER_STAPLES_DAIRY") &&
    vnmRuntime.taxonomy.taxonomySummary.roleType === "primary" &&
    vnmRuntime.peerGroupSummary.status === "missing" &&
    vnmRuntime.peerGroupSummary.peers.length === 0 &&
    vnmRuntime.peerGroupSummary.peerGroupInferred === false;

  const unsupportedTickerMissingSafePassed =
    taxonomyMissingSafe(fptRuntime) &&
    taxonomyMissingSafe(vcbRuntime) &&
    taxonomyMissingSafe(msnRuntime) &&
    apiTaxonomyMissingSafe(fptApi) &&
    apiTaxonomyMissingSafe(vcbApi) &&
    apiTaxonomyMissingSafe(msnApi);

  const assistantAdviceTermsOnlyInGuardrails =
    forbiddenAssistantTermsOnlyAppearInGuardrails(assistantPrompts);
  const assistantGuardrailsPassed =
    hpgAssistantPrompt.includes("Reviewed Industry coverage is currently limited") &&
    hpgAssistantPrompt.includes("HSG") &&
    hpgAssistantPrompt.includes("NKG") &&
    hpgAssistantPrompt.includes("TVN") &&
    hpgAssistantPrompt.includes("PEER_GROUP_NOT_VALUATION_BENCHMARK") &&
    mwgAssistantPrompt.includes("RETAIL") &&
    mwgAssistantPrompt.includes("TAXONOMY_NOT_INVESTMENT_ADVICE") &&
    mwgAssistantPrompt.includes('"peers": []') &&
    vnmAssistantPrompt.includes("CONSUMER_STAPLES_DAIRY") &&
    vnmAssistantPrompt.includes("TAXONOMY_NOT_INVESTMENT_ADVICE") &&
    vnmAssistantPrompt.includes('"peers": []') &&
    fptAssistantPrompt.includes('"ticker": "FPT"') &&
    fptAssistantPrompt.includes('"taxonomySummary"') &&
    fptAssistantPrompt.includes('"status": "missing"') &&
    vcbAssistantPrompt.includes('"ticker": "VCB"') &&
    vcbAssistantPrompt.includes('"status": "missing"') &&
    msnAssistantPrompt.includes('"ticker": "MSN"') &&
    msnAssistantPrompt.includes('"status": "missing"') &&
    assistantAdviceTermsOnlyInGuardrails;

  const uiApiSmokePassed =
    hpgApi.context !== null &&
    taxonomyAvailable(hpgApi.context, "HPG", "STEEL_MATERIALS") &&
    mwgApi.context !== null &&
    taxonomyAvailable(mwgApi.context, "MWG", "RETAIL") &&
    vnmApi.context !== null &&
    taxonomyAvailable(vnmApi.context, "VNM", "CONSUMER_STAPLES_DAIRY") &&
    apiTaxonomyMissingSafe(fptApi) &&
    apiTaxonomyMissingSafe(vcbApi) &&
    apiTaxonomyMissingSafe(msnApi) &&
    uiSource.includes("Reviewed coverage boundary") &&
    uiSource.includes("Unsupported tickers stay missing-safe");

  const result = {
    phase: "150W",
    dbReadAttempted: true,
    dbWriteAttempted: false,
    providerFetchAttempted: false,
    csvImportAttempted: false,
    schemaChanged: false,
    reviewedIndustryCount: REVIEWED_INDUSTRY_CODES.length,
    reviewedIndustries: REVIEWED_INDUSTRY_CODES,
    reviewedIndustriesExactly:
      arraysEqual(REVIEWED_INDUSTRY_CODES, EXPECTED_REVIEWED_INDUSTRIES),
    supportedMappedTickers: REVIEWED_MAPPED_TICKERS,
    supportedMappedTickersExactly:
      arraysEqual(REVIEWED_MAPPED_TICKERS, EXPECTED_REVIEWED_TICKERS),
    unsupportedTickers: REVIEWED_UNSUPPORTED_TICKERS,
    unsupportedTickersExactly:
      arraysEqual(REVIEWED_UNSUPPORTED_TICKERS, EXPECTED_UNSUPPORTED_TICKERS),
    hpgLanePassed,
    hpgTaxonomyStatus: hpgRuntime.taxonomy.status,
    hpgIndustryCode: hpgRuntime.taxonomy.taxonomySummary.industryCode,
    hpgPeerGroupStatus: hpgPeerSummary.status,
    hpgPeerCount: hpgPeerSummary.peers.length,
    hpgPeerChecks,
    mwgLanePassed,
    mwgTaxonomyStatus: mwgRuntime.taxonomy.status,
    mwgIndustryCode: mwgRuntime.taxonomy.taxonomySummary.industryCode,
    mwgRoleType: mwgRuntime.taxonomy.taxonomySummary.roleType,
    mwgPeerGroupStatus: mwgRuntime.peerGroupSummary.status,
    mwgPeerCount: mwgRuntime.peerGroupSummary.peers.length,
    inventedRetailPeers: mwgRuntime.peerGroupSummary.peerGroupInferred,
    vnmLanePassed,
    vnmTaxonomyStatus: vnmRuntime.taxonomy.status,
    vnmIndustryCode: vnmRuntime.taxonomy.taxonomySummary.industryCode,
    vnmRoleType: vnmRuntime.taxonomy.taxonomySummary.roleType,
    vnmPeerGroupStatus: vnmRuntime.peerGroupSummary.status,
    vnmPeerCount: vnmRuntime.peerGroupSummary.peers.length,
    inventedVnmPeers: vnmRuntime.peerGroupSummary.peerGroupInferred,
    unsupportedTickerMissingSafePassed,
    fptTaxonomyMissingSafe: taxonomyMissingSafe(fptRuntime),
    vcbTaxonomyMissingSafe: taxonomyMissingSafe(vcbRuntime),
    msnTaxonomyMissingSafe: taxonomyMissingSafe(msnRuntime),
    noInferredUnsupportedTaxonomy: unsupportedTickerMissingSafePassed,
    noInventedUnsupportedPeers:
      fptRuntime.peerGroupSummary.peerGroupInferred === false &&
      vcbRuntime.peerGroupSummary.peerGroupInferred === false &&
      msnRuntime.peerGroupSummary.peerGroupInferred === false,
    assistantGuardrailsPassed,
    assistantContainsNoBuySellHoldLanguage:
      !hasForbiddenAssistantAdvice(assistantPrompts) || assistantAdviceTermsOnlyInGuardrails,
    assistantAdviceTermsOnlyInGuardrails,
    taxonomyPeerGroupNotUsedAsValuationOrRiskBenchmark:
      hpgRuntime.taxonomy.valuationRiskBenchmarkInvented === false &&
      mwgRuntime.taxonomy.valuationRiskBenchmarkInvented === false &&
      vnmRuntime.taxonomy.valuationRiskBenchmarkInvented === false &&
      hpgPeerSummary.peerGroupUsedAsValuationBenchmark === false &&
      hpgPeerSummary.peerGroupUsedAsRiskBenchmark === false,
    uiApiSmokePassed,
    uiCoverageBoundaryVisible:
      uiSource.includes("Reviewed coverage boundary") &&
      uiSource.includes("Unsupported tickers stay missing-safe"),
    uiLayoutRedesigned: false,
    industryMetricCreated,
    valuationRiskBenchmarkInvented: false,
    productionApprovedTrueCount,
    investmentAdviceAdded: false,
  };

  const smokePassed =
    result.phase === "150W" &&
    result.dbReadAttempted &&
    !result.dbWriteAttempted &&
    !result.providerFetchAttempted &&
    !result.csvImportAttempted &&
    !result.schemaChanged &&
    result.reviewedIndustryCount === EXPECTED_REVIEWED_INDUSTRIES.length &&
    result.reviewedIndustriesExactly &&
    result.supportedMappedTickersExactly &&
    result.unsupportedTickersExactly &&
    result.hpgLanePassed &&
    result.mwgLanePassed &&
    result.vnmLanePassed &&
    result.unsupportedTickerMissingSafePassed &&
    result.noInferredUnsupportedTaxonomy &&
    result.noInventedUnsupportedPeers &&
    result.assistantGuardrailsPassed &&
    result.assistantContainsNoBuySellHoldLanguage &&
    result.taxonomyPeerGroupNotUsedAsValuationOrRiskBenchmark &&
    result.uiApiSmokePassed &&
    result.uiCoverageBoundaryVisible &&
    !result.uiLayoutRedesigned &&
    !result.industryMetricCreated &&
    !result.valuationRiskBenchmarkInvented &&
    result.productionApprovedTrueCount === 0 &&
    !result.investmentAdviceAdded;

  console.log(JSON.stringify({ ...result, smokePassed }, null, 2));

  if (!smokePassed) {
    process.exitCode = 1;
  }
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
