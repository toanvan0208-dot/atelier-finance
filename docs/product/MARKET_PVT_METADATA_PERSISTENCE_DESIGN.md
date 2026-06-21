# Market PVT Metadata Persistence Design

## 1. Phase 74 Summary

Phase 74 designs Market/PVT unit metadata persistence and reviews migration safety.

No schema migration is implemented. No `schema.prisma` model is added. No DB write is performed. No real market data import, real BCTC import, Vnstock/API fetch, source approval, UI change, or new metric is added.

The recommended future design is an additive sidecar table named `MarketPriceUnitMetadata`, one row per `MarketPrice` row and Market/PVT field.

## Phase 75 Implementation Follow-up

Phase 75 implements the Phase 74 recommendation with an additive `MarketPriceUnitMetadata` sidecar model/table and a migration that only creates the sidecar table, indexes, unique field-level constraint, and foreign key relation.

Existing `MarketPrice` rows without sidecar rows remain readable and map to `unknown_unit`. Missing metadata does not become zero or a default VND/share unit. Invalid persisted metadata fails closed and cannot be bypassed by parallel persisted numeric market values.

No unit is inferred by magnitude. No source approval, real market import, real BCTC import, external API/Vnstock call, provider, parser, UI change, valuation metric, target price, fair value, recommendation, or Risk scoring is added. Valuation can consume explicit Market/PVT sidecar metadata only when it passes the existing Market/PVT unit contract, and the broader Valuation DB-backed claim remains limited.

## 2. Files Audited

- `prisma/schema.prisma`
- `prisma/migrations/20260618162000_phase_29e_local_database_foundation/migration.sql`
- `prisma/migrations/20260621070000_phase_68_financials_unit_metadata_sidecar/migration.sql`
- `src/lib/data-sources/market-price-read-service.ts`
- `src/lib/data-sources/market-price-pvt-adapter.ts`
- `src/lib/data-sources/vnstock-market-price-persistence.ts`
- `src/lib/database/services/market-price-service.ts`
- `src/features/technical/lib/build-technical-from-market-price-series.ts`
- `src/features/technical/lib/market-pvt-unit-metadata-capture.ts`
- `src/features/technical/lib/market-pvt-unit-metadata-contract.ts`
- `src/features/technical/lib/load-technical-desk-data.ts`
- `src/features/valuation/lib/controlled-valuation-integration-boundary.ts`
- `docs/product/CONTROLLED_MARKET_PVT_METADATA_WRITE_TRIAL.md`
- `docs/product/MARKET_PVT_UNIT_METADATA_CAPTURE_BOUNDARY.md`
- `docs/product/MARKET_PVT_UNIT_METADATA_CONTRACT.md`
- `docs/product/SOURCE_EVIDENCE_RECORDS.md`
- `docs/product/PRODUCTIZATION_STATUS_AFTER_PHASE_29.md`

## 3. Current MarketPrice Schema Findings

Model/table name: `MarketPrice`.

Primary key:

- `id String @id @default(cuid())`

Relevant market fields:

- `openPrice Decimal?`
- `highPrice Decimal?`
- `lowPrice Decimal?`
- `closePrice Decimal?`
- `previousClose Decimal?`
- `adjustedClosePrice Decimal?`
- `volume Decimal?`
- `tradingValue Decimal?`
- `marketCap Decimal?`

Relevant source/readiness fields:

- `ticker String`
- `tradingDate DateTime`
- `periodType PeriodType @default(day)`
- `period String`
- `currency String?`
- `sourceId String`
- `sourceLabel String`
- `sourceType SourceType`
- `dataMode DataMode`
- `asOf DateTime`
- `collectedAt DateTime?`
- `qualityStatus QualityStatus`
- `readiness ReadinessStatus`
- `missingFields String`
- `warningCodes String`
- `errorCodes String`

Existing metadata storage as of Phase 74:

- No Market/PVT unit metadata JSON field exists.
- No `MarketPriceUnitMetadata` sidecar table exists.
- No `unitMetadata` relation exists on `MarketPrice`.

Existing metadata storage as of Phase 75:

- `MarketPrice.unitMetadata MarketPriceUnitMetadata[]` exists.
- `MarketPriceUnitMetadata` stores one row per `marketPriceId` and Market/PVT field.
- `@@unique([marketPriceId, field])` prevents duplicate metadata rows for a field on the same `MarketPrice`.
- Existing `MarketPrice` rows do not require sidecar rows.

Existing read path:

- `getMarketPriceSeries()` reads `MarketPrice` rows and returns numeric series rows.
- `buildTechnicalFromMarketPriceSeries()` can now attach runtime `marketUnitMetadata` sidecars.

Existing write/import path:

- `persistVnstockResearchMarketPrices()` can write local/research market price values.
- It writes value/source/readiness fields only.
- It does not write Market/PVT unit metadata.

Conclusion:

- Current persistence does not support explicit Market/PVT unit metadata.
- Old rows without metadata must continue to read as `unknown_unit` when values are present.

## 4. Storage Options Comparison

| Option | Description | Pros | Cons | Migration risk | Backward compatibility | Recommendation |
| --- | --- | --- | --- | --- | --- | --- |
| Direct columns on `MarketPrice` | Add nullable unit/source columns such as `marketPriceUnit`, `marketCapUnit`, `volumeUnit`, `tradingValueUnit`, and `averageTradingValue20dUnit`. | Simple single-row reads; no join; null columns can preserve old rows. | Many sparse columns; weaker field-level status/warning audit; diverges from Financials sidecar pattern. | Additive if nullable only, but every future metadata field widens `MarketPrice`. | Old rows leave columns null and read as `unknown_unit`. | Not recommended. |
| Sidecar table per field | Add `MarketPriceUnitMetadata` keyed by `marketPriceId` and `field`. | Field-level audit; queryable; mirrors `FinancialStatementUnitMetadata`; old rows need no sidecar rows. | Requires joins/read-back mapping; partial sidecars must fail closed. | Additive `CREATE TABLE` plus indexes/unique constraints in a future phase. | Old rows remain valid and read as `unknown_unit`. | Recommended. |
| JSON metadata column | Add nullable `unitMetadata` payload on `MarketPrice`. | Single-row read-back; shape can resemble runtime sidecar; small migration. | Weak field-level constraints; app-layer shape validation; not an existing MarketPrice schema pattern. | Additive as nullable field but needs provider/queryability review. | Old rows keep null JSON and read as `unknown_unit`. | Not recommended for first durable persistence. |

## 5. Recommended Design

Chosen option: sidecar table per field.

Why:

- Market/PVT metadata is field-level.
- The repo already uses `FinancialStatementUnitMetadata` for additive unit sidecars.
- A sidecar avoids widening the market value table with many nullable columns.
- A unique parent-field constraint prevents duplicate metadata rows.
- Missing sidecar rows give a clean old-row fallback to `unknown_unit`.

Draft only. Not applied in Phase 74.

```prisma
// Draft only - not applied in Phase 74.
model MarketPrice {
  id           String                    @id @default(cuid())
  unitMetadata MarketPriceUnitMetadata[]
}

model MarketPriceUnitMetadata {
  id                 String      @id @default(cuid())
  marketPriceId      String
  field              String
  unit               String
  status             String
  source             String      @default("market_pvt")
  sourceLabel        String?
  dataMode           String?
  asOf               DateTime?
  warningCodes       String      @default("[]")
  productionApproved Boolean     @default(false)
  createdAt          DateTime    @default(now())
  updatedAt          DateTime    @updatedAt
  marketPrice        MarketPrice @relation(fields: [marketPriceId], references: [id], onDelete: Cascade)

  @@unique([marketPriceId, field])
  @@index([marketPriceId])
  @@index([field])
  @@index([dataMode])
}
```

Storage rules:

- Persist only explicit accepted unit metadata as valid sidecar rows.
- Missing unit does not need a valid row; read-back returns `unknown_unit`.
- Invalid unit is not treated as valid.
- Invalid persisted metadata must fail closed.
- `productionApproved:false` is default and remains false for local/research/sample data.
- No unit is inferred from value magnitude.

## 6. Field Coverage

| Field | Owner | Unit storage | Missing unit fallback | Invalid unit behavior |
| --- | --- | --- | --- | --- |
| `marketPrice` | Market/PVT or persisted market bridge | `MarketPriceUnitMetadata` row with accepted `vnd_per_share` | `unknown_unit`, dependent metrics blocked | fail closed, not valid |
| `marketCap` | Market/PVT or persisted market bridge | `MarketPriceUnitMetadata` row with accepted VND-scale unit | `unknown_unit`, direct marketCap/P/S blocked | fail closed, not valid |
| `volume` | Market/PVT | `MarketPriceUnitMetadata` row with accepted share unit | `unknown_unit` | fail closed, not valid |
| `tradingValue` | Market/PVT | `MarketPriceUnitMetadata` row with accepted VND-scale unit | `unknown_unit` | fail closed, not valid |
| `averageTradingValue20d` | Market/PVT | `MarketPriceUnitMetadata` row with accepted VND-scale unit | `unknown_unit` | fail closed, not valid |

## 7. Read-back Behavior

- Explicit valid sidecar row: build ready metadata.
- Missing sidecar row: return `unknown_unit` for present values and `missing` for null values.
- Invalid stored unit/status/value: fail closed and do not treat as ready.
- Old rows: remain readable and return `unknown_unit` for present values.
- Missing values stay `null`.
- No zero-fill.
- No magnitude guessing.

## 8. Migration Safety Review

Required for a future implementation phase:

- additive only;
- `CREATE TABLE` sidecar plus indexes/unique constraints only;
- no `DROP`;
- no `DELETE`;
- no `UPDATE` of old `MarketPrice` rows;
- no backfill that guesses units;
- no DB reset;
- no DB seed;
- old rows remain compatible;
- relation is optional from the parent row perspective;
- invalid sidecar metadata is fail-closed;
- generated Prisma and DB files must not be committed;
- full validation must pass before commit.

Phase 74 did not create a migration and did not change `schema.prisma`.

## 9. Valuation Impact

- `marketCap`: can be ready only from explicit direct `marketCap` metadata or explicit `marketPrice` plus explicit shares.
- `P/E`: ready only with explicit EPS plus explicit `marketPrice`.
- `BVPS`: depends on explicit Financials equity and shares.
- `P/B`: ready only with explicit BVPS inputs plus explicit `marketPrice`.
- `P/S`: ready only with explicit revenue plus explicit direct or derived `marketCap`.
- `EV`: remains blocked.
- `EV/EBITDA`: remains blocked.
- `DCF`: remains blocked.
- fair value range: remains blocked.
- Financials ownership of `marketPrice` and `marketCap` remains blocked.
- Mixed-source warning remains preserved when Financials runtime and Market/PVT bridge inputs combine.

## 10. Tests Added Or Updated

Added:

- `src/features/technical/lib/market-pvt-unit-metadata-storage-plan.ts`
- `src/features/technical/lib/__tests__/market-pvt-unit-metadata-storage-plan.test.ts`

Test coverage:

- storage option comparison;
- sidecar recommendation for current schema;
- all five Market/PVT fields;
- `productionApproved:false`;
- old-row `unknown_unit` compatibility;
- additive-only migration checklist;
- no DB write/reset/seed;
- no backfill guessing;
- Financials ownership blocked;
- no new metric;
- restricted wording guard.

## 11. Browser Verification

Browser verification was not run.

Reason: Phase 74 is design/helper/docs only. It does not change visible Technical/PVT or Valuation UI behavior.

## 12. Non-goals

- no DB write
- no schema migration implementation
- no `schema.prisma` change
- no DB reset or seed
- no destructive migration
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

## 13. Limitations

- Phase 74 was design only; Phase 75 implements the additive sidecar persistence structure and controlled helper/read path.
- Real market provider integration is still not started.
- No source or data mode is approved by the persistence sidecar.
- Valuation DB-backed claims remain limited by source evidence and mixed ownership boundaries.

## 14. Phase 75 Implementation Record

Implemented:

- `prisma/schema.prisma`
- `prisma/migrations/20260621093000_phase_75_market_pvt_unit_metadata_sidecar/migration.sql`
- `src/features/technical/lib/market-pvt-unit-metadata-persistence-boundary.ts`
- `src/lib/data-sources/market-price-read-service.ts`
- `src/features/technical/lib/build-technical-from-market-price-series.ts`
- focused tests for persistence boundary, read path, builder handoff, migration safety, and Phase 73 compatibility

Read/write behavior:

- valid sidecar metadata produces ready `marketUnitMetadata`;
- missing sidecar metadata produces `unknown_unit`;
- invalid sidecar units produce warnings and fail closed;
- write helper upserts only explicit valid `ready` metadata;
- `productionApproved` remains `false`;
- no import path, provider, parser, or real market fetch is added.

Migration safety:

- additive sidecar table only;
- no `DROP`;
- no `DELETE`;
- no destructive `ALTER`;
- no `UPDATE` of existing `MarketPrice` rows;
- no guessed backfill;
- no DB reset, seed, or `db push` used.

## 15. Recommended Next Phase

After Phase 75, the next phase should verify controlled local DB read-back with a temporary/local test database if needed, while still avoiding real market import and source approval. Any future import wiring must require explicit unit metadata at the controlled boundary and keep invalid or missing units fail-closed.

Legacy Phase 74 recommendation:

- Phase 75 - Additive Market/PVT Unit Metadata Persistence Implementation.

Phase 75 completed:

- add the approved `MarketPriceUnitMetadata` sidecar model and migration;
- keep migration additive-only;
- update controlled local market read-back paths;
- keep old rows backward compatible;
- reject or fail closed on invalid persisted market metadata.

Remaining guardrails:

- Real market provider integration is still not started.
- use synthetic/local data only;
- do not run DB reset or seed;
- do not import real market data or real BCTC;
- do not call Vnstock/API/external providers;
- preserve `productionApproved:false`;
- do not add metrics, target price, fair value range, recommendation, Risk scoring, or source approval.
