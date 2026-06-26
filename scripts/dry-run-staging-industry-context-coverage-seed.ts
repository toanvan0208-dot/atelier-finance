import { prisma } from "../src/lib/database/client";

const APPROVED_TICKERS = ["FPT", "HPG", "VNM", "MSN", "MWG"];
const SOURCE_LABEL = "staging_macro_industry_research_seed";
const CONTEXT_LANGUAGE = "vi";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const DATA_MODE = "research_only" as any;

type IndustrySeedData = {
  ticker: string;
  industryCode: string;
  industryName: string;
  industryOverview: string;
  keyDrivers: string;
  industryRisks: string;
};

const INDUSTRY_SEEDS: IndustrySeedData[] = [
  {
    ticker: "HPG",
    industryCode: "STEEL",
    industryName: "Thép và vật liệu xây dựng",
    industryOverview: "Mock Steel overview - Ngành chu kỳ, thâm dụng tài sản.",
    keyDrivers: "Giá quặng sắt, than cốc, đầu tư công, bất động sản.",
    industryRisks: "Biến động giá hàng hóa, chu kỳ xây dựng.",
  },
  {
    ticker: "VNM",
    industryCode: "DAIRY",
    industryName: "Hàng tiêu dùng thiết yếu",
    industryOverview: "Mock Dairy overview - Ngành phòng thủ, dòng tiền đều.",
    keyDrivers: "Giá sữa bột nguyên liệu, sức mua nội địa, xuất khẩu.",
    industryRisks: "Cạnh tranh thị phần, giá nguyên liệu.",
  },
  {
    ticker: "MSN",
    industryCode: "CONSUMER",
    industryName: "Hàng tiêu dùng",
    industryOverview: "Mock Consumer overview - Nhạy với sức mua và chuỗi bán lẻ.",
    keyDrivers: "Phục hồi bán lẻ, tối ưu chuỗi siêu thị, tiêu dùng nội địa.",
    industryRisks: "Sức mua yếu, chi phí tài chính.",
  },
  {
    ticker: "MWG",
    industryCode: "RETAIL",
    industryName: "Bán lẻ",
    industryOverview: "Mock Retail overview - Nhạy với thu nhập hộ gia đình.",
    keyDrivers: "Doanh thu cùng cửa hàng, tối ưu điểm bán, niềm tin tiêu dùng.",
    industryRisks: "Cạnh tranh giá, chi phí bán hàng, hàng tồn kho.",
  }
];

async function main() {
  const isConfirmWrite = process.argv.includes("--confirm-write");

  // Validate environment
  const dbUrl = process.env.DATABASE_URL || "";
  if (!dbUrl.includes("supabase")) {
    console.error("ERROR: DATABASE_URL must point to Supabase staging.");
    process.exit(1);
  }

  console.log("=== Staging Industry Context Coverage Expansion Seed ===");
  console.log(`writeEnabled: ${isConfirmWrite}`);
  console.log(`confirmWrite: ${isConfirmWrite}`);
  console.log(`DB write: ${isConfirmWrite ? "Yes" : "No"}`);
  console.log(`approved tickers covered after seed: ${APPROVED_TICKERS.join(", ")}`);
  console.log(`VCB excluded: Yes`);
  console.log(`sourceLabel: ${SOURCE_LABEL}`);
  console.log(`dataMode: ${DATA_MODE}`);
  console.log(`productionApproved: false`);
  console.log(`needsReview: true`);
  console.log(`connection string: masked only`);
  console.log(`rollback criteria: Exact inserted IDs captured.\n`);

  const asOfDate = new Date("2025-01-01T00:00:00.000Z");

  const results: { ticker: string, action: string, id?: string }[] = [];

  for (const seed of INDUSTRY_SEEDS) {
    if (seed.ticker === "VCB") continue;

    const industryData = {
      industryCode: seed.industryCode,
      industryName: seed.industryName,
      contextLanguage: CONTEXT_LANGUAGE,
      industryOverview: seed.industryOverview,
      keyDrivers: seed.keyDrivers,
      industryRisks: seed.industryRisks,
      relatedTickers: [seed.ticker],
      asOfDate: asOfDate,
      sourceLabel: SOURCE_LABEL,
      dataMode: DATA_MODE,
      productionApproved: false,
      needsReview: true,
    };

    if (isConfirmWrite) {
      const existingIndustry = await prisma.industryContext.findUnique({
        where: {
          industryName_asOfDate_sourceLabel_contextLanguage: {
            industryName: industryData.industryName,
            asOfDate: industryData.asOfDate,
            sourceLabel: SOURCE_LABEL,
            contextLanguage: CONTEXT_LANGUAGE,
          }
        }
      });

      if (existingIndustry) {
        // For staging research, it's safer to check if relatedTickers already includes the ticker to avoid overwriting or duplicates
        const newRelatedTickers = existingIndustry.relatedTickers;
        if (!newRelatedTickers.includes(seed.ticker)) {
          newRelatedTickers.push(seed.ticker);
        }

        const updated = await prisma.industryContext.update({
          where: { id: existingIndustry.id },
          data: { ...industryData, relatedTickers: newRelatedTickers },
        });
        results.push({ ticker: seed.ticker, action: "Updated", id: updated.id });
        console.log(`[WRITE] Updated IndustryContext for ${seed.industryName} (added ${seed.ticker}): ${updated.id}`);
      } else {
        const inserted = await prisma.industryContext.create({
          data: industryData,
        });
        results.push({ ticker: seed.ticker, action: "Created", id: inserted.id });
        console.log(`[WRITE] Created IndustryContext for ${seed.industryName} (${seed.ticker}): ${inserted.id}`);
      }
    } else {
      console.log(`[DRY RUN] Would create/update IndustryContext for ${industryData.industryName} (${seed.ticker})`);
      results.push({ ticker: seed.ticker, action: "Dry-run intended", id: "mock-id" });
    }
  }

  console.log("\n=== Summary ===");
  if (isConfirmWrite) {
    console.log(`Successfully seeded staging database using staging-specific guarded industry seed path.`);
    for (const res of results) {
      console.log(`${res.ticker}: ${res.action} -> ${res.id}`);
    }
  } else {
    console.log("Dry run successful. Use --confirm-write to execute.");
  }
}

main().catch((e: unknown) => {
  console.error("Script failed:", (e as Error).message);
  process.exit(1);
});
