# Financials Import Unit Metadata Contract

## 1. Phase 64 Summary

Phase 64 adds a Financials-side unit metadata contract for the numeric fields that can later feed Valuation, Risk, and other derived modules.

The contract does not infer scale from magnitude. If Financials runtime data has a numeric value but no explicit source unit, the sidecar metadata keeps `unit:"unknown"`, emits a field-level warning, and preserves `productionApproved:false`.

No real BCTC import, parser, DB write, source approval, new metric, EV, EV/EBITDA, DCF, fair value range, target price, or recommendation is added.

## 2. Files Changed

Code:

- `src/features/financials/lib/financials-unit-metadata-contract.ts`
- `src/features/financials/lib/financials-runtime-types.ts`
- `src/features/financials/lib/load-financials-runtime-data.ts`
- `src/features/financials/index.ts`
- `src/features/valuation/components/ValuationPage.tsx`

Tests:

- `src/features/financials/lib/__tests__/financials-unit-metadata-contract.test.ts`
- `src/features/financials/lib/__tests__/load-financials-runtime-data.test.ts`
- Financials/Overview/Valuation/Risk runtime fixture tests updated for the required sidecar.

Docs:

- `docs/product/FINANCIALS_IMPORT_UNIT_METADATA_CONTRACT.md`
- cross-reference updates in Valuation, productization, and source-evidence docs.

## 3. Unit Contract

| Field | Snapshot source | Accepted units | If missing value | If present value has no explicit unit |
| --- | --- | --- | --- | --- |
| `revenue` | `revenue` | `vnd`, `thousand_vnd`, `million_vnd`, `billion_vnd` | `status:"missing"`, `unit:"unknown"` | `status:"unknown_unit"`, warning |
| `netIncome` | `netProfit` | `vnd`, `thousand_vnd`, `million_vnd`, `billion_vnd` | `status:"missing"`, `unit:"unknown"` | `status:"unknown_unit"`, warning |
| `operatingCashFlow` | `operatingCashFlow` | `vnd`, `thousand_vnd`, `million_vnd`, `billion_vnd` | `status:"missing"`, `unit:"unknown"` | `status:"unknown_unit"`, warning |
| `totalAssets` | `totalAssets` | `vnd`, `thousand_vnd`, `million_vnd`, `billion_vnd` | `status:"missing"`, `unit:"unknown"` | `status:"unknown_unit"`, warning |
| `equity` | `totalEquity` | `vnd`, `thousand_vnd`, `million_vnd`, `billion_vnd` | `status:"missing"`, `unit:"unknown"` | `status:"unknown_unit"`, warning |
| `totalDebt` | `totalDebt` | `vnd`, `thousand_vnd`, `million_vnd`, `billion_vnd` | `status:"missing"`, `unit:"unknown"` | `status:"unknown_unit"`, warning |
| `currentAssets` | `currentAssets` | `vnd`, `thousand_vnd`, `million_vnd`, `billion_vnd` | `status:"missing"`, `unit:"unknown"` | `status:"unknown_unit"`, warning |
| `currentLiabilities` | `currentLiabilities` | `vnd`, `thousand_vnd`, `million_vnd`, `billion_vnd` | `status:"missing"`, `unit:"unknown"` | `status:"unknown_unit"`, warning |
| `eps` | `eps` | `vnd_per_share` | `status:"missing"`, `unit:"unknown"` | `status:"unknown_unit"`, warning |
| `sharesOutstanding` | `sharesOutstanding` | `shares`, `thousand_shares`, `million_shares` | `status:"missing"`, `unit:"unknown"` | `status:"unknown_unit"`, warning |

`marketPrice` and `marketCap` are intentionally excluded. They are market-owned or persisted-bridge inputs, not Financials import fields.

## 4. Runtime Behavior

`FinancialsRuntimeData` now includes:

- `unitMetadata: FinancialsUnitMetadataMap`

The runtime loader attaches metadata for sample fallback, DB-backed local reads, unavailable reads, and read errors.

Current Phase 45/47 local research statement rows do not carry explicit unit metadata, so present numeric fields become `unknown_unit`. Missing/null fields become `missing`. This preserves null-safety and prevents scale-sensitive downstream calculations from treating raw values as normalized VND or shares.

## 5. Valuation Impact

`ValuationPage` now passes Financials runtime units into the controlled Valuation integration boundary for:

- `revenue`
- `netIncome`
- `equity`
- `eps`
- `sharesOutstanding`

Because current Financials runtime units are unknown unless a caller supplies explicit metadata, controlled Valuation metrics remain `insufficient_data` where unit normalization cannot be proven. This is expected and keeps Phase 63's no-magnitude-guessing rule intact.

## 6. Tests

Covered behavior:

- all ten required Financials fields are in the contract;
- market-owned fields are excluded;
- currency, EPS, and share units are accepted only on compatible fields;
- present values without explicit source units become `unknown_unit`;
- missing values remain `missing` and are not zero-filled;
- invalid explicit units are flagged;
- Valuation receives only valuation-relevant Financials units from the sidecar;
- Financials runtime loader returns unit metadata on sample, DB-backed, unavailable, and read-error paths;
- existing Financials/Overview/Valuation/Risk runtime tests compile against the required sidecar.

## 7. Browser Verification

Browser verification was not required for Phase 64.

Reason: this phase adds a unit metadata contract, runtime sidecar, Valuation unit handoff, tests, and docs. It does not add a new visible UI component and the current local/sample Financials sources still expose unknown units, so visible controlled Valuation behavior remains the same conservative unavailable/insufficient-data state established in Phase 63.

## 8. Non-goals

- No DB write.
- No DB cleanup/delete.
- No `db:reset`.
- No `db:seed`.
- No real BCTC import.
- No source approval.
- No Excel/PDF parser.
- No public upload API.
- No external API call.
- No new valuation metric.
- No EV calculation.
- No EV/EBITDA calculation.
- No DCF/WACC calculation.
- No fair value range calculation.
- No recommendation.
- No target price.

## 9. Next Recommended Phase

Recommended Phase 65: source-specific Financials import unit capture.

Maximum safe scope:

- carry explicit unit metadata from dry-run/import rows into runtime metadata;
- keep raw values and normalized values separate;
- keep `productionApproved:false`;
- add tests for one source-specific local/research fixture;
- do not approve any source or expand Valuation metrics.

## 10. Phase 65 Follow-up

Phase 65 adds `SOURCE_SPECIFIC_FINANCIALS_IMPORT_UNIT_CAPTURE.md`. The local CSV dry-run/import contract can now capture explicit unit columns into accepted row `unitMetadata`, reject invalid explicit units, and keep missing units as `unknown_unit`. Runtime DB persistence of the sidecar remains deferred.

## 11. Phase 66 Follow-up

Phase 66 adds `FINANCIALS_UNIT_METADATA_PERSISTENCE_READBACK_BOUNDARY.md`. No schema migration was made; instead a pure persistence payload helper validates field-level unit sidecars and the Financials runtime loader can consume adapted statement `unitMetadata` when a future repository provides it.

## 12. Phase 67 Follow-up

Phase 67 adds `ADDITIVE_FINANCIALS_UNIT_METADATA_STORAGE_DESIGN_AND_MIGRATION_SAFETY_REVIEW.md`. The contract remains the validator for allowed Financials fields and units, while the storage review recommends a future additive sidecar table to persist one unit metadata record per statement field.

The review does not apply a migration, write DB rows, or change the existing `unknown_unit` behavior for old rows.

## 13. Phase 68 Follow-up

Phase 68 adds `ADDITIVE_FINANCIALS_UNIT_METADATA_PERSISTENCE_IMPLEMENTATION.md`. The Phase 64 contract now gates both sidecar write selection and sidecar read-back validation: only recognized Financials fields can be persisted as explicit metadata, and invalid persisted units are downgraded rather than accepted.

The sidecar implementation does not infer units from magnitude and does not make local/research/sample data production-approved.

## 14. Phase 69 Follow-up

Phase 69 adds `CONTROLLED_UNIT_METADATA_WRITE_TRIAL.md`. The controlled synthetic trial confirms the contract-owned fields can persist explicit units through the sidecar and return through read-back/runtime metadata without changing source approval.
