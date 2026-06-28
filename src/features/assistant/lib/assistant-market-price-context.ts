import { prisma } from "../../../lib/database/client";

const ALLOWED_TICKERS = ["FPT", "HPG", "VNM", "MSN", "MWG"];

export type AssistantMarketPriceContext = {
  available: boolean;
  ticker?: string;
  latestMarketPrice?: {
    marketDate: string;
    closePrice: string;
    sourceLabel: string;
    dataMode: string;
    productionApproved: boolean;
  };
  provenance?: {
    available: boolean;
    providerType?: string;
    dataMode?: string;
    productionApproved?: boolean;
    needsReview?: boolean;
    warningCodes?: string[];
    adjustmentStatus?: string;
    payloadChecksum?: string | null;
  };
  safetyNotes: string[];
};

export const loadAssistantMarketPriceContext = async (
  ticker: string | null | undefined
): Promise<AssistantMarketPriceContext> => {
  if (!ticker || !ALLOWED_TICKERS.includes(ticker)) {
    return {
      available: false,
      safetyNotes: ["Ticker is missing or not supported for market price context."],
    };
  }

  const latestMarketPrice = await prisma.marketPrice.findFirst({
    where: { ticker },
    orderBy: { tradingDate: "desc" },
  });

  if (!latestMarketPrice) {
    return {
      available: false,
      ticker,
      safetyNotes: ["No market price data found for the given ticker."],
    };
  }

  const provenance = await prisma.marketPriceProvenanceMetadata.findFirst({
    where: {
      ticker,
      marketDate: latestMarketPrice.tradingDate,
      sourceLabel: latestMarketPrice.sourceLabel,
    },
  });

  let warningCodes: string[] = [];
  if (provenance?.warningCodes) {
    if (Array.isArray(provenance.warningCodes)) {
      warningCodes = provenance.warningCodes.map(String);
    } else if (typeof provenance.warningCodes === "string") {
      try {
        const parsed = JSON.parse(provenance.warningCodes);
        if (Array.isArray(parsed)) {
          warningCodes = parsed.map(String);
        }
      } catch (e) {
        warningCodes = [String(provenance.warningCodes)];
      }
    }
  }

  return {
    available: true,
    ticker,
    latestMarketPrice: {
      marketDate: latestMarketPrice.tradingDate.toISOString(),
      closePrice: latestMarketPrice.closePrice?.toString() ?? "null",
      sourceLabel: latestMarketPrice.sourceLabel,
      dataMode: latestMarketPrice.dataMode,
      productionApproved: false, // Enforce false for market price row as it doesn't have it explicitly
    },
    provenance: provenance
      ? {
          available: true,
          providerType: provenance.providerType,
          dataMode: provenance.dataMode,
          productionApproved: provenance.productionApproved,
          needsReview: provenance.needsReview,
          warningCodes,
          adjustmentStatus: provenance.adjustmentStatus,
          payloadChecksum: provenance.payloadChecksum,
        }
      : {
          available: false,
        },
    safetyNotes: [
      "AI must state explicitly if the data is not production approved or needs review.",
      "AI must not provide buy/sell/hold/target price advice based on this data.",
    ],
  };
};
