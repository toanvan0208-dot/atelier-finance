# Market PVT Unit Metadata Contract

## 1. Phase 70 Summary

Phase 70 adds a Market/PVT unit metadata contract for market-owned inputs used by controlled Valuation and Technical/PVT boundaries.

The contract keeps `marketPrice` and `marketCap` ownership separate from Financials. It adds no new metric, no UI behavior, no DB schema change, no DB write, no real market import, no production approval, no target price, no fair value range, and no recommendation.

## 2. Files Audited

- `src/features/technical`
- `src/features/technical/lib/load-technical-runtime-data.ts`
- `src/features/technical/lib/build-technical-from-market-price-series.ts`
- `src/lib/data-sources/vnstock-research-connector.ts`
- `src/lib/data-sources/vnstock-manual-export-loader.ts`
- `src/features/valuation/lib/controlled-valuation-integration-boundary.ts`
- `src/features/valuation/lib/valuation-input-unit-provenance.ts`
- `src/features/valuation/lib/controlled-valuation-calculation.ts`
- `docs/product/CONTROLLED_UNIT_METADATA_WRITE_TRIAL.md`
- `docs/product/VALUATION_INPUT_UNIT_PROVENANCE_NORMALIZATION.md`

## 3. Files Changed

Code:

- `src/features/technical/lib/market-pvt-unit-metadata-contract.ts`
- `src/features/technical/index.ts`
- `src/features/valuation/lib/controlled-valuation-integration-boundary.ts`

Tests:

- `src/features/technical/lib/__tests__/market-pvt-unit-metadata-contract.test.ts`
- `src/features/valuation/lib/__tests__/controlled-valuation-integration-boundary.test.ts`

Docs:

- `docs/product/MARKET_PVT_UNIT_METADATA_CONTRACT.md`
- cross-reference updates in Financials, Valuation, productization, and source-evidence docs.

Schema/migration:

- none

## 4. Market/PVT Field Unit Contract

| Field | Owner | Accepted units | If unit missing | If unit invalid | Used by Valuation? |
| --- | --- | --- | --- | --- | --- |
| `marketPrice` | Market/PVT or persisted market bridge | `vnd_per_share` | `unknown_unit`, calculation blocked | `invalid_unit`, not treated as valid | yes |
| `marketCap` | Market/PVT or persisted market bridge | `vnd`, `thousand_vnd`, `million_vnd`, `billion_vnd` | `unknown_unit`, direct marketCap blocked | `invalid_unit`, not treated as valid | yes |
| `volume` | Market/PVT | `shares`, `thousand_shares`, `million_shares` | `unknown_unit` | `invalid_unit` | no |
| `tradingValue` | Market/PVT | `vnd`, `thousand_vnd`, `million_vnd`, `billion_vnd` | `unknown_unit` | `invalid_unit` | no |
| `averageTradingValue20d` | Market/PVT | `vnd`, `thousand_vnd`, `million_vnd`, `billion_vnd` | `unknown_unit` | `invalid_unit` | no |

The helper records:

- value
- unit
- status
- owner
- sourceLabel
- dataMode
- asOf
- warnings
- `productionApproved:false`

## 5. Ownership Rules

- `marketPrice` is not Financials-owned.
- `marketCap` is not Financials-owned.
- Financials may provide `sharesOutstanding` unit metadata through its own contract.
- Direct explicit `marketCap` takes precedence over derived market cap.
- Derived market cap is allowed only from explicit `marketPrice` plus explicit `sharesOutstanding`.
- Market/PVT local/research/sample data remains `productionApproved:false`.
- Market/PVT metadata does not make Valuation fully DB-backed or production-approved.

## 6. Valuation Impact

Controlled Valuation now accepts optional `marketUnitMetadata` on persisted market inputs.

Impact:

- P/E requires explicit Financials EPS unit and explicit Market/PVT marketPrice unit.
- BVPS requires explicit Financials equity and shares units.
- P/B requires BVPS plus explicit Market/PVT marketPrice unit.
- marketCap can be direct explicit Market/PVT marketCap or derived from explicit marketPrice plus explicit sharesOutstanding.
- P/S requires explicit Financials revenue plus direct or derived marketCap.
- Unknown or invalid market units block dependent metrics.
- EV, EV/EBITDA, DCF, and fair value range remain blocked.

Existing `units` input remains backward compatible. When `marketUnitMetadata` is present, its unit/provenance/warnings are preferred for market inputs.

## 7. Source And Mixed Boundary

Market/PVT metadata uses `source:"market_pvt"` provenance when provided.

Financials and Market/PVT sources can remain mixed. The boundary keeps:

- `productionApproved:false`
- `canClaimValuationDbBacked:false`
- mixed-source warnings when Financials and market inputs come from different source paths

## 8. Tests Added Or Updated

Added:

- Market/PVT contract tests for accepted units, unknown units, invalid units, ownership, source approval, and forbidden wording.

Updated:

- controlled Valuation integration tests for marketPrice handoff, direct marketCap, derived marketCap, unknown/invalid market units, ownership separation, and blocked EV/DCF outputs.

## 9. Browser Verification

Browser verification was not run.

Reason: Phase 70 changes helper logic, type contracts, Valuation boundary tests, and docs only. No visible UI behavior changed.

## 10. Non-goals

- no DB write
- no DB schema migration
- no reset or seed
- no real market data import
- no real BCTC import
- no approved source integration
- no Excel or PDF parser
- no public upload API
- no external API call
- no new metric
- no target price
- no fair value range
- no recommendation or trading signal
- no Risk scoring
- no production source approval

## 11. Limitations

- Existing market data may not carry explicit unit metadata.
- Market/PVT metadata contract does not make any source production-approved.
- A future phase may need source-specific market unit capture or browser verification.
- Market input metadata remains separate from Financials sidecar persistence.

## 12. Next Recommended Phase

Recommended next phase: Phase 71 - Valuation Unit-aware Ready Metrics Browser Verification.

Maximum scope:

- use controlled synthetic/local explicit Financials and Market/PVT units only;
- verify Valuation visible output does not overclaim source status;
- preserve `productionApproved:false` and `canClaimValuationDbBacked:false`;
- do not add new metrics, EV, DCF, fair value range, target price, recommendation, Risk scoring, DB reset, seed, or real data import.
