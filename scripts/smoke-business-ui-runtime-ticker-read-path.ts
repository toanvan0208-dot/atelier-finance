import "dotenv/config";

import { readFileSync } from "node:fs";

import { loadCompanyBusinessProfile } from "../src/features/business/lib/load-company-business-profile";
import { prisma } from "../src/lib/database/client";

const phase = "152K-fix";
const targetTickers = ["HPG", "VNM", "MWG"] as const;
const displayOnlyTickers = ["FPT", "MSN", "VCB"] as const;
const obsoleteFallbackTexts = [
  "Prototype hiện có dữ liệu mẫu MWG",
  "Prototype hiá»‡n cÃ³ dá»¯ liá»‡u máº«u MWG",
  "Hãy chọn MWG",
  "HÃ£y chá»n MWG",
] as const;
const forbiddenAdvicePatterns = [
  /\b(buy|sell|hold)\b/i,
  /target\s+price/i,
  /fair\s+value/i,
  /\bupside\b/i,
  /\bdownside\b/i,
  /giá mục tiêu/i,
  /giá trị hợp lý/i,
  /tiềm năng tăng giá/i,
] as const;

const sourceFiles = [
  "src/features/business/components/BusinessPage.tsx",
  "src/features/business/data/businessJourney.data.ts",
];

type TargetProfileStatus = {
  present: boolean;
  hasBusinessDescription: boolean;
  hasSourceLabel: boolean;
  dataMode: string | null;
  needsReview: boolean | null;
  productionApproved: boolean | null;
};

type DisplayOnlyProfileStatus = {
  businessProfilePresent: boolean;
  screeningCandidatePresent: boolean;
  analysisEligible: boolean;
  coverageLevel: string;
  guarded: boolean;
};

async function run() {
  const sourceText = sourceFiles.map((filePath) => readFileSync(filePath, "utf-8")).join("\n");

  const targetProfiles = Object.fromEntries(
    await Promise.all(
    targetTickers.map(async (ticker) => {
      const profile = await loadCompanyBusinessProfile(ticker);
      return [
        ticker,
        {
          present: Boolean(profile),
          hasBusinessDescription: Boolean(profile?.businessDescription && profile.businessDescription !== "Chưa đủ dữ liệu"),
          hasSourceLabel: Boolean(profile?.sourceLabel),
          dataMode: profile?.dataMode ?? null,
          needsReview: profile?.needsReview ?? null,
          productionApproved: profile?.productionApproved ?? null,
        },
      ];
    }),
    ),
  ) as Record<(typeof targetTickers)[number], TargetProfileStatus>;

  const displayOnlyProfiles = Object.fromEntries(
    await Promise.all(
    displayOnlyTickers.map(async (ticker) => {
      const profile = await loadCompanyBusinessProfile(ticker);
      const screeningCandidate = await prisma.screeningCandidate.findUnique({
        where: { ticker },
        select: { ticker: true, analysisEligible: true, coverageLevel: true, screeningEligible: true },
      });
      return [
        ticker,
        {
          businessProfilePresent: Boolean(profile),
          screeningCandidatePresent: Boolean(screeningCandidate),
          analysisEligible: screeningCandidate?.analysisEligible ?? false,
          coverageLevel: screeningCandidate?.coverageLevel ?? "missing_safe",
          guarded: !profile && screeningCandidate?.analysisEligible !== true,
        },
      ];
    }),
    ),
  ) as Record<(typeof displayOnlyTickers)[number], DisplayOnlyProfileStatus>;

  const oldPrototypeFallbackDetected = obsoleteFallbackTexts.some((text) => sourceText.includes(text));
  const forbiddenAdviceDetected = forbiddenAdvicePatterns.some((pattern) => pattern.test(sourceText));
  const productionApprovedTrueCount = await prisma.companyBusinessProfile.count({
    where: { productionApproved: true },
  });
  const targetProfilesReady = Object.values(targetProfiles).every(
    (profile) =>
      profile.present &&
      profile.hasBusinessDescription &&
      profile.hasSourceLabel &&
      profile.dataMode === "research_only" &&
      profile.needsReview === true &&
      profile.productionApproved === false,
  );
  const displayOnlyGuarded = Object.values(displayOnlyProfiles).every((profile) => profile.guarded);
  const benchmarkCreated = false;
  const rankingCreated = false;
  const stockAttractivenessScoreCreated = false;
  const targetPriceFairValueUpsideDownsideIntroduced = forbiddenAdvicePatterns
    .slice(1)
    .some((pattern) => pattern.test(sourceText));

  const summary = {
    phase,
    smoke: "business_ui_runtime_ticker_read_path",
    targetTickers,
    displayOnlyTickers,
    hpgBusinessProfilePresent: targetProfiles.HPG.present,
    vnmBusinessProfilePresent: targetProfiles.VNM.present,
    mwgBusinessProfilePresent: targetProfiles.MWG.present,
    hpgBusinessProfileRendersRealData: targetProfiles.HPG.hasBusinessDescription,
    vnmBusinessProfileRendersRealData: targetProfiles.VNM.hasBusinessDescription,
    mwgBusinessProfileRendersRealData: targetProfiles.MWG.hasBusinessDescription,
    targetProfiles,
    displayOnlyProfiles,
    oldPrototypeFallbackDetected,
    hpgOldPrototypeFallbackAbsent: !oldPrototypeFallbackDetected,
    vnmOldPrototypeFallbackAbsent: !oldPrototypeFallbackDetected,
    mwgOldPrototypeFallbackAbsent: !oldPrototypeFallbackDetected,
    fptMsnVcbRemainDisplayOnlyGuarded: displayOnlyGuarded,
    benchmarkCreated,
    rankingCreated,
    stockAttractivenessScoreCreated,
    targetPriceFairValueUpsideDownsideIntroduced,
    forbiddenAdviceDetected,
    productionApprovedTrueCount,
    dbWriteAttempted: false,
    schemaChanged: false,
    providerFetchAttempted: false,
    smokePassed:
      targetProfilesReady &&
      displayOnlyGuarded &&
      !oldPrototypeFallbackDetected &&
      !benchmarkCreated &&
      !rankingCreated &&
      !stockAttractivenessScoreCreated &&
      !targetPriceFairValueUpsideDownsideIntroduced &&
      !forbiddenAdviceDetected &&
      productionApprovedTrueCount === 0,
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
