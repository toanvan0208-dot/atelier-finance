import { prisma } from "../../../lib/database/client";
import type { PVTRelativeMarketSectorData } from "../types";

const SECTOR_MAPPING: Record<string, string> = {
  "HPG": "VNMAT",
  "VNM": "VNCONS",
  "MWG": "VNCONS"
};

export const buildRelativeMarketSectorMetrics = async (
  ticker: string
): Promise<PVTRelativeMarketSectorData | undefined> => {
  const stockRows = await prisma.marketPrice.findMany({
    where: { ticker },
    orderBy: { tradingDate: "desc" },
    select: { tradingDate: true, closePrice: true }
  });

  if (stockRows.length === 0) return undefined;
  
  const sectorSymbol = SECTOR_MAPPING[ticker];
  if (!sectorSymbol) return undefined;

  const vnindexRows = await prisma.marketIndexObservation.findMany({
    where: { symbol: "VNINDEX" },
    orderBy: { tradingDate: "desc" }
  });

  const vn30Rows = await prisma.marketIndexObservation.findMany({
    where: { symbol: "VN30" },
    orderBy: { tradingDate: "desc" }
  });

  const sectorRows = await prisma.marketIndexObservation.findMany({
    where: { symbol: sectorSymbol },
    orderBy: { tradingDate: "desc" }
  });

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
      }
    }
    return alignedRef;
  };

  const alignedVNINDEX = align(stockRows, vnindexRows);
  const alignedVN30 = align(stockRows, vn30Rows);
  const alignedSector = align(stockRows, sectorRows);

  const calcReturn = (latest: number, past: number) => {
    if (!past || past === 0) return null;
    return (latest / past - 1) * 100;
  };

  const latestStock = stockRows[0];
  const pastStock5 = stockRows.length > 5 ? stockRows[5] : null;
  const pastStock20 = stockRows.length > 20 ? stockRows[20] : null;
  const pastStock60 = stockRows.length > 60 ? stockRows[60] : null;

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

  const limitations: string[] = [];
  const warnings: string[] = [];

  if (alignedVNINDEX.includes(null)) {
    warnings.push("Missing date alignments between stock and index. Some metrics may be null.");
  }

  const isComputable = stockReturn60d !== null && vnindexReturn60d !== null && sectorProxyReturn60d !== null;

  return {
    isComputable,
    sectorProxySymbol: sectorSymbol,
    stockReturn5d,
    stockReturn20d,
    stockReturn60d,
    vnindexReturn5d,
    vnindexReturn20d,
    vnindexReturn60d,
    vn30Return5d,
    vn30Return20d,
    vn30Return60d,
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
    relativeToSectorProxy60d: diff(stockReturn60d, sectorProxyReturn60d),
    limitations,
    warnings
  };
};
