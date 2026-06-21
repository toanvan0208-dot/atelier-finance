# Market PVT Unit Metadata Capture Boundary

## 1. Phase 72 Summary

Phase 72 adds a Market/PVT unit metadata capture boundary for local/research market price runtime and persisted market bridge handoff.

The boundary captures explicit units when a Market/PVT source supplies them and otherwise returns `unknown_unit` without guessing magnitude. It adds no real market import, no API/Vnstock fetch, no DB write, no DB schema migration, no production approval, and no new metric.

## 2. Files Audited

- `src/features/technical/lib/market-pvt-unit-metadata-contract.ts`
- `src/features/technical/lib/build-technical-from-market-price-series.ts`
- `src/features/technical/lib/load-technical-desk-data.ts`
- `src/features/technical/lib/load-technical-runtime-data.ts`
- `src/lib/data-sources/market-price-read-service.ts`
- `src/lib/data-sources/market-price-pvt-adapter.ts`
- `src/features/valuation/lib/controlled-valuation-integration-boundary.ts`
- `src/features/valuation/lib/valuation-input-unit-provenance.ts`
- `src/features/valuation/lib/valuation-unit-aware-ready-metrics-scenario.ts`
- `docs/product/MARKET_PVT_UNIT_METADATA_CONTRACT.md`
- `docs/product/VALUATION_UNIT_AWARE_READY_METRICS_BROWSER_VERIFICATION.md`
- `docs/product/TECHNICAL_PVT_RUNTIME_DATA_FLOW_WIRING.md`
- `docs/product/MARKET_PRICE_DB_READ_PATH_VERIFICATION.md`

## 3. Files Changed

Code:

- `src/features/technical/lib/market-pvt-unit-metadata-capture.ts`
- `src/features/technical/lib/market-pvt-unit-metadata-contract.ts`
- `src/features/technical/lib/build-technical-from-market-price-series.ts`
- `src/features/technical/lib/load-technical-desk-data.ts`
- `src/features/technical/components/TechnicalPage.tsx`
- `src/features/technical/index.ts`
- `src/features/valuation/lib/controlled-valuation-integration-boundary.ts`

Tests:

- `src/features/technical/lib/__tests__/market-pvt-unit-metadata-capture.test.ts`
- `src/features/technical/lib/__tests__/build-technical-from-market-price-series.test.ts`
- `src/features/technical/lib/__tests__/load-technical-runtime-data.test.ts`
- `src/features/valuation/lib/__tests__/controlled-valuation-integration-boundary.test.ts`

Docs:

- `docs/product/MARKET_PVT_UNIT_METADATA_CAPTURE_BOUNDARY.md`
- cross-reference updates in Market/PVT, Valuation, Financials unit metadata, Technical/PVT, productization, and source-evidence docs.

Schema/migration:

- none

## 4. Capture Fields

| Field | Owner | Accepted units | Missing unit | Invalid unit | Handoff target |
| --- | --- | --- | --- | --- | --- |
| `marketPrice` | Market/PVT or persisted market bridge | `vnd_per_share` | `unknown_unit`, dependent metrics blocked | `invalid_unit`, not valid | Valuation P/E, P/B, derived marketCap |
| `marketCap` | Market/PVT or persisted market bridge | `vnd`, `thousand_vnd`, `million_vnd`, `billion_vnd` | `unknown_unit`, direct marketCap blocked | `invalid_unit`, not valid | Valuation marketCap and P/S |
| `volume` | Market/PVT | `shares`, `thousand_shares`, `million_shares` | `unknown_unit` | `invalid_unit`, not valid | Technical/PVT liquidity sidecar |
| `tradingValue` | Market/PVT | `vnd`, `thousand_vnd`, `million_vnd`, `billion_vnd` | `unknown_unit` | `invalid_unit`, not valid | Technical/PVT liquidity sidecar |
| `averageTradingValue20d` | Market/PVT | `vnd`, `thousand_vnd`, `million_vnd`, `billion_vnd` | `unknown_unit` | `invalid_unit`, not valid | Technical/PVT liquidity sidecar |

Invalid values fail closed:

- `marketPrice`, `marketCap`, `volume`, `tradingValue`, and `averageTradingValue20d` require positive values.
- Missing values stay `null` and are not replaced with `0`.

## 5. Source Ownership

- `marketPrice` and `marketCap` remain Market/PVT or persisted-market-bridge owned.
- Financials ownership of `marketPrice` and `marketCap` remains blocked.
- Captured metadata carries `source`, `sourceLabel`, `dataMode`, `asOf`, warnings, and `productionApproved:false`.
- Local/research/sample data remains non-approved even when units are explicit.

## 6. Runtime And Bridge Handoff

Technical/PVT runtime handoff:

- `buildTechnicalFromMarketPriceSeries()` now returns `marketUnitMetadata`.
- `loadTechnicalDeskData()` now returns `marketUnitMetadata`.
- Fallback/sample paths return a metadata sidecar with missing or unknown units.
- DB-backed rows without explicit units return `unknown_unit` for present numeric fields.

Persisted market bridge handoff:

- `normalizeMarketPvtUnitMetadataForValuation()` returns the `marketPrice` and `marketCap` fields expected by Valuation.
- `attachMarketPvtUnitMetadata()` can attach sidecar metadata to bridge-like payloads without losing existing warnings.
- Valuation integration distinguishes metadata source `persisted_market_bridge` from `market_pvt`.

Backward compatibility:

- Existing local market rows do not need a schema migration.
- If no unit metadata is supplied, the sidecar is still present and marks explicit-unit-dependent fields as `unknown_unit`.

## 7. Valuation Impact

- P/E remains ready only with explicit EPS plus explicit marketPrice.
- P/B remains ready only with explicit BVPS inputs plus explicit marketPrice.
- marketCap can be direct explicit marketCap or derived from explicit marketPrice plus explicit shares.
- P/S remains ready only with explicit revenue plus direct or derived marketCap.
- Unknown, invalid, or invalid-value market metadata blocks dependent metrics.
- EV, EV/EBITDA, DCF, and fair value range remain blocked.
- No investment interpretation is added.

## 8. Tests Added Or Updated

Added:

- Market/PVT capture tests for explicit units, missing units, invalid units, invalid values, missing values, valuation handoff fields, attach helper behavior, and forbidden wording.

Updated:

- Technical/PVT builder tests for unknown sidecar behavior and explicit-unit sidecar behavior.
- Technical runtime fixture tests for the new sidecar.
- Valuation integration tests for persisted market bridge metadata handoff.

## 9. Browser Verification

Browser verification was not run.

Reason: Phase 72 adds helper/types/runtime metadata sidecar/tests/docs only. It does not change visible Technical/PVT or Valuation UI behavior.

## 10. Non-goals

- no DB write
- no DB schema migration
- no DB reset or seed
- no real market data import
- no real BCTC import
- no official source
- no Vnstock/API fetch
- no Excel or PDF parser
- no public upload API
- no external API call
- no new metric
- no target price
- no fair value
- no recommendation
- no Risk scoring
- no production source approval

## 11. Limitations

- Existing Market/PVT runtime rows may still lack explicit unit metadata because the current database schema does not store field-level market units.
- Capture metadata does not make local/research/sample data production-approved.
- A future phase may need a controlled Market/PVT metadata write trial or source-specific market unit capture plan.

## 12. Next Recommended Phase

Recommended next phase: Phase 73 - Controlled Market/PVT Metadata Write Trial.

Maximum scope:

- use synthetic/local market data only;
- prove explicit market units can persist or be read through an approved sidecar/path if one exists;
- keep DB files, generated output, raw CSV/JSON, and screenshots out of commit;
- preserve `productionApproved:false`;
- do not add new metrics, target price, fair value range, recommendation, Risk scoring, API fetches, DB reset, seed, or real-data import.

## 13. Phase 73 Follow-up

Phase 73 adds `CONTROLLED_MARKET_PVT_METADATA_WRITE_TRIAL.md`. The trial uses Mode 2 read-through/runtime fixtures because `MarketPrice` has no field-level unit metadata storage. Explicit synthetic Market/PVT metadata can still pass through the Technical/PVT sidecar into Valuation, while persistence is deferred.

No DB write, schema migration, real market import, Vnstock/API fetch, source approval, UI change, or new metric is added.

## 14. Phase 74 Follow-up

Phase 74 adds `MARKET_PVT_METADATA_PERSISTENCE_DESIGN.md`. It keeps the capture boundary unchanged and designs a future additive sidecar storage path so captured Market/PVT metadata can later be persisted without guessing units for old rows.
