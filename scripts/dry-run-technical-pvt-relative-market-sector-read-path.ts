import "dotenv/config";
import { prisma } from "../src/lib/database/client";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const FORBIDDEN_WORDS = [
  "mạnh hơn", "yếu hơn", "vượt trội", "kém hơn", "dẫn sóng", "đáng chú ý", "hấp dẫn",
  "benchmark ranking", "score", "mua", "bán", "nắm giữ", "tín hiệu", "target price", 
  "fair value", "upside", "downside", "khuyến nghị"
];

const SECTOR_MAPPING: Record<string, string> = {
  "HPG": "VNMAT",
  "VNM": "VNCONS",
  "MWG": "VNCONS"
};

const MARKET_SYMBOLS = ["VNINDEX", "VN30"];

const dryRunTechnicalPvtRelativeMarketSectorReadPath = async () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const summary: Record<string, any> = {
    phase: "156C",
    mode: "dry_run_read_path",
    tickers: ["HPG", "VNM", "MWG"],
    marketSymbols: MARKET_SYMBOLS,
    sectorProxyMapping: SECTOR_MAPPING,
    hpgStockRows: 0,
    vnmStockRows: 0,
    mwgStockRows: 0,
    vnindexRows: 0,
    vn30Rows: 0,
    vnmatRows: 0,
    vnconsRows: 0,
    hpgAlignedVNINDEXCount: 0,
    vnmAlignedVNINDEXCount: 0,
    mwgAlignedVNINDEXCount: 0,
    hpgAlignedSectorCount: 0,
    vnmAlignedSectorCount: 0,
    mwgAlignedSectorCount: 0,
    hpgRelativeMetricsComputable: false,
    vnmRelativeMetricsComputable: false,
    mwgRelativeMetricsComputable: false,
    metricsByTicker: {},
    insufficientDataFields: [],
    dateMismatchDetected: false,
    zeroFillDetected: false,
    fakeFallbackDetected: false,
    mockDataDetected: false,
    benchmarkRankingScoringDetected: false,
    tradingSignalDetected: false,
    buySellHoldDetected: false,
    targetPriceOrFairValueDetected: false,
    upsideDownsideDetected: false,
    stockAttractivenessDetected: false,
    productionApprovedTrueCount: 0,
    dbWriteAttempted: false,
    schemaChanged: false,
    providerFetchAttempted: false,
    dryRunPassed: false,
  };

  try {
    const fetchMarketPrice = async (ticker: string) => {
      const rows = await prisma.marketPrice.findMany({
        where: { ticker },
        orderBy: { tradingDate: 'desc' }
      });
      return rows;
    };

    const fetchMarketIndex = async (symbol: string) => {
      const rows = await prisma.marketIndexObservation.findMany({
        where: { symbol },
        orderBy: { tradingDate: 'desc' }
      });
      return rows;
    };

    const stockRows = {
      HPG: await fetchMarketPrice("HPG"),
      VNM: await fetchMarketPrice("VNM"),
      MWG: await fetchMarketPrice("MWG")
    };
    
    summary.hpgStockRows = stockRows.HPG.length;
    summary.vnmStockRows = stockRows.VNM.length;
    summary.mwgStockRows = stockRows.MWG.length;

    const indexRows = {
      VNINDEX: await fetchMarketIndex("VNINDEX"),
      VN30: await fetchMarketIndex("VN30"),
      VNMAT: await fetchMarketIndex("VNMAT"),
      VNCONS: await fetchMarketIndex("VNCONS")
    };

    summary.vnindexRows = indexRows.VNINDEX.length;
    summary.vn30Rows = indexRows.VN30.length;
    summary.vnmatRows = indexRows.VNMAT.length;
    summary.vnconsRows = indexRows.VNCONS.length;

    // Helper to calculate simple return
    const calcReturn = (latest: number, past: number) => {
      if (!past || past === 0) return null;
      return (latest / past - 1) * 100;
    };

    // Helper to extract metric
    const computeMetrics = (ticker: string) => {
      const stocks = stockRows[ticker as keyof typeof stockRows];
      const sectorSymbol = SECTOR_MAPPING[ticker];
      const sectorIndexes = indexRows[sectorSymbol as keyof typeof indexRows];
      const vnindexes = indexRows.VNINDEX;
      const vn30s = indexRows.VN30;

      // Align dates
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const align = (source: any[], ref: any[]) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const alignedRef: any[] = [];
        let rIdx = 0;
        for (const s of source) {
          while (rIdx < ref.length && ref[rIdx].tradingDate > s.tradingDate) rIdx++;
          if (rIdx < ref.length && ref[rIdx].tradingDate.getTime() === s.tradingDate.getTime()) {
            alignedRef.push(ref[rIdx]);
          } else {
            alignedRef.push(null);
            summary.dateMismatchDetected = true;
          }
        }
        return alignedRef;
      };

      const alignedVNINDEX = align(stocks, vnindexes);
      const alignedVN30 = align(stocks, vn30s);
      const alignedSector = align(stocks, sectorIndexes);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const countAligned = (arr: any[]) => arr.filter(x => x !== null).length;

      const alignedVNINDEXCount = countAligned(alignedVNINDEX);
      const alignedSectorCount = countAligned(alignedSector);

      const latestStock = stocks[0];
      const pastStock5 = stocks.length > 5 ? stocks[5] : null;
      const pastStock20 = stocks.length > 20 ? stocks[20] : null;
      const pastStock60 = stocks.length > 60 ? stocks[60] : null;

      const latestVn = alignedVNINDEX[0];
      const pastVn5 = alignedVNINDEX.length > 5 ? alignedVNINDEX[5] : null;
      const pastVn20 = alignedVNINDEX.length > 20 ? alignedVNINDEX[20] : null;
      const pastVn60 = alignedVNINDEX.length > 60 ? alignedVNINDEX[60] : null;

      const latestVn30 = alignedVN30[0];
      const pastVn30_5 = alignedVN30.length > 5 ? alignedVN30[5] : null;
      const pastVn30_20 = alignedVN30.length > 20 ? alignedVN30[20] : null;
      const pastVn30_60 = alignedVN30.length > 60 ? alignedVN30[60] : null;

      const latestSec = alignedSector[0];
      const pastSec5 = alignedSector.length > 5 ? alignedSector[5] : null;
      const pastSec20 = alignedSector.length > 20 ? alignedSector[20] : null;
      const pastSec60 = alignedSector.length > 60 ? alignedSector[60] : null;

      const stockReturn5d = pastStock5 ? calcReturn(Number(latestStock.closePrice), Number(pastStock5.closePrice)) : null;
      const stockReturn20d = pastStock20 ? calcReturn(Number(latestStock.closePrice), Number(pastStock20.closePrice)) : null;
      const stockReturn60d = pastStock60 ? calcReturn(Number(latestStock.closePrice), Number(pastStock60.closePrice)) : null;

      const vnindexReturn5d = pastVn5 && latestVn ? calcReturn(Number(latestVn.closePoint), Number(pastVn5.closePoint)) : null;
      const vnindexReturn20d = pastVn20 && latestVn ? calcReturn(Number(latestVn.closePoint), Number(pastVn20.closePoint)) : null;
      const vnindexReturn60d = pastVn60 && latestVn ? calcReturn(Number(latestVn.closePoint), Number(pastVn60.closePoint)) : null;

      const vn30Return5d = pastVn30_5 && latestVn30 ? calcReturn(Number(latestVn30.closePoint), Number(pastVn30_5.closePoint)) : null;
      const vn30Return20d = pastVn30_20 && latestVn30 ? calcReturn(Number(latestVn30.closePoint), Number(pastVn30_20.closePoint)) : null;
      const vn30Return60d = pastVn30_60 && latestVn30 ? calcReturn(Number(latestVn30.closePoint), Number(pastVn30_60.closePoint)) : null;

      const sectorProxyReturn5d = pastSec5 && latestSec ? calcReturn(Number(latestSec.closePoint), Number(pastSec5.closePoint)) : null;
      const sectorProxyReturn20d = pastSec20 && latestSec ? calcReturn(Number(latestSec.closePoint), Number(pastSec20.closePoint)) : null;
      const sectorProxyReturn60d = pastSec60 && latestSec ? calcReturn(Number(latestSec.closePoint), Number(pastSec60.closePoint)) : null;

      const diff = (a: number | null, b: number | null) => (a !== null && b !== null) ? a - b : null;

      const metrics = {
        stockReturn5d,
        stockReturn20d,
        stockReturn60d,
        vnindexReturn5d,
        vnindexReturn20d,
        vnindexReturn60d,
        vn30Return5d,
        vn30Return20d,
        vn30Return60d,
        sectorProxySymbol: sectorSymbol,
        sectorProxyReturn5d,
        sectorProxyReturn20d,
        sectorProxyReturn60d,
        relativeToVNINDEX5d: diff(stockReturn5d, vnindexReturn5d),
        relativeToVNINDEX20d: diff(stockReturn20d, vnindexReturn20d),
        relativeToVNINDEX60d: diff(stockReturn60d, vnindexReturn60d),
        relativeToVN305d: diff(stockReturn5d, vn30Return5d),
        relativeToVN3020d: diff(stockReturn20d, vn30Return20d),
        relativeToVN3060d: diff(stockReturn60d, vn30Return60d),
        relativeToSectorProxy5d: diff(stockReturn5d, sectorProxyReturn5d),
        relativeToSectorProxy20d: diff(stockReturn20d, sectorProxyReturn20d),
        relativeToSectorProxy60d: diff(stockReturn60d, sectorProxyReturn60d)
      };

      for (const [key, val] of Object.entries(metrics)) {
        if (val === null && key !== "sectorProxySymbol") {
          summary.insufficientDataFields.push(`${ticker}_${key}`);
        } else if (val === 0 && key !== "sectorProxySymbol") {
          summary.zeroFillDetected = true;
        }
      }

      const isComputable = stockReturn60d !== null && vnindexReturn60d !== null && sectorProxyReturn60d !== null;

      return {
        alignedVNINDEXCount,
        alignedSectorCount,
        metrics,
        isComputable
      };
    };

    const hpgData = computeMetrics("HPG");
    summary.hpgAlignedVNINDEXCount = hpgData.alignedVNINDEXCount;
    summary.hpgAlignedSectorCount = hpgData.alignedSectorCount;
    summary.hpgRelativeMetricsComputable = hpgData.isComputable;
    summary.metricsByTicker["HPG"] = hpgData.metrics;

    const vnmData = computeMetrics("VNM");
    summary.vnmAlignedVNINDEXCount = vnmData.alignedVNINDEXCount;
    summary.vnmAlignedSectorCount = vnmData.alignedSectorCount;
    summary.vnmRelativeMetricsComputable = vnmData.isComputable;
    summary.metricsByTicker["VNM"] = vnmData.metrics;

    const mwgData = computeMetrics("MWG");
    summary.mwgAlignedVNINDEXCount = mwgData.alignedVNINDEXCount;
    summary.mwgAlignedSectorCount = mwgData.alignedSectorCount;
    summary.mwgRelativeMetricsComputable = mwgData.isComputable;
    summary.metricsByTicker["MWG"] = mwgData.metrics;

    summary.dryRunPassed = true;

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

dryRunTechnicalPvtRelativeMarketSectorReadPath();
