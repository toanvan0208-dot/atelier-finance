import "dotenv/config";
import fs from "fs";

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

const dryRunMarketIndexSectorIndexCsv = async () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const summary: Record<string, any> = {
    phase: "156A",
    mode: "dry_run",
    csvFiles: CSV_PATHS,
    totalRows: 0,
    rowsBySymbol: {},
    dateRangeBySymbol: {},
    duplicateSymbolDateCount: 0,
    unsupportedSymbolCount: 0,
    stockTickerRowsDetected: 0,
    tvnRowsDetected: 0,
    hsgNkgRowsDetected: 0,
    unitValidationPassed: true,
    validRows: 0,
    blockedRows: 0,
    blockReasons: [],
    sourceLabels: new Set<string>(),
    dataModeCounts: {} as Record<string, number>,
    needsReviewCounts: {} as Record<string, number>,
    productionApprovedTrueCount: 0,
    zeroFillDetected: false,
    schemaRecommendation: "Create new model MarketIndexObservation to separate broad market/sector indices from individual company stock prices (MarketPrice) to prevent mixing units (index points vs vnd) and domain contexts.",
    marketIndexObservationModelRecommended: true,
    dbWriteAttempted: false,
    schemaChanged: false,
    providerFetchAttempted: false,
    tradingSignalDetected: false,
    buySellHoldDetected: false,
    targetPriceOrFairValueDetected: false,
    benchmarkRankingScoringDetected: false,
    dryRunPassed: false,
  };

  try {
    const symbolDates = new Set<string>();
    const datesBySymbol: Record<string, string[]> = {};

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
      const fetchStatusIdx = headers.indexOf("fetchStatus");

      for (let i = 1; i < lines.length; i++) {
        summary.totalRows++;
        const row = lines[i].split(",").map(c => c.trim());
        
        const symbol = symbolIdx !== -1 ? row[symbolIdx] : "";
        const time = timeIdx !== -1 ? row[timeIdx] : "";
        const closePoint = parseFloat(closePointIdx !== -1 ? row[closePointIdx] : "0");
        const openPoint = parseFloat(openPointIdx !== -1 && row[openPointIdx] ? row[openPointIdx] : "0");
        const highPoint = parseFloat(highPointIdx !== -1 && row[highPointIdx] ? row[highPointIdx] : "0");
        const lowPoint = parseFloat(lowPointIdx !== -1 && row[lowPointIdx] ? row[lowPointIdx] : "0");
        const volume = parseFloat(volumeIdx !== -1 ? row[volumeIdx] : "0");
        const pointUnit = pointUnitIdx !== -1 ? row[pointUnitIdx] : "index_points"; // default if missing
        const volumeUnit = volumeUnitIdx !== -1 ? row[volumeUnitIdx] : "shares"; // default if missing
        const dataMode = dataModeIdx !== -1 ? row[dataModeIdx] : "research_only";
        const needsReview = needsReviewIdx !== -1 ? row[needsReviewIdx] : "true";
        const productionApproved = productionApprovedIdx !== -1 ? row[productionApprovedIdx] : "false";
        const sourceLabel = sourceLabelIdx !== -1 ? row[sourceLabelIdx] : "unknown";
        const fetchStatus = fetchStatusIdx !== -1 ? row[fetchStatusIdx] : "ok";

        summary.sourceLabels.add(sourceLabel);
        summary.dataModeCounts[dataMode] = (summary.dataModeCounts[dataMode] || 0) + 1;
        summary.needsReviewCounts[needsReview] = (summary.needsReviewCounts[needsReview] || 0) + 1;

        if (productionApproved === "true") {
          summary.productionApprovedTrueCount++;
        }

        // Validate symbol
        if (symbol === "TVN") {
          summary.tvnRowsDetected++;
          summary.blockedRows++;
          if (!summary.blockReasons.includes("TVN detected")) summary.blockReasons.push("TVN detected");
          continue;
        } else if (symbol === "HSG" || symbol === "NKG") {
          summary.hsgNkgRowsDetected++;
          summary.blockedRows++;
          if (!summary.blockReasons.includes("HSG/NKG detected")) summary.blockReasons.push("HSG/NKG detected");
          continue;
        } else if (symbol === "HPG" || symbol === "VNM" || symbol === "MWG") {
          summary.stockTickerRowsDetected++;
          summary.blockedRows++;
          if (!summary.blockReasons.includes("Stock tickers in index file")) summary.blockReasons.push("Stock tickers in index file");
          continue;
        } else if (!TARGET_SYMBOLS.includes(symbol)) {
          summary.unsupportedSymbolCount++;
          summary.blockedRows++;
          continue;
        }

        // Duplicates
        const symbolDate = `${symbol}_${time}`;
        if (symbolDates.has(symbolDate)) {
          summary.duplicateSymbolDateCount++;
          summary.blockedRows++;
          if (!summary.blockReasons.includes("Duplicate symbol+date")) summary.blockReasons.push("Duplicate symbol+date");
          continue;
        }
        symbolDates.add(symbolDate);

        // Track stats
        summary.rowsBySymbol[symbol] = (summary.rowsBySymbol[symbol] || 0) + 1;
        if (!datesBySymbol[symbol]) {
          datesBySymbol[symbol] = [];
        }
        datesBySymbol[symbol].push(time);

        // Validation
        let isValid = true;

        if (closePoint <= 0) {
          isValid = false;
          if (closePoint === 0) summary.zeroFillDetected = true;
          if (!summary.blockReasons.includes("closePoint <= 0")) summary.blockReasons.push("closePoint <= 0");
        }
        if (openPoint < 0 || highPoint < 0 || lowPoint < 0) {
          isValid = false;
          if (!summary.blockReasons.includes("negative prices")) summary.blockReasons.push("negative prices");
        }
        if (volume < 0) {
          isValid = false;
          if (!summary.blockReasons.includes("negative volume")) summary.blockReasons.push("negative volume");
        }
        if (pointUnit !== "index_points" && pointUnit !== "") { // if the CSV doesn't have it, we assume
          isValid = false;
          summary.unitValidationPassed = false;
          if (!summary.blockReasons.includes("Invalid pointUnit")) summary.blockReasons.push("Invalid pointUnit");
        }
        if (volumeUnit !== "shares" && volumeUnit !== "") {
          isValid = false;
          summary.unitValidationPassed = false;
          if (!summary.blockReasons.includes("Invalid volumeUnit")) summary.blockReasons.push("Invalid volumeUnit");
        }
        if (dataMode !== "research_only" && dataMode !== "") {
          isValid = false;
          if (!summary.blockReasons.includes("Invalid dataMode")) summary.blockReasons.push("Invalid dataMode");
        }
        if (needsReview.toLowerCase() !== "true" && needsReview !== "") {
          isValid = false;
          if (!summary.blockReasons.includes("needsReview must be true")) summary.blockReasons.push("needsReview must be true");
        }
        if (fetchStatus !== "ok" && fetchStatus !== "") {
          isValid = false;
          if (!summary.blockReasons.includes("fetchStatus not ok")) summary.blockReasons.push("fetchStatus not ok");
        }

        if (isValid) {
          summary.validRows++;
        } else {
          summary.blockedRows++;
        }
      }
      
      // Check forbidden words in raw file
      const lowerContent = fileContent.toLowerCase();
      for (const word of FORBIDDEN_WORDS) {
        if (lowerContent.includes(word)) {
          if (["buy", "sell", "hold", "mua", "bán", "nắm giữ", "tín hiệu"].includes(word)) summary.buySellHoldDetected = true;
          if (["target price", "fair value", "upside", "downside"].includes(word)) summary.targetPriceOrFairValueDetected = true;
          if (["ranking", "scoring", "benchmark as ranking"].includes(word)) summary.benchmarkRankingScoringDetected = true;
        }
      }
    }

    // Process dates
    for (const symbol of TARGET_SYMBOLS) {
      if (datesBySymbol[symbol] && datesBySymbol[symbol].length > 0) {
        const sortedDates = datesBySymbol[symbol].sort();
        summary.dateRangeBySymbol[symbol] = `${sortedDates[0]} to ${sortedDates[sortedDates.length - 1]}`;
      }
    }

    // Convert Set to Array for JSON
    summary.sourceLabels = Array.from(summary.sourceLabels);

    if (
      summary.totalRows > 0 &&
      summary.blockedRows === 0 &&
      summary.duplicateSymbolDateCount === 0 &&
      summary.unsupportedSymbolCount === 0 &&
      summary.unitValidationPassed &&
      summary.productionApprovedTrueCount === 0 &&
      !summary.buySellHoldDetected &&
      !summary.targetPriceOrFairValueDetected &&
      !summary.benchmarkRankingScoringDetected &&
      !summary.zeroFillDetected
    ) {
      summary.dryRunPassed = true;
    }

    console.log(JSON.stringify(summary, null, 2));
    
    if (!summary.dryRunPassed) {
      process.exit(1);
    }
  } catch (error) {
    console.error(error);
    summary.dryRunPassed = false;
    process.exit(1);
  }
};

dryRunMarketIndexSectorIndexCsv();
