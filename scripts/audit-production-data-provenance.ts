import { prisma } from "../src/lib/database/client";

async function runAudit() {
  console.log("Phase 145C Production Data Provenance Audit Script\n");

  const companies = await prisma.company.findMany({
    select: { ticker: true, dataMode: true, profileSource: { select: { name: true, sourceType: true } } },
    distinct: ['dataMode']
  });

  console.log("== Company Domains ==");
  console.dir(companies, { depth: null });

  const financials = await prisma.financialStatement.findMany({
    select: { sourceLabel: true, dataMode: true, sourceType: true },
    distinct: ['sourceLabel']
  });
  console.log("\n== FinancialStatement Domains ==");
  console.dir(financials, { depth: null });

  const metadata = await prisma.financialStatementUnitMetadata.findMany({
    select: { sourceLabel: true, dataMode: true, productionApproved: true },
    distinct: ['sourceLabel', 'productionApproved']
  });
  console.log("\n== FinancialStatementUnitMetadata Domains ==");
  console.dir(metadata, { depth: null });

  const marketPrices = await prisma.marketPrice.findMany({
    select: { sourceLabel: true, dataMode: true, sourceType: true },
    distinct: ['sourceLabel']
  });
  console.log("\n== MarketPrice Domains ==");
  console.dir(marketPrices, { depth: null });

  const mpMetadata = await prisma.marketPriceUnitMetadata.findMany({
    select: { sourceLabel: true, dataMode: true, productionApproved: true },
    distinct: ['sourceLabel', 'productionApproved']
  });
  console.log("\n== MarketPriceUnitMetadata Domains ==");
  console.dir(mpMetadata, { depth: null });

  const businessProfiles = await prisma.companyBusinessProfile.findMany({
    select: { sourceLabel: true, dataMode: true, productionApproved: true },
    distinct: ['sourceLabel']
  });
  console.log("\n== BusinessProfile Domains ==");
  console.dir(businessProfiles, { depth: null });

  console.log("\nAudit scan complete.");
}

runAudit()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
