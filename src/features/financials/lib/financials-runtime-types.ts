import type { FinancialStatementSeriesResult } from "../../../lib/data-sources/financial-statement-read-service";
import type { FinancialsUnitMetadataMap } from "./financials-unit-metadata-contract";
import type { FinancialsStatementSnapshot } from "./map-financials-to-logic-input";

export type FinancialsRuntimeReadPath = "local_db" | "sample_static" | "unavailable";
export type FinancialsRuntimeStatus = "db_backed" | "sample_fallback" | "unavailable" | "read_error";

export type FinancialsRuntimeDataSource = {
  sourceLabel: string;
  dataMode: string;
  productionApproved: false;
  fallbackUsed: boolean;
  readPath: FinancialsRuntimeReadPath;
  ticker: string;
  asOf: string | null;
  fiscalYear: number | null;
  periodType: FinancialsStatementSnapshot["periodType"] | null;
};

export type FinancialsRuntimeDataQuality = {
  status: "available" | "partial" | "insufficient_data" | "unavailable";
  missingFields: string[];
  warnings: string[];
  errors: string[];
};

export type FinancialsRuntimeData = {
  runtimeStatus: FinancialsRuntimeStatus;
  source: FinancialsRuntimeDataSource;
  dataQuality: FinancialsRuntimeDataQuality;
  statementSnapshot: FinancialsStatementSnapshot | null;
  unitMetadata: FinancialsUnitMetadataMap;
  readResult: FinancialStatementSeriesResult | null;
};
