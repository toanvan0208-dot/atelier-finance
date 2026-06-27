import { getMarketPriceProvenanceSeries } from "./market-price-provenance-read-path";

export type ProvenanceRuntimeData = {
  ticker: string;
  provenanceStatus: string;
  sourceLabel: string;
  dataModeLabel: string;
  productionApproved: boolean;
  needsReview: boolean;
  providerTypeLabel: string;
  adjustmentStatusLabel: string;
  stalenessStatusLabel: string;
  warningLabels: string[];
  latestMarketDate: string | null;
  rowCount: number;
};

const mapWarningCode = (code: string): string => {
  switch (code) {
    case "MISSING_CURRENCY":
      return "Thiếu đơn vị tiền tệ";
    case "MISSING_EXCHANGE":
      return "Thiếu thông tin sàn giao dịch";
    case "MISSING_PRICE_UNIT":
      return "Thiếu đơn vị giá";
    case "MISSING_VOLUME_UNIT":
      return "Thiếu đơn vị khối lượng";
    case "MISSING_ADJUSTMENT_EVIDENCE":
      return "Thiếu bằng chứng điều chỉnh giá";
    default:
      return code;
  }
};

const mapDataMode = (mode: string): string => {
  switch (mode) {
    case "candidate_provider_data":
      return "Dữ liệu ứng viên từ provider";
    default:
      return mode;
  }
};

const mapProviderType = (type: string): string => {
  switch (type) {
    case "undocumented_provider":
      return "Provider chưa có hồ sơ kiểm chứng đầy đủ";
    default:
      return type;
  }
};

const mapAdjustmentStatus = (status: string): string => {
  switch (status) {
    case "needs_review":
      return "Cần rà soát";
    default:
      return status;
  }
};

const mapStalenessStatus = (status: string): string => {
  switch (status) {
    case "stale":
      return "Dữ liệu có thể đã cũ";
    default:
      return status;
  }
};

export const loadTechnicalProvenanceRuntime = async (
  ticker: string,
): Promise<ProvenanceRuntimeData | null> => {
  const result = await getMarketPriceProvenanceSeries({ ticker });
  if (!result.ok || result.count === 0) {
    return null;
  }

  const latestRow = result.rows[result.rows.length - 1];
  const allWarningsSet = new Set<string>();
  result.rows.forEach(r => r.warningCodes.forEach(w => allWarningsSet.add(mapWarningCode(w))));

  const needsReviewCount = result.rows.filter((r) => r.needsReview).length;
  const productionApprovedCount = result.rows.filter((r) => r.productionApproved).length;

  return {
    ticker,
    provenanceStatus: latestRow.needsReview ? "Cần rà soát" : "Đã rà soát",
    sourceLabel: latestRow.sourceLabel,
    dataModeLabel: mapDataMode(latestRow.dataMode),
    productionApproved: productionApprovedCount > 0,
    needsReview: needsReviewCount > 0,
    providerTypeLabel: mapProviderType(latestRow.providerType),
    adjustmentStatusLabel: mapAdjustmentStatus(latestRow.adjustmentStatus),
    stalenessStatusLabel: mapStalenessStatus(latestRow.stalenessStatus),
    warningLabels: Array.from(allWarningsSet),
    latestMarketDate: latestRow.marketDate,
    rowCount: result.count,
  };
};
