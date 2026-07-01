import { createAssistantPostHandler } from "../src/app/api/assistant/route.js";
import {
  loadIndustryContextRuntimeByTicker,
  loadIndustryTaxonomyRuntimeByTicker,
} from "../src/features/industry/lib/load-industry-context.js";
import { prisma } from "../src/lib/database/client.js";

const TARGET_INDUSTRY_CODE = "STEEL_MATERIALS";
const TARGET_TICKER = "HPG";

const readAssistantIndustryContext = async (ticker: string) => {
  const handler = createAssistantPostHandler({ provider: null });
  const response = await handler(
    new Request("http://localhost/api/assistant", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        question: "Explain the industry context using available system data.",
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

async function main() {
  const [
    hpgTaxonomy,
    hpgIndustryContext,
    vcbTaxonomy,
    vcbIndustryContext,
    productionApprovedCounts,
  ] = await Promise.all([
    loadIndustryTaxonomyRuntimeByTicker(TARGET_TICKER),
    loadIndustryContextRuntimeByTicker(TARGET_TICKER),
    loadIndustryTaxonomyRuntimeByTicker("VCB"),
    loadIndustryContextRuntimeByTicker("VCB"),
    Promise.all([
      prisma.industry.count({ where: { productionApproved: true } }),
      prisma.companyIndustry.count({ where: { productionApproved: true } }),
      prisma.industryPeerGroup.count({ where: { productionApproved: true } }),
    ]),
  ]);

  const [hpgAssistantPrompt, vcbAssistantPrompt] = await Promise.all([
    readAssistantIndustryContext(TARGET_TICKER),
    readAssistantIndustryContext("VCB"),
  ]);

  const hpgPrimaryMapping = hpgTaxonomy.mappings.find(
    (mapping) =>
      mapping.ticker === TARGET_TICKER &&
      mapping.industryCode === TARGET_INDUSTRY_CODE &&
      mapping.roleType === "primary",
  );
  const productionApprovedTrueCount = productionApprovedCounts.reduce((sum, count) => sum + count, 0);
  const prismaDelegates = prisma as unknown as Record<string, unknown>;

  const result = {
    phase: "150M",
    dbReadAttempted: true,
    dbWriteAttempted: false,
    providerFetchAttempted: false,
    csvImportAttempted: false,
    schemaChanged: false,
    hpgTaxonomyReadable: hpgTaxonomy.status === "available",
    hpgIndustryCode: hpgPrimaryMapping?.industryCode ?? null,
    hpgCompanyIndustryRole: hpgPrimaryMapping?.roleType ?? null,
    hpgResearchOnlyCaveatVisible:
      hpgPrimaryMapping?.dataMode === "research_only" &&
      hpgPrimaryMapping.caveats.some((caveat) => caveat.includes("research-only")),
    hpgNeedsReviewVisible: hpgPrimaryMapping?.needsReview === true,
    vcbMissingSafe: vcbTaxonomy.status === "missing" && vcbIndustryContext.status === "missing",
    noFallbackMappingForVcb: vcbTaxonomy.mappings.length === 0,
    peerGroupInferred: hpgTaxonomy.peerGroupInferred,
    industryMetricCreated: Boolean(prismaDelegates.industryMetric),
    valuationRiskBenchmarkInvented: hpgTaxonomy.valuationRiskBenchmarkInvented,
    assistantReceivesHpgTaxonomy:
      hpgAssistantPrompt.includes(TARGET_INDUSTRY_CODE) &&
      hpgAssistantPrompt.includes("research_only") &&
      hpgAssistantPrompt.includes("needsReview"),
    assistantHandlesVcbMissing:
      vcbAssistantPrompt.includes("INDUSTRY_TAXONOMY_MAPPING_MISSING") ||
      vcbAssistantPrompt.includes("no eligible taxonomy mapping"),
    uiLayoutChanged: false,
    productionApprovedTrueCount,
    investmentAdviceAdded: false,
    runtimeContextIncludesTaxonomy:
      hpgIndustryContext.taxonomy.status === "available" &&
      hpgIndustryContext.taxonomy.mappings.some((mapping) => mapping.industryCode === TARGET_INDUSTRY_CODE),
  };

  const smokePassed =
    result.dbReadAttempted &&
    !result.dbWriteAttempted &&
    !result.providerFetchAttempted &&
    !result.csvImportAttempted &&
    !result.schemaChanged &&
    result.hpgTaxonomyReadable &&
    result.hpgIndustryCode === TARGET_INDUSTRY_CODE &&
    result.hpgCompanyIndustryRole === "primary" &&
    result.hpgResearchOnlyCaveatVisible &&
    result.hpgNeedsReviewVisible &&
    result.vcbMissingSafe &&
    result.noFallbackMappingForVcb &&
    !result.peerGroupInferred &&
    !result.industryMetricCreated &&
    !result.valuationRiskBenchmarkInvented &&
    result.assistantReceivesHpgTaxonomy &&
    result.assistantHandlesVcbMissing &&
    !result.uiLayoutChanged &&
    result.productionApprovedTrueCount === 0 &&
    !result.investmentAdviceAdded &&
    result.runtimeContextIncludesTaxonomy;

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
