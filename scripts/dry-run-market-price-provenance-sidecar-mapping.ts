import { fetchLocalPythonVnstockHistory } from "../src/lib/data-sources/vnstock-market-pvt-controlled-ingestion";
import crypto from "crypto";

async function runMappingDryRun() {
    console.log("Phase 145S - MarketPrice provenance sidecar mapping dry run\n");

    const APPROVED_TICKERS = ["FPT", "HPG", "VNM", "MSN", "MWG"];
    
    let providerFetchAttempted = false;
    let providerFetchSucceeded = false;
    let candidateMarketPriceRows = 0;
    let candidateProvenanceRows = 0;
    let candidateRowsValidForSchema = 0;
    let productionApprovedTrueCount = 0;
    let needsReviewTrueCount = 0;
    let adjustmentStatusCounts: Record<string, number> = {};
    let stalenessStatusCounts: Record<string, number> = {};
    let dataModeCounts: Record<string, number> = {};
    let providerTypeCounts: Record<string, number> = {};
    let warningCodeCounts: Record<string, number> = {};
    let payloadChecksumGeneratedCount = 0;
    let rowsReadyForConfirmWrite = 0;
    let rowsBlocked = 0;
    let blockedReasons = new Set<string>();

    const importRunId = "run_" + new Date().getTime();

    for (const ticker of APPROVED_TICKERS) {
        providerFetchAttempted = true;
        try {
            const from = "2025-06-01";
            const to = "2025-06-25";
            const rows = await fetchLocalPythonVnstockHistory({ ticker, from, to });
            
            if (rows && rows.length > 0) {
                providerFetchSucceeded = true;
                
                for (const r of rows) {
                    const row = r as any;
                    candidateMarketPriceRows++;

                    // Map to Provenance Sidecar
                    const fetchedAt = new Date();
                    
                    let marketDateStr = row.time || row.date || row.tradingDate;
                    let marketDate: Date | null = null;
                    if (marketDateStr) {
                        marketDate = new Date(marketDateStr);
                    }
                    
                    let warningCodes: string[] = [];
                    let needsReview = false;

                    if (!marketDate || isNaN(marketDate.getTime())) {
                        needsReview = true;
                        warningCodes.push("MISSING_TIMESTAMP");
                    }
                    
                    if (!row.currency) {
                        needsReview = true;
                        warningCodes.push("MISSING_CURRENCY");
                    }
                    if (!row.exchange) {
                        needsReview = true;
                        warningCodes.push("MISSING_EXCHANGE");
                    }
                    if (!row.priceUnit) {
                        needsReview = true;
                        warningCodes.push("MISSING_PRICE_UNIT");
                    }
                    if (!row.volumeUnit) {
                        needsReview = true;
                        warningCodes.push("MISSING_VOLUME_UNIT");
                    }

                    let adjStatus = "unknown";
                    if (!row.adjusted && !row.adj_close) {
                        adjStatus = "needs_review";
                        needsReview = true;
                        warningCodes.push("MISSING_ADJUSTMENT_EVIDENCE");
                    } else if (row.adjusted) {
                        adjStatus = "adjusted";
                    } else if (row.unadjusted) {
                        adjStatus = "unadjusted";
                    }

                    let stalenessStatus = "missing";
                    if (marketDate) {
                        const daysDiff = (fetchedAt.getTime() - marketDate.getTime()) / (1000 * 3600 * 24);
                        if (daysDiff <= 1) {
                            stalenessStatus = "fresh";
                        } else if (daysDiff <= 3) {
                            stalenessStatus = "provider_delayed";
                        } else {
                            stalenessStatus = "stale";
                        }
                    } else {
                        stalenessStatus = "needs_review";
                    }

                    // Provider specifics
                    const dataMode = "candidate_provider_data"; // Never production_approved
                    const providerName = "vnstock";
                    const providerType = "undocumented_provider";
                    const sourceLabel = `vnstock_python_market_pvt_auto`;
                    const productionApproved = false;
                    const fallbackUsed = false;
                    
                    const payloadChecksum = crypto.createHash('sha256').update(JSON.stringify(row)).digest('hex');

                    // Candidate Row creation
                    const candidateProvRow = {
                        ticker,
                        marketDate,
                        providerName,
                        providerType,
                        sourceLabel,
                        dataMode,
                        productionApproved,
                        fetchedAt,
                        exchange: row.exchange || null,
                        currency: row.currency || null,
                        priceUnit: row.priceUnit || null,
                        volumeUnit: row.volumeUnit || null,
                        adjustmentStatus: adjStatus,
                        stalenessStatus,
                        fallbackUsed,
                        needsReview,
                        importRunId,
                        payloadChecksum,
                        warningCodes
                    };

                    candidateProvenanceRows++;
                    
                    // Schema checks
                    if (candidateProvRow.ticker && candidateProvRow.marketDate && candidateProvRow.providerName && candidateProvRow.providerType && candidateProvRow.sourceLabel && candidateProvRow.dataMode && candidateProvRow.adjustmentStatus && candidateProvRow.stalenessStatus) {
                        candidateRowsValidForSchema++;
                        
                        // Collect stats
                        if (candidateProvRow.productionApproved) productionApprovedTrueCount++;
                        if (candidateProvRow.needsReview) needsReviewTrueCount++;
                        adjustmentStatusCounts[adjStatus] = (adjustmentStatusCounts[adjStatus] || 0) + 1;
                        stalenessStatusCounts[stalenessStatus] = (stalenessStatusCounts[stalenessStatus] || 0) + 1;
                        dataModeCounts[dataMode] = (dataModeCounts[dataMode] || 0) + 1;
                        providerTypeCounts[providerType] = (providerTypeCounts[providerType] || 0) + 1;
                        for (const w of warningCodes) {
                            warningCodeCounts[w] = (warningCodeCounts[w] || 0) + 1;
                        }
                        if (candidateProvRow.payloadChecksum) payloadChecksumGeneratedCount++;

                        if (candidateProvRow.fallbackUsed) {
                            rowsBlocked++;
                            blockedReasons.add("fallback-as-real");
                        } else if (candidateProvRow.productionApproved) {
                            rowsBlocked++;
                            blockedReasons.add("productionApproved=true");
                        } else if (!candidateProvRow.payloadChecksum) {
                            rowsBlocked++;
                            blockedReasons.add("missing checksum");
                        } else {
                            rowsReadyForConfirmWrite++;
                        }
                    } else {
                        rowsBlocked++;
                        blockedReasons.add("schema violation (missing required fields)");
                    }
                }
            }
        } catch (e: any) {
            console.error(`Failed fetching for ${ticker}:`, e.message);
            // If failed, we do not fallback.
        }
    }

    const readyForConfirmWritePhase = 
        candidateProvenanceRows > 0 && 
        candidateProvenanceRows === candidateRowsValidForSchema && 
        productionApprovedTrueCount === 0 && 
        rowsBlocked === 0;

    let recommendedNextPhase = "Phase 145T — MarketPrice provenance mapping gap closure, no write";
    if (readyForConfirmWritePhase) {
        recommendedNextPhase = "Phase 145T — Explicitly approved MarketPrice provenance sidecar confirm-write on staging";
    }

    console.log(`\n--- Dry-run Mapping Summary ---`);
    console.log(`phase: 145S`);
    console.log(`mode: market_price_provenance_sidecar_mapping_dry_run_no_write`);
    console.log(`providerFetchAttempted: ${providerFetchAttempted}`);
    console.log(`providerFetchSucceeded: ${providerFetchSucceeded}`);
    console.log(`tickersChecked: ${APPROVED_TICKERS.join(", ")}`);
    console.log(`candidateMarketPriceRows: ${candidateMarketPriceRows}`);
    console.log(`candidateProvenanceRows: ${candidateProvenanceRows}`);
    console.log(`candidateRowsValidForSchema: ${candidateRowsValidForSchema}`);
    console.log(`productionApprovedTrueCount: ${productionApprovedTrueCount}`);
    console.log(`needsReviewTrueCount: ${needsReviewTrueCount}`);
    console.log(`adjustmentStatusCounts: ${JSON.stringify(adjustmentStatusCounts)}`);
    console.log(`stalenessStatusCounts: ${JSON.stringify(stalenessStatusCounts)}`);
    console.log(`dataModeCounts: ${JSON.stringify(dataModeCounts)}`);
    console.log(`providerTypeCounts: ${JSON.stringify(providerTypeCounts)}`);
    console.log(`warningCodeCounts: ${JSON.stringify(warningCodeCounts)}`);
    console.log(`payloadChecksumGeneratedCount: ${payloadChecksumGeneratedCount}`);
    console.log(`importRunId: ${importRunId}`);
    console.log(`rowsReadyForConfirmWrite: ${rowsReadyForConfirmWrite}`);
    console.log(`rowsBlocked: ${rowsBlocked}`);
    console.log(`blockedReasons: ${Array.from(blockedReasons).join(", ")}`);
    console.log(`dbWriteAttempted: false`);
    console.log(`importAttempted: false`);
    console.log(`seedAttempted: false`);
    console.log(`migrationAttempted: false`);
    console.log(`readyForConfirmWritePhase: ${readyForConfirmWritePhase}`);
    console.log(`readyForProductionApproval: false`);
    console.log(`recommendedNextPhase: ${recommendedNextPhase}`);
}

runMappingDryRun();
