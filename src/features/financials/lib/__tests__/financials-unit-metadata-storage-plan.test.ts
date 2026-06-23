/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it } from "vitest";
import {
  buildFinancialsUnitMetadataMigrationSafetyChecklist,
  FINANCIALS_UNIT_METADATA_STORAGE_OPTIONS,
  recommendFinancialsUnitMetadataStorageOption,
} from "../financials-unit-metadata-storage-plan";

describe("financials unit metadata storage plan", () => {
  it("recommends a JSON field only when provider support and row metadata pattern are confirmed", () => {
    const recommendation = recommendFinancialsUnitMetadataStorageOption({
      jsonStorageSupported: true,
      metadataFieldPatternAccepted: true,
      needsFieldLevelTrace: false,
      provider: "postgresql",
      relationAndIndexCanBeAddedSafely: true,
      schemaContextSufficient: true,
    });

    expect(recommendation.recommendedOption.id).toBe("json_field");
    expect(recommendation.migrationApplied).toBe(false);
    expect(recommendation.dbWriteRequired).toBe(false);
    expect(recommendation.productionApproved).toBe(false);
  });

  it("recommends a sidecar table when JSON storage is not the safe pattern and relation/index work is safe", () => {
    const recommendation = recommendFinancialsUnitMetadataStorageOption({
      jsonStorageSupported: false,
      metadataFieldPatternAccepted: false,
      needsFieldLevelTrace: true,
      provider: "sqlite",
      relationAndIndexCanBeAddedSafely: true,
      schemaContextSufficient: true,
    });

    expect(recommendation.recommendedOption.id).toBe("sidecar_table");
    expect(recommendation.rejectedOptionIds).toEqual(["json_field", "deferred_payload_only"]);
  });

  it("recommends deferral when schema context is insufficient", () => {
    const recommendation = recommendFinancialsUnitMetadataStorageOption({
      provider: "unknown",
      schemaContextSufficient: false,
    });

    expect(recommendation.recommendedOption.id).toBe("deferred_payload_only");
    expect(recommendation.rejectedOptionIds).toEqual(["json_field", "sidecar_table"]);
  });

  it("builds the required migration safety checklist", () => {
    const checklist = buildFinancialsUnitMetadataMigrationSafetyChecklist("sidecar_table");
    const checklistIds = checklist.map((item) => item.id);

    expect(checklist.every((item) => item.required && item.passed)).toBe(true);
    expect(checklistIds).toEqual(
      expect.arrayContaining([
        "additive_only",
        "no_db_reset",
        "no_db_seed",
        "old_rows_unknown_unit",
        "production_approved_false",
        "no_metric_ready_without_explicit_units",
        "relation_and_unique_index_required",
      ]),
    );
  });

  it("keeps exported labels and generated output free from restricted trading wording", () => {
    const text = JSON.stringify({
      checklist: buildFinancialsUnitMetadataMigrationSafetyChecklist("sidecar_table"),
      options: FINANCIALS_UNIT_METADATA_STORAGE_OPTIONS,
      recommendation: recommendFinancialsUnitMetadataStorageOption({
        jsonStorageSupported: false,
        metadataFieldPatternAccepted: false,
        needsFieldLevelTrace: true,
        provider: "sqlite",
        relationAndIndexCanBeAddedSafely: true,
        schemaContextSufficient: true,
      }),
    }).toLowerCase();

    const restricted = [
      "nen " + "mua",
      "nen " + "ban",
      "tin hieu " + "mua",
      "tin hieu " + "ban",
      "diem " + "mua",
      "co phieu " + "an toan",
      "target " + "price",
      "price " + "target",
      "production-" + "ready",
    ];

    for (const phrase of restricted) {
      expect(text).not.toContain(phrase);
    }
  });

  it("does not make a production approval claim", () => {
    const recommendation = recommendFinancialsUnitMetadataStorageOption({
      jsonStorageSupported: false,
      metadataFieldPatternAccepted: false,
      needsFieldLevelTrace: true,
      provider: "sqlite",
      relationAndIndexCanBeAddedSafely: true,
      schemaContextSufficient: true,
    });

    expect(recommendation.productionApproved).toBe(false);
    expect(recommendation.nextPhaseGate).toContain("Phase 68");
  });
});
