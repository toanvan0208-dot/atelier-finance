process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
import { prisma } from "../src/lib/database/client";
import { fetchLocalPythonVnstockHistory } from "../src/lib/data-sources/vnstock-market-pvt-controlled-ingestion";
import crypto from "crypto";


async function runDailyProviderRefreshDryRun() {
    console.log("Phase 145Y - MarketPrice daily provider refresh job dry-run, no write\n");

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
    let existingMarketPriceRowsChecked = 0;
    let rowsAlreadyExist = 0;
    let rowsWouldInsert = 0;
    let rowsWouldUpdate = 0;
    let rowsBlocked = 0;
    let blockedReasons = new Set<string>();

    const importRunId = "run_" + new Date().getTime();
    
    try {
        // Fetch existing companies
        const companies = await prisma.company.findMany({
            where: { ticker: { in: APPROVED_TICKERS } }
        });
        const companyMap = new Map<string, string>();
        for (const c of companies) {
            companyMap.set(c.ticker, c.id);
        }

        const vnstockSource = await prisma.dataSource.findFirst({
            where: { name: "vnstock" }
        });
        const sourceId = vnstockSource?.id || "dummy_source_id";

        // Fetch existing MarketPrice for comparison
        const existingMarketPrices = await prisma.marketPrice.findMany({
            where: { ticker: { in: APPROVED_TICKERS } },
            select: {
                id: true,
                ticker: true,
                tradingDate: true,
                closePrice: true,
                volume: true
            }
        });
        existingMarketPriceRowsChecked = existingMarketPrices.length;

        // Group by ticker and date
        const existingMap = new Map<string, any>();
        for (const emp of existingMarketPrices) {
            const dateKey = emp.tradingDate.toISOString().split("T")[0];
            existingMap.set(`${emp.ticker}_${dateKey}`, emp);
        }

        for (const ticker of APPROVED_TICKERS) {
            providerFetchAttempted = true;
            try {
                // Fetch last 5 days
                const today = new Date();
                const fromDate = new Date(today);
                fromDate.setDate(today.getDate() - 5);
                
                const from = fromDate.toISOString().split("T")[0];
                const to = today.toISOString().split("T")[0];
                
                const rows = await fetchLocalPythonVnstockHistory({ ticker, from, to });
                
                if (rows && rows.length > 0) {
                    providerFetchSucceeded = true;
                    
                    for (const r of rows) {
                        const row = r as any;
                        
                        // Parse date
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

                        const fetchedAt = new Date();
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
                        const dataMode = "candidate_provider_data"; 
                        const providerName = "vnstock";
                        const providerType = "undocumented_provider";
                        const sourceLabel = `vnstock_python_market_pvt_auto`;
                        const productionApproved = false;
                        const fallbackUsed = false;
                        
                        const payloadChecksum = crypto.createHash('sha256').update(JSON.stringify(row)).digest('hex');

                        // Schema validation check for MarketPrice
                        const companyId = companyMap.get(ticker);
                        
                        let closePrice = row.close !== undefined ? row.close : row.closePrice;
                        
                        if (!marketDate || isNaN(marketDate.getTime()) || !companyId || closePrice === undefined || closePrice === null) {
                            rowsBlocked++;
                            if (!companyId) blockedReasons.add("missing companyId");
                            if (!marketDate || isNaN(marketDate.getTime())) blockedReasons.add("missing tradingDate");
                            if (closePrice === undefined || closePrice === null) blockedReasons.add("missing closePrice");
                            continue;
                        }

                        candidateMarketPriceRows++;
                        candidateProvenanceRows++;

                        // Provenance row
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

                        candidateRowsValidForSchema++;

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
                            // Compare with existing MarketPrice
                            const dateKey = marketDate.toISOString().split("T")[0];
                            const existingRow = existingMap.get(`${ticker}_${dateKey}`);
                            
                            if (existingRow) {
                                // Check if we would update
                                // We simulate closePrice comparison, adjusting type if needed
                                const existingClose = Number(existingRow.closePrice);
                                const newClose = Number(closePrice);
                                
                                if (Math.abs(existingClose - newClose) > 0.001) {
                                    rowsWouldUpdate++;
                                } else {
                                    rowsAlreadyExist++;
                                }
                            } else {
                                rowsWouldInsert++;
                            }
                        }
                    }
                }
            } catch (e: any) {
                console.error(`Failed fetching for ${ticker}:`, e.message);
            }
        }
    } catch (e) {
        console.error(e);
    }

    const readyForConfirmWritePhase = 
        providerFetchSucceeded &&
        candidateMarketPriceRows > 0 && 
        candidateMarketPriceRows === candidateRowsValidForSchema && 
        productionApprovedTrueCount === 0 && 
        rowsBlocked === 0 &&
        payloadChecksumGeneratedCount === candidateProvenanceRows;

    let recommendedNextPhase = "Phase 145Z — MarketPrice daily provider refresh mapping gap closure, no write";
    if (readyForConfirmWritePhase) {
        recommendedNextPhase = "Phase 145Z — Explicitly approved MarketPrice daily provider refresh confirm-write on staging";
    }

    console.log(`\n--- Smoke Summary ---`);
    console.log(`phase: 145Y`);
    console.log(`mode: market_price_daily_provider_refresh_dry_run_no_write`);
    console.log(`providerFetchAttempted: ${providerFetchAttempted}`);
    console.log(`providerFetchSucceeded: ${providerFetchSucceeded}`);
    console.log(`tickersChecked: ${APPROVED_TICKERS.join(", ")}`);
    console.log(`candidateMarketPriceRows: ${candidateMarketPriceRows}`);
    console.log(`candidateProvenanceRows: ${candidateProvenanceRows}`);
    console.log(`candidateRowsValidForSchema: ${candidateRowsValidForSchema}`);
    console.log(`existingMarketPriceRowsChecked: ${existingMarketPriceRowsChecked}`);
    console.log(`rowsAlreadyExist: ${rowsAlreadyExist}`);
    console.log(`rowsWouldInsert: ${rowsWouldInsert}`);
    console.log(`rowsWouldUpdate: ${rowsWouldUpdate}`);
    console.log(`rowsBlocked: ${rowsBlocked}`);
    console.log(`blockedReasons: ${Array.from(blockedReasons).join(", ")}`);
    console.log(`productionApprovedTrueCount: ${productionApprovedTrueCount}`);
    console.log(`needsReviewTrueCount: ${needsReviewTrueCount}`);
    console.log(`dataModeCounts: ${JSON.stringify(dataModeCounts)}`);
    console.log(`providerTypeCounts: ${JSON.stringify(providerTypeCounts)}`);
    console.log(`adjustmentStatusCounts: ${JSON.stringify(adjustmentStatusCounts)}`);
    console.log(`stalenessStatusCounts: ${JSON.stringify(stalenessStatusCounts)}`);
    console.log(`warningCodeCounts: ${JSON.stringify(warningCodeCounts)}`);
    console.log(`payloadChecksumGeneratedCount: ${payloadChecksumGeneratedCount}`);
    console.log(`importRunId: ${importRunId}`);
    console.log(`dbWriteAttempted: false`);
    console.log(`marketPriceWriteAttempted: false`);
    console.log(`provenanceWriteAttempted: false`);
    console.log(`importAttempted: false`);
    console.log(`seedAttempted: false`);
    console.log(`migrationAttempted: false`);
    console.log(`readyForConfirmWritePhase: ${readyForConfirmWritePhase}`);
    console.log(`readyForScheduledJobPhase: false`);
    console.log(`readyForProductionApproval: false`);
    console.log(`recommendedNextPhase: ${recommendedNextPhase}`);
}

runDailyProviderRefreshDryRun().catch(err => {
    console.error("Fatal error:", err);
    process.exit(1);
});
