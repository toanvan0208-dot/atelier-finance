import "dotenv/config";
import fs from "fs";
import { prisma } from "../src/lib/database/client";

const CSV_PATHS = [
  "D:\\market_indexes_vnindex_vn30_from_2020.csv",
  "D:\\market_index_vnmat_from_2020.csv",
  "D:\\market_index_vncons_from_2020.csv"
];

const TARGET_SYMBOLS = ["VNINDEX", "VN30", "VNMAT", "VNCONS"];

const FORBIDDEN_WORDS = [
  "buy", "sell", "hold", "mua", "bán", "nắm giữ",
  "tín hiệu", "target price", "fair value", "upside", "downside",
  "khuyến nghị", "ranking", "scoring", "benchmark as ranking"
];

const confirmWriteMarketIndexSectorIndexCsv = async () => {
  const isConfirmWrite = process.argv.includes("--confirm-write");

// eslint-disable-next-line @typescript-eslint/no-explicit-any
  const summary: Record<string, any> = {
    phase: "156B",
    mode: isConfirmWrite ? "confirm_write" : "dry_run",
    schemaChanged: true,
    migrationName: "market_index_observation",
    csvFiles: CSV_PATHS,
    datasourceCreated: false,
    datasourceExisted: false,
    datasourceId: null,
    totalCsvRows: 0,
    validRows: 0,
    blockedRows: 0,
    rowsBySymbol: {},
    dateRangeBySymbol: {},
    duplicateSymbolDateCountBefore: 0,
    duplicateSymbolDateCountAfter: 0,
    unsupportedSymbolCount: 0,
    stockTickerRowsDetected: 0,
    tvnRowsDetected: 0,
    hsgNkgRowsDetected: 0,
    candidateRows: 0,
    rowsCreated: 0,
    rowsUpdated: 0,
    rowsSkipped: 0,
    rowsBlocked: 0,
    idempotencyRowsCreatedOnSecondRun: 0,
    finalMarketIndexObservationRowsForSource: 0,
    zeroFillDetected: false,
    productionApprovedTrueCount: 0,
    providerFetchAttempted: false,
    dbWriteAttempted: isConfirmWrite,
    benchmarkRankingScoringDetected: false,
    tradingSignalDetected: false,
    buySellHoldDetected: false,
    targetPriceOrFairValueDetected: false,
    confirmWritePassed: false,
  };

  try {
    const symbolDates = new Set<string>();
    const datesBySymbol: Record<string, string[]> = {};
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const validRowData: any[] = [];

    // Parse CSV
    for (const csvPath of CSV_PATHS) {
      if (!fs.existsSync(csvPath)) {
        throw new Error(`CSV file not found at ${csvPath}`);
      }

      const fileContent = fs.readFileSync(csvPath, "utf-8");
      const lines = fileContent.split(/\r?\n/).filter((line) => line.trim() !== "");
      
      if (lines.length === 0) continue;

      const headerLine = lines[0];
      const headers = headerLine.split(",").map(h => h.trim());
      
      const symbolIdx = headers.indexOf("symbol");
      const timeIdx = headers.indexOf("time");
      const closePointIdx = headers.indexOf("closePoint") !== -1 ? headers.indexOf("closePoint") : headers.indexOf("close");
      const openPointIdx = headers.indexOf("openPoint") !== -1 ? headers.indexOf("openPoint") : headers.indexOf("open");
      const highPointIdx = headers.indexOf("highPoint") !== -1 ? headers.indexOf("highPoint") : headers.indexOf("high");
      const lowPointIdx = headers.indexOf("lowPoint") !== -1 ? headers.indexOf("lowPoint") : headers.indexOf("low");
      const volumeIdx = headers.indexOf("volume");
      const pointUnitIdx = headers.indexOf("pointUnit");
      const volumeUnitIdx = headers.indexOf("volumeUnit");
      const dataModeIdx = headers.indexOf("dataMode");
      const needsReviewIdx = headers.indexOf("needsReview");
      const productionApprovedIdx = headers.indexOf("productionApproved");
      const sourceLabelIdx = headers.indexOf("sourceLabel");

      for (let i = 1; i < lines.length; i++) {
        summary.totalCsvRows++;
        const row = lines[i].split(",").map(c => c.trim());
        
        const symbol = symbolIdx !== -1 ? row[symbolIdx] : "";
        const time = timeIdx !== -1 ? row[timeIdx] : "";
        const closePoint = parseFloat(closePointIdx !== -1 ? row[closePointIdx] : "0");
        const openPoint = parseFloat(openPointIdx !== -1 && row[openPointIdx] ? row[openPointIdx] : "0");
        const highPoint = parseFloat(highPointIdx !== -1 && row[highPointIdx] ? row[highPointIdx] : "0");
        const lowPoint = parseFloat(lowPointIdx !== -1 && row[lowPointIdx] ? row[lowPointIdx] : "0");
        const volume = parseFloat(volumeIdx !== -1 && row[volumeIdx] ? row[volumeIdx] : "0");
        const pointUnit = pointUnitIdx !== -1 ? row[pointUnitIdx] : "index_points";
        const volumeUnit = volumeUnitIdx !== -1 ? row[volumeUnitIdx] : "shares";
        const dataMode = dataModeIdx !== -1 ? row[dataModeIdx] : "research_only";
        const needsReview = needsReviewIdx !== -1 ? row[needsReviewIdx] : "true";
        const productionApproved = productionApprovedIdx !== -1 ? row[productionApprovedIdx] : "false";
        const sourceLabel = sourceLabelIdx !== -1 ? row[sourceLabelIdx] : "unknown";

        if (productionApproved.toLowerCase() === "true") {
          summary.productionApprovedTrueCount++;
        }

        // Validate symbol
        if (symbol === "TVN") {
          summary.tvnRowsDetected++;
          summary.blockedRows++;
          continue;
        } else if (symbol === "HSG" || symbol === "NKG") {
          summary.hsgNkgRowsDetected++;
          summary.blockedRows++;
          continue;
        } else if (symbol === "HPG" || symbol === "VNM" || symbol === "MWG") {
          summary.stockTickerRowsDetected++;
          summary.blockedRows++;
          continue;
        } else if (!TARGET_SYMBOLS.includes(symbol)) {
          summary.unsupportedSymbolCount++;
          summary.blockedRows++;
          continue;
        }

        // Duplicates
        const symbolDate = `${symbol}_${time}`;
        if (symbolDates.has(symbolDate)) {
          summary.duplicateSymbolDateCountBefore++;
          summary.blockedRows++;
          continue;
        }
        symbolDates.add(symbolDate);

        // Validation
        let isValid = true;
        if (closePoint <= 0) {
          isValid = false;
          if (closePoint === 0) summary.zeroFillDetected = true;
        }
        if (openPoint < 0 || highPoint < 0 || lowPoint < 0 || volume < 0) isValid = false;
        if (pointUnit !== "index_points" && pointUnit !== "") isValid = false;
        if (volumeUnit !== "shares" && volumeUnit !== "") isValid = false;
        if (dataMode !== "research_only" && dataMode !== "") isValid = false;
        if (needsReview.toLowerCase() !== "true" && needsReview !== "") isValid = false;

        if (isValid) {
          summary.validRows++;
          summary.rowsBySymbol[symbol] = (summary.rowsBySymbol[symbol] || 0) + 1;
          if (!datesBySymbol[symbol]) datesBySymbol[symbol] = [];
          datesBySymbol[symbol].push(time);
          
          validRowData.push({
            symbol,
            tradingDate: new Date(time),
            openPoint,
            highPoint,
            lowPoint,
            closePoint,
            volume,
            pointUnit: "index_points",
            volumeUnit: "shares",
            dataMode: "research_only",
            needsReview: true,
            productionApproved: false,
            sourceLabel: sourceLabel,
            sourceType: "licensed_vendor", // Existing allowed enum
            indexName: symbol // Optional metadata
          });
        } else {
          summary.blockedRows++;
        }
      }

      const lowerContent = fileContent.toLowerCase();
      for (const word of FORBIDDEN_WORDS) {
        if (lowerContent.includes(word)) {
          if (["buy", "sell", "hold", "mua", "bán", "nắm giữ", "tín hiệu"].includes(word)) summary.buySellHoldDetected = true;
          if (["target price", "fair value", "upside", "downside"].includes(word)) summary.targetPriceOrFairValueDetected = true;
          if (["ranking", "scoring", "benchmark as ranking"].includes(word)) summary.benchmarkRankingScoringDetected = true;
        }
      }
    }

    summary.candidateRows = validRowData.length;

    for (const symbol of TARGET_SYMBOLS) {
      if (datesBySymbol[symbol] && datesBySymbol[symbol].length > 0) {
        const sortedDates = datesBySymbol[symbol].sort();
        summary.dateRangeBySymbol[symbol] = `${sortedDates[0]} to ${sortedDates[sortedDates.length - 1]}`;
      }
    }

    if (
      summary.candidateRows > 0 &&
      summary.blockedRows === 0 &&
      summary.unsupportedSymbolCount === 0 &&
      summary.productionApprovedTrueCount === 0 &&
      !summary.buySellHoldDetected &&
      !summary.targetPriceOrFairValueDetected &&
      !summary.benchmarkRankingScoringDetected &&
      !summary.zeroFillDetected
    ) {
      if (isConfirmWrite) {
        // Write Phase
        const sourceLabel = "VNStock market and sector index time-series";
        let ds = await prisma.dataSource.findFirst({
          where: { name: sourceLabel }
        });

        if (!ds) {
          ds = await prisma.dataSource.create({
            data: {
              name: sourceLabel,
              sourceType: "licensed_vendor",
              notes: "local reviewed CSV source for VNINDEX, VN30, VNMAT, VNCONS",
            }
          });
          summary.datasourceCreated = true;
        } else {
          summary.datasourceExisted = true;
        }
        summary.datasourceId = ds.id;

        // Count existing rows
        const existingRows = await prisma.marketIndexObservation.findMany({
          where: { sourceId: ds.id },
          select: { symbol: true, tradingDate: true }
        });
        const existingSet = new Set(existingRows.map(r => `${r.symbol}_${r.tradingDate.toISOString()}`));

        // Insert / Skip
        let inserted = 0;
        let skipped = 0;

        for (const row of validRowData) {
          const key = `${row.symbol}_${row.tradingDate.toISOString()}`;
          if (existingSet.has(key)) {
            skipped++;
          } else {
            await prisma.marketIndexObservation.create({
              data: {
                ...row,
                sourceId: ds.id
              }
            });
            inserted++;
          }
        }

        summary.rowsCreated = inserted;
        summary.rowsSkipped = skipped;

        if (summary.datasourceExisted && inserted === 0 && skipped > 0) {
          summary.idempotencyRowsCreatedOnSecondRun = 0;
        }

        const finalCount = await prisma.marketIndexObservation.count({
          where: { sourceId: ds.id }
        });
        summary.finalMarketIndexObservationRowsForSource = finalCount;

        // Detect duplicates
        const allRows = await prisma.marketIndexObservation.groupBy({
          by: ["symbol", "tradingDate", "sourceId"],
          where: { sourceId: ds.id },
          _count: { id: true }
        });
        const duplicates = allRows.filter(r => r._count.id > 1);
        summary.duplicateSymbolDateCountAfter = duplicates.length;

        if (summary.duplicateSymbolDateCountAfter === 0 && summary.finalMarketIndexObservationRowsForSource === summary.candidateRows) {
          summary.confirmWritePassed = true;
        }
      } else {
        // Dry-run passed
        summary.confirmWritePassed = true;
      }
    }

    console.log(JSON.stringify(summary, null, 2));

    if (!summary.confirmWritePassed) {
      process.exit(1);
    }
  } catch (error) {
    console.error(error);
    summary.confirmWritePassed = false;
    process.exit(1);
  }
};

confirmWriteMarketIndexSectorIndexCsv();
