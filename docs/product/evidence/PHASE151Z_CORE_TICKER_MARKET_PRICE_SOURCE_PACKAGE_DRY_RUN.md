# Phase 151Z - Core Ticker MarketPrice Source Package Dry Run

## Goal

Prepare dry-run-only reviewed/research `MarketPrice` source packages for the six core tickers:

- `FPT`
- `HPG`
- `VNM`
- `MSN`
- `MWG`
- `VCB`

## Scope

- Dry-run only.
- No DB write.
- No schema change.
- No provider fetch.
- No UI change.
- No Assistant change.
- No Supabase write.
- No `ScreeningCandidate` write.
- No `FinancialStatement` write.
- No `CompanyIndustry` write.
- No ranking, scoring, benchmark, stock attractiveness score, or `IndustryMetric`.
- No static UI/runtime copy as real data.
- No test fixtures as real data.
- No zero-fill for close price, volume, liquidity, or trading value.
- Missing data remains null/N/A/needs_review.
- `productionApproved=true` remains zero.
- HSG/NKG untouched.
- TVN absent.

## Files Changed

- `scripts/dry-run-core-ticker-market-price-source-package.ts`
- `docs/product/evidence/PHASE151Z_CORE_TICKER_MARKET_PRICE_SOURCE_PACKAGE_DRY_RUN.md`

## Sources Inspected

- `prisma/schema.prisma`
- `scripts/smoke-staging-market-price-read-path.ts`
- `scripts/dry-run-staging-market-price-seed.ts`
- `scripts/import-vnstock-market-pvt-controlled.ts`
- `scripts/dry-run-market-price-daily-provider-refresh.ts`
- `scripts/confirm-write-market-price-daily-provider-refresh.ts`
- `src/lib/data-sources/vnstock-market-pvt-controlled-ingestion.ts`
- `docs/product/evidence/PHASE138C_DATA_SOURCE_REPRODUCIBILITY_AUDIT.md`
- `docs/product/evidence/PHASE146F_STAGING_SCHEDULED_REFRESH_PROVIDER_PROFILE_ADJUSTMENT_EVIDENCE.md`

Source decision:

- Existing VNStock/staging scripts require provider fetch or staging context and are not eligible in Phase 151Z.
- Local PostgreSQL has no `MarketPrice` rows for the six target tickers at this point.
- No reviewed/local MarketPrice source package with closePrice, date/period, and source metadata was found.

## Dry-Run Summary

```json
{
  "phase": "151Z",
  "mode": "dry_run",
  "targetTickers": ["FPT", "HPG", "VNM", "MSN", "MWG", "VCB"],
  "marketPriceCandidatesPrepared": 6,
  "eligibleMarketPriceCandidates": 0,
  "blockedMarketPriceCandidates": 6,
  "readyForMarketPriceConfirmWriteByTicker": {
    "FPT": false,
    "HPG": false,
    "VNM": false,
    "MSN": false,
    "MWG": false,
    "VCB": false
  },
  "tickersReadyForMarketPriceConfirmWrite": [],
  "tickersBlocked": ["FPT", "HPG", "VNM", "MSN", "MWG", "VCB"],
  "existingLocalMarketPriceRowsByTicker": {
    "FPT": 0,
    "HPG": 0,
    "VNM": 0,
    "MSN": 0,
    "MWG": 0,
    "VCB": 0
  },
  "dbWriteAttempted": false,
  "schemaChanged": false,
  "providerFetchAttempted": false,
  "uiChanged": false,
  "assistantChanged": false,
  "screeningCandidateWriteAttempted": false,
  "financialStatementWriteAttempted": false,
  "companyIndustryWriteAttempted": false,
  "productionApprovedTrueCount": 0,
  "hsgNkgUntouched": true,
  "tvnPresent": false,
  "rankingCreated": false,
  "stockAttractivenessScoreCreated": false,
  "industryMetricCreated": false,
  "benchmarkCreated": false,
  "forbiddenAdviceDetected": false,
  "smokePassed": true
}
```

## MarketPrice Candidate Table

| Ticker | Eligible | Existing local rows | Blocker |
| --- | --- | ---: | --- |
| FPT | No | 0 | reviewed_market_price_source_package_missing |
| HPG | No | 0 | reviewed_market_price_source_package_missing |
| VNM | No | 0 | reviewed_market_price_source_package_missing |
| MSN | No | 0 | reviewed_market_price_source_package_missing |
| MWG | No | 0 | reviewed_market_price_source_package_missing |
| VCB | No | 0 | reviewed_market_price_source_package_missing |

## Missing Market Price Fields

Each ticker is missing the same required fields:

- `closePrice`
- `priceDate_or_providerPeriod`
- `currency`
- `sourceType`
- `sourceLabel`
- `volume`
- `liquidity`

Missing fields remain null/N/A/needs_review and were not zero-filled.

## Source Decision By Ticker

All six tickers are blocked:

`blocked: no reviewed/local MarketPrice source package with closePrice, priceDate, and source metadata was found without provider fetch.`

## Does This Close The 151U MarketPrice Blocker?

No.

`wouldClose151UMarketPriceBlockerByTicker=false` for all six target tickers. The blocker remains open until reviewed MarketPrice source packages are collected or an explicitly approved provider-snapshot dry-run phase is run.

## Guardrail Confirmation

- DB write: no.
- Schema change: no.
- Provider fetch: no.
- UI change: no.
- Assistant change: no.
- `ScreeningCandidate` write: no.
- `FinancialStatement` write: no.
- `CompanyIndustry` write: no.
- HSG/NKG untouched: yes.
- TVN absent: yes.
- `IndustryMetric` created: no.
- Valuation/risk benchmark created: no.
- Ranking/scoring created: no.
- Forbidden advice wording introduced: no.
- `productionApprovedTrueCount=0`.

## Validation

- `npx eslint scripts/dry-run-core-ticker-market-price-source-package.ts` - passed.
- `npx tsx scripts/dry-run-core-ticker-market-price-source-package.ts` - passed.
- `npx prisma validate` - passed.
- `npx prisma generate` - passed.
- `npm run typecheck` - passed.

## Next Recommended Phase

No ticker is ready for MarketPrice confirm-write yet.

Recommended next step:

- manually collect/review MarketPrice source packages before continuing; or
- run a separate explicitly approved provider-snapshot dry-run phase for the six core tickers if the product accepts research-only provider snapshots with clear caveats.
