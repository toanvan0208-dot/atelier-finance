import { existsSync, readFileSync } from "node:fs";

const EXPECTED = {
  HPG: {
    industryCode: "STEEL_MATERIALS",
    sourcePrefix: "Phase 158D PDF Layer 4 - Local PDF - Bao cao thi truong thep Quy I 2026",
    sourceUrl: "local-pdf://bao-cao-thi-truong-thep-quy-i-2026-20260505095914229.pdf",
  },
  VNM: {
    industryCode: "CONSUMER_STAPLES_DAIRY",
    sourcePrefix: "Phase 158D PDF Layer 4 - Local PDF - Bao cao nganh hang tieu dung trien vong 2026",
    sourceUrl: "local-pdf://bao-cao-nganh-hang-tieu-dung-trien-vong-dau-tu-2026_20251208132429.pdf",
  },
  MWG: {
    industryCode: "RETAIL",
    sourcePrefix: "Phase 158D PDF Layer 4 - Local PDF - Nganh ban le",
    sourceUrl: "local-pdf://nganh_ban_le.pdf",
  },
} as const;

const FORBIDDEN_PATTERNS = [
  /\b(recommend buy|recommend sell|recommend hold)\b/i,
  /\bbuy\/sell\/hold\b/i,
  /\btarget price\b/i,
  /\bfair value\b/i,
  /\bupside\b/i,
  /\bdownside\b/i,
  /\bworth buying\b/i,
  /\battractive investment\b/i,
] as const;

const hasPattern = (patterns: readonly RegExp[], value: string): boolean =>
  patterns.some((pattern) => pattern.test(value));

const read = (filePath: string): string => {
  try {
    return readFileSync(filePath, "utf-8");
  } catch {
    return "";
  }
};

const loadEnvFile = (filePath: string) => {
  if (!existsSync(filePath)) return;

  for (const line of read(filePath).split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) continue;

    const key = trimmed.slice(0, separatorIndex).trim();
    const rawValue = trimmed.slice(separatorIndex + 1).trim();
    const value = rawValue.replace(/^["']|["']$/g, "");
    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
};

async function main() {
  loadEnvFile(".env");
  const [{ loadIndustryContextRuntimeByTicker }, { prisma }] = await Promise.all([
    import("../src/features/industry/lib/load-industry-context.js"),
    import("../src/lib/database/client.js"),
  ]);
  const entries = await Promise.all(
    Object.entries(EXPECTED).map(async ([ticker, expected]) => {
      const runtime = await loadIndustryContextRuntimeByTicker(ticker);
      const context = runtime.context;
      const serialized = JSON.stringify(context ?? {});

      return {
        ticker,
        status: runtime.status,
        industryCode: context?.industryCode ?? null,
        sourceLabel: context?.sourceLabel ?? null,
        sourceUrls: context?.provenanceSummary.sourceUrls ?? [],
        reviewedQualitativeContextAvailable: context?.reviewedQualitativeContextAvailable ?? false,
        fullQualitativeContextAvailable: context?.fullQualitativeContextAvailable ?? false,
        qualitativeContextSourceStatus: context?.qualitativeContextSourceStatus ?? null,
        productionApproved: context?.productionApproved ?? null,
        needsReview: context?.needsReview ?? null,
        dataMode: context?.dataMode ?? null,
        forbiddenAdviceDetected: hasPattern(FORBIDDEN_PATTERNS, serialized),
        passed:
          runtime.status === "available" &&
          context?.industryCode === expected.industryCode &&
          context.sourceLabel === expected.sourcePrefix &&
          context.provenanceSummary.sourceUrls.includes(expected.sourceUrl) &&
          context.reviewedQualitativeContextAvailable === true &&
          context.fullQualitativeContextAvailable === true &&
          context.qualitativeContextSourceStatus === "source_backed" &&
          context.productionApproved === false &&
          context.needsReview === true &&
          context.dataMode === "research_only" &&
          !hasPattern(FORBIDDEN_PATTERNS, serialized),
      };
    }),
  );

  const [industryContextRows, industryContextProvenanceRows, productionApprovedTrueCount] =
    await Promise.all([
      prisma.industryContext.count(),
      prisma.industryContextProvenance.count(),
      Promise.all([
        prisma.industryContext.count({ where: { productionApproved: true } }),
        prisma.industryContextProvenance.count({ where: { productionApproved: true } }),
      ]).then((counts) => counts.reduce((sum, count) => sum + count, 0)),
    ]);

  const result = {
    phase: "158E",
    mode: "read_path_smoke",
    entries,
    industryContextRows,
    industryContextProvenanceRows,
    productionApprovedTrueCount,
    industryMetricRows: 0,
    smokePassed:
      entries.every((entry) => entry.passed) &&
      industryContextRows === 6 &&
      industryContextProvenanceRows === 6 &&
      productionApprovedTrueCount === 0,
  };

  console.log(JSON.stringify(result, null, 2));

  if (!result.smokePassed) {
    process.exitCode = 1;
  }

  await prisma.$disconnect();
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
