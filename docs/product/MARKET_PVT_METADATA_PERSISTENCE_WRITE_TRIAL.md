# Market PVT Metadata Persistence Write Trial

## Phase

Phase 76 - Controlled Market/PVT Metadata Persistence Write Trial.

## Trial Type

Controlled synthetic/local persistence write trial.

This phase verifies the Phase 75 `MarketPriceUnitMetadata` sidecar without importing real market data, importing real BCTC data, calling external APIs, calling Vnstock, running DB reset, running seed, or using `prisma db push`.

## Synthetic Scenario

- ticker: `UNIT76`
- sourceLabel/scenario: `phase76_synthetic_market_pvt_metadata_persistence_trial`
- dataMode: `research_only`
- asOf: `2026-06-21`
- productionApproved: `false`

The trial uses an in-memory controlled test database fixture. No SQLite DB file is created or committed.

## Persisted Metadata Verified

| Field | Synthetic value | Unit | Expected read-back |
| --- | ---: | --- | --- |
| `marketPrice` | `50000` | `vnd_per_share` | ready |
| `marketCap` | `5000000000` | `vnd` | ready |
| `volume` | `100000` | `shares` | ready |
| `tradingValue` | `5000000000` | `vnd` | ready |
| `averageTradingValue20d` | `4500000000` | `vnd` | ready |

The write helper upserts only explicit valid `ready` metadata by `marketPriceId + field`. Invalid or missing units are rejected by the helper and remain fail-closed on read-back.

## Read-back Verified

- persisted valid sidecar metadata is read into `marketUnitMetadata`;
- old `MarketPrice` rows without metadata return `unknown_unit`;
- corrupted persisted sidecar units fail closed;
- missing units do not become `0`;
- missing units do not default to VND or shares;
- no unit is inferred from numeric magnitude;
- persisted numeric market values cannot bypass invalid metadata.

## Technical/PVT Runtime

`getMarketPriceSeries()` returns persisted sidecar metadata as `marketUnitMetadata`.

`buildTechnicalFromMarketPriceSeries()` receives the persisted `marketUnitMetadata` from the DB-backed series when no explicit capture override is supplied.

Fallback and safe-error paths continue to return missing/unknown metadata without zero-fill or unit guessing.

## Valuation Boundary

The controlled Valuation boundary can consume valid explicit Market/PVT metadata from the persisted market bridge.

The boundary still blocks unit-sensitive market metrics when metadata is missing, unknown, invalid, or invalid-value. Financials still cannot own `marketPrice` or `marketCap` metadata. Financials DB-backed data does not make Valuation fully DB-backed, and Market/PVT sidecar metadata does not approve any source.

Blocked valuation areas remain blocked:

- EV
- EV/EBITDA
- DCF
- fair value range

No target price, recommendation, or Risk scoring is added.

## Source And Data Guardrails

- real market data used: no
- real BCTC used: no
- external API/Vnstock used: no
- DB reset/seed/db push used: no
- source approval added: no
- productionApproved: `false`
- browser-visible wording changed: no
- new UI added: no
- new provider/parser added: no

## Test Evidence

Focused test:

- `src/features/technical/lib/__tests__/market-pvt-unit-metadata-persistence-write-trial.test.ts`

Coverage:

- controlled synthetic `MarketPrice` row receives valid sidecar metadata;
- read-back returns `marketPrice`, `marketCap`, `volume`, `tradingValue`, and `averageTradingValue20d` ready;
- old rows without sidecar metadata remain `unknown_unit`;
- missing units do not zero-fill or default;
- invalid units fail closed;
- persisted numeric values cannot bypass invalid metadata;
- Valuation consumes valid persisted Market/PVT metadata only;
- Financials ownership of market inputs remains blocked;
- source approval and `productionApproved:false` remain unchanged.

## Browser Verification

Browser verification was not run.

Reason: Phase 76 adds a controlled test/evidence write trial only and does not change UI or browser-visible behavior.
