import { prisma } from "../src/lib/database/client";

async function main() {
  console.log("=== Staging Market Price Seed Verification ===");
  
  const count = await prisma.marketPrice.count();
  console.log(`Total MarketPrice records: ${count}`);
  
  const groups = await prisma.marketPrice.groupBy({
    by: ['ticker'],
    _count: true,
  });
  
  console.log("\nCounts by ticker:");
  for (const group of groups) {
    console.log(`${group.ticker}: ${group._count} records`);
  }
  
  const fpt = await prisma.marketPrice.findFirst({
    where: { ticker: "FPT" },
    orderBy: { tradingDate: "desc" },
  });
  
  if (fpt) {
    console.log("\nSample record (FPT):");
    console.log({
      ticker: fpt.ticker,
      tradingDate: fpt.tradingDate,
      closePrice: fpt.closePrice?.toString(),
      volume: fpt.volume?.toString(),
      dataMode: fpt.dataMode,
      sourceType: fpt.sourceType,
      sourceLabel: fpt.sourceLabel,
    });
  }
  
  console.log("\nVerification complete.");
}

main().catch(console.error);
