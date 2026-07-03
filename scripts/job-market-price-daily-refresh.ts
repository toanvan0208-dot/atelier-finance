process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
/* eslint-disable @typescript-eslint/no-explicit-any */
import "dotenv/config";
import { prisma } from "../src/lib/database/client";
import { fetchLocalPythonVnstockHistory } from "../src/lib/data-sources/vnstock-market-pvt-controlled-ingestion";
import crypto from "crypto";

async function runDailyProviderRefreshJob() {
    const isConfirmWrite = process.argv.includes("--confirm-write");
    const mode = "market_price_daily_refresh_job";
    
    console.log(`phase: 146C\nmode: ${mode}\nconfirmWrite: ${isConfirmWrite}\n`);

    const APPROVED_TICKERS = ["FPT", "HPG", "VNM", "MSN", "MWG"];
    
    let providerFetchAttempted = false;
    let providerFetchSucceeded = false;
    let candidateMarketPriceRows = 0;
    let candidateProvenanceRows = 0;
    let candidateRowsValidForSchema = 0;
    let productionApprovedTrueCount = 0;
    let needsReviewTrueCount = 0;
    
    const adjustmentStatusCounts: Record<string, number> = {};
    const stalenessStatusCounts: Record<string, number> = {};
    const dataModeCounts: Record<string, number> = {};
    const providerTypeCounts: Record<string, number> = {};
    const warningCodeCounts: Record<string, number> = {};
    
    let payloadChecksumGeneratedCount = 0;
    let preWriteMarketPriceRowCount = 0;
    let preWriteProvenanceRowCount = 0;
    let rowsAlreadyExist = 0;
    let rowsWouldInsert = 0;
    let rowsWouldUpdate = 0;
    let rowsBlocked = 0;
    let rowsInsertedMarketPrice = 0;
    let rowsInsertedProvenance = 0;
    let postWriteMarketPriceRowCount = 0;
    let postWriteProvenanceRowCount = 0;
    const marketPriceUnitMetadataRowsChanged = 0;

    const importRunId = "run_" + new Date().getTime();
    const candidateDataToInsert: any[] = [];
    
    try {
        preWriteMarketPriceRowCount = await prisma.marketPrice.count();
        preWriteProvenanceRowCount = await prisma.marketPriceProvenanceMetadata.count();

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

        let sourceId = vnstockSource?.id;
        if (!sourceId && isConfirmWrite) {
            const createdSource = await prisma.dataSource.create({
                data: {
                    name: "vnstock",
                    sourceType: "unknown",
                    supportedDataGroups: "market_price",
                    usageStatus: "research_only",
                    licenseStatus: "needs_review",
                    tosStatus: "needs_review",
                    accessMethod: "undocumented_api"
                }
            });
            sourceId = createdSource.id;
        }

        const sourceAvailableForWrite = Boolean(sourceId);

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

        const existingMap = new Map<string, any>();
        for (const emp of existingMarketPrices) {
            const dateKey = emp.tradingDate.toISOString().split("T")[0];
            existingMap.set(`${emp.ticker}_${dateKey}`, emp);
        }

        for (const ticker of APPROVED_TICKERS) {
            providerFetchAttempted = true;
            try {
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
                        
                        const marketDateStr = row.time || row.date || row.tradingDate;
                        let marketDate: Date | null = null;
                        if (marketDateStr) {
                            marketDate = new Date(marketDateStr);
                        }
                        
                        const warningCodes: string[] = [];
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

                        const dataMode = "candidate_provider_data"; 
                        const providerName = "vnstock";
                        const providerType = "undocumented_provider";
                        const sourceLabel = `vnstock_python_market_pvt_auto`;
                        const productionApproved = false;
                        const fallbackUsed = false;
                        
                        const payloadChecksum = crypto.createHash('sha256').update(JSON.stringify(row)).digest('hex');

                        const companyId = companyMap.get(ticker);
                        const closePrice = row.close !== undefined ? row.close : row.closePrice;
                        
                        if (!marketDate || isNaN(marketDate.getTime()) || !companyId || closePrice === undefined || closePrice === null) {
                            rowsBlocked++;
                            continue;
                        }

                        if (isConfirmWrite && !sourceAvailableForWrite) {
                            rowsBlocked++;
                            continue;
                        }

                        candidateMarketPriceRows++;
                        candidateProvenanceRows++;

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
                        } else if (candidateProvRow.productionApproved) {
                            rowsBlocked++;
                        } else if (!candidateProvRow.payloadChecksum) {
                            rowsBlocked++;
                        } else {
                            const dateKey = marketDate.toISOString().split("T")[0];
                            const existingRow = existingMap.get(`${ticker}_${dateKey}`);
                            
                            let operation = "insert";
                            let updateId = null;

                            if (existingRow) {
                                const existingClose = Number(existingRow.closePrice);
                                const newClose = Number(closePrice);
                                
                                if (Math.abs(existingClose - newClose) > 0.001) {
                                    rowsWouldUpdate++;
                                    operation = "update";
                                    updateId = existingRow.id;
                                } else {
                                    rowsAlreadyExist++;
                                    operation = "skip";
                                }
                            } else {
                                rowsWouldInsert++;
                            }

                            if (operation !== "skip") {
                                candidateDataToInsert.push({
                                    operation,
                                    updateId,
                                    marketPriceData: {
                                        companyId,
                                        ticker,
                                        tradingDate: marketDate,
                                        periodType: "day",
                                        period: dateKey,
                                        closePrice: closePrice,
                                        volume: row.volume !== undefined ? row.volume : null,
                                        sourceId: sourceId ?? "__dry_run_source__",
                                        sourceLabel,
                                        sourceType: "unknown",
                                        dataMode: "research_only",
                                        asOf: marketDate,
                                        qualityStatus: "unknown",
                                        readiness: "unknown"
                                    },
                                    provenanceData: candidateProvRow
                                });
                            }
                        }
                    }
                }
            } catch (e: any) {
                console.error(`Failed fetching for ${ticker}:`, e.message);
            }
        }

        // Execute writes if confirm-write is present
        if (isConfirmWrite) {
            for (const item of candidateDataToInsert) {
                try {
                    // 1. Write MarketPrice
                    if (item.operation === "insert") {
                        await prisma.marketPrice.create({
                            data: item.marketPriceData
                        });
                        rowsInsertedMarketPrice++;
                    } else if (item.operation === "update") {
                        await prisma.marketPrice.update({
                            where: { id: item.updateId },
                            data: {
                                closePrice: item.marketPriceData.closePrice,
                                volume: item.marketPriceData.volume,
                                updatedAt: new Date()
                            }
                        });
                        // Treating updates as inserts for simplicity of rowsInserted count in summary
                        rowsInsertedMarketPrice++;
                    }

                    // 2. Write Provenance
                    const pData = item.provenanceData;
                    await prisma.marketPriceProvenanceMetadata.upsert({
                        where: {
                            ticker_marketDate_sourceLabel: {
                                ticker: pData.ticker,
                                marketDate: pData.marketDate,
                                sourceLabel: pData.sourceLabel
                            }
                        },
                        update: {
                            dataMode: pData.dataMode,
                            productionApproved: pData.productionApproved,
                            fetchedAt: pData.fetchedAt,
                            adjustmentStatus: pData.adjustmentStatus,
                            stalenessStatus: pData.stalenessStatus,
                            fallbackUsed: pData.fallbackUsed,
                            needsReview: pData.needsReview,
                            importRunId: pData.importRunId,
                            payloadChecksum: pData.payloadChecksum,
                            warningCodes: pData.warningCodes
                        },
                        create: {
                            ...pData
                        }
                    });
                    rowsInsertedProvenance++;
                } catch (e: any) {
                    console.error("Failed writing row:", e.message);
                }
            }
        }

        postWriteMarketPriceRowCount = await prisma.marketPrice.count();
        postWriteProvenanceRowCount = await prisma.marketPriceProvenanceMetadata.count();

    } catch (e) {
        console.error("Fatal error:", e);
    }

    const readyForAssistantReadinessSmoke = isConfirmWrite && rowsInsertedMarketPrice > 0;
    const readyForPostWriteSmoke = isConfirmWrite && rowsInsertedMarketPrice > 0;
    
    let recommendedNextPhase = "Phase 146C - Re-run with confirm-write if needed";
    if (isConfirmWrite) {
        recommendedNextPhase = "Phase 146D - Scheduled MarketPrice refresh dry-run orchestration";
    }

    console.log(`\n--- Smoke Summary ---`);
    console.log(`phase: 146C`);
    console.log(`mode: ${mode}`);
    console.log(`confirmWrite: ${isConfirmWrite}`);
    console.log(`providerFetchAttempted: ${providerFetchAttempted}`);
    console.log(`providerFetchSucceeded: ${providerFetchSucceeded}`);
    console.log(`tickersChecked: ${APPROVED_TICKERS.join(", ")}`);
    console.log(`candidateMarketPriceRows: ${candidateMarketPriceRows}`);
    console.log(`candidateProvenanceRows: ${candidateProvenanceRows}`);
    console.log(`candidateRowsValidForSchema: ${candidateRowsValidForSchema}`);
    console.log(`preWriteMarketPriceRowCount: ${preWriteMarketPriceRowCount}`);
    console.log(`preWriteProvenanceRowCount: ${preWriteProvenanceRowCount}`);
    console.log(`rowsAlreadyExist: ${rowsAlreadyExist}`);
    console.log(`rowsWouldInsert: ${rowsWouldInsert}`);
    console.log(`rowsWouldUpdate: ${rowsWouldUpdate}`);
    console.log(`rowsBlocked: ${rowsBlocked}`);
    console.log(`rowsInsertedMarketPrice: ${rowsInsertedMarketPrice}`);
    console.log(`rowsInsertedProvenance: ${rowsInsertedProvenance}`);
    console.log(`postWriteMarketPriceRowCount: ${postWriteMarketPriceRowCount}`);
    console.log(`postWriteProvenanceRowCount: ${postWriteProvenanceRowCount}`);
    console.log(`productionApprovedTrueCount: ${productionApprovedTrueCount}`);
    console.log(`needsReviewTrueCount: ${needsReviewTrueCount}`);
    console.log(`dataModeCounts: ${JSON.stringify(dataModeCounts)}`);
    console.log(`providerTypeCounts: ${JSON.stringify(providerTypeCounts)}`);
    console.log(`adjustmentStatusCounts: ${JSON.stringify(adjustmentStatusCounts)}`);
    console.log(`warningCodeCounts: ${JSON.stringify(warningCodeCounts)}`);
    console.log(`payloadChecksumGeneratedCount: ${payloadChecksumGeneratedCount}`);
    console.log(`importRunId: ${importRunId}`);
    console.log(`targetTables: MarketPrice, MarketPriceProvenanceMetadata`);
    console.log(`tablesWritten: ${isConfirmWrite ? "MarketPrice, MarketPriceProvenanceMetadata" : "none"}`);
    console.log(`marketPriceUnitMetadataRowsChanged: ${marketPriceUnitMetadataRowsChanged}`);
    console.log(`dbWriteAttempted: ${isConfirmWrite}`);
    console.log(`marketPriceWriteAttempted: ${isConfirmWrite}`);
    console.log(`provenanceWriteAttempted: ${isConfirmWrite}`);
    console.log(`importAttempted: false`);
    console.log(`seedAttempted: false`);
    console.log(`migrationAttempted: false`);
    console.log(`readyForPostWriteSmoke: ${readyForPostWriteSmoke}`);
    console.log(`readyForAssistantReadinessSmoke: ${readyForAssistantReadinessSmoke}`);
    console.log(`readyForScheduledJobPhase: false`);
    console.log(`readyForProductionApproval: false`);
    console.log(`recommendedNextPhase: ${recommendedNextPhase}`);
}

// Only run if called directly
if (require.main === module) {
    runDailyProviderRefreshJob().catch(err => {
        console.error("Fatal error:", err);
        process.exit(1);
    });
}

export { runDailyProviderRefreshJob };
