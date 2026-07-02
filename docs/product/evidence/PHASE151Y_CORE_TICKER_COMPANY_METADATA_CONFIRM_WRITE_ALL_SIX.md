# Phase 151Y - Core Ticker Company Metadata Confirm-Write All Six

## Goal

Confirm-write `Company` metadata rows for all six ready core tickers:

- `FPT`
- `HPG`
- `VNM`
- `MSN`
- `MWG`
- `VCB`

## Scope

- DB write allowed only to `Company`.
- Default mode remains dry-run.
- Actual write requires `--confirm-write`.
- No schema change.
- No provider fetch.
- No UI change.
- No Assistant change.
- No Supabase write.
- No `ScreeningCandidate` write.
- No `MarketPrice` write.
- No `FinancialStatement` write.
- No `CompanyIndustry` write.
- No ranking, scoring, benchmark, stock attractiveness score, or `IndustryMetric`.
- Missing fields remain null/N/A/needs_review.
- `productionApproved=true` remains zero.
- HSG/NKG untouched.
- TVN absent.
- Raw CSV not committed.

## Files Changed

- `scripts/confirm-write-core-ticker-company-metadata-all-six.ts`
- `scripts/smoke-core-ticker-company-metadata-all-six-read-path.ts`
- `docs/product/evidence/PHASE151Y_CORE_TICKER_COMPANY_METADATA_CONFIRM_WRITE_ALL_SIX.md`

## Company Model Note

The current `Company` model supports `ticker`, `exchange`, `companyName`, `companyType`, `industryCode`, `industryName`, `country`, `currency`, `dataMode`, `profileSourceId`, and `profileAsOf`.

It does not contain dedicated `needsReview`, `productionApproved`, `sourceLabel`, `sourceUrl`, `extractedQuote`, `reviewNote`, or `warningCodes` fields. Phase 151Y therefore writes only schema-supported Company metadata fields and preserves source package provenance in the confirm-write script and this evidence file. No source/caveat data was forced into semantically wrong columns.

## Dry-Run Result

Command:

`npx tsx scripts/confirm-write-core-ticker-company-metadata-all-six.ts`

Summary:

```json
{
  "phase": "151Y",
  "mode": "dry_run",
  "companyRowsPrepared": 6,
  "companyRowsWritten": 0,
  "companyRowsCreated": 0,
  "companyRowsUpdated": 0,
  "readyTickers": ["FPT", "HPG", "VNM", "MSN", "MWG", "VCB"],
  "blockedTickers": [],
  "dbWriteAttempted": false,
  "nonCompanyWritesDetected": false,
  "productionApprovedTrueCount": 0,
  "rawCsvCommitted": false,
  "smokePassed": true
}
```

## Confirm-Write Result

Command:

`npx tsx scripts/confirm-write-core-ticker-company-metadata-all-six.ts --confirm-write`

Summary:

```json
{
  "phase": "151Y",
  "mode": "confirm_write",
  "companyRowsPrepared": 6,
  "companyRowsWritten": 6,
  "companyRowsCreated": 6,
  "companyRowsUpdated": 0,
  "companyRowsSkipped": 0,
  "dbWriteAttempted": true,
  "nonCompanyWritesDetected": false,
  "fptWritten": true,
  "hpgWritten": true,
  "vnmWritten": true,
  "msnWritten": true,
  "mwgWritten": true,
  "vcbWritten": true,
  "hsgNkgUntouched": true,
  "tvnPresent": false,
  "rawCsvCommitted": false,
  "productionApprovedTrueCount": 0,
  "idempotencyPassed": true,
  "smokePassed": true
}
```

Table counts changed only for `Company`:

| Table | Before | After |
| --- | ---: | ---: |
| Company | 0 | 6 |
| ScreeningCandidate | 2 | 2 |
| MarketPrice | 0 | 0 |
| FinancialStatement | 0 | 0 |
| CompanyIndustry | 0 | 0 |

## Idempotency Rerun Result

Command:

`npx tsx scripts/confirm-write-core-ticker-company-metadata-all-six.ts --confirm-write`

Summary:

```json
{
  "companyRowsPrepared": 6,
  "companyRowsWritten": 6,
  "companyRowsCreated": 0,
  "companyRowsUpdated": 0,
  "companyRowsSkipped": 6,
  "idempotencyPassed": true,
  "nonCompanyWritesDetected": false,
  "smokePassed": true
}
```

The rerun created no duplicate rows.

## Read-Path Smoke Result

Command:

`npx tsx scripts/smoke-core-ticker-company-metadata-all-six-read-path.ts`

Summary:

```json
{
  "phase": "151Y",
  "fptCompanyPresent": true,
  "hpgCompanyPresent": true,
  "vnmCompanyPresent": true,
  "msnCompanyPresent": true,
  "mwgCompanyPresent": true,
  "vcbCompanyPresent": true,
  "companyRowsFound": 6,
  "hsgNkgUntouched": true,
  "tvnPresent": false,
  "productionApprovedTrueCount": 0,
  "rawCsvCommitted": false,
  "smokePassed": true
}
```

## Company Rows Written

| Ticker | Company name | Exchange | Company type | Data mode |
| --- | --- | --- | --- | --- |
| FPT | Công ty Cổ phần FPT | HOSE | non_financial | research_only |
| HPG | Công ty Cổ phần Tập đoàn Hòa Phát | HOSE | non_financial | research_only |
| VNM | Công ty Cổ phần Sữa Việt Nam | HOSE | non_financial | research_only |
| MSN | Công ty Cổ phần Tập đoàn Masan | HOSE | non_financial | research_only |
| MWG | Công ty Cổ phần Đầu tư Thế Giới Di Động | null | non_financial | research_only |
| VCB | Ngân hàng TMCP Ngoại thương Việt Nam | null | bank | research_only |

## Source Package Summary

| Ticker | Source package | Caveat |
| --- | --- | --- |
| FPT | manual reviewed Company identity CSV | research_only, needsReview, productionApproved=false |
| HPG | manual reviewed Company identity CSV | research_only, needsReview, productionApproved=false |
| VNM | manual reviewed Company identity CSV | research_only, needsReview, productionApproved=false |
| MSN | annual-report reviewed identity evidence | research_only, needsReview, productionApproved=false |
| MWG | refreshed annual-report manual preview artifact | exchange remains null; research_only, needsReview, productionApproved=false |
| VCB | annual-report bank-specific identity evidence | exchange remains null; bank-specific caveat |

## Guardrail Confirmation

- DB writes: yes, `Company` only.
- Schema change: no.
- Provider fetch: no.
- UI change: no.
- Assistant change: no.
- `ScreeningCandidate` write: no.
- `MarketPrice` write: no.
- `FinancialStatement` write: no.
- `CompanyIndustry` write: no.
- HSG/NKG untouched: yes.
- TVN absent: yes.
- Raw CSV committed: no.
- `IndustryMetric` created: no.
- Valuation/risk benchmark created: no.
- Ranking/scoring created: no.
- Forbidden advice wording introduced: no.
- `productionApprovedTrueCount=0`.

## Validation

- `npx eslint scripts/confirm-write-core-ticker-company-metadata-all-six.ts scripts/smoke-core-ticker-company-metadata-all-six-read-path.ts` - passed.
- `npx tsx scripts/confirm-write-core-ticker-company-metadata-all-six.ts` - passed.
- `npx tsx scripts/confirm-write-core-ticker-company-metadata-all-six.ts --confirm-write` - passed.
- `npx tsx scripts/confirm-write-core-ticker-company-metadata-all-six.ts --confirm-write` - passed; idempotent.
- `npx tsx scripts/smoke-core-ticker-company-metadata-all-six-read-path.ts` - passed.
- `npx prisma validate` - passed.
- `npx prisma generate` - passed.
- `npm run typecheck` - passed.

## Next Recommended Phase

Phase 151Z - Core ticker reviewed MarketPrice source package dry-run.
