import { Client } from "pg";
import { fetchLocalPythonVnstockHistory } from "../src/lib/data-sources/vnstock-market-pvt-controlled-ingestion";
import crypto from "crypto";

async function runMappingAndWrite() {
    const confirmWrite = process.argv.includes('--confirm-write');
    console.log(`Phase 145T - MarketPrice provenance sidecar confirm write\n`);
    
    if (!confirmWrite) {
        console.log(`--- RUNNING IN DRY RUN MODE --- (Missing --confirm-write flag)`);
    } else {
        console.log(`--- RUNNING IN WRITE MODE --- (--confirm-write flag detected)`);
    }

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
    let rowsInsertedOrUpserted = 0;
    let rowsBlocked = 0;
    let blockedReasons = new Set<string>();

    const importRunId = "run_" + new Date().getTime();

    // 4. Pre-write count
    let preWriteRowCount = 0;
    if (confirmWrite) {
        let cleanDbUrl = process.env.DATABASE_URL || '';
        if (cleanDbUrl.includes('?')) {
            cleanDbUrl = cleanDbUrl.split('?')[0];
        }
        const tempClient = new Client({
            connectionString: cleanDbUrl,
            ssl: { rejectUnauthorized: false }
        });
        await tempClient.connect();
        const preCountRes = await tempClient.query(`SELECT count(*) FROM "MarketPriceProvenanceMetadata"`);
        preWriteRowCount = parseInt(preCountRes.rows[0].count, 10);
        await tempClient.end();
    }

    const candidatesToWrite: any[] = [];

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
                        marketDate: marketDate as Date,
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
                            candidatesToWrite.push(candidateProvRow);
                        }
                    } else {
                        rowsBlocked++;
                        blockedReasons.add("schema violation (missing required fields)");
                    }
                }
            }
        } catch (e: any) {
            console.error(`Failed fetching for ${ticker}:`, e.message);
        }
    }

    let postWriteRowCount = 0;
    
    if (confirmWrite && candidatesToWrite.length > 0 && productionApprovedTrueCount === 0) {
        if (!process.env.DATABASE_URL) {
            console.error("DATABASE_URL is not set.");
            process.exit(1);
        }
        
        let cleanDbUrl = process.env.DATABASE_URL;
        if (cleanDbUrl.includes('?')) {
            cleanDbUrl = cleanDbUrl.split('?')[0];
        }
        
        const client = new Client({
            connectionString: cleanDbUrl,
            ssl: { rejectUnauthorized: false }
        });
        await client.connect();

        // Upsert into DB
        for (const candidate of candidatesToWrite) {
            const warningCodesJson = JSON.stringify(candidate.warningCodes);

            await client.query(`
                INSERT INTO "MarketPriceProvenanceMetadata" (
                    "id", "ticker", "marketDate", "providerName", "providerType", "sourceLabel",
                    "dataMode", "productionApproved", "fetchedAt", "exchange", "currency",
                    "priceUnit", "volumeUnit", "adjustmentStatus", "stalenessStatus",
                    "fallbackUsed", "needsReview", "importRunId", "payloadChecksum", "warningCodes", "updatedAt"
                ) VALUES (
                    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21
                )
                ON CONFLICT ("ticker", "marketDate", "sourceLabel") DO UPDATE SET
                    "providerName" = EXCLUDED."providerName",
                    "providerType" = EXCLUDED."providerType",
                    "dataMode" = EXCLUDED."dataMode",
                    "productionApproved" = EXCLUDED."productionApproved",
                    "fetchedAt" = EXCLUDED."fetchedAt",
                    "exchange" = EXCLUDED."exchange",
                    "currency" = EXCLUDED."currency",
                    "priceUnit" = EXCLUDED."priceUnit",
                    "volumeUnit" = EXCLUDED."volumeUnit",
                    "adjustmentStatus" = EXCLUDED."adjustmentStatus",
                    "stalenessStatus" = EXCLUDED."stalenessStatus",
                    "fallbackUsed" = EXCLUDED."fallbackUsed",
                    "needsReview" = EXCLUDED."needsReview",
                    "importRunId" = EXCLUDED."importRunId",
                    "payloadChecksum" = EXCLUDED."payloadChecksum",
                    "warningCodes" = EXCLUDED."warningCodes",
                    "updatedAt" = EXCLUDED."updatedAt"
            `, [
                crypto.randomUUID(),
                candidate.ticker,
                candidate.marketDate,
                candidate.providerName,
                candidate.providerType,
                candidate.sourceLabel,
                candidate.dataMode,
                candidate.productionApproved,
                candidate.fetchedAt,
                candidate.exchange,
                candidate.currency,
                candidate.priceUnit,
                candidate.volumeUnit,
                candidate.adjustmentStatus,
                candidate.stalenessStatus,
                candidate.fallbackUsed,
                candidate.needsReview,
                candidate.importRunId,
                candidate.payloadChecksum,
                warningCodesJson,
                new Date().toISOString()
            ]);
            rowsInsertedOrUpserted++;
        }
        
        const countRes = await client.query(`SELECT count(*) FROM "MarketPriceProvenanceMetadata"`);
        postWriteRowCount = parseInt(countRes.rows[0].count, 10);
        
        await client.end();
    }

    const readyForConfirmWritePhase = 
        candidateProvenanceRows > 0 && 
        candidateProvenanceRows === candidateRowsValidForSchema && 
        productionApprovedTrueCount === 0 && 
        rowsBlocked === 0;

    console.log(`\n--- Write Summary ---`);
    console.log(`phase: 145T`);
    console.log(`mode: market_price_provenance_sidecar_confirm_write`);
    console.log(`confirmWrite: ${confirmWrite}`);
    console.log(`providerFetchAttempted: ${providerFetchAttempted}`);
    console.log(`providerFetchSucceeded: ${providerFetchSucceeded}`);
    console.log(`tickersChecked: ${APPROVED_TICKERS.join(", ")}`);
    console.log(`candidateProvenanceRows: ${candidateProvenanceRows}`);
    console.log(`candidateRowsValidForSchema: ${candidateRowsValidForSchema}`);
    console.log(`preWriteRowCount: ${preWriteRowCount}`);
    console.log(`rowsInsertedOrUpserted: ${rowsInsertedOrUpserted}`);
    console.log(`postWriteRowCount: ${postWriteRowCount}`);
    console.log(`productionApprovedTrueCount: ${productionApprovedTrueCount}`);
    console.log(`needsReviewTrueCount: ${needsReviewTrueCount}`);
    console.log(`adjustmentStatusCounts: ${JSON.stringify(adjustmentStatusCounts)}`);
    console.log(`stalenessStatusCounts: ${JSON.stringify(stalenessStatusCounts)}`);
    console.log(`dataModeCounts: ${JSON.stringify(dataModeCounts)}`);
    console.log(`providerTypeCounts: ${JSON.stringify(providerTypeCounts)}`);
    console.log(`warningCodeCounts: ${JSON.stringify(warningCodeCounts)}`);
    console.log(`payloadChecksumGeneratedCount: ${payloadChecksumGeneratedCount}`);
    console.log(`importRunId: ${importRunId}`);
    console.log(`targetTable: MarketPriceProvenanceMetadata`);
    console.log(`tablesWritten: ${confirmWrite ? 'MarketPriceProvenanceMetadata' : 'none'}`);
    console.log(`marketPriceRowsChanged: 0`);
    console.log(`marketPriceUnitMetadataRowsChanged: 0`);
    console.log(`dbWriteAttempted: ${confirmWrite}`);
    console.log(`businessDataWriteAttempted: ${confirmWrite}`);
    console.log(`importAttempted: false`);
    console.log(`seedAttempted: false`);
    console.log(`migrationAttempted: false`);
    console.log(`readyForPostWriteSmoke: ${confirmWrite && rowsInsertedOrUpserted === 90}`);
    console.log(`readyForProductionApproval: false`);
    console.log(`recommendedNextPhase: ${confirmWrite ? 'Phase 145U — MarketPrice provenance sidecar read-path integration smoke' : 'Phase 145T — Explicitly approved MarketPrice provenance sidecar confirm-write on staging (waiting for --confirm-write)'}`);
    
}

runMappingAndWrite().catch(async (e) => {
    console.error(e);
    process.exit(1);
});
