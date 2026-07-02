# Phase 152A - Core Ticker MarketPrice Provider Snapshot JSON Dry Run

## Goal

Validate the normalized VNStock provider snapshot JSON for the six core tickers:

- `FPT`
- `HPG`
- `VNM`
- `MSN`
- `MWG`
- `VCB`

The goal is to determine whether these six tickers are ready for a later bounded `MarketPrice` confirm-write.

## Scope

- Dry-run only.
- No DB write.
- No schema change.
- No provider fetch; this phase reads the local reviewed JSON only.
- No UI change.
- No Assistant change.
- No Supabase write.
- No `ScreeningCandidate` write.
- No `FinancialStatement` write.
- No `CompanyIndustry` write.
- No ranking, scoring, benchmark, stock attractiveness score, or `IndustryMetric`.
- No investment recommendation language.
- Missing values remain null/N/A/needs_review.
- `productionApproved=true` remains zero.
- HSG/NKG untouched.
- TVN absent.
- Raw JSON is not committed.

## Files Changed

- `scripts/dry-run-core-ticker-market-price-provider-json.ts`
- `docs/product/evidence/PHASE152A_CORE_TICKER_MARKET_PRICE_PROVIDER_JSON_DRY_RUN.md`

## JSON Path Inspected

`data/manual-review/market-price/core-ticker-vnstock-market-price-snapshot-2026-07-02.json`

The raw JSON is a local manual/provider review input and remains untracked.

## JSON Validation Result

```json
{
  "phase": "152A",
  "mode": "dry_run",
  "jsonFound": true,
  "marketPriceCandidatesPrepared": 6,
  "eligibleMarketPriceCandidates": 6,
  "blockedMarketPriceCandidates": 0,
  "manualJsonAccepted": true,
  "wouldClose151ZMarketPriceBlocker": true,
  "dbWriteAttempted": false,
  "schemaChanged": false,
  "providerFetchAttempted": false,
  "productionApprovedTrueCount": 0,
  "tvnPresent": false,
  "rawJsonCommitted": false,
  "forbiddenAdviceDetected": false,
  "smokePassed": true
}
```

## MarketPrice Candidate Table

| Ticker | Eligible | closePrice | rawClosePrice | priceUnit | priceDate | volume | liquidity |
| --- | --- | ---: | ---: | --- | --- | ---: | ---: |
| FPT | Yes | 72,500 | 72.5 | `vnd_per_share` | 2026-07-02 | 5,690,500 | 412,561,250,000 |
| HPG | Yes | 23,400 | 23.4 | `vnd_per_share` | 2026-07-02 | 13,367,500 | 312,799,500,000 |
| VNM | Yes | 55,500 | 55.5 | `vnd_per_share` | 2026-07-02 | 3,669,400 | 203,651,700,000 |
| MSN | Yes | 72,400 | 72.4 | `vnd_per_share` | 2026-07-02 | 3,050,700 | 220,870,680,000 |
| MWG | Yes | 79,700 | 79.7 | `vnd_per_share` | 2026-07-02 | 4,640,200 | 369,823,940,000 |
| VCB | Yes | 62,100 | 62.1 | `vnd_per_share` | 2026-07-02 | 2,744,500 | 170,433,450,000 |

Normalization checks:

- `rawPriceUnit=thousand_vnd_per_share`.
- `priceScaleFactor=1000`.
- `priceUnit=vnd_per_share`.
- `currency=VND`.
- `volumeUnit=shares`.
- `liquidityUnit=vnd`.
- `fetchStatus=ok`.
- `liquidity=closePrice * volume` passed for all six tickers.

## Eligible Vs Blocked

| Ticker | Ready for MarketPrice confirm-write | Missing fields | Source decision |
| --- | --- | --- | --- |
| FPT | Yes | None | Accepted normalized VNStock provider snapshot with date/period, units, metadata, and caveats. |
| HPG | Yes | None | Accepted normalized VNStock provider snapshot with date/period, units, metadata, and caveats. |
| VNM | Yes | None | Accepted normalized VNStock provider snapshot with date/period, units, metadata, and caveats. |
| MSN | Yes | None | Accepted normalized VNStock provider snapshot with date/period, units, metadata, and caveats. |
| MWG | Yes | None | Accepted normalized VNStock provider snapshot with date/period, units, metadata, and caveats. |
| VCB | Yes | None | Accepted normalized VNStock provider snapshot with date/period, units, metadata, and caveats. |

Required warning codes were present for every row:

- `PROVIDER_SNAPSHOT`
- `NEEDS_REVIEW`
- `RESEARCH_ONLY`
- `MARKET_PRICE_NOT_AUDITED`
- `STALE_SNAPSHOT_CHECK_REQUIRED`
- `RAW_PRICE_UNIT_THOUSAND_VND_PER_SHARE`
- `PRICE_SCALED_TO_VND_PER_SHARE`

## Does This Close The 151Z MarketPrice Blocker?

Yes.

`wouldClose151ZMarketPriceBlocker=true` for the six core tickers. This does not write data; it only means the reviewed provider snapshot JSON is eligible for a later bounded `MarketPrice` confirm-write phase.

## Guardrail Confirmation

- DB write: no.
- Schema change: no.
- Provider fetch: no, JSON read only.
- UI change: no.
- Assistant change: no.
- `ScreeningCandidate` write: no.
- `FinancialStatement` write: no.
- `CompanyIndustry` write: no.
- HSG/NKG untouched: yes.
- TVN absent: yes.
- Raw JSON committed: no.
- `IndustryMetric` created: no.
- Valuation/risk benchmark created: no.
- Ranking/scoring created: no.
- Forbidden advice wording introduced: no.
- `productionApprovedTrueCount=0`.

## Validation

- `npx tsx scripts/dry-run-core-ticker-market-price-provider-json.ts` - passed.
- `npx eslint scripts/dry-run-core-ticker-market-price-provider-json.ts` - passed.
- `npx prisma validate` - passed.
- `npx prisma generate` - passed.
- `npm run typecheck` - passed.

## Next Recommended Phase

All six core tickers are ready for the next bounded write phase:

Phase 152B - Core ticker MarketPrice confirm-write for all six ready provider snapshots.
