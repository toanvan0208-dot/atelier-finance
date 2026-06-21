# Controlled Market PVT Metadata Write Trial

## 1. Phase 73 Summary

Phase 73 runs a controlled Market/PVT metadata write/read-through trial using synthetic/local inputs only.

The audit found that the current `MarketPrice` schema stores market values but does not store field-level Market/PVT unit metadata. Phase 73 therefore uses Mode 2: a controlled read-through/runtime fixture trial. It verifies that explicit Market/PVT unit metadata can travel from the Technical/PVT builder sidecar into the controlled Valuation boundary without a schema migration or DB write.

This phase adds no real market import, no Vnstock/API fetch, no external API call, no production approval, no schema migration, and no new metric.

## 2. Files Audited

- `prisma/schema.prisma`
- `src/lib/data-sources/market-price-read-service.ts`
- `src/lib/data-sources/market-price-pvt-adapter.ts`
- `src/lib/data-sources/vnstock-market-price-persistence.ts`
- `src/features/technical/lib/market-pvt-unit-metadata-contract.ts`
- `src/features/technical/lib/market-pvt-unit-metadata-capture.ts`
- `src/features/technical/lib/build-technical-from-market-price-series.ts`
- `src/features/technical/lib/load-technical-desk-data.ts`
- `src/features/technical/lib/load-technical-runtime-data.ts`
- `src/features/valuation/lib/controlled-valuation-integration-boundary.ts`
- `src/features/valuation/lib/valuation-input-unit-provenance.ts`
- `src/features/valuation/lib/valuation-unit-aware-ready-metrics-scenario.ts`
- `docs/product/MARKET_PVT_UNIT_METADATA_CAPTURE_BOUNDARY.md`
- `docs/product/MARKET_PVT_UNIT_METADATA_CONTRACT.md`
- `docs/product/VALUATION_UNIT_AWARE_READY_METRICS_BROWSER_VERIFICATION.md`
- `docs/product/SOURCE_EVIDENCE_RECORDS.md`
- `docs/product/PRODUCTIZATION_STATUS_AFTER_PHASE_29.md`

## 3. Files Changed

Code:

- `src/features/technical/lib/build-technical-from-market-price-series.ts`

Tests:

- `src/features/technical/lib/__tests__/market-pvt-unit-metadata-write-trial.test.ts`

Docs:

- `docs/product/CONTROLLED_MARKET_PVT_METADATA_WRITE_TRIAL.md`
- cross-reference updates in Market/PVT, Valuation, Financials unit metadata, Technical/PVT, productization, and source-evidence docs.

Schema/migration:

- none

## 4. Trial Mode

Selected mode: Mode 2 - controlled read-through/runtime fixture trial.

Reason:

- `MarketPrice` has value fields such as `closePrice`, `volume`, `tradingValue`, and `marketCap`.
- `MarketPrice` does not have field-level unit metadata columns or a `MarketPriceUnitMetadata` sidecar relation.
- Adding a Market/PVT metadata table would be a schema migration and is outside this phase.

No temp DB was used. No DB write was performed. Market/PVT metadata persistence is deferred.

## 5. Synthetic Market/PVT Trial Input

Synthetic ticker/scenario: `UNIT73`

| Field | Value | Unit | Source | Expected status |
| --- | ---: | --- | --- | --- |
| `marketPrice` | 50000 | `vnd_per_share` | `market_pvt` | `ready` |
| `marketCap` | 5000000000 | `vnd` | `market_pvt` | `ready` |
| `volume` | 100000 | `shares` | `market_pvt` | `ready` |
| `tradingValue` | 5000000000 | `vnd` | `market_pvt` | `ready` |
| `averageTradingValue20d` | 4500000000 | `vnd` | `market_pvt` | `ready` |

Metadata:

- `sourceLabel`: `phase73_synthetic_market_pvt_metadata_trial`
- `dataMode`: `research_only`
- `asOf`: `2026-06-21`
- `productionApproved:false`

## 6. Runtime And Bridge Result

Technical/PVT sidecar:

- `buildTechnicalFromMarketPriceSeries()` can now accept explicit capture `values`, `sourceLabel`, `dataMode`, and `asOf` overrides.
- This lets the synthetic read-through trial carry all five Market/PVT metadata fields without changing the market DB schema.

`loadTechnicalDeskData()`:

- Read-through trial dependency injection can return a `marketUnitMetadata` sidecar with all explicit fields ready.
- Fallback path still returns a safe sidecar with missing values.
- Safe-error path still returns a safe sidecar with missing values.

Old rows without metadata:

- Present values without explicit units remain `unknown_unit`.
- No unit is inferred from numeric magnitude.

Persisted market bridge:

- Valuation receives the `marketUnitMetadata` sidecar as bridge metadata.
- `persisted_market_bridge` metadata remains supported by the Phase 72 boundary.

## 7. Valuation Handoff Result

With explicit synthetic Market/PVT metadata:

- `marketCap`: ready from direct explicit `marketCap`.
- `P/E`: ready only with explicit EPS plus explicit `marketPrice`.
- `BVPS`: ready only with explicit equity and shares.
- `P/B`: ready only with explicit BVPS inputs plus explicit `marketPrice`.
- `P/S`: ready only with explicit revenue plus explicit `marketCap`.
- `EV`: blocked.
- `EV/EBITDA`: blocked.
- `DCF`: blocked.
- fair value range: blocked.

Guardrails:

- Unknown `marketPrice` unit blocks P/E and P/B.
- Unknown `marketCap` unit blocks direct marketCap/P/S.
- Invalid market metadata cannot be bypassed by a parallel raw persisted market number.
- Financials-owned `marketPrice` and `marketCap` remain ignored.
- `productionApproved:false` is preserved.
- `canClaimValuationDbBacked:false` is preserved.
- Mixed-source warning remains when Financials runtime and Market/PVT bridge inputs are combined.

## 8. Missing, Unknown, And Invalid Behavior

- Missing unit: `unknown_unit`, not ready.
- Invalid unit: `invalid_unit`, not ready.
- Invalid value: `invalid_value`, not ready.
- Missing value: `null`, not zero-filled.
- No magnitude guessing.
- Old local rows without metadata stay fail-closed for scale-sensitive Valuation use.

## 9. Tests Added Or Updated

Added:

- `src/features/technical/lib/__tests__/market-pvt-unit-metadata-write-trial.test.ts`

Main groups:

- schema audit proving Market/PVT metadata persistence is not currently supported;
- synthetic explicit read-through metadata for all five Market/PVT fields;
- old rows without metadata becoming `unknown_unit`;
- missing, invalid unit, and invalid value behavior;
- `loadTechnicalDeskData()` read-through, fallback, and safe-error sidecars;
- Valuation handoff for marketCap, P/E, BVPS, P/B, and P/S;
- blocked EV, EV/EBITDA, DCF, and fair value range;
- invalid metadata bypass prevention;
- Financials ownership blocking;
- restricted wording guard.

Updated:

- `src/features/technical/lib/build-technical-from-market-price-series.ts` accepts controlled capture overrides for read-through trial metadata.

## 10. Browser Verification

Browser verification was not run.

Reason: Phase 73 changes helper/runtime metadata handoff and tests/docs only. It does not change visible Technical/PVT or Valuation UI behavior.

## 11. Non-goals

- no DB reset or seed
- no destructive migration
- no schema migration
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

## 12. Limitations

- This is a synthetic/local read-through trial only.
- It does not make Market/PVT data production-approved.
- It does not prove real market provider integration.
- It does not persist Market/PVT unit metadata because the current schema has no safe field-level Market/PVT metadata storage.
- A future phase must design and review additive Market/PVT metadata persistence before any DB write trial can persist market units.

## 13. Next Recommended Phase

Recommended next phase: Phase 74 - Market/PVT Metadata Persistence Design.

Maximum scope:

- design an additive `MarketPriceUnitMetadata` sidecar or equivalent safe storage boundary;
- review migration safety and old-row compatibility;
- keep synthetic/local data only;
- do not run DB reset or seed;
- do not import real market data or real BCTC;
- do not call Vnstock/API/external providers;
- preserve `productionApproved:false`;
- do not add metrics, target price, fair value range, recommendation, Risk scoring, or source approval.
