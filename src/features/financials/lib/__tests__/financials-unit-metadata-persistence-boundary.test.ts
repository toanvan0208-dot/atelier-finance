import { describe, expect, it } from "vitest";

import {
  buildControlledValuationIntegrationBoundary,
  type ControlledValuationFinancialsRuntimeSnapshot,
} from "@/features/valuation/lib/controlled-valuation-integration-boundary";
import { loadFinancialsRuntimeData } from "../load-financials-runtime-data";
import { buildFinancialsUnitMetadata } from "../financials-unit-metadata-contract";
import {
  buildFinancialsUnitMetadataPersistencePayload,
  readFinancialsUnitMetadataFromPersistencePayload,
} from "../financials-unit-metadata-persistence-boundary";
import type { AdaptFinancialStatementSeriesResult } from "../adapt-financial-statement-records";
import type { FinancialsStatementSnapshot } from "../map-financials-to-logic-input";
import type { FinancialStatementSeriesResult } from "../../../../lib/data-sources/financial-statement-read-service";

const verifiedRuntime = (
  patch: ControlledValuationFinancialsRuntimeSnapshot,
): ControlledValuationFinancialsRuntimeSnapshot => ({
  asOf: "2025-12-31",
  dataMode: "research_only",
  fallbackUsed: false,
  fiscalYear: 2025,
  period: "2025",
  periodType: "annual",
  productionApproved: false,
  readPath: "local_db",
  runtimeStatus: "db_backed",
  sourceLabel: "phase65_csv_unit_capture",
  ...patch,
});

const snapshot = {
  ticker: "FPT",
  period: "2025",
  periodType: "annual",
  sourceName: "phase65_csv_unit_capture",
  collectedAt: null,
  revenue: 100,
  previousRevenue: null,
  grossProfit: null,
  operatingProfit: null,
  netProfit: 10,
  previousNetProfit: null,
  totalAssets: 200,
  previousTotalAssets: null,
  totalLiabilities: null,
  totalDebt: 50,
  totalEquity: 80,
  previousTotalEquity: null,
  currentAssets: null,
  currentLiabilities: null,
  operatingCashFlow: 15,
  previousOperatingCashFlow: null,
  capitalExpenditure: null,
  sharesOutstanding: 10,
  eps: 1000,
} satisfies FinancialsStatementSnapshot;

const seriesResult = (): FinancialStatementSeriesResult => ({
  dataMode: "research_only",
  errors: [],
  ok: true,
  productionApproved: false,
  records: [],
  sourceLabel: "phase65_csv_unit_capture",
  status: "available",
  ticker: "FPT",
  warnings: [],
});

const adapted = (unitMetadata = buildFinancialsUnitMetadata()): AdaptFinancialStatementSeriesResult => ({
  errors: [],
  missingFields: [],
  ok: true,
  productionApproved: false,
  statements: [
    {
      dataQuality: {
        availableFields: ["revenue", "netIncome", "totalAssets", "equity", "eps", "sharesOutstanding"],
        invalidFields: [],
        missingFields: [],
        status: "available",
        warnings: [],
      },
      metadata: {
        dataMode: "research_only",
        fallbackUsed: false,
        period: "2025",
        periodType: "year",
        productionApproved: false,
        sourceLabel: "phase65_csv_unit_capture",
        ticker: "FPT",
      },
      snapshot,
      unitMetadata,
    },
  ],
  status: "available",
  warnings: [],
});

describe("financials unit metadata persistence boundary", () => {
  it("builds and reads a persistence payload with valid explicit units", () => {
    const metadata = buildFinancialsUnitMetadata({
      explicitUnits: {
        equity: "million_vnd",
        eps: "vnd_per_share",
        netIncome: "million_vnd",
        revenue: "million_vnd",
        sharesOutstanding: "million_shares",
        totalAssets: "million_vnd",
        totalDebt: "million_vnd",
      },
      snapshot,
      sourceLabel: "phase65_csv_unit_capture",
      dataMode: "research_only",
    });
    const payload = buildFinancialsUnitMetadataPersistencePayload(metadata);
    const read = readFinancialsUnitMetadataFromPersistencePayload({
      dataMode: "research_only",
      payload,
      snapshot,
      sourceLabel: "phase65_csv_unit_capture",
    });

    expect(payload.productionApproved).toBe(false);
    expect(read.status).toBe("available");
    expect(read.productionApproved).toBe(false);
    expect(read.unitMetadata.revenue).toMatchObject({ status: "explicit", unit: "million_vnd" });
    expect(read.unitMetadata.eps.unit).toBe("vnd_per_share");
    expect(read.unitMetadata.sharesOutstanding.unit).toBe("million_shares");
  });

  it("keeps old rows without metadata backward-compatible as unknown without guessing", () => {
    const read = readFinancialsUnitMetadataFromPersistencePayload({
      payload: null,
      snapshot: { ...snapshot, revenue: 1_000_000_000_000 },
    });

    expect(read.status).toBe("missing_metadata");
    expect(read.unitMetadata.revenue.status).toBe("unknown_unit");
    expect(read.unitMetadata.revenue.unit).toBe("unknown");
    expect(read.unitMetadata.revenue.unit).not.toBe("billion_vnd");
    expect(read.warnings).toContain("financials_unit_metadata_persistence_payload_missing");
  });

  it("does not treat invalid persisted unit metadata as valid", () => {
    const read = readFinancialsUnitMetadataFromPersistencePayload({
      payload: {
        productionApproved: true,
        schemaVersion: 1,
        unitMetadata: {
          eps: { status: "explicit", unit: "million_vnd" },
          revenue: { status: "explicit", unit: "usd" },
          sharesOutstanding: { status: "explicit", unit: "vnd" },
        },
      },
      snapshot,
    });

    expect(read.status).toBe("invalid_metadata");
    expect(read.productionApproved).toBe(false);
    expect(read.unitMetadata.revenue.status).toBe("unknown_unit");
    expect(read.unitMetadata.eps.status).toBe("unknown_unit");
    expect(read.unitMetadata.sharesOutstanding.status).toBe("unknown_unit");
    expect(read.warnings).toEqual(
      expect.arrayContaining([
        "financials_unit_metadata_production_approval_ignored",
        "eps_persisted_unit_metadata_invalid",
        "revenue_persisted_unit_metadata_invalid",
        "sharesOutstanding_persisted_unit_metadata_invalid",
      ]),
    );
  });

  it("keeps missing values null even when metadata payload is explicit", () => {
    const read = readFinancialsUnitMetadataFromPersistencePayload({
      payload: {
        productionApproved: false,
        schemaVersion: 1,
        unitMetadata: {
          revenue: { status: "explicit", unit: "million_vnd" },
        },
      },
      snapshot: { ...snapshot, revenue: null },
    });

    expect(read.unitMetadata.revenue.status).toBe("missing");
    expect(read.unitMetadata.revenue.unit).toBe("unknown");
  });

  it("lets runtime sidecar consume validated read-back metadata when repository provides it", async () => {
    const unitMetadata = buildFinancialsUnitMetadata({
      explicitUnits: {
        equity: "million_vnd",
        eps: "vnd_per_share",
        revenue: "million_vnd",
        sharesOutstanding: "million_shares",
      },
      snapshot,
    });
    const result = await loadFinancialsRuntimeData(
      { dataMode: "research_only", preferDb: true, sourceLabel: "phase65_csv_unit_capture", ticker: "FPT" },
      {
        adaptSeries: () => adapted(unitMetadata),
        readSeries: async () => seriesResult(),
      },
    );

    expect(result.runtimeStatus).toBe("db_backed");
    expect(result.source.productionApproved).toBe(false);
    expect(result.unitMetadata.revenue.unit).toBe("million_vnd");
    expect(result.unitMetadata.eps.unit).toBe("vnd_per_share");
    expect(result.unitMetadata.sharesOutstanding.unit).toBe("million_shares");
  });

  it("hands runtime sidecar units to controlled Valuation while market ownership remains separate", async () => {
    const unitMetadata = buildFinancialsUnitMetadata({
      explicitUnits: {
        equity: "million_vnd",
        eps: "vnd_per_share",
        revenue: "million_vnd",
        sharesOutstanding: "million_shares",
      },
      snapshot,
    });
    const runtime = await loadFinancialsRuntimeData(
      { dataMode: "research_only", preferDb: true, sourceLabel: "phase65_csv_unit_capture", ticker: "FPT" },
      {
        adaptSeries: () => adapted(unitMetadata),
        readSeries: async () => seriesResult(),
      },
    );
    const valuation = buildControlledValuationIntegrationBoundary({
      financialsRuntimeSnapshot: verifiedRuntime({
        asOf: runtime.source.asOf,
        dataMode: runtime.source.dataMode,
        equity: runtime.statementSnapshot?.totalEquity,
        eps: runtime.statementSnapshot?.eps,
        fallbackUsed: runtime.source.fallbackUsed,
        fiscalYear: runtime.source.fiscalYear,
        period: runtime.statementSnapshot?.period,
        periodType: runtime.source.periodType,
        productionApproved: runtime.source.productionApproved,
        readPath: runtime.source.readPath,
        revenue: runtime.statementSnapshot?.revenue,
        runtimeStatus: runtime.runtimeStatus,
        sharesOutstanding: runtime.statementSnapshot?.sharesOutstanding,
        sourceLabel: runtime.source.sourceLabel,
        units: {
          equity: runtime.unitMetadata.equity.unit,
          eps: runtime.unitMetadata.eps.unit,
          revenue: runtime.unitMetadata.revenue.unit,
          sharesOutstanding: runtime.unitMetadata.sharesOutstanding.unit,
        },
      }),
      persistedValuationInputs: {
        marketPrice: 50_000,
        units: { marketPrice: "vnd_per_share" },
      },
    });

    expect(valuation.selectedInputs.equity.normalizationStatus).toBe("ready");
    expect(valuation.selectedInputs.marketPrice.source).toBe("persisted_bridge");
    expect(valuation.calculation.metrics.pe.status).toBe("ready");
    expect(valuation.calculation.metrics.bvps.status).toBe("ready");
    expect(valuation.sourceBoundary.canClaimValuationDbBacked).toBe(false);
    expect(valuation.sourceBoundary.productionApproved).toBe(false);
  });

  it("keeps unknown runtime sidecar units from making Valuation metrics ready", () => {
    const valuation = buildControlledValuationIntegrationBoundary({
      financialsRuntimeSnapshot: verifiedRuntime({
        equity: 80,
        units: { equity: "unknown" },
      }),
      persistedValuationInputs: {
        marketPrice: 50_000,
        units: { marketPrice: "vnd_per_share" },
      },
    });

    expect(valuation.selectedInputs.equity.normalizationStatus).toBe("unknown_unit");
    expect(valuation.calculation.metrics.bvps.status).toBe("insufficient_data");
  });
});
