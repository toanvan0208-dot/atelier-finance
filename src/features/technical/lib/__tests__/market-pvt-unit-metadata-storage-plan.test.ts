import { describe, expect, it } from "vitest";

import {
  buildMarketPvtUnitMetadataMigrationSafetyChecklist,
  MARKET_PVT_UNIT_METADATA_FIELDS,
  MARKET_PVT_UNIT_METADATA_STORAGE_OPTIONS,
  recommendMarketPvtUnitMetadataStorageOption,
} from "../market-pvt-unit-metadata-storage-plan";

const currentSchemaContext = {
  hasMarketCap: true,
  hasMarketPriceValues: true,
  hasMetadataJsonField: false,
  hasUnitMetadataRelation: false,
  marketPriceModelName: "MarketPrice",
  needsFieldLevelAudit: true,
  primaryKey: "String" as const,
  relationAndIndexCanBeAddedSafely: true,
};

describe("market pvt unit metadata storage plan", () => {
  it("compares direct columns, sidecar table, and JSON metadata options", () => {
    expect(MARKET_PVT_UNIT_METADATA_STORAGE_OPTIONS.map((option) => option.id)).toEqual([
      "direct_market_price_columns",
      "sidecar_table_per_field",
      "json_metadata_column",
    ]);
  });

  it("recommends a MarketPriceUnitMetadata sidecar for the current schema context", () => {
    const recommendation = recommendMarketPvtUnitMetadataStorageOption(currentSchemaContext);

    expect(recommendation.recommendedOption.id).toBe("sidecar_table_per_field");
    expect(recommendation.sidecarModelName).toBe("MarketPriceUnitMetadata");
    expect(recommendation.parentModelName).toBe("MarketPrice");
    expect(recommendation.uniqueConstraints).toContain("@@unique([marketPriceId, field])");
    expect(recommendation.indexes).toEqual(
      expect.arrayContaining(["@@index([marketPriceId])", "@@index([field])"]),
    );
    expect(recommendation.migrationImplemented).toBe(false);
    expect(recommendation.schemaChangeImplemented).toBe(false);
    expect(recommendation.dbWriteRequired).toBe(false);
  });

  it("covers all Market/PVT unit metadata fields", () => {
    const recommendation = recommendMarketPvtUnitMetadataStorageOption(currentSchemaContext);

    expect(recommendation.unitFields).toEqual([
      "marketPrice",
      "marketCap",
      "volume",
      "tradingValue",
      "averageTradingValue20d",
    ]);
    expect(MARKET_PVT_UNIT_METADATA_FIELDS).toEqual(recommendation.unitFields);
  });

  it("plans productionApproved false and old-row unknown-unit compatibility", () => {
    const recommendation = recommendMarketPvtUnitMetadataStorageOption(currentSchemaContext);
    const fieldByName = Object.fromEntries(recommendation.sidecarFields.map((field) => [field.name, field]));

    expect(recommendation.productionApproved).toBe(false);
    expect(fieldByName.productionApproved.defaultValue).toBe("false");
    expect(fieldByName.unit.notes).toContain("explicit accepted units");
    expect(recommendation.rationale).toContain("FinancialStatementUnitMetadata");
  });

  it("builds an additive-only migration safety checklist", () => {
    const checklist = buildMarketPvtUnitMetadataMigrationSafetyChecklist("sidecar_table_per_field");
    const byId = Object.fromEntries(checklist.map((item) => [item.id, item]));

    expect(Object.values(byId).every((item) => item.required && item.passed)).toBe(true);
    expect(byId.additive_only.description).toContain("additive only");
    expect(byId.no_schema_change_this_phase.description).toContain("No schema.prisma change");
    expect(byId.no_db_write.description).toContain("No DB write");
    expect(byId.no_db_reset.description).toContain("reset is forbidden");
    expect(byId.no_db_seed.description).toContain("seed step is forbidden");
    expect(byId.no_drop_delete_update_old_data.description).toContain("not drop, delete, or update");
    expect(byId.no_backfill_guessing.description).toContain("No old-row backfill");
    expect(byId.old_rows_unknown_unit.description).toContain("unknown_unit");
    expect(byId.relation_and_unique_index_required.description).toContain("unique marketPrice-field");
  });

  it("keeps ownership, metric, and source-approval guardrails in the plan", () => {
    const checklist = buildMarketPvtUnitMetadataMigrationSafetyChecklist("sidecar_table_per_field");
    const ids = checklist.map((item) => item.id);

    expect(ids).toEqual(
      expect.arrayContaining([
        "financials_ownership_blocked",
        "invalid_metadata_not_valid",
        "no_new_metrics",
        "production_approved_false",
      ]),
    );
  });

  it("does not emit restricted wording in the storage-plan output", () => {
    const output = JSON.stringify({
      checklist: buildMarketPvtUnitMetadataMigrationSafetyChecklist("sidecar_table_per_field"),
      recommendation: recommendMarketPvtUnitMetadataStorageOption(currentSchemaContext),
    }).toLowerCase();
    const blocked = [
      "nen mua",
      "tin hieu mua",
      "dinh gia hap dan",
      "dang re",
      "dang mua",
      "gia muc tieu",
      "muc tieu gia",
      "upside",
      "downside",
      "official",
      "realtime",
      "production-ready",
    ];

    for (const phrase of blocked) {
      expect(output).not.toContain(phrase);
    }
  });
});
