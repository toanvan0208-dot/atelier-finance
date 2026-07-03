import "dotenv/config";
import { prisma } from "../src/lib/database/client";
import { scheduleLoop } from "./schedule-market-price-daily-refresh";

type RefreshCounts = {
  dataSource: number;
  marketPrice: number;
  marketPriceProvenance: number;
  marketPriceUnitMetadata: number;
};

async function readCounts(): Promise<RefreshCounts> {
  const [
    dataSource,
    marketPrice,
    marketPriceProvenance,
    marketPriceUnitMetadata,
  ] = await Promise.all([
    prisma.dataSource.count(),
    prisma.marketPrice.count(),
    prisma.marketPriceProvenanceMetadata.count(),
    prisma.marketPriceUnitMetadata.count(),
  ]);

  return {
    dataSource,
    marketPrice,
    marketPriceProvenance,
    marketPriceUnitMetadata,
  };
}

function sameCounts(before: RefreshCounts, after: RefreshCounts): boolean {
  return before.dataSource === after.dataSource &&
    before.marketPrice === after.marketPrice &&
    before.marketPriceProvenance === after.marketPriceProvenance &&
    before.marketPriceUnitMetadata === after.marketPriceUnitMetadata;
}

async function main() {
  const before = await readCounts();

  await scheduleLoop({
    confirmWrite: false,
    runOnStart: false,
    runOnce: true,
    timeOfDay: "18:30",
  });

  const after = await readCounts();
  const noWriteVerified = sameCounts(before, after);

  console.log("\n--- Scheduler No-Write Smoke Summary ---");
  console.log("mode: market_price_daily_refresh_scheduler_no_write_smoke");
  console.log("confirmWrite: false");
  console.log(`marketPriceRowsChanged: ${after.marketPrice - before.marketPrice}`);
  console.log(`provenanceRowsChanged: ${after.marketPriceProvenance - before.marketPriceProvenance}`);
  console.log(`marketPriceUnitMetadataRowsChanged: ${after.marketPriceUnitMetadata - before.marketPriceUnitMetadata}`);
  console.log(`dataSourceRowsChanged: ${after.dataSource - before.dataSource}`);
  console.log(`noWriteVerified: ${noWriteVerified}`);
  console.log(`smokePassed: ${noWriteVerified}`);

  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});
