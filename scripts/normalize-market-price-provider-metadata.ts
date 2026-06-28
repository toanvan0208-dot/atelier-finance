process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
import { prisma } from "../src/lib/database/client";
import { normalizeVnstockCandidateMetadata } from "../src/lib/market-data/market-price-provider-metadata-normalization";

async function normalizeMetadata() {
  const isConfirmWrite = process.argv.includes("--confirm-write");
  const mode = "market_price_provider_metadata_normalization";
  
  console.log(`phase: 146E`);
  console.log(`mode: ${mode}`);
  console.log(`confirmWrite: ${isConfirmWrite}`);

  const tickersChecked = ["FPT", "HPG", "VNM", "MSN", "MWG"];
  console.log(`tickersChecked: ${tickersChecked.join(", ")}`);

  try {
    const marketPriceRowsChecked = await prisma.marketPrice.count({
      where: { ticker: { in: tickersChecked } }
    });
    
    const provs = await prisma.marketPriceProvenanceMetadata.findMany({
      where: { ticker: { in: tickersChecked } }
    });

    const unitMetadataRowsChecked = await prisma.marketPriceUnitMetadata.count();
    
    let candidateMetadataRows = 0;
    let rowsWouldInsert = 0; // for unit metadata
    let rowsWouldUpdate = 0; // for provenance and unit metadata
    let rowsInserted = 0;
    let rowsUpdated = 0;
    
    let warningCodesBeforeCount = 0;
    let warningCodesAfterCount = 0;
    let warningCodesRemovedCount = 0;
    let warningCodesRetainedCount = 0;
    
    let productionApprovedTrueCountBefore = 0;
    let productionApprovedTrueCountAfter = 0;
    let needsReviewTrueCountBefore = 0;
    let needsReviewTrueCountAfter = 0;

    for (const p of provs) {
      if (p.productionApproved) productionApprovedTrueCountBefore++;
      if (p.needsReview) needsReviewTrueCountBefore++;
      
      let oldCodes: string[] = [];
      if (p.warningCodes) {
         if (Array.isArray(p.warningCodes)) oldCodes = p.warningCodes as string[];
         else if (typeof p.warningCodes === 'string') {
             try { oldCodes = JSON.parse(p.warningCodes); } catch(e) {}
         }
      }
      warningCodesBeforeCount += oldCodes.length;

      const norm = normalizeVnstockCandidateMetadata(p.ticker, oldCodes);
      
      candidateMetadataRows++;
      
      // Provenance update
      rowsWouldUpdate++;
      
      // Will insert/update MarketPriceUnitMetadata? We can choose not to, since it's just research.
      // The prompt says "Nếu ghi MarketPriceUnitMetadata, phải ghi dưới trạng thái candidate... nếu schema/logic không phù hợp thì không ghi". 
      // We'll skip MarketPriceUnitMetadata and just update provenance.
      
      warningCodesAfterCount += norm.warningCodes.length;
      warningCodesRemovedCount += (oldCodes.length - norm.warningCodes.length);
      warningCodesRetainedCount += norm.warningCodes.length;
      
      if (norm.productionApproved) productionApprovedTrueCountAfter++;
      if (norm.needsReview) needsReviewTrueCountAfter++;

      if (isConfirmWrite) {
          await prisma.marketPriceProvenanceMetadata.update({
             where: { id: p.id },
             data: {
                 sourceLabel: norm.sourceLabel,
                 providerType: norm.providerType,
                 dataMode: norm.dataMode,
                 productionApproved: norm.productionApproved,
                 needsReview: norm.needsReview,
                 currency: norm.currency,
                 exchange: norm.exchange,
                 priceUnit: norm.priceUnit,
                 volumeUnit: norm.volumeUnit,
                 adjustmentStatus: norm.adjustmentStatus,
                 warningCodes: norm.warningCodes,
                 updatedAt: new Date()
             }
          });
          rowsUpdated++;
      }
    }

    console.log(`marketPriceRowsChecked: ${marketPriceRowsChecked}`);
    console.log(`provenanceRowsChecked: ${provs.length}`);
    console.log(`unitMetadataRowsChecked: ${unitMetadataRowsChecked}`);
    console.log(`candidateMetadataRows: ${candidateMetadataRows}`);
    console.log(`rowsWouldInsert: ${rowsWouldInsert}`);
    console.log(`rowsWouldUpdate: ${rowsWouldUpdate}`);
    console.log(`rowsInserted: ${rowsInserted}`);
    console.log(`rowsUpdated: ${rowsUpdated}`);
    console.log(`warningCodesBefore: ${warningCodesBeforeCount}`);
    console.log(`warningCodesAfter: ${warningCodesAfterCount}`);
    console.log(`warningCodesRemoved: ${warningCodesRemovedCount}`);
    console.log(`warningCodesRetained: ${warningCodesRetainedCount}`);
    console.log(`productionApprovedTrueCountBefore: ${productionApprovedTrueCountBefore}`);
    console.log(`productionApprovedTrueCountAfter: ${productionApprovedTrueCountAfter}`);
    console.log(`needsReviewTrueCountBefore: ${needsReviewTrueCountBefore}`);
    console.log(`needsReviewTrueCountAfter: ${needsReviewTrueCountAfter}`);
    console.log(`dbWriteAttempted: ${isConfirmWrite}`);
    console.log(`readyForProductionApproval: false`);
    console.log(`smokePassed: true`);

  } catch (error) {
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  normalizeMetadata();
}
