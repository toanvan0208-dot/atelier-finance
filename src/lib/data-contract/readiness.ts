import type {
  DataContractMetricResult,
  DataSourceMetadata,
  FinancialStatementRecord,
  MarketDataRecord,
  ValuationInputRecord,
} from "./types";
import { collectMissingFields } from "./validation";

const metadataMissingFields = (metadata: DataSourceMetadata): string[] => {
  const missing: string[] = [];

  if (!metadata.source) {
    missing.push("metadata.source");
  }

  if (!metadata.asOf) {
    missing.push("metadata.asOf");
  }

  if (!metadata.period) {
    missing.push("metadata.period");
  }

  return missing;
};

export const assessRecordMetadata = (
  metadata: DataSourceMetadata,
): DataContractMetricResult<null> => {
  const missingFields = metadataMissingFields(metadata);
  const warnings = [...metadata.warnings];

  if (!metadata.source) {
    warnings.push({
      code: "SOURCE_MISSING",
      message: "Record-level source is required before using real data.",
      field: "metadata.source",
    });
  }

  if (!metadata.asOf) {
    warnings.push({
      code: "AS_OF_MISSING",
      message: "Record-level asOf is required because data groups refresh at different frequencies.",
      field: "metadata.asOf",
    });
  }

  if (metadata.isStale) {
    warnings.push({
      code: "STALE_DATA",
      message: "Record is marked stale and needs review before product use.",
    });
  }

  if (metadata.isDemoData) {
    warnings.push({
      code: "DEMO_DATA",
      message: "Demo data must not be treated as a real connected data source.",
    });
  }

  return {
    key: "metadataReadiness",
    value: null,
    status: missingFields.length > 0 ? "insufficient_data" : metadata.isStale || metadata.isDemoData ? "needs_review" : "ready",
    interpretation: missingFields.length > 0 ? "insufficient_data" : metadata.isStale || metadata.isDemoData ? "needs_review" : "normal",
    missingFields,
    warnings,
    metadata,
  };
};

export const assessMarketReadiness = (
  record: MarketDataRecord,
): DataContractMetricResult<null> => {
  const dataMissingFields = collectMissingFields(record, [
    "ticker",
    "closePrice",
    "volume",
  ]);
  const metadataResult = assessRecordMetadata(record.metadata);
  const missingFields = [...dataMissingFields, ...metadataResult.missingFields];

  return {
    key: "marketDataReadiness",
    value: null,
    status: missingFields.length > 0 ? "insufficient_data" : metadataResult.status,
    interpretation: missingFields.length > 0 ? "insufficient_data" : metadataResult.interpretation,
    missingFields,
    warnings: metadataResult.warnings,
    metadata: record.metadata,
  };
};

export const assessFinancialStatementReadiness = (
  record: FinancialStatementRecord,
): DataContractMetricResult<null> => {
  const dataMissingFields = collectMissingFields(record, [
    "ticker",
    "companyType",
    "netIncome",
    "totalAssets",
    "equity",
  ]);
  const metadataResult = assessRecordMetadata(record.metadata);
  const missingFields = [...dataMissingFields, ...metadataResult.missingFields];

  return {
    key: "financialStatementReadiness",
    value: null,
    status: missingFields.length > 0 ? "insufficient_data" : metadataResult.status,
    interpretation: missingFields.length > 0 ? "insufficient_data" : metadataResult.interpretation,
    missingFields,
    warnings: metadataResult.warnings,
    metadata: record.metadata,
  };
};

export const assessValuationReadiness = (
  record: ValuationInputRecord,
): DataContractMetricResult<null> => {
  const dataMissingFields = collectMissingFields(record, [
    "ticker",
    "eps",
    "sharesOutstanding",
    "marketCap",
  ]);
  const metadataResult = assessRecordMetadata(record.metadata);
  const missingFields = [...dataMissingFields, ...metadataResult.missingFields];

  return {
    key: "valuationInputReadiness",
    value: null,
    status: missingFields.length > 0 ? "insufficient_data" : metadataResult.status,
    interpretation: missingFields.length > 0 ? "insufficient_data" : metadataResult.interpretation,
    missingFields,
    warnings: metadataResult.warnings,
    metadata: record.metadata,
  };
};

