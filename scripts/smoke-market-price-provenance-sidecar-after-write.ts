import { Client } from "pg";

async function runSmoke() {
    console.log(`Phase 145T - MarketPrice provenance sidecar post-write smoke\n`);

    if (!process.env.DATABASE_URL) {
        console.error("DATABASE_URL is not set.");
        process.exit(1);
    }
    
    // Create connection
    let cleanDbUrl = process.env.DATABASE_URL;
    if (cleanDbUrl.includes('?')) {
        cleanDbUrl = cleanDbUrl.split('?')[0];
    }
    const client = new Client({
        connectionString: cleanDbUrl,
        ssl: { rejectUnauthorized: false }
    });
    
    let tableExists = false;
    let rowCount = 0;
    let productionApprovedTrueCount = 0;
    let needsReviewTrueCount = 0;
    let adjustmentStatusCounts: Record<string, number> = {};
    let dataModeCounts: Record<string, number> = {};
    let providerTypeCounts: Record<string, number> = {};
    let stalenessStatusCounts: Record<string, number> = {};
    let distinctTickers: string[] = [];
    let marketPriceRowCount = 0;
    let marketPriceUnitMetadataRowCount = 0;

    try {
        await client.connect();
        
        // Check if table exists
        const tableCheck = await client.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'MarketPriceProvenanceMetadata'
            );
        `);
        tableExists = tableCheck.rows[0].exists;
        
        if (tableExists) {
            const res = await client.query(`SELECT * FROM "MarketPriceProvenanceMetadata"`);
            rowCount = res.rows.length;
            
            for (const row of res.rows) {
                if (row.productionApproved) productionApprovedTrueCount++;
                if (row.needsReview) needsReviewTrueCount++;
                
                adjustmentStatusCounts[row.adjustmentStatus] = (adjustmentStatusCounts[row.adjustmentStatus] || 0) + 1;
                dataModeCounts[row.dataMode] = (dataModeCounts[row.dataMode] || 0) + 1;
                providerTypeCounts[row.providerType] = (providerTypeCounts[row.providerType] || 0) + 1;
                stalenessStatusCounts[row.stalenessStatus] = (stalenessStatusCounts[row.stalenessStatus] || 0) + 1;
                
                if (!distinctTickers.includes(row.ticker)) {
                    distinctTickers.push(row.ticker);
                }
            }
        }
        
        const marketPriceCountRes = await client.query(`SELECT count(*) FROM "MarketPrice"`);
        marketPriceRowCount = parseInt(marketPriceCountRes.rows[0].count, 10);
        
        const marketPriceUnitMetadataCountRes = await client.query(`SELECT count(*) FROM "MarketPriceUnitMetadata"`);
        marketPriceUnitMetadataRowCount = parseInt(marketPriceUnitMetadataCountRes.rows[0].count, 10);
        
    } catch (e: any) {
        console.error(`Error checking sidecar:`, e.message);
    }

    const readOnlySmokePassed = 
        tableExists && 
        rowCount === 90 && 
        productionApprovedTrueCount === 0 && 
        needsReviewTrueCount === 90 &&
        distinctTickers.length === 5;

    console.log(`--- Smoke Summary ---`);
    console.log(`phase: 145T`);
    console.log(`mode: market_price_provenance_sidecar_post_write_smoke`);
    console.log(`tableExists: ${tableExists}`);
    console.log(`rowCount: ${rowCount}`);
    console.log(`productionApprovedTrueCount: ${productionApprovedTrueCount}`);
    console.log(`needsReviewTrueCount: ${needsReviewTrueCount}`);
    console.log(`adjustmentStatusCounts: ${JSON.stringify(adjustmentStatusCounts)}`);
    console.log(`dataModeCounts: ${JSON.stringify(dataModeCounts)}`);
    console.log(`providerTypeCounts: ${JSON.stringify(providerTypeCounts)}`);
    console.log(`stalenessStatusCounts: ${JSON.stringify(stalenessStatusCounts)}`);
    console.log(`distinctTickers: ${distinctTickers.join(", ")}`);
    console.log(`marketPriceRowCount: ${marketPriceRowCount}`);
    console.log(`marketPriceUnitMetadataRowCount: ${marketPriceUnitMetadataRowCount}`);
    console.log(`readOnlySmokePassed: ${readOnlySmokePassed}`);
    
    await client.end();
}

runSmoke().catch(async (e) => {
    console.error(e);
    process.exit(1);
});
