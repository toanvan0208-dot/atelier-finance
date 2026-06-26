import { prisma } from "../src/lib/database/client";
// The local data exports
import { macroCompassData } from "../src/features/macro/data/macroCompass.data";
import { industryPageData } from "../src/features/industry/data/industry.data";

const APPROVED_TICKERS = ["FPT", "HPG", "VNM", "MSN", "MWG"];
const SOURCE_LABEL = "staging_macro_industry_research_seed";
const CONTEXT_LANGUAGE = "vi";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const DATA_MODE = "research_only" as any;

async function main() {
  const isConfirmWrite = process.argv.includes("--confirm-write");

  // Validate environment
  const dbUrl = process.env.DATABASE_URL || "";
  if (!dbUrl.includes("supabase")) {
    console.error("ERROR: DATABASE_URL must point to Supabase staging.");
    process.exit(1);
  }

  console.log("=== Staging Macro & Industry Context Seed ===");
  console.log(`writeEnabled: ${isConfirmWrite}`);
  console.log(`confirmWrite: ${isConfirmWrite}`);
  console.log(`DB write: ${isConfirmWrite ? "Yes" : "No"}`);
  console.log(`approved tickers: ${APPROVED_TICKERS.join(", ")}`);
  console.log(`VCB excluded: Yes`);
  console.log(`sourceLabel: ${SOURCE_LABEL}`);
  console.log(`dataMode: ${DATA_MODE}`);
  console.log(`productionApproved: false`);
  console.log(`needsReview: true`);
  console.log(`connection string: masked only`);
  console.log(`rollback criteria: Exact inserted IDs captured.\n`);

  // Seed Macro Context
  // We take just the first block of the conclusion as a general mock context
  const macroAsOfDate = new Date("2025-01-01T00:00:00.000Z");
  const macroContent = macroCompassData.conclusion.blocks.map(b => `${b.title}: ${b.content}`).join("\n");
  
  const macroData = {
    asOfDate: macroAsOfDate,
    contextLanguage: CONTEXT_LANGUAGE,
    gdpGrowthContext: "GDP growth context (Mock)",
    inflationContext: "Inflation context (Mock)",
    interestRateContext: "Interest rate context (Mock)",
    exchangeRateContext: "Exchange rate context (Mock)",
    marketContext: macroContent,
    sourceLabel: SOURCE_LABEL,
    dataMode: DATA_MODE,
    productionApproved: false,
    needsReview: true,
  };

  let macroInsertedId: string | null = null;
  if (isConfirmWrite) {
    const existingMacro = await prisma.macroContext.findUnique({
      where: {
        asOfDate_sourceLabel_contextLanguage: {
          asOfDate: macroAsOfDate,
          sourceLabel: SOURCE_LABEL,
          contextLanguage: CONTEXT_LANGUAGE,
        }
      }
    });

    if (existingMacro) {
      const updated = await prisma.macroContext.update({
        where: { id: existingMacro.id },
        data: macroData,
      });
      macroInsertedId = updated.id;
      console.log(`[WRITE] Updated MacroContext: ${macroInsertedId}`);
    } else {
      const inserted = await prisma.macroContext.create({
        data: macroData,
      });
      macroInsertedId = inserted.id;
      console.log(`[WRITE] Created MacroContext: ${macroInsertedId}`);
    }
  } else {
    console.log(`[DRY RUN] Would create/update MacroContext for ${macroAsOfDate.toISOString()}`);
  }

  // Seed Industry Context
  // Mock one industry context for one of our tickers (e.g., FPT - IT)
  const industryAsOfDate = new Date("2025-01-01T00:00:00.000Z");
  const industryContent = industryPageData.blocks.map(b => `${b.title}: ${b.details ?? b.dataToWatch}`).join("\n");

  const industryData = {
    industryCode: "IT",
    industryName: "Công nghệ thông tin",
    contextLanguage: CONTEXT_LANGUAGE,
    industryOverview: "Mock IT overview",
    keyDrivers: "Mock IT drivers",
    industryRisks: industryContent,
    relatedTickers: ["FPT"],
    asOfDate: industryAsOfDate,
    sourceLabel: SOURCE_LABEL,
    dataMode: DATA_MODE,
    productionApproved: false,
    needsReview: true,
  };

  let industryInsertedId: string | null = null;
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
      const updated = await prisma.industryContext.update({
        where: { id: existingIndustry.id },
        data: industryData,
      });
      industryInsertedId = updated.id;
      console.log(`[WRITE] Updated IndustryContext: ${industryInsertedId}`);
    } else {
      const inserted = await prisma.industryContext.create({
        data: industryData,
      });
      industryInsertedId = inserted.id;
      console.log(`[WRITE] Created IndustryContext: ${industryInsertedId}`);
    }
  } else {
    console.log(`[DRY RUN] Would create/update IndustryContext for ${industryData.industryName}`);
  }

  console.log("\n=== Summary ===");
  if (isConfirmWrite) {
    console.log(`Successfully seeded staging database using staging-specific guarded macro/industry seed path.`);
    console.log(`MacroContext ID: ${macroInsertedId}`);
    console.log(`IndustryContext ID: ${industryInsertedId}`);
  } else {
    console.log("Dry run successful. Use --confirm-write to execute.");
  }
}

main().catch((e: unknown) => {
  console.error("Script failed:", (e as Error).message);
  process.exit(1);
});
