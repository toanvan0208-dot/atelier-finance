import { prisma } from "../src/lib/database";
import {
  type MarketPriceProvenanceMetadataContract,
  type StalenessStatus,
  type AdjustmentStatus,
  buildSafeMarketPriceProvenance,
} from "../src/features/technical/lib/market-price-provenance-contract";

const mockRows = [
  {
    id: "mock_1",
    ticker: "FPT",
    tradingDate: new Date(), // Today
    closePrice: 130.5,
    adjustedClosePrice: 130.5,
    volume: 1500000,
    dataMode: "research_only",
    fallbackUsed: false,
  },
  {
    id: "mock_2",
    ticker: "HPG",
    tradingDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
    closePrice: 28.5,
    adjustedClosePrice: null, // Unknown adjustment
    volume: 25000000,
    dataMode: "research_only",
    fallbackUsed: false,
  },
  {
    id: "mock_3",
    ticker: "VNM",
    tradingDate: null, // Missing timestamp
    closePrice: 65.0,
    adjustedClosePrice: 65.0,
    volume: null, // Missing volume
    dataMode: "research_only",
    fallbackUsed: false,
  },
  {
    id: "mock_4",
    ticker: "MSN",
    tradingDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000), // Stale
    closePrice: null, // Missing price
    adjustedClosePrice: null,
    volume: 1200000,
    dataMode: "sample",
    fallbackUsed: true,
  },
  {
    id: "mock_5",
    ticker: "MWG",
    tradingDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    closePrice: 62.0,
    adjustedClosePrice: 62.0,
    volume: 5000000,
    dataMode: "research_only",
    fallbackUsed: false,
  }
];

async function runDryRun() {
  console.log("Phase 145F - MarketPrice / Technical Dry-Run Ingestion Contract\n");

  const APPROVED_TICKERS = ["FPT", "HPG", "VNM", "MSN", "MWG"];
  const unsupportedTickers = ["VCB"];

  let providerFetchAttempted = true;
  let providerFetchSucceeded = false;
  let sourceUsed = "existing_staging_read_path";

  let candidateRowsNormalized = 0;
  let provenanceRowsPrepared = 0;
  let productionApprovedCount = 0;
  let researchOnlyCount = 0;
  let candidateProviderDataCount = 0;
  let fallbackUsedCount = 0;
  
  let missingPriceCount = 0;
  let missingVolumeCount = 0;
  let missingTimestampCount = 0;

  const stalenessStatusCounts: Record<string, number> = {};
  const adjustmentStatusCounts: Record<string, number> = {};
  let checksumGeneratedCount = 0;

  for (const ticker of APPROVED_TICKERS) {
    let rows: any[] = [];
    try {
      rows = await prisma.marketPrice.findMany({
        where: { ticker },
        orderBy: { tradingDate: "desc" },
        take: 5
      });
      providerFetchSucceeded = true;
    } catch (e) {
      // Known TLS error on local test DB
      sourceUsed = "existing_local_contract (mock fallback due to TlsConnectionError)";
      rows = mockRows.filter(r => r.ticker === ticker);
    }

    for (const row of rows) {
      candidateRowsNormalized++;
      
      if (row.dataMode === "research_only") researchOnlyCount++;
      if (row.dataMode === "candidate_provider_data") candidateProviderDataCount++;
      if (row.dataMode === "sample" || row.fallbackUsed) fallbackUsedCount++;
      // No production_approved assignment here

      if (!row.closePrice) missingPriceCount++;
      if (!row.volume) missingVolumeCount++;
      if (!row.tradingDate) missingTimestampCount++;

      // 6. Gán stalenessStatus
      let stalenessStatus: StalenessStatus = "needs_review";
      if (row.tradingDate) {
        const diffDays = (Date.now() - row.tradingDate.getTime()) / (1000 * 60 * 60 * 24);
        if (diffDays <= 3) stalenessStatus = "fresh";
        else if (diffDays <= 14) stalenessStatus = "provider_delayed";
        else stalenessStatus = "stale";
      } else {
        stalenessStatus = "missing";
      }
      stalenessStatusCounts[stalenessStatus] = (stalenessStatusCounts[stalenessStatus] || 0) + 1;

      // 7. Gán adjustmentStatus
      let adjustmentStatus: AdjustmentStatus = "unknown";
      if (row.adjustedClosePrice !== null && row.adjustedClosePrice !== undefined) {
        adjustmentStatus = "adjusted";
      }
      adjustmentStatusCounts[adjustmentStatus] = (adjustmentStatusCounts[adjustmentStatus] || 0) + 1;

      // 3. Tạo provenance candidate
      const importRunId = `dry_run_${Date.now()}`;
      const checksum = `chk_${row.id}_${row.closePrice || 0}`;
      
      const provenance: MarketPriceProvenanceMetadataContract = buildSafeMarketPriceProvenance({
        marketPriceId: row.id,
        providerName: "vnstock",
        providerType: "undocumented_provider",
        exchange: null,
        stalenessStatus,
        adjustmentStatus,
        fallbackUsed: row.fallbackUsed || row.dataMode === "sample",
        needsReview: stalenessStatus === "needs_review" || adjustmentStatus === "unknown",
        importRunId,
        rawPayloadChecksum: checksum
      });

      if (provenance.rawPayloadChecksum) checksumGeneratedCount++;
      provenanceRowsPrepared++;
    }
  }

  // Strictly gate the readiness check
  const readyForWritePath = 
    missingTimestampCount === 0 && 
    candidateRowsNormalized > 0 && 
    productionApprovedCount === 0 && 
    missingPriceCount === 0 &&
    (adjustmentStatusCounts["unknown"] ?? 0) === 0;

  console.log(`phase: 145F`);
  console.log(`mode: dry_run_no_write`);
  console.log(`tickersChecked: ${APPROVED_TICKERS.join(", ")}`);
  console.log(`providerFetchAttempted: ${providerFetchAttempted}`);
  console.log(`providerFetchSucceeded: ${providerFetchSucceeded}`);
  console.log(`sourceUsed: ${sourceUsed}`);
  console.log(`candidateRowsNormalized: ${candidateRowsNormalized}`);
  console.log(`provenanceRowsPrepared: ${provenanceRowsPrepared}`);
  console.log(`productionApprovedCount: ${productionApprovedCount}`);
  console.log(`researchOnlyCount: ${researchOnlyCount}`);
  console.log(`candidateProviderDataCount: ${candidateProviderDataCount}`);
  console.log(`missingPriceCount: ${missingPriceCount}`);
  console.log(`missingVolumeCount: ${missingVolumeCount}`);
  console.log(`missingTimestampCount: ${missingTimestampCount}`);
  console.log(`stalenessStatusCounts: ${JSON.stringify(stalenessStatusCounts)}`);
  console.log(`adjustmentStatusCounts: ${JSON.stringify(adjustmentStatusCounts)}`);
  console.log(`checksumGeneratedCount: ${checksumGeneratedCount}`);
  console.log(`fallbackUsedCount: ${fallbackUsedCount}`);
  console.log(`unsupportedTickers: ${unsupportedTickers.join(", ")}`);
  console.log(`writeAttempted: false`);
  console.log(`readyForWritePath: ${readyForWritePath ? "true" : "false (needs_review due to missing fields/unknown adjustment)"}`);
  console.log(`recommendedNextPhase: Phase 145G — MarketPrice / Technical provider payload gap closure`);

  await prisma.$disconnect();
}

runDryRun().catch(e => {
  console.error(e);
  process.exit(1);
});
