# Phase 145E — MarketPrice / Technical Provenance Metadata Schema and Read-Path Design

## 1. Phase Summary
- Phase 145E focuses on metadata schema and read-path design for MarketPrice/Technical data provenance.
- No new provider data was imported.
- No new data was seeded.
- `productionApproved` remains strictly `false`.
- No production deployment is included.

## 2. Current Gap From Phase 145D
- MarketPrice/Technical source remains `vnstock_research_candidate`.
- `dataMode` remains `research_only`.
- `productionApproved` count remains 0.
- There is no explicit `adjustmentStatus` (adjusted/unadjusted).
- There is no explicit `stalenessStatus` to warn users if the end-of-day data is out-of-date.
- Missing complete provider audit fields (e.g., `importRunId`, `rawPayloadChecksum`).

## 3. Schema Decision
- **Option Chosen:** Option B (Add new sidecar model `MarketPriceProvenanceMetadata`)
- **Reason:** Provenance metadata applies to the entire row (e.g., `stalenessStatus`, `adjustmentStatus`, `fetchedAt`, `providerName`). `MarketPriceUnitMetadata` is field-specific (e.g., unit for `marketPrice`, unit for `volume`). Mixing them violates database normalization and creates redundant data.
- **Migration:** Design only / code contract only.
- **Reason migration deferred:** The staging database contains unmigrated drift (tables `IndustryContext` and `MacroContext`) that prevents a clean Prisma migration without resetting the database. Since resetting the database would lose data and we are prohibited from doing so in this phase, the Prisma schema update is designed and the type contract is implemented, but the physical DB migration is deferred.

## 4. Metadata Contract
We introduced `MarketPriceProvenanceMetadataContract` in `src/features/technical/lib/market-price-provenance-contract.ts`:

```typescript
export type ProviderType =
  | "official_exchange"
  | "licensed_vendor"
  | "public_provider"
  | "undocumented_provider"
  | "manual_reviewed"
  | "static_editorial"
  | "unsupported";

export type StalenessStatus =
  | "fresh"
  | "provider_delayed"
  | "stale"
  | "missing"
  | "unsupported"
  | "needs_review";

export type AdjustmentStatus =
  | "adjusted"
  | "unadjusted"
  | "unknown"
  | "not_applicable"
  | "needs_review";

export type DataMode =
  | "research_only"
  | "candidate_provider_data"
  | "production_provider_candidate"
  | "production_approved"
  | "sample_fallback";

export type MarketPriceProvenanceMetadataContract = {
  marketPriceId: string;
  providerName: string;
  providerType: ProviderType;
  exchange: string | null;
  stalenessStatus: StalenessStatus;
  adjustmentStatus: AdjustmentStatus;
  fallbackUsed: boolean;
  needsReview: boolean;
  importRunId: string | null;
  rawPayloadChecksum: string | null;
};
```

## 5. Read-Path Contract
- **Technical/PVT:** Exposes metadata safely via fallback to `needs_review`/`unknown` for adjustment and staleness when DB provenance is unavailable.
- **Valuation inputs:** Re-uses the safety boundaries to label MarketPrice sources correctly.
- **Assistant context:** Passes the safe `dataQuality` and `sourceLabel`.

## 6. Guardrail Checks
- `productionApproved` remains `false` (0 items approved).
- `research_only` remains `research_only`.
- Sample/fallback data is not promoted and correctly marked as `fallbackUsed=true`.
- Missing metadata gracefully defaults to `needs_review`, `unknown`, or `missing`.
- No missing-to-zero conversions occur.

## 7. Validation
- `node scripts/run-staging.mjs npx prisma validate` passed.
- `node scripts/run-staging.mjs npm run typecheck` passed.
- `node scripts/run-staging.mjs npm run lint` passed.
- `node scripts/run-staging.mjs npm run build` passed.
- `npm test is not a clean pass.` Failure classified as local PostgreSQL temp test DB infrastructure issue only (`Invalid db.prisma.dataSource.findFirst()` / `TlsConnectionError`).

## 8. Recommended Next Phase
Phase 145F — MarketPrice / Technical dry-run provider ingestion contract, no write by default.
