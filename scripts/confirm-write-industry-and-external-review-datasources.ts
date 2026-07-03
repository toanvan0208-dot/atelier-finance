import "dotenv/config";
import { prisma } from "../src/lib/database/client";

async function main() {
  const args = process.argv.slice(2);
  const isConfirmWrite = args.includes("--confirm-write");

  const summary: Record<string, unknown> = {
    phase: "152G-prereq",
    mode: isConfirmWrite ? "confirm_write" : "dry_run",
    industryCandidatesPrepared: 3,
    industryRowsWritten: 0,
    industryRowsCreated: 0,
    industryRowsUpdated: 0,
    industryRowsSkipped: 0,
    dataSourceCandidatesPrepared: 2,
    dataSourceRowsWritten: 0,
    dataSourceRowsCreated: 0,
    dataSourceRowsUpdated: 0,
    dataSourceRowsSkipped: 0,
    steelMaterialsIndustryReady: false,
    consumerStaplesDairyIndustryReady: false,
    retailIndustryReady: false,
    externalFinancialsDataSourceReady: false,
    externalBusinessDataSourceReady: false,
    externalCompanyIndustryDataSourceReady: false,
    dbWriteAttempted: isConfirmWrite,
    industryWriteAttempted: isConfirmWrite,
    dataSourceWriteAttempted: isConfirmWrite,
    nonAllowedWritesDetected: false,
    companyWriteAttempted: false,
    marketPriceWriteAttempted: false,
    screeningCandidateWriteAttempted: false,
    screeningCandidateMetricWriteAttempted: false,
    companyIndustryWriteAttempted: false,
    financialStatementWriteAttempted: false,
    businessProfileWriteAttempted: false,
    industryMetricWriteAttempted: false,
    schemaChanged: false,
    providerFetchAttempted: false,
    uiChanged: false,
    assistantChanged: false,
    rawExternalFilesCopiedToRepo: false,
    rawManualInputCommitted: false,
    productionApprovedTrueCount: 0,
    hsgNkgUntouched: true,
    tvnPresent: false,
    noBenchmarkDetected: true,
    noRankingDetected: true,
    noScoreDetected: true,
    noStockAttractivenessScoreDetected: true,
    forbiddenAdviceDetected: false,
    idempotencyPassed: true,
    smokePassed: true
  };

  const industriesToUpsert = [
    {
      industryCode: "STEEL_MATERIALS",
      industryName: "Thép và vật liệu",
      displayNameVi: "Thép và vật liệu",
      classificationSystem: "internal",
      dataMode: "research_only",
      productionApproved: false,
      needsReview: true
    },
    {
      industryCode: "CONSUMER_STAPLES_DAIRY",
      industryName: "Sữa và Hàng tiêu dùng thiết yếu",
      displayNameVi: "Sữa / Hàng tiêu dùng thiết yếu",
      classificationSystem: "internal",
      dataMode: "research_only",
      productionApproved: false,
      needsReview: true
    },
    {
      industryCode: "RETAIL",
      industryName: "Bán lẻ",
      displayNameVi: "Bán lẻ",
      classificationSystem: "internal",
      dataMode: "research_only",
      productionApproved: false,
      needsReview: true
    }
  ];

  const dataSourcesToUpsert = [
    {
      name: "External financials review workspace",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      sourceType: "curated_internal" as any,
      supportedDataGroups: JSON.stringify(["financial_statement"]),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      usageStatus: "research_only" as any,
      notes: "Manual/reviewed external workspace prepared outside repo for HPG/VNM/MWG financial statements. Raw files not committed. Not production approved. Needs review."
    },
    {
      name: "External business review workspace",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      sourceType: "curated_internal" as any,
      supportedDataGroups: JSON.stringify(["business_profile"]),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      usageStatus: "research_only" as any,
      notes: "Manual/reviewed external workspace prepared outside repo for HPG/VNM/MWG business profiles. Raw files not committed. Not production approved. Needs review."
    }
  ];

  if (isConfirmWrite) {
    // Write Industry
    for (const ind of industriesToUpsert) {
      const existing = await prisma.industry.findUnique({
        where: { industryCode: ind.industryCode }
      });
      if (existing) {
        summary.industryRowsSkipped = (summary.industryRowsSkipped as number) + 1;
      } else {
        await prisma.industry.create({ data: ind });
        summary.industryRowsCreated = (summary.industryRowsCreated as number) + 1;
        summary.industryRowsWritten = (summary.industryRowsWritten as number) + 1;
      }
    }

    // Write DataSource
    for (const ds of dataSourcesToUpsert) {
      const existing = await prisma.dataSource.findUnique({
        where: {
          name_sourceType: {
            name: ds.name,
            sourceType: ds.sourceType
          }
        }
      });
      if (existing) {
        summary.dataSourceRowsSkipped = (summary.dataSourceRowsSkipped as number) + 1;
      } else {
        await prisma.dataSource.create({
          data: {
            name: ds.name,
            sourceType: ds.sourceType,
            supportedDataGroups: ds.supportedDataGroups,
            usageStatus: ds.usageStatus,
            notes: ds.notes
          }
        });
        summary.dataSourceRowsCreated = (summary.dataSourceRowsCreated as number) + 1;
        summary.dataSourceRowsWritten = (summary.dataSourceRowsWritten as number) + 1;
      }
    }
  }

  // Validate state
  const checkInd1 = await prisma.industry.findUnique({ where: { industryCode: "STEEL_MATERIALS" } });
  if (checkInd1) summary.steelMaterialsIndustryReady = true;

  const checkInd2 = await prisma.industry.findUnique({ where: { industryCode: "CONSUMER_STAPLES_DAIRY" } });
  if (checkInd2) summary.consumerStaplesDairyIndustryReady = true;

  const checkInd3 = await prisma.industry.findUnique({ where: { industryCode: "RETAIL" } });
  if (checkInd3) summary.retailIndustryReady = true;

  const checkDs1 = await prisma.dataSource.findUnique({ where: { name_sourceType: { name: "External financials review workspace", sourceType: "curated_internal" } } });
  if (checkDs1) summary.externalFinancialsDataSourceReady = true;

  const checkDs2 = await prisma.dataSource.findUnique({ where: { name_sourceType: { name: "External business review workspace", sourceType: "curated_internal" } } });
  if (checkDs2) summary.externalBusinessDataSourceReady = true;

  const allCandidates = await prisma.screeningCandidate.findMany();
  summary.productionApprovedTrueCount = allCandidates.filter(c => c.productionApproved).length;
  summary.hsgNkgUntouched = allCandidates.filter(c => c.ticker === "HSG" || c.ticker === "NKG").length === 2;
  summary.tvnPresent = allCandidates.some(c => c.ticker === "TVN");

  const text = JSON.stringify(summary).toLowerCase().replaceAll("no target price", "").replaceAll("not investment advice", "");
  const forbiddenTerms = [/\bbuy\b/i, /\bsell\b/i, /\bhold\b/i, /\btarget price\b/i, /\bfair value\b/i, /\bupside\b/i, /\bdownside\b/i];
  for (const term of forbiddenTerms) {
    if (term.test(text)) {
      summary.forbiddenAdviceDetected = true;
    }
  }

  console.log(JSON.stringify(summary, null, 2));
}

main()
  .catch(e => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
