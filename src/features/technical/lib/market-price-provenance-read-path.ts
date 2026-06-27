import { prisma } from "../../../lib/database/client";
import { Prisma } from "../../../generated/prisma/client";

export type ProvenanceMetadataRecord = {
  ticker: string;
  marketDate: string;
  sourceLabel: string;
  dataMode: string;
  productionApproved: boolean;
  needsReview: boolean;
  providerName: string;
  providerType: string;
  adjustmentStatus: string;
  stalenessStatus: string;
  warningCodes: string[];
  payloadChecksum: string | null;
  importRunId: string | null;
};

export type ProvenanceMetadataResult = {
  ok: boolean;
  count: number;
  rows: ProvenanceMetadataRecord[];
  warnings: string[];
  errors: string[];
};

export const getMarketPriceProvenanceSeries = async (params: {
  ticker: string;
  from?: string;
  to?: string;
  sourceLabel?: string;
}): Promise<ProvenanceMetadataResult> => {
  const warnings: string[] = [];
  const errors: string[] = [];
  
  if (!params.ticker) {
    errors.push("ticker is required");
    return { ok: false, count: 0, rows: [], warnings, errors };
  }

  try {
    const whereClause: Prisma.MarketPriceProvenanceMetadataWhereInput = {
      ticker: params.ticker,
    };

    if (params.from || params.to) {
      whereClause.marketDate = {};
      if (params.from) whereClause.marketDate.gte = new Date(params.from);
      if (params.to) whereClause.marketDate.lte = new Date(params.to);
    }

    if (params.sourceLabel) {
      whereClause.sourceLabel = params.sourceLabel;
    }

    const rows = await prisma.marketPriceProvenanceMetadata.findMany({
      where: whereClause,
      orderBy: { marketDate: "asc" },
    });

    const mappedRows: ProvenanceMetadataRecord[] = rows.map((r) => {
      let warningCodes: string[] = [];
      if (Array.isArray(r.warningCodes)) {
        warningCodes = r.warningCodes.map(String);
      } else if (typeof r.warningCodes === "string") {
        try {
          warningCodes = JSON.parse(r.warningCodes);
        } catch {
          warnings.push(`Could not parse warningCodes for ${r.ticker} on ${r.marketDate.toISOString()}`);
        }
      }

      return {
        ticker: r.ticker,
        marketDate: r.marketDate.toISOString(),
        sourceLabel: r.sourceLabel,
        dataMode: r.dataMode,
        productionApproved: r.productionApproved,
        needsReview: r.needsReview,
        providerName: r.providerName,
        providerType: r.providerType,
        adjustmentStatus: r.adjustmentStatus,
        stalenessStatus: r.stalenessStatus,
        warningCodes,
        payloadChecksum: r.payloadChecksum,
        importRunId: r.importRunId,
      };
    });

    if (mappedRows.length === 0) {
      warnings.push("No provenance metadata found for the given parameters.");
    } else {
      const needsReviewCount = mappedRows.filter((r) => r.needsReview).length;
      if (needsReviewCount > 0) {
        warnings.push(`${needsReviewCount} provenance record(s) need review.`);
      }
    }

    return {
      ok: true,
      count: mappedRows.length,
      rows: mappedRows,
      warnings,
      errors,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    errors.push(`Database error: ${errorMsg}`);
    return { ok: false, count: 0, rows: [], warnings, errors };
  }
};
