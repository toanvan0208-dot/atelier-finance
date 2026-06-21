# Source-specific Financials Import Unit Capture

## 1. Phase 65 Summary

Phase 65 adds source-specific unit capture for the local Financials CSV dry-run/import path.

CSV dry-run rows may now provide explicit unit columns for import-owned Financials fields. Valid units are attached to the dry-run accepted row `unitMetadata` sidecar using the Phase 64 Financials unit metadata contract. Missing units stay `unit:"unknown"` with field warnings. Invalid explicit units reject the row.

This phase does not write the database, does not import real BCTC data, does not approve any source, and does not add any new valuation metric.

## 2. Files Audited

- `src/lib/data-sources/financial-statement-file-parser.ts`
- `src/lib/data-sources/financial-statement-import-contract.ts`
- `src/lib/data-sources/financial-statement-local-file-dry-run.ts`
- `scripts/financial-statements-dry-run.ts`
- `scripts/financial-statements-write-trial.ts`
- `src/features/financials/lib/financials-unit-metadata-contract.ts`
- `src/features/valuation/lib/valuation-input-unit-provenance.ts`
- `src/features/valuation/lib/controlled-valuation-integration-boundary.ts`

## 3. Files Changed

Code:

- `src/lib/data-sources/financial-statement-file-parser.ts`
- `src/lib/data-sources/financial-statement-import-contract.ts`
- `src/lib/data-sources/financial-statement-local-write-service.ts`

Tests:

- `src/lib/data-sources/__tests__/financial-statement-file-parser.test.ts`
- `src/lib/data-sources/__tests__/financial-statement-import-contract.test.ts`
- `src/lib/data-sources/__tests__/financial-statement-local-write-service.test.ts`
- `src/lib/data-sources/__tests__/financial-statements-write-trial-cli.test.ts`

Docs:

- `docs/product/SOURCE_SPECIFIC_FINANCIALS_IMPORT_UNIT_CAPTURE.md`
- cross-reference updates in Financials, Valuation, productization, and source-evidence docs.

## 4. CSV Unit Columns

| Financial field | Value column | Unit column | Accepted units | Missing unit behavior | Invalid unit behavior |
| --- | --- | --- | --- | --- | --- |
| `revenue` | `revenue` | `revenue_unit` | `vnd`, `thousand_vnd`, `million_vnd`, `billion_vnd` | accepted as `unknown_unit` warning | row rejected |
| `netIncome` | `netIncome` | `net_income_unit` | `vnd`, `thousand_vnd`, `million_vnd`, `billion_vnd` | accepted as `unknown_unit` warning | row rejected |
| `operatingCashFlow` | `operatingCashFlow` | `operating_cash_flow_unit` | `vnd`, `thousand_vnd`, `million_vnd`, `billion_vnd` | accepted as `unknown_unit` warning | row rejected |
| `totalAssets` | `totalAssets` | `total_assets_unit` | `vnd`, `thousand_vnd`, `million_vnd`, `billion_vnd` | accepted as `unknown_unit` warning | row rejected |
| `equity` | `totalEquity` / `equity` | `equity_unit` | `vnd`, `thousand_vnd`, `million_vnd`, `billion_vnd` | accepted as `unknown_unit` warning | row rejected |
| `totalDebt` | `totalDebt` | `total_debt_unit` | `vnd`, `thousand_vnd`, `million_vnd`, `billion_vnd` | accepted as `unknown_unit` warning | row rejected |
| `currentAssets` | `currentAssets` | `current_assets_unit` | `vnd`, `thousand_vnd`, `million_vnd`, `billion_vnd` | accepted as `unknown_unit` warning | row rejected |
| `currentLiabilities` | `currentLiabilities` | `current_liabilities_unit` | `vnd`, `thousand_vnd`, `million_vnd`, `billion_vnd` | accepted as `unknown_unit` warning | row rejected |
| `eps` | `eps` | `eps_unit` | `vnd_per_share` | accepted as `unknown_unit` warning | row rejected |
| `sharesOutstanding` | `sharesOutstanding` | `shares_outstanding_unit` | `shares`, `thousand_shares`, `million_shares` | accepted as `unknown_unit` warning | row rejected |

Supported simple aliases include camel-case forms such as `revenueUnit`, existing normalized forms such as `sharesOutstanding_unit`, and `unit_<field>` forms such as `unit_revenue`.

## 5. Unit Capture Rules

- Missing value: value remains `null`, unit metadata status is `missing`, and no zero-fill occurs.
- Valid explicit unit with present value: row is accepted, field status is `explicit`, and `productionApproved:false` is preserved.
- Missing or blank unit with present value: row is accepted, field status is `unknown_unit`, and a field warning is emitted.
- Invalid explicit unit with present value: row is rejected and the unit column is listed in `invalidFields`.
- Unit provided for missing value: row is not rejected only because of the unit; a warning records `field_unit_provided_for_missing_value`.
- No magnitude guessing: very large raw values with missing units still remain `unknown_unit`.

## 6. Runtime Sidecar Handoff

Dry-run accepted rows now include `unitMetadata: FinancialsUnitMetadataMap`.

End-to-end DB persistence of this sidecar is deferred because this phase intentionally avoids schema migration and DB writes. The existing runtime sidecar from Phase 64 remains ready to receive explicit units when a persistence boundary is added.

`productionApproved:false` remains forced for local/research/sample data.

## 7. Valuation Impact

Pure tests now demonstrate that explicit import units can be passed into the controlled Valuation integration boundary and normalized by Phase 63 logic.

Unknown units still block scale-sensitive metrics. `marketPrice` and `marketCap` remain non-Financials-owned. EV, EV/EBITDA, DCF, and fair value range remain blocked.

## 8. Dry-run And CLI Behavior

The pretty CLI summary is unchanged except warning/error counts may include unit validation results.

The JSON report already serializes the dry-run object, so accepted row `unitMetadata`, row warnings, rejected row errors, and invalid unit fields are included automatically. No raw report file is written.

## 9. Tests Added/Updated

Covered behavior:

- valid currency unit columns;
- EPS unit column;
- shares outstanding unit column;
- selected unit aliases;
- invalid explicit unit rejection;
- missing unit accepted as `unknown_unit`;
- unit present with missing value remains null;
- no magnitude guessing;
- JSON-shaped dry-run report includes unit metadata;
- production approval remains false;
- pure Valuation handoff with explicit and unknown units;
- dry-run/write-trial fixtures carry sidecar metadata without DB writes.

## 10. Browser Verification

Browser verification was not run.

Reason: Phase 65 changes parser/import dry-run contracts, tests, and docs only. No visible UI behavior changed and no runtime DB unit persistence was added.

## 11. Non-goals

- No DB write.
- No DB schema migration.
- No real BCTC import.
- No official source.
- No Excel/PDF parser.
- No public upload API.
- No external API call.
- No new metric.
- No target price.
- No fair value calculation.
- No recommendation.
- No Risk scoring.
- No production source approval.

## 12. Limitations

- Existing historical/synthetic rows in the local DB do not gain explicit unit metadata.
- Unit metadata does not make local/research/user-provided data production-approved.
- Runtime sidecar persistence is prepared through dry-run object shape, but DB persistence is deferred.

## 13. Next Recommended Phase

Recommended Phase 66: Financials Unit Metadata Persistence Boundary.

Maximum safe scope:

- design where row-level unit metadata can be persisted without promoting source approval;
- migrate or sidecar-store unit metadata only after dry-run review;
- preserve `productionApproved:false`;
- add read-back tests from persistence into Financials runtime sidecar;
- do not add metrics, recommendations, target price, EV, DCF, or fair value range.

## 14. Phase 66 Follow-up

Phase 66 adds `FINANCIALS_UNIT_METADATA_PERSISTENCE_READBACK_BOUNDARY.md`. The current schema has no safe field-level metadata column, so DB persistence remains deferred. A pure payload/read-back helper now defines the boundary, and runtime sidecar handoff is ready when a repository provides validated metadata.

## 15. Phase 67 Follow-up

Phase 67 adds `ADDITIVE_FINANCIALS_UNIT_METADATA_STORAGE_DESIGN_AND_MIGRATION_SAFETY_REVIEW.md`. It recommends a future additive `FinancialStatementUnitMetadata` sidecar table after approval, while keeping Phase 65 CSV unit capture as import/runtime metadata only until persistence is implemented.

No migration, DB write, reset, seed, real BCTC import, or source approval is added by the storage review.

## 16. Phase 68 Follow-up

Phase 68 adds `ADDITIVE_FINANCIALS_UNIT_METADATA_PERSISTENCE_IMPLEMENTATION.md`. Controlled local write now persists explicit Phase 65 unit metadata into the additive sidecar table for recognized Financials fields only, and read-back validates those rows before runtime use.

Missing unit metadata remains compatible, invalid metadata fails closed, and marketPrice/marketCap remain outside Financials import unit ownership.

## 17. Phase 69 Follow-up

Phase 69 adds `CONTROLLED_UNIT_METADATA_WRITE_TRIAL.md`. A synthetic CSV row with explicit unit columns produced one accepted dry-run row and ten persisted sidecar unit rows in a temporary local DB trial. No raw CSV file, JSON output, DB file, or generated Prisma output was committed.
