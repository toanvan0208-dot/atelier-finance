import { prisma } from "../src/lib/database/client";

async function main() {
  console.log("=== Staging Macro & Industry Context Seed Verification ===");

  const macros = await prisma.macroContext.findMany({
    where: { sourceLabel: "staging_macro_industry_research_seed" }
  });

  console.log(`Total MacroContext records: ${macros.length}`);
  
  for (const m of macros) {
    if (m.dataMode !== "research_only") throw new Error("Macro dataMode is not research_only");
    if (m.productionApproved !== false) throw new Error("Macro productionApproved is not false");
    if (m.needsReview !== true) throw new Error("Macro needsReview is not true");
  }

  const industries = await prisma.industryContext.findMany({
    where: { sourceLabel: "staging_macro_industry_research_seed" }
  });

  console.log(`Total IndustryContext records: ${industries.length}`);

  for (const i of industries) {
    if (i.dataMode !== "research_only") throw new Error("Industry dataMode is not research_only");
    if (i.productionApproved !== false) throw new Error("Industry productionApproved is not false");
    if (i.needsReview !== true) throw new Error("Industry needsReview is not true");
    if (i.relatedTickers.includes("VCB")) throw new Error("VCB is incorrectly included in relatedTickers");
  }

  console.log("\nSample MacroContext:");
  if (macros.length > 0) {
    console.log(JSON.stringify(macros[0], null, 2));
  }

  console.log("\nSample IndustryContext:");
  if (industries.length > 0) {
    console.log(JSON.stringify(industries[0], null, 2));
  }

  console.log("\nVerification complete.");
}

main().catch((e: unknown) => {
  console.error("Verification failed:", (e as Error).message);
  process.exit(1);
});
