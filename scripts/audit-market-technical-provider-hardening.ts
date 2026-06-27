import { prisma } from "../src/lib/database/client";

async function runAudit() {
  console.log("Phase 145D Market/Technical Provider Hardening Audit Script\n");

  const marketPrices = await prisma.marketPrice.findMany({
    select: { sourceLabel: true, dataMode: true, sourceType: true },
    distinct: ['sourceLabel']
  });

  const mpMetadata = await prisma.marketPriceUnitMetadata.findMany({
    select: { sourceLabel: true, dataMode: true, productionApproved: true },
    distinct: ['sourceLabel', 'productionApproved']
  });

  console.log("== MarketPrice Domains ==");
  console.dir(marketPrices, { depth: null });
  console.dir(mpMetadata, { depth: null });

  const totalMarketPrices = await prisma.marketPrice.count();
  const totalProductionApproved = await prisma.marketPriceUnitMetadata.count({
    where: { productionApproved: true }
  });

  console.log(`\nmarketTechnicalDomainsAudited: ${marketPrices.length}`);
  console.log(`productionApprovedCount: ${totalProductionApproved}`);
  console.log(`researchCandidateCount: ${marketPrices.filter(m => m.dataMode === 'research_only').length}`);

  console.log("\nAudit scan complete.");
}

runAudit()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
