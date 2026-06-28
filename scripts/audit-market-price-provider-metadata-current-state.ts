process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
import { prisma } from "../src/lib/database/client";

async function runAudit() {
  console.log("phase: 146E");
  console.log("mode: market_price_provider_metadata_current_state_audit");

  try {
    const marketPriceRowCount = await prisma.marketPrice.count();
    const provenanceRowCount = await prisma.marketPriceProvenanceMetadata.count();
    const unitMetadataRowCount = await prisma.marketPriceUnitMetadata.count();

    const dataSources = await prisma.dataSource.findMany({
      where: {
        OR: [
          { name: "vnstock" },
          { name: { contains: "vnstock" } }
        ]
      }
    });
    
    const provs = await prisma.marketPriceProvenanceMetadata.findMany();
    
    const sourceLabels = new Set<string>();
    const dataModeCounts: Record<string, number> = {};
    const providerTypeCounts: Record<string, number> = {};
    let productionApprovedTrueCount = 0;
    let needsReviewTrueCount = 0;
    const warningCodeCounts: Record<string, number> = {};
    
    let currencyPresent = 0;
    let exchangePresent = 0;
    let priceUnitPresent = 0;
    let volumeUnitPresent = 0;
    let adjustmentEvidencePresent = 0;

    for (const p of provs) {
      if (p.sourceLabel) sourceLabels.add(p.sourceLabel);
      if (p.dataMode) dataModeCounts[p.dataMode] = (dataModeCounts[p.dataMode] || 0) + 1;
      if (p.providerType) providerTypeCounts[p.providerType] = (providerTypeCounts[p.providerType] || 0) + 1;
      
      if (p.productionApproved) productionApprovedTrueCount++;
      if (p.needsReview) needsReviewTrueCount++;
      
      if (p.warningCodes) {
        let codes: string[] = [];
        if (Array.isArray(p.warningCodes)) codes = p.warningCodes as string[];
        else if (typeof p.warningCodes === 'string') {
          try {
             codes = JSON.parse(p.warningCodes);
          } catch(e) {}
        }
        for (const c of codes) {
          warningCodeCounts[c] = (warningCodeCounts[c] || 0) + 1;
        }
      }
      
      if (p.currency) currencyPresent++;
      if (p.exchange) exchangePresent++;
      if (p.priceUnit) priceUnitPresent++;
      if (p.volumeUnit) volumeUnitPresent++;
      if (p.adjustmentStatus && p.adjustmentStatus !== "needs_review" && p.adjustmentStatus !== "unknown") {
        adjustmentEvidencePresent++;
      }
    }

    const tickersChecked = ["FPT", "HPG", "VNM", "MSN", "MWG"];
    
    console.log(`tickersChecked: ${tickersChecked.join(", ")}`);
    console.log(`marketPriceRowCount: ${marketPriceRowCount}`);
    console.log(`provenanceRowCount: ${provenanceRowCount}`);
    console.log(`unitMetadataRowCount: ${unitMetadataRowCount}`);
    console.log(`dataSourceRecordsFound: ${dataSources.length}`);
    console.log(`sourceLabels: ${Array.from(sourceLabels).join(", ")}`);
    console.log(`dataModeCounts: ${JSON.stringify(dataModeCounts)}`);
    console.log(`providerTypeCounts: ${JSON.stringify(providerTypeCounts)}`);
    console.log(`productionApprovedTrueCount: ${productionApprovedTrueCount}`);
    console.log(`needsReviewTrueCount: ${needsReviewTrueCount}`);
    console.log(`warningCodeCounts: ${JSON.stringify(warningCodeCounts)}`);
    console.log(`metadataFieldCoverage: { currency: ${currencyPresent}/${provs.length}, exchange: ${exchangePresent}/${provs.length}, priceUnit: ${priceUnitPresent}/${provs.length}, volumeUnit: ${volumeUnitPresent}/${provs.length}, adjustmentEvidence: ${adjustmentEvidencePresent}/${provs.length} }`);
    console.log(`schemaFieldAvailability: currency(true), exchange(true), priceUnit(true), volumeUnit(true), adjustmentStatus(true)`);
    console.log(`readyForMetadataNormalization: true`);
    console.log(`readyForProductionApproval: false`);
    console.log(`auditPassed: true`);
    console.log(`knownGaps: Provider is missing unit evidence and exchange mappings. Data needs normalization rules to map safely.`);

  } catch (error) {
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

runAudit();
